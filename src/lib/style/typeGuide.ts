import type { BoneResultKind, FaceShape, NeckLength, SilhouetteType } from "./types";

export interface Tone {
  fg: string;
  bg: string;
}

export const BONE_TONE: Record<BoneResultKind, Tone> = {
  STRAIGHT: { fg: "#5f80b8", bg: "#edf2fb" },
  WAVE: { fg: "#c56a7b", bg: "#fcedf0" },
  NATURAL: { fg: "#6b8a5c", bg: "#eef4e9" },
  MIXED: { fg: "#9a7c5e", bg: "#f6efe7" },
  UNDETERMINED: { fg: "#8a7b75", bg: "#f4f0ed" },
};

export interface BoneGuide {
  keyword: string;
  traits: { title: string; body: string }[];
  good: { title: string; body: string }[];
  bad: { title: string; body: string }[];
  oneLine: string;
}

/** 골격 타입별 관찰 기준과 스타일 방향(자체 서술) */
export const BONE_GUIDE: Record<"STRAIGHT" | "WAVE" | "NATURAL", BoneGuide> = {
  STRAIGHT: {
    keyword: "입체감 · 탄탄함 · 심플",
    traits: [
      { title: "상체에 볼륨", body: "가슴·어깨 쪽에 두께감이 있어 상체가 입체적으로 보여요." },
      { title: "일자 허리", body: "허리 굴곡이 크지 않고 몸통이 곧게 떨어져요." },
      { title: "탄탄한 질감", body: "살·근육이 단단하고 매끈한 편이에요." },
      { title: "작은 관절", body: "손목·무릎 뼈가 크게 도드라지지 않아요." },
    ],
    good: [
      { title: "V넥·심플 넥라인", body: "쇄골 라인을 드러내 상체를 가볍게 정리해요." },
      { title: "힘 있는 소재", body: "하이게이지 니트·탄탄한 셔츠가 라인을 정돈해요." },
      { title: "일자 핏 하의", body: "스트레이트 팬츠·H라인이 다리를 곧게 보여 줘요." },
    ],
    bad: [
      { title: "과한 러플", body: "상체에 볼륨이 더해져 시선이 위로 몰려요." },
      { title: "두꺼운 레이어드", body: "상체가 넓어 보이고 실루엣이 둔해져요." },
      { title: "부해 보이는 핏", body: "오버핏·퍼프 소매는 몸을 더 커 보이게 해요." },
    ],
    oneLine: "군더더기 없는 저스트 핏으로 실루엣을 깔끔하게.",
  },
  WAVE: {
    keyword: "곡선 · 여리함 · 하체 무게중심",
    traits: [
      { title: "얇은 상체", body: "어깨선이 부드럽고 상체가 얇아 여리한 느낌이에요." },
      { title: "잘록한 허리", body: "허리가 들어가 상·하체 차이가 뚜렷해요." },
      { title: "하체에 무게중심", body: "골반·허벅지 쪽에 볼륨이 있어요." },
      { title: "부드러운 질감", body: "살이 말랑하고 부드러운 편이에요." },
    ],
    good: [
      { title: "짧은 상의", body: "상체를 짧게 끊어 비율을 위로 올려요." },
      { title: "하이웨이스트", body: "허리선을 올려 다리를 길어 보이게 해요." },
      { title: "부드러운 실루엣", body: "A라인·플레어처럼 흐르는 라인이 잘 맞아요." },
    ],
    bad: [
      { title: "긴 상의", body: "힙을 덮는 기장은 상체가 길어 보여요." },
      { title: "로우라이즈", body: "허리 위치가 내려가 다리가 짧아 보여요." },
      { title: "아래로 처지는 루즈핏", body: "무게중심이 더 내려가 하체가 무거워 보여요." },
    ],
    oneLine: "허리선과 비율을 위로 끌어올려 곡선을 살리기.",
  },
  NATURAL: {
    keyword: "골격감 · 직선 · 여유",
    traits: [
      { title: "골격감", body: "뼈대가 느껴지는 프레임이 있어요." },
      { title: "넓은 어깨·골반", body: "어깨와 골반 폭이 넓은 편이라 시원해 보여요." },
      { title: "도드라진 관절", body: "손목·무릎·팔꿈치 윤곽이 뚜렷해요." },
      { title: "직선적인 라인", body: "곡선보다 담백한 직선 실루엣이에요." },
    ],
    good: [
      { title: "루즈핏", body: "여유 있는 상의가 골격을 자연스럽게 감싸요." },
      { title: "드롭 숄더", body: "딱 맞는 어깨선보다 자연스러운 어깨가 어울려요." },
      { title: "긴 직선 실루엣", body: "와이드 팬츠·롱 기장으로 이어지는 라인이 세련돼요." },
    ],
    bad: [
      { title: "과하게 붙는 옷", body: "타이트한 핏은 골격감을 부각시켜요." },
      { title: "작은 사이즈", body: "어깨·골반이 도드라져 체형이 커 보여요." },
      { title: "잔잔한 디테일 과다", body: "프릴·리본·셔링이 많으면 시선이 분산돼요." },
    ],
    oneLine: "골격의 여유를 살리면 세련된 분위기가 나요.",
  },
};

export const SILHOUETTE_GUIDE: Record<SilhouetteType, string> = {
  hourglass: "어깨와 골반 폭이 비슷(±5%)하고 허리가 둘 중 넓은 쪽의 75% 이하로 잘록함",
  rectangle: "어깨와 골반 폭이 비슷(±5%)하고 허리 굴곡이 완만함(75% 초과)",
  triangle: "골반이 어깨보다 5% 이상 넓음 — 하체 쪽 폭이 큼",
  invertedTriangle: "어깨가 골반보다 5% 이상 넓음 — 상체 쪽 폭이 큼",
  mixed: "경계값(±2%) 근처라 두 유형의 특징이 함께 보임",
};

export const FACE_GUIDE: Record<FaceShape, string> = {
  round: "세로·가로가 비슷하고 턱선이 둥글어 부드러운 인상",
  oval: "세로가 가로보다 약간 길고 이마·광대·턱이 고르게 이어지는 균형형",
  long: "세로 길이가 길어 성숙한 인상",
  square: "턱(하악각) 폭이 넓고 턱선이 또렷해 시크한 인상",
  heart: "이마가 넓고 턱끝이 좁아지는 형태",
  diamond: "광대가 가장 넓고 이마·턱이 좁은 형태",
};

export const NECK_GUIDE: Record<NeckLength, string> = {
  short: "시선이 아래로 떨어지는 V·U넥처럼 목 아래를 여는 넥라인이 목을 길어 보이게 합니다.",
  normal: "목 길이가 균형 잡혀 원하는 분위기에 맞춰 자유롭게 선택할 수 있습니다.",
  long: "터틀넥·라운드넥처럼 목을 살짝 감싸는 넥라인이 안정감 있는 인상을 줍니다.",
};
