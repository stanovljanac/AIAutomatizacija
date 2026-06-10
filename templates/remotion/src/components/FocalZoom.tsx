import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { focalEnvelope, focalTransform } from "../lib/anim";

export type FocalZoomProps = {
  /** Focus point as fractional frame coords (0..1). e.g. {x:0.82,y:0.30} = upper-right. */
  target?: { x: number; y: number };
  /** Punch-in factor (cap ~1.6 — small punch-ins read more professional than big ones). */
  scale?: number;
  /** Frame to ease the zoom IN (resolved from a narration cue word in real videos). */
  inAt?: number;
  /** Frame to ease the zoom OUT; null = hold the zoom to the end of the scene. */
  outAt?: number | null;
  /** Ease duration in frames. */
  dur?: number;
  children: React.ReactNode;
};

/**
 * MOTIVATED-MOTION wrapper (the opposite of the rejected V2.5 global camera). Punches a SINGLE
 * scene's content toward `target` on cue, holds while that's the subject, then pulls back — instead
 * of drifting the camera over everything. No-op when `target` is absent or `scale <= 1`, so scenes
 * that don't opt in render byte-identical. Frame-pure (determinism + forced-alignment sync hold).
 */
export const FocalZoom: React.FC<FocalZoomProps> = ({
  target,
  scale = 1,
  inAt = 0,
  outAt = null,
  dur = 12,
  children,
}) => {
  const frame = useCurrentFrame();
  if (!target || scale <= 1) return <>{children}</>;
  const env = focalEnvelope(frame, inAt, outAt, dur);
  const { transformOrigin, transform } = focalTransform(target, scale, env);
  return <AbsoluteFill style={{ transformOrigin, transform }}>{children}</AbsoluteFill>;
};
