import { useCallback, useEffect, useRef, useState } from 'react'

export const OVERLAY_KEY = 'posture-pt-ai:library-overlay:v1'
export const TEST_RECORDS_KEY = 'posture-pt-ai:test-records:v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * localStorage에 저장되는 단순한 id→값 레코드 상태. 이 브라우저에만 저장되며(서버 전송 없음),
 * 저장 공간 접근이 막힌 환경에서는 화면 상태로만 유지되고 saveFailed가 true가 된다.
 */
export function usePersistentRecord<T>(key: string) {
  const [data, setData] = useState<Record<string, T>>({})
  const [saveFailed, setSaveFailed] = useState(false)
  const ref = useRef<Record<string, T>>({})

  useEffect(() => {
    const stored = read<Record<string, T>>(key, {})
    ref.current = stored
    setData(stored)
  }, [key])

  const update = useCallback(
    (id: string, next: T | null) => {
      const copy = { ...ref.current }
      if (next === null) delete copy[id]
      else copy[id] = next
      ref.current = copy
      setData(copy)
      setSaveFailed(!write(key, copy))
    },
    [key]
  )

  return { data, update, saveFailed }
}
