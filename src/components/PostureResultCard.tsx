import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatMeasurementValue } from '@/assessment/angleCalculations'
import { ANATOMY_FILE, AREA_DISPLAY_LABEL } from '@/assessment/areaReport'
import AnatomyImage from '@/components/AnatomyImage'
import IllustrationSlot from '@/components/IllustrationSlot'
import { AREA_EDUCATION } from '@/data/postureEducation'
import LibrarySuggestions from '@/components/LibrarySuggestions'
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

function confidenceColor(conf: number | null) {
  if (conf === null) return 'text-clinical-400'
  if (conf >= 0.7) return 'text-clinical-600'
  if (conf >= 0.4) return 'text-alert-amber'
  return 'text-alert-red'
}

/** 영역별로 "이런 추가 검사가 도움이 될 수 있다"를 안내하는 일반 참고 문구. 특정 환자에 대한 처방이 아니라
 *  일반적으로 해당 영역을 더 정확히 보려면 흔히 쓰이는 검사 종류를 알려주는 수준이다(자체 작성). */
const FURTHER_TEST_NOTE: Record<Area, string> = {
  '머리/목': '심부목굴곡근 지구력 검사(craniocervical flexion test), 경추 가동범위 검사',
  어깨: '견갑골 가동성 검사, 회전근개 근력검사, 흉추 가동성 검사',
  '허리/몸통': '요추 가동범위 검사, 코어(복횡근·다열근) 안정성 검사',
  골반: 'ASIS/PSIS 직접 촉진, 한 발 서기 검사(트렌델렌버그 징후 확인)',
  무릎: '한 발 서기·스쿼트 시 무릎 정렬 관찰, 고관절 근력 검사',
  발: '발 아치 평가(navicular drop test), 보행 분석'
}

/** 골반은 2D 사진만으로 판단할 수 없는 항목(회전·이동)이 있어, 지어내지 않고 항상 "추가 촬영/PT 검사 필요"로 고정 표시한다. */
const PELVIS_UNMEASURABLE = [
  {
    label: '골반 좌우 회전',
    note: '2D 정면·후면 사진만으로는 골반의 수평면 회전을 확정할 수 없습니다. 추가 촬영(상방 뷰) 또는 PT의 직접 검사가 필요합니다.'
  },
  {
    label: '골반 좌우 이동 (측방 이동)',
    note: '2D 사진만으로는 좌우 이동 여부를 구분하기 어렵습니다. PT의 직접 검사가 필요합니다.'
  }
]

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-clinical-900">
        <span className="w-4 text-mint-600 tabular-nums">{n}</span>
        {title}
      </h4>
      <div className="pl-6 text-sm leading-relaxed text-clinical-600">{children}</div>
    </section>
  )
}

interface Props {
  result: AreaAssessmentResult
  /** true면 카드 테두리·제목 없이 상세 영역 본문만 그린다 (부위별 리스트의 펼침 영역에서 사용). */
  embedded?: boolean
}

/** 부위 하나의 상세 정보: 1 측정값 · 2 좌우 비대칭/정렬 방향 · 3 참고 기준 · 4 관찰된 특징 · 5 가능한 원인 · 6 추가 검사 · 7 관련 근육 · 8 추천 운동 · 9 관련 근육 표시 */
export default function PostureResultCard({ result, embedded = false }: Props) {
  const navigate = useNavigate()
  const hasData = result.measurements.some((m) => m.valueDeg !== null || m.direction !== null)
  const edu = AREA_EDUCATION[result.area]
  const label = AREA_DISPLAY_LABEL[result.area]

  const tightMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.tightMuscles ?? [])))
  const weakMuscles = Array.from(new Set(edu.commonPatterns.flatMap((p) => p.weakMuscles ?? [])))

  const unmeasured = result.measurements.filter((m) => m.valueDeg === null && m.direction === null)
  const lowClarity = result.confidence !== null && result.confidence < 0.5
  const needsFurther = result.area === '골반' || unmeasured.length > 0 || lowClarity

  const body = (
    <div className="space-y-6">
      {!hasData && <p className="text-sm text-clinical-400">측정 불확실 — 관련 사진 또는 landmark 인식이 필요합니다.</p>}

      {hasData && (
        <>
          {/* 1. 측정값 */}
          <Section n={1} title="측정값">
            <ul className="space-y-2">
              {result.measurements.map((m) => (
                <li key={m.id} className="flex flex-col">
                  <span className="font-medium text-clinical-800">{m.label}</span>
                  {m.valueDeg !== null ? (
                    <span>{formatMeasurementValue(m)}</span>
                  ) : m.direction ? (
                    <span className="text-clinical-500">각도가 아닌 비율·방향으로만 측정됨 (2번 참고)</span>
                  ) : (
                    <span className="text-clinical-400">
                      측정 불확실{m.unavailableReason ? ` (${m.unavailableReason})` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <IllustrationSlot
                src={LANDMARK_ILLUSTRATION[result.area]}
                label={`${label} 측정 기준점`}
                caption="측정값을 계산할 때 기준으로 삼는 지점을 보여주는 참고 그림입니다"
                aspect="16/9"
              />
            </div>
          </Section>

          {/* 2. 좌우 비대칭 · 정렬 방향 */}
          <Section n={2} title="좌우 비대칭 · 정렬 방향">
            {result.measurements.some((m) => m.direction) ? (
              <ul className="space-y-2">
                {result.measurements
                  .filter((m) => m.direction)
                  .map((m) => (
                    <li key={m.id} className="flex flex-col">
                      <span className="font-medium text-clinical-800">{m.label}</span>
                      <span>{m.direction}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-clinical-400">방향을 판단할 수 있는 측정값이 없습니다.</p>
            )}

            {result.area === '골반' && (
              <div className="mt-4">
                <ul className="space-y-2">
                  {PELVIS_UNMEASURABLE.map((p) => (
                    <li key={p.label} className="flex flex-col">
                      <span className="font-medium text-clinical-800">{p.label}</span>
                      <span className="text-alert-red">추가 촬영/PT 검사 필요</span>
                      <span className="text-clinical-500">{p.note}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <IllustrationSlot
                    src={pelvisTiltImg}
                    label="골반 전후 경사"
                    caption="개념 이해용 참고 그림"
                    aspect="4/3"
                  />
                  <IllustrationSlot
                    src={pelvisRotationImg}
                    label="골반 회전"
                    caption="현재 2D 촬영으로는 확정할 수 없는 항목의 개념 설명용 그림"
                    aspect="4/3"
                  />
                </div>
              </div>
            )}
          </Section>

          {/* 3. 참고 기준 */}
          <Section n={3} title="참고 기준">
            <p className="text-clinical-500">
              모든 사람에게 통용되는 단일 &quot;정상 범위&quot;로 단정할 만한 근거가 명확하지 않아, 이 앱에서는
              특정 수치 기준을 표시하지 않습니다. 변화 추이는 본인의 이전 측정값과 비교하는 것을 권장합니다
              (E. 변화 비교 참고).
            </p>
          </Section>

          {/* 4. 관찰된 특징 */}
          <Section n={4} title="관찰된 특징">
            <p>{result.observation}</p>
          </Section>

          {/* 5. 가능한 원인 */}
          <Section n={5} title="가능한 원인 (일반 참고 · 확진 아님)">
            {edu.commonPatterns.length > 0 ? (
              <ul className="space-y-2">
                {edu.commonPatterns.map((p) => (
                  <li key={p.name}>
                    <span className="font-medium text-clinical-700">{p.name}</span> — {p.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-clinical-400">등록된 참고 패턴이 없습니다.</p>
            )}
          </Section>

          {/* 6. 추가 검사 필요 여부 */}
          <Section n={6} title="추가 검사 필요 여부">
            <p className={needsFurther ? 'font-semibold text-alert-red' : 'font-semibold text-clinical-700'}>
              {needsFurther ? '추가 촬영 또는 PT 검사를 권장합니다' : '사진 기준으로는 필수는 아니며, 정밀 확인용 참고 검사입니다'}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-clinical-500">
              {result.area === '골반' && <li>골반 회전·좌우 이동은 2D 촬영으로 확정할 수 없습니다</li>}
              {unmeasured.length > 0 && <li>측정 불확실 항목 {unmeasured.length}개 — 재촬영 또는 직접 측정이 필요합니다</li>}
              {lowClarity && <li>인식 명확도가 낮아 결과를 참고로만 봐주세요</li>}
              <li>참고 검사: {FURTHER_TEST_NOTE[result.area]}</li>
            </ul>
          </Section>

          {/* 7. 관련 근육 */}
          <Section n={7} title="관련 근육 (일반 참고)">
            {tightMuscles.length > 0 && (
              <p>
                <span className="font-medium text-alert-red">긴장(단축) 경향</span> {tightMuscles.join(', ')}
              </p>
            )}
            {weakMuscles.length > 0 && (
              <p className="mt-1">
                <span className="font-medium text-clinical-800">약화(저활성) 경향</span> {weakMuscles.join(', ')}
              </p>
            )}
            {tightMuscles.length === 0 && weakMuscles.length === 0 && (
              <p className="text-clinical-400">등록된 참고 근육이 없습니다.</p>
            )}
            <p className="mt-2 text-xs text-clinical-400">
              이 패턴과 함께 흔히 언급되는 근육을 참고로 보여드리는 것이며, 실제 근육 상태를 확정하지 않습니다.
              PT의 근력·가동범위 검사 결과를 입력하는 기능은 다음 업데이트에서 지원할 예정입니다.
            </p>
          </Section>

          {/* 8. 추천 운동 */}
          <Section n={8} title="추천 운동">
            <LibrarySuggestions area={result.area} areaLabel={label} />
            <button onClick={() => navigate('/program')} className="mt-3 block text-sm font-semibold text-mint-700 underline">
              전체 운동 프로그램 만들기
            </button>
          </Section>
        </>
      )}

      {/* 9. 관련 근육 표시 — 측정 데이터와 무관하게 항상 표시 (이미지가 없으면 플레이스홀더) */}
      <Section n={9} title="관련 근육 표시">
        <AnatomyImage
          key={result.area}
          file={ANATOMY_FILE[result.area]}
          label={`${label} 근육 해부도`}
          caption="위치 참고용 그림이며, 실제 근력·유연성 상태를 나타내지 않습니다"
        />
      </Section>

      <p className="border-t border-clinical-100 pt-3 text-xs text-clinical-400">
        인식 명확도는 landmark가 얼마나 또렷하게 인식됐는지를 뜻하며 진단의 확실성이 아닙니다. 측정되지 않은 항목은
        임의로 채우지 않고 &quot;측정 불확실&quot;로 표시하며, 가능한 원인·관련 근육은 확진이 아닌 일반 참고 정보입니다.
      </p>
    </div>
  )

  if (embedded) return body

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-clinical-900">{label}</h3>
        <span className={`text-sm font-medium ${confidenceColor(result.confidence)}`}>
          {result.confidence !== null ? `인식 명확도 ${Math.round(result.confidence * 100)}%` : '인식 명확도 —'}
        </span>
      </div>
      {body}
    </div>
  )
}
