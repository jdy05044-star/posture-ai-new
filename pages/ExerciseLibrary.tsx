import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ExerciseImageSlot from '@/library/ExerciseImageSlot'
import EnrichmentSection from '@/library/EnrichmentSection'
import { useResolvedImages } from '@/library/exerciseImages'
import {
  ALL,
  buildApprovedExport,
  DEFAULT_FILTERS,
  effectiveStatus,
  filterExercises,
  levelOptions,
  uniqueValues,
  type ExerciseFilters
} from '@/library/libraryFilters'
import {
  BODY_PARTS_PENDING_COLLECTION,
  LIBRARY_EXERCISES,
  LIBRARY_ISSUES,
  LIBRARY_META
} from '@/library/libraryData'
import { OVERLAY_KEY, usePersistentRecord } from '@/library/libraryStorage'
import type { ExerciseOverlay, LibraryExercise } from '@/library/types'

const PAGE_SIZE = 20
const PART_ORDER = ['머리/목', '어깨', '허리/몸통', '골반', '무릎', '발', '전신']

function numOrNull(v: string): number | null {
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function StatusPill({ status }: { status: string }) {
  return status === 'PT 승인' ? <span className="pill-mint">PT 승인</span> : <span className="pill-coral">PT 검수 필요</span>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-clinical-700">{label}</span>
      {children}
    </label>
  )
}

const selectCls = 'w-full rounded-xl border border-clinical-200 bg-white px-3 py-2.5 text-sm text-clinical-800'

interface DetailProps {
  ex: LibraryExercise
  imageUrl: string | null | undefined
  overlay: ExerciseOverlay
  onChange: (next: ExerciseOverlay) => void
}

function ExerciseDetail({ ex, imageUrl, overlay, onChange }: DetailProps) {
  const [confirming, setConfirming] = useState(false)
  const [reviewer, setReviewer] = useState(overlay.reviewedBy ?? '')
  const [checked, setChecked] = useState(false)
  const status = effectiveStatus(ex, overlay)
  const isGoodnotes = ex.source.file.includes('goodnotes')

  function approve() {
    onChange({ ...overlay, status: 'PT 승인', reviewedBy: reviewer.trim(), reviewedAt: new Date().toISOString() })
    setConfirming(false)
    setChecked(false)
  }

  return (
    <div className="space-y-5 pb-6 pt-1 text-sm leading-relaxed text-clinical-600">
      <ExerciseImageSlot url={imageUrl} label={ex.name} variant="full" />

      <section>
        <h4 className="mb-1 font-semibold text-clinical-900">동작 설명</h4>
        <ol className="list-decimal space-y-1 pl-5">
          {ex.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {ex.goals && <p className="mt-2 text-clinical-500">목표: {ex.goals}</p>}
      </section>

      <section>
        <h4 className="mb-1 font-semibold text-clinical-900">
          관련 근육 <span className="ml-1 text-sm font-normal text-alert-red">PT 검수 전</span>
        </h4>
        {ex.targetMuscles.length > 0 ? (
          <p>{ex.targetMuscles.join(', ')}</p>
        ) : (
          <p className="text-clinical-400">표기된 근육 없음</p>
        )}
        <p className="mt-1 text-sm text-clinical-400">원자료 언급과 동작 기반 편집이 섞여 있어 확정된 평가가 아닙니다.</p>
      </section>

      <EnrichmentSection exerciseId={ex.id} name={ex.name} overlay={overlay} onChange={onChange} />

      <section>
        <h4 className="mb-1 font-semibold text-clinical-900">주의사항</h4>
        <p>{ex.cautions || <span className="text-clinical-400">표기된 주의사항 없음</span>}</p>
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-clinical-900">횟수 · 세트</h4>
        <p>
          원문 반복 수:{' '}
          {ex.sourceDosage ? (
            <span className="font-medium text-clinical-800">{ex.sourceDosage}</span>
          ) : (
            <span className="text-clinical-400">원문에 표기 없음</span>
          )}
        </p>
        <p className="mt-1 text-sm text-clinical-400">원문 반복 수는 문헌 속 동작 횟수이며, 아래 개인 처방 값과는 별개입니다.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="횟수">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={overlay.reps ?? ''}
              onChange={(e) => onChange({ ...overlay, reps: numOrNull(e.target.value) })}
              placeholder="미입력"
              className={selectCls}
            />
          </Field>
          <Field label="세트">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={overlay.sets ?? ''}
              onChange={(e) => onChange({ ...overlay, sets: numOrNull(e.target.value) })}
              placeholder="미입력"
              className={selectCls}
            />
          </Field>
          <Field label="유지(초)">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={overlay.holdSeconds ?? ''}
              onChange={(e) => onChange({ ...overlay, holdSeconds: numOrNull(e.target.value) })}
              placeholder="미입력"
              className={selectCls}
            />
          </Field>
        </div>
        <p className="mt-1 text-sm text-clinical-400">개인 처방 값은 PT가 직접 입력합니다. 비어 있으면 미입력으로 남습니다.</p>
      </section>

      <section>
        <h4 className="mb-1 font-semibold text-clinical-900">출처</h4>
        <p>
          {ex.source.file}
          {ex.source.pdfPage !== null && <> · PDF 내 {ex.source.pdfPage}쪽</>}
        </p>
        {isGoodnotes && (
          <p className="mt-1 text-sm text-clinical-400">Goodnotes 내부 PDF의 쪽수이며, 원본 노트 전체의 페이지 번호가 아닙니다.</p>
        )}
        <p className="mt-1">
          원문 LEVEL:{' '}
          {ex.sourceLevel !== null ? (
            <span className="font-medium text-clinical-800">{ex.sourceLevel}단계</span>
          ) : (
            <span className="text-clinical-400">표기 없음</span>
          )}
          <span className="text-sm text-clinical-400"> (원본 프로그램 자체의 순서이며 난이도·위험도가 아닙니다)</span>
        </p>
        <p className="mt-1 text-sm text-clinical-400">{ex.evidenceNote}</p>
      </section>

      <section>
        <Field label="PT 메모">
          <textarea
            value={overlay.memo ?? ''}
            onChange={(e) => onChange({ ...overlay, memo: e.target.value })}
            rows={3}
            placeholder="수정할 점, 회원별 주의사항 등 (이름 등 개인정보는 적지 마세요)"
            className={selectCls}
          />
        </Field>
        <p className="mt-1 text-sm text-clinical-400">메모는 이 브라우저에만 저장됩니다.</p>
      </section>

      <section className="border-t border-clinical-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-clinical-900">PT 검수 · 승인</h4>
          <StatusPill status={status} />
        </div>
        {status === 'PT 승인' ? (
          <>
            <p>
              검수자: {overlay.reviewedBy || '이름 미입력'}
              {overlay.reviewedAt && <> · {new Date(overlay.reviewedAt).toLocaleDateString('ko-KR')}</>}
            </p>
            <button
              onClick={() => onChange({ ...overlay, status: 'PT 검수 필요', reviewedAt: undefined })}
              className="mt-2 text-sm font-semibold text-clinical-600 underline"
            >
              승인 취소
            </button>
          </>
        ) : confirming ? (
          <div className="space-y-3">
            <Field label="검수한 PT 이름">
              <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={selectCls} placeholder="예: 홍길동 PT" />
            </Field>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
              <span>동작 설명·관련 근육·주의사항을 직접 검토했고, 처방에 사용해도 된다고 판단합니다.</span>
            </label>
            <div className="flex gap-2">
              <button onClick={approve} disabled={!checked || reviewer.trim() === ''} className="btn-mint flex-1 py-2.5 disabled:opacity-40">
                승인하기
              </button>
              <button onClick={() => setConfirming(false)} className="btn-secondary flex-1 py-2.5">
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-clinical-500">검수 전 운동은 AI가 확정 처방처럼 추천하지 않으며, 처방 내보내기에도 포함되지 않습니다.</p>
            <button onClick={() => setConfirming(true)} className="btn-secondary mt-2 w-full py-2.5">
              PT 검수 완료로 승인
            </button>
          </>
        )}
      </section>
    </div>
  )
}

export default function ExerciseLibrary() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ExerciseFilters>(DEFAULT_FILTERS)
  const [openId, setOpenId] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const overlays = usePersistentRecord<ExerciseOverlay>(OVERLAY_KEY)
  const images = useResolvedImages(LIBRARY_EXERCISES)

  const parts = useMemo(() => {
    const present = uniqueValues(LIBRARY_EXERCISES, (e) => e.bodyPart)
    return PART_ORDER.filter((p) => present.includes(p)).concat(present.filter((p) => !PART_ORDER.includes(p)))
  }, [])
  const types = useMemo(() => uniqueValues(LIBRARY_EXERCISES, (e) => e.exerciseType), [])
  const levels = useMemo(() => levelOptions(LIBRARY_EXERCISES), [])

  const filtered = useMemo(
    () => filterExercises(LIBRARY_EXERCISES, filters, images, overlays.data),
    [filters, images, overlays.data]
  )
  const approved = useMemo(() => buildApprovedExport(LIBRARY_EXERCISES, overlays.data), [overlays.data])
  const approvedWithoutDose = approved.filter((a) => a.prescription.reps === null && a.prescription.sets === null && a.prescription.holdSeconds === null).length
  const imagesPending = Object.values(images).some((v) => v === undefined) || Object.keys(images).length < LIBRARY_EXERCISES.length
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS)

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [filters])

  function set<K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  function exportApproved() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'PT가 검수·승인한 운동만 포함됩니다. prescription 값은 PT가 직접 입력한 값이며, null은 미입력입니다.',
      library: `${LIBRARY_META.libraryName} v${LIBRARY_META.version}`,
      items: approved
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `posturept-approved-exercises-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shown = filtered.slice(0, visible)

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm font-semibold text-clinical-500">
          ← 홈
        </button>
        <button onClick={() => navigate('/tests')} className="text-sm font-semibold text-mint-700">
          기능검사 →
        </button>
      </div>
      <h1 className="text-xl font-semibold text-clinical-900">운동 라이브러리</h1>
      <p className="mt-1 text-sm text-clinical-500">
        {LIBRARY_EXERCISES.length}개 운동 · v{LIBRARY_META.version}
      </p>

      <p className="mt-3 rounded-xl bg-clinical-100 px-4 py-3 text-sm leading-relaxed text-clinical-600">
        PT 검수 전 자료입니다. 근육·목적·주의사항에는 앱용으로 편집한 내용이 섞여 있어 확정된 의료 판단이 아니며,
        자세 평가 결과의 자동 처방에는 사용되지 않습니다.
      </p>

      {LIBRARY_ISSUES.length > 0 && (
        <p className="mt-3 rounded-xl bg-alert-coral/15 px-4 py-3 text-sm text-alert-red">
          형식이 맞지 않아 제외된 항목이 {LIBRARY_ISSUES.length}개 있습니다:{' '}
          {LIBRARY_ISSUES.map((i) => `${i.id}(${i.problem})`).join(', ')}
        </p>
      )}

      {/* 검색 + 필터 */}
      <div className="mt-5 space-y-3">
        <input
          type="search"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="운동 이름 검색 (한글·영문)"
          className="w-full rounded-xl border border-clinical-200 bg-white px-4 py-3 text-sm text-clinical-900"
        />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {[ALL, ...parts].map((p) => (
            <button
              key={p}
              onClick={() => set('bodyPart', p)}
              className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                filters.bodyPart === p ? 'border-clinical-700 bg-clinical-700 text-white' : 'border-clinical-200 bg-white text-clinical-600'
              }`}
            >
              {p}
            </button>
          ))}
          {BODY_PARTS_PENDING_COLLECTION.map((p) => (
            <span key={p} className="flex-none rounded-full border border-dashed border-clinical-200 px-3.5 py-1.5 text-sm text-clinical-400">
              {p} · 수집 예정
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="운동 유형">
            <select value={filters.exerciseType} onChange={(e) => set('exerciseType', e.target.value)} className={selectCls}>
              <option>{ALL}</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="원문 LEVEL">
            <select value={filters.level} onChange={(e) => set('level', e.target.value)} className={selectCls}>
              <option>{ALL}</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l === '미표기' ? l : `${l}단계`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="이미지">
            <select value={filters.image} onChange={(e) => set('image', e.target.value)} className={selectCls}>
              <option>{ALL}</option>
              <option>있음</option>
              <option>없음</option>
            </select>
          </Field>
          <Field label="검수 상태">
            <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={selectCls}>
              <option>{ALL}</option>
              <option>PT 검수 필요</option>
              <option>PT 승인</option>
            </select>
          </Field>
        </div>
        <p className="text-sm text-clinical-400">
          원문 LEVEL은 원본 자료 자체의 단계 번호이며 난이도·위험도가 아닙니다.
          {filters.image !== ALL && imagesPending && ' 이미지 파일 확인 중에는 결과가 달라질 수 있습니다.'}
        </p>
      </div>

      {/* 결과 요약 + 승인 내보내기 */}
      <div className="mb-1 mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-clinical-800">{filtered.length}개 표시</p>
        <div className="flex items-center gap-3">
          {!isDefault && (
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-sm font-semibold text-clinical-500 underline">
              필터 초기화
            </button>
          )}
          <button
            onClick={exportApproved}
            disabled={approved.length === 0}
            className="text-sm font-semibold text-mint-700 disabled:text-clinical-300"
          >
            승인 운동 내보내기 ({approved.length})
          </button>
        </div>
      </div>
      {approved.length === 0 ? (
        <p className="mb-2 text-sm text-clinical-400">PT가 승인한 운동만 처방용으로 내보낼 수 있습니다. 아직 승인된 운동이 없습니다.</p>
      ) : (
        approvedWithoutDose > 0 && (
          <p className="mb-2 text-sm text-alert-red">승인된 운동 중 {approvedWithoutDose}개는 횟수·세트가 미입력입니다. 처방 전에 입력해주세요.</p>
        )
      )}

      {/* 목록 */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-clinical-400">조건에 맞는 운동이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-clinical-100 border-y border-clinical-100">
          {shown.map((ex) => {
            const isOpen = openId === ex.id
            const status = effectiveStatus(ex, overlays.data[ex.id])
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : ex.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 py-4 text-left"
                >
                  <ExerciseImageSlot url={images[ex.id]} label={ex.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold leading-snug text-clinical-900">{ex.name}</h3>
                      <StatusPill status={status} />
                    </div>
                    <p className="mt-1 text-sm text-clinical-500">
                      {ex.bodyPart} · {ex.exerciseType}
                      {ex.sourceLevel !== null && <> · 원문 {ex.sourceLevel}단계</>}
                    </p>
                    {ex.goals && <p className="mt-1 line-clamp-2 text-sm text-clinical-600">목표: {ex.goals}</p>}
                    <p className="mt-1 truncate text-xs text-clinical-400">
                      출처: {ex.source.file}
                      {ex.source.pdfPage !== null && ` · ${ex.source.pdfPage}쪽`}
                    </p>
                  </div>
                </button>
                {isOpen && (
                  <ExerciseDetail
                    ex={ex}
                    imageUrl={images[ex.id]}
                    overlay={overlays.data[ex.id] ?? {}}
                    onChange={(next) => overlays.update(ex.id, next)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}

      {filtered.length > visible && (
        <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary mt-4 w-full py-3">
          더 보기 ({filtered.length - visible}개 남음)
        </button>
      )}

      {overlays.saveFailed && (
        <p className="mt-4 text-sm text-alert-red">이 브라우저에서 저장 공간을 쓸 수 없어 메모·승인이 새로고침 후 사라질 수 있습니다.</p>
      )}

      <p className="mt-8 text-sm leading-relaxed text-clinical-400">
        무릎·발 독립 운동은 업로드 자료에서 충분히 확인되지 않아 포함되어 있지 않으며, 별도 출처로 수집할 예정입니다. 운동 이미지는
        /public/images/exercises/ 에 사용 권리가 확인된 파일을 넣으면 자동으로 표시됩니다.
      </p>
    </div>
  )
}
