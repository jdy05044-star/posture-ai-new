import { useMemo, useState, type ReactNode } from 'react'
import {
  extractMeasurements,
  FRONTAL_MEASUREMENT_IDS,
  SAGITTAL_MEASUREMENT_IDS_LEFT,
  SAGITTAL_MEASUREMENT_IDS_RIGHT
} from '@/assessment/angleCalculations'
import { AREA_DISPLAY_LABEL, priorityValueText } from '@/assessment/areaReport'
import { computeMuscleTendencies } from '@/assessment/muscleTendency'
import { computePatternTendencies } from '@/assessment/patternTendencies'
import DisclaimerNote from '@/components/DisclaimerNote'
import LibrarySuggestions from '@/components/LibrarySuggestions'
import MuscleMapSVG from '@/components/MuscleMapSVG'
import { AREA_EDUCATION } from '@/data/postureEducation'
import type { AssessmentSummary, ObservationArea } from '@/types'

interface Props {
  summary: AssessmentSummary
  /** "D. 맞춤 운동" 탭으로 이동 */
  onGoExercises: () => void
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h3 className="mb-3 flex items-center gap-2.5">
        <span className="section-badge">{n}</span>
        <span className="t-section">{title}</span>
      </h3>
      {children}
    </section>
  )
}

/** 긴 설명 중 첫 문장만 (설명을 2~3줄로 줄이기 위함) */
function firstSentence(text: string): string {
  const m = text.match(/^.*?다\.(?=\s|$)/)
  return m ? m[0] : text
}

/**
 * C. 원인·근육 탭: 01 자세 패턴 요약 → 02 긴장 가능 근육 → 03 약화 가능 근육 → (해부도) → 04 간단 설명 → 05 연결 운동 미리보기.
 * 근육은 "가능"으로만 표시한다. 편차가 관찰된 영역에서 일반적으로 함께 언급되는 근육을 모은 참고 정보이며,
 * 이 사람의 실제 근육 상태를 확정하지 않는다.
 */
export default function CauseMusclePanel({ summary, onGoExercises }: Props) {
  const tendencies = useMemo(() => computeMuscleTendencies(summary), [summary])
  const patterns = useMemo(() => {
    const sagittal = extractMeasurements(summary, [...SAGITTAL_MEASUREMENT_IDS_LEFT, ...SAGITTAL_MEASUREMENT_IDS_RIGHT])
    const frontal = extractMeasurements(summary, FRONTAL_MEASUREMENT_IDS)
    return computePatternTendencies(sagittal, frontal).filter((t) => t.status !== 'insufficient')
  }, [summary])

  const priorityNames = Array.from(new Set(summary.priorityAreas.map((p) => AREA_DISPLAY_LABEL[p.area])))
  const [picked, setPicked] = useState<ObservationArea | null>(null)
  const selectedArea = picked ?? tendencies[0]?.area ?? null

  const tightRows = tendencies.filter((t) => t.tightMuscles.length > 0)
  const weakRows = tendencies.filter((t) => t.weakMuscles.length > 0)

  if (summary.priorityAreas.length === 0) {
    return (
      <div className="space-y-6">
        <section className="card p-5">
          <p className="t-section">뚜렷하게 큰 편차가 관찰된 부위가 없습니다</p>
          <p className="t-body mt-1 text-clinical-500">그래서 근육 참고 정보도 표시하지 않습니다.</p>
        </section>
        <DisclaimerNote />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 01 자세 패턴 요약 */}
      <Step n="01" title="자세 패턴 요약">
        <div className="flex flex-wrap gap-1.5">
          {priorityNames.map((n) => (
            <span key={n} className="chip">
              {n}
            </span>
          ))}
        </div>
        {patterns.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {patterns.map((p) => (
              <li key={p.id} className="rounded-xl bg-clinical-50 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-clinical-900">
                  {p.label}
                  {p.status === 'partial' && <span className="t-meta font-normal">일부만 해당</span>}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-clinical-500">{p.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-meta mt-3">여러 부위를 묶어 보여줄 만한 패턴 경향은 확인되지 않았습니다.</p>
        )}
      </Step>

      {/* 02 긴장 가능 근육 */}
      <Step n="02" title="긴장 가능 근육">
        {tightRows.length > 0 ? (
          <div className="space-y-3">
            {tightRows.map((t) => (
              <div key={t.area}>
                <p className="t-meta mb-1.5">{AREA_DISPLAY_LABEL[t.area]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.tightMuscles.map((m) => (
                    <span key={m} className="chip-tight">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="t-meta">해당 없음</p>
        )}
      </Step>

      {/* 03 약화 가능 근육 */}
      <Step n="03" title="약화 가능 근육">
        {weakRows.length > 0 ? (
          <div className="space-y-3">
            {weakRows.map((t) => (
              <div key={t.area}>
                <p className="t-meta mb-1.5">{AREA_DISPLAY_LABEL[t.area]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.weakMuscles.map((m) => (
                    <span key={m} className="chip-weak">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="t-meta">해당 없음</p>
        )}
      </Step>

      {/* 해부도: 위치 확인 + 부위별 운동 버튼 */}
      <section className="card p-5">
        <h3 className="t-section mb-3">해부도에서 보기</h3>
        <MuscleMapSVG tendencies={tendencies} selected={selectedArea} onSelect={(a) => a && setPicked(a)} />
        <div className="mt-4 border-t border-clinical-100 pt-4">
          <p className="t-meta mb-2">관련 운동 보기</p>
          <div className="flex flex-wrap gap-2">
            {tendencies.map((t) => (
              <button
                key={t.area}
                type="button"
                onClick={() => setPicked(t.area)}
                aria-pressed={selectedArea === t.area}
                className={`chip-btn ${selectedArea === t.area ? 'chip-btn-active' : ''}`}
              >
                {AREA_DISPLAY_LABEL[t.area]} 운동
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 04 왜 이런 패턴으로 보이는지 */}
      <Step n="04" title="왜 이런 패턴으로 보일까요?">
        <ul className="space-y-3">
          {summary.priorityAreas.map((p) => {
            const value = priorityValueText(p.basedOnMeasurement, p.valueDeg)
            return (
              <li key={`${p.area}-${p.basedOnMeasurement}`}>
                <p className="text-sm font-semibold text-clinical-900">
                  {AREA_DISPLAY_LABEL[p.area]}
                  <span className="ml-2 font-normal text-clinical-400">
                    {p.basedOnMeasurement}
                    {value ? ` · ${value}` : ''}
                  </span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-clinical-600">{firstSentence(AREA_EDUCATION[p.area].whyItMatters)}</p>
              </li>
            )
          })}
        </ul>
      </Step>

      {/* 05 연결 운동 미리보기 */}
      <Step n="05" title="연결 운동 미리보기">
        {selectedArea && (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {tendencies.map((t) => (
                <button
                  key={t.area}
                  type="button"
                  onClick={() => setPicked(t.area)}
                  aria-pressed={selectedArea === t.area}
                  className={`chip-btn ${selectedArea === t.area ? 'chip-btn-active' : ''}`}
                >
                  {AREA_DISPLAY_LABEL[t.area]}
                </button>
              ))}
            </div>
            <LibrarySuggestions area={selectedArea} areaLabel={AREA_DISPLAY_LABEL[selectedArea]} />
          </>
        )}
        <button onClick={onGoExercises} className="btn-primary mt-4 w-full py-3">
          D. 맞춤 운동에서 전체 보기
        </button>
      </Step>

      <DisclaimerNote>근육은 &quot;가능&quot; 표시이며 확정이 아닙니다. PT의 근력·길이 검사로 확인해야 합니다.</DisclaimerNote>
    </div>
  )
}
