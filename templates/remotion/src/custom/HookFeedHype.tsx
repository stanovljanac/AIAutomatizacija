import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp } from "../lib/anim";

/**
 * Bespoke (009 S1 — THE HOOK). Business-strategist opener: MIRROR the viewer's own feed.
 * A full-bleed, fast doom-scroll of AI "get-rich" hype — a faux social feed with a search bar
 * reading "make me money with AI", hype cards flying upward (pumping green charts, fake viral
 * metrics, $ rain). Instant recognition ("that IS my feed"), constant motion, and it sets up the
 * S2 flip ("so I asked mine to do the opposite"). Replaces the old static "make me money" title
 * card ([[no-title-card-scenes]], [[video-dynamism-and-length]]). Black+gold (hook family).
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate (anim helpers + useCurrentFrame only —
 * no Date/Math.random), beats keyed to the narration sentence reveals (revealOn:"sentences"):
 *   reveals[0] "your whole feed is people asking AI to make them money" → feed scrolls + glow
 *   reveals[1] "trading bots, side hustles, money while you sleep"      → scroll accelerates +
 *                                                                          three tagged chips punch in
 * Captions burn in the bottom band → the feed viewport is clipped to the top ~75% and faded at
 * both edges, so cards never collide with the caption. Final state HOLDS (master owns the cut).
 */
type Card = {
  handle: string;
  initial: string;
  tag: string;
  head: string;
  metric: string;
  views: string;
  hot?: boolean; // green "pump" accent + LIVE blink (crypto-flavored)
};

const CARDS: Card[] = [
  { handle: "@AIWealthGuru", initial: "A", tag: "VIRAL", head: "$10,000 / month with AI", metric: "+480%", views: "2.4M views" },
  { handle: "@CryptoSensei", initial: "C", tag: "LIVE", head: "AI trading bot prints cash", metric: "+1,240%", views: "1.1M views", hot: true },
  { handle: "@PassivePro", initial: "P", tag: "AD", head: "Make money while you sleep", metric: "24/7", views: "863K views" },
  { handle: "@SideHustleKing", initial: "S", tag: "#1 TODAY", head: "Quit your job in 30 days", metric: "$0 → $9k", views: "1.8M views" },
  { handle: "@BotBuilder", initial: "B", tag: "HOT", head: "Set it once, get rich", metric: "+999%", views: "742K views", hot: true },
  { handle: "@FreedomFinance", initial: "F", tag: "VIRAL", head: "AI side hustle on autopilot", metric: "x12", views: "3.1M views" },
  { handle: "@QuantWhiz", initial: "Q", tag: "LIVE", head: "Beat the market with AI", metric: "+360%", views: "590K views", hot: true },
];

export const HookFeedHype: React.FC<{ data?: { reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = (s: number) => s * fps;

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fBeat1 = rv[0] ?? 0; // "your whole feed…"
  const fBeat2 = rv[1] ?? t(4.3); // "trading bots, side hustles, money while you sleep"

  const gold = theme.color.highlight;
  const green = theme.color.accentSecondary;
  const ink = "#080705"; // warm near-black (black+gold hook family)

  // ── layout (px on the 1080×1920 canvas) ──────────────────────────────────────
  const PAD_X = 70;
  const CARD_W = 1080 - PAD_X * 2;
  const VP_TOP = 372; // feed viewport top (search chrome sits above)
  const VP_H = 1080; // viewport height → bottom at 1452 (~75.6%), caption band is below
  const PITCH = 326; // card height + gap
  const SLOTS = 6;

  // ── endless deterministic scroll. Slope steps UP at beat 2 (overwhelm), stays continuous. ──
  const S0 = 11; // px/frame baseline
  const accel = 5; // extra px/frame after beat 2
  const scroll = S0 * frame + accel * Math.max(0, frame - fBeat2);
  const baseIdx = Math.floor(scroll / PITCH);
  const frac = scroll - baseIdx * PITCH;

  // ── beat glow: gold radial lift on each narration beat (frame-pure pulse) ──────
  const beatGlow = (f: number) => {
    let v = 0.18; // ambient
    for (const r of [fBeat1, fBeat2]) {
      const dt = (frame - r) / fps;
      if (dt < 0 || dt > 0.7) continue;
      const env = dt < 0.08 ? dt / 0.08 : 1 - interpolate(dt, [0.08, 0.7], [0, 1]);
      v = Math.max(v, 0.18 + 0.55 * env);
    }
    return v;
  };
  const glow = beatGlow(frame);

  const container = fadeUp(frame, fps, 0, 14, 0); // soft start (no hard cut from intro)

  return (
    <AbsoluteFill style={{ backgroundColor: ink, overflow: "hidden" }}>
      {/* warm gold glow that lifts on the beats */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 30%, ${gold}${alpha(glow)} 0%, rgba(0,0,0,0) 60%)`,
        }}
      />
      {/* rising "$" rain — ambient money storm behind the feed (deterministic, parallax) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed / 233280) * 1080;
        const sz = 22 + ((i * 37) % 40);
        const vy = 0.7 + ((i * 13) % 10) / 10; // px/frame
        const span = height + 160;
        const y = ((i * 167 + frame * vy) % span);
        const yy = span - y - 80; // travel upward
        const op = 0.05 + ((i * 7) % 9) / 90;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: yy,
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: sz,
              color: gold,
              opacity: op * container.opacity,
            }}
          >
            $
          </div>
        );
      })}

      <AbsoluteFill style={{ opacity: container.opacity }}>
        {/* ── top chrome: "everyone is searching this" ─────────────────────────── */}
        <div style={{ position: "absolute", top: 150, left: PAD_X, right: PAD_X }}>
          <div
            style={{
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 5,
              color: gold,
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Everyone's feed · right now
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 26px",
              background: theme.color.surface,
              border: `2px solid ${gold}55`,
              borderRadius: 999,
              boxShadow: `0 10px 30px rgba(0,0,0,0.45)`,
            }}
          >
            <Icon name="magnifier" size={40} color={theme.color.textSecondary} accent={gold} />
            <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: theme.color.textPrimary }}>
              make me money with AI
            </div>
            {/* blinking caret (frame-pure) */}
            <div
              style={{
                width: 4,
                height: 44,
                marginLeft: -6,
                background: gold,
                opacity: frame % fps < fps / 2 ? 1 : 0,
              }}
            />
          </div>
        </div>

        {/* ── the feed viewport: endless fast doom-scroll of hype, clipped + edge-faded ── */}
        <div
          style={{
            position: "absolute",
            top: VP_TOP,
            left: 0,
            right: 0,
            height: VP_H,
            overflow: "hidden",
            // fade cards as they enter (bottom) and exit (top) the viewport
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 80%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 80%, transparent 100%)",
          }}
        >
          {Array.from({ length: SLOTS }).map((_, i) => {
            const card = CARDS[((baseIdx + i) % CARDS.length + CARDS.length) % CARDS.length];
            const y = i * PITCH - frac;
            return <HypeCard key={i} card={card} y={y} w={CARD_W} padX={PAD_X} frame={frame} fps={fps} gold={gold} green={green} />;
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** One hype "post" in the feed — frame-pure; only the LIVE dot + sparkline dot move internally. */
const HypeCard: React.FC<{
  card: Card;
  y: number;
  w: number;
  padX: number;
  frame: number;
  fps: number;
  gold: string;
  green: string;
}> = ({ card, y, w, padX, frame, fps, gold, green }) => {
  const accent = card.hot ? green : gold;
  // tiny rising "pump" sparkline — 6 points climbing, a glowing dot rides the crest
  const pts = [0, 14, 8, 26, 20, 40];
  const dotI = Math.floor((frame / 6) % pts.length);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: padX,
        width: w,
        height: 290,
        background: theme.color.surface,
        border: `2px solid ${accent}66`,
        borderLeft: `6px solid ${accent}`,
        borderRadius: 22,
        padding: "26px 30px",
        boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* header: avatar + handle + tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accent}, ${accent}55)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: 30,
            color: "#0B0F14",
          }}
        >
          {card.initial}
        </div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 28, color: theme.color.textSecondary, flex: 1 }}>
          {card.handle}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 1,
            color: accent,
            border: `2px solid ${accent}`,
            borderRadius: 999,
            padding: "4px 14px",
          }}
        >
          {card.hot && (
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: green, opacity: frame % fps < fps / 2 ? 1 : 0.25 }} />
          )}
          {card.tag}
        </div>
      </div>

      {/* the hype headline */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 50, lineHeight: 1.05, color: theme.color.textPrimary }}>
        {card.head}
      </div>

      {/* footer: pump sparkline + metric + views */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={120} height={40} viewBox="0 0 120 40" style={{ overflow: "visible" }}>
          <polyline
            points={pts.map((p, i) => `${i * 22},${40 - p}`).join(" ")}
            fill="none"
            stroke={green}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={dotI * 22} cy={40 - pts[dotI]} r={6} fill={green} />
        </svg>
        {/* up triangle (CSS, no font/emoji) */}
        <div style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: `15px solid ${green}` }} />
        <div style={{ fontFamily: theme.font.mono, fontWeight: 800, fontSize: 34, color: green }}>{card.metric}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 24, color: theme.color.textSecondary }}>{card.views}</div>
      </div>
    </div>
  );
};

/** 0..1 → 2-digit hex alpha for inline rgba-in-hex (e.g. `${gold}${alpha(x)}`). */
function alpha(x: number) {
  const v = Math.max(0, Math.min(255, Math.round(x * 255)));
  return v.toString(16).padStart(2, "0");
}
