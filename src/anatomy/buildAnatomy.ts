import { formatMeasurementValue } from '@/assessment/angleCalculations'
import type { AngleMeasurement, AssessmentSummary } from '@/types'
import type {
  AnatomyFinding,
  AnatomyModel,
  AssessmentDomain,
  AtlasView,
  FindingOverlay,
  HeldRule,
  MuscleHypothesis,
  ProposedTarget,
  Side
} from './types'

/** 인식 명확도가 이 값보다 낮은 측정은 근육 후보 규칙을 발동하지 않는다 (앱의 다른 화면과 같은 기준). */
const MIN_CLARITY = 0.5

interface RuleCandidate {
  groupId: string
  target: ProposedTarget
}
interface RuleDef {
  id: string
  candidates: RuleCandidate[]
  domains: AssessmentDomain[]
}

/**
 * 개발 명세의 '평가 후보 규칙' 중 이 앱이 실제로 측정하는 입력과 연결되는 것만 옮긴 것.
 * 모든 규칙은 검증 전 후보이며(clinical_review_required), 결과는 항상 '평가 후보'까지만 만든다.
 * R03(어깨 전방 위치)·R04(수동 ASIS 높이)·R10(머리 기울기)·R11(한발서기)·R12(전문가 견갑 소견)는
 * 이 앱에 해당 입력이 아직 없어 연결하지 않았다.
 */
const RULES: Record<string, RuleDef> = {
  R01: {
    id: 'R01',
    candidates: [
      { groupId: 'upper_trapezius', target: 'tightness' },
      { groupId: 'levator_scapulae', target: 'tightness' }
    ],
    domains: ['tone_length']
  },
  R02: {
    id: 'R02',
    candidates: [
      { groupId: 'deep_neck_flexors', target: 'function' },
      { groupId: 'suboccipitals', target: 'tightness' }
    ],
    domains: ['strength_endurance', 'tone_length']
  },
  R05: {
    id: 'R05',
    candidates: [
      { groupId: 'iliopsoas', target: 'tightness' },
      { groupId: 'rectus_femoris', target: 'tightness' },
      { groupId: 'gluteus_maximus', target: 'function' },
      { groupId: 'abdominals', target: 'function' }
    ],
    domains: ['tone_length', 'strength_endurance']
  },
  R06: {
    id: 'R06',
    candidates: [{ groupId: 'hamstrings', target: 'tightness' }],
    domains: ['tone_length', 'range_of_motion']
  },
  R07: {
    id: 'R07',
    candidates: [{ groupId: 'hip_abductors', target: 'function' }],
    domains: ['strength_endurance', 'movement_control', 'range_of_motion']
  }
}

export interface BuildOptions {
  /** PT가 "촬영 시 카메라가 수평이었다"고 확인했는지. 확인 전에는 근육 규칙을 발동하지 않는다. */
  cameraLevelConfirmed: boolean
}

function allMeasurements(summary: AssessmentSummary): Map<string, AngleMeasurement> {
  const map = new Map<string, AngleMeasurement>()
  for (const r of summary.areaResults) for (const m of r.measurements) map.set(m.id, m)
  return map
}

function valueText(m: AngleMeasurement): string {
  if (m.valueDeg !== null) return formatMeasurementValue(m)
  return m.direction ?? '측정 불확실'
}

function isUsable(m: AngleMeasurement | undefined): m is AngleMeasurement {
  return !!m && (m.valueDeg !== null || m.direction !== null)
}

/** "우측 어깨가 더 낮음" → 더 높은 쪽은 좌측 (대상자 기준). 방향을 알 수 없으면 null. */
function higherSideFromDirection(direction: string | null): Side | null {
  if (!direction) return null
  if (direction.includes('우측') && direction.includes('더 낮음')) return 'left'
  if (direction.includes('좌측') && direction.includes('더 낮음')) return 'right'
  return null
}

const HIP_NOTE =
  '고관절 추정점의 높이 차이이며 골반뼈(ASIS 등)의 기울기가 아닙니다. 골반 주변 근육 평가 후보는 PT가 ASIS를 직접 표시한 뒤에만 만들 수 있고, 현재 앱의 ASIS 입력은 측면 사진용이라 좌우 높이 차이용 입력은 아직 없습니다.'

interface Built {
  finding: AnatomyFinding
  /** 이 관찰이 발동시키는 규칙과 측 (조건 충족 시) */
  triggers: { ruleId: string; sides: Side[]; viaView: AtlasView }[]
}

function buildAll(summary: AssessmentSummary): Built[] {
  const ms = allMeasurements(summary)
  const out: Built[] = []

  // 어깨 높이 (정면·후면)
  for (const [id, view] of [
    ['shoulder-tilt', 'front'],
    ['shoulder-tilt-back', 'back']
  ] as const) {
    const m = ms.get(id)
    if (!isUsable(m)) continue
    const higher = higherSideFromDirection(m.direction)
    const overlay: FindingOverlay =
      higher && m.valueDeg !== null
        ? { kind: 'height-pair', region: 'shoulder', higherSide: higher, angleDeg: m.valueDeg }
        : { kind: 'none' }
    out.push({
      finding: {
        id,
        view,
        label: view === 'front' ? '어깨 추정점 높이 차이 (정면)' : '어깨 추정점 높이 차이 (후면)',
        area: '어깨',
        valueText: valueText(m),
        direction: m.direction,
        confidence: m.confidence,
        overlay,
        highlightBones: ['clavicle_left', 'clavicle_right'],
        note: '자동 인식한 어깨 추정점 기준이며 견봉(어깨뼈 끝)을 직접 잰 값이 아닙니다.'
      },
      triggers: higher ? [{ ruleId: 'R01', sides: [higher], viaView: view }] : []
    })
  }

  // 고관절 추정점 높이 (정면·후면): 근육 후보를 만들지 않는다 (R04는 수동 ASIS 필요)
  for (const [id, view] of [
    ['pelvis-tilt', 'front'],
    ['pelvis-tilt-back', 'back']
  ] as const) {
    const m = ms.get(id)
    if (!isUsable(m)) continue
    const higher = higherSideFromDirection(m.direction)
    const overlay: FindingOverlay =
      higher && m.valueDeg !== null
        ? { kind: 'height-pair', region: 'hip', higherSide: higher, angleDeg: m.valueDeg }
        : { kind: 'none' }
    out.push({
      finding: {
        id,
        view,
        label: view === 'front' ? '고관절 추정점 높이 차이 (정면)' : '고관절 추정점 높이 차이 (후면)',
        area: '골반',
        valueText: valueText(m),
        direction: m.direction,
        confidence: m.confidence,
        overlay,
        highlightBones: ['pelvis_left', 'pelvis_right'],
        note: HIP_NOTE
      },
      triggers: []
    })
  }

  // 무릎 정렬 (정면)
  for (const side of ['left', 'right'] as const) {
    const id = `knee-alignment-${side}`
    const m = ms.get(id)
    if (!isUsable(m)) continue
    const medial = !!m.direction?.includes('안쪽으로 편차')
    const lateral = !!m.direction?.includes('바깥쪽으로 편차')
    out.push({
      finding: {
        id,
        view: 'front',
        label: `${side === 'left' ? '좌측' : '우측'} 무릎 정렬 (정면)`,
        area: '무릎',
        valueText: valueText(m),
        direction: m.direction,
        confidence: m.confidence,
        overlay: { kind: 'marker', anchor: `${side}_knee`, label: medial ? '안쪽 편차' : lateral ? '바깥쪽 편차' : '정렬 근처' },
        highlightBones: [`patella_${side}`],
        note: lateral
          ? '바깥쪽 편차는 관절가동범위 평가가 권장되는 항목이며, 이 관찰만으로 근육 후보를 만들지 않습니다.'
          : '2D 정면 사진의 투영 정렬이며, 움직임 중 무릎이 안으로 모이는 동작(동적 valgus)과는 다릅니다.'
      },
      triggers: medial ? [{ ruleId: 'R07', sides: [side], viaView: 'front' }] : []
    })
  }

  // 측면 사진 (좌/우): 귀-어깨, 수동 ASIS-PSIS 골반 경사
  for (const [suffix, side, view] of [
    ['sideR', 'right', 'right'],
    ['sideL', 'left', 'left']
  ] as const) {
    const fh = ms.get(`forward-head-${suffix}`)
    if (isUsable(fh)) {
      const forward = !!fh.direction?.includes('forward head 경향')
      out.push({
        finding: {
          id: `forward-head-${suffix}`,
          view,
          label: `귀-어깨 정렬 (${side === 'right' ? '우측' : '좌측'}면)`,
          area: '머리/목',
          valueText: valueText(fh),
          direction: fh.direction,
          confidence: fh.confidence,
          overlay: { kind: 'pair-line', from: 'right_ear', to: 'right_shoulder', label: `귀–어깨 ${valueText(fh)}` },
          highlightBones: ['cervical_spine_midline'],
          note: '귀와 어깨의 투영 위치 비교이며 두개척추각(CVA)과는 다릅니다.'
        },
        triggers: forward ? [{ ruleId: 'R02', sides: ['left', 'right'], viaView: view }] : []
      })
    }

    const pt = ms.get(`pelvic-tilt-sagittal-${suffix}`)
    if (isUsable(pt)) {
      const anterior = !!pt.direction?.includes('앞으로 기운')
      const posterior = !!pt.direction?.includes('뒤로 기운')
      out.push({
        finding: {
          id: `pelvic-tilt-sagittal-${suffix}`,
          view,
          label: `골반 전후 경사 (PT 지정, ${side === 'right' ? '우측' : '좌측'}면)`,
          area: '골반',
          valueText: valueText(pt),
          direction: pt.direction,
          confidence: pt.confidence,
          overlay: { kind: 'pair-line', from: 'right_psis', to: 'right_asis', label: `ASIS–PSIS ${valueText(pt)}` },
          highlightBones: ['pelvis_right', 'sacrum_midline'],
          note: 'PT가 직접 표시한 ASIS·PSIS 기준점으로 계산한 값입니다.'
        },
        triggers: anterior
          ? [{ ruleId: 'R05', sides: [side], viaView: view }]
          : posterior
            ? [{ ruleId: 'R06', sides: [side], viaView: view }]
            : []
      })
    }
  }

  return out
}

/** 앱의 측정 결과 → 해부학 화면용 관찰 목록 + 근육 평가 후보. */
export function buildAnatomyModel(summary: AssessmentSummary, opts: BuildOptions): AnatomyModel {
  const built = buildAll(summary)
  const ms = allMeasurements(summary)
  const hasConsistencyWarning = summary.consistencyWarnings.length > 0

  const hypotheses: MuscleHypothesis[] = []
  const held: HeldRule[] = []

  for (const { finding, triggers } of built) {
    const m = ms.get(finding.id)
    for (const t of triggers) {
      const rule = RULES[t.ruleId]
      if (!rule) continue
      let reason: HeldRule['reason'] | null = null
      if (!opts.cameraLevelConfirmed) reason = 'camera-level-unconfirmed'
      else if (m && m.confidence !== null && m.confidence < MIN_CLARITY) reason = 'low-clarity'
      else if (t.viaView === 'back' && hasConsistencyWarning) reason = 'side-ambiguous'
      if (reason) {
        held.push({ findingId: finding.id, ruleId: t.ruleId, reason })
        continue
      }
      for (const c of rule.candidates) {
        hypotheses.push({
          id: `${finding.id}:${t.ruleId}:${c.groupId}`,
          ruleId: t.ruleId,
          groupId: c.groupId,
          sides: t.sides,
          target: c.target,
          domains: rule.domains,
          findingId: finding.id,
          state: 'assessment_candidate'
        })
      }
    }
  }

  return { findings: built.map((b) => b.finding), hypotheses, held }
}
