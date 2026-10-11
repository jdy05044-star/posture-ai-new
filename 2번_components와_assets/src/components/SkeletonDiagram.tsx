import { formatMeasurementValueShort } from '@/assessment/angleCalculations'
import { AREA_COLORS } from '@/lib/areaColors'
import { anchorFor } from '@/components/MeasurementOverlay'
import skeletonFront from '@/assets/skeleton-front.png'
import skeletonSide from '@/assets/skeleton-side.png'
import skeletonBack from '@/assets/skeleton-back.png'
import type { AngleMeasurement, Landmark, PoseAnalysisResult } from '@/types'

interface Props {
  result: PoseAnalysisResult | null
  measurements: AngleMeasurement[]
  /** 배경 그림(정면/측면/후면)과 오버레이 계산 방식을 함께 결정한다. side-right는 side 그림을 좌우 반전해서 쓴다. */
  view: 'front' | 'back' | 'side-left' | 'side-right'
}

type Pt = { x: number; y: number }
type Transform = { mapX: (x: number) => number; mapY: (y: number) => number }

function toPt(l?: Landmark): Pt | null {
  if (!l) return null
  return { x: l.x * 100, y: l.y * 100 }
}

const identity: Transform = { mapX: (x) => x, mapY: (y) => y }

/**
 * 정면/후면용 참고 그림(AI로 생성한 뼈대 이미지) 위에서 어깨·골반·발목이 대략 위치하는
 * 기준 좌표 (0~100 정규화). 실제 환자 사진의 어깨·골반·발목 좌표를 이 기준에 맞춰
 * 스케일/이동시켜서, 고정된 배경 그림 위에도 실제 측정값 화살표가 자연스럽게 얹히도록 한다.
 * (그림 자체는 참고용 배경일 뿐이며, 화살표·각도는 항상 실제 측정값을 사용한다.)
 */
const FRONTAL_REF = { shoulderY: 17.5, hipY: 42, hipHalfWidth: 5 }
const SAGITTAL_REF = { shoulderY: 17, hipY: 42 }

function frontalTransform(lSh: Pt | null, rSh: Pt | null, lHip: Pt | null, rHip: Pt | null, lAnkle: Pt | null, rAnkle: Pt | null): Transform {
  const shMidY = lSh && rSh ? (lSh.y + rSh.y) / 2 : (lSh ?? rSh)?.y
  const ankleMidY = lAnkle && rAnkle ? (lAnkle.y + rAnkle.y) / 2 : (lAnkle ?? rAnkle)?.y
  if (shMidY == null || ankleMidY == null || Math.abs(ankleMidY - shMidY) < 1) return identity

  const scaleY = (93 - FRONTAL_REF.shoulderY) / (ankleMidY - shMidY)
  const offsetY = FRONTAL_REF.shoulderY - shMidY * scaleY

  const hipCenterX = lHip && rHip ? (lHip.x + rHip.x) / 2 : (lHip ?? rHip)?.x ?? 50
  const hipWidth = lHip && rHip ? Math.abs(rHip.x - lHip.x) : null
  const scaleX = hipWidth && hipWidth > 0.5 ? (FRONTAL_REF.hipHalfWidth * 2) / hipWidth : scaleY
  const offsetX = 50 - hipCenterX * scaleX

  return { mapX: (x) => x * scaleX + offsetX, mapY: (y) => y * scaleY + offsetY }
}

function sagittalTransform(sh: Pt | null, hip: Pt | null, ankle: Pt | null): Transform {
  if (!sh || !hip || !ankle || Math.abs(ankle.y - sh.y) < 1) return identity
  const scaleY = (93 - SAGITTAL_REF.shoulderY) / (ankle.y - sh.y)
  const offsetY = SAGITTAL_REF.shoulderY - sh.y * scaleY
  const offsetX = 50 - hip.x * scaleY
  return { mapX: (x) => x * scaleY + offsetX, mapY: (y) => y * scaleY + offsetY }
}

/**
 * 사진 대신, AI로 생성한 참고용 뼈대 그림을 배경으로 깔고 그 위에 실제로 측정된 관절 좌표를
 * 스케일 보정해서 화살표·각도로 얹어주는 요약 다이어그램. 배경 그림은 순수 참고용 일러스트일
 * 뿐이며, 화살표·각도 숫자는 항상 이 환자의 실제 측정값만 사용한다(값을 지어내지 않음).
 * 등급·백분위처럼 비교 데이터가 필요한 지표는 이 앱이 보유한 비교군 데이터가 없어 표시하지 않는다.
 */
export default function SkeletonDiagram({ result, measurements, view }: Props) {
  const named = result?.named
  const hasLandmarks = !!result && result.landmarks.length > 0 && !!named

  const kind: 'frontal' | 'sagittal' = view === 'front' || view === 'back' ? 'frontal' : 'sagittal'
  const bgImage = view === 'front' ? skeletonFront : view === 'back' ? skeletonBack : skeletonSide
  const flip = view === 'side-right'

  if (!hasLandmarks || !named) {
    return (
      <div className="relative aspect-[1/2] w-full overflow-hidden rounded-lg border border-clinical-200 bg-white">
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-40"
          style={flip ? { transform: 'scaleX(-1)' } : undefined}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-center text-xs text-clinical-400">
          측정 불확실 — 인식된 관절이 없어 표시할 수 없습니다
        </div>
      </div>
    )
  }

  const lSh = toPt(named.leftShoulder)
  const rSh = toPt(named.rightShoulder)
  const lHip = toPt(named.leftHip)
  const rHip = toPt(named.rightHip)
  const lAnkle = toPt(named.leftAnkle)
  const rAnkle = toPt(named.rightAnkle)

  const transform =
    kind === 'frontal'
      ? frontalTransform(lSh, rSh, lHip, rHip, lAnkle, rAnkle)
      : sagittalTransform(lSh ?? rSh, lHip ?? rHip, lAnkle ?? rAnkle)

  const mapPt = (p: Pt | null) => (p ? { x: transform.mapX(p.x), y: transform.mapY(p.y) } : null)

  const ankleForPlumb = mapPt(lAnkle ?? rAnkle)
  const plumbX = ankleForPlumb?.x ?? 50

  // 각도 라벨을 붙일 측정값: 실제로 값이 있는 것만 (unavailable/null은 표시하지 않음 — 지어내지 않음 원칙)
  const labeled = measurements.filter((m) => m.valueDeg !== null)

  return (
    <div className="relative aspect-[1/2] w-full overflow-hidden rounded-lg border border-clinical-200 bg-white">
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <marker id="skeleton-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
          </marker>
        </defs>

        {/* 기준 수직선 */}
        <line x1={plumbX} y1={0} x2={plumbX} y2={100} stroke="#94a3b8" strokeDasharray="1.5,1.5" strokeWidth={0.5} />

        {/* 측정값 화살표 + 각도 (실제 측정값만, 배경 그림 위 상대 위치로 보정해서 표시) */}
        {labeled.map((m) => {
          const anchor = anchorFor(named, m.id)
          if (!anchor) return null
          const raw = { x: anchor.x * 100, y: anchor.y * 100 }
          const p = mapPt(raw)
          if (!p) return null
          const ax = flip ? 100 - p.x : p.x
          const ay = p.y
          const px = flip ? 100 - plumbX : plumbX
          const goRight = ax < px
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
                {formatMeasurementValueShort(m)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
