"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useStyle } from "@/lib/recommend/useStyle";
import { figureFromKeypoints } from "@/lib/analysis/figureModel";
import { silhouetteParts } from "@/lib/analysis/classify";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, SILHOUETTE_LABEL, STYLE_IMAGE_LABEL } from "@/lib/style/types";
import { BONE_GUIDE, BONE_TONE } from "@/lib/style/typeGuide";
import { BoneTypeCard, BrushPill } from "@/components/style/StyleCards";
import { NecklineIllustration } from "@/components/style/NecklineIllustration";
import { LevelBadge, OutfitSection } from "@/components/style/Recommendations";
import { FaceShapeIcon, SilhouetteIcon } from "@/components/style/Icons";
import { TopBar } from "@/components/ui/primitives";

export default function ReportPage() {
  const S = useStyle();
  const { profile, result, kp, necklines, outfits, images } = S;
  const figure = useMemo(() => figureFromKeypoints(kp), [kp]);

  if (!profile || !result) {
    return (
      <main>
        <TopBar back="/analysis" title="스타일링 리포트" />
        <div className="px-6 py-20 text-center text-mute">
          분석 결과가 없습니다. 사진은 저장되지 않으므로 새로고침했다면 다시 올려 주세요.
          <Link href="/upload" className="mt-6 block text-coral-deep underline">
            사진 올리기
          </Link>
        </div>
      </main>
    );
  }

  const tone = BONE_TONE[profile.bone.kind];
  const guide = profile.bone.primary ? BONE_GUIDE[profile.bone.primary] : null;
  const topNeck = necklines.filter((n) => n.level === "best" || n.level === "good").slice(0, 3);
  const avoidNeck = necklines.filter((n) => n.level === "avoid" || n.level === "caution").slice(-2).reverse();
  const sil = profile.silhouette;
  const silText = sil.value ? (sil.value === "mixed" ? silhouetteParts(sil).map((x) => SILHOUETTE_LABEL[x]).join("+") : SILHOUETTE_LABEL[sil.value]) : "판단 불가";
  const boneText =
    profile.bone.kind === "MIXED" && profile.bone.primary && profile.bone.secondary
      ? `${BONE_LABEL[profile.bone.primary]}×${BONE_LABEL[profile.bone.secondary]}`
      : BONE_LABEL[profile.bone.kind];
  const ratioIds = ["headToBody", "upperLower", "torsoLeg", "shoulderHip", "waistHip", "waistHeight"] as const;
  const ratios = result.metrics.filter((m) => (ratioIds as readonly string[]).includes(m.id));
  const bestPicks = outfits.map((c) => ({ c, o: c.options[0] })).filter(({ o }) => o.level === "best");
  const worstPicks = outfits.map((c) => ({ c, o: c.options[c.options.length - 1] })).filter(({ o }) => o.level === "avoid");
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="pb-16">
      <div className="no-print">
        <TopBar back="/analysis" title="스타일링 리포트" />
      </div>

      <header className="px-5 pb-4 pt-7 text-center" style={{ background: `linear-gradient(180deg, ${tone.bg}, transparent)` }}>
        <p className="eyebrow" style={{ color: tone.fg }}>
          Personal Styling Report
        </p>
        <h1 className="mt-2">
          <BrushPill fg="#3a2f2c" bg="#ffffffb0" className="text-[1.9rem]">
            나의 체형 · 스타일 리포트
          </BrushPill>
        </h1>
        <p className="mt-2 text-[12px] text-mute">
          {today} · 사진 랜드마크 기반 상대 비율 분석
          {images.length > 0 && ` · 원하는 이미지: ${images.map((i) => STYLE_IMAGE_LABEL[i]).join(", ")}`}
        </p>
      </header>

      {/* 요약 타일 */}
      <section className="grid grid-cols-2 gap-2 px-4">
        <Tile label="골격 타입" value={boneText} color={tone.fg} bg={tone.bg} />
        <Tile label="실루엣" value={silText} icon={sil.value ? <SilhouetteIcon type={sil.value === "mixed" ? silhouetteParts(sil)[0] : sil.value} className="h-8 w-8" /> : undefined} />
        <Tile
          label="얼굴형"
          value={profile.face.value ? FACE_LABEL[profile.face.value] + (profile.face.secondary ? `+${FACE_LABEL[profile.face.secondary]}` : "") : "판단 불가"}
          icon={profile.face.value ? <FaceShapeIcon shape={profile.face.value} className="h-8 w-8" /> : undefined}
        />
        <Tile label="목 길이" value={profile.neck.value ? NECK_LABEL[profile.neck.value] : "판단 불가"} />
      </section>

      <section className="px-4 pt-6">
        <BoneTypeCard bone={profile.bone} figure={figure} />
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-2">
          <span className="brush-pill bg-blush text-[19px]">신체 비율</span>
        </h2>
        <div className="card divide-y divide-line">
          {ratios.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
              <span className="text-mute">{m.label}</span>
              <b className={`font-display tabular ${m.status === "unavailable" ? "text-mute" : ""}`}>
                {m.display}
                {m.status === "low" && <span className="ml-1 text-[10px] font-normal text-warn">신뢰도 낮음</span>}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-2">
          <span className="brush-pill bg-blush text-[19px]">어울리는 넥라인</span>
        </h2>
        {topNeck.length ? (
          <div className="grid grid-cols-3 gap-2">
            {topNeck.map((n) => (
              <div key={n.id} className="card print-break p-2 text-center">
                <NecklineIllustration id={n.id} className="w-full" />
                <p className="font-hand text-[17px]">{n.name}</p>
                <LevelBadge level={n.level} />
                <p className="mt-1 line-clamp-3 text-left text-[10.5px] leading-snug text-mute">{n.reasons.find((r) => r.delta > 0)?.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-mute">뚜렷하게 추천되는 넥라인이 없습니다. 얼굴형·목 길이 판단이 필요합니다.</p>
        )}
        {avoidNeck.length > 0 && (
          <div className="mt-2 flex gap-2">
            {avoidNeck.map((n) => (
              <div key={n.id} className="flex flex-1 items-center gap-2 rounded-2xl bg-[#fbefed] p-2">
                <NecklineIllustration id={n.id} className="w-14 shrink-0" muted />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-bad">✕ {n.name}</p>
                  <p className="line-clamp-2 text-[10.5px] leading-snug text-mute">{n.reasons.find((r) => r.delta < 0)?.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-2">
          <span className="brush-pill bg-blush text-[19px]">추천 · 비추천 스타일</span>
        </h2>
        <OutfitSection cats={outfits} compact />
      </section>

      {guide && (
        <section className="px-4 pt-6">
          <div className="grid grid-cols-2 gap-2">
            <GuideList title="이렇게 입어요" items={guide.good} color={tone.fg} bg={tone.bg} mark="✓" />
            <GuideList title="이건 피해요" items={guide.bad} color="#b4574f" bg="#fbefed" mark="✕" />
          </div>
        </section>
      )}

      {/* 한눈에 정리 */}
      <section className="px-4 pt-6">
        <div className="print-break rounded-[var(--radius-card)] border border-dashed p-4" style={{ borderColor: tone.fg + "66", background: tone.bg + "aa" }}>
          <p className="font-hand text-[22px]">💡 한눈에 정리!</p>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
            {guide && <Check>{guide.oneLine}</Check>}
            {topNeck.length > 0 && <Check>넥라인은 {topNeck.map((n) => n.name).join(" · ")} 순으로 추천해요.</Check>}
            {bestPicks.length > 0 && <Check>{bestPicks.slice(0, 4).map(({ o }) => o.name).join(", ")}이(가) 특히 잘 맞아요.</Check>}
            {worstPicks.length > 0 && <Check bad>{worstPicks.slice(0, 3).map(({ o }) => o.name).join(", ")}은(는) 피하는 편이 좋아요.</Check>}
            {profile.bone.kind === "UNDETERMINED" && <Check bad>골격 타입은 판단 보류입니다. 보조 설문을 완료하면 더 정확해져요.</Check>}
          </ul>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-mute">
          이 리포트는 사진 속 상대 비율과 설문을 규칙 기반으로 해석한 스타일링 참고 자료입니다. 실제 cm 치수·의학적 판단이 아니며, 어울림은 취향과 목표에 따라
          달라질 수 있습니다. 사진과 결과는 이 브라우저에만 있고 저장되지 않습니다.
        </p>
        <button onClick={() => window.print()} className="no-print mt-4 w-full rounded-2xl bg-coral py-3.5 text-[15px] font-semibold text-white">
          PDF로 저장 · 인쇄
        </button>
      </section>
    </main>
  );
}

function Tile({ label, value, color, bg, icon }: { label: string; value: string; color?: string; bg?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line p-3" style={{ background: bg ?? "#fff" }}>
      {icon && <span className="text-coral-deep">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] text-mute">{label}</p>
        <p className="font-hand truncate text-[19px] leading-tight" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function GuideList({ title, items, color, bg, mark }: { title: string; items: { title: string; body: string }[]; color: string; bg: string; mark: string }) {
  return (
    <div className="print-break rounded-2xl p-3" style={{ background: bg }}>
      <p className="font-hand text-[18px]" style={{ color }}>
        {mark} {title}
      </p>
      <ul className="mt-1.5 space-y-2">
        {items.map((i) => (
          <li key={i.title}>
            <b className="text-[12.5px]">{i.title}</b>
            <p className="text-[11px] leading-snug text-mute">{i.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Check({ children, bad }: { children: React.ReactNode; bad?: boolean }) {
  return (
    <li className="flex gap-2">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] text-white ${bad ? "bg-bad" : "bg-coral"}`}>{bad ? "!" : "✓"}</span>
      <span>{children}</span>
    </li>
  );
}
