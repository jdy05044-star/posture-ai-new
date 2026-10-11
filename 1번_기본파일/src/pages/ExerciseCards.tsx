import { useNavigate } from 'react-router-dom'
import ExerciseShowcaseCard from '@/components/ExerciseShowcaseCard'
import { SHOWCASE } from '@/exercises/showcase'
import { ROLE_COLOR, ROLE_LABEL, ROLE_ORDER } from '@/library/exerciseAnatomy'

export default function ExerciseCards() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-4xl">
      <div className="mb-1 flex items-center justify-between">
        <button onClick={() => navigate('/library')} className="text-sm font-semibold text-clinical-500">
          ← 운동 라이브러리
        </button>
      </div>
      <h1 className="text-xl font-semibold text-clinical-900">운동 소개 카드</h1>
      <p className="mt-1 text-sm text-clinical-500">동작 사진 · 자극 근육 · 운동 방법 · 포인트를 한 장으로 보여줍니다.</p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {ROLE_ORDER.map((r) => (
          <li key={r} className="flex items-center gap-1.5 text-sm text-clinical-600">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: ROLE_COLOR[r] }} />
            {ROLE_LABEL[r]}
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-xl bg-clinical-100 px-4 py-3 text-sm leading-relaxed text-clinical-600">
        카드 내용과 이미지는 AI가 만든 초안이며 PT 검수 전입니다. 횟수·세트·유지 시간은 예시 값이고, 회원별 처방은 PT가 정합니다.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {SHOWCASE.map((ex) => (
          <ExerciseShowcaseCard key={ex.slug} ex={ex} />
        ))}
      </div>
    </div>
  )
}
