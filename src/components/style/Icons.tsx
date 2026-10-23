"use client";
import type { FaceShape, SilhouetteType } from "@/lib/style/types";

const STROKE = "currentColor";

/** 얼굴형 윤곽 아이콘 (점선) */
export function FaceShapeIcon({ shape, className }: { shape: FaceShape; className?: string }) {
  const d: Record<FaceShape, string> = {
    round: "M30,8 C46,8 52,20 52,32 C52,46 42,56 30,56 C18,56 8,46 8,32 C8,20 14,8 30,8 Z",
    oval: "M30,5 C44,5 50,17 50,29 C50,45 40,59 30,59 C20,59 10,45 10,29 C10,17 16,5 30,5 Z",
    long: "M30,3 C42,3 47,13 47,26 L47,40 C47,52 38,61 30,61 C22,61 13,52 13,40 L13,26 C13,13 18,3 30,3 Z",
    square: "M12,9 L48,9 L49,44 Q48,56 36,57 L24,57 Q12,56 11,44 Z",
    heart: "M8,14 Q8,6 18,6 Q26,6 30,12 Q34,6 42,6 Q52,6 52,14 Q52,30 40,44 L30,58 L20,44 Q8,30 8,14 Z",
    diamond: "M30,4 L50,30 L30,60 L10,30 Z",
  };
  return (
    <svg viewBox="0 0 60 64" className={className} aria-hidden>
      <path d={d[shape]} fill="none" stroke={STROKE} strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
    </svg>
  );
}

/** 실루엣 아이콘 – 어깨·허리·골반 폭 비교 */
export function SilhouetteIcon({ type, className }: { type: SilhouetteType; className?: string }) {
  const w: Record<Exclude<SilhouetteType, "mixed">, [number, number, number]> = {
    hourglass: [19, 11, 19],
    rectangle: [17, 15, 17],
    triangle: [13, 12, 21],
    invertedTriangle: [22, 14, 13],
  };
  const [s, m, h] = type === "mixed" ? [18, 13, 18] : w[type];
  const c = 30;
  const d = `M${c - s},8 C${c - s + 1},18 ${c - m},20 ${c - m},28 C${c - m},36 ${c - h},38 ${c - h},50 L${c + h},50 C${c + h},38 ${c + m},36 ${c + m},28 C${c + m},20 ${c + s - 1},18 ${c + s},8 Z`;
  return (
    <svg viewBox="0 0 60 58" className={className} aria-hidden>
      <path d={d} fill="currentColor" fillOpacity={0.12} stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" strokeDasharray={type === "mixed" ? "3 2" : undefined} />
      <line x1={c - s - 4} x2={c + s + 4} y1={8} y2={8} stroke={STROKE} strokeWidth="0.8" opacity={0.5} />
      <line x1={c - m - 4} x2={c + m + 4} y1={28} y2={28} stroke={STROKE} strokeWidth="0.8" opacity={0.5} />
      <line x1={c - h - 4} x2={c + h + 4} y1={46} y2={46} stroke={STROKE} strokeWidth="0.8" opacity={0.5} />
    </svg>
  );
}

/** 의상 옵션 라인 아이콘 (카테고리:옵션) */
export function GarmentIcon({ id, className }: { id: string; className?: string }) {
  const p = GARMENT[id];
  if (!p) return null;
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      {/* 기준 인체 실루엣 */}
      <path d={FIG} fill="none" stroke={STROKE} strokeWidth="0.8" opacity={0.25} />
      {p.map((d, i) => (
        <path key={i} d={d} fill="currentColor" fillOpacity={0.16} stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

// 60x60 안의 기준 인체: 어깨 y10, 허리 y22, 골반 y28, 가랑이 y31, 무릎 y44, 발 y58
const FIG = "M24,10 L36,10 L34,22 L37,28 L34,58 L31,58 L30,32 L29,58 L26,58 L23,28 L26,22 Z";
const top = (len: number, half = 8, waist = 6) => `M${30 - half},9 L${30 + half},9 L${30 + waist + 1},${len} L${30 - waist - 1},${len} Z`;
const pants = (hem: number, low = 0) =>
  `M23,${22 + low} L37,${22 + low} L${38 + hem},57 L${31.5},57 L30,33 L${28.5},57 L${22 - hem},57 Z`;

const GARMENT: Record<string, string[]> = {
  "topLength:crop": [top(20)],
  "topLength:regular": [top(27, 8, 7)],
  "topLength:long": [top(35, 8, 8.5)],
  "topFit:slim": [top(27, 6.5, 5)],
  "topFit:regularFit": [top(27, 8, 7)],
  "topFit:over": [`M17,10 L43,10 L42,30 L18,30 Z`],
  "rise:high": [pants(0, -3)],
  "rise:mid": [pants(0, 1)],
  "rise:low": [pants(0, 5)],
  "pants:wide": [pants(4)],
  "pants:straight": [pants(1)],
  "pants:bootcut": [`M23,22 L37,22 L36,44 L40,57 L31.5,57 L30,33 L28.5,57 L20,57 L24,44 Z`],
  "skirt:aline": ["M24,22 L36,22 L43,45 L17,45 Z"],
  "skirt:hline": ["M23,22 L37,22 L37,45 L23,45 Z"],
  "skirt:mermaid": ["M23,22 L37,22 L36,40 L41,50 L19,50 L24,40 Z"],
  "bottomLength:mini": ["M24,22 L36,22 L39,36 L21,36 Z"],
  "bottomLength:knee": ["M24,22 L36,22 L40,45 L20,45 Z"],
  "bottomLength:midi": ["M24,22 L36,22 L41,51 L19,51 Z"],
  "bottomLength:maxi": ["M24,22 L36,22 L42,57 L18,57 Z"],
  "dressWaist:empire": ["M24,9 L36,9 L35,17 L41,50 L19,50 L25,17 Z", "M25,17 L35,17"],
  "dressWaist:natural": ["M24,9 L36,9 L34,22 L41,50 L19,50 L26,22 Z", "M26,22 L34,22"],
  "dressWaist:noWaist": ["M23,9 L37,9 L39,50 L21,50 Z"],
  "dressWaist:drop": ["M24,9 L36,9 L37,30 L41,50 L19,50 L23,30 Z", "M23,30 L37,30"],
  "outerLength:cropJacket": ["M20,9 L40,9 L40,22 L20,22 Z"],
  "outerLength:hipJacket": ["M20,9 L40,9 L40,31 L20,31 Z"],
  "outerLength:kneeCoat": ["M20,9 L40,9 L42,45 L18,45 Z"],
  "outerLength:longCoat": ["M20,9 L40,9 L43,54 L17,54 Z"],
};
