import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import {
  fadeUp,
  progress,
  ramp,
  springPreset,
  countUp,
  pop,
  motionScale,
  splitNumeric,
  formatNumber,
} from "../lib/anim";
import { useMotion } from "../lib/motion";

/** scene-local reveal frame for sub-element i: builder-provided `reveals[i]`
 * (synced to the narration), else a fixed fallback stagger. */
const revealDelay = (reveals: number[] | undefined, i: number, fallback: number) =>
  reveals && reveals[i] != null ? reveals[i] : fallback;

/** A short SVG connector (line + arrowhead) that DRAWS ON left→right via strokeDashoffset.
 * `p` is 0→1 progress (from a ramp/spring). Deterministic + contained, so it works between
 * flex nodes without measuring layout. Used by Flow + Diagram. */
const ConnectorArrow: React.FC<{ p: number; w: number; color?: string }> = ({ p, w, color = theme.color.accent }) => {
  const len = Math.max(w - 12, 1);
  return (
    <svg width={w} height={28} style={{ overflow: "visible" }}>
      <line
        x1={2}
        y1={14}
        x2={w - 12}
        y2={14}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - p)}
      />
      <path
        d={`M ${w - 16} 6 L ${w - 2} 14 L ${w - 16} 22`}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={p > 0.85 ? (p - 0.85) / 0.15 : 0}
      />
    </svg>
  );
};

/**
 * The fixed scene-template library (DECISIONS D-013). Each `template` name maps
 * deterministically to ONE component here; the agent only fills `props`
 * (scene-plan.json). Visual language = style/VISUAL_IDENTITY.md.
 *
 * Every component fills the frame and animates from its own Sequence-local frame,
 * so it works wherever the renderer places it in time.
 */

// Transparent frame — the global BackgroundFX (in Main) shows through so scenes
// crossfade cleanly (D-022). No per-scene background. On 16:9 we reserve a bottom
// caption safe-zone (content biases upward) so captions never sit over the graphics;
// the vertical Short keeps its existing centered layout.
const Frame: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return (
    <AbsoluteFill
      style={{
        padding: vertical ? "0 9%" : "0 9% 210px 9%",
        justifyContent: "center",
        alignItems: center ? "center" : "flex-start",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ text?: string; o: number }> = ({ text, o }) =>
  text ? (
    <div style={{ fontFamily: theme.font.body, fontWeight: 700, letterSpacing: 6, fontSize: 26, color: theme.color.accentSecondary, opacity: o, marginBottom: 16 }}>
      {text.toUpperCase()}
    </div>
  ) : null;

// ── hook-card (word-by-word kinetic entrance + accent underline draw) ────────
export const HookCard: React.FC<{ data: { kicker?: string; title: string; subtitle?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = motionScale(useMotion().intensity);
  const k = fadeUp(frame, fps, 0, 14);
  const words = data.title.split(" ");
  const lastWordAt = 8 + words.length * 3;
  const u = ramp(frame, lastWordAt, 16); // underline draws on after the words land
  const s = fadeUp(frame, fps, lastWordAt + 10, 18);
  return (
    <Frame>
      <Kicker text={data.kicker ?? "The Automation Desk"} o={k.opacity} />
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 92, lineHeight: 1.06, color: theme.color.textPrimary }}>
        {words.map((w, i) => {
          const p = springPreset(frame, fps, 8 + i * 3, "snappy");
          return (
            <span key={i} style={{ display: "inline-block", marginRight: "0.28em", opacity: p, transform: `translateY(${(1 - p) * 28 * ms}px)` }}>{w}</span>
          );
        })}
      </div>
      <div style={{ height: 8, marginTop: 20, width: `${u * 100}%`, maxWidth: 620, background: `linear-gradient(90deg, ${theme.color.accent}, ${theme.color.accentSecondary})`, borderRadius: 4, transformOrigin: "left" }} />
      {data.subtitle && (
        <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 38, color: theme.color.textSecondary, marginTop: 26, transform: `translateY(${s.y}px)`, opacity: s.opacity }}>{data.subtitle}</div>
      )}
    </Frame>
  );
};

// ── section-header ──────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ data: { index?: number | string; title: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeUp(frame, fps, 0, 18);
  return (
    <Frame>
      {data.index !== undefined && (
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: theme.color.accent, opacity: a.opacity, marginBottom: 12 }}>{String(data.index).padStart(2, "0")}</div>
      )}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 80, lineHeight: 1.05, color: theme.color.textPrimary, transform: `translateY(${a.y}px)`, opacity: a.opacity }}>{data.title}</div>
    </Frame>
  );
};

// ── bullet-steps ────────────────────────────────────────────────────────────
export const BulletSteps: React.FC<{ data: { title?: string; items: string[]; reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 16);
  return (
    <Frame>
      {data.title && (
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 56, color: theme.color.textPrimary, marginBottom: 46, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>{data.title}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {data.items.map((it, i) => {
          const a = fadeUp(frame, fps, revealDelay(data.reveals, i, 18 + i * 30));
          const x = interpolate(a.opacity, [0, 1], [-44, 0]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, opacity: a.opacity, transform: `translateX(${x}px)` }}>
              <div style={{ flex: "0 0 auto", width: 58, height: 58, borderRadius: 15, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, color: theme.color.accent, fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 46, color: theme.color.textPrimary }}>{it}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── stat-callout (numbers COUNT UP and land with an emphasis pop) ────────────
export const StatCallout: React.FC<{ data: { value: string; label: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const calm = useMotion().intensity === "calm";
  const { prefix, num, suffix, decimals, grouped } = splitNumeric(data.value);
  const n = fadeUp(frame, fps, 2, 22);
  const s = fadeUp(frame, fps, 24, 18);
  const COUNT_DELAY = 8;
  const COUNT_DUR = 34;
  const display = num == null
    ? data.value
    : `${prefix}${formatNumber(countUp(frame, num, { delay: COUNT_DELAY, dur: COUNT_DUR }), decimals, grouped)}${suffix}`;
  const landed = num == null || calm ? 1 : pop(frame, COUNT_DELAY + COUNT_DUR, 0.08);
  return (
    <Frame center>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 200, color: theme.color.accent, opacity: n.opacity, transform: `translateY(${n.y}px) scale(${landed})`, fontVariantNumeric: "tabular-nums" }}>{display}</div>
      <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 46, color: theme.color.textPrimary, maxWidth: 1300, opacity: s.opacity, transform: `translateY(${s.y}px)` }}>{data.label}</div>
    </Frame>
  );
};

// ── term-highlight ──────────────────────────────────────────────────────────
export const TermHighlight: React.FC<{ data: { term: string; definition: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = fadeUp(frame, fps, 0, 18);
  const d = fadeUp(frame, fps, 16, 18);
  return (
    <Frame center>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 96, color: theme.color.highlight, opacity: t.opacity, transform: `translateY(${t.y}px)` }}>{data.term}</div>
      <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 42, color: theme.color.textSecondary, maxWidth: 1200, opacity: d.opacity, transform: `translateY(${d.y}px)`, marginTop: 18 }}>{data.definition}</div>
    </Frame>
  );
};

// ── comparison-table ────────────────────────────────────────────────────────
export const ComparisonTable: React.FC<{ data: { title?: string; columns: string[]; rows: string[][] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 16);
  const cell = (text: string, accent = false, header = false): React.CSSProperties => ({
    flex: 1, padding: "22px 26px", fontFamily: header ? theme.font.heading : theme.font.body,
    fontWeight: header ? 800 : 600, fontSize: header ? 36 : 34,
    color: accent ? theme.color.accent : header ? theme.color.textPrimary : theme.color.textSecondary,
    borderBottom: `1px solid ${theme.color.surface}`,
  });
  return (
    <Frame>
      {data.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 54, color: theme.color.textPrimary, marginBottom: 30, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>{data.title}</div>}
      <div style={{ width: "100%", background: theme.color.surface, borderRadius: 18, overflow: "hidden", border: `1px solid ${theme.color.surface}` }}>
        <div style={{ display: "flex", background: "#10161e" }}>
          {data.columns.map((c, i) => (<div key={i} style={cell(c, i === 0 ? false : false, true)}>{c}</div>))}
        </div>
        {data.rows.map((r, ri) => {
          const a = fadeUp(frame, fps, 16 + ri * 20);
          return (
            <div key={ri} style={{ display: "flex", opacity: a.opacity, transform: `translateX(${interpolate(a.opacity, [0, 1], [-30, 0])}px)` }}>
              {r.map((v, ci) => (<div key={ci} style={cell(v, ci === r.length - 1)}>{v}</div>))}
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── diagram (code-drawn, sequential reveal) ─────────────────────────────────
export const Diagram: React.FC<{ data: { title?: string; nodes: { id: string; label: string }[]; edges?: { from: string; to: string; label?: string }[]; reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 14);
  return (
    <Frame>
      {data.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 52, color: theme.color.textPrimary, marginBottom: 56, opacity: head.opacity }}>{data.title}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
        {data.nodes.map((n, i) => {
          const rd = revealDelay(data.reveals, i, 14 + i * 28);
          const a = springPreset(frame, fps, rd, "bouncy");
          const arrowP = i > 0 ? ramp(frame, Math.max(rd - 12, 0), 16) : 1;
          return (
            <React.Fragment key={n.id}>
              {i > 0 && (
                <div style={{ flex: "0 0 90px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <ConnectorArrow p={arrowP} w={86} />
                </div>
              )}
              <div style={{ flex: 1, minHeight: 130, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: theme.color.textPrimary, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.2, opacity: Math.min(a, 1), transform: `translateY(${(1 - Math.min(a, 1)) * 16}px) scale(${interpolate(a, [0, 1], [0.85, 1])})` }}>{n.label}</div>
            </React.Fragment>
          );
        })}
      </div>
    </Frame>
  );
};

// ── code-block ──────────────────────────────────────────────────────────────
export const CodeBlock: React.FC<{ data: { title?: string; language?: string; code: string; highlight?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeUp(frame, fps, 0, 16);
  const lines = data.code.split("\n");
  return (
    <Frame>
      {data.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 48, color: theme.color.textPrimary, marginBottom: 26, opacity: a.opacity }}>{data.title}</div>}
      <div style={{ width: "100%", background: "#0c1118", border: `1px solid ${theme.color.surface}`, borderRadius: 16, padding: "30px 36px", opacity: a.opacity, transform: `translateY(${a.y}px)` }}>
        {lines.map((ln, i) => {
          const hl = data.highlight?.includes(i + 1);
          const reveal = progress(frame, fps, 12 + i * 8, 12);
          return (
            <div key={i} style={{ display: "flex", gap: 24, fontFamily: theme.font.mono, fontSize: 34, lineHeight: 1.55, opacity: reveal, background: hl ? "rgba(79,140,255,0.12)" : "transparent", margin: "0 -12px", padding: "0 12px", borderLeft: hl ? `3px solid ${theme.color.accent}` : "3px solid transparent" }}>
              <span style={{ color: theme.color.textSecondary, opacity: 0.5, width: 36, textAlign: "right" }}>{i + 1}</span>
              <span style={{ color: theme.color.textPrimary, whiteSpace: "pre" }}>{ln}</span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── capture-segment (screen recording w/ frame) ──────────────────────────────
// Motion: a demo is NEVER flat playback (the mini-demo signature). By default the clip gets a
// cinematic PUSH-IN — it zooms from 1.0 to ~1.20 over the first ~2.5s and holds, biased slightly toward
// the upper-centre where spreadsheet/app action usually lives — so it reads as "zooming into the
// screen". When the scene declares a precise region zoom (props.focalZoom with a target), the outer
// FocalZoom wrapper (renderScene in Main) owns the motion and we DON'T also push, so the two never
// compound. Set props.kenBurns:false to opt out, or props.zoomOrigin to re-aim the push. Frame-pure.
export const CaptureSegment: React.FC<{ data: { capture_id?: string; src?: string; caption?: string; focalZoom?: { target?: unknown; scale?: number }; kenBurns?: boolean; zoomOrigin?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeUp(frame, fps, 0, 14);
  const hasFocal = !!(data.focalZoom?.target && (data.focalZoom?.scale ?? 0) > 1);
  const push = data.kenBurns === false || hasFocal
    ? 1
    : interpolate(frame, [0, fps * 2.5], [1.0, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Frame center>
      <div style={{ width: "84%", aspectRatio: "16 / 9", background: "#0c1118", border: `2px solid ${theme.color.accent}`, borderRadius: 16, overflow: "hidden", opacity: a.opacity, transform: `scale(${interpolate(a.opacity, [0, 1], [0.96, 1])})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.src ? (
          <OffthreadVideo src={data.src.startsWith("http") ? data.src : staticFile(data.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${push})`, transformOrigin: data.zoomOrigin ?? "50% 40%" }} />
        ) : (
          <div style={{ fontFamily: theme.font.mono, fontSize: 34, color: theme.color.textSecondary }}>[ screen capture: {data.capture_id ?? "demo"} ]</div>
        )}
      </div>
      {data.caption && <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 36, color: theme.color.textSecondary, marginTop: 22, opacity: a.opacity }}>{data.caption}</div>}
    </Frame>
  );
};

// ── lower-third ─────────────────────────────────────────────────────────────
export const LowerThird: React.FC<{ data: { title: string; subtitle?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeUp(frame, fps, 0, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: "9%", bottom: 120, opacity: a.opacity, transform: `translateX(${interpolate(a.opacity, [0, 1], [-40, 0])}px)`, borderLeft: `5px solid ${theme.color.accent}`, paddingLeft: 26 }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 54, color: theme.color.textPrimary }}>{data.title}</div>
        {data.subtitle && <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 34, color: theme.color.textSecondary, marginTop: 6 }}>{data.subtitle}</div>}
      </div>
    </AbsoluteFill>
  );
};

// ── transition (brand whoosh wipe) ──────────────────────────────────────────
export const Transition: React.FC<{ data?: { label?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = progress(frame, fps, 0, 42);
  const x = interpolate(p, [0, 1], [-2400, 2400]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)`, background: `linear-gradient(90deg, transparent, ${theme.color.accent}, ${theme.color.accentSecondary}, transparent)`, opacity: 0.7, width: "60%" }} />
      {data?.label && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 44, color: theme.color.textPrimary, opacity: interpolate(p, [0, 0.5, 1], [0, 1, 0]) }}>{data.label}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ── cta-card ────────────────────────────────────────────────────────────────
export const CtaCard: React.FC<{ data?: { title?: string; subtitle?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeUp(frame, fps, 2, 20);
  const b = fadeUp(frame, fps, 18, 18);
  return (
    <Frame center>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 96, color: theme.color.textPrimary, opacity: a.opacity, transform: `translateY(${a.y}px)` }}>{data?.title ?? "Stick around"}</div>
      <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 42, color: theme.color.accentSecondary, marginTop: 16, opacity: b.opacity, transform: `translateY(${b.y}px)` }}>{data?.subtitle ?? "for more automation ideas"}</div>
    </Frame>
  );
};

// ── flow (input -> process -> output, icons draw in on cues) ────────────────
export const Flow: React.FC<{ data: { title?: string; steps: { icon?: IconName; label: string; accent?: boolean }[]; reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 14);
  return (
    <Frame>
      {data.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 52, color: theme.color.textPrimary, marginBottom: 60, opacity: head.opacity }}>{data.title}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 0 }}>
        {data.steps.map((s, i) => {
          const rd = revealDelay(data.reveals, i, 14 + i * 26);
          const a = Math.min(springPreset(frame, fps, rd, "snappy"), 1);
          const arrP = i > 0 ? ramp(frame, Math.max(rd - 10, 0), 16) : 1;
          const col = s.accent ? theme.color.accent : theme.color.textPrimary;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ flex: "0 0 80px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <ConnectorArrow p={arrP} w={72} />
                </div>
              )}
              <div style={{ flex: 1, minHeight: 190, background: theme.color.surface, border: `2px solid ${s.accent ? theme.color.accent : "#26303c"}`, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24, opacity: a, transform: `translateY(${interpolate(a, [0, 1], [24, 0])}px) scale(${interpolate(a, [0, 1], [0.9, 1])})` }}>
                <Icon name={s.icon ?? "document"} size={64} color={col} accent={theme.color.accent} />
                <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 32, color: theme.color.textPrimary, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.2 }}>{s.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Frame>
  );
};

// ── icon-list (each row reveals with its icon on the narration cue) ─────────
export const IconList: React.FC<{ data: { title?: string; items: { icon?: IconName; label: string }[]; reveals?: number[] } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = fadeUp(frame, fps, 0, 16);
  return (
    <Frame>
      {data.title && <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 56, color: theme.color.textPrimary, marginBottom: 44, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>{data.title}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {data.items.map((it, i) => {
          const a = fadeUp(frame, fps, revealDelay(data.reveals, i, 18 + i * 28));
          const x = interpolate(a.opacity, [0, 1], [-40, 0]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, opacity: a.opacity, transform: `translateX(${x}px)` }}>
              <div style={{ flex: "0 0 auto", width: 68, height: 68, borderRadius: 16, background: theme.color.surface, border: `2px solid #26303c`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={it.icon ?? "check"} size={40} color={theme.color.accent} accent={theme.color.accentSecondary} />
              </div>
              <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 46, color: theme.color.textPrimary }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── registry: template name -> component (the deterministic mapping) ─────────
export const TEMPLATES = {
  "hook-card": HookCard,
  flow: Flow,
  "icon-list": IconList,
  "section-header": SectionHeader,
  "bullet-steps": BulletSteps,
  "stat-callout": StatCallout,
  "term-highlight": TermHighlight,
  "comparison-table": ComparisonTable,
  diagram: Diagram,
  "code-block": CodeBlock,
  "capture-segment": CaptureSegment,
  "lower-third": LowerThird,
  transition: Transition,
  "cta-card": CtaCard,
} as const;

export type TemplateName = keyof typeof TEMPLATES;

export const renderTemplate = (name: TemplateName, data: any) => {
  const Cmp = TEMPLATES[name] as React.FC<{ data: any }>;
  return <Cmp data={data} />;
};
