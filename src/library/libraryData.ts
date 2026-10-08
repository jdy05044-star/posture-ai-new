import raw from './exerciseLibrary.json'
import type { AssessmentTest, LibraryExercise, LibraryMeta } from './types'

/**
 * JSON 필드 검증. 형식이 어긋난 항목은 조용히 고치지 않고 issues에 기록한 뒤 목록에서 제외한다
 * (빠진 값을 임의로 채우지 않는다는 원칙).
 */
export interface ValidationIssue {
  kind: 'exercise' | 'test'
  id: string
  problem: string
}

type Rec = Record<string, unknown>

const isStr = (v: unknown): v is string => typeof v === 'string'
const isNumOrNull = (v: unknown): v is number | null => v === null || (typeof v === 'number' && Number.isFinite(v))
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr)
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)

export function validateExercise(v: unknown): string | null {
  if (!isRec(v)) return '객체가 아닙니다'
  for (const k of ['id', 'name', 'englishName', 'bodyPart', 'exerciseType', 'goals', 'cautions', 'image', 'evidenceNote']) {
    if (!isStr(v[k])) return `${k}가 문자열이 아닙니다`
  }
  if (!v.id || !v.name) return 'id 또는 name이 비어 있습니다'
  if (!isNumOrNull(v.sourceLevel)) return 'sourceLevel이 숫자/null이 아닙니다'
  if (!(v.sourceDosage === null || isStr(v.sourceDosage))) return 'sourceDosage가 문자열/null이 아닙니다'
  if (!isStrArr(v.targetMuscles)) return 'targetMuscles가 문자열 배열이 아닙니다'
  if (!isStrArr(v.steps)) return 'steps가 문자열 배열이 아닙니다'
  if (!isRec(v.dosage) || !['reps', 'sets', 'holdSeconds', 'frequencyPerWeek'].every((k) => isNumOrNull((v.dosage as Rec)[k]))) {
    return 'dosage 형식이 올바르지 않습니다'
  }
  if (!isRec(v.source) || !isStr(v.source.file) || !isNumOrNull(v.source.pdfPage)) return 'source 형식이 올바르지 않습니다'
  if (!(v.videoUrl === null || isStr(v.videoUrl))) return 'videoUrl 형식이 올바르지 않습니다'
  if (v.approvalStatus !== 'PT 검수 필요' && v.approvalStatus !== 'PT 승인') return 'approvalStatus 값이 알 수 없는 값입니다'
  return null
}

export function validateTest(v: unknown): string | null {
  if (!isRec(v)) return '객체가 아닙니다'
  for (const k of ['id', 'name', 'bodyPart', 'testType', 'purpose', 'reviewStatus']) {
    if (!isStr(v[k])) return `${k}가 문자열이 아닙니다`
  }
  if (!v.id || !v.name) return 'id 또는 name이 비어 있습니다'
  if (!isRec(v.resultsSchema)) return 'resultsSchema 형식이 올바르지 않습니다'
  if (!isRec(v.source) || !isStr(v.source.file) || !isNumOrNull(v.source.pdfPage)) return 'source 형식이 올바르지 않습니다'
  return null
}

export function loadLibrary(input: unknown): {
  exercises: LibraryExercise[]
  tests: AssessmentTest[]
  issues: ValidationIssue[]
} {
  const issues: ValidationIssue[] = []
  const src = isRec(input) ? input : {}
  const exercises: LibraryExercise[] = []
  const tests: AssessmentTest[] = []
  const seen = new Set<string>()

  for (const e of Array.isArray(src.exercises) ? src.exercises : []) {
    const problem = validateExercise(e)
    const id = isRec(e) && isStr(e.id) ? e.id : '(id 없음)'
    if (problem) issues.push({ kind: 'exercise', id, problem })
    else if (seen.has(id)) issues.push({ kind: 'exercise', id, problem: '중복된 id입니다' })
    else {
      seen.add(id)
      exercises.push(e as LibraryExercise)
    }
  }
  const seenT = new Set<string>()
  for (const t of Array.isArray(src.assessmentTests) ? src.assessmentTests : []) {
    const problem = validateTest(t)
    const id = isRec(t) && isStr(t.id) ? t.id : '(id 없음)'
    if (problem) issues.push({ kind: 'test', id, problem })
    else if (seenT.has(id)) issues.push({ kind: 'test', id, problem: '중복된 id입니다' })
    else {
      seenT.add(id)
      tests.push(t as AssessmentTest)
    }
  }
  return { exercises, tests, issues }
}

const loaded = loadLibrary(raw)

export const LIBRARY_EXERCISES: LibraryExercise[] = loaded.exercises
export const LIBRARY_TESTS: AssessmentTest[] = loaded.tests
export const LIBRARY_ISSUES: ValidationIssue[] = loaded.issues
export const LIBRARY_META: LibraryMeta = {
  libraryName: raw.libraryName,
  version: raw.version,
  sourcePolicy: raw.sourcePolicy,
  qualityFlags: raw.qualityFlags
}

/**
 * 업로드 자료에서 충분히 수집되지 않아 운동이 비어 있는 부위. 다른 운동을 임의로 만들어 채우지 않고
 * "별도 수집 예정"으로만 표시한다.
 */
export const BODY_PARTS_PENDING_COLLECTION = ['무릎', '발'] as const
