import { isLibraryExercise, LIBRARY_ID_PREFIX } from './unified'
import type { Exercise } from '@/types'

/**
 * 실제 운동 동작을 보여주는 AI 생성 참고 이미지가 있는 운동만 연결한다.
 * 동작과 무관한 범용 그림(막대 인형 등)은 오해를 부르므로 쓰지 않고, 이미지가 없으면 "이미지 준비 중"으로 둔다.
 * 이미지만 있다고 운동 내용이 검수된 것은 아니다. PT 확인이 필요하다.
 */
const LIBRARY_DEMO = new Set(['ex005', 'ex007', 'ex041', 'ex060', 'ex068', 'ex069'])
const BASE_DEMO = new Set([
  'main-birddog',
  'main-bridge',
  'main-clamshell',
  'main-scapularretraction',
  'warmup-necktuck'
])

export function exerciseVisualPath(exercise: Pick<Exercise, 'id'>): string | null {
  if (isLibraryExercise(exercise)) {
    const id = exercise.id.slice(LIBRARY_ID_PREFIX.length).toLowerCase()
    return LIBRARY_DEMO.has(id) ? `/images/exercises/${id}.webp` : null
  }
  return BASE_DEMO.has(exercise.id) ? `/images/exercises/base/${exercise.id}.webp` : null
}
