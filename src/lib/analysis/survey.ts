import type { BoneType } from "../style/types";

export interface SurveyOption {
  value: string;
  label: string;
  type: BoneType | null; // null = 모르겠음
}

export interface SurveyQuestion {
  id: string;
  short: string;
  question: string;
  hint: string;
  options: SurveyOption[];
}

export type SurveyAnswers = Record<string, string | undefined>;

const unknown: SurveyOption = { value: "unknown", label: "잘 모르겠어요", type: null };

/**
 * 사진으로 측정할 수 없는 항목(관절 크기, 살·근육 질감, 골격 깊이) 보완 설문.
 * 거울 앞에서 직접 만져 보며 답하도록 안내합니다.
 */
export const SURVEY: SurveyQuestion[] = [
  {
    id: "wrist",
    short: "손목뼈",
    question: "손목 바깥쪽 둥근 뼈는 어떤가요?",
    hint: "손등을 위로 하고 새끼손가락 쪽 손목뼈를 보세요.",
    options: [
      { value: "s", label: "작고 살에 묻혀 잘 안 보여요", type: "STRAIGHT" },
      { value: "w", label: "작고 납작하지만 보이긴 해요", type: "WAVE" },
      { value: "n", label: "크고 도드라져요", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "collarbone",
    short: "쇄골",
    question: "쇄골은 어떻게 보이나요?",
    hint: "힘을 빼고 정면 거울로 확인하세요.",
    options: [
      { value: "s", label: "거의 안 보이거나 짧게 보여요", type: "STRAIGHT" },
      { value: "w", label: "가늘게 보여요", type: "WAVE" },
      { value: "n", label: "굵고 뚜렷하게 보여요", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "texture",
    short: "살·근육 질감",
    question: "팔뚝·허벅지를 잡았을 때 느낌은?",
    hint: "체중과 무관하게 '질감'을 기준으로 답해 주세요.",
    options: [
      { value: "s", label: "탄력 있고 단단해요", type: "STRAIGHT" },
      { value: "w", label: "부드럽고 말랑해요", type: "WAVE" },
      { value: "n", label: "살보다 뼈·근육의 단단함이 먼저 느껴져요", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "knee",
    short: "무릎",
    question: "무릎뼈는 어떤가요?",
    hint: "다리를 펴고 서서 무릎을 보세요.",
    options: [
      { value: "s", label: "작고 둥글며 매끈해요", type: "STRAIGHT" },
      { value: "w", label: "작고, 무릎 위에 살이 부드럽게 있어요", type: "WAVE" },
      { value: "n", label: "크고 뼈 윤곽이 뚜렷해요", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "weightGain",
    short: "살이 붙는 곳",
    question: "살이 찔 때 먼저 티 나는 곳은?",
    hint: "",
    options: [
      { value: "s", label: "가슴·팔·배 등 상체", type: "STRAIGHT" },
      { value: "w", label: "엉덩이·허벅지 등 하체", type: "WAVE" },
      { value: "n", label: "전체적으로 고르게, 체형 변화가 적어요", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "hand",
    short: "손",
    question: "손의 모양은?",
    hint: "",
    options: [
      { value: "s", label: "손바닥이 두툼하고 손가락이 짧은 편", type: "STRAIGHT" },
      { value: "w", label: "얇고 작으며 손가락이 가는 편", type: "WAVE" },
      { value: "n", label: "크고 마디가 도드라지는 편", type: "NATURAL" },
      unknown,
    ],
  },
  {
    id: "compliment",
    short: "잘 어울렸던 옷",
    question: "입었을 때 '잘 어울린다'는 말을 자주 들은 옷은?",
    hint: "",
    options: [
      { value: "s", label: "심플한 셔츠·니트·정장 같은 베이직", type: "STRAIGHT" },
      { value: "w", label: "부드러운 블라우스·플레어 스커트", type: "WAVE" },
      { value: "n", label: "루즈한 셔츠·와이드 팬츠·오버핏", type: "NATURAL" },
      unknown,
    ],
  },
];
