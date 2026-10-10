import { useNavigate } from 'react-router-dom'
import LibrarySuggestions from '@/components/LibrarySuggestions'
import { linkedLibraryExercises } from '@/exercises/muscleLinks'
import ExerciseImageSlot from '@/library/ExerciseImageSlot'
import { useResolvedImages } from '@/library/exerciseImages'
import { LIBRARY_EXERCISES } from '@/library/libraryData'
import { OVERLAY_KEY, usePersistentRecord } from '@/library/libraryStorage'
import type { ExerciseOverlay } from '@/library/types'

interface Props {
  groupId: string
  groupLabel: string
  /** 대상 근육이 일치하는 운동이 없을 때 대신 보여줄 부위 단위 목록 */
  area: string
  areaLabel: string
}

/**
 * 근육 평가 후보에 연결된 운동. 라이브러리 원본의 "대상 근육" 표기가 같은 운동을 보여주며,
 * PT 승인 운동이 먼저 나온다. 일치하는 운동이 없으면 그렇게 말하고, 부위 단위 목록으로 대신한다.
 */
export default function MuscleLinkedExercises({ groupId, groupLabel, area, areaLabel }: Props) {
  const navigate = useNavigate()
  const overlays = usePersistentRecord<ExerciseOverlay>(OVERLAY_KEY)
  const images = useResolvedImages(LIBRARY_EXERCISES)
  const { items, total, approvedCount, hasTerms } = linkedLibraryExercises(groupId, overlays.data)

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="t-meta">
          {hasTerms
            ? `원본 자료에 ${groupLabel}을(를) 대상 근육으로 적은 운동이 없습니다.`
            : `${groupLabel}은(는) 원본 자료의 대상 근육 표기와 연결할 수 없습니다.`}{' '}
          대신 같은 부위({areaLabel}) 운동을 보여줍니다.
        </p>
        <LibrarySuggestions area={area} areaLabel={areaLabel} />
      </div>
    )
  }

  return (
    <div>
      <p className="t-meta mb-2">
        원본의 대상 근육 표기가 &quot;{groupLabel}&quot;과(와) 같은 운동 {total}개 · PT 승인 {approvedCount}개
      </p>
      <ul className="space-y-3">
        {items.map(({ exercise, status, matchedTerms }) => (
          <li key={exercise.id} className="flex items-center gap-3">
            <ExerciseImageSlot url={images[exercise.id]} label={exercise.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-clinical-800">{exercise.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className={status === 'PT 승인' ? 'pill-mint' : 'pill-coral'}>
                  {status === 'PT 승인' ? 'PT 승인' : 'PT 검수 전 · 참고용'}
                </span>
                <span className="t-meta">대상 근육: {matchedTerms.join(', ')}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {approvedCount === 0 && <p className="t-meta mt-3">승인된 운동이 아직 없습니다. 처방·내보내기에는 PT 승인 운동만 사용됩니다.</p>}
      <button onClick={() => navigate('/library')} className="mt-3 text-sm font-semibold text-mint-700 underline">
        운동 {total}개 모두 보기 · 승인하기
      </button>
    </div>
  )
}
