import { useState } from 'react'
import IllustrationSlot from '@/components/IllustrationSlot'

/** public 폴더 아래 해부도 이미지 경로. 파일을 여기에 넣기만 하면 자동으로 교체된다. */
const BASE_PATH = '/images/anatomy/'
const EXTENSIONS = ['png', 'webp', 'jpg']

interface Props {
  /** 확장자를 뺀 파일명 (예: 'muscle-pelvis') */
  file: string
  /** 접근성 이름이자 플레이스홀더 문구 (예: '골반 근육 해부도') */
  label: string
  /** thumb: 리스트 행의 작은 썸네일 / full: 상세 영역의 큰 그림 */
  variant?: 'thumb' | 'full'
  caption?: string
}

/**
 * 부위별 근육 해부도. /public/images/anatomy/{file}.png (없으면 .webp, .jpg 순)을 불러오고,
 * 어떤 파일도 없으면 "일러스트 준비 중" 플레이스홀더를 보여준다 (이미지를 지어내지 않는다).
 *
 * 부모는 부위가 바뀔 때 key를 바꿔서 쓴다 (확장자 시도 상태를 초기화하기 위함).
 */
export default function AnatomyImage({ file, label, variant = 'full', caption }: Props) {
  const [extIndex, setExtIndex] = useState(0)
  const exhausted = extIndex >= EXTENSIONS.length

  if (variant === 'thumb') {
    return (
      <div
        className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-clinical-50"
        role="img"
        aria-label={exhausted ? `${label} (준비 중)` : label}
      >
        {exhausted ? (
          <div className="flex h-full w-full items-center justify-center text-clinical-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 17l5-5 3 3 4-5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          // 해부도 이미지는 제목줄·범례가 함께 들어 있는 패널이라, 작은 썸네일에서는 그림 중앙부만 보이도록 확대한다.
          <img
            src={`${BASE_PATH}${file}.${EXTENSIONS[extIndex]}`}
            alt=""
            onError={() => setExtIndex((i) => i + 1)}
            className="h-full w-full object-cover"
            style={{ transform: 'scale(1.45)', transformOrigin: '50% 42%' }}
          />
        )}
      </div>
    )
  }

  if (exhausted) {
    return <IllustrationSlot label={label} caption={caption} aspect="4/3" />
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-clinical-50">
        <img
          src={`${BASE_PATH}${file}.${EXTENSIONS[extIndex]}`}
          alt={label}
          onError={() => setExtIndex((i) => i + 1)}
          className="block h-auto w-full"
        />
      </div>
      {caption && <p className="mt-2 text-xs text-clinical-400">{caption}</p>}
    </div>
  )
}
