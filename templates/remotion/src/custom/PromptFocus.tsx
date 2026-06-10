import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fadeUp, focalEnvelope } from "../lib/anim";
import { FocalZoom } from "../components/FocalZoom";
import { PipInset } from "../components/PipInset";

/**
 * PROOF of motivated motion (the owner's vision): a context heading on the left, a stylized
 * copy-pasteable PROMPT card slides into the upper-right like a screen-recording inset (PiP), then a
 * focal zoom PUNCHES INTO the prompt (the pause-and-screenshot moment) and pulls back when done.
 * Nothing drifts aimlessly — the one move lands on the prompt exactly when it's the subject.
 *   template: "custom", props: {
 *     component: "prompt-focus", heading, sub, promptTitle, prompt,
 *     focalZoom?: { target?, scale?, in?/out? (cue words) }, pip?: { anchor?, in?/out? (cue words) }
 *   }
 * In real videos build-props resolves the cue words to scene-local frames (inAt/outAt); the defaults
 * below drive the dev gallery preview where there are no cues.
 */
export const PromptFocus: React.FC<{
  data?: {
    heading?: string;
    sub?: string;
    promptTitle?: string;
    prompt?: string;
    focalZoom?: { target?: { x: number; y: number }; scale?: number; inAt?: number; outAt?: number | null; dur?: number };
    pip?: { anchor?: "top-right" | "top-left"; inAt?: number; outAt?: number | null; dur?: number; width?: number };
  };
}> = ({ data }) => {
  const d = {
    heading: data?.heading ?? "Tag every invoice automatically",
    sub: data?.sub ?? "One prompt. Paste it into the AI you already use.",
    promptTitle: data?.promptTitle ?? "PROMPT",
    prompt:
      data?.prompt ??
      "Read this invoice and return JSON:\nvendor, date, total, category.\nIf a field is missing, use null.",
  };
  const fz = {
    target: data?.focalZoom?.target ?? { x: 0.82, y: 0.3 },
    scale: data?.focalZoom?.scale ?? 1.5,
    inAt: data?.focalZoom?.inAt ?? 42,
    outAt: data?.focalZoom?.outAt ?? 104,
    dur: data?.focalZoom?.dur ?? 14,
  };
  const pip = {
    anchor: data?.pip?.anchor ?? "top-right",
    inAt: data?.pip?.inAt ?? 16,
    outAt: data?.pip?.outAt ?? null,
    dur: data?.pip?.dur ?? 16,
    width: data?.pip?.width ?? 0.42,
  };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = fadeUp(frame, fps, 0, 16);
  const s = fadeUp(frame, fps, 8, 16);
  // Fade the left context out as the zoom punches into the prompt (clean focus), back as it releases.
  const ctx = 1 - focalEnvelope(frame, fz.inAt, fz.outAt, fz.dur);
  return (
    <FocalZoom target={fz.target} scale={fz.scale} inAt={fz.inAt} outAt={fz.outAt} dur={fz.dur}>
      <AbsoluteFill style={{ padding: "0 9% 210px 9%", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ maxWidth: "50%", opacity: ctx }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 72, lineHeight: 1.06, color: theme.color.textPrimary, opacity: h.opacity, transform: `translateY(${h.y}px)` }}>
            {d.heading}
          </div>
          <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 34, color: theme.color.textSecondary, marginTop: 22, opacity: s.opacity, transform: `translateY(${s.y}px)` }}>
            {d.sub}
          </div>
        </div>
      </AbsoluteFill>
      <PipInset anchor={pip.anchor} inAt={pip.inAt} outAt={pip.outAt} dur={pip.dur} width={pip.width}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", background: "#10161e", borderBottom: `1px solid #26303c` }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, background: theme.color.accentSecondary }} />
          <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: theme.color.textSecondary }}>{d.promptTitle}</div>
        </div>
        <pre style={{ margin: 0, padding: "24px 28px", fontFamily: theme.font.mono, fontSize: 30, lineHeight: 1.5, color: theme.color.textPrimary, whiteSpace: "pre-wrap" }}>{d.prompt}</pre>
      </PipInset>
    </FocalZoom>
  );
};
