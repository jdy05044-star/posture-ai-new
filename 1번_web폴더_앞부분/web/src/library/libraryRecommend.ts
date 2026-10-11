import { LIBRARY_EXERCISES, BODY_PARTS_PENDING_COLLECTION } from './libraryData'
import { effectiveStatus } from './libraryFilters'
import type { ApprovalStatus, ExerciseOverlay, LibraryExercise } from './types'

/**
 * 결과 화면의 평가 영역 → 라이브러리의 bodyPart.
 * 이름이 같은 부위만 연결한다. '전신' 운동은 특정 부위와 맞는지 알 수 없으므로 자동으로 끌어오지 않는다.
 */
export function libraryBodyPartForArea(area: string): string | null {
  const parts = new Set(LIBRARY_EXERCISES.map((e) => e.bodyPart))
  return parts.has(area) ? area : null
}

export interface LibrarySuggestion {
  exercise: LibraryExercise
  status: ApprovalStatus
}

export interface LibrarySuggestionResult {
  items: LibrarySuggestion[]
  /** 이 부위에서 라이브러리가 가진 전체 운동 수 */
  total: number
  /** 이 부위가 "별도 수집 예정"인지 (운동을 지어내지 않고 안내만 한다) */
  pendingCollection: boolean
}

/**
 * 부위별 참고용 자동 추천.
 *  - PT 승인 운동을 먼저, 그다음 "PT 검수 필요" 운동을 원본 자료 순서대로 보여준다.
 *  - 측정값과 운동의 효과를 연결하지 않는다: 부위가 같다는 사실만 사용한다.
 *  - 상태는 항상 함께 돌려주므로 화면에서 "참고용/승인"을 반드시 표시할 수 있다.
 */
export function suggestLibraryExercises(
  area: string,
  overlays: Record<string, ExerciseOverlay>,
  limit = 3
): LibrarySuggestionResult {
  const pendingCollection = (BODY_PARTS_PENDING_COLLECTION as readonly string[]).includes(area)
  const part = libraryBodyPartForArea(area)
  if (!part) return { items: [], total: 0, pendingCollection }

  const all = LIBRARY_EXERCISES.filter((e) => e.bodyPart === part).map((exercise) => ({
    exercise,
    status: effectiveStatus(exercise, overlays[exercise.id])
  }))
  const approved = all.filter((s) => s.status === 'PT 승인')
  const rest = all.filter((s) => s.status !== 'PT 승인')
  return { items: [...approved, ...rest].slice(0, limit), total: all.length, pendingCollection }
}
