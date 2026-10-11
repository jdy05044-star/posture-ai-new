import { AREA_COLORS } from '@/lib/areaColors'
import type { ObservationArea } from '@/types'
import type { AreaMuscleSummary } from '@/assessment/muscleSummary'

interface Props {
  muscleSummary: AreaMuscleSummary[]
}

/**
 * 각 관찰 영역(ObservationArea)을 일반적인 인체 정면/후면 그림 위의 대략적인 위치에
 * 표시하기 위한 좌표(0~100 기준 정규화). 특정 근육의 해부학적으로 정확한 위치가 아니라,
 * "이 영역대에서 참고할 근육들"이라는 것을 직관적으로 보여주기 위한 대략적인 지점이다.
 *
 * 영역별로 실제 약화 근육 목록에 자주 포함되는 쪽(전면/후면)을 기준으로 앞/뒤 중 한쪽에만
 * 표시한다 (예: 어깨=하부승모근·능형근·전거근 등 후면 근육 위주 → 후면 그림에 표시).
 */
const AREA_MARKER: Record<ObservationArea, { view: 'front' | 'back'; x: number; y: number }> = {
  '머리/목': { view: 'front', x: 50, y: 10 },
  어깨: { view: 'back', x: 50, y: 20 },
  '허리/몸통': { view: 'back', x: 50, y: 44 },
  골반: { view: 'back', x: 50, y: 56 },
  무릎: { view: 'front', x: 50, y: 80 },
  발: { view: 'front', x: 50, y: 97 }
}

/** 간단한 제네릭 인체 실루엣(정면/후면 구분 없이 동일한 형태 — 순수 도형으로만 구성) */
function BodySilhouette({ offsetX }: { offsetX: number }) {
  return (
    <g transform={`translate(${offsetX}, 0)`}>
      {/* 머리 */}
      <circle cx="50" cy="8" r="7" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      {/* 목 */}
      <rect x="46.5" y="14" width="7" height="5" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      {/* 몸통 */}
      <path
        d="M 34 19 Q 50 16 66 19 L 68 50 Q 50 55 32 50 Z"
        fill="#e4ebec"
        stroke="#c9d8da"
        strokeWidth="0.6"
      />
      {/* 팔 */}
      <rect x="24" y="20" width="7" height="34" rx="3.5" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="69" y="20" width="7" height="34" rx="3.5" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      {/* 골반 */}
      <path d="M 32 50 Q 50 58 68 50 L 65 62 Q 50 66 35 62 Z" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      {/* 다리 */}
      <rect x="36" y="62" width="10" height="30" rx="4" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      <rect x="54" y="62" width="10" height="30" rx="4" fill="#eef2f3" stroke="#c9d8da" strokeWidth="0.6" />
      {/* 발 */}
      <ellipse cx="41" cy="96" rx="6" ry="3" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
      <ellipse cx="59" cy="96" rx="6" ry="3" fill="#e4ebec" stroke="#c9d8da" strokeWidth="0.6" />
    </g>
  )
}

export default function MuscleBodyMap({ muscleSummary }: Props) {
  const withWeak = muscleSummary.filter((s) => s.weakMuscles.length > 0)
  if (withWeak.length === 0) return null

  const frontMarkers = withWeak.filter((s) => AREA_MARKER[s.area].view === 'front')
  const backMarkers = withWeak.filter((s) => AREA_MARKER[s.area].view === 'back')

  return (
    <div className="mt-3">
      <p className="label-caption mb-2">약화 근육 위치 (그림으로 보기)</p>
      <div className="flex items-start justify-center gap-6 rounded-lg bg-clinical-50 py-3">
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="h-40 w-auto">
            <BodySilhouette offsetX={0} />
            {frontMarkers.map((s) => {
              const pos = AREA_MARKER[s.area]
              return (
                <circle
                  key={s.area}
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  fill={AREA_COLORS[s.area]}
                  stroke="white"
                  strokeWidth="0.8"
                />
              )
            })}
          </svg>
          <p className="text-[10px] text-clinical-400">정면</p>
        </div>
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="h-40 w-auto">
            <BodySilhouette offsetX={0} />
            {backMarkers.map((s) => {
              const pos = AREA_MARKER[s.area]
              return (
                <circle
                  key={s.area}
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  fill={AREA_COLORS[s.area]}
                  stroke="white"
                  strokeWidth="0.8"
                />
              )
            })}
          </svg>
          <p className="text-[10px] text-clinical-400">후면</p>
        </div>
      </div>

      <ul className="mt-2 space-y-1.5">
        {withWeak.map((s) => (
          <li key={s.area} className="flex items-start gap-2 text-xs">
            <span
              className="mt-0.5 h-2 w-2 flex-none rounded-full"
              style={{ backgroundColor: AREA_COLORS[s.area] }}
            />
            <span>
              <span className="font-medium text-clinical-800">{s.area}</span>{' '}
              <span className="text-clinical-600">{s.weakMuscles.join(', ')}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-clinical-400">
        실제 근육의 정확한 해부학적 위치가 아니라, 편차가 관찰된 영역대를 그림 위에 대략적으로
        표시한 참고용 그림입니다. 정확한 근력 평가는 PT의 직접 평가가 필요합니다.
      </p>
    </div>
  )
}
