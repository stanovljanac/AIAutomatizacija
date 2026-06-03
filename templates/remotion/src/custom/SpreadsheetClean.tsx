import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fadeUp, progress } from "../lib/anim";

/**
 * BESPOKE scene for video 002 (D-020 visual variety): "messy row in -> AI pass ->
 * clean row out". Not one of the 12 base templates. Beats (scene-local seconds):
 *   0.5  title + empty table
 *   1.5  messy raw row drops in
 *   3.5  AI sweep crosses
 *   4.5  clean row + a flagged duplicate appear; "by hand 5-10 min -> automatic"
 *   hold for the rest of the narration.
 */
const COLS = [
  { key: "first", label: "First", w: 0.18 },
  { key: "last", label: "Last", w: 0.18 },
  { key: "phone", label: "Phone", w: 0.32 },
  { key: "status", label: "", w: 0.32 },
];

const Cell: React.FC<{ children?: React.ReactNode; w: number; mono?: boolean; color?: string; header?: boolean }> = ({ children, w, mono, color, header }) => (
  <div style={{ flexBasis: `${w * 100}%`, padding: "18px 22px", fontFamily: mono ? theme.font.mono : theme.font.body, fontWeight: header ? 800 : 600, fontSize: header ? 30 : 34, color: color ?? (header ? theme.color.textSecondary : theme.color.textPrimary), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{children}</div>
);

const Row: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: "flex", alignItems: "center", borderTop: `1px solid #1c2530`, ...style }}>{children}</div>
);

export const SpreadsheetClean: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const head = fadeUp(frame, fps, 0, 18);
  const messyIn = progress(frame, fps, t(1.5), 14);
  const sweep = progress(frame, fps, t(3.5), 22);
  const cleanIn = progress(frame, fps, t(4.6), 16);
  const benefitIn = fadeUp(frame, fps, t(6.2), 18);

  const messyX = interpolate(messyIn, [0, 1], [-60, 0]);
  // messy row fades out as the clean rows arrive
  const messyOpacity = messyIn * (1 - cleanIn);

  return (
    <AbsoluteFill style={{ padding: "0 9%", justifyContent: "center" }}>
      <div style={{ width: "100%" }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 52, color: theme.color.textPrimary, marginBottom: 34, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>{data?.title ?? "Messy row in, clean row out"}</div>

        <div style={{ position: "relative", background: theme.color.surface, border: `1px solid #1c2530`, borderRadius: 16, overflow: "hidden" }}>
          {/* header */}
          <Row style={{ borderTop: "none", background: "#10161e" }}>
            {COLS.map((c) => (<Cell key={c.key} w={c.w} header>{c.label}</Cell>))}
          </Row>

          {/* messy raw row */}
          <Row style={{ opacity: messyOpacity, transform: `translateX(${messyX}px)` }}>
            <Cell w={COLS[0].w} mono color={theme.color.textSecondary}>jOHN</Cell>
            <Cell w={COLS[1].w} mono color={theme.color.textSecondary}>  sMITH</Cell>
            <Cell w={COLS[2].w} mono color={theme.color.textSecondary}>0641/23 45 </Cell>
            <Cell w={COLS[3].w} mono color={"#FF5C5C"}>raw</Cell>
          </Row>

          {/* clean rows */}
          <div style={{ opacity: cleanIn, transform: `translateY(${interpolate(cleanIn, [0, 1], [20, 0])}px)` }}>
            <Row>
              <Cell w={COLS[0].w}>John</Cell>
              <Cell w={COLS[1].w}>Smith</Cell>
              <Cell w={COLS[2].w} mono>+381 64 123 45</Cell>
              <Cell w={COLS[3].w} color={theme.color.accentSecondary}>✓ clean</Cell>
            </Row>
            <Row>
              <Cell w={COLS[0].w}>Jane</Cell>
              <Cell w={COLS[1].w}>Doe</Cell>
              <Cell w={COLS[2].w} mono>+381 64 998 12</Cell>
              <Cell w={COLS[3].w} color={theme.color.highlight}>⚑ duplicate?</Cell>
            </Row>
          </div>

          {/* AI sweep bar */}
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 160, left: `${interpolate(sweep, [0, 1], [-12, 100])}%`, background: `linear-gradient(90deg, transparent, ${theme.color.accent}66, ${theme.color.accentSecondary}66, transparent)`, opacity: interpolate(sweep, [0, 0.1, 0.9, 1], [0, 1, 1, 0]) }} />
        </div>

        {/* benefit line */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 30, opacity: benefitIn.opacity, transform: `translateY(${benefitIn.y}px)` }}>
          <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: theme.color.textSecondary }}>By hand: 5–10 min, every time</div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: theme.color.accent }}>→ automatic</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
