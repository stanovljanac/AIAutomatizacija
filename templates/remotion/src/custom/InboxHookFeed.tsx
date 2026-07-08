import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp } from "../lib/anim";

/**
 * Bespoke (011 S1 — THE HOOK, fork of HookFeedHype). MIRROR the viewer's feed: a full-bleed, fast
 * doom-scroll of AI "build me an app" hype — a faux social feed with a search bar reading
 * "build me an app", vibe-coding brag cards flying upward, floating </> code-glyph rain, and a small
 * source chip "vibe coding · Collins Word of the Year 2025". Instant recognition ("that IS my feed"),
 * constant motion, sets up the S2 flip ("so I asked mine the boring opposite"). Black+gold hook family.
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate (anim helpers + useCurrentFrame only —
 * no Date/Math.random), beats keyed to the narration sentence reveals (revealOn:"sentences"):
 *   reveals[0] "your whole feed is people asking AI to build them an app" → feed scrolls + glow
 *   reveals[2] "vibe-code me a startup by morning"                        → scroll accelerates
 * Caption burns in the bottom band → viewport clipped to the top ~75% + edge-faded. Final HOLDS.
 */
type Card = {
  handle: string;
  initial: string;
  tag: string;
  head: string;
  metric: string;
  views: string;
  hot?: boolean;
};

const CARDS: Card[] = [
  { handle: "@VibeCoderX", initial: "V", tag: "SHIPPED", head: "AI built my SaaS in 4 hours", metric: "0 → live", views: "2.4M views" },
  { handle: "@NoCodeKing", initial: "N", tag: "LIVE", head: "Vibe-coded a startup overnight", metric: "no code", views: "1.1M views", hot: true },
  { handle: "@PromptToApp", initial: "P", tag: "AD", head: "Describe it. Ship it. Profit.", metric: "1 prompt", views: "863K views" },
  { handle: "@FounderMode", initial: "F", tag: "#1 TODAY", head: "My app builds itself now", metric: "$0 → $9k", views: "1.8M views" },
  { handle: "@ShipFast", initial: "S", tag: "HOT", head: "Weekend project → real product", metric: "48 hrs", views: "742K views", hot: true },
  { handle: "@AnyoneBuilds", initial: "A", tag: "VIRAL", head: "Anyone can build apps now", metric: "x12 faster", views: "3.1M views" },
  { handle: "@DevlessDan", initial: "D", tag: "LIVE", head: "No engineers. Just prompts.", metric: "0 devs", views: "590K views", hot: true },
];

const GLYPHS = ["</>", "{ }", "( )", "=>", "[ ]", "#!"];

export const InboxHookFeed: React.FC<{ data?: { reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = (s: number) => s * fps;

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fBeat1 = rv[0] ?? 0; // "your whole feed is people asking AI to build them an app"
  const fBeat2 = rv[2] ?? t(3.6); // "vibe-code me a startup by morning"

  const gold = theme.color.highlight;
  const green = theme.color.accentSecondary;
  const ink = "#080705";

  const PAD_X = 70;
  const CARD_W = 1080 - PAD_X * 2;
  const VP_TOP = 402;
  const VP_H = 1050;
  const PITCH = 326;
  const SLOTS = 6;

  const S0 = 11;
  const accel = 5;
  const scroll = S0 * frame + accel * Math.max(0, frame - fBeat2);
  const baseIdx = Math.floor(scroll / PITCH);
  const frac = scroll - baseIdx * PITCH;

  const beatGlow = (f: number) => {
    let v = 0.18;
    for (const r of [fBeat1, fBeat2]) {
      const dt = (frame - r) / fps;
      if (dt < 0 || dt > 0.7) continue;
      const env = dt < 0.08 ? dt / 0.08 : 1 - interpolate(dt, [0.08, 0.7], [0, 1]);
      v = Math.max(v, 0.18 + 0.55 * env);
    }
    return v;
  };
  const glow = beatGlow(frame);
  const container = fadeUp(frame, fps, 0, 14, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, ${gold}${alpha(glow)} 0%, rgba(0,0,0,0) 60%)` }} />

      {/* floating </> code-glyph rain (deterministic, rising) */}
      {Array.from({ length: 15 }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed / 233280) * 1080;
        const sz = 20 + ((i * 37) % 30);
        const vy = 0.7 + ((i * 13) % 10) / 10;
        const span = height + 160;
        const y = ((i * 167 + frame * vy) % span);
        const yy = span - y - 80;
        const op = 0.05 + ((i * 7) % 9) / 90;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yy, fontFamily: theme.font.mono, fontWeight: 800, fontSize: sz, color: gold, opacity: op * container.opacity }}>
            {GLYPHS[i % GLYPHS.length]}
          </div>
        );
      })}

      <AbsoluteFill style={{ opacity: container.opacity }}>
        {/* top chrome */}
        <div style={{ position: "absolute", top: 150, left: PAD_X, right: PAD_X }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: gold, textTransform: "uppercase", marginBottom: 18 }}>
            Everyone's feed · right now
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 26px", background: theme.color.surface, border: `2px solid ${gold}55`, borderRadius: 999, boxShadow: `0 10px 30px rgba(0,0,0,0.45)` }}>
            <Icon name="magnifier" size={40} color={theme.color.textSecondary} accent={gold} />
            <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: theme.color.textPrimary }}>build me an app</div>
            <div style={{ width: 4, height: 44, marginLeft: -6, background: gold, opacity: frame % fps < fps / 2 ? 1 : 0 }} />
          </div>
          {/* source chip (D-026) */}
          <div style={{ marginTop: 14, fontFamily: theme.font.body, fontWeight: 600, fontSize: 22, color: theme.color.textSecondary, textAlign: "center" }}>
            “vibe coding” · Collins Word of the Year 2025
          </div>
        </div>

        {/* feed viewport */}
        <div style={{ position: "absolute", top: VP_TOP, left: 0, right: 0, height: VP_H, overflow: "hidden", WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 80%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 80%, transparent 100%)" }}>
          {Array.from({ length: SLOTS }).map((_, i) => {
            const card = CARDS[((baseIdx + i) % CARDS.length + CARDS.length) % CARDS.length];
            const y = i * PITCH - frac;
            return <AppCard key={i} card={card} y={y} w={CARD_W} padX={PAD_X} frame={frame} fps={fps} gold={gold} green={green} />;
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AppCard: React.FC<{ card: Card; y: number; w: number; padX: number; frame: number; fps: number; gold: string; green: string }> = ({ card, y, w, padX, frame, fps, gold, green }) => {
  const accent = card.hot ? green : gold;
  const pts = [0, 14, 8, 26, 20, 40];
  const dotI = Math.floor((frame / 6) % pts.length);
  return (
    <div style={{ position: "absolute", top: y, left: padX, width: w, height: 290, background: theme.color.surface, border: `2px solid ${accent}66`, borderLeft: `6px solid ${accent}`, borderRadius: 22, padding: "26px 30px", boxShadow: "0 14px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accent}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.heading, fontWeight: 900, fontSize: 30, color: "#0B0F14" }}>
          {card.initial}
        </div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 28, color: theme.color.textSecondary, flex: 1 }}>{card.handle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: theme.font.heading, fontWeight: 900, fontSize: 22, letterSpacing: 1, color: accent, border: `2px solid ${accent}`, borderRadius: 999, padding: "4px 14px" }}>
          {card.hot && <span style={{ width: 10, height: 10, borderRadius: "50%", background: green, opacity: frame % fps < fps / 2 ? 1 : 0.25 }} />}
          {card.tag}
        </div>
      </div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 50, lineHeight: 1.05, color: theme.color.textPrimary }}>{card.head}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={120} height={40} viewBox="0 0 120 40" style={{ overflow: "visible" }}>
          <polyline points={pts.map((p, i) => `${i * 22},${40 - p}`).join(" ")} fill="none" stroke={green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={dotI * 22} cy={40 - pts[dotI]} r={6} fill={green} />
        </svg>
        <div style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: `15px solid ${green}` }} />
        <div style={{ fontFamily: theme.font.mono, fontWeight: 800, fontSize: 34, color: green }}>{card.metric}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 24, color: theme.color.textSecondary }}>{card.views}</div>
      </div>
    </div>
  );
};

function alpha(x: number) {
  const v = Math.max(0, Math.min(255, Math.round(x * 255)));
  return v.toString(16).padStart(2, "0");
}
