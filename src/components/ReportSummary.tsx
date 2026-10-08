import { priorityValueText, type AreaReportRowData, AREA_DISPLAY_LABEL } from '@/assessment/areaReport'
import type { AssessmentSummary } from '@/types'

interface Props {
  summary: AssessmentSummary
  rows: AreaReportRowData[]
  /** 측면 사진(좌/우)이 하나라도 있는지 */
  hasSidePhoto: boolean
}

/**
 * 결과 화면 최상단 요약: 한 줄 요약 · 핵심 문제 3개 · 전체 인상 · 주의사항.
 * 모든 문장은 실제 측정 결과(priorityAreas, 부위별 측정 여부)에서 조립하며, 측정이 없으면 없다고 말한다.
 */
export default function ReportSummary({ summary, rows, hasSidePhoto }: Props) {
  const top = summary.priorityAreas
  const measuredCount = rows.filter((r) => r.hasData).length
  const priorityNames = Array.from(new Set(top.map((p) => AREA_DISPLAY_LABEL[p.area])))
  const generated = new Date(summary.generatedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const oneLine =
    top.length > 0
      ? `각도 편차가 가장 크게 측정된 부위는 ${AREA_DISPLAY_LABEL[top[0].area]}(${top[0].basedOnMeasurement})입니다.`
      : measuredCount > 0
        ? '각도로 비교할 수 있는 뚜렷한 편차는 확인되지 않았습니다.'
        : '아직 측정된 결과가 없어 요약할 수 없습니다.'

  const impression =
    measuredCount === 0
      ? '측정값이 확인된 부위가 없습니다. 사진을 다시 촬영해주세요.'
      : top.length > 0
        ? `6개 부위 중 ${measuredCount}개 부위의 측정값을 확인했고, 각도 편차가 상대적으로 큰 부위는 ${priorityNames.join(', ')}입니다. 부위 간 상대 비교이며 정상·이상 판정이 아닙니다.`
        : `6개 부위 중 ${measuredCount}개 부위의 측정값을 확인했습니다. 다만 사진 한 세트에 기반한 참고 결과이며, 불편감 여부는 별도로 확인이 필요합니다.`

  const cautions: string[] = [
    '사진 기반 스크리닝 참고 정보이며 진단이 아닙니다. 가능한 원인·관련 근육은 일반 참고이며 PT의 직접 평가로 확인해야 합니다.',
    '골반의 회전과 좌우 이동은 2D 촬영으로 확정할 수 없어 “추가 촬영/PT 검사 필요”로 표시합니다.'
  ]
  if (!hasSidePhoto) cautions.push('측면 사진이 없어 머리·몸통·무릎의 전후 정렬 지표는 계산되지 않았습니다.')
  if (top.some((p) => p.confidence !== null && p.confidence < 0.5)) {
    cautions.push('핵심 항목 중 인식 명확도가 낮은 것이 있습니다. 같은 조건으로 재촬영하면 더 안정적인 결과를 볼 수 있습니다.')
  }
  cautions.push(...summary.consistencyWarnings)

  return (
    <section className="overflow-hidden rounded-2xl border border-clinical-100 bg-white">
      <div className="bg-clinical-700 px-5 pb-6 pt-5 text-white">
        <p className="text-sm font-semibold tracking-wide text-mint-300">AI 자세 분석 리포트</p>
        <p className="mt-0.5 text-sm text-white/60">{generated} 분석</p>
        <h2 className="mt-4 text-xl font-semibold leading-snug">{oneLine}</h2>

        {top.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-white/70">핵심 문제 {top.length}개</p>
            <ol className="space-y-4">
              {top.map((p, idx) => {
                const value = priorityValueText(p.basedOnMeasurement, p.valueDeg)
                return (
                  <li key={`${p.area}-${p.basedOnMeasurement}`} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-mint-500 text-sm font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-base font-semibold">
                        {AREA_DISPLAY_LABEL[p.area]} · {p.basedOnMeasurement}
                      </p>
                      <p className="text-sm text-white/70">
                        {value ? `${value} · ` : ''}
                        {p.reason}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="mb-1 text-sm font-semibold text-clinical-900">전체 인상</p>
          <p className="text-sm leading-relaxed text-clinical-600">{impression}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold text-clinical-900">주의사항</p>
          <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-clinical-600">
            {cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
