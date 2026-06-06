import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022) — s04. A week grid (Mon-Fri x 4 rows). Busy blocks are shaded;
 * an incoming request pill floats in, an AI sweep scans the week, two free slots
 * light up, and a ready-to-send reply card slides up with two proposed times.
 * Window-aware: each stage is placed as a fraction of the scene so motion is spread.
 */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const BUSY = new Set(["0-0", "1-2", "2-1", "3-0", "3-3", "4-2", "0-3", "2-3"]);
const FREE = ["1-1", "2-2"]; // the two proposed open slots (Tue / Wed)

export const CalendarFind: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const W = durationInFrames / fps;
  const t = (s: number) => s * fps;
  const lin = (a: number, b: number) => interpolate(frame, [t(a), t(b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const head = fadeUp(frame, fps, 0, 16);
  const gridIn = lin(0.2, 1.0);
  const pill = lin(W * 0.12, W * 0.12 + 0.6);
  const sweepP = lin(W * 0.32, W * 0.55);
  const slot = lin(W * 0.55, W * 0.68);
  const card = lin(W * 0.72, W * 0.82);

  const cols = 5, rows = 4;
  const cellW = 150, cellH = 78, gap = 12;
  const gridW = cols * cellW + (cols - 1) * gap;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 170 }}>
      {data?.title && (
        <div style={{ position: "absolute", top: 86, width: "100%", textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 56, color: theme.color.textPrimary, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
          {data.title}
        </div>
      )}

      <div style={{ position: "relative", opacity: gridIn, transform: `translateY(${interpolate(gridIn, [0, 1], [20, 0])}px)` }}>
        {/* incoming request pill */}
        <div style={{ position: "absolute", top: -86, left: 0, display: "flex", alignItems: "center", gap: 14, background: theme.color.surface, border: `2px solid ${theme.color.highlight}`, borderRadius: 999, padding: "12px 26px", opacity: pill, transform: `translateY(${interpolate(pill, [0, 1], [-16, 0])}px)` }}>
          <Icon name="email" size={34} color={theme.color.highlight} />
          <span style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 30, color: theme.color.textPrimary }}>"Can we meet before Friday?"</span>
        </div>

        {/* day headers */}
        <div style={{ display: "flex", gap, marginBottom: gap }}>
          {DAYS.map((d) => (
            <div key={d} style={{ width: cellW, textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, color: theme.color.textSecondary }}>{d}</div>
          ))}
        </div>

        {/* grid */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap, marginBottom: gap }}>
            {Array.from({ length: cols }).map((__, c) => {
              const key = `${c}-${r}`;
              const busy = BUSY.has(key);
              const isFree = FREE.includes(key);
              const lit = isFree ? slot : 0;
              return (
                <div key={c} style={{
                  width: cellW, height: cellH, borderRadius: 12,
                  background: busy ? "#26303c" : theme.color.surface,
                  border: `2px solid ${isFree ? theme.color.accentSecondary : "#1d2630"}`,
                  boxShadow: isFree ? `0 0 ${interpolate(lit, [0, 1], [0, 26])}px ${theme.color.accentSecondary}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: busy ? 0.9 : 1,
                }}>
                  {busy && <div style={{ width: "70%", height: 8, borderRadius: 4, background: theme.color.textSecondary, opacity: 0.5 }} />}
                  {isFree && lit > 0.2 && <Icon name="check" size={34} color={theme.color.accentSecondary} accent={theme.color.accentSecondary} style={{ opacity: lit }} />}
                </div>
              );
            })}
          </div>
        ))}

        {/* AI sweep bar */}
        <div style={{ position: "absolute", top: 52, left: interpolate(sweepP, [0, 1], [-30, gridW - 30]), width: 60, height: rows * cellH + (rows - 1) * gap, background: `linear-gradient(90deg, transparent, ${theme.color.accent}, transparent)`, opacity: interpolate(sweepP, [0, 0.1, 0.9, 1], [0, 0.7, 0.7, 0]) }} />
      </div>

      {/* ready-to-send reply card */}
      <div style={{ position: "absolute", bottom: 210, display: "flex", alignItems: "center", gap: 18, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, borderRadius: 16, padding: "20px 30px", opacity: card, transform: `translateY(${interpolate(card, [0, 1], [18, 0])}px)` }}>
        <Icon name="ai" size={40} color={theme.color.accent} accent={theme.color.accentSecondary} />
        <span style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: theme.color.textPrimary }}>Draft: "Tue 10:00 or Wed 14:00 - which works?"</span>
      </div>
    </AbsoluteFill>
  );
};
