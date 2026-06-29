import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress, ramp, pop } from "../lib/anim";

/**
 * Bespoke (009 S5 — why it's money). Replaces the title card with the CAUSAL CASCADE the script
 * asked for: one mistyped cell → a wrong invoice → never paid, built top-to-bottom with connecting
 * arrows so the causality is SHOWN, not implied ([[proof-must-be-visible]]). Carries the on-screen
 * source for the 4% / 1-in-25 stat (D-026).
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate. Beats key to the narration sentence
 * reveals (revealOn:"sentences"):
 *   reveals[0]/[1] "never earned a cent / stopped the bleed" → framing · reveals[2] "4% / 1 in 25"
 *   → stat chip · reveals[3..5] "one typo / one wrong invoice / never paid" → the cascade builds.
 * Fixed-cadence fallback for standalone preview; final state HOLDS.
 */
type Step = { icon: IconName; label: string; detail: string; sub?: string; stamp?: boolean };
type Data = { stat?: string; source?: string; steps?: Step[]; reveals?: number[] };

const DEFAULT_STEPS: Step[] = [
  { icon: "spreadsheet", label: "One typo", detail: "$1,24O", sub: "cell B7 — an O, not a 0" },
  { icon: "invoice", label: "One wrong invoice", detail: "−$1,240", sub: "sent anyway" },
  { icon: "money", label: "Never paid", detail: "−$1,240", sub: "gone", stamp: true },
];

export const ErrorCascade: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const steps = data?.steps ?? DEFAULT_STEPS;
  const stat = data?.stat ?? "Up to 4% of fields go in wrong · 1 in 25";
  const source = data?.source ?? "industry benchmarks";

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fFrame = rv[0] ?? t(0.4); // framing line
  const fStat = Math.max(rv[2] ?? t(2.4), fFrame + 14); // stat chip
  // the three cascade steps land on reveals[3],[4],[5] (fallback: spaced after the stat)
  const stepAt = (i: number) => Math.max(rv[3 + i] ?? fStat + 18 + i * 22, fStat + 12 + i * 18);

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const RED = "#FF5C5C";

  const frameIn = fadeUp(frame, fps, Math.max(fFrame, 0), 14);
  const statIn = progress(frame, fps, fStat, 16);

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center", alignItems: "center" }}>
      {/* framing: never earned a cent → stopped the bleed */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, opacity: frameIn.opacity, transform: `translateY(${frameIn.y}px)` }}>
        <span style={{ position: "relative", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textSecondary }}>
          never earned a cent
          <div style={{ position: "absolute", top: "52%", left: 0, height: 4, width: "100%", background: theme.color.textSecondary, borderRadius: 2 }} />
        </span>
        <Icon name="arrow" size={34} color={mint} accent={mint} />
        <span style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 38, color: mint }}>stopped the bleed</span>
      </div>

      {/* stat chip with on-screen source */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 30, opacity: statIn, transform: `scale(${interpolate(statIn, [0, 1], [0.9, 1])})` }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 36, color: theme.color.textPrimary, background: `${gold}1c`, border: `2px solid ${gold}`, borderRadius: 14, padding: "12px 24px", textAlign: "center" }}>
          {stat}
        </div>
        <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 24, color: theme.color.textSecondary }}>source: {source}</div>
      </div>

      {/* the cascade */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {steps.map((s, i) => {
          const at = stepAt(i);
          const inP = progress(frame, fps, at, 16);
          const arrowDraw = ramp(frame, at - 4, 12);
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "center", opacity: arrowDraw, transform: `translateY(${interpolate(arrowDraw, [0, 1], [-8, 0])}px)` }}>
                  <Icon name="arrow" size={46} color={RED} accent={RED} style={{ transform: "rotate(90deg)" }} />
                </div>
              )}
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", borderRadius: 16, background: theme.color.surface, border: `2px solid ${s.stamp ? RED : "#2a3340"}`, opacity: inP, transform: `translateY(${interpolate(inP, [0, 1], [26, 0])}px) scale(${s.stamp ? pop(frame, at, 0.06) : 1})` }}>
                <Icon name={s.icon} size={48} color={s.stamp ? RED : gold} accent={s.stamp ? RED : gold} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 40, color: theme.color.textPrimary }}>{s.label}</div>
                  {s.sub && <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 26, color: theme.color.textSecondary, marginTop: 2 }}>{s.sub}</div>}
                </div>
                {s.stamp ? (
                  <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 34, color: RED, border: `3px solid ${RED}`, borderRadius: 10, padding: "6px 16px", transform: "rotate(-6deg)" }}>{s.detail}</div>
                ) : (
                  <div style={{ fontFamily: theme.font.mono, fontWeight: 800, fontSize: 38, color: highlightTypo(s.detail) ? RED : theme.color.textPrimary }}>
                    {renderDetail(s.detail)}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The typo step's value contains a letter 'O' — flag it so we can paint the cell red. */
function highlightTypo(detail: string): boolean {
  return /O/.test(detail);
}
/** Render the detail, painting any stray letter 'O' (the typo) in a brighter red so it reads. */
function renderDetail(detail: string): React.ReactNode {
  if (!/O/.test(detail)) return detail;
  return detail.split(/(O)/).map((part, i) =>
    part === "O" ? <span key={i} style={{ color: "#FF8A8A", textDecoration: "underline" }}>O</span> : <span key={i}>{part}</span>
  );
}
