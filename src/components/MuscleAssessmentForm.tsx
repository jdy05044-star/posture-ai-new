import { useState } from 'react'
import {
  OUTCOME_LABEL,
  promotingDomain,
  type AssessmentOutcome,
  type MuscleAssessment,
  type PerformedBy,
  type ResolvedHypothesis
} from '@/anatomy/assessments'
import { DOMAIN_LABEL, SIDE_LABEL } from '@/anatomy/catalog'
import type { Side } from '@/anatomy/types'

interface Props {
  resolved: ResolvedHypothesis
  /** 이 근육 그룹에 이미 입력된 검사 결과 */
  existing: MuscleAssessment[]
  onAdd: (a: MuscleAssessment) => void
  onRemove: (id: string) => void
}

const OUTCOMES: AssessmentOutcome[] = ['supports', 'contradicts', 'inconclusive']

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}

/**
 * PT가 직접 실시한 근력·길이 검사 결과를 입력하는 폼.
 * 같은 근육·같은 쪽·후보에 맞는 검사 영역일 때만 해부도의 색이 바뀐다 (anatomy/assessments.ts의 규칙).
 */
export default function MuscleAssessmentForm({ resolved, existing, onAdd, onRemove }: Props) {
  const { h } = resolved
  const promoting = promotingDomain(h.target)
  const [side, setSide] = useState<Side>(h.sides[0])
  const [domain, setDomain] = useState(h.domains.includes(promoting) ? promoting : h.domains[0])
  const [outcome, setOutcome] = useState<AssessmentOutcome | null>(null)
  const [by, setBy] = useState<PerformedBy>('professional')
  const [protocol, setProtocol] = useState('')
  const [notes, setNotes] = useState('')

  function save() {
    if (!outcome) return
    onAdd({
      id: newId(),
      groupId: h.groupId,
      side,
      domain,
      outcome,
      performedBy: by,
      protocol: protocol.trim(),
      notes: notes.trim(),
      recordedAt: new Date().toISOString()
    })
    setOutcome(null)
    setProtocol('')
    setNotes('')
  }

  const willChangeColor = domain === promoting && by === 'professional' && outcome !== null && outcome !== 'inconclusive'
  const fieldCls = 'w-full rounded-xl border border-clinical-200 bg-white px-3 py-2 text-sm text-clinical-800'

  return (
    <div className="space-y-3 border-t border-clinical-100 pt-3">
      <p className="t-section">PT 검사 결과 입력</p>
      <p className="t-meta">PT가 직접 실시한 검사 결과만 입력하세요. 자세 사진만으로는 색이 바뀌지 않습니다.</p>

      <div>
        <p className="t-meta mb-1.5">검사한 쪽</p>
        <div className="flex gap-2">
          {h.sides.map((s) => (
            <button key={s} type="button" onClick={() => setSide(s)} aria-pressed={side === s} className={`chip-btn ${side === s ? 'chip-btn-active' : ''}`}>
              {SIDE_LABEL[s]}측
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="t-meta mb-1.5">검사 영역</p>
        <div className="flex flex-wrap gap-2">
          {h.domains.map((d) => (
            <button key={d} type="button" onClick={() => setDomain(d)} aria-pressed={domain === d} className={`chip-btn ${domain === d ? 'chip-btn-active' : ''}`}>
              {DOMAIN_LABEL[d]}
              {d === promoting ? ' ●' : ''}
            </button>
          ))}
        </div>
        <p className="t-meta mt-1">● 표시된 영역의 결과만 색을 바꿉니다. 나머지 영역은 기록만 됩니다.</p>
      </div>

      <div>
        <p className="t-meta mb-1.5">검사 결과</p>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <button key={o} type="button" onClick={() => setOutcome(o)} aria-pressed={outcome === o} className={`chip-btn ${outcome === o ? 'chip-btn-active' : ''}`}>
              {OUTCOME_LABEL[o]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {(['professional', 'self_report'] as PerformedBy[]).map((p) => (
          <button key={p} type="button" onClick={() => setBy(p)} aria-pressed={by === p} className={`chip-btn ${by === p ? 'chip-btn-active' : ''}`}>
            {p === 'professional' ? 'PT 직접 검사' : '자가보고 (색 변경 안 함)'}
          </button>
        ))}
      </div>

      <input value={protocol} onChange={(e) => setProtocol(e.target.value)} className={fieldCls} placeholder="검사 방법 (선택) 예: 도수근력검사, 길이 검사" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldCls} placeholder="메모 (선택) · 이름 등 개인정보는 적지 마세요" />

      <button type="button" onClick={save} disabled={!outcome} className="btn-primary w-full py-2.5 text-sm disabled:opacity-40">
        {outcome ? (willChangeColor ? '저장 (색이 바뀝니다)' : '저장 (기록만 됩니다)') : '검사 결과를 선택하세요'}
      </button>

      {existing.length > 0 && (
        <ul className="space-y-1.5">
          {existing.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl bg-clinical-50 px-3 py-2 text-sm">
              <span className="min-w-0 text-clinical-700">
                <b>{SIDE_LABEL[a.side]}측</b> · {DOMAIN_LABEL[a.domain]} · {OUTCOME_LABEL[a.outcome]}
                {a.performedBy === 'self_report' ? ' · 자가보고' : ''}
                {a.protocol ? <span className="block t-meta">방법: {a.protocol}</span> : null}
                {a.notes ? <span className="block t-meta">{a.notes}</span> : null}
              </span>
              <button type="button" onClick={() => onRemove(a.id)} className="flex-none text-xs font-medium text-clinical-500 underline">
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
