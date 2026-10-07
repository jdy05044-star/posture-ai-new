import { useState } from 'react'
import { TIER_LABEL, type AreaMuscleTendency } from '@/assessment/muscleTendency'
import type { ObservationArea } from '@/types'

/** 긴장(과사용)/약화(저사용) 상태를 색으로 구분 — 실제 색상값은 디자인 토큰(코랄/딥네이비)과 통일 */
const TIGHT_COLOR = '#c2503c' // alert.red
const WEAK_COLOR = '#142d3e' // clinical.700 (딥네이비)

function dotColor(t: AreaMuscleTendency) {
  const hasTight = t.tightMuscles.length > 0
  const hasWeak = t.weakMuscles.length > 0
  if (hasTight && hasWeak) return TIGHT_COLOR // 둘 다 있으면 링 색(아래)과 함께 구분되므로 채움은 긴장색
  if (hasTight) return TIGHT_COLOR
  if (hasWeak) return WEAK_COLOR
  return '#8798a8'
}

interface Props {
  tendencies: AreaMuscleTendency[]
}

/**
 * 각 관찰 영역을 일반적인 인체 정면/후면 그림 위의 대략적인 위치에 표시하기 위한 좌표
 * (0~100 정규화). 특정 근육의 해부학적으로 정확한 위치가 아니라, "이 영역대에서 참고할
 * 근육들"이라는 것을 직관적으로 보여주기 위한 대략적인 지점이다.
 */
const AREA_MARKER: Record<ObservationArea, { view: 'front' | 'back'; x: number; y: number }> = {
  '머리/목': { view: 'front', x: 50, y: 10 },
  어깨: { view: 'back', x: 50, y: 20 },
  '허리/몸통': { view: 'back', x: 50, y: 44 },
  골반: { view: 'back', x: 50, y: 56 },
  무릎: { view: 'front', x: 50, y: 80 },
  발: { view: 'front', x: 50, y: 97 }
}

function tierOpacity(tier: AreaMuscleTendency['tier']) {
  return tier === 'high' ? 1 : tier === 'moderate' ? 0.75 : 0.45
}

/** 순수 도형으로만 구성한 제네릭 인체 실루엣 (특정 저작물을 참조하지 않은 원본) */
function BodySilhouette() {
  return (
    <g>
      <circle cx="50" cy="8" r="7" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="46.5" y="14" width="7" height="5" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <path d="M 34 19 Q 50 16 66 19 L 68 50 Q 50 55 32 50 Z" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="24" y="20" width="7" height="34" rx="3.5" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="69" y="20" width="7" height="34" rx="3.5" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <path d="M 32 50 Q 50 58 68 50 L 65 62 Q 50 66 35 62 Z" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="36" y="62" width="10" height="30" rx="4" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="54" y="62" width="10" height="30" rx="4" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <ellipse cx="41" cy="96" rx="6" ry="3" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <ellipse cx="59" cy="96" rx="6" ry="3" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
    </g>
  )
}

/**
 * "01 근육 평가" 섹션의 핵심 시각화. 실제로 편차가 관찰된 영역(우선 확인 영역)만 그림 위에
 * 점으로 표시하고, 탭/클릭하면 그 영역의 실제 근거(측정값)·신뢰도·참고 근육을 보여준다.
 * 점의 진하기는 신뢰도(등급)를 나타낼 뿐, 새로운 값을 지어내지 않는다.
 */
export default function MuscleMapSVG({ tendencies }: Props) {
  const [selected, setSelected] = useState<ObservationArea | null>(null)

  if (tendencies.length === 0) {
    return (
      <div className="rounded-lg bg-clinical-50 p-4 text-center text-sm text-clinical-500">
        분석 데이터 부족 — 측정된 편차가 크게 관찰된 영역이 없어 근육 참고 그림을 표시하지 않습니다.
      </div>
    )
  }

  const front = tendencies.filter((t) => AREA_MARKER[t.area].view === 'front')
  const back = tendencies.filter((t) => AREA_MARKER[t.area].view === 'back')
  const selectedT = tendencies.find((t) => t.area === selected) ?? null

  function renderGroup(list: AreaMuscleTendency[]) {
    return list.map((t) => {
      const pos = AREA_MARKER[t.area]
      const isSel = selected === t.area
      return (
        <g
          key={t.area}
          onClick={() => setSelected(isSel ? null : t.area)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelected(isSel ? null : t.area)
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${t.area} 근육 경향 보기`}
          style={{ cursor: 'pointer' }}
        >
          {isSel && <circle cx={pos.x} cy={pos.y} r={6.5} fill="none" stroke={dotColor(t)} strokeWidth={0.7} />}
          {t.tightMuscles.length > 0 && t.weakMuscles.length > 0 && (
            <circle cx={pos.x} cy={pos.y} r={isSel ? 5.2 : 4.4} fill="none" stroke={WEAK_COLOR} strokeWidth={1.1} opacity={tierOpacity(t.tier)} />
          )}
          <circle
            cx={pos.x}
            cy={pos.y}
            r={isSel ? 4 : 3.2}
            fill={dotColor(t)}
            opacity={tierOpacity(t.tier)}
            stroke="white"
            strokeWidth={0.9}
          />
        </g>
      )
    })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-center gap-4 text-[11px] text-clinical-600">
        <span className="flex items-center gap-1.5">
          <span className="legend-dot" style={{ backgroundColor: TIGHT_COLOR }} /> 긴장된 근육 (과사용 경향)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="legend-dot" style={{ backgroundColor: WEAK_COLOR }} /> 약화된 근육 (저사용 경향)
        </span>
      </div>
      <div className="flex items-start justify-center gap-6 rounded-lg bg-clinical-50 py-3">
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="h-44 w-auto">
            <BodySilhouette />
            {renderGroup(front)}
          </svg>
          <p className="text-[10px] text-clinical-400">정면</p>
        </div>
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="h-44 w-auto">
            <BodySilhouette />
            {renderGroup(back)}
          </svg>
          <p className="text-[10px] text-clinical-400">후면</p>
        </div>
      </div>

      {selectedT ? (
        <div className="mt-3 rounded-lg border border-clinical-200 bg-white p-3 text-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-medium text-clinical-800">{selectedT.area}</p>
            <span className="flex-none text-xs text-clinical-400">
              {selectedT.confidencePct != null ? `인식 명확도 ${selectedT.confidencePct}%` : '인식 명확도 —'} ·{' '}
              {TIER_LABEL[selectedT.tier]}
            </span>
          </div>
          <p className="mb-2 text-xs text-clinical-500">근거: {selectedT.reason}</p>
          {selectedT.tightMuscles.length > 0 && (
            <p className="text-xs">
              <span className="font-medium text-alert-red">긴장(단축) 경향</span>{' '}
              <span className="text-clinical-600">{selectedT.tightMuscles.join(', ')}</span>
            </p>
          )}
          {selectedT.weakMuscles.length > 0 && (
            <p className="text-xs">
              <span className="font-medium text-clinical-700">약화(저활성) 경향</span>{' '}
              <span className="text-clinical-600">{selectedT.weakMuscles.join(', ')}</span>
            </p>
          )}
          <button onClick={() => setSelected(null)} className="mt-2 text-xs text-clinical-400 underline">
            닫기
          </button>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {tendencies.map((t) => {
            const names = [...t.tightMuscles, ...t.weakMuscles]
            return (
              <li key={t.area} className="flex items-start gap-2 text-xs">
                <span
                  className="mt-0.5 h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: dotColor(t), opacity: tierOpacity(t.tier) }}
                />
                <button onClick={() => setSelected(t.area)} className="text-left decoration-dotted hover:underline">
                  <span className="font-medium text-clinical-800">{t.area}</span>{' '}
                  <span className="text-clinical-600">
                    {names.slice(0, 3).join(', ')}
                    {names.length > 3 ? ' 외' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-2 text-xs text-clinical-400">
        실제 근육의 정확한 해부학적 위치가 아니라, 측정된 편차를 근거로 참고 근육을 정리해 그림 위 대략적인
        위치에 표시한 것입니다. 점의 진하기는 인식 명확도(landmark가 얼마나 또렷하게 인식됐는지)를 나타낼 뿐,
        임상적 확실성이나 진단을 의미하지 않습니다.
      </p>
    </div>
  )
}
