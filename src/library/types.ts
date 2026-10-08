/**
 * 운동 라이브러리 · 기능검사 모듈의 타입 (src/library/exerciseLibrary.json 구조와 1:1).
 * 기존 처방 엔진(src/exercises, types/index.ts의 Exercise)과는 독립적이며, 서로 import하지 않는다.
 */

export type ApprovalStatus = 'PT 검수 필요' | 'PT 승인'

export interface ExerciseDosage {
  reps: number | null
  sets: number | null
  holdSeconds: number | null
  frequencyPerWeek: number | null
}

export interface SourceRef {
  file: string
  pdfPage: number | null
}

export interface LibraryExercise {
  id: string
  name: string
  englishName: string
  bodyPart: string
  exerciseType: string
  /** 원본 자료의 단계 번호. 임상적 위험도·난이도가 아니다. 없으면 null. */
  sourceLevel: number | null
  goals: string
  targetMuscles: string[]
  steps: string[]
  cautions: string
  /** 원본 문헌에 적힌 동작 반복 수 (개인 처방 값이 아님). 원문에 없으면 null */
  sourceDosage: string | null
  /** 개인 처방용 값. 원자료에는 없으므로 기본은 모두 null (임의로 채우지 않는다). */
  dosage: ExerciseDosage
  source: SourceRef
  /** /public 아래 이미지 경로 슬롯. 파일이 없을 수 있다. */
  image: string
  videoUrl: string | null
  approvalStatus: ApprovalStatus
  evidenceNote: string
}

export interface TestResultsSchema {
  left: string | null
  right: string | null
  pain: number | string | null
  notes: string
}

export interface AssessmentTest {
  id: string
  name: string
  bodyPart: string
  testType: string
  purpose: string
  resultsSchema: TestResultsSchema
  source: SourceRef
  reviewStatus: string
}

export interface LibraryMeta {
  libraryName: string
  version: string
  sourcePolicy: string
  qualityFlags: {
    manualReviewRequired: boolean
    missingDoseMeans: string
    sourceLevelMeans: string
    duplicateExerciseNames: string
    imageUsage: string
  }
}

/** PT가 이 브라우저에서 덧붙이는 값. 원본 JSON은 수정하지 않고, 이 오버레이를 위에 얹어 보여준다. */
export interface ExerciseOverlay {
  status?: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: string
  memo?: string
  /** PT가 개인 처방용으로 직접 입력한 값 (sourceDosage와 별개) */
  reps?: number | null
  sets?: number | null
  holdSeconds?: number | null
}

/** 기능검사 한 건의 저장 기록. 좌/우 소견·통증·평가자 메모 (resultsSchema와 같은 키). */
export interface TestRecord {
  left: string
  right: string
  /** 0~10 통증 점수를 문자열로 저장. 비어 있으면 '' (미기록) */
  pain: string
  notes: string
  updatedAt: string
}
