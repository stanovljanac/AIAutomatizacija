import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp, progress, ramp, pop } from "../lib/anim";

/**
 * Bespoke (009 S6 — the honest catch). Replaces the title card with a CALLBACK to S3's week grid:
 * the ~9 gold "lost" hours flip back to mint ("given back"), under struck-out "10× income" and
 * "replace you" chips — the sensible, non-preachy takeaway ([[sensible-takeaway-not-preachy]]):
 * not 10×, not your job — just the quarter of the week you were losing, handed back, every week.
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate. Beats key to the narration sentence
 * reveals (revealOn:"sentences"):
 *   reveals[0] "honest part" → kicker · reveals[1] "won't 10× / replace you" → struck chips ·
 *   reveals[2] "hands back the quarter" → grid flips gold→mint · reveals[3] "every week" → loop ·
 *   reveals[4] "unsexy / the point". Fixed-cadence fallback; final state HOLDS.
 */
type Data = { kicker?: string; hoursBack?: number; reveals?: number[] };

const DAYS = 5;
const HOURS = 8;

export const TimeReturned: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const hoursBack = data?.hoursBack ?? 9;

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fKick = rv[0] ?? t(0.2);
  const fStrike = Math.max(rv[1] ?? t(1.8), fKick + 12); // won't 10× / replace you
  const fFlip = Math.max(rv[2] ?? t(4.2), fStrike + 16); // grid flips gold → mint
  const fEvery = Math.max(rv[3] ?? t(6.6), fFlip + 18); // every week
  const fPoint = Math.max(rv[4] ?? t(7.8), fEvery + 12); // unsexy — the point

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const RED = "#FF5C5C";

  const goldByDay = Array.from({ length: DAYS }, (_, d) => {
    const base = Math.floor(hoursBack / DAYS);
    return base + (d < hoursBack % DAYS ? 1 : 0);
  });

  const kick = fadeUp(frame, fps, Math.max(fKick, 0), 14);
  const strikeIn = progress(frame, fps, fStrike, 14);
  const everyIn = progress(frame, fps, fEvery, 14);
  const pointIn = progress(frame, fps, fPoint, 14);

  let order = 0;
  const flipOrder: Record<string, number> = {};
  for (let h = 0; h < HOURS; h++) for (let d = 0; d < DAYS; d++) if (h < goldByDay[d]) flipOrder[`${d}-${h}`] = order++;

  const StruckChip: React.FC<{ text: string }> = ({ text }) => (
    <div style={{ position: "relative", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textSecondary, background: theme.color.surface, border: `2px solid #2a3340`, borderRadius: 999, padding: "10px 22px" }}>
      {text}
      <div style={{ position: "absolute", top: "50%", left: 12, height: 4, width: `calc(${strikeIn * 100}% - 24px)`, background: RED, borderRadius: 2 }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: "0 7%", justifyContent: "center", alignItems: "center" }}>
      {/* kicker */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: mint, textTransform: "uppercase", opacity: kick.opacity, transform: `translateY(${kick.y}px)`, marginBottom: 24 }}>
        {data?.kicker ?? "The honest part"}
      </div>

      {/* struck chips: won't 10× / won't replace you */}
      <div style={{ display: "flex", gap: 16, marginBottom: 34, opacity: interpolate(strikeIn, [0, 1], [0.4, 1]) }}>
        <StruckChip text="10× your income" />
        <StruckChip text="replace you" />
      </div>

      {/* week grid: lost hours flip gold → mint */}
      <div style={{ width: "100%", display: "flex", gap: 14, justifyContent: "center", marginBottom: 22 }}>
        {Array.from({ length: DAYS }).map((_, d) => (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            {Array.from({ length: HOURS }).map((_, h) => {
              const lost = h < goldByDay[d];
              const cellIn = progress(frame, fps, 2 + (d + h), 12);
              const flip = lost ? ramp(frame, fFlip + (flipOrder[`${d}-${h}`] ?? 0) * 2.0, 9) : 0;
              const col = lost ? mixHex(gold, mint, flip) : "#161d27";
              return <div key={h} style={{ height: 34, borderRadius: 6, background: lost ? mixHex("#1b2330", col, 1) : col, border: `1px solid ${lost ? (flip > 0.5 ? mint : gold) : "#26303c"}`, opacity: cellIn }} />;
            })}
          </div>
        ))}
      </div>

      {/* +hours back */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: ramp(frame, fFlip + 8, 12), marginBottom: 30 }}>
        <Icon name="clock" size={44} color={mint} accent={mint} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 52, color: mint }}>+{hoursBack}h / week back</div>
      </div>

      {/* every week loop + the point */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: everyIn, transform: `scale(${pop(frame, fEvery, 0.12)})`, marginBottom: 18 }}>
        <Icon name="gear" size={34} color={mint} accent={mint} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 36, color: theme.color.textPrimary }}>every week</div>
      </div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textSecondary, opacity: pointIn }}>
        unsexy — <span style={{ color: gold }}>that's exactly the point</span>
      </div>
    </AbsoluteFill>
  );
};

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
