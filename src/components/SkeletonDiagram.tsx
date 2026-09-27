import { AREA_COLORS } from '@/lib/areaColors'
import { anchorFor } from '@/components/MeasurementOverlay'
import type { AngleMeasurement, Landmark, PoseAnalysisResult } from '@/types'

interface Props {
  result: PoseAnalysisResult | null
  measurements: AngleMeasurement[]
  /** frontal: 정면/후면처럼 좌우 두 다리·두 어깨가 모두 보이는 뷰 / sagittal: 측면처럼 한쪽만 보이는 뷰 */
  kind: 'frontal' | 'sagittal'
}

type Pt = { x: number; y: number }

function toPt(l?: Landmark): Pt | null {
  if (!l) return null
  return { x: l.x * 100, y: l.y * 100 }
}

/**
 * 사진 대신, 실제로 인식된 관절 좌표만 이용해 막대 인간(스틱 피겨) 형태로 그려주는 요약 다이어그램.
 * SNPE 등 체형분석 리포트에서 흔히 쓰는 "뼈대 그림 + 화살표 각도" 형식을 참고했다.
 * 실제 측정되지 않은 관절·각도는 그리지 않으며(값을 지어내지 않음), 등급·백분위 같은 비교 지표는
 * 이 앱이 보유한 비교군 데이터가 없어 표시하지 않는다 — 실제 측정값(각도)만 화살표와 함께 보여준다.
 */
export default function SkeletonDiagram({ result, measurements, kind }: Props) {
  const named = result?.named
  const hasLandmarks = !!result && result.landmarks.length > 0 && !!named

  if (!hasLandmarks || !named) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-dashed border-clinical-200 text-center text-xs text-clinical-400">
        측정 불확실 — 인식된 관절이 없어 그릴 수 없습니다
      </div>
    )
  }

  const nose = toPt(named.nose)
  const lEar = toPt(named.leftEar)
  const rEar = toPt(named.rightEar)
  const lSh = toPt(named.leftShoulder)
  const rSh = toPt(named.rightShoulder)
  const lHip = toPt(named.leftHip)
  const rHip = toPt(named.rightHip)
  const lKnee = toPt(named.leftKnee)
  const rKnee = toPt(named.rightKnee)
  const lAnkle = toPt(named.leftAnkle)
  const rAnkle = toPt(named.rightAnkle)

  const segments: [Pt | null, Pt | null][] = []
  let headCenter: Pt | null = null

  if (kind === 'frontal') {
    headCenter = nose ?? (lSh && rSh ? { x: (lSh.x + rSh.x) / 2, y: Math.min(lSh.y, rSh.y) - 12 } : null)
    segments.push([lSh, rSh], [lHip, rHip], [lSh, lHip], [rSh, rHip], [lHip, lKnee], [lKnee, lAnkle], [rHip, rKnee], [rKnee, rAnkle])
  } else {
    const ear = lEar ?? rEar
    const sh = lSh ?? rSh
    const hip = lHip ?? rHip
    const knee = lKnee ?? rKnee
    const ankle = lAnkle ?? rAnkle
    headCenter = ear
    segments.push([ear, sh], [sh, hip], [hip, knee], [knee, ankle])
  }

  // 기준 수직선: 발목(또는 엉덩이) x좌표를 기준으로 삼는다.
  const plumbX = (kind === 'frontal' ? (lAnkle ?? rAnkle)?.x : (lAnkle ?? rAnkle)?.x) ?? headCenter?.x ?? 50

  // 각도 라벨을 붙일 측정값: 실제로 값이 있는 것만 (unavailable/null은 표시하지 않음 — 지어내지 않음 원칙)
  const labeled = measurements.filter((m) => m.valueDeg !== null)

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-clinical-200 bg-white">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <marker id="skeleton-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
          </marker>
        </defs>

        {/* 기준 수직선 */}
        <line x1={plumbX} y1={0} x2={plumbX} y2={100} stroke="#cbd5e1" strokeDasharray="1.5,1.5" strokeWidth={0.4} />

        {/* 스틱 피겨 */}
        {segments.map(([a, b], i) =>
          a && b ? (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#dc2626" strokeWidth={1.2} strokeLinecap="round" />
          ) : null
        )}
        {headCenter && <circle cx={headCenter.x} cy={headCenter.y - 3} r={4.5} fill="none" stroke="#dc2626" strokeWidth={1.2} />}
        {[lSh, rSh, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle].map(
          (p, i) => p && <circle key={i} cx={p.x} cy={p.y} r={0.9} fill="#1e293b" />
        )}

        {/* 측정값 화살표 + 각도 */}
        {labeled.map((m) => {
          const anchor = anchorFor(named, m.id)
          if (!anchor) return null
          const ax = anchor.x * 100
          const ay = anchor.y * 100
          const goRight = ax < plumbX // 몸 중심선보다 왼쪽이면 화살표는 오른쪽에서 왼쪽으로(밖에서 안으로) 향하게
          const leaderLen = 9
          const tailX = goRight ? ax - leaderLen : ax + leaderLen
          const color = AREA_COLORS[m.area]
          return (
            <g key={m.id}>
              <line
                x1={tailX}
                y1={ay}
                x2={goRight ? ax - 1.5 : ax + 1.5}
                y2={ay}
                stroke={color}
                strokeWidth={0.8}
                markerEnd="url(#skeleton-arrow)"
              />
              <text
                x={tailX}
                y={ay - 1.5}
                fontSize={4.2}
                fontWeight={700}
                fill={color}
                textAnchor={goRight ? 'end' : 'start'}
              >
                {m.valueDeg}°
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
