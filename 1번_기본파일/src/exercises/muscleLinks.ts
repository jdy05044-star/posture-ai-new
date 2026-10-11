import { LIBRARY_EXERCISES } from '@/library/libraryData'
import { effectiveStatus } from '@/library/libraryFilters'
import type { ApprovalStatus, ExerciseOverlay, LibraryExercise } from '@/library/types'

/**
 * 근육 평가 후보(그룹) → 운동 라이브러리의 "대상 근육" 표기.
 * 라이브러리 원본의 targetMuscles 문자열과 글자가 정확히 같은 것만 연결한다 (부분 일치 금지:
 * "승모근"이 "하부승모근"을 끌어오지 않도록). 원본에 표기가 없는 근육은 연결하지 않고 "연결 없음"으로 둔다.
 * 이 연결은 "원본 자료가 그 근육을 대상으로 적었다"는 뜻일 뿐, 효과를 보장하거나 처방을 대신하지 않는다.
 */
export const GROUP_TARGET_TERMS: Record<string, string[]> = {
  upper_trapezius: ['승모근'], // 원본이 상·중·하부를 나누지 않고 "승모근"으로 적은 경우
  levator_scapulae: [],
  deep_neck_flexors: ['목 굴곡 조절'],
  suboccipitals: [],
  iliopsoas: ['장요근'],
  rectus_femoris: ['대퇴직근'],
  gluteus_maximus: ['대둔근', '둔근'], // "둔근"은 원본의 일반 표기
  abdominals: ['복근', '복직근', '복사근', '복부 안정화 근육'],
  hamstrings: ['햄스트링'],
  hip_abductors: ['중둔근', '소둔근'],
  pelvic_muscles: ['중둔근', '요방형근', '골반 주변']
}

export interface MuscleLinkedExercise {
  exercise: LibraryExercise
  status: ApprovalStatus
  /** 이 운동이 연결된 이유가 된 원본 표기 */
  matchedTerms: string[]
}

export interface MuscleLinkResult {
  items: MuscleLinkedExercise[]
  total: number
  approvedCount: number
  /** 이 근육에 대해 라이브러리 표기 매핑이 정의돼 있는지 (없으면 연결할 수 없다) */
  hasTerms: boolean
}

export function linkedLibraryExercises(
  groupId: string,
  overlays: Record<string, ExerciseOverlay>,
  limit = 3
): MuscleLinkResult {
  const terms = GROUP_TARGET_TERMS[groupId] ?? []
  if (terms.length === 0) return { items: [], total: 0, approvedCount: 0, hasTerms: false }
  const all = LIBRARY_EXERCISES.map((exercise) => ({
    exercise,
    status: effectiveStatus(exercise, overlays[exercise.id]),
    matchedTerms: exercise.targetMuscles.filter((m) => terms.includes(m))
  })).filter((x) => x.matchedTerms.length > 0)
  const approved = all.filter((x) => x.status === 'PT 승인')
  const rest = all.filter((x) => x.status !== 'PT 승인')
  return { items: [...approved, ...rest].slice(0, limit), total: all.length, approvedCount: approved.length, hasTerms: true }
}
