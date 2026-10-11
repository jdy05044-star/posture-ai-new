import { useMemo } from 'react'
import { usePersistentRecord } from '@/library/libraryStorage'
import { computeNoise, noiseFloorMap, type RepeatSeries } from './repeatStats'

/** 반복 촬영 데이터는 대상자가 아니라 "이 앱·이 촬영 조건"의 보정 자료이므로, 새로 시작해도 지우지 않는다. */
export const REPEAT_SERIES_KEY = 'posture-pt-ai:repeat-series:v1'

export function useRepeatSeries() {
  const store = usePersistentRecord<RepeatSeries>(REPEAT_SERIES_KEY)
  const series = useMemo(
    () => (Object.values(store.data) as RepeatSeries[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [store.data]
  )
  return { series, update: store.update, saveFailed: store.saveFailed }
}

export function useNoiseFloors() {
  const { series } = useRepeatSeries()
  return useMemo(() => {
    const rows = computeNoise(series)
    return { rows, floors: noiseFloorMap(rows) }
  }, [series])
}
