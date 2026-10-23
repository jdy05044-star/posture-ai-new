import { describe, expect, it } from "vitest";
import { classifyBone, classifyFace, classifyNeck, classifySilhouette, FACE_PROTOTYPES } from "../src/lib/analysis/classify";
import type { BodyMetricsResult, Metric, MetricId } from "../src/lib/types";
import type { StyleProfile } from "../src/lib/style/types";
import { recommendNecklines } from "../src/lib/recommend/necklines";
import { recommendOutfits } from "../src/lib/recommend/outfits";

const m = (id: MetricId, value: number | null, status: Metric["status"] = "ok"): Metric => ({
  id,
  index: 0,
  label: id,
  value,
  display: "",
  status: value === null ? "unavailable" : status,
  definition: "",
  reasons: [],
  uses: [],
});
const result = (vals: Partial<Record<MetricId, number | null>>, status: Metric["status"] = "ok"): BodyMetricsResult => ({
  metrics: Object.entries(vals).map(([k, v]) => m(k as MetricId, v as number | null, status)),
  postureFlags: [],
});

describe("실루엣 분류", () => {
  it("어깨≈골반 + 잘록한 허리 → 모래시계형", () => {
    expect(classifySilhouette(result({ shoulderHip: 1.0, waistHip: 0.68 })).value).toBe("hourglass");
  });
  it("어깨≈골반 + 완만한 허리 → 직사각형", () => {
    expect(classifySilhouette(result({ shoulderHip: 1.0, waistHip: 0.85 })).value).toBe("rectangle");
  });
  it("골반이 넓으면 삼각형, 어깨가 넓으면 역삼각형", () => {
    expect(classifySilhouette(result({ shoulderHip: 0.88, waistHip: 0.75 })).value).toBe("triangle");
    expect(classifySilhouette(result({ shoulderHip: 1.15, waistHip: 0.8 })).value).toBe("invertedTriangle");
  });
  it("경계값 근처는 혼합형으로 두 유형 표시", () => {
    const c = classifySilhouette(result({ shoulderHip: 1.06, waistHip: 0.7 }));
    expect(c.value).toBe("mixed");
    expect(Object.keys(c.scores).sort()).toEqual(["hourglass", "invertedTriangle"]);
  });
  it("폭 측정 불가면 판단하지 않음", () => {
    expect(classifySilhouette(result({ shoulderHip: null, waistHip: 0.7 })).value).toBeNull();
  });
});

describe("얼굴형 분류", () => {
  for (const [shape, p] of Object.entries(FACE_PROTOTYPES)) {
    it(`${shape} 원형 수치 → ${shape}`, () => {
      const c = classifyFace({ lengthToWidth: p.lw, forehead: p.f, jaw: p.j, chin: p.c, lowerFace: 0.33 });
      expect(c.value).toBe(shape);
    });
  }
  it("두 원형 중간이면 혼합 특징 표시", () => {
    const a = FACE_PROTOTYPES.oval;
    const b = FACE_PROTOTYPES.long;
    const c = classifyFace({ lengthToWidth: (a.lw + b.lw) / 2, forehead: a.f, jaw: a.j, chin: a.c, lowerFace: 0.33 });
    expect([c.value, c.secondary].sort()).toEqual(["long", "oval"]);
  });
  it("랜드마크 없으면 null", () => {
    expect(classifyFace(null).value).toBeNull();
  });
});

describe("목 길이", () => {
  it("기준값으로 3단계", () => {
    expect(classifyNeck(result({ faceNeck: 0.2 })).value).toBe("short");
    expect(classifyNeck(result({ faceNeck: 0.35 })).value).toBe("normal");
    expect(classifyNeck(result({ faceNeck: 0.5 })).value).toBe("long");
  });
  it("경계값 근처는 2순위 표시", () => {
    expect(classifyNeck(result({ faceNeck: 0.28 })).secondary).toBe("short");
  });
  it("측정 불가면 null", () => {
    expect(classifyNeck(result({ faceNeck: null })).value).toBeNull();
  });
});

describe("골격 타입", () => {
  it("근거가 부족하면 판단 보류", () => {
    const r = classifyBone({ metrics: result({}), sideDepth: null, survey: {} });
    expect(r.kind).toBe("UNDETERMINED");
  });
  it("사진(잘록한 허리·하체 무게중심) + 설문 웨이브 → 웨이브", () => {
    const r = classifyBone({
      metrics: result({ waistHip: 0.68, shoulderHip: 0.95 }),
      sideDepth: 0.4,
      survey: { wrist: "w", texture: "w", knee: "w", weightGain: "w" },
    });
    expect(r.kind).toBe("WAVE");
    expect(r.evidence.some((e) => e.source === "photo")).toBe(true);
    expect(r.evidence.some((e) => e.source === "survey")).toBe(true);
  });
  it("두 유형 점수가 비슷하면 혼합형", () => {
    const r = classifyBone({
      metrics: result({}),
      sideDepth: null,
      survey: { wrist: "s", collarbone: "n", texture: "s", knee: "n" },
    });
    expect(r.kind).toBe("MIXED");
    expect([r.primary, r.secondary].sort()).toEqual(["NATURAL", "STRAIGHT"]);
  });
  it("'모르겠음'은 점수에 반영하지 않음", () => {
    const r = classifyBone({ metrics: result({}), sideDepth: null, survey: { wrist: "unknown", knee: "unknown", hand: "unknown" } });
    expect(r.kind).toBe("UNDETERMINED");
  });
  it("신뢰도 낮은 측정값은 가중치 절반", () => {
    const ok = classifyBone({ metrics: result({ waistHip: 0.68 }), sideDepth: null, survey: {} });
    const low = classifyBone({ metrics: result({ waistHip: 0.68 }, "low"), sideDepth: null, survey: {} });
    expect(low.scores.WAVE).toBe(ok.scores.WAVE / 2);
  });
});

const baseProfile = (over: Partial<StyleProfile> = {}): StyleProfile => ({
  bone: { kind: "WAVE", primary: "WAVE", secondary: null, scores: { STRAIGHT: 0, WAVE: 6, NATURAL: 0 }, evidence: [], manual: false },
  silhouette: { value: "hourglass", scores: { hourglass: 1 }, evidence: [], manual: false },
  face: { value: "round", scores: { round: 1 }, evidence: [], manual: false },
  neck: { value: "short", scores: { short: 1 }, evidence: [], manual: false },
  shoulderSlope: { value: "sloped", scores: {}, evidence: [], manual: false },
  shoulderWidth: { value: "narrow", scores: {}, evidence: [], manual: false },
  ratios: {
    legToTorso: { value: 1.15, low: false },
    waistHeightPct: { value: 59, low: false },
    headToBody: { value: 7.0, low: false },
    shoulderHip: { value: 0.96, low: false },
    waistHip: { value: 0.68, low: false },
  },
  images: [],
  ...over,
});

describe("넥라인 추천", () => {
  it("둥근 얼굴 + 짧은 목 → V넥 상위, 터틀넥 비추천", () => {
    const recs = recommendNecklines(baseProfile());
    const ids = recs.map((r) => r.id);
    expect(ids.indexOf("v")).toBeLessThan(3);
    expect(recs.find((r) => r.id === "turtle")!.level).toBe("avoid");
  });
  it("긴 얼굴 + 긴 목 → 라운드·보트·터틀이 V넥보다 높음", () => {
    const recs = recommendNecklines(
      baseProfile({
        face: { value: "long", scores: {}, evidence: [], manual: false },
        neck: { value: "long", scores: {}, evidence: [], manual: false },
      }),
    );
    const score = (id: string) => recs.find((r) => r.id === id)!.score;
    expect(score("round")).toBeGreaterThan(score("v"));
    expect(score("boat")).toBeGreaterThan(score("v"));
    expect(score("turtle")).toBeGreaterThan(score("v"));
  });
  it("모든 넥라인에 근거·효과·주의점 제공", () => {
    const recs = recommendNecklines(baseProfile());
    expect(recs).toHaveLength(10);
    for (const r of recs) {
      expect(r.reasons.length).toBeGreaterThan(0);
      expect(r.cautions.length).toBeGreaterThan(0);
    }
  });
  it("원하는 이미지·취향이 점수를 바꿈", () => {
    const before = recommendNecklines(baseProfile()).find((r) => r.id === "collar")!.score;
    const after = recommendNecklines(baseProfile({ images: ["neat"] }), { collar: "like" }).find((r) => r.id === "collar")!.score;
    expect(after).toBeCloseTo(before + 1.5 + 1.5, 1);
  });
});

describe("의상 추천", () => {
  it("웨이브 + 짧은 다리 → 하이웨이스트·크롭 추천, 로우라이즈·드롭웨이스트 비추천", () => {
    const cats = recommendOutfits(baseProfile());
    const opt = (c: string, o: string) => cats.find((x) => x.id === c)!.options.find((x) => x.id === o)!;
    expect(opt("rise", "high").level).toBe("best");
    expect(opt("topLength", "crop").level).toBe("best");
    expect(opt("rise", "low").level).toBe("avoid");
    expect(opt("dressWaist", "drop").level).toBe("avoid");
    expect(opt("rise", "high").reasons.some((r) => r.category === "ratio")).toBe(true);
  });
  it("내추럴 → 오버핏·와이드·롱코트 추천, 슬림핏 비추천", () => {
    const cats = recommendOutfits(
      baseProfile({
        bone: { kind: "NATURAL", primary: "NATURAL", secondary: null, scores: { STRAIGHT: 0, WAVE: 0, NATURAL: 6 }, evidence: [], manual: false },
        silhouette: { value: "rectangle", scores: { rectangle: 1 }, evidence: [], manual: false },
        ratios: { ...baseProfile().ratios, legToTorso: { value: 1.3, low: false }, waistHeightPct: { value: 62, low: false } },
      }),
    );
    const opt = (c: string, o: string) => cats.find((x) => x.id === c)!.options.find((x) => x.id === o)!;
    expect(["best", "good"]).toContain(opt("topFit", "over").level);
    expect(["best", "good"]).toContain(opt("pants", "wide").level);
    expect(["best", "good"]).toContain(opt("outerLength", "longCoat").level);
    expect(["caution", "avoid"]).toContain(opt("topFit", "slim").level);
  });
  it("측정 불가 비율은 조건을 만들지 않음", () => {
    const cats = recommendOutfits(
      baseProfile({ ratios: { legToTorso: { value: null, low: false }, waistHeightPct: { value: null, low: false }, headToBody: { value: null, low: false }, shoulderHip: { value: null, low: false }, waistHip: { value: null, low: false } } }),
    );
    expect(cats.flatMap((c) => c.options).some((o) => o.reasons.some((r) => r.category === "ratio"))).toBe(false);
  });
});
