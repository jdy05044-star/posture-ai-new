import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DisclaimerNote from '@/components/DisclaimerNote'
import { computeNoise, MIN_DF_FOR_USE, snapshotFromSummary, type RepeatSeries } from '@/repeat/repeatStats'
import { useRepeatSeries } from '@/repeat/useNoise'
import { useAppState } from '@/state/AppState'

const NEW = '__new__'

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 반복 촬영으로 이 앱의 측정 오차 구하기.
 * 같은 사람을 같은 조건에서 자세를 풀었다 다시 서서 여러 번 촬영하고, 그때마다 결과를 저장한다.
 * 항목별로 값이 얼마나 흔들리는지(표준편차)와, 이보다 작은 차이는 오차와 구분하기 어려운 값(MDC95)을 계산한다.
 */
export default function RepeatMeasure() {
  const navigate = useNavigate()
  const { latestSummary } = useAppState()
  const { series, update, saveFailed } = useRepeatSeries()
  const [target, setTarget] = useState<string>(NEW)
  const [memo, setMemo] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const current = useMemo(
    () => (latestSummary ? snapshotFromSummary(latestSummary, 'preview', '') : null),
    [latestSummary]
  )
  const currentCount = current ? Object.keys(current.values).length : 0
  const rows = useMemo(() => computeNoise(series), [series])
  const selected = series.find((s) => s.id === target) ?? null

  function save() {
    if (!latestSummary) return
    const shot = snapshotFromSummary(latestSummary, newId('shot'), new Date().toISOString())
    if (Object.keys(shot.values).length === 0) return
    if (selected) {
      update(selected.id, { ...selected, shots: [...selected.shots, shot] })
    } else {
      const s: RepeatSeries = {
        id: newId('series'),
        name: `시리즈 ${series.length + 1}`,
        memo: memo.trim(),
        createdAt: new Date().toISOString(),
        shots: [shot]
      }
      update(s.id, s)
      setTarget(s.id)
    }
    setMemo('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6 md:max-w-2xl">
      <div>
        <button onClick={() => navigate('/result')} className="text-sm font-semibold text-clinical-500">
          ← 결과로
        </button>
        <h1 className="t-title mt-2">반복 촬영으로 측정 오차 확인</h1>
        <p className="t-body mt-1 text-clinical-500">
          같은 사람을 여러 번 다시 찍어, 각 측정이 얼마나 흔들리는지 계산합니다. 이 값으로 &quot;이 정도 차이는 오차 범위&quot;를
          근거 있게 정할 수 있습니다.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="t-section mb-3">이렇게 진행하세요</h2>
        <ol className="space-y-1.5 text-sm text-clinical-600">
          <li>1. 같은 사람을 같은 위치·거리·카메라 높이에서 촬영하고 결과를 확인합니다.</li>
          <li>2. 아래에서 &quot;현재 결과 저장&quot;을 누릅니다.</li>
          <li>3. 자세를 풀었다가 다시 서서, 다시 촬영하고 저장합니다. 한 사람당 3회 이상을 권장합니다.</li>
          <li>4. 사람을 바꿔 새 시리즈로 반복하면 오차가 더 믿을 만해집니다.</li>
        </ol>
        <p className="t-meta mt-3">골반 ASIS 같은 직접 표시 점도 매번 다시 찍어야 그 흔들림까지 포함됩니다.</p>
      </section>

      <section className="card p-5">
        <h2 className="t-section mb-3">현재 결과 저장</h2>
        {!latestSummary || currentCount === 0 ? (
          <p className="t-body text-clinical-500">
            저장할 결과가 없습니다. 사진을 촬영하고 분석을 마친 뒤 이 화면으로 와 주세요.
          </p>
        ) : (
          <>
            <p className="t-meta mb-3">각도로 계산된 항목 {currentCount}개가 저장됩니다. 값이 없는 항목은 저장하지 않습니다.</p>
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setTarget(NEW)} aria-pressed={target === NEW} className={`chip-btn ${target === NEW ? 'chip-btn-active' : ''}`}>
                + 새 시리즈
              </button>
              {series.map((s) => (
                <button key={s.id} type="button" onClick={() => setTarget(s.id)} aria-pressed={target === s.id} className={`chip-btn ${target === s.id ? 'chip-btn-active' : ''}`}>
                  {s.name} · {s.shots.length}회
                </button>
              ))}
            </div>
            {target === NEW && (
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="촬영 조건 메모 (선택) 예: 거실, 1.5m, 삼각대 · 이름 등 개인정보는 적지 마세요"
                className="mb-3 w-full rounded-xl border border-clinical-200 bg-white px-3 py-2 text-sm"
              />
            )}
            <button onClick={save} className="btn-primary w-full py-3">
              {selected ? `${selected.name}에 ${selected.shots.length + 1}번째 촬영으로 저장` : '새 시리즈로 저장'}
            </button>
            {justSaved && <p className="mt-2 text-center text-sm font-medium text-mint-700">저장했습니다.</p>}
            {saveFailed && <p className="mt-2 text-sm text-alert-red">이 브라우저에서 저장 공간을 쓸 수 없어 새로고침하면 사라집니다.</p>}
          </>
        )}
      </section>

      {series.length > 0 && (
        <section className="card p-5">
          <h2 className="t-section mb-3">저장된 시리즈</h2>
          <ul className="space-y-2">
            {series.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl bg-clinical-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-clinical-900">
                    {s.name} <span className="font-normal text-clinical-500">· 촬영 {s.shots.length}회</span>
                  </p>
                  {s.memo && <p className="t-meta">{s.memo}</p>}
                  {s.shots.length < 2 && <p className="t-meta">2회 이상이어야 오차 계산에 쓰입니다.</p>}
                </div>
                <div className="flex flex-none flex-col items-end gap-1 text-xs font-medium text-clinical-500">
                  {s.shots.length > 0 && (
                    <button type="button" onClick={() => update(s.id, { ...s, shots: s.shots.slice(0, -1) })} className="underline">
                      마지막 촬영 취소
                    </button>
                  )}
                  <button type="button" onClick={() => update(s.id, null)} className="underline">
                    시리즈 삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="t-section mb-1">항목별 측정 오차</h2>
        <p className="t-meta mb-3">
          오차 범위 = 같은 조건에서 한 번씩 잰 두 값의 차이가 이 값보다 작으면 오차와 구분하기 어려운 정도(1.96 × √2 × 표준편차).
        </p>
        {rows.length === 0 ? (
          <p className="t-body text-clinical-500">촬영이 2회 이상인 시리즈가 생기면 여기에 계산됩니다.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl bg-clinical-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-clinical-900">{r.label}</p>
                  <span className={r.reliable ? 'pill-mint' : 'pill-coral'}>{r.reliable ? '앱에 적용 중' : '참고만'}</span>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-clinical-900">
                  ±{r.mdc95}° <span className="text-sm font-normal text-clinical-500">이내는 오차 범위</span>
                </p>
                <p className="t-meta mt-1">
                  표준편차 {r.sd}° · 시리즈 내 최대−최소 평균 {r.meanRange}° · 시리즈 {r.seriesCount}개 · 촬영 {r.shots}회
                </p>
                {!r.reliable && (
                  <p className="t-meta">촬영이 더 필요합니다. 반복 간 자유도 {r.df}/{MIN_DF_FOR_USE} — 채워지기 전에는 앱의 판단에 쓰지 않습니다.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DisclaimerNote>
        이 오차는 이 기기·촬영 조건·촬영자에서 구한 값이며 다른 조건에는 그대로 적용되지 않습니다. 이 데이터는 이 브라우저에만 저장되고
        &quot;새로 시작&quot;을 눌러도 지워지지 않습니다.
      </DisclaimerNote>
    </div>
  )
}
