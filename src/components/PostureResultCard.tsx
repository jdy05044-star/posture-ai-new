import { useNavigate } from 'react-router-dom'
import { formatMeasurementValue } from '@/assessment/angleCalculations'
import { AREA_EDUCATION } from '@/data/postureEducation'
import { findExercisesByArea } from '@/exercises/exerciseLibrary'
import IllustrationSlot from '@/components/IllustrationSlot'
import muscleHeadNeck from '@/assets/muscles/muscle-head-neck.png'
import muscleShoulder from '@/assets/muscles/muscle-shoulder.png'
import muscleLowerBackTorso from '@/assets/muscles/muscle-lower-back-torso.png'
import musclePelvis from '@/assets/muscles/muscle-pelvis.png'
import muscleKnee from '@/assets/muscles/muscle-knee.png'
import muscleFoot from '@/assets/muscles/muscle-foot.png'
import pelvisRotationImg from '@/assets/pelvis-rotation.png'
import pelvisTiltImg from '@/assets/pelvis-tilt.png'
import landmarksUpper from '@/assets/landmarks-upper.png'
import landmarksPelvis from '@/assets/landmarks-pelvis.png'
import landmarksLower from '@/assets/landmarks-lower.png'
import type { AreaAssessmentResult } from '@/types'

/** 영역별 근육 해부도. 사용자가 직접 생성한 참고용 일러스트로, 실제 측정된 근육 상태가 아니라
 *  해당 영역에서 흔히 언급되는 근육의 위치를 보여주는 참고 그림이다. */
const MUSCLE_ILLUSTRATION: Record<AreaAssessmentResult['area'], string> = {
  '머리/목': muscleHeadNeck,
  어깨: muscleShoulder,
  '허리/몸통': muscleLowerBackTorso,
  골반: musclePelvis,
  무릎: muscleKnee,
  발: muscleFoot
}

/** 영역별로 "측정값이 어느 지점을 기준으로 계산됐는지"를 보여주는 참고용 기준점 그림.
 *  사용자가 직접 생성한 이미지이며, 실제 측정값이 아니라 위치 이해를 돕는 참고 자료다. */
const LANDMARK_ILLUSTRATION: Record<AreaAssessmentResult['area'], string> = {
  '머리/목': landmarksUpper,
  어깨: landmarksUpper,
  '허리/몸통': landmarksUpper,
  골반: landmarksPelvis,
  무릎: landmarksLower,
  발: landmarksLower
}

function confidenceColor(conf: number | null) {
  if (conf === null) return 'text-clinical-400'
  if (conf >= 0.7) return 'text-clinical-600'
  if (conf >= 0.4) return 'text-alert-amber'
  return 'text-alert-red'
}

/** 영역별로 "이런 추가 검사가 도움이 될 수 있다"를 안내하는 일반 참고 문구. 특정 환자에 대한 처방이 아니라
 *  일반적으로 해당 영역을 더 정확히 보려면 흔히 쓰이는 검사 종류를 알려주는 수준이다(자체 작성). */
const FURTHER_TEST_NOTE: Record<AreaAssessmentResult['area'], string> = {
  '머리/목': '심부목굴곡근 지구력 검사(craniocervical flexion test), 경추 가동범위 검사',
  어깨: '견갑골 가동성 검사, 회전근개 근력검사, 흉추 가동성 검사',
  '허리/몸통': '요추 가동범위 검사, 코어(복횡근·다열근) 안정성 검사',
  골반: 'ASIS/PSIS 직접 촉진, 한 발 서기 검사(트렌델렌버그 징후 확인)',
  무릎: '한 발 서기·스쿼트 시 무릎 정렬 관찰, 고관절 근력 검사',
  발: '발 아치 평가(navicular drop test), 보행 분석'
}

/** 골반은 2D 사진만으로 판단할 수 없는 항목(회전·이동)이 있어, 지어내지 않고 항상 "측정 불가"로 고정 표시한다. */
const PELVIS_UNMEASURABLE = [
  {
    label: '골반 좌우 회전',
    note: '2D 정면·후면 사진만으로는 골반의 수평면 회전을 신뢰성 있게 판단할 수 없습니다. 추가 촬영(상방 뷰) 또는 PT의 직접 평가가 필요합니다.'
  },
  {
    label: '골반 좌우 이동 (측방 이동)',
    note: '같은 이유로 2D 사진만으로는 좌우 이동 여부를 정확히 구분하기 어렵습니다. PT의 직접 평가를 권장합니다.'
  }
]

export default function PostureResultCard({ result }: { result: AreaAssessmentResult }) {
  const navigate = useNavigate()
  const hasData = result.measurements.some((m) => m.valueDeg !== null || m.direction !== null)
  const edu = AREA_EDUCATION[result.area]
  const exercises = findExercisesByArea(result.area).slice(0, 3)

  const tightMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.tightMuscles ?? [])))
  const weakMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.weakMuscles ?? [])))

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-clinical-900">{result.area}</h3>
        <span className={`text-xs font-medium ${confidenceColor(result.confidence)}`}>
          {result.confidence !== null ? `인식 명확도 ${Math.round(result.confidence * 100)}%` : '인식 명확도 —'}
        </span>
      </div>

      {!hasData && (
        <p className="mb-3 text-sm text-clinical-400">측정 불확실 — 관련 사진 또는 landmark 인식이 필요합니다.</p>
      )}

      {hasData && (
        <div className="space-y-4 text-sm">
          {/* 1. 측정값 + 2. 좌우 비대칭(방향) */}
          <div>
            <p className="label-caption mb-1.5">측정값 · 좌우 비대칭</p>
            <ul className="space-y-1.5">
              {result.measurements.map((m) => (
                <li key={m.id} className="flex flex-col">
                  <span className="font-medium text-clinical-800">{m.label}</span>
                  {m.valueDeg !== null ? (
                    <span className="text-clinical-600">
                      {formatMeasurementValue(m)} — {m.direction}
                    </span>
                  ) : m.direction ? (
                    <span className="text-clinical-600">{m.direction}</span>
                  ) : (
                    <span className="text-clinical-400">
                      측정 불확실{m.unavailableReason ? ` (${m.unavailableReason})` : ''}
                    </span>
                  )}
                </li>
              ))}
              {result.area === '골반' &&
                PELVIS_UNMEASURABLE.map((p) => (
                  <li key={p.label} className="flex flex-col">
                    <span className="font-medium text-clinical-800">{p.label}</span>
                    <span className="text-clinical-400">측정 불가 — {p.note}</span>
                  </li>
                ))}
            </ul>
            <div className="mt-3">
              <IllustrationSlot
                src={LANDMARK_ILLUSTRATION[result.area]}
                label={`${result.area} 측정 기준점`}
                caption="위 측정값을 계산할 때 기준으로 삼는 지점을 보여주는 참고 그림입니다"
                aspect="16/9"
              />
            </div>
            {result.area === '골반' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <IllustrationSlot
                  src={pelvisTiltImg}
                  label="골반 전후 경사"
                  caption="위 측정값은 실제 사진 기반, 그림은 개념 이해용 참고 자료입니다"
                  aspect="4/3"
                />
                <IllustrationSlot
                  src={pelvisRotationImg}
                  label="골반 회전 (측정 불가)"
                  caption="현재 2D 사진으로는 측정되지 않는 항목의 개념 설명용 그림입니다"
                  aspect="4/3"
                />
              </div>
            )}
          </div>

          {/* 3. 참고 기준 */}
          <div>
            <p className="label-caption mb-1">근거가 있는 참고 기준</p>
            <p className="text-xs text-clinical-400">
              모든 사람에게 통용되는 단일 "정상 범위"로 단정할 만한 근거가 명확하지 않아, 이 앱에서는 특정 수치
              기준을 표시하지 않습니다. 변화 추이는 본인의 이전 측정값과 비교하는 것을 권장합니다 (아래 "변화
              비교" 참고).
            </p>
          </div>

          {/* 4. 관찰된 특징 */}
          <div>
            <p className="label-caption mb-1">관찰된 특징</p>
            <p className="text-clinical-600">{result.observation}</p>
          </div>

          {/* 5. 가능한 원인 (일반 참고, 확진 아님) */}
          {edu.commonPatterns.length > 0 && (
            <div>
              <p className="label-caption mb-1">가능한 원인 (일반 참고 · 확진 아님)</p>
              <ul className="space-y-1">
                {edu.commonPatterns.map((p) => (
                  <li key={p.name} className="text-clinical-600">
                    <span className="font-medium text-clinical-700">{p.name}</span> — {p.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. 추가 검사 */}
          <div>
            <p className="label-caption mb-1">추가 기능 검사가 필요한 항목</p>
            <p className="text-clinical-600">{FURTHER_TEST_NOTE[result.area]}</p>
          </div>

          {/* 7. 관련 근육 */}
          {(tightMuscles.length > 0 || weakMuscles.length > 0) && (
            <div>
              <p className="label-caption mb-1">관련 근육 (일반 참고)</p>
              {tightMuscles.length > 0 && (
                <p className="text-xs">
                  <span className="font-medium text-alert-red">긴장(단축) 경향</span>{' '}
                  <span className="text-clinical-600">{tightMuscles.join(', ')}</span>
                </p>
              )}
              {weakMuscles.length > 0 && (
                <p className="text-xs">
                  <span className="font-medium text-clinical-700">약화(저활성) 경향</span>{' '}
                  <span className="text-clinical-600">{weakMuscles.join(', ')}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-clinical-400">
                실제 이 근육에 문제가 있다고 확정하는 것이 아니라, 이 패턴과 함께 흔히 언급되는 근육을 참고로
                보여드리는 것입니다. 정확한 근력·유연성 평가는 PT의 직접 평가가 필요합니다. 기능 검사 결과를
                입력하는 기능은 다음 업데이트에서 지원할 예정입니다.
              </p>
              <div className="mt-2">
                <IllustrationSlot
                  src={MUSCLE_ILLUSTRATION[result.area]}
                  label={`${result.area} 근육 해부도`}
                  caption="실제 근력·유연성 상태가 아닌 위치 참고용 그림입니다"
                  aspect="4/3"
                />
              </div>
            </div>
          )}

          {/* 8. 추천 운동 */}
          <div>
            <p className="label-caption mb-1">추천 운동</p>
            {exercises.length > 0 ? (
              <>
                <ul className="mb-2 space-y-0.5 text-clinical-600">
                  {exercises.map((ex) => (
                    <li key={ex.id}>· {ex.name}</li>
                  ))}
                </ul>
                <div className="mb-2 grid grid-cols-3 gap-2">
                  {exercises.map((ex) => (
                    <IllustrationSlot key={ex.id} label={ex.name} caption="운동 동작" aspect="1/1" />
                  ))}
                </div>
                <button onClick={() => navigate('/program')} className="text-xs font-medium text-mint-700 underline">
                  전체 운동 프로그램 생성하러 가기
                </button>
              </>
            ) : (
              <p className="text-clinical-400">이 영역에 매칭되는 운동이 아직 라이브러리에 없습니다.</p>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 border-t border-clinical-100 pt-3 text-[10px] text-clinical-400">
        이 카드는 사진 기반 참고 정보입니다. 측정되지 않은 항목은 임의로 채우지 않고 "측정 불확실/측정 불가"로
        표시하며, 가능한 원인·관련 근육은 확진이 아닌 일반 참고 정보입니다.
      </p>
    </div>
  )
}
