import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp } from "../lib/anim";

/**
 * Bespoke (D-022) — s09 synthesis payoff. The five handoffs light up in sequence
 * down a timeline as a "normal Tuesday morning", then a coffee finish. Ties the
 * whole list together. Window-aware: rows are spread evenly across the scene.
 */
const ROWS: { icon: IconName; label: string }[] = [
  { icon: "inbox", label: "Inbox sorted - 3 need you" },
  { icon: "email", label: "2 replies drafted & waiting" },
  { icon: "bell", label: "Reminders sent - 08:00" },
  { icon: "document", label: "Meeting -> 5 action items" },
  { icon: "calendar", label: "New request - 2 times proposed" },
];

export const MorningSynthesis: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const W = durationInFrames / fps;
  const t = (s: number) => s * fps;
  const lin = (a: number, b: number) => interpolate(frame, [t(a), t(b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const head = fadeUp(frame, fps, 0, 16);
  const first = 1.0, last = Math.max(W - 3.0, first + ROWS.length); // spread rows across the window
  const rowAt = (i: number) => first + (last - first) * (i / ROWS.length);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "130px 0 200px" }}>
      {data?.title && (
        <div style={{ position: "absolute", top: 84, width: "100%", textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 60, color: theme.color.textPrimary, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
          {data.title}
        </div>
      )}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22, marginTop: 0 }}>
        {/* timeline spine */}
        <div style={{ position: "absolute", left: 33, top: 10, bottom: 10, width: 4, background: "#1d2630" }} />
        {ROWS.map((r, i) => {
          const a = lin(rowAt(i), rowAt(i) + 0.6);
          const checkIn = lin(rowAt(i) + 0.5, rowAt(i) + 1.0);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, opacity: a, transform: `translateX(${interpolate(a, [0, 1], [-30, 0])}px)`, zIndex: 1 }}>
              <div style={{ flex: "0 0 auto", width: 70, height: 70, borderRadius: 16, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={r.icon} size={40} color={theme.color.accent} accent={theme.color.accentSecondary} />
              </div>
              <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 44, color: theme.color.textPrimary, whiteSpace: "pre-line" }}>{r.label}</div>
              <Icon name="check" size={40} color={theme.color.accentSecondary} accent={theme.color.accentSecondary} style={{ opacity: checkIn, transform: `scale(${interpolate(checkIn, [0, 1], [0.5, 1])})` }} />
            </div>
          );
        })}
      </div>

      {/* coffee finish */}
      <div style={{ position: "absolute", bottom: 200, display: "flex", alignItems: "center", gap: 16, opacity: lin(last + 0.3, last + 1.1) }}>
        <Icon name="coffee" size={48} color={theme.color.highlight} accent={theme.color.accentSecondary} />
        <span style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 38, color: theme.color.textSecondary }}>...before your coffee's even cold.</span>
      </div>
    </AbsoluteFill>
  );
};
