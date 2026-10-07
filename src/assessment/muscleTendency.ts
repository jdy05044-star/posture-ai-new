import { computeMuscleSummary } from '@/assessment/muscleSummary'
import type { AssessmentSummary, ObservationArea } from '@/types'

/**
 * 근육 경향을 얼마나 확신 있게 보여줄지 구분하는 신뢰도 등급.
 * 값은 지어내지 않고, 이미 실제로 계산되어 있는 PriorityAreaEntry.confidence
 * (인식된 landmark의 visibility 평균 — assessmentEngine.areaConfidence)만 그대로 사용한다.
 */
export type ConfidenceTier = 'high' | 'moderate' | 'low'

export const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: '인식 명확도 높음',
  moderate: '인식 명확도 보통 (경향으로 참고)',
  low: '인식 명확도 낮음 (참고용, 단정 아님)'
}

function tierOf(confidence: number | null): ConfidenceTier {
  if (confidence == null) return 'low'
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.5) return 'moderate'
  return 'low'
}

export interface AreaMuscleTendency {
  area: ObservationArea
  tier: ConfidenceTier
  confidencePct: number | null
  /** 실제 측정값 기반 근거 문구 (지어내지 않음 — priorityAreas의 실제 reason/measurement를 그대로 사용) */
  reason: string
  tightMuscles: string[]
  weakMuscles: string[]
}

/**
 * "우선 확인 영역"으로 실제로 뽑힌 영역에 한해서만, 그 영역의 참고 근육 목록(computeMuscleSummary)에
 * 실제 측정 신뢰도(confidence)를 등급으로 붙여서 반환한다.
 *
 * 근육을 "이 환자가 약하다"고 단정하지 않는다는 원칙은 그대로 유지하며, 여기서 추가되는 것은
 * "이 관찰이 얼마나 명확한 landmark 인식을 근거로 하는지"에 대한 신뢰도 등급뿐이다 — 등급 자체도
 * 이미 존재하는 실제 confidence 값을 구간으로 나눈 것일 뿐, 새로운 값을 계산해서 지어내지 않는다.
 */
export function computeMuscleTendencies(summary: AssessmentSummary): AreaMuscleTendency[] {
  const muscleSummary = computeMuscleSummary(summary)
  const muscleMap = new Map(muscleSummary.map((m) => [m.area, m]))

  const seen = new Set<ObservationArea>()
  const result: AreaMuscleTendency[] = []

  for (const p of summary.priorityAreas) {
    if (seen.has(p.area)) continue
    seen.add(p.area)
    const m = muscleMap.get(p.area)
    if (!m || (m.tightMuscles.length === 0 && m.weakMuscles.length === 0)) continue
    result.push({
      area: p.area,
      tier: tierOf(p.confidence),
      confidencePct: p.confidence != null ? Math.round(p.confidence * 100) : null,
      reason: `${p.basedOnMeasurement}${p.valueDeg != null ? ` ${p.valueDeg}°` : ''} · ${p.reason}`,
      tightMuscles: m.tightMuscles,
      weakMuscles: m.weakMuscles
    })
  }

  return result
}
