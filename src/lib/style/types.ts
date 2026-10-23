// 4·5단계 분류/추천 공통 타입

export type BoneType = "STRAIGHT" | "WAVE" | "NATURAL";
export type BoneResultKind = BoneType | "MIXED" | "UNDETERMINED";

export type SilhouetteType = "hourglass" | "triangle" | "invertedTriangle" | "rectangle" | "mixed";
export type FaceShape = "round" | "oval" | "long" | "square" | "heart" | "diamond";
export type NeckLength = "short" | "normal" | "long";
export type ShoulderSlope = "square" | "normal" | "sloped";
export type ShoulderWidth = "broad" | "balanced" | "narrow";

export type StyleImage = "neat" | "elegant" | "casual" | "feminine" | "chic" | "comfy";

export const STYLE_IMAGE_LABEL: Record<StyleImage, string> = {
  neat: "단정함",
  elegant: "우아함",
  casual: "캐주얼",
  feminine: "여성스러움",
  chic: "시크함",
  comfy: "편안함",
};

export const BONE_LABEL: Record<BoneResultKind, string> = {
  STRAIGHT: "스트레이트",
  WAVE: "웨이브",
  NATURAL: "내추럴",
  MIXED: "혼합형",
  UNDETERMINED: "판단 보류",
};

export const SILHOUETTE_LABEL: Record<SilhouetteType, string> = {
  hourglass: "모래시계형",
  triangle: "삼각형",
  invertedTriangle: "역삼각형",
  rectangle: "직사각형",
  mixed: "혼합형",
};

export const FACE_LABEL: Record<FaceShape, string> = {
  round: "둥근형",
  oval: "계란형",
  long: "긴형",
  square: "각진형",
  heart: "하트형",
  diamond: "다이아몬드형",
};

export const NECK_LABEL: Record<NeckLength, string> = { short: "짧아 보임", normal: "보통", long: "길어 보임" };

/** 판단 근거 한 줄 */
export interface Evidence {
  source: "photo" | "survey" | "manual";
  /** 어느 유형 쪽으로 기여했는지 (없으면 중립 정보) */
  target?: string;
  weight: number;
  text: string;
}

/** 분류 결과 공통 형태 */
export interface Classified<T extends string> {
  value: T | null; // null = 판단 불가
  secondary?: T | null;
  scores: Partial<Record<T, number>>;
  evidence: Evidence[];
  /** 사용자가 직접 선택했으면 true */
  manual: boolean;
  /** 판단 불가/저신뢰 사유 */
  note?: string;
}

export interface BoneResult {
  kind: BoneResultKind;
  primary: BoneType | null;
  secondary: BoneType | null;
  scores: Record<BoneType, number>;
  evidence: Evidence[];
  manual: boolean;
  note?: string;
}

/** 추천 엔진에 넣는 종합 프로필 */
export interface StyleProfile {
  bone: BoneResult;
  silhouette: Classified<SilhouetteType>;
  face: Classified<FaceShape>;
  neck: Classified<NeckLength>;
  shoulderSlope: Classified<ShoulderSlope>;
  shoulderWidth: Classified<ShoulderWidth>;
  /** 측정 비율(측정 불가면 null) + 신뢰도 */
  ratios: {
    legToTorso: RatioValue;
    waistHeightPct: RatioValue;
    headToBody: RatioValue;
    shoulderHip: RatioValue;
    waistHip: RatioValue;
  };
  images: StyleImage[];
}

export interface RatioValue {
  value: number | null;
  low: boolean;
}

// ───────── 추천 결과 ─────────

export type RecLevel = "best" | "good" | "ok" | "caution" | "avoid";

export const REC_LEVEL_LABEL: Record<RecLevel, string> = {
  best: "강력 추천",
  good: "추천",
  ok: "무난",
  caution: "주의",
  avoid: "비추천",
};

export interface RecReason {
  category: "face" | "neck" | "shoulder" | "bone" | "silhouette" | "ratio" | "image" | "preference";
  delta: number;
  text: string;
}

export interface NecklineRec {
  id: NecklineId;
  name: string;
  score: number;
  level: RecLevel;
  reasons: RecReason[];
  faceEffect: string;
  neckEffect: string;
  shoulderHarmony: string;
  cautions: string[];
}

export type NecklineId =
  | "v"
  | "u"
  | "round"
  | "square"
  | "boat"
  | "turtle"
  | "mock"
  | "collar"
  | "sweetheart"
  | "offShoulder";

export interface OutfitOptionRec {
  id: string;
  name: string;
  score: number;
  level: RecLevel;
  reasons: RecReason[];
  /** 왜 어울리는지/안 어울리는지 한 문장 요약 */
  summary: string;
}

export interface OutfitCategoryRec {
  id: string;
  group: "top" | "bottom" | "dress" | "outer";
  title: string;
  options: OutfitOptionRec[];
}

export function levelOf(score: number): RecLevel {
  if (score >= 3) return "best";
  if (score >= 1.5) return "good";
  if (score > -0.5) return "ok";
  if (score > -1.5) return "caution";
  return "avoid";
}
