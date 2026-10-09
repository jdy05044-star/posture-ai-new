/** 탭 하나에 한 번만 보여주는 안내 문구 (반복되는 "참고 정보이며 진단이 아님" 문구를 여기로 모은다). */
export default function DisclaimerNote({ children }: { children?: string }) {
  return (
    <p className="t-meta px-1 text-center">
      {children ?? '사진 기반 참고 정보이며 진단이 아닙니다. 원인·관련 근육은 PT의 직접 평가로 확인해야 합니다.'}
    </p>
  )
}
