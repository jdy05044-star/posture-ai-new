import type { ApprovalStatus, ExerciseOverlay, LibraryExercise } from './types'

export const ALL = '전체'

export interface ExerciseFilters {
  bodyPart: string
  exerciseType: string
  /** '전체' | '미표기' | '1' ~ '7' (원본 자료의 단계 번호, 난이도·위험도 아님) */
  level: string
  /** 운동명(한글/영문) 검색어 */
  query: string
  /** '전체' | '있음' | '없음' — 확인이 끝난 항목만 대상으로 한다 */
  image: string
  /** '전체' | 'PT 검수 필요' | 'PT 승인' */
  status: string
}

export const DEFAULT_FILTERS: ExerciseFilters = {
  bodyPart: ALL,
  exerciseType: ALL,
  level: ALL,
  query: '',
  image: ALL,
  status: ALL
}

/** PT가 승인으로 바꾼 값이 있으면 그것을, 없으면 원본 자료의 상태를 쓴다. */
export function effectiveStatus(ex: LibraryExercise, overlay?: ExerciseOverlay): ApprovalStatus {
  return overlay?.status ?? ex.approvalStatus
}

/**
 * imageMap: id → 실제로 확인된 이미지 URL / null(파일 없음) / undefined(아직 확인 중).
 * 확인 중인 항목은 '있음'·'없음' 어느 쪽에도 넣지 않는다 (확인 전에는 추측하지 않는다).
 */
export function filterExercises(
  list: LibraryExercise[],
  f: ExerciseFilters,
  imageMap: Record<string, string | null | undefined>,
  overlays: Record<string, ExerciseOverlay>
): LibraryExercise[] {
  const q = f.query.trim().toLowerCase()
  return list.filter((ex) => {
    if (f.bodyPart !== ALL && ex.bodyPart !== f.bodyPart) return false
    if (f.exerciseType !== ALL && ex.exerciseType !== f.exerciseType) return false
    if (f.level !== ALL) {
      if (f.level === '미표기') {
        if (ex.sourceLevel !== null) return false
      } else if (String(ex.sourceLevel) !== f.level) return false
    }
    if (q && !`${ex.name} ${ex.englishName}`.toLowerCase().includes(q)) return false
    if (f.image === '있음' && !imageMap[ex.id]) return false
    if (f.image === '없음' && imageMap[ex.id] !== null) return false
    if (f.status !== ALL && effectiveStatus(ex, overlays[ex.id]) !== f.status) return false
    return true
  })
}

/** 데이터에 실제로 존재하는 값만 선택지로 만든다 (빈 선택지를 지어내지 않는다). */
export function uniqueValues(list: LibraryExercise[], pick: (e: LibraryExercise) => string): string[] {
  return Array.from(new Set(list.map(pick))).filter(Boolean)
}

export function levelOptions(list: LibraryExercise[]): string[] {
  const levels = Array.from(new Set(list.map((e) => e.sourceLevel).filter((l): l is number => l !== null))).sort((a, b) => a - b)
  const opts = levels.map(String)
  if (list.some((e) => e.sourceLevel === null)) opts.push('미표기')
  return opts
}

export interface ApprovedExportItem {
  id: string
  name: string
  bodyPart: string
  exerciseType: string
  steps: string[]
  cautions: string
  targetMuscles: string[]
  /** 원본 문헌의 동작 반복 수 (처방 값 아님) */
  sourceDosage: string | null
  /** PT가 직접 입력한 개인 처방 값. 입력하지 않았으면 null — 자동으로 채우지 않는다. */
  prescription: { reps: number | null; sets: number | null; holdSeconds: number | null }
  ptMemo: string
  reviewedBy: string
  reviewedAt: string
  source: { file: string; pdfPage: number | null }
}

/** PT가 승인한 운동만 내보낸다. 승인되지 않은 운동은 어떤 경우에도 포함하지 않는다. */
export function buildApprovedExport(list: LibraryExercise[], overlays: Record<string, ExerciseOverlay>): ApprovedExportItem[] {
  return list
    .filter((ex) => effectiveStatus(ex, overlays[ex.id]) === 'PT 승인')
    .map((ex) => {
      const o = overlays[ex.id] ?? {}
      return {
        id: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        exerciseType: ex.exerciseType,
        steps: ex.steps,
        cautions: ex.cautions,
        targetMuscles: ex.targetMuscles,
        sourceDosage: ex.sourceDosage,
        prescription: { reps: o.reps ?? null, sets: o.sets ?? null, holdSeconds: o.holdSeconds ?? null },
        ptMemo: o.memo ?? '',
        reviewedBy: o.reviewedBy ?? '',
        reviewedAt: o.reviewedAt ?? '',
        source: ex.source
      }
    })
}
