import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp } from "../lib/anim";

/**
 * Bespoke (D-022): the "by hand" pain for the hook. A cursor copies the same value
 * from a Source cell to a Destination column, row by row, over and over - with a
 * ticking clock. Conveys mind-numbing daily repetition.
 */
const ROWS = 5;
const VALS = ["A-1042", "A-1043", "A-1044", "A-1045", "A-1046"];

export const HandCopy: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 16);
  const period = 1.3 * fps; // one copy per ~1.3s
  const cycle = Math.floor(frame / period);
  const within = (frame % period) / period; // 0..1 across one copy
  const activeRow = Math.min(cycle, ROWS - 1);
  // cursor travels from source (left) to the active destination row (right)
  const cx = interpolate(within, [0, 0.5, 1], [33, 64, 64]);
  const cy = interpolate(within, [0, 0.5, 1], [50, 30 + activeRow * 11, 30 + activeRow * 11]);

  const clockSpin = (frame / fps) * 90; // degrees

  return (
    <AbsoluteFill style={{ padding: "0 11%", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30, opacity: head.opacity }}>
        <Icon name="clock" size={40} color={theme.color.textSecondary} accent={theme.color.highlight} style={{ transform: `rotate(${clockSpin}deg)` }} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 46, color: theme.color.textPrimary }}>{data?.title ?? "The same thing, every single day"}</div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: 90, height: 380 }}>
        {/* source */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 26, color: theme.color.textSecondary, marginBottom: 14 }}>SOURCE</div>
          <div style={{ background: theme.color.surface, border: `2px solid ${theme.color.accent}`, borderRadius: 12, padding: "26px 28px", fontFamily: theme.font.mono, fontSize: 38, color: theme.color.accent, display: "inline-block" }}>{VALS[activeRow]}</div>
        </div>
        {/* destination */}
        <div style={{ flex: 1.3 }}>
          <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 26, color: theme.color.textSecondary, marginBottom: 14 }}>DESTINATION</div>
          <div style={{ background: theme.color.surface, border: `1px solid #1c2530`, borderRadius: 12, overflow: "hidden" }}>
            {VALS.map((v, i) => (
              <div key={i} style={{ padding: "16px 24px", borderTop: i ? "1px solid #1c2530" : "none", fontFamily: theme.font.mono, fontSize: 30, color: i <= activeRow ? theme.color.textPrimary : "#2b3642", background: i === activeRow && within < 0.6 ? "rgba(79,140,255,0.10)" : "transparent" }}>{i <= activeRow ? v : "—"}</div>
            ))}
          </div>
        </div>
        {/* cursor */}
        <div style={{ position: "absolute", left: `${cx}%`, top: `${cy}%`, transition: "none" }}>
          <div style={{ width: 0, height: 0, borderLeft: "16px solid #fff", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", transform: "rotate(-35deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
