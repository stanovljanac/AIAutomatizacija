import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022): the "giant all-in-one system" mistake — an overwhelming tangle
 * of services (servers, DBs, queues, AI…) wired together; it draws in, then a big
 * red ✗ stamps over it. "complicated · breaks · never finished."
 */
const NODES: { x: number; y: number; icon: IconName; label: string }[] = [
  { x: 16, y: 26, icon: "database", label: "DB" },
  { x: 38, y: 16, icon: "inbox", label: "Queue" },
  { x: 60, y: 24, icon: "ai", label: "AI" },
  { x: 82, y: 20, icon: "chart", label: "Stats" },
  { x: 13, y: 56, icon: "email", label: "Mail" },
  { x: 35, y: 48, icon: "gear", label: "Worker" },
  { x: 57, y: 54, icon: "document", label: "Docs" },
  { x: 80, y: 48, icon: "factory", label: "ERP" },
  { x: 26, y: 78, icon: "spreadsheet", label: "Sheets" },
  { x: 50, y: 72, icon: "money", label: "Billing" },
  { x: 73, y: 80, icon: "bell", label: "Alerts" },
];
const WIRES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 5], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7],
  [4, 8], [5, 9], [6, 9], [7, 10], [8, 9], [9, 10], [1, 6], [2, 5], [5, 10], [0, 4], [3, 6],
];

export const ChaosX: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const head = fadeUp(frame, fps, 0, 14);
  const drawn = progress(frame, fps, t(0.3), 44);
  const x = progress(frame, fps, t(2.8), 16);
  const sub = fadeUp(frame, fps, t(3.4), 16);

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center" }}>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary, marginBottom: 16, opacity: head.opacity, textAlign: "center" }}>{data?.title ?? "The all-in-one mega-system"}</div>

      <div style={{ position: "relative", width: "100%", height: 540 }}>
        {/* wires */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {WIRES.map(([a, b], i) => {
            const p = interpolate(drawn, [i / WIRES.length * 0.6, i / WIRES.length * 0.6 + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const A = NODES[a], B = NODES[b];
            return <line key={i} x1={A.x} y1={A.y} x2={interpolate(p, [0, 1], [A.x, B.x])} y2={interpolate(p, [0, 1], [A.y, B.y])} stroke="#37475a" strokeWidth={0.5} />;
          })}
        </svg>

        {/* service nodes */}
        {NODES.map((n, i) => {
          const a = progress(frame, fps, t(0.3) + i * 2.5, 12);
          return (
            <div key={i} style={{ position: "absolute", left: `${n.x}%`, top: `${n.y}%`, width: 104, height: 78, marginLeft: -52, marginTop: -39, background: theme.color.surface, border: "1px solid #2b3642", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: a, transform: `scale(${a})`, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}>
              <Icon name={n.icon} size={34} color={theme.color.textSecondary} accent={theme.color.accent} />
              <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 16, color: theme.color.textSecondary }}>{n.label}</div>
            </div>
          );
        })}

        {/* red X stamped over the tangle */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <line x1="10" y1="10" x2={interpolate(x, [0, 0.5], [10, 90], { extrapolateRight: "clamp" })} y2={interpolate(x, [0, 0.5], [10, 90], { extrapolateRight: "clamp" })} stroke="#FF5C5C" strokeWidth={2.6} strokeLinecap="round" />
          <line x1="90" y1="10" x2={interpolate(x, [0.5, 1], [90, 10], { extrapolateLeft: "clamp" })} y2={interpolate(x, [0.5, 1], [10, 90], { extrapolateLeft: "clamp" })} stroke="#FF5C5C" strokeWidth={2.6} strokeLinecap="round" opacity={x > 0.5 ? 1 : 0} />
        </svg>
      </div>

      <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 32, color: "#FF5C5C", textAlign: "center", marginTop: 10, opacity: sub.opacity }}>complicated · breaks · never finished</div>
    </AbsoluteFill>
  );
};
