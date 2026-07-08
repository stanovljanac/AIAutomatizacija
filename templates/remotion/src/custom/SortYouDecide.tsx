import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (011 S6 — the honest catch). Model-agnostic + FREE, visualized: two input chips — "any AI
 * model" + "your inbox rules" — slot into one loop that outputs a 6-item "Needs you" shortlist a
 * person still ticks ("it sorts, you decide"). NO paid app names on-screen ([[no-paid-saas-products]]).
 * Lands brief.takeaway (won't ship a startup / won't replace your judgment). Calmer than S1.
 *
 * Portrait-first, frame-pure. Beats key off narration reveals (4 sentences, post the
 * owner's no-announced-honesty rewrite 2026-07-07):
 *   [0] "won't ship you a startup / won't replace your judgment" · [1] "does the sorting,
 *   hands you the six" → shortlist · [2] "any model, your own rules" → chips pulse ·
 *   [3] "unsexy — that's the point" (series signature). Final HOLDS.
 */
type Data = { kicker?: string; reveals?: number[] };

export const SortYouDecide: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  // chips + loop are the scene's furniture — in EARLY so the frame is never sparse
  // (perceptual QA 011: first ~6s showed only a kicker + pill). The "any model, your own
  // inbox rules" beat (rv[3]) PULSES the chips instead of introducing them.
  const fChips = (rv[0] ?? 0) + 10;
  const fPulse = rv[2] ?? t(5.0); // "any model, your own inbox rules" → chips pulse
  const fList = rv[1] ?? t(3.2); // "hands you the six that matter"
  const fTick = (rv[1] ?? t(3.2)) + 18; // the human ticks

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;
  const head = fadeUp(frame, fps, 0, 16);
  const loopIn = progress(frame, fps, (rv[0] ?? 0) + 6, 16);
  const chipA = progress(frame, fps, fChips, 14);
  const chipB = progress(frame, fps, fChips + 8, 14);
  const listIn = progress(frame, fps, fList, 16);
  // frame-pure pulse envelope on the "any model" beat (~0.7s)
  const pulseT = (frame - fPulse) / fps;
  const chipPulse = pulseT >= 0 && pulseT < 0.7 ? 1 + 0.05 * Math.sin((pulseT / 0.7) * Math.PI) : 1;

  const Chip: React.FC<{ icon: any; label: string; sub: string; p: number }> = ({ icon, label, sub, p }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 26px", borderRadius: 16, background: theme.color.surface, border: `3px solid ${blue}`, opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)` }}>
      <Icon name={icon} size={44} color={blue} accent={mint} />
      <div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textPrimary }}>{label}</div>
        <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 24, color: theme.color.textSecondary }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: "5% 8% 15%", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 36, letterSpacing: 5, textTransform: "uppercase", color: gold, marginBottom: 34, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
        {data?.kicker ?? "What it won't do"}
      </div>

      {/* two swappable inputs — pulse on the "any model, your own inbox rules" beat */}
      <div style={{ display: "flex", gap: 20, marginBottom: 22, transform: `scale(${chipPulse})` }}>
        <Chip icon="ai" label="Any AI model" sub="swap freely" p={chipA} />
        <Chip icon="gear" label="Your inbox rules" sub="your own filters" p={chipB} />
      </div>

      {/* the loop */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "22px 34px", borderRadius: 999, background: `${blue}18`, border: `3px solid ${blue}`, opacity: loopIn, marginBottom: 22 }}>
        <Icon name="gear" size={48} color={blue} accent={mint} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: theme.color.textPrimary }}>one boring triage loop</div>
      </div>

      {/* the shortlist it hands you */}
      <div style={{ width: "100%", padding: "26px 30px", borderRadius: 20, background: `${gold}12`, border: `3px solid ${gold}`, opacity: listIn }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Icon name="flag" size={40} color={gold} accent={gold} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: gold }}>Needs you today · 6</div>
        </div>
        {["Client — Following up…", "Refund request", "Contract to sign", "Reply by 5pm", "Partner intro", "Invoice question"].map((row, i) => {
          const ticked = frame >= fTick + i * 3;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 4px", opacity: listIn }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, border: `3px solid ${ticked ? mint : theme.color.textSecondary}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ticked && <Icon name="check" size={26} color={mint} accent={mint} />}
              </div>
              <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 32, color: theme.color.textPrimary }}>{row}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontFamily: theme.font.heading, fontWeight: 800, fontSize: 32, color: mint }}>
          <Icon name="person" size={36} color={mint} accent={mint} /> you still decide
        </div>
      </div>
    </AbsoluteFill>
  );
};
