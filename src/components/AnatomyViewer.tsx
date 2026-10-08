import { useEffect, useMemo, useRef, useState } from 'react'
import { applyMuscleCandidates, drawFindingOverlay, setDeepVisible, setSelected } from '@/anatomy/applyAtlas'
import {
  ATLAS_REVIEW_STATUS,
  assetKey,
  getAsset,
  regionsForHypothesis,
  SVG_LOADERS,
  viewsShowingHypothesis,
  type AssetKey,
  type Mode
} from '@/anatomy/atlas'
import { buildAnatomyModel } from '@/anatomy/buildAnatomy'
import { DOMAIN_LABEL, MUSCLE_GROUPS, SIDE_LABEL, TARGET_LABEL } from '@/anatomy/catalog'
import type { AnatomyFinding, AtlasView, MuscleHypothesis } from '@/anatomy/types'
import LibrarySuggestions from '@/components/LibrarySuggestions'
import type { AssessmentSummary } from '@/types'

const VIEW_LABEL: Record<Exclude<AtlasView, 'left'>, string> = { front: '정면', back: '후면', right: '우측면' }
const HELD_TEXT = {
  'camera-level-unconfirmed': '카메라 수평 확인 전',
  'low-clarity': '인식 명확도 낮음',
  'side-ambiguous': '정면·후면 좌우 방향이 서로 달라 보류'
} as const

function sideText(h: MuscleHypothesis): string {
  return h.sides.length === 2 ? '양측' : `${SIDE_LABEL[h.sides[0]]}측`
}

export default function AnatomyViewer({ summary }: { summary: AssessmentSummary }) {
  const [mode, setMode] = useState<Mode>('skeleton')
  const [view, setView] = useState<Exclude<AtlasView, 'left'>>('front')
  const [cameraOk, setCameraOk] = useState(false)
  const [showDeep, setShowDeep] = useState(false)
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [selectedHypId, setSelectedHypId] = useState<string | null>(null)
  const [svg, setSvg] = useState<{ key: AssetKey; html: string } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const model = useMemo(() => buildAnatomyModel(summary, { cameraLevelConfirmed: cameraOk }), [summary, cameraOk])
  const key = assetKey(mode, view)

  // 방향/모드가 바뀔 때만 SVG 파일을 불러온다.
  useEffect(() => {
    if (!key) return
    let cancelled = false
    setLoadError(false)
    SVG_LOADERS[key]()
      .then((html) => !cancelled && setSvg({ key, html }))
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
  }, [key])

  const viewFindings = model.findings.filter((f) => f.view === view)
  const leftSideCount = model.findings.filter((f) => f.view === 'left').length
  const selectedFinding: AnatomyFinding | null = model.findings.find((f) => f.id === selectedFindingId) ?? null
  const selectedHyp: MuscleHypothesis | null = model.hypotheses.find((h) => h.id === selectedHypId) ?? null

  // SVG에 현재 상태(평가 후보, 선택, 심부층, 오버레이)를 적용한다.
  useEffect(() => {
    const el = box.current?.querySelector('svg') as SVGSVGElement | null
    if (!el || !svg || svg.key !== key || !key) return
    setDeepVisible(el, mode === 'muscle' && showDeep)
    if (mode === 'muscle') {
      applyMuscleCandidates(el, view, model.hypotheses)
      const ids = selectedHyp ? regionsForHypothesis(view, selectedHyp).map((r) => r.regionId) : []
      setSelected(el, ids)
      drawFindingOverlay(el, null, {})
    } else {
      const f = selectedFinding && selectedFinding.view === view ? selectedFinding : null
      setSelected(el, f ? f.highlightBones : [])
      drawFindingOverlay(el, f, getAsset(key).anchors)
    }
  }, [svg, key, mode, view, model, selectedHyp, selectedFinding, showDeep])

  function selectHypothesis(h: MuscleHypothesis) {
    const here = regionsForHypothesis(view, h)
    let target = view
    let regs = here
    if (here.length === 0) {
      const v = viewsShowingHypothesis(h)[0]
      if (v) {
        target = v as typeof view
        regs = regionsForHypothesis(v, h)
      }
    }
    setMode('muscle')
    setView(target)
    setSelectedHypId(h.id)
    setSelectedFindingId(h.findingId)
    if (regs.some((r) => r.layer === 'deep')) setShowDeep(true)
  }

  function openRelatedMuscles(f: AnatomyFinding) {
    const first = model.hypotheses.find((h) => h.findingId === f.id)
    if (first) selectHypothesis(first)
  }

  function onStageClick(e: React.MouseEvent) {
    if (mode !== 'muscle') return
    const g = (e.target as Element).closest?.('.muscle')
    if (!g) return
    const h = model.hypotheses.find((x) => regionsForHypothesis(view, x).some((r) => r.regionId === g.id))
    if (h) setSelectedHypId(h.id)
  }

  const relatedHyps = selectedFinding ? model.hypotheses.filter((h) => h.findingId === selectedFinding.id) : []
  const heldForSelected = selectedFinding ? model.held.filter((x) => x.findingId === selectedFinding.id) : []

  return (
    <div className="card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-clinical-900">해부학 모델로 보기</h3>
        <p className="mt-1 text-xs leading-relaxed text-clinical-500">
          중립 자세의 도식 모델 위에 측정된 관찰과 &quot;근육 평가 후보&quot;를 표시합니다. 실제 뼈 위치나 근육 상태를
          보여 주는 그림이 아닙니다.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-clinical-100 p-1">
        {(['skeleton', 'muscle'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === m ? 'bg-white text-clinical-900 shadow-sm' : 'text-clinical-500'}`}
          >
            {m === 'skeleton' ? 'Skeleton · 골격' : 'Muscle · 근육'}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {(Object.keys(VIEW_LABEL) as (keyof typeof VIEW_LABEL)[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${view === v ? 'border-mint-300 bg-mint-50 text-mint-800' : 'border-clinical-200 bg-white text-clinical-500'}`}
          >
            {VIEW_LABEL[v]}
          </button>
        ))}
      </div>

      {/* 모델 */}
      <div className="relative rounded-xl bg-clinical-50 py-3">
        {loadError && <p className="px-4 py-10 text-center text-sm text-clinical-400">모델을 불러오지 못했습니다.</p>}
        {!loadError && (!svg || svg.key !== key) && (
          <p className="px-4 py-10 text-center text-sm text-clinical-400">모델 불러오는 중…</p>
        )}
        {svg && svg.key === key && (
          <div
            ref={box}
            onClick={onStageClick}
            className="mx-auto w-full max-w-[260px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg.html }}
          />
        )}
        <p className="mt-1 text-center text-[11px] text-clinical-400">
          대상자 기준 좌우 · {view === 'front' ? '정면: 대상자 오른쪽이 화면 왼쪽' : view === 'back' ? '후면: 대상자 오른쪽이 화면 오른쪽' : '우측면: 얼굴이 화면 오른쪽'}
        </p>
      </div>

      {mode === 'muscle' && (
        <div className="space-y-2 text-xs text-clinical-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="legend-dot" style={{ background: '#efcb73' }} />
              평가 후보 (자세 규칙만 발동)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="legend-dot" style={{ background: '#ced8df' }} />
              미평가 (정상 판정 아님)
            </span>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showDeep} onChange={(e) => setShowDeep(e.target.checked)} />
            심부 근육 도식 보기 (피부에서 직접 보이는 근육이 아님)
          </label>
          <p className="text-clinical-400">
            긴장 의심(빨강)·약화 의심(파랑)은 PT의 근력·길이 검사 결과가 입력된 뒤에만 표시됩니다. 이 앱에는 해당
            입력 기능이 아직 없어 지금은 표시되지 않습니다.
          </p>
        </div>
      )}

      {/* 카메라 수평 확인 */}
      <label className="flex items-start gap-2 rounded-xl border border-clinical-100 p-3 text-xs leading-relaxed text-clinical-600">
        <input type="checkbox" className="mt-0.5" checked={cameraOk} onChange={(e) => setCameraOk(e.target.checked)} />
        <span>
          <b className="text-clinical-800">촬영할 때 카메라가 수평이었음을 확인했습니다.</b>
          <br />
          확인하기 전에는 근육 평가 후보를 만들지 않습니다. 카메라가 기울면 어깨·골반이 기울어 보일 수 있기 때문입니다.
        </span>
      </label>

      {/* 목록 */}
      {mode === 'skeleton' ? (
        <div className="space-y-2">
          <p className="label-caption">관찰 항목 · {VIEW_LABEL[view]}</p>
          {viewFindings.length === 0 && (
            <p className="text-sm text-clinical-400">이 방향에서 측정된 항목이 없습니다 (사진이 없거나 측정 불확실).</p>
          )}
          {viewFindings.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFindingId(f.id === selectedFindingId ? null : f.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${f.id === selectedFindingId ? 'border-mint-300 bg-mint-50' : 'border-clinical-100 bg-white'}`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-clinical-900">{f.label}</span>
                <span className="block truncate text-xs text-clinical-500">{f.valueText}</span>
              </span>
              <span className="text-clinical-300">›</span>
            </button>
          ))}
          {leftSideCount > 0 && (
            <p className="text-xs text-clinical-400">
              좌측면 사진의 측정값 {leftSideCount}개는 좌측면 모델이 아직 없어 모델 위에 표시하지 않습니다 (우측면 모델을
              좌우 반전해서 쓰지 않습니다). 해당 값은 &quot;측정 근거&quot; 탭에서 볼 수 있습니다.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="label-caption">근육 평가 후보</p>
          {model.hypotheses.length === 0 && (
            <p className="text-sm text-clinical-400">
              {!cameraOk
                ? '카메라 수평을 확인하면, 측정된 관찰에서 만들어지는 평가 후보가 여기에 나옵니다.'
                : '현재 측정 결과에서는 연결되는 평가 후보가 없습니다 (측정이 없거나, 규칙이 요구하는 입력이 없음).'}
            </p>
          )}
          {model.hypotheses.map((h) => {
            const g = MUSCLE_GROUPS[h.groupId]
            const here = regionsForHypothesis(view, h).length > 0
            const finding = model.findings.find((f) => f.id === h.findingId)
            return (
              <button
                key={h.id}
                onClick={() => selectHypothesis(h)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${h.id === selectedHypId ? 'border-mint-300 bg-mint-50' : 'border-clinical-100 bg-white'}`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-clinical-900">
                    {g.nameKo} <span className="font-normal text-clinical-500">({sideText(h)})</span>
                  </span>
                  <span className="block text-xs text-clinical-500">
                    {TARGET_LABEL[h.target]} 후보 · 근거: {finding?.label}
                  </span>
                </span>
                <span className="flex-none text-xs text-mint-700">{here ? '' : '다른 방향 ›'}</span>
              </button>
            )
          })}
          {model.held.length > 0 && (
            <p className="text-xs text-clinical-400">
              보류된 규칙 {model.held.length}개:{' '}
              {Array.from(new Set(model.held.map((x) => HELD_TEXT[x.reason]))).join(', ')}.
            </p>
          )}
        </div>
      )}

      {/* 상세 카드: Skeleton */}
      {mode === 'skeleton' && selectedFinding && (
        <div className="space-y-2 rounded-xl border border-clinical-100 p-4 text-sm text-clinical-600">
          <h4 className="font-semibold text-clinical-900">{selectedFinding.label}</h4>
          <p>
            <b className="text-clinical-800">측정값</b> · {selectedFinding.valueText}
          </p>
          <p>
            <b className="text-clinical-800">인식 명확도</b> ·{' '}
            {selectedFinding.confidence !== null ? `${Math.round(selectedFinding.confidence * 100)}%` : '해당 없음 (PT가 직접 표시한 기준점)'}
          </p>
          {selectedFinding.note && <p className="text-xs text-clinical-500">{selectedFinding.note}</p>}
          {selectedFinding.overlay.kind === 'height-pair' && Math.abs(selectedFinding.overlay.angleDeg) < 1 && (
            <p className="text-xs text-clinical-400">작은 차이는 측정 오차일 수 있습니다 (반복 촬영 재현성은 아직 검증 전).</p>
          )}
          {relatedHyps.length > 0 ? (
            <button onClick={() => openRelatedMuscles(selectedFinding)} className="btn-mint w-full py-2.5 text-sm">
              관련 근육 보기 ({relatedHyps.length})
            </button>
          ) : (
            <p className="text-xs text-clinical-400">
              {heldForSelected.length > 0
                ? `근육 평가 후보는 보류 중입니다: ${HELD_TEXT[heldForSelected[0].reason]}.`
                : '이 관찰에서 만들어지는 근육 평가 후보는 없습니다 (연결된 규칙 없음 또는 조건 미충족).'}
            </p>
          )}
        </div>
      )}

      {/* 상세 카드: Muscle */}
      {mode === 'muscle' && selectedHyp && (
        <div className="space-y-2 rounded-xl border border-clinical-100 p-4 text-sm text-clinical-600">
          <h4 className="font-semibold text-clinical-900">
            {MUSCLE_GROUPS[selectedHyp.groupId].nameKo}{' '}
            <span className="text-xs font-normal text-clinical-400">{MUSCLE_GROUPS[selectedHyp.groupId].nameEn}</span>
          </h4>
          <p className="flex flex-wrap items-center gap-2">
            <span className="pill-coral">평가 후보</span>
            <span className="text-xs">{sideText(selectedHyp)} · {TARGET_LABEL[selectedHyp.target]}</span>
          </p>
          <p>
            <b className="text-clinical-800">사진에서 관찰한 항목</b> ·{' '}
            {model.findings.find((f) => f.id === selectedHyp.findingId)?.label}
          </p>
          <p>
            <b className="text-clinical-800">권장 평가</b> · {selectedHyp.domains.map((d) => DOMAIN_LABEL[d]).join(', ')}
          </p>
          <p className="text-xs text-clinical-500">
            근거 수준: 자세 사진만 (검증 전 후보). 사진만으로 근육이 긴장했거나 약하다고 판단할 수 없으며, PT의 검사로
            확인해야 합니다.
          </p>
          <button
            onClick={() => {
              setMode('skeleton')
              const f = model.findings.find((x) => x.id === selectedHyp.findingId)
              if (f) {
                setView(f.view === 'left' ? 'front' : f.view)
                setSelectedFindingId(f.id)
              }
            }}
            className="btn-secondary w-full py-2 text-sm"
          >
            이 관찰을 골격 모델에서 보기
          </button>
          {(() => {
            const f = model.findings.find((x) => x.id === selectedHyp.findingId)
            return f ? (
              <div className="border-t border-clinical-100 pt-3">
                <p className="label-caption mb-2">연결된 운동 (참고용)</p>
                <LibrarySuggestions area={f.area} areaLabel={f.area} />
              </div>
            ) : null
          })()}
        </div>
      )}

      <p className="border-t border-clinical-100 pt-3 text-[11px] leading-relaxed text-clinical-400">
        해부학 도식 모델 v0.1 · 검수 상태: {ATLAS_REVIEW_STATUS === 'pending' ? '해부학 전문가 검수 전' : ATLAS_REVIEW_STATUS}.
        근육 경계·깊이·기준점 위치는 단순화되어 있습니다. 평가 후보 규칙은 임상 검증 전 제안이며 진단이 아닙니다.
      </p>
    </div>
  )
}
