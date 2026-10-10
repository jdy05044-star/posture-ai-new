import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BACK_MEASUREMENT_IDS,
  extractMeasurements,
  FRONTAL_MEASUREMENT_IDS,
  SAGITTAL_MEASUREMENT_IDS_LEFT,
  SAGITTAL_MEASUREMENT_IDS_RIGHT
} from '@/assessment/angleCalculations'
import { buildAreaReportRows } from '@/assessment/areaReport'
import { runAssessment } from '@/assessment/assessmentEngine'
import AnatomyViewer from '@/components/AnatomyViewer'
import AreaReportList from '@/components/AreaReportList'
import CauseMusclePanel from '@/components/CauseMusclePanel'
import DisclaimerNote from '@/components/DisclaimerNote'
import ExercisePanel from '@/components/ExercisePanel'
import ManualFrontLandmarkEditor from '@/components/ManualFrontLandmarkEditor'
import ManualSideLandmarkEditor from '@/components/ManualSideLandmarkEditor'
import MeasurementOverlay from '@/components/MeasurementOverlay'
import ReportSummary from '@/components/ReportSummary'
import SkeletonDiagram from '@/components/SkeletonDiagram'
import { useAppState } from '@/state/AppState'

type TabId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

const TABS: { id: TabId; label: string }[] = [
  { id: 'A', label: '종합 평가' },
  { id: 'B', label: '측정 근거' },
  { id: 'C', label: '원인·근육' },
  { id: 'D', label: '맞춤 운동' },
  { id: 'E', label: '변화 비교' },
  { id: 'F', label: '해부도' }
]

export default function Result() {
  const {
    results,
    captures,
    beforeSummary,
    saveAsBefore,
    setLatestSummary,
    manualSideLandmarks,
    setManualSideLandmarks,
    manualFrontLandmarks,
    setManualFrontLandmarks,
    muscleAssessments,
    addMuscleAssessment,
    removeMuscleAssessment
  } = useAppState()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('A')

  const summary = useMemo(() => runAssessment(results, manualSideLandmarks, manualFrontLandmarks), [results, manualSideLandmarks, manualFrontLandmarks])
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

  const reportRows = useMemo(() => buildAreaReportRows(summary), [summary])

  const anyAnalyzed = Object.values(results).some((r) => r && r.landmarks.length > 0)

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
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-2xl">
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
          <ReportSummary
            summary={summary}
            rows={reportRows}
            hasSidePhoto={!!captures['side-left'] || !!captures['side-right']}
          />

          <AreaReportList rows={reportRows} />

          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="t-section">체형 시각화 <span className="t-meta font-normal">· 각도는 실제 측정값</span></h3>
            </div>
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
          <DisclaimerNote />
        </div>
      )}

      {/* B. 측정 근거 (사진 위 측정 표시 · 기준점 직접 표시) — 부위별 상세는 A의 리스트에서 펼쳐 본다 */}
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

          {captures.front && (
            <div className="card p-4">
              <h3 className="t-section mb-1">ASIS 직접 표시 — 정면 (좌우 ASIS 높이 차이)</h3>
              <ManualFrontLandmarkEditor
                imageDataUrl={captures.front.dataUrl}
                value={manualFrontLandmarks}
                onChange={setManualFrontLandmarks}
              />
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
        </div>
      )}

      {/* C. 원인·근육 */}
      {tab === 'C' && <CauseMusclePanel summary={summary} onGoExercises={() => setTab('D')} />}

      {/* D. 맞춤 운동 */}
      {tab === 'D' && <ExercisePanel summary={summary} />}

      {/* F. 해부학 모델 (Skeleton / Muscle) */}
      {tab === 'F' && (
        <AnatomyViewer
          summary={summary}
          assessments={muscleAssessments}
          onAddAssessment={addMuscleAssessment}
          onRemoveAssessment={removeMuscleAssessment}
        />
      )}

      {/* E. 변화 비교 및 기록 */}
      {tab === 'E' && (
        <div className="space-y-6">
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

        <div className="card p-4">
          <h3 className="t-section mb-1">측정 오차 확인</h3>
          <p className="t-meta mb-3">같은 사람을 여러 번 찍어 이 앱의 측정 오차를 구하면, 전/후 변화가 오차보다 큰지 비교할 수 있습니다.</p>
          <button onClick={() => navigate('/repeat')} className="btn-secondary w-full py-2 text-sm">
            반복 촬영으로 오차 확인
          </button>
        </div>
        </div>
      )}
    </div>
  )
}
