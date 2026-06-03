import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
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
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
      <div
        style={{
          width: "76%",
          textAlign: "center",
          background: "rgba(8,11,15,0.62)",
          borderRadius: 16,
          padding: "16px 30px",
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.25,
          color: theme.color.textPrimary,
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
