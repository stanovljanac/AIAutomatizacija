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
 * Outro sting — just the channel handle (no CTA; the CTA lives on the previous
 * scene). `cta` carries the handle, `brand` is optional and only shown if set.
 */
export const Outro: React.FC<{ cta: string; brand: string }> = ({ cta, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const y = interpolate(rise, [0, 1], [36, 0]);
  const fadeIn = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fadeIn }}>
      <div style={{ transform: `translateY(${y}px)`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 84,
            color: theme.color.accent,
          }}
        >
          {cta}
        </div>
        {brand ? (
          <div
            style={{
              marginTop: 24,
              fontFamily: theme.font.body,
              fontWeight: 600,
              fontSize: 34,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: theme.color.textSecondary,
            }}
          >
            {brand}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
