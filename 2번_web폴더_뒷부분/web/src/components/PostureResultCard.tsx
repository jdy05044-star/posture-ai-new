import { useRef, useState, type ReactNode } from 'react'
import { formatMeasurementValue } from '@/assessment/angleCalculations'
import { ANATOMY_FILE, AREA_DISPLAY_LABEL } from '@/assessment/areaReport'
import AnatomyImage from '@/components/AnatomyImage'
import IllustrationSlot from '@/components/IllustrationSlot'
import LibrarySuggestions from '@/components/LibrarySuggestions'
import { useNoiseFloors } from '@/repeat/useNoise'
import { AREA_EDUCATION } from '@/data/postureEducation'
import pelvisRotationImg from '@/assets/pelvis-rotation.png'
import pelvisTiltImg from '@/assets/pelvis-tilt.png'
import landmarksUpper from '@/assets/landmarks-upper.png'
import landmarksPelvis from '@/assets/landmarks-pelvis.png'
import landmarksLower from '@/assets/landmarks-lower.png'
import type { AreaAssessmentResult } from '@/types'

type Area = AreaAssessmentResult['area']

/** 영역별로 "측정값이 어느 지점을 기준으로 계산됐는지"를 보여주는 참고용 기준점 그림 (직접 생성한 이미지). */
const LANDMARK_ILLUSTRATION: Record<Area, string> = {
  '머리/목': landmarksUpper,
  어깨: landmarksUpper,
  '허리/몸통': landmarksUpper,
  골반: landmarksPelvis,
  무릎: landmarksLower,
  발: landmarksLower
}

/** 영역별로 "더 정확히 보려면 흔히 쓰이는 검사 종류"를 알려주는 일반 참고 문구 (특정인에 대한 처방이 아님). */
const FURTHER_TEST_NOTE: Record<Area, string> = {
  '머리/목': '심부목굴곡근 지구력 검사, 경추 가동범위 검사',
  어깨: '견갑골 가동성 검사, 회전근개 근력검사, 흉추 가동성 검사',
  '허리/몸통': '요추 가동범위 검사, 코어 안정성 검사',
  골반: 'ASIS/PSIS 직접 촉진, 한 발 서기 검사',
  무릎: '한 발 서기·스쿼트 시 무릎 정렬 관찰, 고관절 근력 검사',
  발: '발 아치 평가(navicular drop test), 보행 분석'
}

/** 골반 회전·좌우 이동은 2D 사진만으로 판단할 수 없어, 지어내지 않고 항상 "추가 촬영/PT 검사 필요"로 표시한다. */
/** 관련 근육 블록에서 처음에 보여주는 칩 개수 (나머지는 '근육 전체 보기'로 펼침) */
const MUSCLE_PREVIEW = 4

const PELVIS_UNMEASURABLE = ['골반 좌우 회전', '골반 좌우 이동']

function confidenceColor(conf: number | null) {
  if (conf === null) return 'text-clinical-400'
  if (conf >= 0.7) return 'text-clinical-600'
  if (conf >= 0.4) return 'text-alert-amber'
  return 'text-alert-red'
}

function Block({ n, title, children, className = '' }: { n: number; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`info-block ${className}`}>
      <h4 className="info-block-title">
        <span className="info-block-num">{n}</span>
        {title}
      </h4>
      <div className="space-y-2 text-sm leading-relaxed text-clinical-700">{children}</div>
    </section>
  )
}

/** 눌러서 펼치는 작은 보조 그림 영역 (기본은 접혀 있어 문장·그림이 한꺼번에 쏟아지지 않는다). */
function Peek({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs font-semibold text-mint-700 [&::-webkit-details-marker]:hidden">
        {label} <span className="inline-block transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}

interface Props {
  result: AreaAssessmentResult
  /** true면 카드 테두리·제목 없이 상세 영역 본문만 그린다 (부위별 리스트의 펼침 영역에서 사용). */
  embedded?: boolean
}

/**
 * 부위 하나의 상세 정보를 8개 블록으로 나눠 보여준다:
 * 1 측정값 · 2 좌우 비대칭/방향 · 3 참고 기준 · 4 관찰된 특징 · 5 가능한 원인 · 6 추가 검사 · 7 관련 근육 · 8 추천 운동
 * 블록마다 2~4줄 안팎으로 요약하고, 설명이 긴 항목(가능한 원인)은 눌러서 펼친다.
 */
export default function PostureResultCard({ result, embedded = false }: Props) {
  const hasData = result.measurements.some((m) => m.valueDeg !== null || m.direction !== null)
  const edu = AREA_EDUCATION[result.area]
  const label = AREA_DISPLAY_LABEL[result.area]
  const exerciseRef = useRef<HTMLElement>(null)
  const [openPattern, setOpenPattern] = useState<string | null>(null)
  const [allMuscles, setAllMuscles] = useState(false)
  const { floors } = useNoiseFloors()

  const tightMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.tightMuscles ?? [])))
  const weakMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.weakMuscles ?? [])))

  const unmeasured = result.measurements.filter((m) => m.valueDeg === null && m.direction === null)
  const lowClarity = result.confidence !== null && result.confidence < 0.5
  const needsFurther = result.area === '골반' || unmeasured.length > 0 || lowClarity
  const pattern = edu.commonPatterns.find((p) => p.name === openPattern) ?? null

  const body = (
    <div className="space-y-3">
      {!hasData && <p className="text-sm text-clinical-400">측정 불확실 — 관련 사진 또는 landmark 인식이 필요합니다.</p>}

      {hasData && (
        <div className="grid items-start gap-3 md:grid-cols-2">
          {/* 1. 측정값 */}
          <Block n={1} title="측정값">
            <ul className="divide-y divide-clinical-100">
              {result.measurements.map((m) => (
                <li key={m.id} className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                  <span className="text-clinical-600">{m.label}</span>
                  <span
                    className={`flex-none text-right font-semibold tabular-nums ${m.valueDeg === null && m.direction === null ? 'font-normal text-clinical-400' : 'text-clinical-900'}`}
                  >
                    {m.valueDeg !== null ? formatMeasurementValue(m) : m.direction ? '방향만 측정' : '측정 불확실'}
                  </span>
                  {m.valueDeg !== null && floors[m.id] !== undefined && m.valueDeg < floors[m.id] && (
                    <span className="chip flex-none">반복 오차 범위 이내</span>
                  )}
                </li>
              ))}
            </ul>
            <Peek label="측정 기준점 그림 보기">
              <IllustrationSlot src={LANDMARK_ILLUSTRATION[result.area]} label={`${label} 측정 기준점`} aspect="16/9" />
            </Peek>
          </Block>

          {/* 2. 좌우 비대칭 · 정렬 방향 */}
          <Block n={2} title="좌우 비대칭 · 방향">
            {result.measurements.some((m) => m.direction) ? (
              <ul className="space-y-1.5">
                {result.measurements
                  .filter((m) => m.direction)
                  .map((m) => (
                    <li key={m.id}>
                      <span className="t-meta block">{m.label}</span>
                      {m.direction}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-clinical-400">방향을 판단할 측정값이 없습니다.</p>
            )}
            {result.area === '골반' && (
              <>
                <ul className="space-y-1 pt-1">
                  {PELVIS_UNMEASURABLE.map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2">
                      <span>{p}</span>
                      <span className="chip-tight flex-none">추가 촬영/PT 검사 필요</span>
                    </li>
                  ))}
                </ul>
                <Peek label="골반 개념 그림 보기">
                  <div className="grid grid-cols-2 gap-2">
                    <IllustrationSlot src={pelvisTiltImg} label="골반 전후 경사" aspect="4/3" />
                    <IllustrationSlot src={pelvisRotationImg} label="골반 회전" aspect="4/3" />
                  </div>
                </Peek>
              </>
            )}
          </Block>

          {/* 3. 참고 기준 */}
          <Block n={3} title="참고 기준">
            <p>
              하나의 &quot;정상 범위&quot;로 단정할 근거가 부족해 수치 기준은 표시하지 않습니다.{' '}
              <span className="text-clinical-500">이전 측정값과 비교하세요 (E 탭).</span>
            </p>
          </Block>

          {/* 4. 관찰된 특징 */}
          <Block n={4} title="관찰된 특징">
            <p>{result.observation}</p>
          </Block>

          {/* 5. 가능한 원인 */}
          <Block n={5} title="가능한 원인">
            {edu.commonPatterns.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {edu.commonPatterns.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setOpenPattern(openPattern === p.name ? null : p.name)}
                      aria-pressed={openPattern === p.name}
                      className={`chip-btn ${openPattern === p.name ? 'chip-btn-active' : ''}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <p className={pattern ? 'text-clinical-600' : 't-meta'}>
                  {pattern ? pattern.description : '항목을 누르면 설명이 보입니다'}
                </p>
              </>
            ) : (
              <p className="text-clinical-400">등록된 참고 패턴이 없습니다.</p>
            )}
          </Block>

          {/* 6. 추가 검사 필요 여부 */}
          <Block n={6} title="추가 검사 필요 여부">
            <p className={`font-semibold ${needsFurther ? 'text-alert-red' : 'text-clinical-800'}`}>
              {needsFurther ? '추가 촬영 또는 PT 검사 권장' : '필수는 아니며 정밀 확인용'}
            </p>
            {(result.area === '골반' || unmeasured.length > 0 || lowClarity) && (
              <ul className="space-y-0.5 text-clinical-500">
                {result.area === '골반' && <li>· 골반 회전·좌우 이동은 2D로 확정 불가</li>}
                {unmeasured.length > 0 && <li>· 측정 불확실 {unmeasured.length}개 — 재촬영 필요</li>}
                {lowClarity && <li>· 인식 명확도가 낮음</li>}
              </ul>
            )}
            <p className="t-meta">참고 검사: {FURTHER_TEST_NOTE[result.area]}</p>
          </Block>

          {/* 7. 관련 근육 */}
          <Block n={7} title="관련 근육">
            <div className="flex items-start gap-3">
              <AnatomyImage key={result.area} variant="thumb" file={ANATOMY_FILE[result.area]} label={`${label} 근육 해부도`} />
              <div className="min-w-0 flex-1 space-y-2">
                {tightMuscles.length > 0 && (
                  <div>
                    <p className="t-meta mb-1">긴장 가능</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(allMuscles ? tightMuscles : tightMuscles.slice(0, MUSCLE_PREVIEW)).map((m) => (
                        <span key={m} className="chip-tight">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {weakMuscles.length > 0 && (
                  <div>
                    <p className="t-meta mb-1">약화 가능</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(allMuscles ? weakMuscles : weakMuscles.slice(0, MUSCLE_PREVIEW)).map((m) => (
                        <span key={m} className="chip-weak">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tightMuscles.length === 0 && weakMuscles.length === 0 && (
                  <p className="text-clinical-400">등록된 참고 근육이 없습니다.</p>
                )}
              </div>
            </div>
            {(tightMuscles.length > MUSCLE_PREVIEW || weakMuscles.length > MUSCLE_PREVIEW) && (
              <button type="button" onClick={() => setAllMuscles(!allMuscles)} className="block text-xs font-semibold text-clinical-500">
                {allMuscles ? '간단히 보기' : '근육 전체 보기'}
              </button>
            )}
            <button
              type="button"
              onClick={() => exerciseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="text-sm font-semibold text-mint-700"
            >
              이 부위 운동 보기 ↓
            </button>
          </Block>

          {/* 8. 추천 운동 */}
          <section ref={exerciseRef} className="info-block md:col-span-2">
            <h4 className="info-block-title">
              <span className="info-block-num">8</span>
              추천 운동
            </h4>
            <LibrarySuggestions area={result.area} areaLabel={label} />
          </section>
        </div>
      )}
    </div>
  )

  if (embedded) return body

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="t-section">{label}</h3>
        <span className={`text-sm font-medium ${confidenceColor(result.confidence)}`}>
          {result.confidence !== null ? `인식 명확도 ${Math.round(result.confidence * 100)}%` : '인식 명확도 —'}
        </span>
      </div>
      {body}
      <p className="t-meta mt-3 border-t border-clinical-100 pt-3">
        인식 명확도는 landmark가 또렷하게 인식된 정도이며 진단의 확실성이 아닙니다.
      </p>
    </div>
  )
}
