import { LIBRARY_EXERCISES } from '@/library/libraryData'
import { effectiveStatus } from '@/library/libraryFilters'
import type { ExerciseOverlay, LibraryExercise } from '@/library/types'
import type { Exercise, ObservationArea } from '@/types'

/**
 * 운동 두 곳(앱 기본 운동 33개 · 운동 라이브러리 93개)을 하나의 흐름으로 잇는다.
 *  - 라이브러리 운동은 PT가 "승인"한 것만 프로그램 생성·내보내기에 들어간다.
 *  - 라이브러리 원본에는 워밍업/본운동/쿨다운 구분이 없다. 구분을 지어내지 않고 본운동(main)으로만 넣는다.
 *  - 세트·횟수·시간은 PT가 라이브러리 화면에서 직접 입력한 값만 쓴다 (원본의 반복 수는 개인 처방 값이 아님).
 */
const OBSERVATION_AREAS: ObservationArea[] = ['어깨', '골반', '허리/몸통', '머리/목', '무릎', '발']

export const LIBRARY_ID_PREFIX = 'lib:'

export function isLibraryExercise(e: { id: string }): boolean {
  return e.id.startsWith(LIBRARY_ID_PREFIX)
}

export function libraryToExercise(lib: LibraryExercise, overlay?: ExerciseOverlay): Exercise {
  const area = OBSERVATION_AREAS.find((a) => a === lib.bodyPart)
  return {
    id: `${LIBRARY_ID_PREFIX}${lib.id}`,
    name: lib.name,
    category: 'main',
    purpose: lib.goals,
    sets: overlay?.sets ?? undefined,
    repetitions: overlay?.reps ?? undefined,
    duration: overlay?.holdSeconds ? `${overlay.holdSeconds}초` : undefined,
    precautions: lib.cautions || undefined,
    source: '운동 라이브러리 (PT 승인)',
    executionSteps: lib.steps.length > 0 ? lib.steps : undefined,
    targetAreas: area ? [area] : [],
    targetMuscles: lib.targetMuscles,
    conditionTags: []
  }
}

/** PT가 승인한 라이브러리 운동을 프로그램 후보 풀에 넣을 수 있는 형태로 돌려준다. */
export function approvedLibraryExercises(overlays: Record<string, ExerciseOverlay>): Exercise[] {
  return LIBRARY_EXERCISES.filter((e) => effectiveStatus(e, overlays[e.id]) === 'PT 승인').map((e) =>
    libraryToExercise(e, overlays[e.id])
  )
}
