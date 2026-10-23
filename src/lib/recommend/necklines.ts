// ───────────── 5단계: 넥라인 추천 엔진 (규칙 테이블 + 점수 합산) ─────────────
// 각 규칙은 [가감 점수, 근거 문장] 입니다. 어울림은 절대적 사실이 아닌 스타일링 경향이며,
// 사용자의 원하는 이미지·취향 입력으로 결과가 바뀝니다.
import type {
  BoneType,
  FaceShape,
  NecklineId,
  NecklineRec,
  NeckLength,
  RecReason,
  ShoulderSlope,
  ShoulderWidth,
  StyleImage,
  StyleProfile,
} from "../style/types";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, STYLE_IMAGE_LABEL, levelOf } from "../style/types";

type Rule = [number, string];

interface NecklineDef {
  id: NecklineId;
  name: string;
  faceEffect: string;
  neckEffect: string;
  shoulderEffect: string;
  cautions: string[];
  face: Partial<Record<FaceShape, Rule>>;
  neck: Partial<Record<NeckLength, Rule>>;
  shoulder: Partial<Record<ShoulderWidth | ShoulderSlope, Rule>>;
  bone: Partial<Record<BoneType, Rule>>;
  images: Partial<Record<StyleImage, number>>;
}

export const NECKLINES: NecklineDef[] = [
  {
    id: "v",
    name: "V넥",
    faceEffect: "얼굴 아래로 세로 라인이 이어져 얼굴 폭보다 길이가 강조됩니다.",
    neckEffect: "목 아래 V존이 열려 목이 길어 보입니다.",
    shoulderEffect: "시선이 몸 중앙으로 모여 넓은 어깨가 덜 강조됩니다.",
    cautions: ["가슴 볼륨이 있으면 너무 깊지 않은 V(쇄골 아래 한 뼘 이내)", "얼굴이 긴 편이면 얕고 넓은 V를 선택"],
    face: {
      round: [2, "둥근 얼굴에 세로 라인을 더해 갸름해 보이게 합니다."],
      diamond: [1.5, "광대 쪽 시선을 아래로 내려 조화로운 인상을 줍니다."],
      square: [1, "턱선 대신 V의 꼭짓점으로 시선을 옮겨 줍니다."],
      long: [-1, "세로 라인이 더해져 얼굴이 더 길어 보일 수 있습니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
    },
    neck: {
      short: [2, "목이 짧아 보이는 편이라 시선이 아래로 떨어지는 V가 목을 길어 보이게 합니다."],
      normal: [0.5, "목 길이가 보통이라 깊이를 자유롭게 고를 수 있습니다."],
      long: [-0.5, "목이 길어 보여 깊은 V는 상반신이 허전해 보일 수 있습니다."],
    },
    shoulder: { broad: [1, "넓은 어깨의 가로 폭을 중앙 세로선으로 분산합니다."] },
    bone: {
      STRAIGHT: [2, "상체 볼륨이 있는 스트레이트에 V가 쇄골 라인을 드러내 상체를 슬림하게 정리합니다."],
      NATURAL: [0.5, "얕은 V나 셔츠를 풀어 만든 V존이 자연스럽습니다."],
      WAVE: [0, "깊은 V보다는 얕은 V가 얇은 상체와 어울립니다."],
    },
    images: { chic: 1, neat: 0.5, elegant: 0.5 },
  },
  {
    id: "u",
    name: "U넥",
    faceEffect: "부드러운 곡선이 턱선의 각을 완화합니다.",
    neckEffect: "쇄골까지 열려 목이 길고 시원해 보입니다.",
    shoulderEffect: "쇄골·어깨선을 부드럽게 드러냅니다.",
    cautions: ["너무 깊게 파이면 이너가 필요", "얇은 상체는 깊이보다 너비를 조절"],
    face: {
      square: [2, "곡선이 각진 턱선을 부드럽게 완화합니다."],
      heart: [1.5, "아래쪽에 곡선 볼륨을 더해 좁은 턱과 균형을 맞춥니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
      round: [-0.5, "둥근 곡선이 반복되어 얼굴의 둥근 느낌이 강조될 수 있습니다."],
    },
    neck: {
      short: [1.5, "목 아래가 시원하게 열려 목이 길어 보입니다."],
      normal: [0.5, "목 길이가 보통이라 깊이를 자유롭게 고를 수 있습니다."],
    },
    shoulder: { narrow: [0.5, "쇄골이 드러나 좁은 어깨가 답답해 보이지 않습니다."] },
    bone: {
      WAVE: [1, "얕은 U넥이 여리한 상체와 잘 맞습니다."],
      STRAIGHT: [1, "깊은 U넥이 상체를 가볍게 보이게 합니다."],
      NATURAL: [0, "넓고 여유 있는 U넥이면 무난합니다."],
    },
    images: { feminine: 1, elegant: 0.5 },
  },
  {
    id: "round",
    name: "라운드넥",
    faceEffect: "목 가까운 가로 곡선이 얼굴 길이를 짧아 보이게 합니다.",
    neckEffect: "목 아랫부분을 감싸 목이 길어 보이는 효과를 줄여 줍니다.",
    shoulderEffect: "단정한 곡선으로 어깨선에 큰 영향을 주지 않습니다.",
    cautions: ["목이 짧아 보이면 목에 딱 붙지 않는 넓은 라운드", "둥근 얼굴은 깊이 있는 라운드로"],
    face: {
      long: [2, "가로 곡선이 더해져 긴 얼굴이 짧아 보입니다."],
      heart: [1, "턱 아래를 곡선으로 채워 좁은 턱과 균형을 맞춥니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
      round: [-1, "얼굴 아래 둥근 선이 반복되어 얼굴이 더 둥글어 보일 수 있습니다."],
    },
    neck: {
      long: [1.5, "긴 목을 살짝 가려 안정감 있는 인상을 줍니다."],
      short: [-1, "목 가까운 라운드는 목을 더 짧아 보이게 할 수 있습니다."],
    },
    shoulder: {},
    bone: {
      WAVE: [1, "목 가까운 단정한 곡선이 여리한 상체와 어울립니다."],
      STRAIGHT: [-0.5, "목이 막혀 상체 볼륨이 답답해 보일 수 있습니다(넓고 깊은 라운드는 무난)."],
      NATURAL: [0.5, "여유 있는 라운드 티·니트로 연출하면 자연스럽습니다."],
    },
    images: { neat: 1, casual: 1, comfy: 0.5 },
  },
  {
    id: "square",
    name: "스퀘어넥",
    faceEffect: "직선 프레임이 얼굴의 둥근 윤곽을 정돈합니다.",
    neckEffect: "목~쇄골이 넓게 드러나 목선이 길어 보입니다.",
    shoulderEffect: "쇄골과 어깨 라인을 가로로 드러내 상체 폭을 보완합니다.",
    cautions: ["각진 얼굴은 모서리가 둥근 스퀘어", "넓은 어깨는 폭이 좁은 스퀘어"],
    face: {
      round: [2, "직선 프레임이 둥근 얼굴을 또렷하게 정리합니다."],
      diamond: [1.5, "직선 라인이 광대·턱의 조화를 만들어 줍니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
      square: [-1, "각진 라인이 반복되어 턱선이 강조될 수 있습니다."],
    },
    neck: { short: [1, "목~쇄골이 열려 목이 길어 보입니다."], normal: [0.5, "목 길이가 보통이라 무리 없이 어울립니다."] },
    shoulder: {
      narrow: [1, "가로 직선이 좁은 어깨에 폭을 더해 줍니다."],
      sloped: [0.5, "어깨 끝까지 이어지는 가로선이 처진 어깨를 보완합니다."],
      broad: [-0.5, "폭이 넓은 스퀘어는 어깨가 더 넓어 보일 수 있습니다."],
    },
    bone: {
      WAVE: [2, "얇은 상체에 쇄골 라인을 드러내 여리여리한 분위기를 살립니다."],
      STRAIGHT: [1, "깊게 파인 스퀘어는 상체를 가볍게 보이게 합니다."],
      NATURAL: [0, "넓고 깊은 스퀘어면 무난합니다."],
    },
    images: { elegant: 1, feminine: 1 },
  },
  {
    id: "boat",
    name: "보트넥",
    faceEffect: "어깨를 따라 넓게 파인 가로선 덕분에 얼굴이 작아 보입니다.",
    neckEffect: "목 아래가 가로로 열려 목이 짧아 보일 수 있습니다.",
    shoulderEffect: "어깨 폭을 넓어 보이게 하는 가로 라인입니다.",
    cautions: ["어깨가 넓으면 피하거나 어두운 색으로", "목이 짧아 보이면 깊이 있는 보트넥"],
    face: {
      long: [2, "가로 라인이 긴 얼굴의 세로감을 줄여 줍니다."],
      square: [1, "넓은 가로선이 턱선 폭과 균형을 맞춥니다."],
      heart: [0.5, "어깨 쪽 가로감이 넓은 이마와 균형을 이룹니다."],
      round: [-0.5, "가로선이 반복되어 얼굴이 넓어 보일 수 있습니다."],
    },
    neck: {
      long: [1.5, "긴 목과 가로 라인이 우아한 균형을 만듭니다."],
      short: [-1, "가로로 넓게 끊기는 선이 목을 짧아 보이게 할 수 있습니다."],
    },
    shoulder: {
      narrow: [2, "좁은 어깨에 가로 폭을 더해 상체 균형을 맞춥니다."],
      sloped: [1, "어깨 끝까지 수평선이 이어져 처진 어깨를 보완합니다."],
      broad: [-1.5, "이미 넓은 어깨를 더 넓어 보이게 합니다."],
    },
    bone: {
      WAVE: [1, "얇은 상체에 가로감을 더해 균형을 잡아 줍니다."],
      NATURAL: [0.5, "넓고 여유 있는 보트넥이 골격과 어울립니다."],
      STRAIGHT: [-0.5, "상체 볼륨이 더 커 보일 수 있습니다."],
    },
    images: { elegant: 1, chic: 0.5 },
  },
  {
    id: "turtle",
    name: "터틀넥",
    faceEffect: "목을 덮어 얼굴 아래에 프레임을 만들고 시선을 얼굴로 모읍니다.",
    neckEffect: "목을 감싸 긴 목을 보완하지만 짧은 목은 더 짧아 보입니다.",
    shoulderEffect: "목~어깨가 한 덩어리로 보여 어깨 폭이 그대로 드러납니다.",
    cautions: ["얇은 하이게이지로 목 부분이 두껍지 않게", "목이 짧으면 롤 부분을 접지 않거나 모크넥 선택"],
    face: {
      long: [0.5, "목을 덮어 얼굴 세로가 상대적으로 짧아 보입니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
      round: [-1, "얼굴과 목이 이어져 얼굴이 더 크고 둥글어 보일 수 있습니다."],
      square: [-0.5, "턱 아래가 막혀 턱선이 강조될 수 있습니다."],
    },
    neck: {
      long: [2, "긴 목을 감싸 차분하고 안정감 있는 인상을 줍니다."],
      short: [-2, "목을 덮어 목이 더 짧아 보이고 상체가 답답해 보입니다."],
    },
    shoulder: { broad: [-0.5, "목~어깨가 이어져 넓은 어깨가 그대로 드러납니다."] },
    bone: {
      NATURAL: [1, "굵은 짜임의 여유 있는 터틀넥이 골격감과 어울립니다."],
      WAVE: [0.5, "얇고 부드러운 소재라면 여리한 상체와 어울립니다."],
      STRAIGHT: [-1, "상체를 덮어 볼륨이 커 보일 수 있습니다(얇은 소재는 무난)."],
    },
    images: { chic: 1, neat: 0.5, comfy: 0.5 },
  },
  {
    id: "mock",
    name: "모크넥",
    faceEffect: "목 중간까지 올라와 터틀넥보다 가볍게 얼굴 아래를 정돈합니다.",
    neckEffect: "목을 절반 정도 감싸 긴 목을 보완하고, 짧은 목에는 터틀넥보다 부담이 적습니다.",
    shoulderEffect: "단정한 라인으로 어깨에 큰 영향을 주지 않습니다.",
    cautions: ["목이 짧아 보이면 높이가 낮은 모크넥", "두꺼운 니트는 상체가 커 보임"],
    face: { long: [0.5, "얼굴 아래를 살짝 채워 세로감을 줄입니다."], round: [-0.5, "얼굴 아래 둥근 면이 커 보일 수 있습니다."] },
    neck: { long: [1.5, "긴 목을 적당히 감싸 균형을 맞춥니다."], short: [-1, "목이 덮여 짧아 보일 수 있습니다."] },
    shoulder: {},
    bone: {
      WAVE: [0.5, "얇은 소재의 모크넥이 여리한 상체와 어울립니다."],
      NATURAL: [0.5, "여유 있는 실루엣의 모크넥이 무난합니다."],
      STRAIGHT: [0, "얇고 매끈한 소재라면 무난합니다."],
    },
    images: { neat: 1, chic: 1, casual: 0.5 },
  },
  {
    id: "collar",
    name: "카라넥(셔츠 칼라)",
    faceEffect: "단추를 풀면 V존이 생겨 얼굴이 갸름해 보이고, 채우면 단정한 프레임이 됩니다.",
    neckEffect: "단추를 푼 만큼 목선이 길어 보입니다.",
    shoulderEffect: "칼라가 어깨 쪽 가로선을 만들어 상체에 구조감을 줍니다.",
    cautions: ["웨이브는 작고 부드러운 칼라·얇은 소재", "목이 짧으면 단추 1~2개를 풀어 V존 만들기"],
    face: {
      round: [1, "단추를 풀어 만든 V존이 둥근 얼굴을 길어 보이게 합니다."],
      long: [0.5, "단추를 채우면 칼라 가로선이 얼굴 길이를 줄여 줍니다."],
      oval: [0.5, "균형 잡힌 얼굴형이라 무리 없이 어울립니다."],
    },
    neck: {
      short: [1, "단추를 풀어 V존을 만들면 목이 길어 보입니다."],
      long: [1, "단추를 채워 칼라를 세우면 긴 목을 단정하게 보완합니다."],
      normal: [0.5, "단추로 열림 정도를 조절해 연출할 수 있습니다."],
    },
    shoulder: { narrow: [0.5, "칼라의 구조감이 좁은 어깨를 보완합니다."] },
    bone: {
      NATURAL: [2, "여유 있는 루즈핏 셔츠가 골격을 자연스럽게 감싸 멋스럽습니다."],
      STRAIGHT: [1.5, "힘 있는 원단의 베이직 셔츠가 상체를 깔끔하게 정리합니다."],
      WAVE: [-0.5, "빳빳하고 큰 칼라는 상체를 압도할 수 있습니다(작고 부드러운 칼라는 무난)."],
    },
    images: { neat: 1.5, casual: 0.5, chic: 0.5 },
  },
  {
    id: "sweetheart",
    name: "스위트하트넥",
    faceEffect: "하트 모양 곡선이 얼굴선을 부드럽게 만듭니다.",
    neckEffect: "가슴 위까지 열려 목이 길어 보입니다.",
    shoulderEffect: "어깨 끈·소매 형태에 따라 어깨 인상이 달라집니다.",
    cautions: ["상체 볼륨이 크면 깊이 조절", "디테일이 많은 디자인은 골격감 있는 체형에 부담"],
    face: {
      square: [1, "곡선이 각진 얼굴선을 부드럽게 해 줍니다."],
      diamond: [0.5, "곡선이 광대 쪽 각을 완화합니다."],
      heart: [-0.5, "하트 곡선이 반복되어 좁은 턱이 더 강조될 수 있습니다."],
    },
    neck: { short: [1, "목~가슴이 열려 목이 길어 보입니다."] },
    shoulder: { narrow: [0.5, "곡선 네크가 좁은 어깨를 여리하게 연출합니다."], broad: [-0.5, "어깨가 넓으면 노출 면적이 커 보입니다."] },
    bone: {
      WAVE: [1.5, "곡선적인 라인이 웨이브의 여성스러운 실루엣과 어울립니다."],
      STRAIGHT: [0.5, "디테일 없이 깔끔한 스위트하트라면 무난합니다."],
      NATURAL: [-1, "잔잔한 곡선 디테일이 골격감과 대비되어 어색할 수 있습니다."],
    },
    images: { feminine: 1.5, elegant: 0.5, casual: -0.5, neat: -0.5 },
  },
  {
    id: "offShoulder",
    name: "오프숄더",
    faceEffect: "어깨까지 가로로 드러나 얼굴이 작아 보입니다.",
    neckEffect: "목~어깨가 모두 드러나 목선이 길어 보입니다.",
    shoulderEffect: "어깨선이 그대로 드러나 어깨 폭과 경사가 강조됩니다.",
    cautions: ["어깨가 넓거나 각지면 부담", "고무줄 밴드가 팔뚝 위를 조이지 않는 사이즈"],
    face: { long: [1, "가로로 넓은 노출이 얼굴 길이를 줄여 줍니다."], square: [0.5, "넓은 가로선이 턱선과 균형을 맞춥니다."] },
    neck: { short: [1, "목~어깨가 열려 목이 길어 보입니다."], long: [1, "긴 목과 어깨가 드러나 우아한 분위기가 됩니다."] },
    shoulder: {
      narrow: [1.5, "좁은 어깨를 가로선으로 넓혀 균형을 맞춥니다."],
      sloped: [1, "처진 어깨를 밴드 라인이 받쳐 줍니다."],
      broad: [-1.5, "넓은 어깨가 그대로 강조됩니다."],
      square: [-0.5, "각진 어깨가 강조될 수 있습니다."],
    },
    bone: {
      WAVE: [1.5, "얇은 상체와 곡선적인 어깨를 살려 줍니다."],
      STRAIGHT: [-0.5, "상체 볼륨이 노출되어 상체가 커 보일 수 있습니다."],
      NATURAL: [0, "여유 있는 오프숄더 니트라면 무난합니다."],
    },
    images: { feminine: 1, elegant: 0.5, neat: -1 },
  },
];

export interface NecklinePrefs {
  [id: string]: "like" | "dislike" | undefined;
}

export function recommendNecklines(p: StyleProfile, prefs: NecklinePrefs = {}): NecklineRec[] {
  const recs = NECKLINES.map((d) => {
    const reasons: RecReason[] = [];
    const push = (category: RecReason["category"], rule: Rule | undefined, weight: number, prefix = "") => {
      if (!rule || weight === 0) return;
      reasons.push({ category, delta: round(rule[0] * weight), text: prefix + rule[1] });
    };

    // 얼굴형 (혼합이면 2순위 절반)
    if (p.face.value) {
      push("face", d.face[p.face.value], 1, `[${FACE_LABEL[p.face.value]}] `);
      if (p.face.secondary) push("face", d.face[p.face.secondary], 0.5, `[${FACE_LABEL[p.face.secondary]} 특징] `);
    }
    // 목 길이
    if (p.neck.value) {
      push("neck", d.neck[p.neck.value], 1, `[목 ${NECK_LABEL[p.neck.value]}] `);
      if (p.neck.secondary) push("neck", d.neck[p.neck.secondary], 0.4, `[경계: ${NECK_LABEL[p.neck.secondary]}] `);
    }
    // 어깨 폭·경사
    if (p.shoulderWidth.value) push("shoulder", d.shoulder[p.shoulderWidth.value], 1, "[어깨 폭] ");
    if (p.shoulderSlope.value) push("shoulder", d.shoulder[p.shoulderSlope.value], 1, "[어깨 경사] ");
    // 골격
    if (p.bone.primary) {
      const w2 = p.bone.kind === "MIXED" ? 0.6 : 0.3;
      push("bone", d.bone[p.bone.primary], 1, `[${BONE_LABEL[p.bone.primary]}] `);
      if (p.bone.secondary) push("bone", d.bone[p.bone.secondary], w2, `[${BONE_LABEL[p.bone.secondary]} 특징] `);
    }
    // 원하는 이미지
    for (const img of p.images) {
      const v = d.images[img];
      if (v) reasons.push({ category: "image", delta: v, text: `원하는 이미지 '${STYLE_IMAGE_LABEL[img]}'${v > 0 ? "에 잘 맞습니다" : "와는 결이 다릅니다"}.` });
    }
    // 개인 취향
    const pref = prefs[d.id];
    if (pref) reasons.push({ category: "preference", delta: pref === "like" ? 1.5 : -3, text: pref === "like" ? "좋아하는 넥라인으로 표시했습니다." : "선호하지 않는 넥라인으로 표시했습니다." });

    const score = round(reasons.reduce((s, r) => s + r.delta, 0));
    const pick = (cat: RecReason["category"], generic: string) => {
      const r = reasons.filter((x) => x.category === cat);
      return r.length ? r.map((x) => x.text).join(" ") : generic;
    };
    const rec: NecklineRec = {
      id: d.id,
      name: d.name,
      score,
      level: levelOf(score),
      reasons: reasons.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
      faceEffect: d.faceEffect + (p.face.value ? " " + pick("face", "") : ""),
      neckEffect: d.neckEffect + (p.neck.value ? " " + pick("neck", "") : ""),
      shoulderHarmony: pick("shoulder", d.shoulderEffect),
      cautions: d.cautions,
    };
    return rec;
  });
  return recs.sort((a, b) => b.score - a.score);
}


const round = (v: number) => Math.round(v * 10) / 10;
