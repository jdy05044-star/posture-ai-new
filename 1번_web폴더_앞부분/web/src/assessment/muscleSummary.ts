import { AREA_EDUCATION } from '@/data/postureEducation'
import type { AssessmentSummary, ObservationArea } from '@/types'

export interface AreaMuscleSummary {
  area: ObservationArea
  tightMuscles: string[]
  weakMuscles: string[]
}

/**
 * 실제로 편차가 관찰된 영역(우선 확인 영역으로 뽑힌 영역)에 한해서만, 그 영역에 등록된
 * 참고 패턴들(postureEducation.ts)의 긴장/약화 근육 목록을 모아 보여준다.
 *
 * 주의: 어떤 패턴이 정확히 해당하는지까지 자동으로 단정하지는 않는다 (그 영역에서 편차가
 * 관찰되었다는 사실만 근거로 삼고, 그 영역에서 흔히 함께 언급되는 근육들을 참고로 모아 보여주는
 * 수준이다). 그래서 area 단위로만 집계하고, 개별 근육을 "이 환자가 이 근육이 약하다"처럼
 * 단정하는 문구는 쓰지 않는다 — 화면에서도 항상 "참고" 표현과 함께 노출해야 한다.
 */
export function computeMuscleSummary(summary: AssessmentSummary): AreaMuscleSummary[] {
  const observedAreas = Array.from(new Set(summary.priorityAreas.map((p) => p.area)))

  return observedAreas.map((area) => {
    const edu = AREA_EDUCATION[area]
    const tight = new Set<string>()
    const weak = new Set<string>()
    for (const pattern of edu.commonPatterns) {
      pattern.tightMuscles?.forEach((m) => tight.add(m))
      pattern.weakMuscles?.forEach((m) => weak.add(m))
    }
    return { area, tightMuscles: Array.from(tight), weakMuscles: Array.from(weak) }
  })
}
