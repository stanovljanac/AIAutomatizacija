import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/**
 * Wraps a scene so adjacent scenes crossfade (D-022). Fades opacity in over the
 * first `overlap` frames and out over the last `overlap` frames of the scene's
 * window. The builder overlaps neighboring windows by `overlap`, so during the
 * overlap both scenes render and blend over the persistent global background.
 */
export const SceneWrapper: React.FC<{ durFrames: number; overlap: number; children: React.ReactNode }> = ({ durFrames, overlap, children }) => {
  const f = useCurrentFrame();
  const o = Math.max(overlap, 1);
  const opacity =
    interpolate(f, [0, o], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(f, [durFrames - o, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
