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
 * Brief branded intro sting (VISUAL_IDENTITY §7): wordmark + tagline that scale
 * in with a spring, plus an accent underline that wipes across. Placeholder
 * wordmark for Phase 1; Phase 3 swaps in the locked brand asset.
 */
export const Intro: React.FC<{ wordmark: string; tagline: string }> = ({
  wordmark,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const scale = interpolate(pop, [0, 1], [0.8, 1]);
  const underline = interpolate(frame, [12, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // fade the whole intro out at the very end of its sequence
  const fadeOut = interpolate(frame, [48, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 120,
            letterSpacing: -2,
            color: theme.color.textPrimary,
          }}
        >
          {wordmark}
        </div>
        <div
          style={{
            height: 6,
            width: 320,
            margin: "24px auto 0",
            borderRadius: 3,
            background: theme.color.accent,
            transform: `scaleX(${underline})`,
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            marginTop: 28,
            fontFamily: theme.font.body,
            fontWeight: 500,
            fontSize: 34,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: theme.color.textSecondary,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
