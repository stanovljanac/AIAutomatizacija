import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

/**
 * Outro card (VISUAL_IDENTITY §7): "subscribe / next video" CTA + brand.
 * Phase 1 placeholder copy; Phase 3 finalizes copy, music, and brand asset.
 */
export const Outro: React.FC<{ cta: string; brand: string }> = ({
  cta,
  brand,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const y = interpolate(rise, [0, 1], [40, 0]);
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
      }}
    >
      <div style={{ transform: `translateY(${y}px)`, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "18px 40px",
            borderRadius: 16,
            background: theme.color.accent,
            color: theme.color.bg,
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 56,
          }}
        >
          {cta}
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: theme.font.body,
            fontWeight: 600,
            fontSize: 38,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: theme.color.textSecondary,
          }}
        >
          {brand}
        </div>
      </div>
    </AbsoluteFill>
  );
};
