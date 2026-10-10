import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREA_DISPLAY_LABEL } from '@/assessment/areaReport'
import { computeMuscleTendencies } from '@/assessment/muscleTendency'
import DisclaimerNote from '@/components/DisclaimerNote'
import ExerciseCard, { type ExerciseCardData } from '@/components/ExerciseCard'
import { pickTodayExercises } from '@/exercises/todayPicks'
import { approvedLibraryExercises, isLibraryExercise } from '@/exercises/unified'
import ExerciseImageSlot from '@/library/ExerciseImageSlot'
import { useResolvedImages } from '@/library/exerciseImages'
import { LIBRARY_EXERCISES } from '@/library/libraryData'
import { suggestLibraryExercises } from '@/library/libraryRecommend'
import { OVERLAY_KEY, usePersistentRecord } from '@/library/libraryStorage'
import type { ExerciseOverlay } from '@/library/types'
import type { AssessmentSummary, Exercise, ObservationArea } from '@/types'

interface Props {
  summary: AssessmentSummary
}

function repsText(ex: Exercise): string | null {
  if (ex.repetitions) return `${ex.repetitions}회`
  return ex.duration ?? null
}

/**
 * D. 맞춤 운동 탭.
 *  1) 오늘의 추천 운동 3개 — 앱 기본 운동(세트·횟수·강도가 원본에 있음)
 *  2) 부위별 라이브러리 운동 — "PT 검수 전 · 참고용"과 "PT 승인"을 구분. 난이도는 원본에 없으므로 "미표기".
 * 값이 없으면 채우지 않고 "미표기"로 둔다.
 */
export default function ExercisePanel({ summary }: Props) {
  const navigate = useNavigate()
  const overlays = usePersistentRecord<ExerciseOverlay>(OVERLAY_KEY)
  const images = useResolvedImages(LIBRARY_EXERCISES)

  const tendencies = useMemo(() => computeMuscleTendencies(summary), [summary])
  const areas = useMemo(() => Array.from(new Set(summary.priorityAreas.map((p) => p.area))), [summary])
  const approvedExtras = useMemo(() => approvedLibraryExercises(overlays.data), [overlays.data])
  const picks = useMemo(() => pickTodayExercises(areas, 3, approvedExtras), [areas, approvedExtras])
  const [picked, setPicked] = useState<ObservationArea | null>(null)
  const area = picked ?? areas[0] ?? null

  /** 앱 기본 운동에는 근육 필드가 없어, 해당 부위의 일반 참고 근육을 보여준다 (부위 일반 참고). */
  function musclesForArea(a: ObservationArea | null): string[] {
    const t = tendencies.find((x) => x.area === a)
    return t ? Array.from(new Set([...t.tightMuscles, ...t.weakMuscles])) : []
  }

  const todayCards: ExerciseCardData[] = picks.map(({ exercise: ex, area: a }, i) => {
    const fromLibrary = isLibraryExercise(ex)
    return {
      rank: i + 1,
      name: ex.name,
      purpose: ex.purpose,
      // 라이브러리 운동은 원본의 대상 근육을, 앱 기본 운동은 해당 부위의 일반 참고 근육을 보여준다.
      muscles: fromLibrary ? (ex.targetMuscles ?? []) : musclesForArea(a),
      musclesNote: fromLibrary ? undefined : a ? '부위 일반 참고' : undefined,
      sets: ex.sets ? `${ex.sets}세트` : null,
      reps: repsText(ex),
      level: ex.intensity ?? null,
      caution: ex.precautions,
      badge: fromLibrary ? { text: 'PT 승인', tone: 'mint' } : { text: '앱 기본 운동', tone: 'navy' },
      areaTag: a ? AREA_DISPLAY_LABEL[a] : '일반 자세 개선'
    }
  })

  const lib = area ? suggestLibraryExercises(area, overlays.data, 4) : null
  const libCards: ExerciseCardData[] = (lib?.items ?? []).map(({ exercise: ex, status }) => {
    const o = overlays.data[ex.id]
    const approved = status === 'PT 승인'
    return {
      name: ex.name,
      purpose: ex.goals,
      muscles: ex.targetMuscles,
      sets: o?.sets ? `${o.sets}세트` : null,
      reps: o?.reps ? `${o.reps}회` : o?.holdSeconds ? `${o.holdSeconds}초` : ex.sourceDosage ? `${ex.sourceDosage} (원본)` : null,
      level: null,
      caution: ex.cautions,
      badge: approved ? { text: 'PT 승인', tone: 'mint' } : { text: 'PT 검수 전 · 참고용', tone: 'coral' },
      image: <ExerciseImageSlot url={images[ex.id]} label={ex.name} />
    }
  })

  return (
    <div className="space-y-6">
      {/* 오늘의 추천 운동 3개 */}
      <section>
        <div className="mb-3">
          <h3 className="t-title">오늘의 추천 운동 {picks.length}개</h3>
          <p className="t-meta mt-0.5">
            {areas.length > 0 ? `우선 확인 부위(${areas.map((a) => AREA_DISPLAY_LABEL[a]).join(', ')}) 기준` : '뚜렷한 우선 부위가 없어 일반 자세 개선 운동으로 구성'}
          </p>
        </div>
        <div className="grid items-start gap-3 md:grid-cols-3">
          {todayCards.map((c) => (
            <ExerciseCard key={c.name} data={c} />
          ))}
        </div>
      </section>

      {/* 부위별 라이브러리 운동 */}
      {area && (
        <section>
          <h3 className="t-title mb-3">부위별 운동</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {areas.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setPicked(a)}
                aria-pressed={area === a}
                className={`chip-btn ${area === a ? 'chip-btn-active' : ''}`}
              >
                {AREA_DISPLAY_LABEL[a]}
              </button>
            ))}
          </div>
          {libCards.length > 0 ? (
            <div className="grid items-start gap-3 md:grid-cols-2">
              {libCards.map((c) => (
                <ExerciseCard key={c.name} data={c} />
              ))}
            </div>
          ) : (
            <p className="card t-body p-4 text-clinical-500">
              {lib?.pendingCollection ? `${AREA_DISPLAY_LABEL[area]} 운동은 아직 라이브러리에 수집되지 않았습니다 (수집 예정).` : '이 부위에 연결된 라이브러리 운동이 아직 없습니다.'}
            </p>
          )}
          {lib && lib.total > libCards.length && (
            <button onClick={() => navigate('/library')} className="mt-3 text-sm font-semibold text-mint-700 underline">
              {AREA_DISPLAY_LABEL[area]} 운동 {lib.total}개 모두 보기 · 승인하기
            </button>
          )}
        </section>
      )}

      <div className="space-y-2">
        <button onClick={() => navigate('/program')} className="btn-primary w-full py-4 text-base">
          운동 프로그램 생성
        </button>
        <button onClick={() => navigate('/report')} className="btn-secondary w-full py-3">
          리포트 보기 / PDF 저장
        </button>
      </div>

      <DisclaimerNote>&quot;PT 검수 전&quot; 운동은 원본 자료 참고 목록이며, 처방·내보내기에는 PT 승인 운동만 사용됩니다. 진단이 아니며 통증이 있으면 중단하세요.</DisclaimerNote>
    </div>
  )
}
