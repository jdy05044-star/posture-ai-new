import type { ExerciseEnrichment, ExerciseOverlay } from './types'

/**
 * 운동별 근육 역할(주/보조/안정화/과사용 주의)과 "어디에 느낌이 와야 하는지·언제 자세를 고쳐야 하는지" 안내.
 *
 * 이 값들은 원본 PDF에 있는 내용이 아니다. 아래 DRAFTS는 사용자가 전달한 다른 AI의 제안 예시를 그대로 옮긴 "초안"이며,
 * PT 검수 전이다. 화면에서는 항상 "AI 초안 · PT 검수 전"으로 표시하고, PT가 라이브러리 화면에서 직접 입력하면
 * 그 값이 초안을 대체한다("PT 입력"). 초안이 없는 운동은 빈 상태로 두고 지어내지 않는다.
 */
export const ENRICHMENT_DRAFTS: Record<string, ExerciseEnrichment> = {
  // Bridge
  EX041: {
    primary: ['대둔근', '햄스트링', '복횡근'],
    secondary: ['중둔근', '척추기립근'],
    stabilizer: [],
    overuse: ['요추기립근', '상부 승모근'],
    feelingCue: ['엉덩이 아래쪽과 뒤쪽에 힘이 들어와야 합니다'],
    faultCue: ['허리만 꺾이는 느낌이 강하면 자세를 조정해야 합니다', '목과 어깨에 힘이 들어가면 자세를 조정해야 합니다']
  },
  // Clam
  EX060: {
    primary: ['중둔근', '소둔근'],
    secondary: ['대퇴근막장근'],
    stabilizer: ['복부 안정화 근육'],
    overuse: [],
    feelingCue: ['엉덩이 옆쪽이 타는 느낌', '허리보다 엉덩이에 힘이 더 들어감'],
    faultCue: ['허리가 먼저 흔들림', '골반이 뒤로 넘어감', '허벅지 앞쪽만 강하게 느낌']
  }
}

export type EnrichmentOrigin = 'pt' | 'draft'

export interface ResolvedEnrichment {
  data: ExerciseEnrichment
  origin: EnrichmentOrigin
}

export const EMPTY_ENRICHMENT: ExerciseEnrichment = {
  primary: [],
  secondary: [],
  stabilizer: [],
  overuse: [],
  feelingCue: [],
  faultCue: []
}

/** PT가 입력한 값이 있으면 그것을, 없으면 초안을, 둘 다 없으면 null. */
export function resolveEnrichment(id: string, overlay?: ExerciseOverlay): ResolvedEnrichment | null {
  if (overlay?.enrichment) return { data: overlay.enrichment, origin: 'pt' }
  const draft = ENRICHMENT_DRAFTS[id]
  return draft ? { data: draft, origin: 'draft' } : null
}

export function hasAnyEnrichment(e: ExerciseEnrichment): boolean {
  return Object.values(e).some((v) => v.length > 0)
}

export const ORIGIN_LABEL: Record<EnrichmentOrigin, string> = {
  pt: 'PT 입력',
  draft: 'AI 초안 · PT 검수 전'
}
