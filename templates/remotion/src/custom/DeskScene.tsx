import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022): "the real wins were under their nose" — a small worker doing a
 * dull paper task at a desk; a stack of docs piles up, then it gets automated and
 * collapses into a single "Done — automatically" with a turning gear.
 */
export const DeskScene: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const head = fadeUp(frame, fps, 0, 16);
  const arrowIn = progress(frame, fps, t(3.0), 18);
  const doneIn = progress(frame, fps, t(3.6), 18);
  const gearSpin = Math.max(0, (frame - t(3.6)) / fps) * 160;
  const pileFade = 1 - doneIn; // pile fades as the done card arrives

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center" }}>
      {data?.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary, marginBottom: 46, opacity: head.opacity, textAlign: "center" }}>{data.title}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
        {/* worker at a desk with a growing paper pile */}
        <div style={{ position: "relative", width: 420, height: 340, opacity: interpolate(pileFade, [0, 1], [0.25, 1]) }}>
          <div style={{ position: "absolute", left: "50%", top: 24, transform: "translateX(-50%)" }}>
            <Icon name="person" size={92} color={theme.color.textSecondary} />
          </div>
          {/* desk */}
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 70, height: 16, background: theme.color.surface, border: "1px solid #2b3642", borderRadius: 4 }} />
          <div style={{ position: "absolute", left: 60, bottom: 0, width: 10, height: 70, background: theme.color.surface }} />
          <div style={{ position: "absolute", right: 60, bottom: 0, width: 10, height: 70, background: theme.color.surface }} />
          {/* growing paper pile */}
          {[0, 1, 2, 3].map((i) => {
            const a = progress(frame, fps, t(0.6) + i * t(0.55), 12);
            return (
              <div key={i} style={{ position: "absolute", left: 250, bottom: 86 + i * 26, opacity: a, transform: `translateY(${interpolate(a, [0, 1], [-14, 0])}px) rotate(${(i % 2 ? -3 : 3)}deg)` }}>
                <Icon name="document" size={54} color={theme.color.highlight} />
              </div>
            );
          })}
        </div>

        <div style={{ opacity: arrowIn }}><Icon name="arrow" size={56} color={theme.color.accent} /></div>

        {/* automated result */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: doneIn, transform: `scale(${interpolate(doneIn, [0, 1], [0.8, 1])})` }}>
          <Icon name="gear" size={96} color={theme.color.accent} accent={theme.color.accentSecondary} style={{ transform: `rotate(${gearSpin}deg)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: theme.color.surface, border: `2px solid ${theme.color.accentSecondary}`, borderRadius: 14, padding: "18px 26px" }}>
            <Icon name="check" size={36} color={theme.color.accentSecondary} accent={theme.color.accentSecondary} />
            <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textPrimary }}>Done — automatically</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
