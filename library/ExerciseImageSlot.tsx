interface Props {
  /** 확인된 이미지 URL. null/undefined면 플레이스홀더를 보여준다. */
  url: string | null | undefined
  label: string
  variant?: 'thumb' | 'full'
}

/**
 * 운동 이미지 슬롯. /public/images/exercises/ 에 파일이 들어오면 자동으로 보이고, 없으면 플레이스홀더만 보인다.
 * 원자료(책)의 사진·그림은 저작권 확인 없이 쓰지 않으므로, 이 슬롯에는 사용 권리가 확인된 이미지만 넣는다.
 */
export default function ExerciseImageSlot({ url, label, variant = 'thumb' }: Props) {
  const box = variant === 'thumb' ? 'h-16 w-16 flex-none rounded-xl' : 'aspect-[4/3] w-full rounded-xl'
  if (url) {
    return (
      <div className={`overflow-hidden bg-clinical-50 ${box}`}>
        <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 border border-dashed border-clinical-200 bg-clinical-50 text-clinical-300 ${box}`}
      role="img"
      aria-label={`${label} 이미지 준비 중`}
    >
      <svg width={variant === 'thumb' ? 20 : 28} height={variant === 'thumb' ? 20 : 28} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.6" fill="currentColor" />
        <path d="M4 17l5-5 3 3 4-5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {variant === 'full' && <p className="text-sm text-clinical-400">이미지 준비 중</p>}
    </div>
  )
}
