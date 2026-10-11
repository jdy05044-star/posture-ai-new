import type { AssessmentDomain, MuscleHypothesis, Side } from './types'

/**
 * PT가 직접 입력하는 근육 검사 결과와, 그 결과로 근육 평가 후보의 상태가 바뀌는 규칙.
 * 설계 문서(근육 상태 전이)를 그대로 따른다:
 *  - 자세 사진만으로는 후보(노랑)까지만 간다. 빨강/파랑은 PT의 검사 결과가 있어야 한다.
 *  - 검사 결과가 후보와 같은 근육·같은 쪽·맞는 검사 영역일 때만 상태가 바뀐다.
 *  - 지지(supports)와 반박(contradicts)이 함께 있으면 상태를 바꾸지 않고 "재평가 필요"로 둔다.
 *  - 반박만 있으면 그 쪽 후보는 dismissed(후보에서 제외). 같은 영역의 다른 후보는 그대로 둔다.
 *  - 불확실·자가보고는 기록만 하고 상태를 바꾸지 않는다.
 */

export type AssessmentOutcome = 'supports' | 'contradicts' | 'inconclusive'
export type PerformedBy = 'professional' | 'self_report'

export interface MuscleAssessment {
  id: string
  /** 근육 그룹 id (anatomy/catalog의 MUSCLE_GROUPS 키) */
  groupId: string
  side: Side
  domain: AssessmentDomain
  outcome: AssessmentOutcome
  performedBy: PerformedBy
  /** 검사 방법·프로토콜 (선택, 자유 입력) */
  protocol: string
  notes: string
  recordedAt: string
}

export type MuscleState = 'assessment_candidate' | 'tightness_suspected' | 'weakness_suspected' | 'dismissed'

export interface SideResolution {
  side: Side
  state: MuscleState
  /** 지지와 반박이 함께 있어 재평가가 필요한 경우 */
  conflict: boolean
  /** 이 쪽 판정에 쓰인(상태를 바꾸는) 검사 영역의 기록 수 */
  matched: number
}

export const OUTCOME_LABEL: Record<AssessmentOutcome, string> = {
  supports: '확인됨 (후보를 지지)',
  contradicts: '후보와 맞지 않음 (반박)',
  inconclusive: '판단 불가'
}

export const STATE_LABEL: Record<MuscleState, string> = {
  assessment_candidate: '평가 후보',
  tightness_suspected: '긴장 의심 (PT 검사 지지)',
  weakness_suspected: '약화 의심 (PT 검사 지지)',
  dismissed: '검사로 반박됨'
}

/**
 * 후보의 목표(proposed target)에 대해 상태를 바꿀 수 있는 검사 영역.
 *  - tightness(긴장·길이 평가) → 근긴장·길이 검사(tone_length)
 *  - function(기능 평가)       → 근력·지구력 검사(strength_endurance)만. 움직임 조절·가동범위 검사는
 *    기록은 되지만 약화로 바꾸지 않는다 (설계 문서: 조절 저하만으로 weakness로 바꾸지 않음).
 */
export function promotingDomain(target: MuscleHypothesis['target']): AssessmentDomain {
  return target === 'tightness' ? 'tone_length' : 'strength_endurance'
}

export function resolveSide(h: MuscleHypothesis, side: Side, assessments: MuscleAssessment[]): SideResolution {
  const domain = promotingDomain(h.target)
  const matches = assessments.filter(
    (a) => a.groupId === h.groupId && a.side === side && a.domain === domain && a.performedBy === 'professional'
  )
  const supports = matches.some((a) => a.outcome === 'supports')
  const contradicts = matches.some((a) => a.outcome === 'contradicts')
  const base = { side, matched: matches.length }
  if (supports && contradicts) return { ...base, state: 'assessment_candidate', conflict: true }
  if (contradicts) return { ...base, state: 'dismissed', conflict: false }
  if (supports) {
    return { ...base, state: h.target === 'tightness' ? 'tightness_suspected' : 'weakness_suspected', conflict: false }
  }
  return { ...base, state: 'assessment_candidate', conflict: false }
}

export interface ResolvedHypothesis {
  h: MuscleHypothesis
  sides: SideResolution[]
}

export function resolveHypotheses(hypotheses: MuscleHypothesis[], assessments: MuscleAssessment[]): ResolvedHypothesis[] {
  return hypotheses.map((h) => ({ h, sides: h.sides.map((s) => resolveSide(h, s, assessments)) }))
}

/** 같은 그룹·같은 쪽에 가설이 여럿이면, 상태를 바꾼 것(빨강/파랑) > 후보 > (반박은 칠하지 않음) 순으로 칠한다. */
export function paintPriority(state: MuscleState): number {
  return state === 'tightness_suspected' || state === 'weakness_suspected' ? 2 : state === 'assessment_candidate' ? 1 : 0
}
