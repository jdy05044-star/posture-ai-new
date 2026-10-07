import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhotoCapture from '@/components/PhotoCapture'
import IllustrationSlot from '@/components/IllustrationSlot'
import landmarkGuide from '@/assets/landmark-guide.png'
import { useAppState } from '@/state/AppState'
import type { ViewType } from '@/types'

const VIEWS: ViewType[] = ['front', 'side-left', 'side-right', 'back']

export default function Capture() {
  const { captures, setCapture } = useAppState()
  const navigate = useNavigate()
  const [showGuide, setShowGuide] = useState(false)

  const allCaptured = VIEWS.every((v) => captures[v] !== null)

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">사진 촬영</h2>
      <p className="mb-6 text-sm text-clinical-600">
        정면 · 측면(좌측) · 측면(우측) · 후면 순서로 촬영하거나 업로드해주세요. 측면은 좌우가 다르게 보일 수 있어
        양쪽 다 촬영합니다.
      </p>

      <div className="card mb-6 p-4">
        <button
          onClick={() => setShowGuide((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-clinical-900">
            이 앱이 보는 신체 기준점이 궁금하다면
          </span>
          <span className="pill-mint">{showGuide ? '접기' : '보기'}</span>
        </button>
        {showGuide && (
          <div className="mt-3">
            <IllustrationSlot src={landmarkGuide} label="신체 주요 기준점 안내" aspect="16/9" />
            <p className="mt-2 text-xs text-clinical-500">
              정면·후면·측면 사진에서 어깨·흉추·골반·고관절·무릎·발목 등의 위치를 인식해 각도를 계산합니다.
              실제 분석에 쓰이는 값은 사진마다 인식된 관절 좌표이며, 이 그림은 어떤 지점을 기준으로 측정하는지
              이해를 돕기 위한 참고용 안내입니다.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {VIEWS.map((view) => (
          <PhotoCapture
            key={view}
            view={view}
            value={captures[view]}
            onChange={(img) => setCapture(view, img)}
          />
        ))}
      </div>

      <button
        onClick={() => navigate('/analyze')}
        disabled={!allCaptured}
        className="btn-primary mt-8 w-full py-4 text-base"
      >
        {allCaptured ? '자세 분석 시작' : `사진 ${VIEWS.filter((v) => !captures[v]).length}장 더 필요합니다`}
      </button>
    </div>
  )
}
