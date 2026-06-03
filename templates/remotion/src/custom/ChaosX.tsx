import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022): the "giant all-in-one system" mistake — a tangle of boxes and
 * crossing wires that draws in, then a big red ✗ stamps over it. "complicated ·
 * breaks · never finished."
 */
const NODES = [
  [18, 30], [40, 18], [62, 26], [82, 22],
  [14, 60], [36, 52], [58, 58], [80, 50],
  [28, 80], [50, 74], [72, 82],
];
const WIRES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 5], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [4, 8], [5, 9], [6, 9], [7, 10], [8, 9], [9, 10], [1, 6], [2, 5], [5, 10],
];

export const ChaosX: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const head = fadeUp(frame, fps, 0, 14);
  const drawn = progress(frame, fps, t(0.4), 40);
  const x = progress(frame, fps, t(2.6), 16);
  const sub = fadeUp(frame, fps, t(3.2), 16);

  return (
    <AbsoluteFill style={{ padding: "0 9%", justifyContent: "center" }}>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary, marginBottom: 24, opacity: head.opacity, textAlign: "center" }}>{data?.title ?? "The all-in-one mega-system"}</div>

      <div style={{ position: "relative", width: "100%", height: 480 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {WIRES.map(([a, b], i) => {
            const p = interpolate(drawn, [i / WIRES.length * 0.7, i / WIRES.length * 0.7 + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const [x1, y1] = NODES[a]; const [x2, y2] = NODES[b];
            return <line key={i} x1={x1} y1={y1} x2={interpolate(p, [0, 1], [x1, x2])} y2={interpolate(p, [0, 1], [y1, y2])} stroke="#3a4757" strokeWidth={0.5} />;
          })}
        </svg>
        {NODES.map(([nx, ny], i) => {
          const a = progress(frame, fps, t(0.4) + i * 2, 10);
          return <div key={i} style={{ position: "absolute", left: `${nx}%`, top: `${ny}%`, width: 56, height: 40, marginLeft: -28, marginTop: -20, background: theme.color.surface, border: "1px solid #2b3642", borderRadius: 8, opacity: a, transform: `scale(${a})` }} />;
        })}
        {/* red X */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <line x1="14" y1="14" x2={interpolate(x, [0, 0.5], [14, 86], { extrapolateRight: "clamp" })} y2={interpolate(x, [0, 0.5], [14, 86], { extrapolateRight: "clamp" })} stroke="#FF5C5C" strokeWidth={3} strokeLinecap="round" />
          <line x1="86" y1="14" x2={interpolate(x, [0.5, 1], [86, 14], { extrapolateLeft: "clamp" })} y2={interpolate(x, [0.5, 1], [14, 86], { extrapolateLeft: "clamp" })} stroke="#FF5C5C" strokeWidth={3} strokeLinecap="round" opacity={x > 0.5 ? 1 : 0} />
        </svg>
      </div>

      <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: "#FF5C5C", textAlign: "center", marginTop: 18, opacity: sub.opacity }}>complicated · breaks · never finished</div>
    </AbsoluteFill>
  );
};
