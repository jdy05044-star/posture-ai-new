import type { AssessmentSummary } from '@/types'

/**
 * 반복 촬영으로 구하는 이 앱의 측정 오차.
 * 같은 사람을 같은 조건에서 여러 번 다시 찍어, 항목마다 값이 얼마나 흔들리는지 계산한다.
 * 임의의 "정상 범위"나 기준값을 만들지 않고, PT의 데이터에서 나온 값만 쓴다.
 */

export interface RepeatShot {
  id: string
  savedAt: string
  /** 항목 id → 부호 있는 각도(°)와 표시용 이름 */
  values: Record<string, { label: string; value: number }>
}

export interface RepeatSeries {
  id: string
  /** 화면에 보이는 이름 (예: "시리즈 1") */
  name: string
  /** 촬영 조건 메모 (선택, 개인정보 금지) */
  memo: string
  createdAt: string
  shots: RepeatShot[]
}

/**
 * 측정값을 부호 있는 숫자로 바꾼다. 좌우·전후처럼 방향이 있는 항목은 방향에 따라 +/−를 붙여,
 * 같은 사람에서 방향이 뒤집히면 "크게 흔들린 것"으로 계산되게 한다.
 *  + : 우측이 더 낮음 / 골반이 앞으로 기운 경향   − : 좌측이 더 낮음 / 뒤로 기운 경향   그 외: 크기만 (+)
 */
export function signedValue(valueDeg: number, direction: string | null): number {
  const d = direction ?? ''
  if (d.includes('더 낮음')) {
    if (d.includes('우측')) return valueDeg
    if (d.includes('좌측')) return -valueDeg
  }
  if (d.includes('앞으로 기운')) return valueDeg
  if (d.includes('뒤로 기운')) return -valueDeg
  return valueDeg
}

/** 현재 평가 결과에서 각도 값이 있는 항목만 한 번의 촬영 기록으로 만든다 (값이 없는 항목은 넣지 않는다). */
export function snapshotFromSummary(summary: AssessmentSummary, id: string, savedAt: string): RepeatShot {
  const values: RepeatShot['values'] = {}
  for (const area of summary.areaResults) {
    for (const m of area.measurements) {
      if (m.valueDeg === null) continue
      values[m.id] = { label: m.label, value: signedValue(m.valueDeg, m.direction) }
    }
  }
  return { id, savedAt, values }
}

export interface NoiseRow {
  id: string
  label: string
  /** 이 항목이 측정된 전체 촬영 횟수 */
  shots: number
  /** 이 항목에 쓰인 시리즈 수 (촬영 2회 이상인 시리즈만) */
  seriesCount: number
  /** 합동 자유도 = Σ(시리즈별 촬영 횟수 − 1) */
  df: number
  /** 시리즈 내 반복 측정의 합동 표준편차 (°) */
  sd: number
  /** 시리즈별 (최대−최소)의 평균 (°) */
  meanRange: number
  /**
   * 최소 검출 변화량(MDC95) = 1.96 × √2 × SD.
   * 같은 조건에서 한 번씩 잰 두 값의 차이가 이보다 작으면 측정 오차와 구분하기 어렵다는 일반 통계 공식이다.
   */
  mdc95: number
  /** 앱이 이 값을 판단 기준으로 쓸 수 있을 만큼 촬영이 쌓였는지 */
  reliable: boolean
}

/** 앱이 오차 값을 기준으로 쓰기 시작하는 최소 합동 자유도. 이보다 적으면 보여주기만 한다. */
export const MIN_DF_FOR_USE = 5

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

export function computeNoise(series: RepeatSeries[]): NoiseRow[] {
  const byId = new Map<string, { label: string; perSeries: number[][]; shots: number }>()
  for (const s of series) {
    const ids = new Set(s.shots.flatMap((sh) => Object.keys(sh.values)))
    for (const id of ids) {
      const vals = s.shots.filter((sh) => id in sh.values).map((sh) => sh.values[id].value)
      if (vals.length === 0) continue
      const label = s.shots.find((sh) => id in sh.values)!.values[id].label
      const entry = byId.get(id) ?? { label, perSeries: [], shots: 0 }
      entry.perSeries.push(vals)
      entry.shots += vals.length
      byId.set(id, entry)
    }
  }

  const rows: NoiseRow[] = []
  for (const [id, { label, perSeries, shots }] of byId) {
    const usable = perSeries.filter((v) => v.length >= 2)
    if (usable.length === 0) continue
    let ss = 0
    let df = 0
    let rangeSum = 0
    for (const v of usable) {
      const mean = v.reduce((a, b) => a + b, 0) / v.length
      ss += v.reduce((a, b) => a + (b - mean) ** 2, 0)
      df += v.length - 1
      rangeSum += Math.max(...v) - Math.min(...v)
    }
    const sd = Math.sqrt(ss / df)
    rows.push({
      id,
      label,
      shots,
      seriesCount: usable.length,
      df,
      sd: round2(sd),
      meanRange: round1(rangeSum / usable.length),
      mdc95: round1(1.96 * Math.SQRT2 * sd),
      reliable: df >= MIN_DF_FOR_USE
    })
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label, 'ko'))
}

/** 판단 기준으로 쓸 수 있는(촬영이 충분히 쌓인) 항목의 MDC95만 id → 값으로 돌려준다. */
export function noiseFloorMap(rows: NoiseRow[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) if (r.reliable) out[r.id] = r.mdc95
  return out
}
