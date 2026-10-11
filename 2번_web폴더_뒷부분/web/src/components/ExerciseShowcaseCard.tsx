import { useState } from 'react'
import { SHOWCASE_IMAGE_DIR, type ShowcaseExercise } from '@/exercises/showcase'
import { ROLE_COLOR, ROLE_LABEL, type MuscleRole } from '@/library/exerciseAnatomy'

const ROLES: { key: MuscleRole; label: string }[] = [
  { key: 'primary', label: ROLE_LABEL.primary + ' 근육' },
  { key: 'secondary', label: ROLE_LABEL.secondary + ' 근육' },
  { key: 'stabilizer', label: ROLE_LABEL.stabilizer + ' 근육' },
  { key: 'overuse', label: ROLE_LABEL.overuse }
]

/** 이미지가 없으면 플레이스홀더. 같은 파일명으로 교체하면 바로 반영된다. */
function Img({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  if (broken)
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-clinical-200 bg-clinical-50 text-sm text-clinical-400">
        이미지 준비 중
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className="w-full rounded-xl bg-white object-contain" />
}

export default function ExerciseShowcaseCard({ ex }: { ex: ShowcaseExercise }) {
  return (
    <article className="card overflow-hidden p-4">
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-clinical-700 text-sm font-bold text-white">
          {String(ex.no).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-clinical-900">
            {ex.name} <span className="font-semibold text-clinical-600">({ex.nameEn})</span>
          </h3>
          <p className="mt-0.5 text-sm text-clinical-500">{ex.purpose}</p>
        </div>
        <div className="flex flex-none flex-wrap justify-end gap-1">
          <span className="pill-mint">{ex.level}</span>
          <span className="chip">{ex.tags.join(' | ')}</span>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <Img src={`${SHOWCASE_IMAGE_DIR}/${ex.slug}-motion.webp`} alt={`${ex.name} 동작 참고 이미지`} />
        </div>
        <div className="col-span-2">
          <Img src={`${SHOWCASE_IMAGE_DIR}/${ex.slug}-anatomy.webp`} alt={`${ex.name} 자극 근육 해부도`} />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {ROLES.map(({ key, label }) => {
          const list = ex.roles[key]
          return (
            <div key={key}>
              <dt className="flex items-center gap-1.5 text-sm font-semibold text-clinical-800">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: ROLE_COLOR[key] }} />
                {label}
              </dt>
              <dd className="mt-0.5 text-sm leading-snug text-clinical-600">
                {list.length > 0 ? list.join(', ') : <span className="text-clinical-300">미표기</span>}
                {key === 'overuse' && ex.roles.overuseNote && list.length > 0 && (
                  <span className="block text-clinical-400">({ex.roles.overuseNote})</span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <section className="rounded-xl bg-mint-50 p-3 sm:col-span-3">
          <h4 className="text-sm font-bold text-clinical-800">운동 방법</h4>
          <ol className="mt-1.5 space-y-1">
            {ex.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-snug text-clinical-700">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-white">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl bg-clinical-50 p-3 sm:col-span-2">
          <h4 className="text-sm font-bold text-clinical-800">포인트</h4>
          <ul className="mt-1.5 space-y-1">
            {ex.points.map((p) => (
              <li key={p} className="flex gap-1.5 text-sm leading-snug text-clinical-700">
                <span className="text-mint-600">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-semibold text-clinical-800">
        <span className="rounded-xl bg-clinical-50 px-2 py-2">{ex.reps}</span>
        <span className="rounded-xl bg-clinical-50 px-2 py-2">{ex.sets}</span>
        <span className="rounded-xl bg-clinical-50 px-2 py-2">{ex.hold}</span>
      </footer>
      <p className="mt-2 text-sm text-clinical-400">AI 초안 · PT 검수 전 · 횟수는 예시이며 처방이 아닙니다</p>
    </article>
  )
}
