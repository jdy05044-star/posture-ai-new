"use client";
import { useState } from "react";
import { SURVEY, type SurveyAnswers } from "@/lib/analysis/survey";
import type { BoneType, FaceShape, NeckLength, SilhouetteType, StyleImage } from "@/lib/style/types";
import { BONE_LABEL, FACE_LABEL, NECK_LABEL, SILHOUETTE_LABEL, STYLE_IMAGE_LABEL } from "@/lib/style/types";
import type { StyleOverrides } from "@/lib/recommend/profile";

/** 사진으로 확정할 수 없는 골격 요소 보조 설문 */
export function SurveyForm({ answers, onAnswer }: { answers: SurveyAnswers; onAnswer: (id: string, v: string | undefined) => void }) {
  const [open, setOpen] = useState(true);
  const done = SURVEY.filter((q) => answers[q.id]).length;
  return (
    <div className="card p-4">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)}>
        <span className="text-left">
          <b className="block text-[14px]">보조 설문 · 골격 확인</b>
          <span className="text-[12px] text-mute">관절 크기·살 질감·골격 깊이는 사진으로 확정하지 않고 설문으로 보완합니다 ({done}/{SURVEY.length})</span>
        </span>
        <span className="text-mute">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ol className="mt-4 space-y-5">
          {SURVEY.map((q, i) => (
            <li key={q.id}>
              <p className="text-[13.5px] font-semibold">
                <span className="mr-1 text-coral tabular">Q{i + 1}.</span>
                {q.question}
              </p>
              {q.hint && <p className="mt-0.5 text-[11.5px] text-mute">{q.hint}</p>}
              <div className="mt-2 grid gap-1.5">
                {q.options.map((o) => {
                  const on = answers[q.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => onAnswer(q.id, on ? undefined : o.value)}
                      className={`rounded-xl border px-3 py-2 text-left text-[13px] transition ${on ? "border-coral bg-blush/60" : "border-line bg-white"} ${o.type ? "" : "text-mute"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
  autoLabel,
}: {
  label: string;
  options: [T, string][];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  autoLabel: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange(undefined)}
          className={`rounded-full border px-3 py-1 text-[12px] ${value === undefined ? "border-ink bg-ink text-white" : "border-line text-mute"}`}
        >
          자동 ({autoLabel})
        </button>
        {options.map(([k, l]) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`rounded-full border px-3 py-1 text-[12px] ${value === k ? "border-coral bg-blush text-coral-deep" : "border-line"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 분석 결과 직접 수정 + 원하는 이미지 */
export function ProfileEditor({
  overrides,
  onOverride,
  auto,
  images,
  onToggleImage,
}: {
  overrides: StyleOverrides;
  onOverride: <K extends keyof StyleOverrides>(k: K, v: StyleOverrides[K] | undefined) => void;
  auto: { bone: string; silhouette: string; face: string; neck: string };
  images: StyleImage[];
  onToggleImage: (i: StyleImage) => void;
}) {
  return (
    <div className="card space-y-4 p-4">
      <div>
        <b className="text-[14px]">원하는 이미지</b>
        <p className="text-[12px] text-mute">선택한 분위기에 맞는 넥라인·의상의 점수가 올라갑니다(여러 개 선택 가능).</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(STYLE_IMAGE_LABEL) as StyleImage[]).map((i) => (
            <button
              key={i}
              onClick={() => onToggleImage(i)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] ${images.includes(i) ? "border-coral bg-coral text-white" : "border-line"}`}
            >
              {STYLE_IMAGE_LABEL[i]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        <div>
          <b className="text-[14px]">결과 직접 수정</b>
          <p className="text-[12px] text-mute">전문가 진단을 받았거나 자동 판단이 다르다고 느끼면 바꿔 보세요. 추천이 즉시 다시 계산됩니다.</p>
        </div>
        <ChipRow<BoneType>
          label="골격 타입"
          options={(["STRAIGHT", "WAVE", "NATURAL"] as BoneType[]).map((k) => [k, BONE_LABEL[k]])}
          value={overrides.bone}
          onChange={(v) => onOverride("bone", v)}
          autoLabel={auto.bone}
        />
        <ChipRow<SilhouetteType>
          label="실루엣"
          options={(["hourglass", "triangle", "invertedTriangle", "rectangle"] as SilhouetteType[]).map((k) => [k, SILHOUETTE_LABEL[k]])}
          value={overrides.silhouette}
          onChange={(v) => onOverride("silhouette", v)}
          autoLabel={auto.silhouette}
        />
        <ChipRow<FaceShape>
          label="얼굴형"
          options={(Object.keys(FACE_LABEL) as FaceShape[]).map((k) => [k, FACE_LABEL[k]])}
          value={overrides.face}
          onChange={(v) => onOverride("face", v)}
          autoLabel={auto.face}
        />
        <ChipRow<NeckLength>
          label="목 길이"
          options={(Object.keys(NECK_LABEL) as NeckLength[]).map((k) => [k, NECK_LABEL[k]])}
          value={overrides.neck}
          onChange={(v) => onOverride("neck", v)}
          autoLabel={auto.neck}
        />
      </div>
    </div>
  );
}
