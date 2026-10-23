"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LevelId, Metric, MetricId, PhotoAnalysis } from "@/lib/types";
import { useStyle } from "@/lib/recommend/useStyle";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, SILHOUETTE_LABEL, type StyleProfile } from "@/lib/style/types";
import { BoneTypeCard, EvidenceList, FaceCard, NeckCard, SilhouetteCard } from "@/components/style/StyleCards";
import { ProfileEditor, SurveyForm } from "@/components/style/Inputs";
import { NecklineCard, OutfitSection } from "@/components/style/Recommendations";
import { figureFromKeypoints } from "@/lib/analysis/figureModel";
import { LEVEL_LABEL } from "@/lib/analysis/bodyRatios";
import { frontHeadOffset, sideHeadForward } from "@/lib/analysis/alignment";
import { computeFaceMeasures } from "@/lib/analysis/faceMeasures";
import { BodyOverlay } from "@/components/analysis/BodyOverlay";
import { BodyFigure } from "@/components/analysis/BodyFigure";
import { FaceOverlay } from "@/components/analysis/FaceOverlay";
import { LevelEditor } from "@/components/analysis/LevelEditor";
import { MetricCard } from "@/components/analysis/MetricCard";
import { IssueList, Section, TopBar } from "@/components/ui/primitives";

type Tab = "body" | "type" | "neck" | "face" | "neckline" | "outfit" | "side";
const TABS: { id: Tab; label: string }[] = [
  { id: "body", label: "전신 비율" },
  { id: "type", label: "골격 · 체형" },
  { id: "neck", label: "목 · 어깨" },
  { id: "face", label: "얼굴형" },
  { id: "neckline", label: "넥라인" },
  { id: "outfit", label: "코디 추천" },
  { id: "side", label: "측면" },
];

const WIDTH_OF: Partial<Record<MetricId, ("neck" | "shoulder" | "waist" | "hip")[]>> = {
  shoulderHip: ["shoulder", "hip"],
  waistHip: ["waist", "hip"],
  faceShoulder: ["shoulder"],
  shoulderSlope: ["neck", "shoulder"],
};

export default function AnalysisPage() {
  const S = useStyle();
  const { slots, overrides, setOverride, resetOverrides, front, kp, result, profile } = S;
  const [tab, setTab] = useState<Tab>("body");
  const [edit, setEdit] = useState(false);
  const [skeleton, setSkeleton] = useState(true);
  const [selected, setSelected] = useState<MetricId | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<Set<LevelId>>(new Set());

  // "직접 지정"으로 추가만 하고 아직 끌어서 맞추지 않은 선은 계산에 쓰지 않음(임의 수치 방지)
  const metrics: Metric[] = useMemo(() => {
    if (!result) return [];
    return result.metrics.map((m) => {
      const pend = m.uses.filter((u): u is LevelId => unconfirmed.has(u as LevelId));
      return pend.length
        ? {
            ...m,
            value: null,
            display: "위치 확인 필요",
            status: "unavailable" as const,
            parts: undefined,
            reasons: pend.map((p) => `${LEVEL_LABEL[p]} 선을 사진 위에서 끌어 실제 위치에 맞춰 주세요.`),
          }
        : m;
    });
  }, [result, unconfirmed]);

  const sel = metrics.find((m) => m.id === selected);
  const highlightLevels = (sel?.uses.filter((u) => u in LEVEL_LABEL) as LevelId[]) ?? [];
  const figure = useMemo(() => figureFromKeypoints(kp), [kp]);

  if (!front) {
    return (
      <main>
        <TopBar back="/upload" title="분석 결과" />
        <div className="px-6 py-20 text-center">
          <p className="text-mute">아직 분석된 정면 전신 사진이 없습니다.</p>
          <p className="mt-1 text-[12px] text-mute">사진은 저장되지 않으므로 새로고침하면 다시 올려야 합니다.</p>
          <Link href="/upload" className="mt-6 inline-block rounded-2xl bg-coral px-6 py-3 text-sm font-semibold text-white">
            사진 올리러 가기
          </Link>
        </div>
      </main>
    );
  }

  const measured = metrics.filter((m) => m.status !== "unavailable").length;
  const byId = (id: MetricId) => metrics.find((m) => m.id === id);

  return (
    <main className="pb-16">
      <TopBar back="/upload" title="분석 결과" />

      <nav className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-line bg-paper/95 px-3 py-2 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] ${tab === t.id ? "bg-ink text-white" : "text-mute"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "body" && (
        <>
          <Section
            eyebrow="Front · landmarks"
            title="사진 위 분석선"
            right={
              <div className="flex gap-1.5">
                <ToggleChip on={skeleton} onClick={() => setSkeleton((s) => !s)}>
                  골격
                </ToggleChip>
                <ToggleChip on={edit} onClick={() => setEdit((e) => !e)}>
                  {edit ? "수정 완료" : "기준선 수정"}
                </ToggleChip>
              </div>
            }
          >
            <div className="space-y-3">
              <IssueList issues={[...front.issues, ...(kp?.warnings ?? [])]} compact />
              <BodyOverlay
                photo={front}
                kp={kp}
                editMode={edit}
                highlight={highlightLevels}
                showSkeleton={skeleton}
                onCommitLevel={(id, y) => {
                  setOverride(id, y);
                  setUnconfirmed((s) => {
                    const n = new Set(s);
                    n.delete(id);
                    return n;
                  });
                }}
              />
              {kp && edit && (
                <LevelEditor
                  kp={kp}
                  imageH={front.height}
                  overrides={overrides}
                  onSet={(id, y) => {
                    setOverride(id, y);
                    setUnconfirmed((s) => {
                      const n = new Set(s);
                      if (y !== null && kp.levels[id].source === "missing") n.add(id);
                      else n.delete(id);
                      return n;
                    });
                  }}
                  onReset={() => {
                    resetOverrides();
                    setUnconfirmed(new Set());
                  }}
                />
              )}
              {!edit && kp && (
                <button onClick={() => setEdit(true)} className="w-full rounded-xl border border-dashed border-rose py-2.5 text-[13px] text-coral-deep">
                  가랑이점·허리선·목 밑이 맞지 않나요? 기준선 직접 수정하기
                </button>
              )}
            </div>
          </Section>

          {result && (
            <>
              <Section eyebrow="Proportion map" title="비율 일러스트" right={<span className="text-[12px] text-mute tabular">{measured}/11 측정</span>}>
                <div className="card flex items-center gap-2 bg-gradient-to-b from-white to-shell p-3">
                  <BodyFigure
                    model={figure}
                    className="h-[340px] w-auto shrink-0"
                    highlightLevels={highlightLevels}
                    highlightWidths={sel ? WIDTH_OF[sel.id] ?? [] : []}
                    showDefaultNote
                  />
                  <div className="min-w-0 flex-1 space-y-3 pr-1">
                    {(["headToBody", "upperLower", "shoulderHip", "waistHip"] as MetricId[]).map((id) => {
                      const m = byId(id);
                      if (!m) return null;
                      return (
                        <button key={id} onClick={() => setSelected(id)} className="block w-full text-left">
                          <p className="text-[11px] text-mute">{m.label}</p>
                          <p className={`font-display tabular ${m.status === "unavailable" ? "text-sm text-mute" : "text-lg"}`}>{m.display}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] leading-snug text-mute">
                  일러스트는 측정된 기준선 높이와 실루엣 폭을 전신 높이로 정규화해 그렸습니다. 카드를 누르면 해당 측정 부위가 강조됩니다.
                </p>
              </Section>

              <Section eyebrow="11 measurements" title="신체 비율 상세">
                <div className="space-y-2.5">
                  {metrics.map((m) => (
                    <MetricCard key={m.id} m={m} active={selected === m.id} onSelect={() => setSelected(m.id === selected ? null : m.id)} />
                  ))}
                </div>
                {result.postureFlags.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-[#fbf1e2] p-4 text-[13px] leading-relaxed text-[#8a5d20]">
                    <b>촬영 자세 영향이 감지되었습니다</b>
                    <ul className="mt-1 list-disc pl-4">
                      {result.postureFlags.map((f) => (
                        <li key={f.code}>{f.message}</li>
                      ))}
                    </ul>
                    <p className="mt-1">비대칭 값은 실제 체형 차이가 아닐 수 있습니다. 바르게 서서 다시 촬영하면 비교할 수 있습니다.</p>
                  </div>
                )}
                <Disclaimer />
              </Section>
            </>
          )}
          {!result && (
            <div className="mx-4 rounded-2xl bg-[#f7e7e5] p-4 text-sm text-bad">
              신체를 인식하지 못해 비율을 계산할 수 없습니다. 촬영 가이드를 확인하고 다시 촬영해 주세요.
            </div>
          )}
        </>
      )}

      {tab === "neck" && (
        <Section eyebrow="Neck & shoulder" title="목 길이 · 어깨 분석">
          <p className="mb-3 text-[13px] leading-relaxed text-mute">
            목 길이는 사진에서 <b className="text-ink">보이는 길이</b>(턱끝~목·승모근 경계)입니다. 카메라 높이, 고개 각도, 옷깃, 머리카락에 따라 달라지므로 같은 조건에서
            찍은 사진끼리 비교하는 상대값으로 봐 주세요. ‘짧아 보임/보통/길어 보임’ 구분은 다음 단계(4단계) 분석 엔진에서 이 수치를 근거로 제공됩니다.
          </p>
          <div className="space-y-2.5">
            {profile && <NeckCard c={profile.neck} />}
            {profile && (
              <div className="card p-4 text-[13px]">
                <p className="text-[11px] text-mute">어깨</p>
                <p className="font-hand text-[20px]">
                  {profile.shoulderWidth.value ? { broad: "넓은 편", balanced: "골반과 균형", narrow: "좁은 편" }[profile.shoulderWidth.value] : "폭 판단 불가"} ·{" "}
                  {profile.shoulderSlope.value ? { square: "직각형", normal: "보통 경사", sloped: "처진 어깨" }[profile.shoulderSlope.value] : "경사 판단 불가"}
                </p>
                <div className="mt-2">
                  <EvidenceList evidence={[...profile.shoulderWidth.evidence, ...profile.shoulderSlope.evidence]} />
                </div>
              </div>
            )}
            {(["faceNeck", "shoulderSlope", "faceShoulder", "shoulderHip"] as MetricId[]).map((id) => {
              const m = byId(id);
              return m ? <MetricCard key={id} m={m} /> : null;
            })}
            <MetricCard m={frontHeadOffset(front.body?.pose ?? null)} />
            <MetricCard m={sideHeadForward(slots.sideBody.analysis?.body?.pose ?? null)} />
          </div>
          {slots.sideFace.analysis && <PhotoBlock title="측면 얼굴 · 목" photo={slots.sideFace.analysis} />}
          <button onClick={() => { setTab("body"); setEdit(true); }} className="mt-4 w-full rounded-xl border border-dashed border-rose py-2.5 text-[13px] text-coral-deep">
            턱끝·목 밑 기준선 직접 수정하기
          </button>
        </Section>
      )}

      {tab === "face" && (
        <>
          {profile && (
            <div className="px-4 pt-6">
              <FaceCard c={profile.face} />
            </div>
          )}
          <FaceTab photo={slots.frontFace.analysis} />
        </>
      )}

      {tab === "type" && <TypeTab S={S} figure={figure} />}
      {tab === "neckline" && <NecklineTab S={S} />}
      {tab === "outfit" && <OutfitTab S={S} />}

      {tab === "side" && (
        <Section eyebrow="Side" title="측면 전신">
          {slots.sideBody.analysis ? (
            <PhotoBlock title="" photo={slots.sideBody.analysis} />
          ) : (
            <EmptyPhoto label="측면 전신 사진" />
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-mute">
            측면 랜드마크는 4단계 골격 타입 분석에서 상체 두께(입체감)와 목-머리 정렬 판단에 사용됩니다.
          </p>
        </Section>
      )}

      <div className="no-print px-4 py-6">
        <Link href="/report" className="block rounded-2xl bg-ink py-3.5 text-center text-[15px] font-semibold text-white">
          최종 스타일링 리포트 보기 →
        </Link>
      </div>
    </main>
  );
}

function ToggleChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1 text-[12px] ${on ? "border-coral bg-blush text-coral-deep" : "border-line text-mute"}`}>
      {children}
    </button>
  );
}

function PhotoBlock({ title, photo }: { title: string; photo: PhotoAnalysis }) {
  return (
    <div className="mt-4 space-y-2">
      {title && <b className="text-sm">{title}</b>}
      <IssueList issues={photo.issues} compact />
      {photo.body?.pose ? (
        <BodyOverlay photo={photo} kp={null} />
      ) : photo.face ? (
        <FaceOverlay photo={photo} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.imageUrl} alt="" className="w-full rounded-2xl" />
      )}
    </div>
  );
}

function FaceTab({ photo }: { photo?: PhotoAnalysis }) {
  const [mesh, setMesh] = useState(false);
  const fm = computeFaceMeasures(photo?.face?.landmarks);
  return (
    <Section
      eyebrow="Face · landmarks"
      title="정면 얼굴"
      right={photo?.face ? <ToggleChip on={mesh} onClick={() => setMesh((m) => !m)}>랜드마크 478점</ToggleChip> : undefined}
    >
      {!photo ? (
        <EmptyPhoto label="정면 얼굴 사진" />
      ) : (
        <div className="space-y-3">
          <IssueList issues={photo.issues} compact />
          <FaceOverlay photo={photo} showMesh={mesh} />
          {fm ? (
            <div className="card divide-y divide-line">
              {[
                ["얼굴 세로 : 가로(광대)", `${fm.lengthToWidth.toFixed(2)} : 1`],
                ["이마 : 광대 : 턱 너비", `${fm.forehead.toFixed(2)} : 1 : ${fm.jaw.toFixed(2)}`],
                ["하관(코끝~턱) / 얼굴 세로", `${(fm.lowerFace * 100).toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span className="text-mute">{k}</span>
                  <b className="font-display tabular">{v}</b>
                </div>
              ))}
              <p className="px-4 py-3 text-[11.5px] leading-snug text-mute">
                얼굴 세로는 얼굴 메시 상단(헤어라인 근처)부터 턱끝까지입니다. 이 수치를 근거로 한 얼굴형 분류(둥근·계란·긴·각진·하트·다이아몬드, 혼합 표시)는 4단계에서
                제공됩니다.
              </p>
            </div>
          ) : (
            <p className="text-sm text-bad">얼굴 랜드마크가 없어 측정할 수 없습니다.</p>
          )}
        </div>
      )}
    </Section>
  );
}

function EmptyPhoto({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center text-[13px] text-mute">
      {label}이 없습니다.
      <Link href="/upload" className="ml-1 text-coral-deep underline">
        추가하기
      </Link>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-4 text-[11.5px] leading-relaxed text-mute">
      모든 수치는 같은 사진 안 픽셀 길이끼리의 비율입니다. 렌즈 원근 때문에 카메라에 가까운 부위가 커 보이고, 옷·신발·머리카락 볼륨이 포함될 수 있어 실제 cm 치수와
      다릅니다. ‘신뢰도 낮음’ 항목은 기준선을 확인하거나 가이드에 맞춰 다시 촬영하면 개선됩니다.
    </p>
  );
}

type StyleState = ReturnType<typeof useStyle>;

function NeedProfile() {
  return <p className="mx-4 mt-6 rounded-2xl bg-[#f7e7e5] p-4 text-sm text-bad">정면 전신 사진에서 신체가 인식되어야 분석할 수 있습니다.</p>;
}

function autoLabels(p: StyleProfile | null) {
  if (!p) return { bone: "-", silhouette: "-", face: "-", neck: "-" };
  return {
    bone: p.bone.kind === "MIXED" && p.bone.primary && p.bone.secondary ? `${BONE_LABEL[p.bone.primary]}·${BONE_LABEL[p.bone.secondary]}` : BONE_LABEL[p.bone.kind],
    silhouette: p.silhouette.value ? SILHOUETTE_LABEL[p.silhouette.value] : "판단 불가",
    face: p.face.value ? FACE_LABEL[p.face.value] : "판단 불가",
    neck: p.neck.value ? NECK_LABEL[p.neck.value] : "판단 불가",
  };
}

function TypeTab({ S, figure }: { S: StyleState; figure: ReturnType<typeof figureFromKeypoints> }) {
  if (!S.profile) return <NeedProfile />;
  const p = S.profile;
  return (
    <>
      <Section eyebrow="Step 4" title="골격 타입">
        <BoneTypeCard bone={p.bone} figure={figure} />
        <div className="card mt-3 p-4">
          <b className="text-[13px]">판단 근거</b>
          <div className="mt-2">
            <EvidenceList evidence={p.bone.evidence} />
          </div>
          <p className="mt-3 text-[11.5px] leading-snug text-mute">
            사진에서는 폭·굴곡·경사·상체 두께 같은 외형만 근거로 쓰고, 관절 크기·살과 근육의 질감·골격의 깊이는 설문으로만 반영합니다. 일본식 골격 진단을
            참고한 스타일링 분류이며 의학적 판단이 아닙니다.
          </p>
        </div>
        <div className="mt-3">
          <SurveyForm answers={S.survey} onAnswer={S.setSurvey} />
        </div>
      </Section>
      <Section eyebrow="Silhouette" title="신체 실루엣">
        <SilhouetteCard c={p.silhouette} />
      </Section>
      <Section eyebrow="Adjust" title="내 결과 조정하기">
        <ProfileEditor
          overrides={S.styleOverrides}
          onOverride={S.setStyleOverride}
          auto={autoLabels(S.autoProfile)}
          images={S.images}
          onToggleImage={S.toggleImage}
        />
      </Section>
    </>
  );
}

function NecklineTab({ S }: { S: StyleState }) {
  if (!S.profile) return <NeedProfile />;
  const p = S.profile;
  return (
    <Section eyebrow="Step 5 · Neckline" title="나에게 맞는 넥라인">
      <p className="mb-3 text-[12.5px] leading-relaxed text-mute">
        얼굴형({p.face.value ? FACE_LABEL[p.face.value] : "미판단"}) · 목({p.neck.value ? NECK_LABEL[p.neck.value] : "미판단"}) · 어깨 · 골격(
        {BONE_LABEL[p.bone.kind]})을 합산한 점수 순입니다. 어울림은 절대적인 사실이 아니니 ‘좋아요/안 입어요’와 원하는 이미지로 조정해 보세요.
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["neat", "elegant", "casual", "feminine", "chic", "comfy"] as const).map((i) => (
          <button
            key={i}
            onClick={() => S.toggleImage(i)}
            className={`rounded-full border px-3 py-1 text-[12px] ${S.images.includes(i) ? "border-coral bg-coral text-white" : "border-line"}`}
          >
            {{ neat: "단정함", elegant: "우아함", casual: "캐주얼", feminine: "여성스러움", chic: "시크함", comfy: "편안함" }[i]}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {S.necklines.map((r, i) => (
          <NecklineCard key={r.id} rec={r} rank={i + 1} pref={S.necklinePrefs[r.id]} onPref={(v) => S.setNecklinePref(r.id, v)} />
        ))}
      </div>
    </Section>
  );
}

function OutfitTab({ S }: { S: StyleState }) {
  if (!S.profile) return <NeedProfile />;
  return (
    <Section eyebrow="Step 5 · Outfit" title="체형별 의상 추천">
      <p className="mb-4 text-[12.5px] leading-relaxed text-mute">
        골격 타입·실루엣·측정 비율(다리÷몸통, 허리 높이, 등신)을 근거로 점수를 매겼습니다. 항목을 누르면 어떤 비율을 어떻게 보완·강조하는지 근거가 보입니다.
      </p>
      <OutfitSection cats={S.outfits} />
    </Section>
  );
}
