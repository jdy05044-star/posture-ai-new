import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BACK_MEASUREMENT_IDS,
  extractMeasurements,
  FRONTAL_MEASUREMENT_IDS,
  SAGITTAL_MEASUREMENT_IDS_LEFT,
  SAGITTAL_MEASUREMENT_IDS_RIGHT
} from '@/assessment/angleCalculations'
import { runAssessment } from '@/assessment/assessmentEngine'
import { computeMuscleTendencies } from '@/assessment/muscleTendency'
import AssessmentSummaryPanel from '@/components/AssessmentSummaryPanel'
import ManualSideLandmarkEditor from '@/components/ManualSideLandmarkEditor'
import MeasurementOverlay from '@/components/MeasurementOverlay'
import MuscleMapSVG from '@/components/MuscleMapSVG'
import PostureResultCard from '@/components/PostureResultCard'
import SkeletonDiagram from '@/components/SkeletonDiagram'
import { useAppState } from '@/state/AppState'

type TabId = 'A' | 'B' | 'C' | 'D' | 'E'

const TABS: { id: TabId; label: string }[] = [
  { id: 'A', label: '종합 평가' },
  { id: 'B', label: '부위별 분석' },
  { id: 'C', label: '원인·근육' },
  { id: 'D', label: '맞춤 운동' },
  { id: 'E', label: '변화 비교' }
]

export default function Result() {
  const {
    results,
    captures,
    beforeSummary,
    saveAsBefore,
    setLatestSummary,
    manualSideLandmarks,
    setManualSideLandmarks
  } = useAppState()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('A')

  const summary = useMemo(() => runAssessment(results, manualSideLandmarks), [results, manualSideLandmarks])
  const sagittalMeasurementsLeft = useMemo(
    () => extractMeasurements(summary, SAGITTAL_MEASUREMENT_IDS_LEFT),
    [summary]
  )
  const sagittalMeasurementsRight = useMemo(
    () => extractMeasurements(summary, SAGITTAL_MEASUREMENT_IDS_RIGHT),
    [summary]
  )
  const frontalMeasurements = useMemo(() => extractMeasurements(summary, FRONTAL_MEASUREMENT_IDS), [summary])
  const backMeasurements = useMemo(() => extractMeasurements(summary, BACK_MEASUREMENT_IDS), [summary])

  const anyAnalyzed = Object.values(results).some((r) => r && r.landmarks.length > 0)
  const muscleTendencies = useMemo(() => computeMuscleTendencies(summary), [summary])
  const weakMuscleNames = useMemo(
    () => Array.from(new Set(muscleTendencies.flatMap((t) => t.weakMuscles))),
    [muscleTendencies]
  )
  const tightMuscleNames = useMemo(
    () => Array.from(new Set(muscleTendencies.flatMap((t) => t.tightMuscles))),
    [muscleTendencies]
  )

  // 결과가 계산될 때마다 "최신 평가"로 기록해둔다 (STEP10/11에서 Before/After·리포트에 사용)
  useEffect(() => {
    if (anyAnalyzed) setLatestSummary(summary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, anyAnalyzed])

  if (!anyAnalyzed) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-sm text-clinical-600">아직 분석된 사진이 없습니다.</p>
        <button onClick={() => navigate('/capture')} className="btn-primary mt-4 w-full py-3">
          사진 촬영으로 이동
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">자세 평가 결과</h2>
      <p className="mb-4 text-sm text-clinical-600">
        아래 내용은 자세 스크리닝 참고 정보이며, 통증의 원인을 확정하거나 질환을 진단하지 않습니다.
      </p>

      {!captures['side-left'] && !captures['side-right'] && (
        <div className="mb-4 rounded-lg bg-clinical-100 p-3 text-xs text-clinical-600">
          측면 사진이 없어 머리·몸통·무릎의 전후 정렬 지표는 계산되지 않았습니다.
        </div>
      )}

      {summary.consistencyWarnings.length > 0 && (
        <div className="mb-4 space-y-2 rounded-lg bg-alert-coral/15 p-3 text-xs text-alert-red">
          {summary.consistencyWarnings.map((w) => (
            <p key={w}>⚠ {w}</p>
          ))}
        </div>
      )}

      {/* 탭 네비게이션 (A~E) */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex gap-1 overflow-x-auto bg-clinical-50/95 px-4 py-2 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-btn whitespace-nowrap ${tab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            {t.id}. {t.label}
          </button>
        ))}
      </div>

      {/* A. 종합 평가 */}
      {tab === 'A' && (
        <div className="space-y-6">
          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="section-badge">01</span>
              <h3 className="text-sm font-semibold text-clinical-900">가장 중요한 자세 문제 3가지</h3>
            </div>
            {summary.priorityAreas.length > 0 ? (
              <ol className="space-y-3">
                {summary.priorityAreas.map((p, idx) => (
                  <li key={`${p.area}-${p.basedOnMeasurement}`} className="flex gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-clinical-700 text-xs font-semibold text-white">
                      {idx + 1}
                    </span>
                    <div className="text-sm">
                      <p className="font-medium text-clinical-800">
                        {p.area} — {p.basedOnMeasurement}
                      </p>
                      <p className="text-clinical-600">
                        {p.valueDeg !== null
                          ? `${
                              p.basedOnMeasurement.startsWith('무릎 굽힘/폄 각도')
                                ? `완전 신전(180°) 대비 ${Math.round(Math.abs(p.valueDeg - 180) * 10) / 10}°`
                                : `${p.valueDeg}°`
                            } · `
                          : ''}
                        {p.reason}
                      </p>
                      <p className="text-xs text-clinical-400">
                        {p.confidence !== null ? `인식 명확도 ${Math.round(p.confidence * 100)}%` : '인식 명확도 —'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-clinical-500">
                뚜렷한 자세 불균형이 확인되지 않았습니다. 측정된 편차가 크게 두드러지는 영역이 없었습니다.
              </p>
            )}
            <p className="mt-3 text-xs text-clinical-400">측정된 편차가 큰 순서입니다. 의료적 진단 우선순위가 아닙니다.</p>
          </div>

          <div className="card p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="section-badge">02</span>
              <h3 className="text-sm font-semibold text-clinical-900">정면·후면·측면 체형 시각화</h3>
            </div>
            <p className="mb-3 text-xs text-clinical-500">
              배경 그림은 참고용 일러스트이며, 화살표 각도는 실제 사진 측정 결과입니다. 등급·순위는 비교
              데이터베이스가 없어 표시하지 않습니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {captures.front && (
                <div>
                  <p className="label-caption mb-1 text-center">정면</p>
                  <SkeletonDiagram result={results.front} measurements={frontalMeasurements} view="front" />
                </div>
              )}
              {captures.back && (
                <div>
                  <p className="label-caption mb-1 text-center">후면</p>
                  <SkeletonDiagram result={results.back} measurements={backMeasurements} view="back" />
                </div>
              )}
              {captures['side-left'] && (
                <div>
                  <p className="label-caption mb-1 text-center">측면 (좌측)</p>
                  <SkeletonDiagram
                    result={results['side-left']}
                    measurements={sagittalMeasurementsLeft}
                    view="side-left"
                  />
                </div>
              )}
              {captures['side-right'] && (
                <div>
                  <p className="label-caption mb-1 text-center">측면 (우측)</p>
                  <SkeletonDiagram
                    result={results['side-right']}
                    measurements={sagittalMeasurementsRight}
                    view="side-right"
                  />
                </div>
              )}
            </div>
          </div>

          <AssessmentSummaryPanel summary={summary} />
        </div>
      )}

      {/* B. 부위별 정밀 분석 */}
      {tab === 'B' && (
        <div className="space-y-6">
          {captures.front && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">정면 사진 측정 보기</h3>
              <p className="mb-3 text-xs text-clinical-500">
                점선은 기준 수직선이며, 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
              </p>
              <MeasurementOverlay imageDataUrl={captures.front.dataUrl} result={results.front} measurements={frontalMeasurements} />
            </div>
          )}

          {captures.back && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">후면 사진 측정 보기</h3>
              <p className="mb-3 text-xs text-clinical-500">
                점선은 기준 수직선이며, 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
              </p>
              <MeasurementOverlay imageDataUrl={captures.back.dataUrl} result={results.back} measurements={backMeasurements} />
            </div>
          )}

          {captures['side-left'] && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">측면 사진 측정 보기 (좌측)</h3>
              <p className="mb-3 text-xs text-clinical-500">
                점선은 기준 수직선이며, 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
              </p>
              <MeasurementOverlay
                imageDataUrl={captures['side-left'].dataUrl}
                result={results['side-left']}
                measurements={sagittalMeasurementsLeft}
              />
            </div>
          )}

          {captures['side-left'] && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">
                골반·등 기준점 직접 표시 — 좌측 (골반 전후경사 · 등 굽음)
              </h3>
              <ManualSideLandmarkEditor
                imageDataUrl={captures['side-left'].dataUrl}
                value={manualSideLandmarks.left}
                onChange={(next) => setManualSideLandmarks('left', next)}
              />
            </div>
          )}

          {captures['side-right'] && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">측면 사진 측정 보기 (우측)</h3>
              <p className="mb-3 text-xs text-clinical-500">
                점선은 기준 수직선이며, 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
              </p>
              <MeasurementOverlay
                imageDataUrl={captures['side-right'].dataUrl}
                result={results['side-right']}
                measurements={sagittalMeasurementsRight}
              />
            </div>
          )}

          {captures['side-right'] && (
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-clinical-900">
                골반·등 기준점 직접 표시 — 우측 (골반 전후경사 · 등 굽음)
              </h3>
              <ManualSideLandmarkEditor
                imageDataUrl={captures['side-right'].dataUrl}
                value={manualSideLandmarks.right}
                onChange={(next) => setManualSideLandmarks('right', next)}
              />
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-clinical-900">부위별 정밀 분석 (8개 항목)</h3>
            <div className="space-y-4">
              {summary.areaResults.map((r) => (
                <PostureResultCard key={r.area} result={r} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C. 원인 및 관련 근육 평가 */}
      {tab === 'C' && (
        <div className="space-y-6">
          <div className="card p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="section-badge">01</span>
              <h3 className="text-sm font-semibold text-clinical-900">관련 근육을 강조한 참고 그림</h3>
            </div>
            <p className="mb-3 text-xs text-clinical-500">
              측정된 편차가 관찰된 영역만 그림 위에 표시됩니다. 부위를 눌러보면 실제 측정 근거와 인식 명확도,
              참고 근육을 볼 수 있습니다.
            </p>
            <MuscleMapSVG tendencies={muscleTendencies} />
          </div>

          {muscleTendencies.length > 0 && (
            <div className="card p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="section-badge">02</span>
                <h3 className="text-sm font-semibold text-clinical-900">근육 균형 한눈에 보기</h3>
              </div>
              <p className="mb-3 text-xs text-clinical-500">
                측정된 편차가 관찰된 영역에서 참고로 언급되는 근육만 모은 것입니다. 실제로 약하거나 긴장되어
                있다고 확정하는 것이 아니라, 이런 패턴과 함께 흔히 거론되는 근육을 정리한 일반 참고 정보입니다.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-clinical-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-clinical-700">약화된 근육 (강화 참고)</p>
                  {weakMuscleNames.length > 0 ? (
                    <ul className="space-y-1 text-xs text-clinical-600">
                      {weakMuscleNames.map((name) => (
                        <li key={name} className="flex items-center gap-1.5">
                          <span className="legend-dot" style={{ backgroundColor: '#142d3e' }} />
                          {name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-clinical-400">해당 없음</p>
                  )}
                </div>
                <div className="rounded-xl bg-alert-coral/10 p-3">
                  <p className="mb-2 text-xs font-semibold text-alert-red">긴장된 근육 (이완 참고)</p>
                  {tightMuscleNames.length > 0 ? (
                    <ul className="space-y-1 text-xs text-clinical-600">
                      {tightMuscleNames.map((name) => (
                        <li key={name} className="flex items-center gap-1.5">
                          <span className="legend-dot" style={{ backgroundColor: '#c2503c' }} />
                          {name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-clinical-400">해당 없음</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card p-4 text-sm text-clinical-600">
            <div className="mb-2 flex items-center gap-2">
              <span className="section-badge">{muscleTendencies.length > 0 ? '03' : '02'}</span>
              <p className="label-caption">가능한 원인 · 확정된 검사 결과 구분</p>
            </div>
            <p>
              각 부위 카드(B. 부위별 분석)의 "가능한 원인"은 사진 관찰만을 근거로 한 일반 참고 정보이며, 확정된
              검사 결과가 아닙니다. PT가 직접 실시한 근력·가동범위·한 발 서기 검사 등의 결과를 입력하면 그
              내용까지 반영해서 해석하는 기능은 다음 업데이트에서 지원할 예정입니다 (아직 입력 폼이 없습니다).
            </p>
          </div>
        </div>
      )}

      {/* D. 맞춤 운동 */}
      {tab === 'D' && (
        <div className="space-y-6">
          <div className="card p-4 text-sm text-clinical-600">
            <p className="label-caption mb-2">맞춤 운동 프로그램</p>
            <p className="mb-4">
              우선 확인 영역과 각 부위 카드의 "추천 운동"을 근거로, 세트·횟수·주의사항까지 포함된 전체 운동
              프로그램을 생성할 수 있습니다. 운동 동작 이미지는 라이선스가 확인된 자료를 아직 확보하지 못해
              텍스트 설명으로 제공되며, 이미지가 들어갈 자리는 준비해두었습니다.
            </p>
            <button onClick={() => navigate('/program')} className="btn-primary w-full py-4 text-base">
              운동 프로그램 생성
            </button>
          </div>
          <button onClick={() => navigate('/report')} className="btn-secondary w-full py-3">
            리포트 보기 / PDF 저장
          </button>
        </div>
      )}

      {/* E. 변화 비교 및 기록 */}
      {tab === 'E' && (
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold text-clinical-900">Before / After 비교</h3>
          {beforeSummary ? (
            <>
              <p className="mb-3 text-xs text-clinical-500">
                Before 저장 시각: {new Date(beforeSummary.generatedAt).toLocaleString('ko-KR')}
              </p>
              <p className="mb-3 text-xs text-clinical-400">
                같은 촬영 조건(각도·거리·자세)에서 찍었는지에 따라 오차가 달라질 수 있어, 비교 화면의 변화량은
                참고용으로만 확인해주세요.
              </p>
              <button onClick={() => navigate('/compare')} className="btn-secondary w-full py-2 text-sm">
                지금 결과와 비교 보기
              </button>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs text-clinical-500">
                이 결과를 Before로 저장해두면, 운동 프로그램 수행 후 다시 촬영했을 때 변화를 비교할 수 있습니다.
              </p>
              <button onClick={() => saveAsBefore(summary, captures, results)} className="btn-secondary w-full py-2 text-sm">
                이 결과를 Before로 저장
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
