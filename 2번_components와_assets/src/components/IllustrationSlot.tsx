interface Props {
  /** 일러스트가 준비되면 이 경로로 교체한다 (Vite 에셋 import 경로 또는 /public 경로). 없으면 플레이스홀더만 보여준다. */
  src?: string
  /** 플레이스홀더에 표시할 이름 (예: "골반 회전") */
  label: string
  /** 보조 설명 (선택) */
  caption?: string
  aspect?: '1/1' | '3/4' | '4/3' | '16/9'
  className?: string
}

const ASPECT_CLASS: Record<NonNullable<Props['aspect']>, string> = {
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video'
}

/**
 * 라이선스가 확인된 일러스트를 아직 확보하지 못한 자리를 표시하는 공용 슬롯 컴포넌트.
 * 출처가 불분명한 이미지를 임의로 끼워 넣지 않기 위해, src가 없으면 항상 이 플레이스홀더만
 * 보여준다 — 나중에 라이선스가 확인된 이미지/직접 제작한 일러스트의 경로를 src로 넘기기만
 * 하면 같은 레이아웃 그대로 교체된다.
 */
export default function IllustrationSlot({ src, label, caption, aspect = '1/1', className = '' }: Props) {
  if (src) {
    return (
      <div className={className}>
        <div className={`overflow-hidden rounded-xl bg-clinical-50 ${ASPECT_CLASS[aspect]}`}>
          <img src={src} alt={label} className="h-full w-full object-contain" />
        </div>
        {caption && <p className="mt-1 px-1 text-[10px] text-clinical-400">{caption}</p>}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-clinical-200 bg-clinical-50 text-center ${ASPECT_CLASS[aspect]} ${className}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-clinical-300">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.6" fill="currentColor" />
        <path d="M4 17l5-5 3 3 4-5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="px-2 text-[11px] font-medium text-clinical-400">{label}</p>
      <p className="px-2 text-[10px] text-clinical-300">일러스트 준비 중</p>
      {caption && <p className="px-2 text-[10px] text-clinical-300">{caption}</p>}
    </div>
  )
}
