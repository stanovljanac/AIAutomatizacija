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
 * On-screen kinetic typography (VISUAL_IDENTITY §4): a headline whose words
 * animate in one after another, with the emphasis word in the accent color.
 * Phase 1 version; Phase 3 generalizes it to the storyboard's text scenes.
 */
export const KineticText: React.FC<{
  words: string[];
  emphasizeIndex?: number;
}> = ({ words, emphasizeIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 8%",
      }}
    >
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.1,
          textAlign: "center",
          color: theme.color.textPrimary,
        }}
      >
        {words.map((word, i) => {
          const enter = spring({
            frame: frame - i * 7,
            fps,
            config: { damping: 200 },
            durationInFrames: 18,
          });
          const y = interpolate(enter, [0, 1], [28, 0]);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 14px",
                opacity: enter,
                transform: `translateY(${y}px)`,
                color:
                  i === emphasizeIndex
                    ? theme.color.accent
                    : theme.color.textPrimary,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
