import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { drift } from "../lib/anim";

/**
 * GoldAurora — the brand black+gold cinematic backdrop for the Intro/Outro stings (owner
 * re-skin 2026-06-13). Warm near-black base + a few slow drifting gold light-blobs + faint
 * twinkling gold particles. Pure-frame (deterministic): positions/twinkle are functions of the
 * frame + a per-element index hash, never Math.random — so every render is byte-reproducible.
 * Not WebGL (that lives in the HyperFrames heroes); this is the lightweight Remotion sibling.
 */
const GOLD = "#ffb020";
const GOLD_2 = "#ffd37a";

export const GoldAurora: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blobs = [
    { x: 32, y: 38, c: GOLD, r: 820, o: 0.34, amp: 46, per: 7.5, ph: 0 },
    { x: 66, y: 52, c: GOLD_2, r: 680, o: 0.26, amp: 38, per: 9.5, ph: 2 },
    { x: 50, y: 30, c: GOLD, r: 560, o: 0.22, amp: 30, per: 11, ph: 4 },
  ];

  // deterministic gold particles (index-hashed positions, sine twinkle + slow drift)
  const particles = Array.from({ length: 22 }, (_, i) => {
    const x = (i * 73 + 11) % 100;
    const y = (i * 37 + 19) % 100;
    const tw = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin((frame / fps) * 1.6 + i * 1.7));
    const dx = drift(frame, fps, 10, 6 + (i % 4), i);
    const dy = drift(frame, fps, 8, 7 + (i % 3), i + 1);
    const size = 3 + (i % 3) * 2;
    return { x, y, tw, dx, dy, size };
  });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 85% at 50% 40%, #15110a 0%, #0b0a07 72%)", overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(${b.x}% + ${drift(frame, fps, b.amp, b.per, b.ph)}px)`,
            top: `calc(${b.y}% + ${drift(frame, fps, b.amp * 0.7, b.per + 1.5, b.ph + 1)}px)`,
            width: b.r,
            height: b.r,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c} 0%, transparent 62%)`,
            filter: "blur(70px)",
            opacity: b.o * intensity,
          }}
        />
      ))}
      {particles.map((p, i) => (
        <div
          key={`p${i}`}
          style={{
            position: "absolute",
            left: `calc(${p.x}% + ${p.dx}px)`,
            top: `calc(${p.y}% + ${p.dy}px)`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: GOLD_2,
            boxShadow: `0 0 ${p.size * 3}px ${GOLD}`,
            opacity: p.tw * intensity,
          }}
        />
      ))}
      {/* vignette for depth + caption-safe edges */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 80% at 50% 42%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
