import type { NecklineId } from "./types";

/**
 * 넥라인 일러스트 도형 (viewBox 0 0 120 100) – 목·어깨 피부 위에 옷 몸판을 얹는 방식.
 * garment: 옷 몸판 path, details: 칼라·접힘·밴드 등 보조선
 */
export interface NecklineShape {
  garment: string;
  details: string[];
  /** 피부(목·어깨) 노출 범위 – 오프숄더 등은 어깨까지 */
  skin: string;
}

const SKIN =
  "M50,0 L50,26 Q49,33 30,37 Q14,40 10,48 Q7,54 7,64 L7,100 L113,100 L113,64 Q113,54 110,48 Q106,40 90,37 Q71,33 70,26 L70,0 Z";

// 어깨~몸판 바깥 윤곽 (오른쪽 어깨 끝 → 아래 → 왼쪽 어깨 끝)
const BODY_RIGHT_TO_LEFT = "Q106,40 110,48 Q113,54 113,64 L113,100 L7,100 L7,64 Q7,54 10,48 Q14,40";

function shoulderTo(neckRight: string, top: string, neckLeft: string, rightStart = "92,37.5", leftEnd = "28,37.5") {
  // 오른쪽 목 옆 → 어깨 → 몸판 → 왼쪽 어깨 → 왼쪽 목 옆 → 넥라인 → 닫기
  return `M${neckRight} Q80,35 ${rightStart} ${BODY_RIGHT_TO_LEFT} ${leftEnd} Q40,35 ${neckLeft} ${top} Z`;
}

export const NECKLINE_SHAPES: Record<NecklineId, NecklineShape> = {
  round: {
    skin: SKIN,
    garment: shoulderTo("72,31", "", "48,31").replace(" Z", " C49,44 71,44 72,31 Z"),
    details: ["M48.5,31 C49.5,41.5 70.5,41.5 71.5,31"],
  },
  v: {
    skin: SKIN,
    garment: shoulderTo("73,31", "", "47,31").replace(" Z", " L60,64 L73,31 Z"),
    details: ["M48,31.5 L60,61 L72,31.5"],
  },
  u: {
    skin: SKIN,
    garment: shoulderTo("74,32", "", "46,32").replace(" Z", " C46,66 74,66 74,32 Z"),
    details: ["M47,32.5 C47.5,62 72.5,62 73,32.5"],
  },
  square: {
    skin: SKIN,
    garment: shoulderTo("76,33", "", "44,33").replace(" Z", " L44,56 L76,56 L76,33 Z"),
    details: ["M45,33.5 L45,55 L75,55 L75,33.5"],
  },
  boat: {
    skin: SKIN,
    garment: "M98,40 Q106,42 110,48 Q113,54 113,64 L113,100 L7,100 L7,64 Q7,54 10,48 Q14,42 22,40 Q60,50 98,40 Z",
    details: ["M23,41.5 Q60,51 97,41.5"],
  },
  turtle: {
    skin: SKIN,
    garment: "M72,30 Q80,35 92,37.5 " + BODY_RIGHT_TO_LEFT + " 28,37.5 Q40,35 48,30 L47,4 Q60,1 73,4 Z",
    details: ["M47.5,12 Q60,9 72.5,12", "M47.5,20 Q60,17 72.5,20", "M48,30 Q60,34 72,30"],
  },
  mock: {
    skin: SKIN,
    garment: "M72,30 Q80,35 92,37.5 " + BODY_RIGHT_TO_LEFT + " 28,37.5 Q40,35 48,30 L48,15 Q60,12.5 72,15 Z",
    details: ["M48,30 Q60,34 72,30"],
  },
  collar: {
    skin: SKIN,
    garment: shoulderTo("72,30", "", "48,30").replace(" Z", " L60,56 L72,30 Z"),
    details: [
      // 칼라 날개
      "M72,29 L80,33 L71,48 L62,52 Z",
      "M48,29 L40,33 L49,48 L58,52 Z",
      // 단추선
      "M60,56 L60,100",
    ],
  },
  sweetheart: {
    skin: SKIN,
    garment: "M110,58 L113,64 L113,100 L7,100 L7,64 L10,58 C22,47 50,46 60,60 C70,46 98,47 110,58 Z",
    details: ["M33,51 L42,30", "M87,51 L78,30", "M11,59 C23,48.5 50,47.5 60,61 C70,47.5 97,48.5 109,59"],
  },
  offShoulder: {
    skin: SKIN,
    garment: "M2,56 Q60,70 118,56 L118,100 L2,100 Z",
    details: ["M3,57.5 Q60,71.5 117,57.5", "M3,62 Q60,76 117,62"],
  },
};
