import { useEffect, useState } from 'react'

const EXTENSIONS = ['webp', 'png', 'jpg']
const cache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

/** JSON의 image 경로(예: /images/exercises/ex001.webp)를 먼저 시도하고, 같은 이름의 다른 확장자도 시도한다. */
export function imageCandidates(image: string): string[] {
  const base = image.replace(/\.[a-z0-9]+$/i, '')
  return Array.from(new Set([image, ...EXTENSIONS.map((e) => `${base}.${e}`)]))
}

function probe(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve(false)
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/** 실제로 로드되는 첫 후보 URL을 돌려준다. 어떤 파일도 없으면 null (이미지를 지어내지 않는다). */
export function resolveExerciseImage(image: string): Promise<string | null> {
  if (cache.has(image)) return Promise.resolve(cache.get(image) as string | null)
  const pending = inflight.get(image)
  if (pending) return pending
  const p = (async () => {
    for (const url of imageCandidates(image)) {
      if (await probe(url)) {
        cache.set(image, url)
        return url
      }
    }
    cache.set(image, null)
    return null
  })().finally(() => inflight.delete(image))
  inflight.set(image, p)
  return p
}

/** id → URL | null(없음) | undefined(확인 중) */
export function useResolvedImages(items: { id: string; image: string }[]): Record<string, string | null | undefined> {
  const [map, setMap] = useState<Record<string, string | null | undefined>>(() => {
    const init: Record<string, string | null | undefined> = {}
    for (const it of items) if (cache.has(it.image)) init[it.id] = cache.get(it.image)
    return init
  })

  useEffect(() => {
    let cancelled = false
    const todo = items.filter((it) => !cache.has(it.image))
    if (todo.length === 0) {
      const full: Record<string, string | null | undefined> = {}
      for (const it of items) full[it.id] = cache.get(it.image)
      setMap(full)
      return
    }
    Promise.all(todo.map((it) => resolveExerciseImage(it.image))).then(() => {
      if (cancelled) return
      const full: Record<string, string | null | undefined> = {}
      for (const it of items) full[it.id] = cache.get(it.image)
      setMap(full)
    })
    return () => {
      cancelled = true
    }
    // items는 모듈 상수 목록이라 한 번만 확인하면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return map
}
