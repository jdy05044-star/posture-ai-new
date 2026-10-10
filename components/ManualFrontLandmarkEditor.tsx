import { useState, type MouseEvent } from 'react'
import type { ManualFrontLandmarks } from '@/types'

interface Props {
  imageDataUrl: string
  value: ManualFrontLandmarks
  onChange: (next: ManualFrontLandmarks) => void
}

type Key = keyof ManualFrontLandmarks

const POINTS: { key: Key; label: string; short: string; hint: string }[] = [
  { key: 'leftAsis', label: '대상자의 왼쪽 ASIS', short: '왼쪽 ASIS', hint: '정면 사진에서는 화면의 오른쪽에 보입니다' },
  { key: 'rightAsis', label: '대상자의 오른쪽 ASIS', short: '오른쪽 ASIS', hint: '정면 사진에서는 화면의 왼쪽에 보입니다' }
]

/**
 * 정면 사진 위에서 PT가 좌·우 ASIS(전상장골극)를 직접 탭하는 컴포넌트.
 * 자동 인식의 hip 점은 ASIS가 아니므로, 좌우 ASIS 높이 차이는 이 점들로만 계산한다.
 * 점을 찍지 않으면 값은 "측정 불확실"로 남는다.
 */
export default function ManualFrontLandmarkEditor({ imageDataUrl, value, onChange }: Props) {
  const [active, setActive] = useState<Key | null>('leftAsis')

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if (!active) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    const next = { ...value, [active]: { x, y } }
    onChange(next)
    const nextUnset = POINTS.find((p) => !next[p.key])
    setActive(nextUnset ? nextUnset.key : null)
  }

  const l = value.leftAsis
  const r = value.rightAsis
  // 대상자의 왼쪽은 정면 사진에서 화면 오른쪽에 보인다. 반대로 찍혔으면 좌우를 바꿔 눌렀을 가능성을 알려준다.
  const maybeSwapped = !!l && !!r && l.x < r.x
  const placed = POINTS.filter((p) => !!value[p.key]).length
  const activeInfo = POINTS.find((p) => p.key === active)

  return (
    <div>
      <p className="t-meta mb-3">
        골반 앞쪽에서 만져지는 뼈 돌출 지점(ASIS)을 양쪽 모두 탭하세요. 두 점을 모두 찍어야 높이 차이가 계산됩니다.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {POINTS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            aria-pressed={active === p.key}
            className={`chip-btn ${active === p.key ? 'chip-btn-active' : ''}`}
          >
            {value[p.key] ? '✓ ' : ''}
            {p.label}
          </button>
        ))}
      </div>

      {activeInfo && (
        <p className="mb-2 text-sm font-medium text-alert-red">
          “{activeInfo.label}”를 사진에서 탭하세요 · {activeInfo.hint}
        </p>
      )}

      <div
        className={`relative overflow-hidden rounded-xl border border-clinical-200 bg-clinical-50 ${active ? 'cursor-crosshair' : ''}`}
        onClick={handleTap}
      >
        <img src={imageDataUrl} alt="정면 사진 — ASIS 표시" className="block w-full select-none" />
        {l && r && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1={l.x * 100} y1={l.y * 100} x2={r.x * 100} y2={r.y * 100} stroke="#e88978" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        {POINTS.map((p) => {
          const pt = value[p.key]
          if (!pt) return null
          return (
            <div
              key={p.key}
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
            >
              <span className="h-3 w-3 rounded-full border-2 border-white bg-alert-coral shadow" />
              <span className="mt-0.5 whitespace-nowrap rounded bg-clinical-900/80 px-1 py-0.5 text-[9px] font-medium text-white">
                {p.short}
              </span>
            </div>
          )
        })}
      </div>

      {maybeSwapped && (
        <p className="mt-2 rounded-xl bg-alert-coral/10 px-3 py-2 text-sm text-clinical-700">
          왼쪽 ASIS가 화면 왼쪽에 찍혀 있습니다. 정면 사진에서 대상자의 왼쪽은 화면 오른쪽에 보이므로, 좌우를 바꿔 눌렀거나
          사진이 좌우 반전된 것은 아닌지 확인해 주세요.
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <p className="t-meta">{placed} / {POINTS.length}개 표시됨</p>
        <button
          type="button"
          onClick={() => {
            onChange({})
            setActive('leftAsis')
          }}
          className="text-xs font-medium text-clinical-500 underline"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
