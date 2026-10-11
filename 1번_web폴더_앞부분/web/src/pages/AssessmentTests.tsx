import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LIBRARY_ISSUES, LIBRARY_TESTS } from '@/library/libraryData'
import { TEST_RECORDS_KEY, usePersistentRecord } from '@/library/libraryStorage'
import type { AssessmentTest, TestRecord } from '@/library/types'

const PART_ORDER = ['머리/목', '어깨', '허리/몸통', '골반', '무릎', '발', '전신']
const PAIN_OPTIONS = Array.from({ length: 11 }, (_, i) => String(i))
const fieldCls = 'w-full rounded-xl border border-clinical-200 bg-white px-3 py-2.5 text-sm text-clinical-800'

const EMPTY: TestRecord = { left: '', right: '', pain: '', notes: '', updatedAt: '' }

function isEmpty(r: TestRecord) {
  return !r.left.trim() && !r.right.trim() && r.pain === '' && !r.notes.trim()
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-clinical-700">{label}</span>
      {children}
    </label>
  )
}

interface FormProps {
  test: AssessmentTest
  record: TestRecord
  onChange: (next: TestRecord | null) => void
}

function TestForm({ test, record, onChange }: FormProps) {
  const isSpecialist = test.testType.includes('전문가')

  function patch(part: Partial<TestRecord>) {
    const next = { ...record, ...part, updatedAt: new Date().toISOString() }
    onChange(isEmpty(next) ? null : next)
  }

  return (
    <div className="space-y-4 pb-6 pt-1 text-sm leading-relaxed text-clinical-600">
      <p>{test.purpose}</p>
      {isSpecialist && (
        <p className="text-alert-red">{test.testType}입니다. 이 앱은 결과를 기록만 하며, 검사 수행이나 판정을 대신하지 않습니다.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="좌측 소견">
          <textarea
            rows={3}
            value={record.left}
            onChange={(e) => patch({ left: e.target.value })}
            className={fieldCls}
            placeholder="관찰·측정한 내용"
          />
        </Field>
        <Field label="우측 소견">
          <textarea
            rows={3}
            value={record.right}
            onChange={(e) => patch({ right: e.target.value })}
            className={fieldCls}
            placeholder="관찰·측정한 내용"
          />
        </Field>
      </div>

      <Field label="통증 (0~10, 선택)">
        <select value={record.pain} onChange={(e) => patch({ pain: e.target.value })} className={fieldCls}>
          <option value="">미기록</option>
          {PAIN_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="평가자 메모">
        <textarea
          rows={3}
          value={record.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          className={fieldCls}
          placeholder="이름 등 개인정보는 적지 마세요"
        />
      </Field>

      <div className="flex items-center justify-between text-sm">
        <span className="text-clinical-400">
          {record.updatedAt ? `마지막 기록 ${new Date(record.updatedAt).toLocaleString('ko-KR')}` : '아직 기록 없음'}
        </span>
        {record.updatedAt && (
          <button onClick={() => onChange(null)} className="font-semibold text-clinical-500 underline">
            기록 지우기
          </button>
        )}
      </div>

      <p className="text-sm text-clinical-400">
        출처: {test.source.file}
        {test.source.pdfPage !== null && ` · PDF 내 ${test.source.pdfPage}쪽`} · {test.reviewStatus}
      </p>
    </div>
  )
}

export default function AssessmentTests() {
  const navigate = useNavigate()
  const records = usePersistentRecord<TestRecord>(TEST_RECORDS_KEY)
  const [part, setPart] = useState('전체')
  const [openId, setOpenId] = useState<string | null>(null)

  const parts = useMemo(() => {
    const present = Array.from(new Set(LIBRARY_TESTS.map((t) => t.bodyPart)))
    return PART_ORDER.filter((p) => present.includes(p)).concat(present.filter((p) => !PART_ORDER.includes(p)))
  }, [])
  const shown = part === '전체' ? LIBRARY_TESTS : LIBRARY_TESTS.filter((t) => t.bodyPart === part)
  const recordedCount = LIBRARY_TESTS.filter((t) => records.data[t.id]).length
  const testIssues = LIBRARY_ISSUES.filter((i) => i.kind === 'test')

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm font-semibold text-clinical-500">
          ← 홈
        </button>
        <button onClick={() => navigate('/library')} className="text-sm font-semibold text-mint-700">
          운동 라이브러리 →
        </button>
      </div>
      <h1 className="text-xl font-semibold text-clinical-900">기능검사 기록</h1>
      <p className="mt-1 text-sm text-clinical-500">
        {LIBRARY_TESTS.length}개 검사 · 기록됨 {recordedCount}개
      </p>

      <p className="mt-3 rounded-xl bg-clinical-100 px-4 py-3 text-sm leading-relaxed text-clinical-600">
        PT가 직접 실시한 검사 결과를 좌·우 소견, 통증, 평가자 메모로 기록하는 곳입니다. 사진 분석 결과와는 별도로
        저장되며, 기록은 이 브라우저에만 보관됩니다. 검사 목록은 PT 검토 전 자료입니다.
      </p>

      {testIssues.length > 0 && (
        <p className="mt-3 rounded-xl bg-alert-coral/15 px-4 py-3 text-sm text-alert-red">
          형식이 맞지 않아 제외된 검사가 {testIssues.length}개 있습니다: {testIssues.map((i) => `${i.id}(${i.problem})`).join(', ')}
        </p>
      )}

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {['전체', ...parts].map((p) => (
          <button
            key={p}
            onClick={() => setPart(p)}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              part === p ? 'border-clinical-700 bg-clinical-700 text-white' : 'border-clinical-200 bg-white text-clinical-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <ul className="mt-3 divide-y divide-clinical-100 border-y border-clinical-100">
        {shown.map((t) => {
          const isOpen = openId === t.id
          const rec = records.data[t.id]
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : t.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 py-4 text-left"
              >
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-clinical-900">{t.name}</h3>
                  <p className="mt-0.5 text-sm text-clinical-500">
                    {t.bodyPart} · {t.testType}
                  </p>
                </div>
                {rec ? <span className="pill-mint flex-none">기록됨</span> : <span className="flex-none text-sm text-clinical-400">미기록</span>}
              </button>
              {isOpen && <TestForm test={t} record={rec ?? EMPTY} onChange={(next) => records.update(t.id, next)} />}
            </li>
          )
        })}
      </ul>

      {records.saveFailed && (
        <p className="mt-4 text-sm text-alert-red">이 브라우저에서 저장 공간을 쓸 수 없어 기록이 새로고침 후 사라질 수 있습니다.</p>
      )}
    </div>
  )
}
