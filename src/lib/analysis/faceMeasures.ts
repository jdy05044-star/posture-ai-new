import type { LandmarkPx } from "../types";
import { FACE } from "./landmarkIndex";

export interface FaceMeasures {
  /** 얼굴 세로(메시 상단~턱끝) ÷ 광대 폭 */
  lengthToWidth: number;
  /** 광대 폭을 1로 둔 이마·턱(하악각)·턱끝 폭 */
  forehead: number;
  jaw: number;
  chin: number;
  /** 하관(코끝~턱끝) ÷ 얼굴 세로 */
  lowerFace: number;
}

/**
 * 얼굴형 분류 입력값.
 * 주의: 메시 상단(10번)은 실제 헤어라인보다 아래일 수 있어 세로 길이가 짧게 잡힐 수 있습니다.
 */
export function computeFaceMeasures(lm: LandmarkPx[] | undefined | null): FaceMeasures | null {
  if (!lm || lm.length < 400) return null;
  const d = (a: number, b: number) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const cheek = d(FACE.leftCheek, FACE.rightCheek);
  const length = d(FACE.top, FACE.chin);
  if (cheek <= 0 || length <= 0) return null;
  return {
    lengthToWidth: length / cheek,
    forehead: d(FACE.foreheadLeft, FACE.foreheadRight) / cheek,
    jaw: d(FACE.jawLeft, FACE.jawRight) / cheek,
    chin: d(FACE.chinLeft, FACE.chinRight) / cheek,
    lowerFace: d(FACE.noseTip, FACE.chin) / length,
  };
}
