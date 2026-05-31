import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/**
 * Subtle animated dark backdrop (VISUAL_IDENTITY §4). A slowly drifting radial
 * glow over the base color + a faint grid, so the frame is never a flat fill.
 * Phase 3 will refine this into the branded BackgroundFX.
 */
export const BackgroundFX: React.FC = () => {
  const frame = useCurrentFrame();
  // gentle horizontal drift of the glow center
  const cx = 50 + Math.sin(frame / 90) * 8;
  const cy = 42 + Math.cos(frame / 110) * 6;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${cx}% ${cy}%, ${theme.color.accent}26 0%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.color.textSecondary}0F 1px, transparent 1px), linear-gradient(90deg, ${theme.color.textSecondary}0F 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(75% 75% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(75% 75% at 50% 50%, black 0%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
