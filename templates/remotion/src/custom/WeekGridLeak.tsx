import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fadeUp, progress, ramp, countUp, formatNumber, pop } from "../lib/anim";

/**
 * Bespoke (009 S3 — find the leak / the number). Replaces the title-card stat with a CONCRETE
 * visualization: a work-week grid (5 days × 8 hours) where ~9 cells shade gold ("manual data
 * entry — almost a quarter of the week"), then a big counter ticks up to the yearly cost with its
 * on-screen source (D-026, [[on-screen-source-for-stats]]).
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate. Beats key to the narration sentence
 * reveals (revealOn:"sentences"):
 *   reveals[1] "nine hours / a quarter" → grid shades · reveals[3] "$28,500 a year" → counter ·
 *   reveals[4] "per person" → tag pops. Fixed-cadence fallback for standalone preview; final HOLDS.
 */
type Data = {
  kicker?: string;
  hoursLost?: number; // gold cells (default 9)
  weekHours?: number; // grid total (default 40)
  amount?: string; // "$28,500"
  source?: string; // "Parseur survey, 2025"
  reveals?: number[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = 8; // cells per day column → 5×8 = 40h week

export const WeekGridLeak: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const hoursLost = data?.hoursLost ?? 9;
  const amountStr = data?.amount ?? "$28,500";
  const source = data?.source ?? "Parseur survey, 2025";
  const amountNum = Number(amountStr.replace(/[^\d.]/g, "")) || 28500;

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fShade = rv[1] ?? t(1.4); // grid shades the lost hours
  const fCount = Math.max(rv[3] ?? t(5.4), fShade + 24); // counter ticks up
  const fPer = Math.max(rv[4] ?? t(7.4), fCount + 18); // "per person"

  const gold = theme.color.highlight;
  const blue = theme.color.accent;

  // distribute the lost hours across days, bottom-loaded (≈2 per day): [2,2,2,2,1] for 9
  const goldByDay = DAYS.map((_, d) => {
    const base = Math.floor(hoursLost / DAYS.length);
    return base + (d < hoursLost % DAYS.length ? 1 : 0);
  });

  const head = fadeUp(frame, fps, 0, 14);
  const countDur = 30;
  const counted = Math.round(countUp(frame, amountNum, { from: 0, delay: fCount, dur: countDur }));
  const countIn = progress(frame, fps, fCount, 16);
  const perIn = progress(frame, fps, fPer, 14);

  // assign a stagger order to gold cells (top of each day's column = the manual-entry chunk)
  let order = 0;
  const goldOrder: Record<string, number> = {};
  for (let h = 0; h < HOURS; h++) for (let d = 0; d < DAYS.length; d++) {
    if (h < goldByDay[d]) goldOrder[`${d}-${h}`] = order++;
  }

  return (
    <AbsoluteFill style={{ padding: "0 7%", justifyContent: "center", alignItems: "center" }}>
      {/* kicker */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: blue, textTransform: "uppercase", opacity: head.opacity, transform: `translateY(${head.y}px)`, marginBottom: 28 }}>
        {data?.kicker ?? "First — find the leak"}
      </div>

      {/* week grid */}
      <div style={{ width: "100%", display: "flex", gap: 14, justifyContent: "center", marginBottom: 18 }}>
        {DAYS.map((day, d) => (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%" }}>
              {Array.from({ length: HOURS }).map((_, h) => {
                const isGold = h < goldByDay[d];
                const cellIn = progress(frame, fps, 4 + (d + h) * 1.2, 12);
                const shade = isGold ? ramp(frame, fShade + (goldOrder[`${d}-${h}`] ?? 0) * 2.0, 9) : 0;
                return (
                  <div key={h} style={{
                    height: 34, borderRadius: 6,
                    background: isGold ? mixHex("#1b2330", gold, shade) : "#161d27",
                    border: `1px solid ${isGold && shade > 0.5 ? gold : "#26303c"}`,
                    opacity: cellIn,
                  }} />
                );
              })}
            </div>
            <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 24, color: theme.color.textSecondary }}>{day}</div>
          </div>
        ))}
      </div>

      {/* grid legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: ramp(frame, fShade + 6, 12), marginBottom: 36 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: gold }} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 32, color: theme.color.textPrimary }}>
          {hoursLost}h / week on manual entry <span style={{ color: gold }}>· almost a quarter</span>
        </div>
      </div>

      {/* the cost counter + on-screen source */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: countIn, transform: `scale(${interpolate(countIn, [0, 1], [0.9, 1])})` }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 110, color: gold, letterSpacing: -2 }}>
          ${formatNumber(counted, 0, true)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: perIn, transform: `scale(${pop(frame, fPer, 0.14)})` }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textPrimary, background: `${gold}22`, border: `2px solid ${gold}`, borderRadius: 999, padding: "6px 18px" }}>per person / yr</div>
        </div>
      </div>
      <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 26, color: theme.color.textSecondary, marginTop: 16, opacity: ramp(frame, fCount + 8, 14) }}>
        source: {source}
      </div>
    </AbsoluteFill>
  );
};

/** Lerp two hex colors (frame-pure). */
function mixHex(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(pa.r + (pb.r - pa.r) * k)},${Math.round(pa.g + (pb.g - pa.g) * k)},${Math.round(pa.b + (pb.b - pa.b) * k)})`;
}
function parse(h: string) {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((x) => x + x).join("") : s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
