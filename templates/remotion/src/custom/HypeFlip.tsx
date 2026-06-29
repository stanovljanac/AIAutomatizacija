import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress, ramp, pop } from "../lib/anim";

/**
 * Bespoke (009 S2 — the FLIP). The angle surfaces here: the feed of get-rich hype gets struck
 * out and replaced by the boring reality — money quietly LEAKING out of a small business.
 * Concrete, not a "do the opposite" title card: gold hype cards desaturate + strike, then a
 * blue/mint "reality" panel slides up showing an overdue invoice with a live red leak drip.
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate (anim helpers only — no Date/random),
 * beats keyed to the narration sentence reveals (revealOn:"sentences"):
 *   reveals[0] "do the opposite" → hype strikes out · reveals[1] "stop money leaking" → reality
 *   panel + leak · reveals[2] "no money printer" → printer✕ chip · reveals[3] "I ran it" → run pill.
 * Falls back to fixed cadence when reveals are absent (standalone preview). Final state HOLDS.
 */
type Hype = { icon: IconName; label: string };
type Data = {
  kicker?: string;
  hype?: Hype[];
  reality?: { file?: string; label?: string; amount?: string; note?: string };
  reveals?: number[];
};

const DEFAULT_HYPE: Hype[] = [
  { icon: "chart", label: "Trading bot  +480%" },
  { icon: "money", label: "$ while you sleep" },
  { icon: "factory", label: "Side hustle  $10k/mo" },
];

export const HypeFlip: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const hype = data?.hype ?? DEFAULT_HYPE;
  const reality = data?.reality ?? { file: "expenses.xlsx", label: "Invoice #1042", amount: "−$1,240", note: "3 weeks overdue" };

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fStrike = rv[0] ?? t(1.2); // hype struck out
  const fReality = Math.max(rv[1] ?? t(3.0), fStrike + 14); // boring reality panel slides up
  const fPrinter = Math.max(rv[2] ?? t(5.4), fReality + 10); // "no money printer"
  const fRan = Math.max(rv[3] ?? t(6.6), fPrinter + 8); // "I actually ran it"

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;
  const RED = "#FF5C5C";

  const head = fadeUp(frame, fps, 0, 16);
  const struck = ramp(frame, fStrike, 14); // 0 → 1 hype desaturates + strike draws
  const realIn = progress(frame, fps, fReality, 20);
  const printerIn = progress(frame, fps, fPrinter, 16);
  const ranIn = progress(frame, fps, fRan, 16);

  // live red leak drip — frame-pure falling droplets (deterministic), only after the reality panel
  const dripActive = frame >= fReality + 8;
  const drip = (phase: number) => {
    const period = 46;
    const local = (frame - fReality - 8 + phase * 16) % period;
    const p = local < 0 ? 0 : local / period;
    return { y: interpolate(p, [0, 1], [0, 120]), o: dripActive ? interpolate(p, [0, 0.15, 0.8, 1], [0, 1, 1, 0]) : 0 };
  };

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center", alignItems: "center" }}>
      {/* kicker */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: mint, opacity: head.opacity, transform: `translateY(${head.y}px)`, marginBottom: 26, textTransform: "uppercase" }}>
        {data?.kicker ?? "So I asked mine to"}
      </div>

      {/* the flip line: make money (struck) → stop the leak */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40, opacity: head.opacity }}>
        <div style={{ position: "relative", fontFamily: theme.font.heading, fontWeight: 900, fontSize: 58, color: interpolateColor(struck, gold, theme.color.textSecondary) }}>
          make money
          {/* strike-through draws on */}
          <div style={{ position: "absolute", top: "52%", left: 0, height: 6, width: `${struck * 100}%`, background: RED, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: -22, marginBottom: 34, opacity: struck, transform: `translateY(${interpolate(struck, [0, 1], [16, 0])}px)` }}>
        <Icon name="arrow" size={44} color={mint} accent={mint} style={{ transform: "rotate(90deg)" }} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 64, color: mint }}>stop the leak</div>
      </div>

      {/* hype cards — desaturate + dim as struck rises */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
        {hype.map((h, i) => {
          const cardIn = fadeUp(frame, fps, 4 + i * 4, 16);
          const dim = interpolate(struck, [0, 1], [1, 0.32]);
          const sat = interpolate(struck, [0, 1], [1, 0]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderRadius: 14, background: `${gold}14`, border: `2px solid ${gold}`, opacity: cardIn.opacity * dim, filter: `grayscale(${1 - sat})`, transform: `translateY(${cardIn.y}px)` }}>
              <Icon name={h.icon} size={38} color={gold} accent={gold} />
              <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.textPrimary, flex: 1 }}>{h.label}</div>
              <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 30, color: gold }}>hype</div>
            </div>
          );
        })}
      </div>

      {/* reality panel — slides up, with a live red leak drip */}
      <div style={{ width: "100%", position: "relative", background: theme.color.surface, border: `2px solid ${blue}`, borderRadius: 18, padding: 24, opacity: realIn, transform: `translateY(${interpolate(realIn, [0, 1], [40, 0])}px)`, boxShadow: "0 16px 44px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Icon name="spreadsheet" size={36} color={theme.color.textSecondary} accent={blue} />
          <div style={{ fontFamily: theme.font.mono, fontWeight: 700, fontSize: 28, color: theme.color.textSecondary, flex: 1 }}>{reality.file}</div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 24, color: RED, border: `2px solid ${RED}`, borderRadius: 999, padding: "4px 14px" }}>leaking</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: theme.color.bg, borderRadius: 12, borderLeft: `5px solid ${RED}` }}>
          <Icon name="invoice" size={34} color={RED} accent={RED} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 32, color: theme.color.textPrimary, flex: 1 }}>{reality.label}</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: theme.font.mono, fontWeight: 800, fontSize: 34, color: RED }}>{reality.amount}</div>
            <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 22, color: theme.color.textSecondary }}>{reality.note}</div>
          </div>
        </div>
        {/* leak droplets */}
        {[0, 1, 2].map((ph) => {
          const d = drip(ph);
          return <div key={ph} style={{ position: "absolute", left: `${28 + ph * 8}%`, bottom: -6, width: 12, height: 16, borderRadius: "0 0 6px 6px", background: RED, opacity: d.o, transform: `translateY(${d.y}px)` }} />;
        })}
      </div>

      {/* no money printer + I ran it */}
      <div style={{ display: "flex", gap: 16, marginTop: 28, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 999, background: `${RED}1c`, border: `2px solid ${RED}`, opacity: printerIn, transform: `scale(${interpolate(printerIn, [0, 1], [0.8, 1])})` }}>
          <Icon name="factory" size={30} color={RED} accent={RED} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, color: theme.color.textPrimary }}>no money printer</div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 30, color: RED }}>✕</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 22px", borderRadius: 999, background: `${mint}1c`, border: `2px solid ${mint}`, opacity: ranIn, transform: `scale(${pop(frame, fRan, 0.12) * interpolate(ranIn, [0, 1], [0.85, 1])})` }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 28, color: mint }}>▶ I ran it</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Lerp between two hex colors (frame-pure). Used for the "make money" gold → grey desaturation. */
function interpolateColor(t: number, a: string, b: string): string {
  const pa = hex(a);
  const pb = hex(b);
  const c = (k: "r" | "g" | "b") => Math.round(pa[k] + (pb[k] - pa[k]) * Math.max(0, Math.min(1, t)));
  return `rgb(${c("r")},${c("g")},${c("b")})`;
}
function hex(h: string) {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((x) => x + x).join("") : s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
