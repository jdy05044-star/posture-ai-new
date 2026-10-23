import type { BodyMetricsResult, MetricId, PhotoAnalysis } from "../types";
import type { BoneType, Classified, FaceShape, NeckLength, RatioValue, SilhouetteType, StyleImage, StyleProfile } from "../style/types";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, SILHOUETTE_LABEL } from "../style/types";
import { classifyBone, classifyFace, classifyNeck, classifyShoulder, classifySilhouette, sideTorsoDepth } from "../analysis/classify";
import { computeFaceMeasures } from "../analysis/faceMeasures";
import type { SurveyAnswers } from "../analysis/survey";

/** 사용자가 결과를 직접 고친 값 (자동 판단보다 우선) */
export interface StyleOverrides {
  bone?: BoneType;
  silhouette?: SilhouetteType;
  face?: FaceShape;
  neck?: NeckLength;
}

function manual<T extends string>(base: Classified<T>, v: T | undefined, label: string): Classified<T> {
  if (!v) return base;
  return {
    value: v,
    secondary: null,
    scores: { [v]: 1 } as Partial<Record<T, number>>,
    evidence: [{ source: "manual", weight: 0, text: `사용자가 '${label}'(으)로 직접 선택` }, ...base.evidence],
    manual: true,
  };
}

export function buildStyleProfile(p: {
  body: BodyMetricsResult | null;
  frontFace?: PhotoAnalysis;
  sideBody?: PhotoAnalysis;
  survey: SurveyAnswers;
  overrides: StyleOverrides;
  images: StyleImage[];
}): StyleProfile {
  const side = p.sideBody?.body;
  const depth = side ? sideTorsoDepth(side.pose, side.personMask, p.sideBody!.width, p.sideBody!.height) : null;
  let bone = classifyBone({ metrics: p.body, sideDepth: depth, survey: p.survey });
  if (p.overrides.bone) {
    const t = p.overrides.bone;
    bone = {
      ...bone,
      kind: t,
      primary: t,
      secondary: null,
      manual: true,
      evidence: [{ source: "manual", weight: 0, target: t, text: `사용자가 '${BONE_LABEL[t]}'(으)로 직접 선택` }, ...bone.evidence],
      note: "직접 선택한 유형으로 추천합니다.",
    };
  }
  const faceIssues = p.frontFace?.issues.some((i) => i.level !== "info") ?? false;
  const face = manual(classifyFace(computeFaceMeasures(p.frontFace?.face?.landmarks), faceIssues), p.overrides.face, p.overrides.face ? FACE_LABEL[p.overrides.face] : "");
  const silhouette = manual(classifySilhouette(p.body), p.overrides.silhouette, p.overrides.silhouette ? SILHOUETTE_LABEL[p.overrides.silhouette] : "");
  const neck = manual(classifyNeck(p.body), p.overrides.neck, p.overrides.neck ? NECK_LABEL[p.overrides.neck] : "");
  const { slope, width } = classifyShoulder(p.body);

  const ratio = (id: MetricId, transform?: (v: number) => number): RatioValue => {
    const m = p.body?.metrics.find((x) => x.id === id);
    if (!m || m.status === "unavailable" || m.value === null) return { value: null, low: false };
    return { value: transform ? transform(m.value) : m.value, low: m.status === "low" };
  };

  return {
    bone,
    silhouette,
    face,
    neck,
    shoulderSlope: slope,
    shoulderWidth: width,
    ratios: {
      legToTorso: ratio("torsoLeg"),
      waistHeightPct: ratio("waistHeight"),
      headToBody: ratio("headToBody"),
      shoulderHip: ratio("shoulderHip"),
      waistHip: ratio("waistHip"),
    },
    images: p.images,
  };
}
