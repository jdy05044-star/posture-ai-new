/**
 * 해부학 모델(Skeleton/Muscle) 화면용 타입.
 * 원칙: 모델은 항상 중립 자세이고, 측정 결과는 기준점 주변 오버레이로만 표시한다.
 * 근육은 "평가 후보"까지만 만든다 — 긴장/약화(빨강/파랑)는 PT의 기능검사 입력이 연결되기 전에는 만들지 않는다.
 */

export type AtlasView = 'front' | 'back' | 'right' | 'left'
export type Side = 'left' | 'right'

/** 모델에서 우측면만 제공한다. 좌측면 자산은 아직 없다 (화면 반전 금지). */
export const ATLAS_VIEWS_AVAILABLE: AtlasView[] = ['front', 'back', 'right']

export type AssessmentDomain = 'tone_length' | 'strength_endurance' | 'movement_control' | 'range_of_motion'
export type ProposedTarget = 'tightness' | 'function'

export type FindingOverlay =
  /** 좌우 한 쌍(어깨/고관절 추정점)의 상대 높이. higherSide는 대상자 기준 더 높은 쪽. */
  | { kind: 'height-pair'; region: 'shoulder' | 'hip' | 'asis'; higherSide: Side; angleDeg: number }
  /** 모델 기준점 두 개를 잇는 선 + 라벨 (귀-어깨, ASIS-PSIS) */
  | { kind: 'pair-line'; from: string; to: string; label: string }
  /** 모델 기준점 하나에 표시 */
  | { kind: 'marker'; anchor: string; label: string }
  | { kind: 'none' }

export interface AnatomyFinding {
  /** 앱 측정값 id 그대로 (예: shoulder-tilt-back) */
  id: string
  view: AtlasView
  label: string
  area: string
  /** 화면에 보여줄 측정값 문구 (실제 측정값에서만 만든다) */
  valueText: string
  direction: string | null
  confidence: number | null
  overlay: FindingOverlay
  /** 선택 시 골격 모델에서 강조할 뼈 영역 id */
  highlightBones: string[]
  /** 이 관찰만으로는 근육 후보를 만들 수 없거나 별도 입력이 필요한 이유 등의 안내 */
  note: string | null
}

export interface MuscleHypothesis {
  id: string
  ruleId: string
  /** 근육 그룹 id (catalog 참고) */
  groupId: string
  sides: Side[]
  target: ProposedTarget
  domains: AssessmentDomain[]
  findingId: string
  /** 자세 사진만으로 발동한 규칙은 항상 평가 후보다. */
  state: 'assessment_candidate'
}

export interface HeldRule {
  findingId: string
  ruleId: string
  reason: 'camera-level-unconfirmed' | 'low-clarity' | 'side-ambiguous'
}

export interface AnatomyModel {
  findings: AnatomyFinding[]
  hypotheses: MuscleHypothesis[]
  held: HeldRule[]
}
