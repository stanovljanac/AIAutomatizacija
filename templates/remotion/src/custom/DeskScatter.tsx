import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022) — s01 hook. An empty secretary's desk holds the day's chores;
 * as the narration says the work "scattered onto everyone", the task icons lift off
 * the desk and drift outward onto a few small "everyone" silhouettes. A small
 * source caption sits bottom-right while the stat is on screen (on-screen-source rule).
 * Window-aware: the slow scatter spans most of the scene so motion never dies.
 */
const TASKS: { icon: IconName; tx: number; ty: number }[] = [
  { icon: "calendar", tx: -560, ty: -150 },
  { icon: "email", tx: 560, ty: -150 },
  { icon: "bell", tx: -640, ty: 120 },
  { icon: "note", tx: 640, ty: 120 },
  { icon: "document", tx: 0, ty: 250 },
];
const PEOPLE = [-560, 0, 560];

export const DeskScatter: React.FC<{ data?: { title?: string; source?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const W = durationInFrames / fps; // window length in seconds
  const t = (s: number) => s * fps;
  const lin = (a: number, b: number) => interpolate(frame, [t(a), t(b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const head = fadeUp(frame, fps, 0, 16);
  const deskIn = lin(0.2, 1.2);
  const scatter = lin(W * 0.28, W * 0.9); // slow drift across most of the window
  const src = lin(W * 0.16, W * 0.16 + 0.7);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {data?.title && (
        <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 64, color: theme.color.textPrimary, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
          {data.title}
        </div>
      )}

      {/* the "everyone" silhouettes the work lands on */}
      {PEOPLE.map((px, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "48%", transform: `translate(calc(-50% + ${px}px), 170px)`, opacity: interpolate(scatter, [0, 0.4, 1], [0, 0.3, 0.85]) }}>
          <Icon name="person" size={92} color={theme.color.textSecondary} />
        </div>
      ))}

      {/* the desk */}
      <div style={{ position: "absolute", left: "50%", top: "44%", transform: `translate(-50%, -50%) scale(${interpolate(deskIn, [0, 1], [0.85, 1])})`, opacity: deskIn }}>
        <Icon name="desk" size={300} color={theme.color.accent} accent={theme.color.accentSecondary} />
      </div>

      {/* task icons: sit on the desk, then drift to the people */}
      {TASKS.map((tk, i) => {
        const x = interpolate(scatter, [0, 1], [0, tk.tx]);
        const y = interpolate(scatter, [0, 1], [0, tk.ty]);
        const pop = progress(frame, fps, t(0.6) + i * t(0.12), 14);
        return (
          <div key={i} style={{ position: "absolute", left: "50%", top: "44%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${interpolate(pop, [0, 1], [0, 1])})`, opacity: pop }}>
            <div style={{ width: 96, height: 96, borderRadius: 18, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={tk.icon} size={52} color={theme.color.accent} accent={theme.color.accentSecondary} />
            </div>
          </div>
        );
      })}

      {data?.source && (
        <div style={{ position: "absolute", right: 56, bottom: 156, fontFamily: theme.font.body, fontWeight: 500, fontSize: 24, color: theme.color.textSecondary, opacity: src * 0.8 }}>
          {data.source}
        </div>
      )}
    </AbsoluteFill>
  );
};
