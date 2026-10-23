"use client";
import { useId } from "react";
import type { NecklineId } from "@/lib/style/types";
import { NECKLINE_SHAPES } from "@/lib/style/necklineShapes";

/** 파스텔 니트 톤 – 넥라인별 색을 달리해 목록에서 구분되게 */
const TONES: Record<NecklineId, [string, string, string]> = {
  v: ["#f6cfd0", "#ecb8ba", "#c98478"],
  u: ["#f4e6cf", "#e8d4b3", "#b8946a"],
  round: ["#d9e8d3", "#c4d9bc", "#7f9c72"],
  square: ["#d6e1f3", "#bfd0ea", "#7f9fd1"],
  boat: ["#e1d9f0", "#cfc3e6", "#8f7fb8"],
  turtle: ["#ece3d8", "#ddd0c0", "#a08a72"],
  mock: ["#e9dfe6", "#dacbd5", "#9c7f92"],
  collar: ["#faf7f2", "#ece6dc", "#a8998a"],
  sweetheart: ["#f8d5dc", "#efbcc7", "#c97b8c"],
  offShoulder: ["#f3dccb", "#e8c6ae", "#b7866a"],
};

export function NecklineIllustration({ id, className, muted = false }: { id: NecklineId; className?: string; muted?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const s = NECKLINE_SHAPES[id];
  const [fill, rib, stroke] = TONES[id];
  return (
    <svg viewBox="0 0 120 100" className={className} role="img" aria-label={`${id} 넥라인 일러스트`} style={muted ? { filter: "grayscale(.7)", opacity: 0.6 } : undefined}>
      <defs>
        <pattern id={`rib-${uid}`} width="3.2" height="10" patternUnits="userSpaceOnUse">
          <rect width="3.2" height="10" fill={fill} />
          <line x1="1.6" y1="0" x2="1.6" y2="10" stroke={rib} strokeWidth="0.7" />
        </pattern>
        <linearGradient id={`sk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdeee7" />
          <stop offset="1" stopColor="#f8dfd5" />
        </linearGradient>
      </defs>
      <path d={s.skin} fill={`url(#sk-${uid})`} stroke="#ddae9e" strokeWidth="0.8" />
      {/* 쇄골 힌트 */}
      <path d="M38,40 Q48,43 56,41 M82,40 Q72,43 64,41" stroke="#e6bcae" strokeWidth="0.7" fill="none" />
      <path d={s.garment} fill={`url(#rib-${uid})`} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
      {s.details.map((d, i) => (
        <path key={i} d={d} fill={d.trim().endsWith("Z") ? "#ffffff" : "none"} stroke={stroke} strokeWidth="0.9" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
