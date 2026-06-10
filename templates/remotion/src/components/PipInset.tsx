import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { focalEnvelope } from "../lib/anim";

export type PipInsetProps = {
  /** Corner to anchor to. NEVER bottom-* (that's the caption safe-zone). */
  anchor?: "top-right" | "top-left";
  /** Frame to slide/scale IN (from a narration cue in real videos). */
  inAt?: number;
  /** Frame to ease OUT; null = hold to the end of the scene. */
  outAt?: number | null;
  dur?: number;
  /** Inset width as a fraction of the frame width. */
  width?: number;
  children: React.ReactNode;
};

/**
 * A corner-anchored, framed "picture-in-picture" inset — like a screen-recording window or a prompt
 * card that appears in the upper corner (the owner's "prompt gore desno / slika u slici"). Slides +
 * scales in on cue, holds, eases out when done. Kept out of the bottom caption band. Frame-pure.
 */
export const PipInset: React.FC<PipInsetProps> = ({
  anchor = "top-right",
  inAt = 0,
  outAt = null,
  dur = 14,
  width = 0.4,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width: W } = useVideoConfig();
  const env = focalEnvelope(frame, inAt, outAt, dur);
  const side = anchor === "top-right" ? { right: "6%" } : { left: "6%" };
  return (
    <div
      style={{
        position: "absolute",
        top: "9%",
        ...side,
        width: W * width,
        opacity: env,
        transform: `translateY(${interpolate(env, [0, 1], [44, 0])}px) scale(${interpolate(env, [0, 1], [0.92, 1])})`,
        background: "#0c1118",
        border: `1px solid #26303c`,
        borderRadius: 16,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};
