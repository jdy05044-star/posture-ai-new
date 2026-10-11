import { useState } from 'react'
import ExerciseAnatomyFigure from './ExerciseAnatomyFigure'
import { EMPTY_ENRICHMENT, hasAnyEnrichment, ORIGIN_LABEL, resolveEnrichment } from './enrichment'
import { ROLE_LABEL, ROLE_ORDER } from './exerciseAnatomy'
import type { ExerciseEnrichment, ExerciseOverlay } from './types'

const FIELD_LABEL: Record<keyof ExerciseEnrichment, string> = {
  primary: '주 타깃 근육',
  secondary: '보조 근육',
  stabilizer: '안정화 근육',
  overuse: '과사용 주의 근육',
  feelingCue: '이렇게 느껴져야 합니다',
  faultCue: '이런 경우 자세를 고쳐야 합니다'
}
const FIELD_ORDER = Object.keys(FIELD_LABEL) as (keyof ExerciseEnrichment)[]

const toLines = (v: string[]) => v.join('\n')
const fromLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

interface Props {
  exerciseId: string
  name: string
  overlay: ExerciseOverlay
  onChange: (next: ExerciseOverlay) => void
}

export default function EnrichmentSection({ exerciseId, name, overlay, onChange }: Props) {
  const resolved = resolveEnrichment(exerciseId, overlay)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<keyof ExerciseEnrichment, string>>(() => init(resolved?.data))

  function init(d?: ExerciseEnrichment) {
    const e = d ?? EMPTY_ENRICHMENT
    return Object.fromEntries(FIELD_ORDER.map((k) => [k, toLines(e[k])])) as Record<keyof ExerciseEnrichment, string>
  }

  function save() {
    const next = Object.fromEntries(FIELD_ORDER.map((k) => [k, fromLines(draft[k])])) as unknown as ExerciseEnrichment
    onChange({ ...overlay, enrichment: next })
    setEditing(false)
  }

  const data = resolved?.data
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-clinical-900">자극 근육 · 느낌 · 주의</h4>
        {resolved && (
          <span className={resolved.origin === 'pt' ? 'pill-mint' : 'pill-coral'}>{ORIGIN_LABEL[resolved.origin]}</span>
        )}
      </div>

      {data && hasAnyEnrichment(data) && !editing ? (
        <div className="space-y-4">
          <ExerciseAnatomyFigure exerciseId={exerciseId} name={name} enrichment={data} />
          {ROLE_ORDER.filter((r) => data[r].length > 0).map((r) => (
            <div key={r}>
              <p className="mb-1 text-sm font-medium text-clinical-700">{ROLE_LABEL[r]}</p>
              <div className="flex flex-wrap gap-1.5">
                {data[r].map((m) => (
                  <span key={m} className={`role-chip role-${r}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {data.feelingCue.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-clinical-700">{FIELD_LABEL.feelingCue}</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {data.feelingCue.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {data.faultCue.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-clinical-700">{FIELD_LABEL.faultCue}</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {data.faultCue.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {resolved?.origin === 'draft' && (
            <p className="text-sm text-clinical-400">
              이 내용은 AI가 제안한 초안이며 PT 검수 전입니다. 아래 버튼으로 직접 고치면 그 내용이 초안을 대체합니다.
            </p>
          )}
        </div>
      ) : !editing ? (
        <p className="text-clinical-400">아직 입력된 근육 역할·느낌 안내가 없습니다. 내용은 임의로 채우지 않습니다.</p>
      ) : null}

      {editing ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-clinical-500">한 줄에 하나씩 적습니다. 근육 이름은 해부도의 한글 표기(예: 대둔근, 중둔근)와 같아야 그림에 칠해집니다.</p>
          {FIELD_ORDER.map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-sm font-medium text-clinical-700">{FIELD_LABEL[k]}</span>
              <textarea
                rows={2}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                className="w-full rounded-xl border border-clinical-200 bg-white px-3 py-2.5 text-sm text-clinical-800"
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={save} className="btn-mint flex-1 py-2.5">
              저장 (PT 입력)
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 py-2.5">
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(init(resolved?.data))
              setEditing(true)
            }}
            className="text-sm font-semibold text-clinical-600 underline"
          >
            {resolved ? '직접 수정' : '직접 입력'}
          </button>
          {overlay.enrichment && (
            <button
              type="button"
              onClick={() => onChange({ ...overlay, enrichment: undefined })}
              className="text-sm font-semibold text-clinical-400 underline"
            >
              PT 입력 지우기
            </button>
          )}
        </div>
      )}
    </section>
  )
}
