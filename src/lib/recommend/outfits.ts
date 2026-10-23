// ───────────── 5단계: 체형별 의상 추천 엔진 ─────────────
import type { BoneType, OutfitCategoryRec, OutfitOptionRec, RecReason, SilhouetteType, StyleImage, StyleProfile } from "../style/types";
import { BONE_LABEL, SILHOUETTE_LABEL, STYLE_IMAGE_LABEL, levelOf } from "../style/types";
import { silhouetteParts } from "../analysis/classify";

type Rule = [number, string];

/** 측정 비율 조건 – 경험적 기준(평균 성인 비율 근처를 '보통'으로 둠) */
export const RATIO_RULES = {
  legShort: 1.2, // 다리÷몸통(어깨~가랑이) 미만
  legLong: 1.38,
  waistLow: 60, // 바닥~허리 높이 % 미만
  waistHigh: 64,
  headLow: 6.8, // 등신 미만
  headHigh: 7.8,
};

type RatioKey = "legShort" | "legLong" | "waistLow" | "waistHigh" | "headLow" | "headHigh";

interface OptionDef {
  id: string;
  name: string;
  bone: Partial<Record<BoneType, Rule>>;
  silhouette?: Partial<Record<SilhouetteType, Rule>>;
  ratio?: Partial<Record<RatioKey, Rule>>;
  images?: Partial<Record<StyleImage, number>>;
}

interface CategoryDef {
  id: string;
  group: OutfitCategoryRec["group"];
  title: string;
  options: OptionDef[];
}

export const OUTFIT_CATEGORIES: CategoryDef[] = [
  // ── 상의 ──
  {
    id: "topLength",
    group: "top",
    title: "상의 기장",
    options: [
      {
        id: "crop",
        name: "크롭 기장",
        bone: {
          WAVE: [2, "짧은 상의가 상체를 짧아 보이게 해 허리선과 비율을 살립니다."],
          STRAIGHT: [-0.5, "허리 굴곡이 크지 않아 크롭이 몸통을 끊어 보이게 할 수 있습니다."],
          NATURAL: [-1, "짧게 끊기는 기장은 골격의 프레임을 도드라지게 합니다."],
        },
        ratio: {
          legShort: [1, "다리가 몸통 대비 짧은 편이라 허리 위치를 올려 다리를 길어 보이게 합니다."],
          waistLow: [1, "허리 위치가 낮은 편이라 시선을 위로 올려 줍니다."],
        },
        images: { feminine: 0.5, casual: 0.5 },
      },
      {
        id: "regular",
        name: "기본 기장 (골반 위)",
        bone: {
          STRAIGHT: [2, "골반 위에서 끝나거나 하의에 넣어 입는 기본 기장이 상체를 깔끔하게 정리합니다."],
          WAVE: [0.5, "하의에 넣어 입으면 허리선이 살아납니다."],
          NATURAL: [0.5, "약간 여유 있는 기본 기장이 무난합니다."],
        },
        images: { neat: 0.5 },
      },
      {
        id: "long",
        name: "롱 기장 (힙을 덮는)",
        bone: {
          NATURAL: [1.5, "길게 떨어지는 기장이 골격의 여유를 살려 세련된 직선 실루엣을 만듭니다."],
          STRAIGHT: [0, "힘 있는 소재의 롱셔츠라면 무난합니다."],
          WAVE: [-1.5, "힙을 덮는 긴 상의는 상체를 길어 보이게 하고 비율이 아래로 늘어집니다."],
        },
        silhouette: { triangle: [0.5, "골반 라인을 자연스럽게 덮어 줍니다."] },
        ratio: {
          legShort: [-1, "다리가 몸통 대비 짧은 편이라 상체가 더 길어 보일 수 있습니다."],
          legLong: [0.5, "다리가 긴 편이라 롱 기장도 비율이 무너지지 않습니다."],
          headLow: [-0.5, "전신 대비 머리 비율이 큰 편이라 길이감이 아래로 쏠릴 수 있습니다."],
        },
        images: { comfy: 0.5, chic: 0.5 },
      },
    ],
  },
  {
    id: "topFit",
    group: "top",
    title: "상의 핏",
    options: [
      {
        id: "slim",
        name: "슬림핏",
        bone: {
          WAVE: [1.5, "부드럽게 몸에 맞는 핏이 얇은 상체와 곡선을 살립니다."],
          STRAIGHT: [0.5, "몸에 딱 맞기보다 매끈하게 떨어지는 정도가 좋습니다."],
          NATURAL: [-1.5, "몸의 라인이 드러나는 타이트한 핏은 골격감을 부각시킵니다."],
        },
        silhouette: { hourglass: [1, "모래시계형의 허리 굴곡을 드러냅니다."] },
        images: { feminine: 0.5, chic: 0.5 },
      },
      {
        id: "regularFit",
        name: "레귤러핏 (저스트)",
        bone: {
          STRAIGHT: [2, "어깨선이 맞는 저스트 핏이 입체적인 상체를 깔끔하게 정돈합니다."],
          WAVE: [0.5, "허리를 살짝 잡아 주면 좋습니다."],
          NATURAL: [0.5, "약간 여유를 두면 자연스럽습니다."],
        },
        images: { neat: 1 },
      },
      {
        id: "over",
        name: "오버핏",
        bone: {
          NATURAL: [2, "여유 있는 루즈핏이 골격을 자연스럽게 감싸 멋스러운 실루엣을 만듭니다."],
          STRAIGHT: [-1.5, "상체 볼륨에 옷의 볼륨이 더해져 부해 보일 수 있습니다."],
          WAVE: [-1, "옷에 몸이 묻혀 무게중심이 아래로 내려가 보입니다."],
        },
        silhouette: { rectangle: [0.5, "직선적인 몸통을 자연스럽게 덮어 줍니다."] },
        images: { casual: 1, comfy: 1 },
      },
    ],
  },
  {
    id: "topType",
    group: "top",
    title: "상의 종류",
    options: [
      {
        id: "shirt",
        name: "셔츠",
        bone: {
          NATURAL: [2, "루즈한 셔츠(린넨·코튼)가 골격의 여유를 살립니다."],
          STRAIGHT: [1.5, "힘 있는 원단의 베이직 셔츠가 상체를 정리합니다."],
          WAVE: [0, "얇고 부드러운 소재, 작은 칼라를 고르세요."],
        },
        images: { neat: 1, chic: 0.5 },
      },
      {
        id: "blouse",
        name: "블라우스",
        bone: {
          WAVE: [2, "부드럽고 하늘거리는 블라우스가 여리한 상체와 어울립니다."],
          STRAIGHT: [-0.5, "프릴·러플이 많은 블라우스는 상체를 커 보이게 합니다."],
          NATURAL: [-1, "프릴·리본 등 잔잔한 디테일이 많으면 시선이 분산됩니다."],
        },
        images: { feminine: 1.5, elegant: 0.5 },
      },
      {
        id: "knit",
        name: "니트",
        bone: {
          STRAIGHT: [1.5, "매끈한 하이게이지 니트가 상체 라인을 정돈합니다."],
          WAVE: [1, "얇고 부드러운 니트가 잘 어울립니다."],
          NATURAL: [1.5, "로우게이지·굵은 짜임 니트가 골격감과 어울립니다."],
        },
        images: { comfy: 0.5, elegant: 0.5 },
      },
      {
        id: "tee",
        name: "티셔츠",
        bone: {
          STRAIGHT: [1, "기본 크루넥·V넥 티를 저스트 사이즈로 입으면 깔끔합니다."],
          NATURAL: [1, "여유 있는 오버 티가 자연스럽습니다."],
          WAVE: [0.5, "몸에 맞는 슬림 티를 하의에 넣어 입으세요."],
        },
        images: { casual: 1.5, comfy: 0.5 },
      },
    ],
  },
  {
    id: "sleeve",
    group: "top",
    title: "소매·어깨 디자인",
    options: [
      {
        id: "setIn",
        name: "셋인 숄더 (어깨선 정확)",
        bone: {
          STRAIGHT: [2, "어깨선이 딱 맞는 디자인이 상체를 단정하게 정리합니다."],
          WAVE: [1, "작은 어깨에 맞는 어깨선이 왜소해 보이지 않게 합니다."],
          NATURAL: [0, "너무 딱 맞는 어깨선보다는 여유가 있는 편이 좋습니다."],
        },
        images: { neat: 1 },
      },
      {
        id: "drop",
        name: "드롭 숄더",
        bone: {
          NATURAL: [2, "자연스럽게 떨어지는 어깨선이 골격의 프레임과 어울립니다."],
          STRAIGHT: [-0.5, "어깨가 흘러내려 상체가 커 보일 수 있습니다."],
          WAVE: [-1, "어깨선이 내려가 상체가 더 처져 보입니다."],
        },
        images: { casual: 1, comfy: 1 },
      },
      {
        id: "puff",
        name: "퍼프 소매",
        bone: {
          WAVE: [1.5, "작은 퍼프가 얇은 상체에 볼륨을 더해 줍니다."],
          STRAIGHT: [-1.5, "상체에 볼륨이 더해져 상체가 더 커 보입니다."],
          NATURAL: [-1, "과한 디테일이 골격감과 부딪힙니다."],
        },
        images: { feminine: 1 },
      },
      {
        id: "raglan",
        name: "래글런 소매",
        bone: {
          NATURAL: [1, "목에서 사선으로 이어지는 소매가 어깨 프레임을 부드럽게 합니다."],
          STRAIGHT: [0, "무난하지만 셋인 숄더가 더 깔끔합니다."],
          WAVE: [0, "얇은 소재라면 무난합니다."],
        },
        silhouette: { invertedTriangle: [1, "사선 소매가 넓은 어깨 폭을 흐리게 해 줍니다."] },
        images: { casual: 0.5 },
      },
    ],
  },
  // ── 하의 ──
  {
    id: "rise",
    group: "bottom",
    title: "허리 위치(라이즈)",
    options: [
      {
        id: "high",
        name: "하이웨이스트",
        bone: {
          WAVE: [2, "허리 위치를 높여 다리를 길어 보이게 하고 잘록한 허리를 살립니다."],
          STRAIGHT: [1, "상의를 넣어 입으면 상체가 짧고 깔끔해 보입니다."],
          NATURAL: [0.5, "와이드 팬츠와 함께라면 무난합니다."],
        },
        ratio: {
          legShort: [1.5, "다리가 몸통 대비 짧은 편이라 허리선을 올려 다리를 길어 보이게 합니다."],
          waistLow: [1, "허리 위치가 낮은 편이라 시각적으로 끌어올립니다."],
        },
        images: { elegant: 0.5, feminine: 0.5 },
      },
      {
        id: "mid",
        name: "미드라이즈",
        bone: {
          STRAIGHT: [1, "자연스러운 허리 위치가 일자 라인과 어울립니다."],
          NATURAL: [1, "편안한 허리 위치가 직선 실루엣과 어울립니다."],
          WAVE: [0, "상의를 짧게 입으면 무난합니다."],
        },
        ratio: { legLong: [0.5, "다리가 긴 편이라 미드라이즈도 비율이 좋습니다."] },
        images: { casual: 0.5, comfy: 0.5 },
      },
      {
        id: "low",
        name: "로우라이즈",
        bone: {
          WAVE: [-2, "허리 위치가 아래로 보여 다리가 짧아 보이고 하체가 길어 보입니다."],
          STRAIGHT: [-1, "상체가 길어 보일 수 있습니다."],
          NATURAL: [0, "긴 다리와 함께라면 연출 가능합니다."],
        },
        ratio: {
          legShort: [-1.5, "다리가 몸통 대비 짧은 편이라 비율이 아래로 늘어집니다."],
          legLong: [0.5, "다리가 긴 편이라 부담이 적습니다."],
        },
        images: { casual: 0.5 },
      },
    ],
  },
  {
    id: "pants",
    group: "bottom",
    title: "팬츠 실루엣",
    options: [
      {
        id: "wide",
        name: "와이드 팬츠",
        bone: {
          NATURAL: [2, "여유 있는 와이드가 하체 라인을 감싸고 시원한 직선 실루엣을 만듭니다."],
          STRAIGHT: [0.5, "힘 있는 소재의 일자 와이드라면 무난합니다."],
          WAVE: [-1.5, "루즈하고 긴 핏은 무게중심이 내려가 다리가 짧아 보입니다."],
        },
        silhouette: {
          triangle: [1, "넓은 골반에서 일자로 떨어져 하체 균형을 맞춥니다."],
          invertedTriangle: [1, "하체에 볼륨을 더해 넓은 어깨와 균형을 맞춥니다."],
        },
        ratio: { legShort: [-0.5, "하이웨이스트·바닥에 닿는 기장으로 다리를 길게 연출하세요."] },
        images: { casual: 1, comfy: 1, chic: 0.5 },
      },
      {
        id: "straight",
        name: "스트레이트 팬츠",
        bone: {
          STRAIGHT: [2, "일자로 떨어지는 핏이 다리를 길고 곧게 보이게 하고 하체를 깔끔하게 정리합니다."],
          NATURAL: [1, "여유 있는 스트레이트가 자연스럽습니다."],
          WAVE: [0.5, "슬림 스트레이트를 하이웨이스트로 입으세요."],
        },
        images: { neat: 1, chic: 1 },
      },
      {
        id: "bootcut",
        name: "부츠컷",
        bone: {
          WAVE: [1, "무릎 아래로 퍼지는 라인이 하체 볼륨과 균형을 맞추고 다리를 길어 보이게 합니다."],
          STRAIGHT: [0.5, "세미 부츠컷이라면 무난합니다."],
          NATURAL: [0, "무난합니다."],
        },
        silhouette: { triangle: [1, "밑단 볼륨이 골반 폭과 균형을 맞춥니다."], hourglass: [0.5, "곡선적인 하체 라인과 어울립니다."] },
        ratio: { legShort: [0.5, "굽 있는 신발과 함께라면 다리가 길어 보입니다."] },
        images: { feminine: 0.5, casual: 0.5 },
      },
    ],
  },
  {
    id: "skirt",
    group: "bottom",
    title: "스커트 라인",
    options: [
      {
        id: "aline",
        name: "A라인 스커트",
        bone: {
          WAVE: [2, "살랑이는 A라인이 흐르는 실루엣으로 여성스러운 분위기를 더합니다."],
          NATURAL: [0.5, "롱 기장 플레어라면 자연스럽습니다."],
          STRAIGHT: [0, "볼륨이 적은 A라인이 무난합니다."],
        },
        silhouette: {
          triangle: [1, "넓은 골반을 자연스럽게 덮습니다."],
          invertedTriangle: [1.5, "하체에 볼륨을 더해 넓은 어깨와 균형을 맞춥니다."],
          rectangle: [1, "직선적인 몸통에 곡선을 더해 줍니다."],
        },
        images: { feminine: 1, elegant: 0.5 },
      },
      {
        id: "hline",
        name: "H라인 스커트",
        bone: {
          STRAIGHT: [2, "일자 라인이 탄탄한 하체를 깔끔하게 보여 줍니다."],
          NATURAL: [1, "미디~롱 기장의 H라인이 직선 실루엣과 어울립니다."],
          WAVE: [0, "하이웨이스트 + 짧은 상의로 입으면 무난합니다."],
        },
        silhouette: { hourglass: [0.5, "허리 굴곡을 드러냅니다."], triangle: [-0.5, "골반 폭이 그대로 드러납니다."] },
        images: { neat: 1, chic: 1 },
      },
      {
        id: "mermaid",
        name: "머메이드 스커트",
        bone: {
          WAVE: [1, "곡선적인 하체 라인을 살립니다."],
          STRAIGHT: [0.5, "볼륨이 적은 디자인이라면 무난합니다."],
          NATURAL: [-1, "몸에 붙다가 퍼지는 라인이 골격감과 어색할 수 있습니다."],
        },
        silhouette: { hourglass: [1, "모래시계형의 곡선을 가장 잘 드러냅니다."], triangle: [-1, "골반·허벅지가 강조됩니다."] },
        images: { elegant: 1, feminine: 0.5 },
      },
    ],
  },
  {
    id: "bottomLength",
    group: "bottom",
    title: "하의(스커트) 기장",
    options: [
      {
        id: "mini",
        name: "미니 (무릎 위)",
        bone: {
          WAVE: [1.5, "다리를 드러내 무게중심을 위로 올립니다."],
          STRAIGHT: [0, "무난합니다."],
          NATURAL: [-1, "짧은 기장은 골격의 프레임을 강조합니다."],
        },
        ratio: { legShort: [0.5, "다리 노출로 다리가 길어 보입니다."] },
        images: { casual: 0.5, feminine: 0.5 },
      },
      {
        id: "knee",
        name: "무릎 기장",
        bone: {
          STRAIGHT: [1.5, "무릎 기장이 탄탄한 다리 라인을 깔끔하게 보여 줍니다."],
          WAVE: [1, "무릎 바로 위~무릎 기장이 균형이 좋습니다."],
          NATURAL: [0, "무난합니다."],
        },
        images: { neat: 1 },
      },
      {
        id: "midi",
        name: "미디 (종아리 중간)",
        bone: {
          NATURAL: [1, "길게 떨어지는 기장이 직선 실루엣을 만듭니다."],
          STRAIGHT: [1, "H라인 미디가 단정합니다."],
          WAVE: [-0.5, "종아리 굵은 부분에서 끊기면 무거워 보일 수 있습니다."],
        },
        ratio: { headLow: [-0.5, "등신이 낮은 편이면 굽 있는 신발과 함께하세요."] },
        images: { elegant: 1 },
      },
      {
        id: "maxi",
        name: "롱·맥시",
        bone: {
          NATURAL: [2, "긴 직선 실루엣이 골격감을 살리고 세련된 분위기를 만듭니다."],
          STRAIGHT: [0, "무난합니다."],
          WAVE: [-1, "무게중심이 아래로 내려가 다리가 짧아 보일 수 있습니다."],
        },
        ratio: { legLong: [0.5, "다리가 긴 편이라 롱 기장이 잘 받습니다."], headLow: [-1, "등신이 낮은 편이라 몸이 짧아 보일 수 있습니다."] },
        images: { comfy: 0.5, elegant: 0.5 },
      },
    ],
  },
  // ── 원피스 ──
  {
    id: "dressWaist",
    group: "dress",
    title: "원피스 허리선",
    options: [
      {
        id: "empire",
        name: "하이(엠파이어) 웨이스트",
        bone: {
          WAVE: [2, "허리선을 높여 하체 무게중심을 위로 올리고 다리를 길어 보이게 합니다."],
          STRAIGHT: [-0.5, "가슴 바로 아래 절개는 상체 볼륨을 강조할 수 있습니다."],
          NATURAL: [0, "무난합니다."],
        },
        ratio: { legShort: [1, "다리가 짧은 편이라 허리선을 올려 비율을 보완합니다."], waistLow: [1, "허리 위치가 낮은 편이라 시각적으로 끌어올립니다."] },
        images: { feminine: 1 },
      },
      {
        id: "natural",
        name: "제자리 허리선",
        bone: {
          STRAIGHT: [2, "실제 허리 위치의 절개가 상체를 깔끔하게 정리합니다."],
          WAVE: [1, "벨트로 허리를 잡아 주면 잘록한 허리가 살아납니다."],
          NATURAL: [0, "벨트 없이 여유 있게 입으면 무난합니다."],
        },
        silhouette: { hourglass: [1, "허리 굴곡을 드러냅니다."] },
        images: { neat: 0.5, elegant: 0.5 },
      },
      {
        id: "noWaist",
        name: "허리선 없음 (시프트·셔츠 원피스)",
        bone: {
          NATURAL: [2, "허리선 없이 떨어지는 실루엣이 골격의 여유를 살립니다."],
          STRAIGHT: [1, "H라인 시프트 원피스가 단정합니다."],
          WAVE: [-1.5, "허리선이 사라져 몸이 일자로 길어 보이고 무게중심이 내려갑니다."],
        },
        silhouette: { rectangle: [0.5, "직선적인 몸통과 어울립니다."] },
        images: { comfy: 1, casual: 0.5 },
      },
      {
        id: "drop",
        name: "드롭 웨이스트",
        bone: {
          NATURAL: [0.5, "여유 있는 소재라면 연출 가능합니다."],
          STRAIGHT: [-0.5, "상체가 길어 보일 수 있습니다."],
          WAVE: [-2, "허리선이 골반으로 내려가 상체가 길고 다리가 짧아 보입니다."],
        },
        ratio: { legShort: [-1, "다리가 짧은 편이라 비율이 더 아래로 늘어집니다."] },
      },
    ],
  },
  {
    id: "dressSilhouette",
    group: "dress",
    title: "원피스 실루엣",
    options: [
      {
        id: "fitFlare",
        name: "핏앤플레어",
        bone: {
          WAVE: [2, "상체는 맞고 아래로 퍼지는 라인이 곡선 실루엣을 살립니다."],
          STRAIGHT: [0, "볼륨이 적은 플레어라면 무난합니다."],
          NATURAL: [-0.5, "몸에 붙는 상체가 골격감을 드러낼 수 있습니다."],
        },
        silhouette: { rectangle: [1, "허리 굴곡을 만들어 줍니다."], invertedTriangle: [1, "하체 볼륨으로 어깨와 균형을 맞춥니다."] },
        images: { feminine: 1 },
      },
      {
        id: "iline",
        name: "I·H라인",
        bone: {
          STRAIGHT: [2, "군더더기 없는 일자 실루엣이 탄탄한 몸을 깔끔하게 보여 줍니다."],
          NATURAL: [1, "롱 기장 I라인이 직선 실루엣과 어울립니다."],
          WAVE: [-0.5, "허리선 없는 일자는 무게중심이 내려가 보입니다."],
        },
        images: { chic: 1, neat: 1 },
      },
      {
        id: "wrap",
        name: "랩 원피스",
        bone: {
          STRAIGHT: [1.5, "V넥과 허리 묶음이 상체를 슬림하게 정리합니다."],
          WAVE: [1.5, "허리를 묶어 잘록한 허리를 강조합니다."],
          NATURAL: [0.5, "두께감 있는 소재라면 무난합니다."],
        },
        silhouette: { hourglass: [1, "곡선 실루엣을 강조합니다."] },
        images: { elegant: 1 },
      },
      {
        id: "loose",
        name: "루즈 일자 (셔츠 원피스)",
        bone: {
          NATURAL: [2, "여유 있게 떨어지는 실루엣이 골격감을 자연스럽게 감쌉니다."],
          STRAIGHT: [-0.5, "상체 볼륨에 품이 더해져 부해 보일 수 있습니다."],
          WAVE: [-1.5, "몸이 옷에 묻혀 왜소하고 무거워 보입니다."],
        },
        images: { comfy: 1, casual: 1 },
      },
    ],
  },
  // ── 아우터 ──
  {
    id: "outerLength",
    group: "outer",
    title: "재킷·코트 기장",
    options: [
      {
        id: "cropJacket",
        name: "크롭 재킷",
        bone: {
          WAVE: [2, "짧은 기장이 허리선을 살리고 하체를 길어 보이게 합니다."],
          STRAIGHT: [0, "허리선에 맞는 짧은 재킷은 무난합니다."],
          NATURAL: [-1, "짧은 기장이 골격 프레임을 강조합니다."],
        },
        ratio: { legShort: [1, "다리가 짧은 편이라 상체를 짧게 끊어 비율을 보완합니다."] },
        images: { feminine: 0.5, casual: 0.5 },
      },
      {
        id: "hipJacket",
        name: "힙 기장 재킷",
        bone: {
          STRAIGHT: [2, "어깨선이 맞는 힙 기장 재킷이 상체를 단정하게 정리합니다."],
          NATURAL: [0.5, "여유 있는 실루엣이라면 무난합니다."],
          WAVE: [-0.5, "허리선이 가려져 상체가 길어 보일 수 있습니다(허리 벨트로 보완)."],
        },
        images: { neat: 1, chic: 0.5 },
      },
      {
        id: "kneeCoat",
        name: "무릎 기장 코트",
        bone: {
          STRAIGHT: [1, "힘 있는 소재의 무릎 기장이 깔끔합니다."],
          NATURAL: [1, "무난합니다."],
          WAVE: [0, "허리를 묶는 디자인을 고르세요."],
        },
        images: { elegant: 0.5 },
      },
      {
        id: "longCoat",
        name: "롱 코트 (종아리 아래)",
        bone: {
          NATURAL: [2, "긴 직선 실루엣이 골격감을 살리고 세련된 분위기를 줍니다."],
          STRAIGHT: [0.5, "얇고 힘 있는 소재라면 무난합니다."],
          WAVE: [-1, "무게중심이 아래로 내려가 몸이 묻혀 보입니다."],
        },
        ratio: { headLow: [-1, "등신이 낮은 편이라 몸이 짧아 보일 수 있습니다."], legLong: [0.5, "다리가 긴 편이라 롱 기장도 잘 받습니다."] },
        images: { chic: 1, elegant: 0.5 },
      },
    ],
  },
  {
    id: "fabric",
    group: "outer",
    title: "소재의 두께·형태감",
    options: [
      {
        id: "firm",
        name: "힘 있고 매끈한 소재",
        bone: {
          STRAIGHT: [2, "탄탄한 니트·울 개버딘처럼 매끈한 소재가 상체 라인을 정돈해 깔끔한 실루엣을 완성합니다."],
          WAVE: [-0.5, "빳빳한 소재가 여리한 몸을 압도할 수 있습니다."],
          NATURAL: [0.5, "무난합니다."],
        },
        images: { neat: 1, chic: 1 },
      },
      {
        id: "soft",
        name: "얇고 부드러운 소재",
        bone: {
          WAVE: [2, "쉬폰·저지처럼 흐르는 소재가 곡선 실루엣을 살립니다."],
          STRAIGHT: [-0.5, "몸에 감기는 얇은 소재는 상체 볼륨을 드러냅니다."],
          NATURAL: [-0.5, "너무 하늘거리는 소재는 골격과 대비됩니다."],
        },
        images: { feminine: 1, elegant: 0.5 },
      },
      {
        id: "textured",
        name: "두께·질감 있는 소재",
        bone: {
          NATURAL: [2, "린넨·코듀로이·로우게이지처럼 질감 있는 소재가 골격감과 어울립니다."],
          STRAIGHT: [-1, "두꺼운 레이어드는 상체를 넓어 보이게 하고 실루엣이 둔해집니다."],
          WAVE: [-1.5, "두꺼운 소재에 몸이 묻혀 무거워 보입니다."],
        },
        images: { casual: 1, comfy: 1 },
      },
    ],
  },
];

export function recommendOutfits(p: StyleProfile): OutfitCategoryRec[] {
  const ratioFlags = ratioConditions(p);
  const sil = p.silhouette.value === "mixed" ? silhouetteParts(p.silhouette) : p.silhouette.value ? [p.silhouette.value] : [];

  return OUTFIT_CATEGORIES.map((cat) => {
    const options: OutfitOptionRec[] = cat.options.map((o) => {
      const reasons: RecReason[] = [];
      if (p.bone.primary) {
        const r = o.bone[p.bone.primary];
        if (r) reasons.push({ category: "bone", delta: r[0], text: `[${BONE_LABEL[p.bone.primary]}] ${r[1]}` });
        if (p.bone.secondary) {
          const r2 = o.bone[p.bone.secondary];
          const w = p.bone.kind === "MIXED" ? 0.6 : 0.3;
          if (r2) reasons.push({ category: "bone", delta: round(r2[0] * w), text: `[${BONE_LABEL[p.bone.secondary]} 특징] ${r2[1]}` });
        }
      }
      for (const s of sil) {
        const r = o.silhouette?.[s];
        if (r) reasons.push({ category: "silhouette", delta: sil.length > 1 ? round(r[0] * 0.6) : r[0], text: `[${SILHOUETTE_LABEL[s]}] ${r[1]}` });
      }
      for (const f of ratioFlags) {
        const r = o.ratio?.[f.key];
        if (r) reasons.push({ category: "ratio", delta: round(r[0] * (f.low ? 0.5 : 1)), text: `[${f.label}] ${r[1]}${f.low ? " (측정 신뢰도 낮음)" : ""}` });
      }
      for (const img of p.images) {
        const v = o.images?.[img];
        if (v) reasons.push({ category: "image", delta: v, text: `원하는 이미지 '${STYLE_IMAGE_LABEL[img]}'${v > 0 ? "에 잘 맞습니다" : "와는 결이 다릅니다"}.` });
      }
      const score = round(reasons.reduce((s, r) => s + r.delta, 0));
      reasons.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      const main = reasons.find((r) => r.category !== "image");
      return {
        id: o.id,
        name: o.name,
        score,
        level: levelOf(score),
        reasons,
        summary: main ? main.text.replace(/^\[[^\]]+\]\s*/, "") : "분석 결과로는 특별히 유리하거나 불리한 근거가 없습니다.",
      };
    });
    options.sort((a, b) => b.score - a.score);
    return { id: cat.id, group: cat.group, title: cat.title, options };
  });
}

/** 측정 비율에서 성립하는 조건 목록 (측정 불가 항목은 조건을 만들지 않음) */
export function ratioConditions(p: StyleProfile): { key: RatioKey; label: string; low: boolean }[] {
  const out: { key: RatioKey; label: string; low: boolean }[] = [];
  const R = RATIO_RULES;
  const { legToTorso, waistHeightPct, headToBody } = p.ratios;
  if (legToTorso.value !== null) {
    if (legToTorso.value < R.legShort) out.push({ key: "legShort", label: `다리÷몸통 ${legToTorso.value.toFixed(2)}`, low: legToTorso.low });
    else if (legToTorso.value > R.legLong) out.push({ key: "legLong", label: `다리÷몸통 ${legToTorso.value.toFixed(2)}`, low: legToTorso.low });
  }
  if (waistHeightPct.value !== null) {
    if (waistHeightPct.value < R.waistLow) out.push({ key: "waistLow", label: `허리 높이 ${waistHeightPct.value.toFixed(0)}%`, low: waistHeightPct.low });
    else if (waistHeightPct.value > R.waistHigh) out.push({ key: "waistHigh", label: `허리 높이 ${waistHeightPct.value.toFixed(0)}%`, low: waistHeightPct.low });
  }
  if (headToBody.value !== null) {
    if (headToBody.value < R.headLow) out.push({ key: "headLow", label: `${headToBody.value.toFixed(1)}등신`, low: headToBody.low });
    else if (headToBody.value > R.headHigh) out.push({ key: "headHigh", label: `${headToBody.value.toFixed(1)}등신`, low: headToBody.low });
  }
  return out;
}

const round = (v: number) => Math.round(v * 10) / 10;
