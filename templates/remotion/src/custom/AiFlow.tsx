import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022): "what AI is" — messy human inputs flow into an AI chip and a
 * clean, sensible answer comes out. Beats are scene-local seconds so it animates
 * across the whole scene window.
 */
const INPUTS: { icon: IconName; label: string }[] = [
  { icon: "note", label: "a sloppy sheet" },
  { icon: "email", label: "a long email" },
  { icon: "document", label: "a pile of notes" },
];

export const AiFlow: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const head = fadeUp(frame, fps, 0, 16);
  const aiIn = progress(frame, fps, t(2.4), 20);
  const ansIn = progress(frame, fps, t(4.0), 20);
  const pulse = 1 + 0.05 * Math.sin((frame / fps) * 4);

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center" }}>
      {data?.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary, marginBottom: 52, opacity: head.opacity }}>{data.title}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36 }}>
        {/* inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {INPUTS.map((it, i) => {
            const a = fadeUp(frame, fps, t(0.4) + i * t(0.5), 16);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: theme.color.surface, border: "1px solid #26303c", borderRadius: 12, padding: "14px 20px", opacity: a.opacity, transform: `translateX(${interpolate(a.opacity, [0, 1], [-30, 0])}px)` }}>
                <Icon name={it.icon} size={36} color={theme.color.textSecondary} accent={theme.color.highlight} />
                <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 28, color: theme.color.textSecondary }}>{it.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ opacity: aiIn }}><Icon name="arrow" size={56} color={theme.color.accent} /></div>

        {/* AI chip */}
        <div style={{ width: 200, height: 200, borderRadius: 28, background: theme.color.surface, border: `3px solid ${theme.color.accent}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: aiIn, transform: `scale(${interpolate(aiIn, [0, 1], [0.7, 1]) * pulse})`, boxShadow: `0 0 ${30 * aiIn}px ${theme.color.accent}55` }}>
          <Icon name="ai" size={84} color={theme.color.accent} accent={theme.color.accent} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: theme.color.accent }}>AI</div>
        </div>

        <div style={{ opacity: ansIn }}><Icon name="arrow" size={56} color={theme.color.accentSecondary} /></div>

        {/* answer */}
        <div style={{ background: theme.color.surface, border: `2px solid ${theme.color.accentSecondary}`, borderRadius: 16, padding: "26px 30px", display: "flex", alignItems: "center", gap: 16, opacity: ansIn, transform: `translateX(${interpolate(ansIn, [0, 1], [30, 0])}px)` }}>
          <Icon name="check" size={44} color={theme.color.accentSecondary} accent={theme.color.accentSecondary} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textPrimary }}>a sensible<br />decision</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
