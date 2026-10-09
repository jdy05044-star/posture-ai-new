import { useState } from 'react'
import { ANATOMY_FILE, BAR_FULL_SCALE_DEG, type AreaReportRowData } from '@/assessment/areaReport'
import AnatomyImage from '@/components/AnatomyImage'
import ImbalanceBar from '@/components/ImbalanceBar'
import PostureResultCard from '@/components/PostureResultCard'
import type { ObservationArea } from '@/types'

interface Props {
  rows: AreaReportRowData[]
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * 부위별 불균형 카드 리스트. 카드 하나 = 부위 하나: 해부도 썸네일 · 부위명 · 대표 문제 · 방향 · 막대.
 * 누르면 같은 카드 안에서 8개 항목 상세(PostureResultCard embedded)가 펼쳐진다.
 * 막대·방향·문제명은 모두 실제 측정값에서만 나오며, 측정이 없으면 "측정 불확실"로 남긴다.
 */
export default function AreaReportList({ rows }: Props) {
  const [open, setOpen] = useState<Set<ObservationArea>>(new Set())
  const allOpen = open.size === rows.length

  function toggle(area: ObservationArea) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      return next
    })
  }

  return (
    <section aria-labelledby="area-report-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 id="area-report-title" className="t-title">
            부위별 불균형
          </h3>
          <p className="t-meta mt-0.5">막대는 0~{BAR_FULL_SCALE_DEG}° 눈금 시각화이며 등급이 아닙니다</p>
        </div>
        <button
          onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map((r) => r.area)))}
          className="flex-none text-sm font-semibold text-mint-700"
        >
          {allOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => {
          const isOpen = open.has(row.area)
          const panelId = `area-detail-${ANATOMY_FILE[row.area]}`
          return (
            <li key={row.area} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(row.area)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-start gap-4 p-4 text-left"
              >
                <AnatomyImage variant="thumb" file={ANATOMY_FILE[row.area]} label={`${row.label} 근육 해부도`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-lg font-bold text-clinical-900">{row.label}</h4>
                    <span className="flex items-center gap-0.5 text-sm font-semibold text-mint-700">
                      {isOpen ? '접기' : '상세'}
                      <Chevron open={isOpen} />
                    </span>
                  </div>

                  {row.hasData ? (
                    <>
                      <p className="mt-0.5 text-sm font-medium text-clinical-700">{row.problemName}</p>
                      {row.direction && <p className="mt-1 line-clamp-2 text-sm text-clinical-500">{row.direction}</p>}
                      <ImbalanceBar ratio={row.barRatio} valueDeg={row.severityDeg} />
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-clinical-400">측정 불확실 — 관련 사진이 필요합니다</p>
                  )}
                </div>
              </button>

              {isOpen && (
                <div id={panelId} className="border-t border-clinical-100 bg-clinical-50/60 p-4">
                  <PostureResultCard result={row.result} embedded />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
