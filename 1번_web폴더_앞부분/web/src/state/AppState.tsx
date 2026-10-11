import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MuscleAssessment } from '@/anatomy/assessments'
import type {
  AssessmentSummary,
  CaptureImage,
  ConditionTag,
  GeneratedProgram,
  ManualFrontLandmarks,
  ManualSideLandmarks,
  PoseAnalysisResult,
  ProgramExercise,
  ViewType
} from '@/types'
import { loadSession, saveSession } from '@/lib/storage'

/** 좌/우 측면 각각의 PT 수동 기준점 (골반 ASIS/PSIS · 등뼈 C7/흉추정점/T12) */
export interface ManualSideLandmarksBySide {
  left: ManualSideLandmarks
  right: ManualSideLandmarks
}

interface AppState {
  captures: Record<ViewType, CaptureImage | null>
  setCapture: (view: ViewType, image: CaptureImage | null) => void
  results: Record<ViewType, PoseAnalysisResult | null>
  setResult: (view: ViewType, result: PoseAnalysisResult | null) => void
  program: GeneratedProgram | null
  setProgram: (program: GeneratedProgram | null) => void
  updateProgramCategory: (category: 'warmup' | 'main' | 'cooldown', exercises: ProgramExercise[]) => void
  ptNote: string
  setPtNote: (note: string) => void
  symptomTags: ConditionTag[]
  setSymptomTags: (tags: ConditionTag[]) => void
  /** PT가 입력한 근육 검사 결과. 근육 평가 후보의 상태(긴장/약화 의심)를 바꾸는 유일한 입력이다. */
  muscleAssessments: MuscleAssessment[]
  addMuscleAssessment: (a: MuscleAssessment) => void
  removeMuscleAssessment: (id: string) => void
  patientName: string
  setPatientName: (name: string) => void
  assessedDate: string
  setAssessedDate: (date: string) => void
  /** STEP10: Before/After 비교용 스냅샷 */
  beforeSummary: AssessmentSummary | null
  latestSummary: AssessmentSummary | null
  /**
   * Before 저장 시점의 사진(dataUrl)과 landmark 결과. 사진 위 측정값 오버레이 비교에 사용한다.
   * captures와 마찬가지로 용량·민감정보 문제로 localStorage에는 저장하지 않고, 세션 메모리에만 유지한다.
   */
  beforeCaptures: Record<ViewType, string | null>
  beforeResults: Record<ViewType, PoseAnalysisResult | null>
  saveAsBefore: (
    summary: AssessmentSummary,
    captures: Record<ViewType, CaptureImage | null>,
    results: Record<ViewType, PoseAnalysisResult | null>
  ) => void
  setLatestSummary: (summary: AssessmentSummary) => void
  clearBefore: () => void
  /**
   * 좌/우 측면 사진 위에 PT가 각각 직접 표시한 골반(ASIS/PSIS)·등뼈(C7/흉추정점/T12) 기준점.
   * captures와 마찬가지로 사진에 종속된 좌표라 localStorage에는 저장하지 않고 세션 메모리에만 유지하며,
   * 해당 측 측면 사진이 새로 바뀌면 그 쪽만 자동으로 초기화된다.
   */
  manualSideLandmarks: ManualSideLandmarksBySide
  manualFrontLandmarks: ManualFrontLandmarks
  setManualFrontLandmarks: (next: ManualFrontLandmarks) => void
  setManualSideLandmarks: (side: 'left' | 'right', next: ManualSideLandmarks) => void
  resetAll: () => void
}

const emptyCaptures: Record<ViewType, CaptureImage | null> = {
  front: null,
  'side-left': null,
  'side-right': null,
  back: null
}
const emptyResults: Record<ViewType, PoseAnalysisResult | null> = {
  front: null,
  'side-left': null,
  'side-right': null,
  back: null
}
const emptyBeforeCaptures: Record<ViewType, string | null> = {
  front: null,
  'side-left': null,
  'side-right': null,
  back: null
}
const emptyManualSideLandmarks: ManualSideLandmarksBySide = { left: {}, right: {} }

const AppStateContext = createContext<AppState | null>(null)

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [captures, setCaptures] = useState(emptyCaptures)
  const [results, setResults] = useState(emptyResults)
  const [program, setProgram] = useState<GeneratedProgram | null>(null)
  const [ptNote, setPtNote] = useState('')
  const [symptomTags, setSymptomTags] = useState<ConditionTag[]>([])
  const [muscleAssessments, setMuscleAssessments] = useState<MuscleAssessment[]>([])
  const [patientName, setPatientName] = useState('')
  const [assessedDate, setAssessedDate] = useState(todayStr())
  const [beforeSummary, setBeforeSummary] = useState<AssessmentSummary | null>(null)
  const [latestSummary, setLatestSummaryState] = useState<AssessmentSummary | null>(null)
  const [beforeCaptures, setBeforeCaptures] = useState<Record<ViewType, string | null>>(emptyBeforeCaptures)
  const [beforeResults, setBeforeResults] = useState<Record<ViewType, PoseAnalysisResult | null>>(emptyResults)
  const [manualFrontLandmarks, setManualFrontLandmarks] = useState<ManualFrontLandmarks>({})
  const [manualSideLandmarks, setManualSideLandmarksState] =
    useState<ManualSideLandmarksBySide>(emptyManualSideLandmarks)

  const hydrated = useRef(false)

  // 최초 마운트 시 localStorage에서 세션 데이터(사진 제외)를 불러온다.
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setProgram(saved.program)
      setPtNote(saved.ptNote)
      setSymptomTags(saved.symptomTags as ConditionTag[])
      setMuscleAssessments(saved.muscleAssessments ?? [])
      setPatientName(saved.patientName)
      setAssessedDate(saved.assessedDate || todayStr())
      setBeforeSummary(saved.beforeSummary)
      setLatestSummaryState(saved.latestSummary)
    }
    hydrated.current = true
  }, [])

  // 가벼운 데이터(사진 제외)는 바뀔 때마다 자동 저장한다.
  useEffect(() => {
    if (!hydrated.current) return
    saveSession({ patientName, assessedDate, beforeSummary, latestSummary, program, ptNote, symptomTags, muscleAssessments })
  }, [patientName, assessedDate, beforeSummary, latestSummary, program, ptNote, symptomTags, muscleAssessments])

  const value = useMemo<AppState>(
    () => ({
      captures,
      setCapture: (view, image) => {
        setCaptures((c) => ({ ...c, [view]: image }))
        // 측면 사진이 바뀌면 이전 사진 기준으로 찍어둔 골반/등 기준점은 더 이상 유효하지 않으므로,
        // 바뀐 쪽(좌/우)의 기준점만 초기화한다.
        // 정면 사진이 바뀌면 이전 사진 기준으로 찍어둔 ASIS도 무효이므로 초기화한다.
        if (view === 'front') setManualFrontLandmarks({})
        if (view === 'side-left') setManualSideLandmarksState((m) => ({ ...m, left: {} }))
        if (view === 'side-right') setManualSideLandmarksState((m) => ({ ...m, right: {} }))
      },
      results,
      setResult: (view, result) => setResults((r) => ({ ...r, [view]: result })),
      program,
      setProgram,
      updateProgramCategory: (category, exercises) =>
        setProgram((p) => (p ? { ...p, [category]: exercises } : p)),
      ptNote,
      setPtNote,
      symptomTags,
      setSymptomTags,
      muscleAssessments,
      addMuscleAssessment: (a) => setMuscleAssessments((list) => [...list, a]),
      removeMuscleAssessment: (id) => setMuscleAssessments((list) => list.filter((x) => x.id !== id)),
      patientName,
      setPatientName,
      assessedDate,
      setAssessedDate,
      beforeSummary,
      latestSummary,
      beforeCaptures,
      beforeResults,
      saveAsBefore: (summary, captures, results) => {
        setBeforeSummary(summary)
        setBeforeCaptures({
          front: captures.front?.dataUrl ?? null,
          'side-left': captures['side-left']?.dataUrl ?? null,
          'side-right': captures['side-right']?.dataUrl ?? null,
          back: captures.back?.dataUrl ?? null
        })
        setBeforeResults(results)
      },
      setLatestSummary: (summary) => setLatestSummaryState(summary),
      clearBefore: () => {
        setBeforeSummary(null)
        setBeforeCaptures(emptyBeforeCaptures)
        setBeforeResults(emptyResults)
      },
      manualFrontLandmarks,
      setManualFrontLandmarks,
      manualSideLandmarks,
      setManualSideLandmarks: (side, next) => setManualSideLandmarksState((m) => ({ ...m, [side]: next })),
      resetAll: () => {
        setCaptures(emptyCaptures)
        setResults(emptyResults)
        setProgram(null)
        setPtNote('')
        setSymptomTags([])
        setMuscleAssessments([])
        setBeforeSummary(null)
        setLatestSummaryState(null)
        setBeforeCaptures(emptyBeforeCaptures)
        setBeforeResults(emptyResults)
        setManualSideLandmarksState(emptyManualSideLandmarks)
        setManualFrontLandmarks({})
      }
    }),
    [
      captures,
      results,
      program,
      ptNote,
      symptomTags,
      muscleAssessments,
      patientName,
      assessedDate,
      beforeSummary,
      latestSummary,
      beforeCaptures,
      beforeResults,
      manualSideLandmarks,
      manualFrontLandmarks
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState는 AppStateProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
