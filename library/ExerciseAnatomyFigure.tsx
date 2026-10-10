import { useEffect, useMemo, useRef, useState } from 'react'
import { SVG_LOADERS } from '@/anatomy/atlas'
import { resolveExerciseImage } from './exerciseImages'
import { planAnatomy, ROLE_COLOR, ROLE_LABEL, ROLE_ORDER, type MuscleRole } from './exerciseAnatomy'
import type { ExerciseEnrichment } from './types'

type View = 'front' | 'back'
const WEIGHT: Record<MuscleRole, number> = { primary: 4, secondary: 2, stabilizer: 1, overuse: 1 }

interface Props {
  exerciseId: string
  name: string
  enrichment: ExerciseEnrichment
  /** 라이선스가 확인된 해부도 이미지 경로(없어도 됨). 있으면 생성 그림 대신 이것을 먼저 보여준다. */
  userImage?: string
}

function esc(id: string) {
  return id.replace(/([^\w-])/g, '\\$1')
}

/** 근육 해부도(자체 제작 SVG)에 운동별 역할 색을 칠한다. 사진·외부 이미지는 쓰지 않는다. */
export default function ExerciseAnatomyFigure({ exerciseId, name, enrichment, userImage }: Props) {
  const plan = useMemo(() => planAnatomy(enrichment), [enrichment])
  const [uploaded, setUploaded] = useState<string | null | undefined>(undefined)
  const [html, setHtml] = useState<Record<View, string | null>>({ front: null, back: null })
  const [forced, setForced] = useState<View | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let off = false
    resolveExerciseImage(userImage ?? `/images/exercises/anatomy/${exerciseId.toLowerCase()}-target.webp`).then((u) => !off && setUploaded(u))
    return () => {
      off = true
    }
  }, [exerciseId, userImage])

  useEffect(() => {
    let off = false
    ;(['front', 'back'] as View[]).forEach((v) =>
      SVG_LOADERS[`muscle-${v}`]().then((h) => !off && setHtml((p) => ({ ...p, [v]: h })))
    )
    return () => {
      off = true
    }
  }, [])

  // 어느 방향에 더 많은 (중요한) 근육이 있는지 계산해 기본 방향을 고른다.
  const bestView = useMemo<View>(() => {
    const score: Record<View, number> = { front: 0, back: 0 }
    for (const v of ['front', 'back'] as View[]) {
      const h = html[v]
      if (!h) continue
      for (const [id, role] of Object.entries(plan.roleByAtlasId) as [string, MuscleRole][]) if (h.includes(`data-muscle-id="${id}"`)) score[v] += WEIGHT[role] + (role === 'primary' ? 100 : 0)
    }
    return score.back >= score.front ? 'back' : 'front'
  }, [html, plan])
  const view = forced ?? bestView
  const svgHtml = html[view]

  useEffect(() => {
    // 칠한 상태가 React 재렌더로 지워지지 않도록 SVG를 직접 넣고 칠한다.
    if (!box.current || !svgHtml) return
    box.current.innerHTML = svgHtml
    const svg = box.current.querySelector('svg') as SVGSVGElement | null
    if (!svg) return
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    let deepShown = false
    for (const [id, role] of Object.entries(plan.roleByAtlasId) as [string, MuscleRole][]) {
      svg.querySelectorAll(`[data-muscle-id="${esc(id)}"]`).forEach((g) => {
        g.querySelectorAll('.muscle-surface').forEach((s) => (s as SVGElement).style.setProperty('fill', ROLE_COLOR[role]))
        if (g.getAttribute('data-layer') === 'deep') deepShown = true
      })
    }
    svg.querySelector('#deep_layer')?.setAttribute('display', deepShown ? 'inline' : 'none')
    svg.querySelector('#superficial_layer')?.setAttribute('opacity', deepShown ? '0.55' : '1')
  }, [svgHtml, plan])

  const roles = ROLE_ORDER.filter((r) => enrichment[r].length > 0)
  const present = (v: View) => Object.keys(plan.roleByAtlasId).some((id) => html[v]?.includes(`data-muscle-id="${id}"`))

  if (uploaded) {
    return (
      <div className="overflow-hidden rounded-xl bg-clinical-50">
        <img src={uploaded} alt={`${name} 해부학 타깃`} className="w-full object-contain" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['back', 'front'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForced(v)}
              className={view === v ? 'chip-btn chip-btn-active' : 'chip-btn'}
              disabled={!present(v)}
            >
              {v === 'back' ? '뒷면' : '앞면'}
            </button>
          ))}
        </div>
        <span className="text-sm text-clinical-400">도식 해부도</span>
      </div>
      <div ref={box} className="mx-auto w-full max-w-[260px] rounded-xl bg-clinical-50 p-2" aria-label={`${name} 자극 근육 해부도`} role="img" />
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {roles.map((r) => (
          <li key={r} className="flex items-center gap-1.5 text-sm text-clinical-600">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: ROLE_COLOR[r] }} />
            {ROLE_LABEL[r]}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-sm text-clinical-400">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#ced8df' }} />
          그 외
        </li>
      </ul>
      {plan.unmapped.length > 0 && (
        <p className="mt-1 text-sm text-clinical-400">
          해부도에 없어 칠하지 못한 근육: {plan.unmapped.map((u) => u.name).join(', ')}
        </p>
      )}
      {(() => {
        const other = view === 'back' ? 'front' : 'back'
        const names = Object.entries(plan.roleByAtlasId).filter(([id]) => !html[view]?.includes(`data-muscle-id="${id}"`) && html[other]?.includes(`data-muscle-id="${id}"`))
        return names.length > 0 ? <p className="mt-1 text-sm text-clinical-400">일부 근육은 {other === 'back' ? '뒷면' : '앞면'}에서 보입니다.</p> : null
      })()}
    </div>
  )
}
