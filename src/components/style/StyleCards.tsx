"use client";
import type { ReactNode } from "react";
import type { BoneResult, BoneType, Classified, Evidence, FaceShape, NeckLength, SilhouetteType } from "@/lib/style/types";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, SILHOUETTE_LABEL } from "@/lib/style/types";
import { BONE_GUIDE, BONE_TONE, FACE_GUIDE, NECK_GUIDE, SILHOUETTE_GUIDE } from "@/lib/style/typeGuide";
import type { FigureModel } from "@/lib/analysis/figureModel";
import { silhouetteParts } from "@/lib/analysis/classify";
import { BodyFigure } from "../analysis/BodyFigure";
import { FaceShapeIcon, SilhouetteIcon } from "./Icons";

export function BrushPill({ children, fg, bg, className = "" }: { children: ReactNode; fg: string; bg: string; className?: string }) {
  return (
    <span className={`brush-pill ${className}`} style={{ color: fg, background: bg }}>
      {children}
    </span>
  );
}

/** 참고 디자인의 '체형 구별법' 구성: 중앙 인체 + 좌우 관찰 포인트 + 하단 ✓/✕ */
export function BoneTypeCard({ bone, figure }: { bone: BoneResult; figure: FigureModel }) {
  const tone = BONE_TONE[bone.kind];
  const main = bone.primary;
  const guide = main ? BONE_GUIDE[main] : null;
  const title =
    bone.kind === "MIXED" && bone.primary && bone.secondary
      ? `${BONE_LABEL[bone.primary]} × ${BONE_LABEL[bone.secondary]} 혼합형`
      : BONE_LABEL[bone.kind];

  return (
    <div className="print-break overflow-hidden rounded-[var(--radius-card)] border" style={{ borderColor: tone.bg, background: `linear-gradient(180deg, ${tone.bg}, #fff 55%)` }}>
      <div className="px-4 pt-5 text-center">
        <p className="eyebrow" style={{ color: tone.fg }}>
          Bone type
        </p>
        <h3 className="mt-1">
          <BrushPill fg={tone.fg} bg="#ffffffcc" className="text-[1.7rem]">
            {title}
          </BrushPill>
        </h3>
        {guide && <p className="mt-1 text-[12.5px] text-mute">{guide.keyword}</p>}
        {bone.manual && <p className="mt-1 text-[11px] text-mute">직접 선택한 유형</p>}
      </div>

      {guide ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-3">
          <div className="space-y-3 text-right">
            {guide.traits.slice(0, 2).map((t) => (
              <Callout key={t.title} title={t.title} body={t.body} color={tone.fg} align="right" />
            ))}
          </div>
          <BodyFigure model={figure} className="h-[250px] w-auto" showLabels={false} accent={tone.fg} highlightWidths={["shoulder", "waist", "hip"]} />
          <div className="space-y-3">
            {guide.traits.slice(2).map((t) => (
              <Callout key={t.title} title={t.title} body={t.body} color={tone.fg} />
            ))}
          </div>
        </div>
      ) : (
        <p className="px-5 py-6 text-center text-[13px] leading-relaxed text-mute">{bone.note}</p>
      )}

      <ScoreBars bone={bone} />

      {guide && (
        <div className="mx-4 mb-4 grid grid-cols-2 divide-x divide-dashed rounded-2xl border border-dashed bg-white/80 py-3 text-center" style={{ borderColor: tone.fg + "55" }}>
          <div className="px-2">
            <span className="mr-1 inline-grid h-6 w-6 place-items-center rounded-full text-sm text-white" style={{ background: tone.fg }}>
              ✓
            </span>
            <span className="font-hand text-[17px]">{guide.good[0].title}</span>
          </div>
          <div className="px-2">
            <span className="mr-1 inline-grid h-6 w-6 place-items-center rounded-full bg-[#f2d6d4] text-sm text-bad">✕</span>
            <span className="font-hand text-[17px]">{guide.bad[0].title}</span>
          </div>
        </div>
      )}
      {bone.note && guide && <p className="px-4 pb-4 text-center text-[11.5px] text-mute">{bone.note}</p>}
    </div>
  );
}

function Callout({ title, body, color, align = "left" }: { title: string; body: string; color: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "pr-1" : "pl-1"}>
      <span className="brush-pill text-[15px]" style={{ background: color + "22", color: "#3a2f2c" }}>
        {title}
      </span>
      <p className="mt-1 text-[11px] leading-snug text-mute">{body}</p>
    </div>
  );
}

function ScoreBars({ bone }: { bone: BoneResult }) {
  const total = Math.max(1, ...Object.values(bone.scores));
  return (
    <div className="mx-4 mb-4 space-y-1.5 rounded-2xl bg-white/80 p-3">
      {(Object.keys(bone.scores) as BoneType[]).map((t) => (
        <div key={t} className="flex items-center gap-2 text-[12px]">
          <span className="w-16 shrink-0 text-mute">{BONE_LABEL[t]}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-shell">
            <div className="h-full rounded-full" style={{ width: `${(bone.scores[t] / total) * 100}%`, background: BONE_TONE[t].fg }} />
          </div>
          <span className="w-8 text-right tabular text-mute">{bone.scores[t].toFixed(1)}</span>
        </div>
      ))}
      <p className="pt-1 text-[10.5px] text-mute">사진 외형 근거 + 보조 설문 점수의 합입니다. 1·2위 차가 작으면 혼합형, 근거가 부족하면 판단 보류로 표시합니다.</p>
    </div>
  );
}

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return <p className="text-[12px] text-mute">표시할 근거가 없습니다.</p>;
  const label = { photo: "사진", survey: "설문", manual: "직접 선택" } as const;
  return (
    <ul className="space-y-1.5">
      {evidence.map((e, i) => {
        const tone = e.target && e.target in BONE_TONE ? BONE_TONE[e.target as BoneType] : null;
        return (
          <li key={i} className="flex gap-2 text-[12.5px] leading-snug">
            <span className="mt-0.5 shrink-0 rounded-full bg-shell px-1.5 text-[10px] text-mute">{label[e.source]}</span>
            <span className="flex-1">{e.text}</span>
            {tone && e.target && (
              <span className="shrink-0 text-[11px] font-semibold tabular" style={{ color: tone.fg }}>
                {BONE_LABEL[e.target as BoneType]} +{e.weight}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ClassCard({ title, value, sub, icon, note, guide, evidence, manual }: {
  title: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  note?: string;
  guide?: string;
  evidence: Evidence[];
  manual: boolean;
}) {
  return (
    <div className="card print-break p-4">
      <div className="flex items-start gap-3">
        {icon && <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-shell text-coral-deep">{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-mute">{title}</p>
          <p className="font-hand text-[22px] leading-tight">{value}</p>
          {sub && <p className="text-[12px] text-coral-deep">{sub}</p>}
          {manual && <p className="text-[11px] text-mute">직접 선택한 값</p>}
        </div>
      </div>
      {guide && <p className="mt-2 text-[12px] leading-snug text-mute">관찰 기준 · {guide}</p>}
      {evidence.length > 0 && (
        <div className="mt-2 border-t border-line pt-2">
          <EvidenceList evidence={evidence} />
        </div>
      )}
      {note && <p className="mt-2 text-[11.5px] leading-snug text-mute">※ {note}</p>}
    </div>
  );
}

export function SilhouetteCard({ c }: { c: Classified<SilhouetteType> }) {
  const parts = c.value === "mixed" ? silhouetteParts(c) : [];
  const v = c.value;
  return (
    <ClassCard
      title="신체 실루엣"
      value={v ? (v === "mixed" ? parts.map((p) => SILHOUETTE_LABEL[p]).join(" + ") : SILHOUETTE_LABEL[v]) : "판단 불가"}
      sub={v === "mixed" ? "혼합형" : undefined}
      icon={v ? <SilhouetteIcon type={v === "mixed" ? parts[0] ?? "mixed" : v} className="h-11 w-11" /> : null}
      guide={v ? SILHOUETTE_GUIDE[v === "mixed" ? parts[0] : v] : undefined}
      evidence={c.evidence}
      note={c.note}
      manual={c.manual}
    />
  );
}

export function FaceCard({ c }: { c: Classified<FaceShape> }) {
  const v = c.value;
  return (
    <ClassCard
      title="얼굴형"
      value={v ? FACE_LABEL[v] : "판단 불가"}
      sub={c.secondary ? `+ ${FACE_LABEL[c.secondary]} 특징` : undefined}
      icon={v ? <FaceShapeIcon shape={v} className="h-11 w-11" /> : null}
      guide={v ? FACE_GUIDE[v] : undefined}
      evidence={c.evidence}
      note={c.note}
      manual={c.manual}
    />
  );
}

export function NeckCard({ c }: { c: Classified<NeckLength> }) {
  const v = c.value;
  return (
    <ClassCard
      title="목 길이"
      value={v ? NECK_LABEL[v] : "판단 불가"}
      sub={c.secondary ? `경계 · ${NECK_LABEL[c.secondary]} 쪽에 가까움` : undefined}
      icon={<span className="font-hand text-xl">{v === "short" ? "짧" : v === "long" ? "길" : v ? "보통" : "?"}</span>}
      guide={v ? NECK_GUIDE[v] : undefined}
      evidence={c.evidence}
      note={c.note}
      manual={c.manual}
    />
  );
}
