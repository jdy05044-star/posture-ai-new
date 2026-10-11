import { BAR_FULL_SCALE_DEG } from '@/assessment/areaReport'

interface Props {
  /** 0~1. null이면 각도로 잴 수 있는 측정값이 없다는 뜻이라 막대를 그리지 않는다. */
  ratio: number | null
  /** 막대 옆에 보여줄 실제 측정 편차(°) */
  valueDeg: number | null
}

/**
 * 불균형 정도 막대. 길이는 측정된 각도 편차를 0~BAR_FULL_SCALE_DEG° 눈금에 맞춘 것이며,
 * "경미/심함" 같은 임상 등급을 붙이지 않는다. 항상 실제 숫자(°)를 함께 보여준다.
 */
export default function ImbalanceBar({ ratio, valueDeg }: Props) {
  if (ratio === null || valueDeg === null) {
    return <p className="mt-2 text-sm text-clinical-400">각도로 측정된 값 없음</p>
  }
  const pct = Math.max(ratio > 0 ? 4 : 0, Math.round(ratio * 100))
  return (
    <div className="mt-2 flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-clinical-100"
        role="img"
        aria-label={`측정된 각도 편차 ${valueDeg}도 (막대 눈금 ${BAR_FULL_SCALE_DEG}도 기준)`}
      >
        <div className="h-full rounded-full bg-mint-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 flex-none text-right text-sm font-semibold tabular-nums text-clinical-800">{valueDeg}°</span>
    </div>
  )
}
