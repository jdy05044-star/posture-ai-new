/** 근육 색 범례: 빨강 = 긴장 가능, 파랑 = 약화 가능, 회색 = 참고 부위. */
export default function MuscleLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-clinical-600 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <span className="legend-dot bg-alert-red" /> 긴장 가능
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="legend-dot bg-alert-blue" /> 약화 가능
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="legend-dot bg-clinical-300" /> 참고 부위
      </span>
    </div>
  )
}
