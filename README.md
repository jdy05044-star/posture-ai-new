# STYLE PT · 체형·비율 분석 & 퍼스널 스타일링 웹앱 (1~5단계 + 리포트)

사진을 올리면 **브라우저 안에서** MediaPipe 로 신체·얼굴 랜드마크와 실루엣을 추출하고, 같은 사진 안의 픽셀 길이 비율로 11개 신체 비율을 계산해 사진 위 분석선과 인체 일러스트로 보여 줍니다.
측정할 수 없는 항목은 숫자를 만들지 않고 **측정 불가**와 사유를 표시합니다.

## 실행

```bash
# Node 20.9 이상
npm install          # postinstall 이 MediaPipe wasm 을 public/mediapipe/wasm 으로 복사
npm run dev          # http://localhost:3000
npm test             # 분석 엔진 단위 테스트 (vitest)
npm run typecheck
```

휴대폰에서 테스트: 같은 Wi‑Fi 에서 `npm run dev -- -H 0.0.0.0` 후 `http://<PC IP>:3000`.
(카메라 직접 촬영 API 는 쓰지 않고 파일 선택만 쓰므로 http 에서도 동작합니다.)

최신 버전 확인: `npm outdated` → `npm install next@latest @mediapipe/tasks-vision@latest`
`@mediapipe/tasks-vision` 을 올리면 postinstall 이 같은 버전의 wasm 을 다시 복사합니다.

## 배포 (Vercel)

1. GitHub 에 푸시 → Vercel 에서 Import (Framework: Next.js, 설정 변경 불필요)
2. 빌드 시 `npm install` 의 postinstall 로 wasm 이 복사되어 함께 배포됩니다.
3. 모델 파일을 자체 호스팅하려면 `.env.example` 참고(`public/models/` + `NEXT_PUBLIC_*_MODEL`).

## 폴더 구조

```
src/
  app/
    layout.tsx            전역 레이아웃·폰트·AnalysisProvider
    page.tsx              소개·개인정보 안내
    upload/page.tsx       1단계: 사진 4종 업로드, 동의, 분석 실행
    analysis/page.tsx     결과 탭: 전신 비율 · 골격·체형 · 목·어깨 · 얼굴형 · 넥라인 · 코디 추천 · 측면
    report/page.tsx       최종 스타일링 리포트(인쇄/PDF 저장)
  components/
    upload/               PhotoSlotCard, GuideSheet(촬영 가이드), GuideIllustration(SVG)
    analysis/             BodyOverlay(사진 위 분석선+드래그 보정), LevelEditor,
                          BodyFigure(측정값으로 비율을 맞춘 SVG 인체), FaceOverlay, MetricCard
    style/                BoneTypeCard·실루엣/얼굴/목 카드(StyleCards), SurveyForm·ProfileEditor(Inputs),
                          NecklineCard·OutfitSection(Recommendations), NecklineIllustration, Icons
    ui/primitives.tsx     TopBar, StatusBadge, IssueList, RatioBar, Section, PrimaryButton
  lib/
    types.ts              공통 타입
    guide.ts              촬영 가이드 문구
    store/AnalysisStore   사진·결과를 메모리에만 보관(저장/전송 없음)
    image/                loadImage(EXIF 회전·축소), quality(밝기·흐림·해상도)
    mask/mask.ts          실루엣 마스크 연산(폭·윤곽·틈 탐색)
    mediapipe/            vision.ts(Pose/Face/Segmenter 로더, GPU→CPU 폴백; tasks-vision 1.0.x API 기준), detect.ts
    analysis/
      landmarkIndex.ts    MediaPipe 인덱스
      keypoints.ts        기준선(머리끝·턱·목밑·어깨·허리·골반·가랑이·바닥)과 폭 자동 검출
      bodyRatios.ts       11개 비율 + 촬영 자세 영향 감지
      detectionQuality.ts 인식 실패·재촬영 판정
      alignment.ts        머리-어깨 정렬(정면/측면)
      faceMeasures.ts     얼굴 세로/가로, 이마·광대·턱 폭(4단계 얼굴형 입력)
      figureModel.ts      일러스트용 정규화 모델
      classify.ts         4단계 분류 엔진 – 골격(사진+설문 점수, 혼합/보류), 실루엣, 얼굴형, 목, 어깨 / RULES 에 기준값
      survey.ts           골격 보조 설문 7문항
    recommend/
      profile.ts          분석+설문+사용자 수정 → StyleProfile
      necklines.ts        넥라인 10종 규칙 테이블 + 점수 합산
      outfits.ts          상의/하의/원피스/아우터 12개 카테고리 규칙 + 측정 비율 조건(RATIO_RULES)
      useStyle.ts         화면용 훅(즉시 재계산)
    style/                타입·라벨, 골격 가이드 문구, 넥라인 일러스트 도형
tests/                    합성 인체로 측정값 검증 + 분류·추천 엔진 — 62개
```

## 측정 방식 요약

| # | 항목 | 정의 |
|---|---|---|
| 1 | 등신 | (머리끝→바닥) ÷ (머리끝→턱끝). 턱끝은 전신 사진의 얼굴 영역을 잘라 Face Landmarker 로 검출 |
| 2 | 상체:하체 | 머리끝→허리선 : 허리선→바닥 |
| 3 | 몸통:다리 | 어깨선→가랑이점 : 가랑이점→바닥 |
| 4 | 어깨:골반 | Pose 세그멘테이션 실루엣에서 어깨 높이 폭 : 골반 최대 폭 |
| 5 | 허리:골반 | 허리선(가장 좁은 높이) 폭 : 골반 폭 |
| 6 | 허리 높이 | 바닥→허리선 ÷ 전신 |
| 7 | 허벅지:종아리 | 고관절→무릎 : 무릎→발목 (관절 중심) |
| 8 | 어깨 경사 | 머리카락(Image Segmenter)을 제외한 실루엣 윗윤곽의 기울기 |
| 9 | 얼굴:어깨 | 광대 높이 얼굴 폭 : 어깨 폭 |
| 10 | 얼굴:목 | 얼굴 메시 상단→턱끝 : 턱끝→목 밑 |
| 11 | 비대칭 | 어깨·골반 높이차(%), 허리 좌우 폭 차 + 고개 기울임/회전/체중 쏠림/카메라 기울기/무릎 굽힘 감지 |

- 가랑이점·허리선·목 밑·턱끝 등은 **기준선 수정** 모드에서 드래그로 보정하며, 보정 즉시 재계산됩니다.
- "직접 지정"으로 추가만 하고 아직 끌어 맞추지 않은 선은 계산에 쓰지 않습니다(임의 수치 방지).
- 팔이 몸통에 붙으면 폭이 부풀려지므로 경고 후 신뢰도를 낮춥니다.

## 개인정보

- 사진은 `File` → 캔버스로만 읽고, 서버 업로드·localStorage 저장·외부 전송을 하지 않습니다.
- 네트워크 요청은 wasm(자기 도메인)과 모델 파일(storage.googleapis.com), 폰트뿐입니다.

## 한계

- 모든 값은 사진 속 상대 비율이며 cm 치수가 아닙니다. 광각 렌즈·가까운 거리·위/아래 앵글은 원근 왜곡을 만듭니다.
- selfie_multiclass 세그멘터는 셀피용 모델이라 전신 사진에서 머리카락 분리가 불완전할 수 있습니다(실패 시 머리카락 제외 없이 진행).
- 실루엣 폭은 옷 두께를 포함합니다. 몸에 붙는 옷을 권장합니다.
- HEIC 는 Safari 외 브라우저에서 열리지 않을 수 있습니다.

## 4·5단계 규칙 엔진

- **골격 타입**: 사진 외형(허리:골반, 어깨:골반, 어깨 경사, 측면 상체 두께) + 보조 설문 7문항(손목뼈·쇄골·질감·무릎·살 붙는 곳·손·잘 어울렸던 옷)을 점수로 합산합니다. 근거는 한 줄씩 화면에 표시합니다. 1·2위 차가 작으면 **혼합형**, 근거가 부족하면 **판단 보류**입니다. 관절 크기·질감·골격 깊이는 사진으로 확정하지 않습니다.
- **실루엣**: 어깨÷골반 ±5%, 허리÷넓은 쪽 75% 기준. 경계 ±2%면 혼합 표시.
- **얼굴형**: 얼굴 메시에서 세로/가로, 이마·턱(하악각)·턱끝 폭을 광대 대비로 계산해 6개 원형과의 거리로 점수화. 2위가 1위의 70% 이상이면 혼합 특징 표시.
- **목 길이**: 보이는 목 ÷ 얼굴 길이 27% 미만 짧아 보임, 43% 초과 길어 보임.
- **넥라인/의상**: 각 규칙이 `[점수, 근거 문장]`이라 "왜 어울리는지"가 그대로 화면에 나옵니다. 원하는 이미지(6종)와 넥라인 좋아요/안 입어요가 점수에 반영됩니다. 사용자는 골격·실루엣·얼굴형·목을 직접 수정할 수 있습니다.
- 기준값은 경험값입니다. `classify.ts`의 `RULES`·`FACE_PROTOTYPES`, `outfits.ts`의 `RATIO_RULES`에서 조정하세요.

## 다음 단계

- 실제 사진 데이터로 기준값 보정
- E2E 테스트(Playwright), 리포트 이미지 공유
