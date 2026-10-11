import { isLibraryExercise, LIBRARY_ID_PREFIX } from './unified'
import type { Exercise } from '@/types'

/**
 * 운동 라이브러리 93개는 동작 사진(ex###.webp)과 근육 사진(anatomy/ex###-target.webp)이 모두 있다(AI 생성 참고 이미지).
 * 앱 기본 운동은 일부만 있으며, 동작과 무관한 범용 그림은 쓰지 않고 이미지가 없으면 "이미지 준비 중"으로 둔다.
 * 이미지만 있다고 운동 내용이 검수된 것은 아니다. PT 확인이 필요하다.
 */
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
    return `/images/exercises/${id}.webp`
  }
  return BASE_DEMO.has(exercise.id) ? `/images/exercises/base/${exercise.id}.webp` : null
}
