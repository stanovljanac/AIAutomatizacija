import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Burned-in animated captions. Driven by alignment: one Sequence per sentence,
 * the active word highlighted in the accent color. Timings are frame-accurate
 * (same source as the scene windows), so captions never drift (PRD R12).
 */
export type CaptionWord = { w: string; relFrom: number; relDur: number };
export type CaptionCue = { fromFrame: number; durFrames: number; words: CaptionWord[] };

const SentenceCaption: React.FC<{ words: CaptionWord[] }> = ({ words }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  // Short (vertical): keep the layout that already reads well. Long (16:9): sit lower
  // and lighter so captions don't fight the graphics (chunking already caps it at ~2 lines).
  const paddingBottom = vertical ? 110 : 72;
  const bg = vertical ? "rgba(8,11,15,0.62)" : "rgba(8,11,15,0.42)";
  const maxWidth = vertical ? "82%" : "72%";
  const fontSize = vertical ? 46 : 44;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom }}>
      <div
        style={{
          maxWidth,
          textAlign: "center",
          background: bg,
          borderRadius: 16,
          padding: "14px 28px",
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.22,
          color: theme.color.textPrimary,
          textShadow: "0 2px 10px rgba(0,0,0,0.85)",
        }}
      >
        {words.map((wd, i) => {
          const active = f >= wd.relFrom && f < wd.relFrom + Math.max(wd.relDur, 1);
          const seen = f >= wd.relFrom;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  color: active ? theme.color.accent : seen ? theme.color.textPrimary : theme.color.textSecondary,
                }}
              >
                {wd.w}
              </span>{" "}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const CaptionsTrack: React.FC<{ cues: CaptionCue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.fromFrame} durationInFrames={Math.max(c.durFrames, 1)} name={`cap-${i}`}>
        <SentenceCaption words={c.words} />
      </Sequence>
    ))}
  </>
);
