import type { ReactNode } from 'react'

export interface ExerciseCardData {
  name: string
  /** 목적 (원본 문구). 없으면 미표기 */
  purpose?: string | null
  /** 관련 근육 */
  muscles: string[]
  /** 관련 근육 표시가 일반 참고임을 알리는 짧은 라벨 (예: "부위 일반 참고") */
  musclesNote?: string
  sets?: string | null
  reps?: string | null
  level?: string | null
  caution?: string | null
  badge: { text: string; tone: 'mint' | 'coral' | 'navy' }
  /** 이 운동이 뽑힌 이유 (예: 어깨) */
  areaTag?: string | null
  image?: ReactNode
  rank?: number
  /** 근육 역할·느낌 안내 (라이브러리 운동에만, 출처 라벨 포함) */
  roles?: {
    primary: string[]
    secondary: string[]
    feelingCue: string[]
    faultCue: string[]
    originLabel: string
  }
}

const NA = '미표기'

function Stat({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-clinical-50 px-3 py-2 text-center">
      <p className="t-meta">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${value ? 'text-clinical-900' : 'font-normal text-clinical-300'}`}>{value || NA}</p>
    </div>
  )
}

const BADGE_CLASS = { mint: 'pill-mint', coral: 'pill-coral', navy: 'chip' } as const

/** 운동 카드: 운동명 · 목적 · 관련 근육 · 세트 · 횟수 · 난이도 · 주의사항. 값이 없으면 "미표기"로 둔다. */
export default function ExerciseCard({ data }: { data: ExerciseCardData }) {
  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        {data.rank !== undefined && (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-mint-500 text-sm font-bold text-white">
            {data.rank}
          </span>
        )}
        {data.image}
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-bold leading-snug text-clinical-900">{data.name}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={BADGE_CLASS[data.badge.tone]}>{data.badge.text}</span>
            {data.areaTag && <span className="t-meta">{data.areaTag}</span>}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-clinical-600">
        <span className="font-semibold text-clinical-800">목적 </span>
        {data.purpose || NA}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="세트" value={data.sets} />
        <Stat label="횟수·시간" value={data.reps} />
        <Stat label="난이도" value={data.level} />
      </div>

      <div className="mt-3">
        <p className="t-meta mb-1">
          관련 근육{data.musclesNote ? ` · ${data.musclesNote}` : ''}
        </p>
        {data.muscles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.muscles.slice(0, 5).map((m) => (
              <span key={m} className="chip">
                {m}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-clinical-300">{NA}</p>
        )}
      </div>

      {data.roles && (data.roles.primary.length > 0 || data.roles.feelingCue.length > 0) && (
        <div className="mt-3 space-y-2 rounded-xl border border-clinical-100 p-3">
          <p className="t-meta">{data.roles.originLabel}</p>
          {data.roles.primary.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-sm font-medium text-clinical-700">주 타깃</span>
              {data.roles.primary.map((m) => (
                <span key={m} className="role-chip role-primary">{m}</span>
              ))}
            </div>
          )}
          {data.roles.secondary.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-sm font-medium text-clinical-700">보조</span>
              {data.roles.secondary.map((m) => (
                <span key={m} className="role-chip role-secondary">{m}</span>
              ))}
            </div>
          )}
          {data.roles.feelingCue.length > 0 && (
            <p className="text-sm text-clinical-600">
              <span className="font-semibold text-clinical-800">느낌 </span>
              {data.roles.feelingCue[0]}
            </p>
          )}
          {data.roles.faultCue.length > 0 && (
            <p className="text-sm text-clinical-600">
              <span className="font-semibold text-clinical-800">고칠 신호 </span>
              {data.roles.faultCue[0]}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 line-clamp-2 rounded-xl bg-alert-coral/10 px-3 py-2 text-sm text-clinical-700">
        <span className="font-semibold text-alert-red">주의 </span>
        {data.caution || NA}
      </p>
    </article>
  )
}
