import { regionsForHypothesis, type AtlasAnchor } from './atlas'
import type { AnatomyFinding, AtlasView, MuscleHypothesis } from './types'

const NS = 'http://www.w3.org/2000/svg'
const ACCENT = '#22677e'
/** 도식에서 선이 기울어 보이는 정도를 이 각도로 제한한다 (라벨에는 실제 측정값을 그대로 쓴다). */
export const DISPLAY_ANGLE_CAP_DEG = 12

function esc(id: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id
}

/** 모든 근육을 '미평가'로 되돌리고(정상 판정이 아님), 가설이 있는 영역만 '평가 후보'로 칠한다. */
export function applyMuscleCandidates(svg: SVGSVGElement, view: AtlasView, hypotheses: MuscleHypothesis[]) {
  svg.querySelectorAll('.muscle').forEach((el) => el.setAttribute('data-state', 'unassessed'))
  for (const h of hypotheses) {
    for (const r of regionsForHypothesis(view, h)) {
      const el = svg.querySelector(`#${esc(r.regionId)}`)
      if (el && el.getAttribute('data-kind') === 'muscle') el.setAttribute('data-state', 'assessment_candidate')
    }
  }
}

export function setSelected(svg: SVGSVGElement, ids: string[]) {
  const wanted = new Set(ids)
  svg.querySelectorAll('[data-selected]').forEach((el) => el.setAttribute('data-selected', String(wanted.has(el.id))))
  // 뼈 영역은 data-selected 속성이 없을 수 있으므로 필요한 경우 붙여 준다.
  for (const id of ids) {
    const el = svg.querySelector(`#${esc(id)}`)
    if (el) el.setAttribute('data-selected', 'true')
  }
}

export function setDeepVisible(svg: SVGSVGElement, visible: boolean) {
  svg.querySelector('#deep_layer')?.setAttribute('display', visible ? 'inline' : 'none')
  svg.querySelector('#superficial_layer')?.setAttribute('opacity', visible ? '0.12' : '1')
}

function add(parent: Element, tag: string, attrs: Record<string, string | number>, text?: string): Element {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  if (text) n.textContent = text
  parent.append(n)
  return n
}

function label(parent: Element, x: number, y: number, text: string, anchor: 'start' | 'middle' | 'end' = 'middle') {
  add(parent, 'text', {
    x,
    y,
    'text-anchor': anchor,
    'font-size': 18,
    'font-family': 'sans-serif',
    fill: '#234253',
    stroke: '#ffffff',
    'stroke-width': 4,
    'paint-order': 'stroke'
  }, text)
}

/** 선택한 관찰을 모델의 기준점 주변 오버레이로 표시한다. 모델 자체는 변형하지 않는다. */
export function drawFindingOverlay(
  svg: SVGSVGElement,
  finding: AnatomyFinding | null,
  anchors: Record<string, AtlasAnchor>
) {
  const overlay = svg.querySelector('#analysis_overlay')
  if (!overlay) return
  overlay.replaceChildren()
  if (!finding) return
  const o = finding.overlay

  if (o.kind === 'height-pair') {
    const l = anchors[`left_${o.region}`]
    const r = anchors[`right_${o.region}`]
    if (!l || !r) return
    const y = (l.y + r.y) / 2
    const signed = o.higherSide === 'right' ? o.angleDeg : -o.angleDeg // + = 대상자 오른쪽이 더 높음
    const capped = Math.max(-DISPLAY_ANGLE_CAP_DEG, Math.min(DISPLAY_ANGLE_CAP_DEG, signed))
    const delta = Math.tan((capped * Math.PI) / 180) * Math.abs(r.x - l.x)
    add(overlay, 'line', {
      x1: Math.min(l.x, r.x) - 15, x2: Math.max(l.x, r.x) + 15, y1: y, y2: y,
      stroke: '#a2b6c4', 'stroke-width': 1.5, 'stroke-dasharray': '5 5'
    })
    add(overlay, 'line', { x1: l.x, x2: r.x, y1: y + delta / 2, y2: y - delta / 2, stroke: ACCENT, 'stroke-width': 3 })
    const hi = o.higherSide === 'right' ? r : l
    const hiY = o.higherSide === 'right' ? y - delta / 2 : y + delta / 2
    // ↑ 표시: 더 높게 관찰된 쪽 (화살표 색은 방향 의미가 아니라 강조색)
    add(overlay, 'path', {
      d: `M${hi.x} ${hiY - 14}v-30m-7 8l7-8 7 8`, fill: 'none', stroke: ACCENT, 'stroke-width': 3,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    })
    label(overlay, 300, y - 52, `${o.higherSide === 'right' ? '우' : '좌'}측이 상대적으로 높음 · ${finding.valueText}`)
    if (Math.abs(signed) > DISPLAY_ANGLE_CAP_DEG) label(overlay, 300, y - 28, '※ 선 기울기는 도식 (실제 크기 아님)')
    return
  }

  if (o.kind === 'pair-line') {
    const a = anchors[o.from]
    const b = anchors[o.to]
    if (!a || !b) return
    add(overlay, 'line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: ACCENT, 'stroke-width': 3, 'stroke-dasharray': '6 4' })
    for (const p of [a, b]) add(overlay, 'circle', { cx: p.x, cy: p.y, r: 8, fill: ACCENT, stroke: '#fff', 'stroke-width': 2 })
    label(overlay, (a.x + b.x) / 2, Math.min(a.y, b.y) - 24, o.label)
    return
  }

  if (o.kind === 'marker') {
    const p = anchors[o.anchor]
    if (!p) return
    add(overlay, 'circle', { cx: p.x, cy: p.y, r: 16, fill: ACCENT, 'fill-opacity': 0.18, stroke: ACCENT, 'stroke-width': 3 })
    label(overlay, p.x, p.y - 26, o.label)
  }
}
