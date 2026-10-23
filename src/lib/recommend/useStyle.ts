"use client";
import { useMemo } from "react";
import { useAnalysis } from "../store/AnalysisStore";
import { useBodyAnalysis } from "../analysis/useBodyAnalysis";
import { buildStyleProfile } from "./profile";
import { recommendNecklines } from "./necklines";
import { recommendOutfits } from "./outfits";

/** 전신 분석 → 분류(4단계) → 추천(5단계)까지 한 번에. 입력이 바뀌면 즉시 재계산 */
export function useStyle() {
  const store = useAnalysis();
  const { slots, overrides, survey, styleOverrides, images, necklinePrefs } = store;
  const front = slots.frontBody.analysis;
  const { kp, result } = useBodyAnalysis(front, overrides);

  const profile = useMemo(
    () =>
      front?.body?.pose
        ? buildStyleProfile({
            body: result,
            frontFace: slots.frontFace.analysis,
            sideBody: slots.sideBody.analysis,
            survey,
            overrides: styleOverrides,
            images,
          })
        : null,
    [front, result, slots.frontFace.analysis, slots.sideBody.analysis, survey, styleOverrides, images],
  );
  // 직접 수정 전 자동 판단값(수정 패널에 표시)
  const autoProfile = useMemo(
    () =>
      front?.body?.pose
        ? buildStyleProfile({ body: result, frontFace: slots.frontFace.analysis, sideBody: slots.sideBody.analysis, survey, overrides: {}, images })
        : null,
    [front, result, slots.frontFace.analysis, slots.sideBody.analysis, survey, images],
  );
  const necklines = useMemo(() => (profile ? recommendNecklines(profile, necklinePrefs) : []), [profile, necklinePrefs]);
  const outfits = useMemo(() => (profile ? recommendOutfits(profile) : []), [profile]);
  return { ...store, front, kp, result, profile, autoProfile, necklines, outfits };
}
