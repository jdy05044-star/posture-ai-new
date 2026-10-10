import { AREA_EDUCATION } from '@/data/postureEducation'
import { measurementSeverity } from '@/assessment/assessmentEngine'
import type { AngleMeasurement, AreaAssessmentResult, AssessmentSummary, ObservationArea } from '@/types'

/** 리포트 리스트에 표시하는 부위 순서 (데이터 키 기준) */
export const REPORT_AREA_ORDER: ObservationArea[] = ['머리/목', '어깨', '허리/몸통', '골반', '무릎', '발']

/** 화면 표시용 이름. 데이터 키('허리/몸통')는 그대로 두고 표시만 바꾼다. */
export const AREA_DISPLAY_LABEL: Record<ObservationArea, string> = {
  '머리/목': '머리/목',
  어깨: '어깨',
  '허리/몸통': '척추/허리/몸통',
  골반: '골반',
  무릎: '무릎',
  발: '발'
}

/** /public/images/anatomy/ 아래 해부도 파일명 (확장자 제외). 확장자는 AnatomyImage가 png → webp → jpg 순으로 시도한다. */
export const ANATOMY_FILE: Record<ObservationArea, string> = {
  '머리/목': 'muscle-head-neck',
  어깨: 'muscle-shoulder',
  '허리/몸통': 'muscle-torso',
  골반: 'muscle-pelvis',
  무릎: 'muscle-knee',
  발: 'muscle-foot'
}

/**
 * 불균형 막대의 가득 찬 길이에 해당하는 각도(°).
 * 의학적 "정상/이상" 기준이 아니라, 서로 다른 부위의 각도 편차를 한 화면에서 비교하기 쉽게 하려는
 * 시각화용 눈금이다. 이 값을 넘는 편차는 막대가 가득 찬 채로 표시되고 숫자는 그대로 보여준다.
 */
export const BAR_FULL_SCALE_DEG = 15

export interface AreaReportRowData {
  area: ObservationArea
  label: string
  result: AreaAssessmentResult
  /** landmark/각도 측정값이 하나라도 있는지. false면 리스트에서 "측정 불확실"로만 표시한다. */
  hasData: boolean
  /** 대표 문제명 = 가장 편차가 큰 각도 측정 항목의 이름 (없으면 방향 정보가 있는 첫 항목) */
  problemName: string | null
  /** 대표 항목의 방향 설명 (실제 측정에서 나온 문구 그대로) */
  direction: string | null
  /** 대표 각도 편차(°). 각도 측정값이 없으면 null — 임의로 채우지 않는다. */
  severityDeg: number | null
  /** 막대 길이 0~1. severityDeg가 없으면 null(막대를 그리지 않는다). */
  barRatio: number | null
  /** 이 부위에서 무엇을 보는지에 대한 일반 설명 (측정 결과가 아니라 고정 안내문) */
  description: string
  confidence: number | null
  /** 측정 불확실로 남은 항목 수 */
  unmeasuredCount: number
}

function pickRepresentative(measurements: AngleMeasurement[]): AngleMeasurement | null {
  let best: AngleMeasurement | null = null
  let bestSeverity = -1
  for (const m of measurements) {
    const s = measurementSeverity(m)
    if (s !== null && s > bestSeverity) {
      best = m
      bestSeverity = s
    }
  }
  if (best) return best
  return measurements.find((m) => m.direction !== null) ?? null
}

export function buildAreaReportRows(summary: AssessmentSummary): AreaReportRowData[] {
  return REPORT_AREA_ORDER.map((area) => {
    const result =
      summary.areaResults.find((r) => r.area === area) ??
      ({ area, measurements: [], observation: '', confidence: null } as AreaAssessmentResult)
    const hasData = result.measurements.some((m) => m.valueDeg !== null || m.direction !== null)
    const rep = hasData ? pickRepresentative(result.measurements) : null
    const severityDeg = rep ? measurementSeverity(rep) : null
    const rounded = severityDeg !== null ? Math.round(severityDeg * 10) / 10 : null
    return {
      area,
      label: AREA_DISPLAY_LABEL[area],
      result,
      hasData,
      problemName: rep?.label ?? null,
      direction: rep?.direction ?? null,
      severityDeg: rounded,
      barRatio: rounded !== null ? Math.min(1, rounded / BAR_FULL_SCALE_DEG) : null,
      description: AREA_EDUCATION[area].whatWeObserve,
      confidence: result.confidence,
      unmeasuredCount: result.measurements.filter((m) => m.valueDeg === null && m.direction === null).length
    }
  })
}

/** 핵심 문제 한 줄에 쓰는 값 문구 (무릎 굽힘/폄은 완전 신전 180° 대비 차이로 표시) */
export function priorityValueText(basedOnMeasurement: string, valueDeg: number | null): string | null {
  if (valueDeg === null) return null
  if (basedOnMeasurement.startsWith('무릎 굽힘/폄 각도')) {
    return `완전 신전(180°) 대비 ${Math.round(Math.abs(valueDeg - 180) * 10) / 10}°`
  }
  return `${valueDeg}°`
}
