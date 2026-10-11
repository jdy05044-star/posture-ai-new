import index from './atlasIndex.json'
import { MUSCLE_GROUPS } from './catalog'
import type { AtlasView, MuscleHypothesis, Side } from './types'

export type Mode = 'skeleton' | 'muscle'
export type AssetKey = 'skeleton-front' | 'skeleton-back' | 'skeleton-right' | 'muscle-front' | 'muscle-back' | 'muscle-right'

export interface AtlasRegion {
  id: string
  muscleId: string | null
  nameKo: string
  side: string
  layer: string
  kind: string
}
export interface AtlasAnchor {
  x: number
  y: number
  type: string
}
export interface AtlasAsset {
  file: string
  view: string
  kind: string
  reviewStatus: string
  anchors: Record<string, AtlasAnchor>
  regions: AtlasRegion[]
}

const ASSETS = index.assets as unknown as Record<AssetKey, AtlasAsset>

export const ATLAS_VERSION: string = index.atlasVersion
export const ATLAS_REVIEW_STATUS: string = index.anatomicalReview

export function assetKey(mode: Mode, view: AtlasView): AssetKey | null {
  if (view === 'left') return null // 좌측면 자산 없음 — 우측면을 반전해서 쓰지 않는다
  const v = view === 'right' ? 'right' : view
  return `${mode}-${v}` as AssetKey
}

export function getAsset(key: AssetKey): AtlasAsset {
  return ASSETS[key]
}

/** SVG 파일을 필요할 때만 불러온다 (번들 크기를 줄이기 위해 지연 로딩). */
export const SVG_LOADERS: Record<AssetKey, () => Promise<string>> = {
  'skeleton-front': () => import('@/assets/atlas/skeleton_front.svg?raw').then((m) => m.default),
  'skeleton-back': () => import('@/assets/atlas/skeleton_back.svg?raw').then((m) => m.default),
  'skeleton-right': () => import('@/assets/atlas/skeleton_right_side.svg?raw').then((m) => m.default),
  'muscle-front': () => import('@/assets/atlas/muscle_front.svg?raw').then((m) => m.default),
  'muscle-back': () => import('@/assets/atlas/muscle_back.svg?raw').then((m) => m.default),
  'muscle-right': () => import('@/assets/atlas/muscle_right_side.svg?raw').then((m) => m.default)
}

export interface HypothesisRegion {
  regionId: string
  side: Side
  layer: string
  nameKo: string
}

/** 근육 가설이 해당 방향의 모델에서 칠해질 수 있는 영역들 (없으면 빈 배열). */
export function regionsForHypothesis(view: AtlasView, h: MuscleHypothesis): HypothesisRegion[] {
  const key = assetKey('muscle', view)
  if (!key) return []
  const group = MUSCLE_GROUPS[h.groupId]
  if (!group) return []
  const regs = ASSETS[key].regions
  const out: HypothesisRegion[] = []
  for (const muscleId of group.atlasMuscleIds) {
    for (const side of h.sides) {
      const r = regs.find((x) => x.id === `${muscleId}_${side}` && x.kind === 'muscle')
      if (r) out.push({ regionId: r.id, side, layer: r.layer, nameKo: r.nameKo })
    }
  }
  return out
}

/** 가설이 보이는 방향을 찾는다. 현재 방향에 없으면 정면→후면→우측면 순으로 첫 번째를 돌려준다. */
export function viewsShowingHypothesis(h: MuscleHypothesis): AtlasView[] {
  return (['front', 'back', 'right'] as AtlasView[]).filter((v) => regionsForHypothesis(v, h).length > 0)
}
