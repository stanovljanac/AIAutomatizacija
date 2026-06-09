import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { countUp, fadeUp, pop, ramp, splitNumeric, formatNumber } from "../lib/anim";
import { useMotion } from "../lib/motion";

/**
 * Bespoke HOOK-class opener (component name starts with "hook" → counts as a strong hook in the
 * first-30s rule). A big stat COUNTS UP, then a punch line lands under a drawn accent bar. Use it
 * to open a video with a concrete, sourced number instead of a plain title card.
 *   template: "custom", props: { component: "hook-stat-reveal", kicker?, stat, statLabel, punch? }
 */
export const HookStatReveal: React.FC<{
  data?: { kicker?: string; stat: string; statLabel: string; punch?: string };
}> = ({ data }) => {
  const d = data ?? { stat: "26,000", statLabel: "invoices a year — entered by hand", punch: "Until we automated it." };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const calm = useMotion().intensity === "calm";
  const { prefix, num, suffix, decimals, grouped } = splitNumeric(d.stat);
  const k = fadeUp(frame, fps, 0, 14);
  const COUNT_DELAY = 8;
  const COUNT_DUR = 40;
  const statStr =
    num == null
      ? d.stat
      : `${prefix}${formatNumber(countUp(frame, num, { delay: COUNT_DELAY, dur: COUNT_DUR }), decimals, grouped)}${suffix}`;
  const land = num == null || calm ? 1 : pop(frame, COUNT_DELAY + COUNT_DUR, 0.06);
  const lbl = fadeUp(frame, fps, COUNT_DELAY + COUNT_DUR + 4, 18);
  const punchAt = COUNT_DELAY + COUNT_DUR + 22;
  const p = fadeUp(frame, fps, punchAt, 20);
  const u = ramp(frame, punchAt - 6, 16);
  return (
    <AbsoluteFill style={{ padding: "0 9% 210px 9%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontFamily: theme.font.body, fontWeight: 700, letterSpacing: 6, fontSize: 26, color: theme.color.accentSecondary, opacity: k.opacity, marginBottom: 18 }}>
        {(d.kicker ?? "The Automation Desk").toUpperCase()}
      </div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 240, lineHeight: 1, color: theme.color.accent, transform: `scale(${land})`, fontVariantNumeric: "tabular-nums" }}>{statStr}</div>
      <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 48, color: theme.color.textPrimary, marginTop: 12, opacity: lbl.opacity, transform: `translateY(${lbl.y}px)`, maxWidth: 1300 }}>{d.statLabel}</div>
      {d.punch && (
        <>
          <div style={{ height: 6, marginTop: 30, width: `${u * 220}px`, background: `linear-gradient(90deg, ${theme.color.accent}, ${theme.color.accentSecondary})`, borderRadius: 4 }} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 60, color: theme.color.textPrimary, marginTop: 22, opacity: p.opacity, transform: `translateY(${p.y}px)` }}>{d.punch}</div>
        </>
      )}
    </AbsoluteFill>
  );
};
