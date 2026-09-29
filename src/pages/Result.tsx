import { useEffect, useMemo } from 'react'
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

/** 결과 화면을 4개 번호 섹션으로 구분해서 보여주기 위한 작은 헤더 */
function SectionHeader({ no, title }: { no: string; title: string }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2 first:mt-0">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-clinical-700 text-xs font-bold text-white">
        {no}
      </span>
      <h2 className="text-base font-semibold text-clinical-900">{title}</h2>
    </div>
  )
}

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

  const summary = useMemo(() => runAssessment(results, manualSideLandmarks), [results, manualSideLandmarks])
  const sagittalMeasurementsLeft = useMemo(
    () => extractMeasurements(summary, SAGITTAL_MEASUREMENT_IDS_LEFT),
    [summary]
  )
  const sagittalMeasurementsRight = useMemo(
    () => extractMeasurements(summary, SAGITTAL_MEASUREMENT_IDS_RIGHT),
    [summary]
  )
  const frontalMeasurements = useMemo(
    () => extractMeasurements(summary, FRONTAL_MEASUREMENT_IDS),
    [summary]
  )
  const backMeasurements = useMemo(
    () => extractMeasurements(summary, BACK_MEASUREMENT_IDS),
    [summary]
  )

  const anyAnalyzed = Object.values(results).some((r) => r && r.landmarks.length > 0)
  const muscleTendencies = useMemo(() => computeMuscleTendencies(summary), [summary])

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
      <p className="mb-6 text-sm text-clinical-600">
        아래 내용은 자세 스크리닝 참고 정보이며, 통증의 원인을 확정하거나 질환을 진단하지 않습니다.
      </p>

      {!captures['side-left'] && !captures['side-right'] && (
        <div className="mb-4 rounded-lg bg-clinical-100 p-3 text-xs text-clinical-600">
          측면 사진이 없어 머리·몸통·무릎의 전후 정렬 지표는 계산되지 않았습니다.
        </div>
      )}

      <SectionHeader no="01" title="근육 평가" />
      <div className="card mb-6 p-4">
        <p className="mb-3 text-xs text-clinical-500">
          측정된 편차가 관찰된 영역만 그림 위에 표시됩니다. 부위를 눌러보면 실제 측정 근거와 신뢰도, 참고 근육을
          볼 수 있습니다.
        </p>
        <MuscleMapSVG tendencies={muscleTendencies} />
      </div>

      <SectionHeader no="02" title="자세 정렬 분석" />
      <div className="card mb-6 p-4">
        <h3 className="mb-1 text-sm font-semibold text-clinical-900">체형 분석 요약 (뼈대 그림)</h3>
        <p className="mb-3 text-xs text-clinical-500">
          배경 그림은 참고용 일러스트이며, 화살표의 각도는 실제 사진 측정 결과와 같은 값입니다. 등급·순위는 비교
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
              <SkeletonDiagram result={results['side-left']} measurements={sagittalMeasurementsLeft} view="side-left" />
            </div>
          )}
          {captures['side-right'] && (
            <div>
              <p className="label-caption mb-1 text-center">측면 (우측)</p>
              <SkeletonDiagram result={results['side-right']} measurements={sagittalMeasurementsRight} view="side-right" />
            </div>
          )}
        </div>
      </div>

      {captures.front && (
        <div className="card mb-6 p-4">
          <h3 className="mb-1 text-sm font-semibold text-clinical-900">정면 사진 측정 보기</h3>
          <p className="mb-3 text-xs text-clinical-500">
            점선은 기준이 되는 수직선이며, 색상이 있는 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
          </p>
          <MeasurementOverlay
            imageDataUrl={captures.front.dataUrl}
            result={results.front}
            measurements={frontalMeasurements}
          />
        </div>
      )}

      {captures.back && (
        <div className="card mb-6 p-4">
          <h3 className="mb-1 text-sm font-semibold text-clinical-900">후면 사진 측정 보기</h3>
          <p className="mb-3 text-xs text-clinical-500">
            점선은 기준이 되는 수직선이며, 색상이 있는 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
          </p>
          <MeasurementOverlay
            imageDataUrl={captures.back.dataUrl}
            result={results.back}
            measurements={backMeasurements}
          />
        </div>
      )}

      <div className="mb-6">
        <AssessmentSummaryPanel summary={summary} />
      </div>

      <SectionHeader no="03" title="주요 자세 문제" />
      <div className="card mb-6 p-4">
        {summary.priorityAreas.length > 0 ? (
          <>
            <h3 className="mb-3 text-sm font-semibold text-clinical-900">우선 확인 영역</h3>
            <p className="mb-3 text-xs text-clinical-500">
              측정된 편차가 큰 순서로 정렬했습니다. 의료적 진단 우선순위가 아닙니다.
            </p>
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
                      {p.valueDeg !== null ? `${p.valueDeg}° · ` : ''}
                      {p.reason}
                    </p>
                    <p className="text-xs text-clinical-400">
                      {p.confidence !== null ? `신뢰도 ${Math.round(p.confidence * 100)}%` : '신뢰도 —'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-sm text-clinical-500">
            뚜렷한 자세 불균형이 확인되지 않았습니다. 측정된 편차가 크게 두드러지는 영역이 없었습니다.
          </p>
        )}
      </div>

      {captures['side-left'] && (
        <div className="card mb-6 p-4">
          <h3 className="mb-1 text-sm font-semibold text-clinical-900">측면 사진 측정 보기 (좌측)</h3>
          <p className="mb-3 text-xs text-clinical-500">
            점선은 기준이 되는 수직선이며, 색상이 있는 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
          </p>
          <MeasurementOverlay
            imageDataUrl={captures['side-left'].dataUrl}
            result={results['side-left']}
            measurements={sagittalMeasurementsLeft}
          />
        </div>
      )}

      {captures['side-left'] && (
        <div className="card mb-6 p-4">
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
        <div className="card mb-6 p-4">
          <h3 className="mb-1 text-sm font-semibold text-clinical-900">측면 사진 측정 보기 (우측)</h3>
          <p className="mb-3 text-xs text-clinical-500">
            점선은 기준이 되는 수직선이며, 색상이 있는 점과 라벨은 실제로 인식된 관절 위치를 기준으로 표시됩니다.
          </p>
          <MeasurementOverlay
            imageDataUrl={captures['side-right'].dataUrl}
            result={results['side-right']}
            measurements={sagittalMeasurementsRight}
          />
        </div>
      )}

      {captures['side-right'] && (
        <div className="card mb-6 p-4">
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

      <SectionHeader no="04" title="개선이 필요한 부분" />
      <div className="space-y-4">
        {summary.areaResults.map((r) => (
          <PostureResultCard key={r.area} result={r} />
        ))}
      </div>

      <div className="card mt-6 p-4">
        <h3 className="mb-2 text-sm font-semibold text-clinical-900">Before / After 비교</h3>
        {beforeSummary ? (
          <>
            <p className="mb-3 text-xs text-clinical-500">
              Before 저장 시각: {new Date(beforeSummary.generatedAt).toLocaleString('ko-KR')}
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
            <button
              onClick={() => saveAsBefore(summary, captures, results)}
              className="btn-secondary w-full py-2 text-sm"
            >
              이 결과를 Before로 저장
            </button>
          </>
        )}
      </div>

      <button onClick={() => navigate('/program')} className="btn-primary mt-6 w-full py-4 text-base">
        운동 프로그램 생성
      </button>
      <button onClick={() => navigate('/report')} className="btn-secondary mt-3 w-full py-3">
        리포트 보기 / PDF 저장
      </button>
    </div>
  )
}
