"use client";
import { useState } from "react";
import type { NecklineRec, OutfitCategoryRec, OutfitOptionRec, RecLevel, RecReason } from "@/lib/style/types";
import { REC_LEVEL_LABEL } from "@/lib/style/types";
import { NecklineIllustration } from "./NecklineIllustration";
import { GarmentIcon } from "./Icons";

export const LEVEL_STYLE: Record<RecLevel, { c: string; bg: string; stars: number }> = {
  best: { c: "#c96a57", bg: "#fbe3dc", stars: 5 },
  good: { c: "#d0846f", bg: "#fcefe9", stars: 4 },
  ok: { c: "#9a8a7f", bg: "#f4eee9", stars: 3 },
  caution: { c: "#b98a3e", bg: "#fbf1e2", stars: 2 },
  avoid: { c: "#b4574f", bg: "#f7e7e5", stars: 1 },
};

export function LevelBadge({ level }: { level: RecLevel }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: s.c, background: s.bg }}>
      <span aria-hidden className="tracking-[-0.1em]">
        {"★".repeat(s.stars)}
        <span className="opacity-25">{"★".repeat(5 - s.stars)}</span>
      </span>
      {REC_LEVEL_LABEL[level]}
    </span>
  );
}

const CAT_LABEL: Record<RecReason["category"], string> = {
  face: "얼굴형",
  neck: "목",
  shoulder: "어깨",
  bone: "골격",
  silhouette: "실루엣",
  ratio: "비율",
  image: "이미지",
  preference: "취향",
};

export function ReasonList({ reasons }: { reasons: RecReason[] }) {
  return (
    <ul className="space-y-1">
      {reasons.map((r, i) => (
        <li key={i} className="flex gap-2 text-[12.5px] leading-snug">
          <span className={`mt-0.5 w-9 shrink-0 text-right text-[11px] font-semibold tabular ${r.delta > 0 ? "text-ok" : r.delta < 0 ? "text-bad" : "text-mute"}`}>
            {r.delta > 0 ? "+" : ""}
            {r.delta}
          </span>
          <span className="shrink-0 rounded-full bg-shell px-1.5 text-[10px] leading-5 text-mute">{CAT_LABEL[r.category]}</span>
          <span className="flex-1">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function NecklineCard({
  rec,
  pref,
  onPref,
  rank,
}: {
  rec: NecklineRec;
  pref?: "like" | "dislike";
  onPref?: (v: "like" | "dislike" | undefined) => void;
  rank?: number;
}) {
  const [open, setOpen] = useState(false);
  const bad = rec.level === "avoid" || rec.level === "caution";
  return (
    <div className="card print-break overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="relative w-28 shrink-0 rounded-2xl bg-shell p-1.5">
          <NecklineIllustration id={rec.id} className="w-full" muted={bad} />
          {rank !== undefined && (
            <span className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{rank}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <b className="font-hand text-[21px] leading-none">{rec.name}</b>
            <LevelBadge level={rec.level} />
          </div>
          <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug">{rec.reasons.find((r) => r.delta !== 0)?.text ?? "특별한 근거 없이 무난합니다."}</p>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setOpen((o) => !o)} className="text-[12px] text-coral-deep">
              {open ? "접기" : "효과·근거 자세히"}
            </button>
            {onPref && (
              <span className="no-print ml-auto flex gap-1">
                <button
                  aria-label="좋아요"
                  onClick={() => onPref(pref === "like" ? undefined : "like")}
                  className={`rounded-full border px-2 py-0.5 text-[12px] ${pref === "like" ? "border-coral bg-blush" : "border-line"}`}
                >
                  ♡ 좋아요
                </button>
                <button
                  aria-label="안 입어요"
                  onClick={() => onPref(pref === "dislike" ? undefined : "dislike")}
                  className={`rounded-full border px-2 py-0.5 text-[12px] ${pref === "dislike" ? "border-ink bg-ink text-white" : "border-line"}`}
                >
                  안 입어요
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
      {open && (
        <div className="space-y-3 border-t border-line bg-[#fffaf7] px-4 py-3 text-[12.5px] leading-snug">
          <Effect label="얼굴형에 미치는 효과" body={rec.faceEffect} />
          <Effect label="목 길이에 미치는 효과" body={rec.neckEffect} />
          <Effect label="어깨 비율과의 조화" body={rec.shoulderHarmony} />
          <div>
            <p className="mb-1 text-[11px] font-semibold text-mute">점수 근거 (합계 {rec.score})</p>
            <ReasonList reasons={rec.reasons} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-mute">선택 시 주의할 디자인 요소</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {rec.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Effect({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-mute">{label}</p>
      <p>{body}</p>
    </div>
  );
}

const GROUP_LABEL: Record<OutfitCategoryRec["group"], string> = { top: "상의", bottom: "하의", dress: "원피스", outer: "아우터·소재" };

/** 카테고리별 추천 ↔ 비추천 비교 */
export function OutfitSection({ cats, compact = false }: { cats: OutfitCategoryRec[]; compact?: boolean }) {
  const groups = (["top", "bottom", "dress", "outer"] as const).map((g) => ({ g, items: cats.filter((c) => c.group === g) }));
  return (
    <div className="space-y-6">
      {groups.map(({ g, items }) => (
        <div key={g}>
          <h3 className="mb-2">
            <span className="brush-pill bg-blush text-[18px] text-ink">{GROUP_LABEL[g]}</span>
          </h3>
          <div className="space-y-2.5">
            {items.map((c) => (
              <OutfitCategoryCard key={c.id} cat={c} compact={compact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OutfitCategoryCard({ cat, compact }: { cat: OutfitCategoryRec; compact: boolean }) {
  const good = cat.options.filter((o) => o.level === "best" || o.level === "good");
  const bad = cat.options.filter((o) => o.level === "avoid" || o.level === "caution");
  const ok = cat.options.filter((o) => o.level === "ok");
  return (
    <div className="card print-break p-3.5">
      <p className="text-[13px] font-semibold">{cat.title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Column title="✓ 추천" color="#6f9b86" bg="#eef5f0" items={good.length ? good : ok.slice(0, 1)} catId={cat.id} compact={compact} fallback={!good.length} />
        <Column title="✕ 피하기" color="#b4574f" bg="#fbefed" items={bad} catId={cat.id} compact={compact} />
      </div>
      {!compact && ok.length > 0 && good.length > 0 && <p className="mt-2 text-[11.5px] text-mute">무난: {ok.map((o) => o.name).join(", ")}</p>}
    </div>
  );
}

function Column({
  title,
  color,
  bg,
  items,
  catId,
  compact,
  fallback,
}: {
  title: string;
  color: string;
  bg: string;
  items: OutfitOptionRec[];
  catId: string;
  compact: boolean;
  fallback?: boolean;
}) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: bg }}>
      <p className="mb-1.5 text-[12px] font-bold" style={{ color }}>
        {title}
        {fallback && <span className="ml-1 font-normal text-mute">(뚜렷한 추천 없음 · 무난)</span>}
      </p>
      {items.length === 0 ? (
        <p className="text-[11.5px] text-mute">특별히 피할 것 없음</p>
      ) : (
        <ul className="space-y-2">
          {items.map((o) => (
            <OptionItem key={o.id} o={o} catId={catId} color={color} compact={compact} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OptionItem({ o, catId, color, compact }: { o: OutfitOptionRec; catId: string; color: string; compact: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button className="flex w-full items-start gap-1.5 text-left" onClick={() => setOpen((v) => !v)}>
        <span style={{ color }}>
          <GarmentIcon id={`${catId}:${o.id}`} className="h-9 w-9 shrink-0" />
        </span>
        <span className="min-w-0">
          <b className="block text-[13px] leading-tight">{o.name}</b>
          {!compact && <span className="mt-0.5 block text-[11.5px] leading-snug text-mute">{o.summary}</span>}
        </span>
      </button>
      {open && !compact && (
        <div className="mt-1.5 rounded-lg bg-white/80 p-2">
          <ReasonList reasons={o.reasons} />
        </div>
      )}
    </li>
  );
}
