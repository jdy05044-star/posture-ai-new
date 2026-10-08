import { useNavigate } from 'react-router-dom'
import ExerciseImageSlot from '@/library/ExerciseImageSlot'
import { useResolvedImages } from '@/library/exerciseImages'
import { LIBRARY_EXERCISES } from '@/library/libraryData'
import { suggestLibraryExercises } from '@/library/libraryRecommend'
import { OVERLAY_KEY, usePersistentRecord } from '@/library/libraryStorage'
import type { ExerciseOverlay } from '@/library/types'

interface Props {
  area: string
  areaLabel: string
}

/** 결과 화면 8번 "추천 운동": 운동 라이브러리에서 부위별 참고용 운동을 자동으로 보여준다. */
export default function LibrarySuggestions({ area, areaLabel }: Props) {
  const navigate = useNavigate()
  const overlays = usePersistentRecord<ExerciseOverlay>(OVERLAY_KEY)
  const images = useResolvedImages(LIBRARY_EXERCISES)
  const { items, total, pendingCollection } = suggestLibraryExercises(area, overlays.data)

  if (items.length === 0) {
    return (
      <p className="text-clinical-400">
        {pendingCollection
          ? `${areaLabel} 운동은 아직 라이브러리에 수집되지 않았습니다 (수집 예정).`
          : '이 영역에 연결된 운동이 아직 라이브러리에 없습니다.'}
      </p>
    )
  }

  const hasUnreviewed = items.some((s) => s.status !== 'PT 승인')

  return (
    <div>
      <ul className="space-y-3">
        {items.map(({ exercise, status }) => (
          <li key={exercise.id} className="flex items-center gap-3">
            <ExerciseImageSlot url={images[exercise.id]} label={exercise.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-clinical-800">{exercise.name}</p>
              <span className={status === 'PT 승인' ? 'pill-mint' : 'pill-coral'}>
                {status === 'PT 승인' ? 'PT 승인' : 'PT 검수 전 · 참고용'}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {hasUnreviewed && (
        <p className="mt-3 text-xs text-clinical-400">
          &quot;PT 검수 전&quot; 운동은 원본 자료에서 가져온 참고 목록이며, 근육·목적·주의사항은 PT 검수 전까지 최종
          판단이 아닙니다. 처방이나 회원용 내보내기에는 PT가 승인한 운동만 사용됩니다.
        </p>
      )}

      <button onClick={() => navigate('/library')} className="mt-3 text-sm font-semibold text-mint-700 underline">
        {areaLabel} 운동 {total}개 모두 보기 · 승인하기
      </button>
    </div>
  )
}
