import type {
  AngleMeasurement,
  AreaAssessmentResult,
  AssessmentSummary,
  ManualFrontLandmarks,
  ManualSideLandmarks,
  ObservationArea,
  PoseAnalysisResult,
  PriorityAreaEntry,
  ViewType
} from '@/types'
import { computeFrontalMeasurements, computeSagittalMeasurements, tagSagittalMeasurements } from './angleCalculations'
import { computeAsisHeightFromManualPoints, computeManualSagittalMeasurements } from './manualMeasurements'

/** 좌/우 측면 각각의 PT 수동 기준점. 아직 안 찍었으면 undefined/null이어도 되며, 그 경우 정직하게 '측정 불확실'로 남는다. */
export interface ManualSideLandmarksBySide {
  left?: ManualSideLandmarks | null
  right?: ManualSideLandmarks | null
}

const ALL_AREAS: ObservationArea[] = ['어깨', '골반', '허리/몸통', '머리/목', '무릎', '발']

/** 여러 측정값의 confidence 평균 (null인 값은 제외, 전부 null이면 null) */
function areaConfidence(measurements: AngleMeasurement[]): number | null {
  const vals = measurements.map((m) => m.confidence).filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/**
 * 정면과 후면 측정값 중 같은 항목(어깨/골반 좌우 기울기)의 방향이 서로 반대로 나오면 경고 문구를
 * 만든다. MediaPipe는 얼굴이 보이지 않는 후면 사진에서 좌우 landmark를 반대로 인식하는 경우가
 * 정면보다 잦을 수 있어, 두 결과가 모순되면 "둘 중 하나는 좌우가 바뀌었을 수 있다"는 것을 PT가
 * 참고할 수 있게 알려준다 — 어느 쪽이 맞는지 임의로 판단하지 않는다.
 */
/**
 * 각도로 측정된 항목의 "편차 크기(°)". 우선 확인 영역 정렬과 부위별 불균형 막대가 같은 기준을 쓰도록 공유한다.
 * 무릎 굽힘/폄 각도는 완전 신전(180°) 대비 차이, 나머지는 측정된 각도의 절댓값.
 * 각도 측정값이 없으면(null) 편차를 지어내지 않고 null을 돌려준다.
 */
export function measurementSeverity(m: AngleMeasurement): number | null {
  if (m.valueDeg === null) return null
  return m.id.includes('knee-flex-angle') ? Math.abs(m.valueDeg - 180) : Math.abs(m.valueDeg)
}

function buildConsistencyWarnings(allMeasurements: AngleMeasurement[]): string[] {
  const warnings: string[] = []
  const byId = new Map(allMeasurements.map((m) => [m.id, m]))

  const pairs: { frontId: string; backId: string; label: string }[] = [
    { frontId: 'shoulder-tilt', backId: 'shoulder-tilt-back', label: '어깨 좌우 기울기' },
    { frontId: 'pelvis-tilt', backId: 'pelvis-tilt-back', label: '골반 좌우 기울기' }
  ]

  for (const { frontId, backId, label } of pairs) {
    const front = byId.get(frontId)
    const back = byId.get(backId)
    if (!front?.direction || !back?.direction) continue
    const frontSide = front.direction.includes('우측') ? '우측' : front.direction.includes('좌측') ? '좌측' : null
    const backSide = back.direction.includes('우측') ? '우측' : back.direction.includes('좌측') ? '좌측' : null
    if (frontSide && backSide && frontSide !== backSide) {
      warnings.push(
        `${label}: 정면 사진은 "${front.direction}", 후면 사진은 "${back.direction}"로 서로 반대 방향입니다. ` +
          `후면 사진은 얼굴이 보이지 않아 좌우 인식이 정면보다 부정확할 수 있으니, 이 항목은 참고용으로만 보고 ` +
          `필요하면 다시 촬영하거나 PT가 직접 확인해주세요.`
      )
    }
  }

  return warnings
}

/** 관찰 문구를 생성한다. 원인·진단을 단정하지 않고 "관찰이 필요한 영역" 수준으로 표현한다. */
function buildObservation(measurements: AngleMeasurement[]): string {
  const available = measurements.filter((m) => m.direction !== null)
  if (available.length === 0) {
    return '측정 불확실 — 사진에서 관련 관절점이 충분히 인식되지 않았습니다. 다시 촬영해주세요.'
  }
  const lines = available.map((m) => `${m.label}: ${m.direction}`)
  return `${lines.join(' / ')} — 자세상 관찰이 필요한 영역으로 참고해주세요.`
}

/**
 * 네 장의 사진(정면/측면-좌측/측면-우측/후면) 분석 결과를 받아 관찰 영역별 결과와 우선 확인 영역을 생성한다.
 * 사진이 없거나 landmark 인식이 안 된 항목은 값을 지어내지 않고 '측정 불확실'로 남긴다.
 *
 * manualSideLandmarks: PT가 좌/우 측면 사진 위에 각각 직접 표시한 골반(ASIS/PSIS)·등뼈(C7/흉추정점/T12) 기준점.
 * 값이 없으면(undefined) 골반 전후경사·등 굽음 측정값은 정직하게 '측정 불확실'로 남는다.
 */
export function runAssessment(
  results: Record<ViewType, PoseAnalysisResult | null>,
  manualSideLandmarks?: ManualSideLandmarksBySide | null,
  manualFrontLandmarks?: ManualFrontLandmarks | null
): AssessmentSummary {
  const allMeasurements: AngleMeasurement[] = []

  if (results.front && results.front.landmarks.length > 0) {
    allMeasurements.push(...computeFrontalMeasurements(results.front))
  }
  // 좌우 ASIS 높이 차이는 자동 인식이 아니라 PT가 정면 사진 위에 직접 표시한 점으로 계산한다.
  // 정면 분석이 있거나 PT가 점을 하나라도 찍었을 때만 항목을 만들고, 한쪽만 찍었으면 '측정 불확실'로 남긴다.
  if ((results.front && results.front.landmarks.length > 0) || manualFrontLandmarks?.leftAsis || manualFrontLandmarks?.rightAsis) {
    allMeasurements.push(computeAsisHeightFromManualPoints(manualFrontLandmarks))
  }
  if (results.back && results.back.landmarks.length > 0) {
    const backMeasurements = computeFrontalMeasurements(results.back).map((m) => ({
      ...m,
      id: `${m.id}-back`,
      label: `${m.label} (후면)`
    }))
    allMeasurements.push(...backMeasurements)
  }

  // 측면은 좌/우를 각각 촬영하므로, 같은 항목이라도 어느 쪽 사진 기준인지 id/라벨에 구분해서 담는다.
  for (const side of ['left', 'right'] as const) {
    const viewKey: ViewType = side === 'left' ? 'side-left' : 'side-right'
    const sideResult = results[viewKey]
    if (sideResult && sideResult.landmarks.length > 0) {
      allMeasurements.push(...tagSagittalMeasurements(computeSagittalMeasurements(sideResult), side))
    }
    // 골반 전후경사·등 굽음은 자동 landmark가 아니라 PT가 직접 표시한 기준점으로 계산된다.
    // 아직 아무 점도 안 찍었어도 '측정 불확실' 상태로 정직하게 채워진다.
    const manualForSide = side === 'left' ? manualSideLandmarks?.left : manualSideLandmarks?.right
    allMeasurements.push(...tagSagittalMeasurements(computeManualSagittalMeasurements(manualForSide), side))
  }

  const areaResults: AreaAssessmentResult[] = ALL_AREAS.map((area) => {
    const measurements = allMeasurements.filter((m) => m.area === area)
    return {
      area,
      measurements,
      observation: buildObservation(measurements),
      confidence: areaConfidence(measurements)
    }
  })

  // 우선 확인 영역: valueDeg가 있는(각도로 비교 가능한) 측정값 중 편차가 큰 순서로 정렬
  const scored: PriorityAreaEntry[] = allMeasurements
    .filter((m) => m.valueDeg !== null)
    .map((m) => {
      const severity = measurementSeverity(m) as number
      return {
        entry: {
          area: m.area,
          reason: m.direction ?? '',
          basedOnMeasurement: m.label,
          valueDeg: m.valueDeg,
          confidence: m.confidence
        } as PriorityAreaEntry,
        severity
      }
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((s) => s.entry)

  const consistencyWarnings = buildConsistencyWarnings(allMeasurements)

  return {
    areaResults,
    priorityAreas: scored,
    consistencyWarnings,
    generatedAt: new Date().toISOString()
  }
}
