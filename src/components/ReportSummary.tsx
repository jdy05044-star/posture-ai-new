import { priorityValueText, type AreaReportRowData, AREA_DISPLAY_LABEL } from '@/assessment/areaReport'
import type { AssessmentSummary } from '@/types'

interface Props {
  summary: AssessmentSummary
  rows: AreaReportRowData[]
  /** 측면 사진(좌/우)이 하나라도 있는지 */
  hasSidePhoto: boolean
}

/**
 * 결과 화면 최상단 요약. 핵심 문제 3개를 큰 라벨로, 측정값은 작은 보조 태그로 보여준다.
 * 모든 문구는 실제 측정 결과(priorityAreas, 부위별 측정 여부)에서 조립하며, 측정이 없으면 없다고 말한다.
 */
export default function ReportSummary({ summary, rows, hasSidePhoto }: Props) {
  const top = summary.priorityAreas
  const measuredCount = rows.filter((r) => r.hasData).length
  const priorityNames = Array.from(new Set(top.map((p) => AREA_DISPLAY_LABEL[p.area])))
  const date = new Date(summary.generatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const impression =
    measuredCount === 0
      ? '측정된 부위가 없습니다. 사진을 다시 촬영해 주세요.'
      : top.length > 0
        ? `${measuredCount}개 부위 측정 · 상대적으로 편차가 큰 부위: ${priorityNames.join(', ')}`
        : `${measuredCount}개 부위 측정 · 뚜렷하게 큰 편차는 없었습니다`

  // 조건에 해당할 때만 보이는 짧은 주의사항
  const cautions: string[] = ['골반 회전·좌우 이동은 2D 사진으로 확정할 수 없어 “추가 촬영/PT 검사 필요”']
  if (!hasSidePhoto) cautions.push('측면 사진이 없어 머리·몸통·무릎의 전후 정렬은 계산되지 않음')
  if (top.some((p) => p.confidence !== null && p.confidence < 0.5)) cautions.push('인식 명확도가 낮은 항목이 있어 재촬영 권장')
  cautions.push(...summary.consistencyWarnings)

  return (
    <section className="overflow-hidden rounded-3xl border border-clinical-100 bg-white">
      <div className="bg-clinical-700 px-5 pb-6 pt-5 text-white">
        <p className="text-xs font-semibold tracking-wide text-mint-300">
          AI 자세 분석 리포트 <span className="font-normal text-white/50">· {date}</span>
        </p>

        {top.length > 0 ? (
          <>
            <h2 className="mt-4 text-base font-semibold text-white/80">핵심 문제 {top.length}개</h2>
            <ol className="mt-3 space-y-3">
              {top.map((p, idx) => {
                const value = priorityValueText(p.basedOnMeasurement, p.valueDeg)
                return (
                  <li
                    key={`${p.area}-${p.basedOnMeasurement}`}
                    className="flex items-center gap-4 rounded-2xl bg-white/[0.07] px-4 py-3.5"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-mint-500 text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-bold leading-tight">{AREA_DISPLAY_LABEL[p.area]}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-white/70">{p.basedOnMeasurement}</p>
                    </div>
                    {value && (
                      <span className="flex-none rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium tabular-nums text-white/80">
                        {value}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        ) : (
          <h2 className="mt-4 text-lg font-semibold leading-snug">
            {measuredCount > 0 ? '각도로 비교할 만큼 뚜렷한 편차는 확인되지 않았습니다.' : '아직 측정된 결과가 없습니다.'}
          </h2>
        )}
      </div>

      <div className="space-y-3 px-5 py-5">
        <p className="text-sm font-medium text-clinical-800">{impression}</p>
        <ul className="space-y-1">
          {cautions.map((c) => (
            <li key={c} className="flex gap-2 text-sm text-clinical-500">
              <span className="mt-2 h-1 w-1 flex-none rounded-full bg-clinical-300" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
