import { useEffect, useState } from 'react'
import { resolveExerciseImage } from './exerciseImages'

interface Props {
  /** 라이브러리 운동 번호 (예: EX041) */
  libId: string
  name: string
  muscles?: string[]
}

/** "근육 사진 보기"를 누르면 이 운동과 연결된 근육 사진이 펼쳐진다. 파일이 없으면 안내만 보여준다. */
export default function MusclePhotoToggle({ libId, name, muscles = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!open || src !== undefined) return
    let off = false
    resolveExerciseImage(`/images/exercises/anatomy/${libId.toLowerCase()}-target.webp`).then((u) => !off && setSrc(u))
    return () => {
      off = true
    }
  }, [open, src, libId])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-clinical-200 bg-white px-3 py-2.5 text-sm font-semibold text-clinical-700"
      >
        <span>근육 사진 {open ? '접기' : '보기'}</span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-xl bg-clinical-50 p-3">
          {src ? (
            <img src={src} alt={`${name} 관련 근육 참고 그림`} className="mx-auto max-h-64 w-auto rounded-lg bg-white object-contain" />
          ) : (
            <p className="py-6 text-center text-sm text-clinical-400">{src === undefined ? '불러오는 중…' : '근육 사진 준비 중'}</p>
          )}
          {muscles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {muscles.map((m) => (
                <span key={m} className="chip">
                  {m}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-clinical-400">AI 생성 참고 그림 · 해부학 검수 전. 강조된 근육은 참고용이며 확정된 평가가 아닙니다.</p>
        </div>
      )}
    </div>
  )
}
