import { EXERCISE_LIBRARY } from '@/exercises/exerciseLibrary'
import type { Exercise, ObservationArea } from '@/types'

export interface TodayPick {
  exercise: Exercise
  /** 이 운동을 고른 이유가 된 우선 확인 부위. 일반 보충 운동이면 null */
  area: ObservationArea | null
}

/**
 * "오늘의 추천 운동 3개".
 *  - 우선 확인 부위마다 PT 승인 라이브러리 운동 → 앱 기본 운동(본운동) 순으로 번갈아 하나씩 고른다 (한 부위에 몰리지 않게).
 *  - 3개가 안 채워지면 특정 부위와 무관한 일반 자세 개선 운동(conditionTags에 'general'만 있는 것)으로 채운다.
 *  - 측정값과 운동 효과를 연결하지 않는다: 부위가 같다는 사실만 쓴다.
 */
export function pickTodayExercises(priorityAreas: ObservationArea[], count = 3, approvedExtras: Exercise[] = []): TodayPick[] {
  const areas = Array.from(new Set(priorityAreas))
  const queues = areas.map((area) => ({
    area,
    // PT가 승인한 라이브러리 운동을 먼저, 그다음 앱 기본 운동 순서
    list: [...approvedExtras, ...EXERCISE_LIBRARY].filter((e) => e.category === 'main' && e.targetAreas.includes(area))
  }))

  const picks: TodayPick[] = []
  const used = new Set<string>()
  let progressed = true
  while (picks.length < count && progressed) {
    progressed = false
    for (const q of queues) {
      if (picks.length >= count) break
      const next = q.list.find((e) => !used.has(e.id))
      if (next) {
        used.add(next.id)
        picks.push({ exercise: next, area: q.area })
        progressed = true
      }
    }
  }

  if (picks.length < count) {
    const general = EXERCISE_LIBRARY.filter(
      (e) => e.category === 'main' && !used.has(e.id) && e.conditionTags.every((t) => t === 'general')
    )
    for (const e of general) {
      if (picks.length >= count) break
      picks.push({ exercise: e, area: null })
    }
  }
  return picks
}
