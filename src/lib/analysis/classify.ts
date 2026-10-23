// ───────────── 4단계: 설명 가능한 규칙 기반 분류 엔진 ─────────────
// 모든 기준값은 RULES 에 모아 두었습니다. 사진 기반 경험값이므로 데이터가 쌓이면 조정하세요.
import type { BodyMetricsResult, BinaryMask, LandmarkPx, Metric, MetricId } from "../types";
import type {
  BoneResult,
  BoneType,
  Classified,
  Evidence,
  FaceShape,
  NeckLength,
  ShoulderSlope,
  ShoulderWidth,
  SilhouetteType,
} from "../style/types";
import { BONE_LABEL, FACE_LABEL } from "../style/types";
import type { FaceMeasures } from "./faceMeasures";
import { POSE } from "./landmarkIndex";
import { runAt } from "../mask/mask";
import { SURVEY, type SurveyAnswers } from "./survey";

export const RULES = {
  silhouette: {
    /** 어깨÷골반 이 범위 안이면 "비슷함" */
    balancedLo: 0.95,
    balancedHi: 1.05,
    /** 허리÷(어깨·골반 중 큰 값) 이 이하면 "허리 잘록" */
    definedWaist: 0.75,
    /** 경계 ± 이내면 혼합 표시 */
    margin: 0.02,
  },
  neck: { short: 0.27, long: 0.43, margin: 0.02 },
  shoulderSlope: { square: 16, sloped: 25 },
  shoulderWidth: { broad: 1.08, narrow: 0.98 },
  sideDepth: { thick: 0.52, thin: 0.42 },
  bone: {
    surveyPoint: 2,
    /** 1·2위 점수 차가 이 값 이하(또는 1위의 15% 이하)면 혼합형 */
    mixedGap: 1.5,
    /** 설문 응답 수가 이보다 적고 사진 근거도 2개 미만이면 판단 보류 */
    minSurvey: 3,
  },
};

const metricOf = (r: BodyMetricsResult | null, id: MetricId): Metric | undefined => r?.metrics.find((m) => m.id === id);
const usable = (m?: Metric) => (m && m.status !== "unavailable" && m.value !== null ? m : undefined);

// ───────── 실루엣 ─────────

export function classifySilhouette(r: BodyMetricsResult | null): Classified<SilhouetteType> {
  const sh = usable(metricOf(r, "shoulderHip"));
  const wh = usable(metricOf(r, "waistHip"));
  if (!sh || !wh) {
    return {
      value: null,
      scores: {},
      evidence: [],
      manual: false,
      note: "어깨·허리·골반 폭이 모두 측정되어야 실루엣을 판단할 수 있습니다.",
    };
  }
  const R = RULES.silhouette;
  const s = sh.value!; // 어깨/골반
  const waistToMax = wh.value! / Math.max(1, s); // 허리/큰 쪽
  const evidence: Evidence[] = [
    { source: "photo", weight: 0, text: `어깨 : 골반 = ${s.toFixed(2)} : 1 (${s > R.balancedHi ? "어깨가 넓음" : s < R.balancedLo ? "골반이 넓음" : "비슷함"})` },
    {
      source: "photo",
      weight: 0,
      text: `허리 ÷ 어깨·골반 중 넓은 쪽 = ${waistToMax.toFixed(2)} (${waistToMax <= R.definedWaist ? "허리 굴곡 뚜렷" : "허리 굴곡 완만"})`,
    },
  ];
  const balanced = s >= R.balancedLo && s <= R.balancedHi;
  const defined = waistToMax <= R.definedWaist;
  let value: SilhouetteType;
  if (balanced) value = defined ? "hourglass" : "rectangle";
  else if (s < R.balancedLo) value = "triangle";
  else value = "invertedTriangle";

  // 경계값 근처 → 혼합 표시
  let secondary: SilhouetteType | null = null;
  const near = (a: number, b: number) => Math.abs(a - b) <= R.margin;
  if (near(s, R.balancedLo)) secondary = value === "triangle" ? (defined ? "hourglass" : "rectangle") : "triangle";
  else if (near(s, R.balancedHi)) secondary = value === "invertedTriangle" ? (defined ? "hourglass" : "rectangle") : "invertedTriangle";
  else if (balanced && near(waistToMax, R.definedWaist)) secondary = value === "hourglass" ? "rectangle" : "hourglass";

  const low = sh.status === "low" || wh.status === "low";
  return {
    value: secondary ? "mixed" : value,
    secondary: secondary ? value : null,
    scores: secondary ? { [value]: 0.6, [secondary]: 0.4 } : { [value]: 1 },
    evidence: secondary
      ? [...evidence, { source: "photo", weight: 0, text: `경계값 근처라 ${value}·${secondary} 특징이 함께 보입니다.` }]
      : evidence,
    manual: false,
    note: low ? "폭 측정 신뢰도가 낮은 항목이 있어 참고용입니다." : undefined,
  };
}

/** 혼합 실루엣일 때 함께 보이는 두 유형 */
export function silhouetteParts(c: Classified<SilhouetteType>): SilhouetteType[] {
  return Object.keys(c.scores) as SilhouetteType[];
}

// ───────── 얼굴형 ─────────

/** 얼굴 메시 기준 원형(프로토타입) – 경험값 */
export const FACE_PROTOTYPES: Record<FaceShape, { lw: number; f: number; j: number; c: number }> = {
  round: { lw: 1.12, f: 0.9, j: 0.88, c: 0.5 },
  oval: { lw: 1.28, f: 0.9, j: 0.8, c: 0.42 },
  long: { lw: 1.45, f: 0.88, j: 0.8, c: 0.42 },
  square: { lw: 1.18, f: 0.92, j: 0.95, c: 0.56 },
  heart: { lw: 1.25, f: 0.98, j: 0.74, c: 0.34 },
  diamond: { lw: 1.3, f: 0.8, j: 0.74, c: 0.38 },
};
const FACE_SCALE = { lw: 0.08, f: 0.05, j: 0.05, c: 0.06 };

export function classifyFace(m: FaceMeasures | null, lowQuality = false): Classified<FaceShape> {
  if (!m) return { value: null, scores: {}, evidence: [], manual: false, note: "정면 얼굴 랜드마크가 없어 판단할 수 없습니다." };
  const scores = {} as Record<FaceShape, number>;
  let sum = 0;
  for (const [k, p] of Object.entries(FACE_PROTOTYPES) as [FaceShape, (typeof FACE_PROTOTYPES)[FaceShape]][]) {
    const d2 =
      ((m.lengthToWidth - p.lw) / FACE_SCALE.lw) ** 2 +
      ((m.forehead - p.f) / FACE_SCALE.f) ** 2 +
      ((m.jaw - p.j) / FACE_SCALE.j) ** 2 +
      ((m.chin - p.c) / FACE_SCALE.c) ** 2;
    scores[k] = Math.exp(-d2 / 8);
    sum += scores[k];
  }
  for (const k of Object.keys(scores) as FaceShape[]) scores[k] = sum > 0 ? scores[k] / sum : 0;
  const ranked = (Object.keys(scores) as FaceShape[]).sort((a, b) => scores[b] - scores[a]);
  const [top, second] = ranked;
  const mixed = scores[second] >= scores[top] * 0.7;

  const evidence: Evidence[] = [
    {
      source: "photo",
      weight: 0,
      text: `얼굴 세로 : 가로 = ${m.lengthToWidth.toFixed(2)} : 1 (${m.lengthToWidth < 1.2 ? "가로감이 있음" : m.lengthToWidth > 1.38 ? "세로로 긴 편" : "보통"})`,
    },
    {
      source: "photo",
      weight: 0,
      text: `이마 ${m.forehead.toFixed(2)} · 광대 1.00 · 턱 ${m.jaw.toFixed(2)} (${
        m.forehead > m.jaw + 0.15 ? "이마가 턱보다 넓음" : m.forehead < 0.84 && m.jaw < 0.8 ? "광대가 가장 넓음" : m.jaw >= 0.9 ? "턱선이 넓은 편" : "고른 편"
      })`,
    },
    { source: "photo", weight: 0, text: `턱끝 폭 ${m.chin.toFixed(2)} (${m.chin < 0.4 ? "갸름한 턱끝" : m.chin > 0.52 ? "넓고 둥근·각진 턱끝" : "보통"})` },
    { source: "photo", weight: 0, text: `하관(코끝~턱) ${(m.lowerFace * 100).toFixed(0)}%` },
  ];
  return {
    value: top,
    secondary: mixed ? second : null,
    scores,
    evidence,
    manual: false,
    note: [
      mixed ? `${FACE_LABEL[top]}을 중심으로 ${FACE_LABEL[second]} 특징이 함께 보입니다.` : null,
      lowQuality ? "얼굴 사진 품질 경고가 있어 참고용입니다." : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
  };
}

// ───────── 목 길이 ─────────

export function classifyNeck(r: BodyMetricsResult | null): Classified<NeckLength> {
  const m = usable(metricOf(r, "faceNeck"));
  if (!m) {
    return {
      value: null,
      scores: {},
      evidence: [],
      manual: false,
      note: "턱끝·목 밑 기준선이 필요합니다. 전신 비율 탭에서 기준선을 지정하거나 직접 선택해 주세요.",
    };
  }
  const v = m.value!;
  const R = RULES.neck;
  const value: NeckLength = v < R.short ? "short" : v > R.long ? "long" : "normal";
  let secondary: NeckLength | null = null;
  if (Math.abs(v - R.short) <= R.margin) secondary = value === "short" ? "normal" : "short";
  else if (Math.abs(v - R.long) <= R.margin) secondary = value === "long" ? "normal" : "long";
  return {
    value,
    secondary,
    scores: { [value]: 1 },
    evidence: [
      {
        source: "photo",
        weight: 0,
        text: `보이는 목 길이 = 얼굴 길이의 ${(v * 100).toFixed(0)}% (기준: ${Math.round(R.short * 100)}% 미만 짧아 보임 · ${Math.round(R.long * 100)}% 초과 길어 보임)`,
      },
    ],
    manual: false,
    note:
      (secondary ? "경계값 근처입니다. " : "") +
      "카메라 높이·고개 각도·옷깃·머리카락에 따라 달라지는 상대값입니다." +
      (m.status === "low" ? " 기준선 신뢰도가 낮습니다." : ""),
  };
}

// ───────── 어깨 ─────────

export function classifyShoulder(r: BodyMetricsResult | null): { slope: Classified<ShoulderSlope>; width: Classified<ShoulderWidth> } {
  const sl = usable(metricOf(r, "shoulderSlope"));
  const sh = usable(metricOf(r, "shoulderHip"));
  const R = RULES;
  const slope: Classified<ShoulderSlope> = sl
    ? (() => {
        const v = sl.value!;
        const value: ShoulderSlope = v <= R.shoulderSlope.square ? "square" : v >= R.shoulderSlope.sloped ? "sloped" : "normal";
        return {
          value,
          scores: { [value]: 1 },
          evidence: [{ source: "photo", weight: 0, text: `어깨 경사 ${v.toFixed(1)}° (${R.shoulderSlope.square}° 이하 직각형 · ${R.shoulderSlope.sloped}° 이상 처진 어깨)` }],
          manual: false,
        };
      })()
    : { value: null, scores: {}, evidence: [], manual: false, note: "어깨 경사를 측정하지 못했습니다." };
  const width: Classified<ShoulderWidth> = sh
    ? (() => {
        const v = sh.value!;
        const value: ShoulderWidth = v >= R.shoulderWidth.broad ? "broad" : v <= R.shoulderWidth.narrow ? "narrow" : "balanced";
        return {
          value,
          scores: { [value]: 1 },
          evidence: [{ source: "photo", weight: 0, text: `어깨 : 골반 = ${v.toFixed(2)} : 1` }],
          manual: false,
        };
      })()
    : { value: null, scores: {}, evidence: [], manual: false, note: "어깨·골반 폭을 측정하지 못했습니다." };
  return { slope, width };
}

// ───────── 측면 상체 두께 ─────────

/** 측면 사진에서 가슴 높이 상체 두께 ÷ (어깨~골반 관절 높이). 측정 불가면 null */
export function sideTorsoDepth(pose: LandmarkPx[] | null, mask: BinaryMask | null, W: number, H: number): number | null {
  if (!pose || !mask) return null;
  const pick = (a: number, b: number) => (pose[a].visibility >= pose[b].visibility ? pose[a] : pose[b]);
  const sh = pick(POSE.leftShoulder, POSE.rightShoulder);
  const hip = pick(POSE.leftHip, POSE.rightHip);
  if (sh.visibility < 0.5 || hip.visibility < 0.5) return null;
  const torso = hip.y - sh.y;
  if (torso <= 0) return null;
  const y = sh.y + torso * 0.25;
  const x = (sh.x + hip.x) / 2;
  const run = runAt(mask, x, y, W, H, W * 0.02);
  if (!run) return null;
  return (run.right - run.left) / torso;
}

// ───────── 골격 타입 ─────────

export function classifyBone(params: {
  metrics: BodyMetricsResult | null;
  sideDepth: number | null;
  survey: SurveyAnswers;
}): BoneResult {
  const scores: Record<BoneType, number> = { STRAIGHT: 0, WAVE: 0, NATURAL: 0 };
  const evidence: Evidence[] = [];
  const add = (t: BoneType, w: number, text: string, source: Evidence["source"] = "photo") => {
    scores[t] += w;
    evidence.push({ source, target: t, weight: w, text });
  };
  const half = (m: Metric) => (m.status === "low" ? 0.5 : 1);
  const lowTag = (m: Metric) => (m.status === "low" ? " (신뢰도 낮음 → 가중치 절반)" : "");

  // 사진 근거 – 골격의 '외형'만 참고. 관절 크기·질감·골격 깊이는 설문으로 보완
  const wh = usable(metricOf(params.metrics, "waistHip"));
  if (wh) {
    const v = wh.value!;
    if (v <= 0.72) add("WAVE", 2 * half(wh), `허리가 골반 대비 잘록함 (허리:골반 ${v.toFixed(2)})${lowTag(wh)}`);
    else if (v <= 0.8) add("WAVE", 1 * half(wh), `허리 굴곡이 있는 편 (허리:골반 ${v.toFixed(2)})${lowTag(wh)}`);
    else if (v >= 0.82) {
      add("STRAIGHT", 1 * half(wh), `허리 굴곡이 크지 않고 일자에 가까움 (허리:골반 ${v.toFixed(2)})${lowTag(wh)}`);
      add("NATURAL", 0.5 * half(wh), `허리선보다 직선적인 프레임 (허리:골반 ${v.toFixed(2)})${lowTag(wh)}`);
    }
  }
  const sh = usable(metricOf(params.metrics, "shoulderHip"));
  if (sh) {
    const v = sh.value!;
    if (v >= 1.08) {
      add("NATURAL", 1 * half(sh), `어깨가 골반보다 넓은 프레임 (어깨:골반 ${v.toFixed(2)})${lowTag(sh)}`);
      add("STRAIGHT", 1 * half(sh), `상체 쪽에 볼륨이 실림 (어깨:골반 ${v.toFixed(2)})${lowTag(sh)}`);
    } else if (v <= 0.98) add("WAVE", 1.5 * half(sh), `하체(골반) 쪽으로 무게중심 (어깨:골반 ${v.toFixed(2)})${lowTag(sh)}`);
  }
  const sl = usable(metricOf(params.metrics, "shoulderSlope"));
  if (sl) {
    const v = sl.value!;
    if (v >= RULES.shoulderSlope.sloped) add("WAVE", 1 * half(sl), `어깨선이 부드럽게 내려감 (${v.toFixed(0)}°)${lowTag(sl)}`);
    else if (v <= RULES.shoulderSlope.square) add("NATURAL", 1 * half(sl), `어깨선이 수평에 가깝고 각이 있음 (${v.toFixed(0)}°)${lowTag(sl)}`);
  }
  if (params.sideDepth !== null) {
    const v = params.sideDepth;
    if (v >= RULES.sideDepth.thick) add("STRAIGHT", 1.5, `옆에서 본 상체가 두꺼워 입체감 있음 (두께/몸통 ${v.toFixed(2)})`);
    else if (v <= RULES.sideDepth.thin) add("WAVE", 1, `옆에서 본 상체가 얇은 편 (두께/몸통 ${v.toFixed(2)})`);
  }
  const photoCount = evidence.length;

  // 설문 근거
  let answered = 0;
  for (const q of SURVEY) {
    const a = params.survey[q.id];
    if (!a) continue;
    const opt = q.options.find((o) => o.value === a);
    if (!opt || !opt.type) continue;
    answered++;
    add(opt.type, RULES.bone.surveyPoint, `${q.short}: ${opt.label}`, "survey");
  }

  const ranked = (Object.keys(scores) as BoneType[]).sort((a, b) => scores[b] - scores[a]);
  const [p, s] = ranked;
  const total = scores.STRAIGHT + scores.WAVE + scores.NATURAL;

  if (total <= 0 || (answered < RULES.bone.minSurvey && photoCount < 2)) {
    return {
      kind: "UNDETERMINED",
      primary: null,
      secondary: null,
      scores,
      evidence,
      manual: false,
      note: `근거가 부족합니다(사진 근거 ${photoCount}개, 설문 ${answered}개). 관절·질감·골격 깊이는 사진으로 확정할 수 없으니 보조 설문을 ${RULES.bone.minSurvey}개 이상 답해 주세요.`,
    };
  }
  const gap = scores[p] - scores[s];
  if (gap <= Math.max(RULES.bone.mixedGap, scores[p] * 0.15)) {
    return {
      kind: "MIXED",
      primary: p,
      secondary: s,
      scores,
      evidence,
      manual: false,
      note: `${BONE_LABEL[p]}과 ${BONE_LABEL[s]} 특징이 비슷하게 나타납니다(점수 차 ${gap.toFixed(1)}).`,
    };
  }
  return {
    kind: p,
    primary: p,
    secondary: scores[s] > 0 ? s : null,
    scores,
    evidence,
    manual: false,
    note: answered < RULES.bone.minSurvey ? "설문 응답이 적어 사진 외형 위주로 판단했습니다." : undefined,
  };
}
