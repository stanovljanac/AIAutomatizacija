import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export type SubtitleWord = {
  text: string;
  /** frame (relative to this component's sequence) when the word starts */
  from: number;
};

/**
 * Burned-in animated caption (VISUAL_IDENTITY §3, TOOLS §11). Highlights the
 * currently-spoken word in the accent color. In production the `from` frames
 * come straight from alignment.json (word timestamps -> frames), guaranteeing
 * the caption is always in sync with the audio. For the Phase 1 test the
 * timings are hand-set.
 */
export const Subtitles: React.FC<{ words: SubtitleWord[] }> = ({ words }) => {
  const frame = useCurrentFrame();

  // index of the latest word whose start frame has passed
  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (frame >= words[i].from) activeIndex = i;
  }

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: 120, // sit inside the safe area, above the bottom edge
          maxWidth: "80%",
          padding: "18px 36px",
          borderRadius: 14,
          background: "rgba(11,15,20,0.62)",
          backdropFilter: "blur(2px)",
          opacity: fadeIn,
          textAlign: "center",
          fontFamily: theme.font.body,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.25,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              margin: "0 8px",
              color:
                i === activeIndex
                  ? theme.color.accent
                  : theme.color.textPrimary,
              transition: "color 0.1s",
            }}
          >
            {w.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
