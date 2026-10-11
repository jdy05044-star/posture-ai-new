import { isLibraryExercise, LIBRARY_ID_PREFIX } from './unified'
import type { Exercise } from '@/types'

/** 외부 URL이 아닌 배포 패키지에 실제로 포함된 참고 도식 이미지 경로. */
export function exerciseVisualPath(exercise: Pick<Exercise, 'id'>): string {
  return isLibraryExercise(exercise)
    ? `/images/exercises/${exercise.id.slice(LIBRARY_ID_PREFIX.length).toLowerCase()}.webp`
    : `/images/exercises/base/${exercise.id}.webp`
}
