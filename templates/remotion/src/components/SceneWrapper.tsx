import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Wraps a scene and applies its BOUNDARY policy (D-060, superseding D-022's unconditional crossfade).
 * Fades opacity in over `fadeIn` frames and out over `fadeOut` frames of the scene's window; the
 * builder overlaps neighbouring windows by exactly the same number, so during a blend both scenes
 * render over the persistent global background.
 *
 * **A 0 means a HARD CUT and MUST bypass `interpolate`** — `interpolate(0, [0,0], [0,1])` does not
 * yield 1, so a naive `interpolate` on a 0-frame fade drops frame 0 to fully transparent and puts a
 * 1-frame background flash at EVERY cut. The default boundary is a cut, so that single missing branch
 * would flash through the whole video.
 *
 * Optional `broll`: a stock VIDEO clip (Pexels/Pixabay, fetched by 03-visuals) rendered
 * BEHIND the scene content via **OffthreadVideo** (frame-accurate → NO flicker) and
 * **dark-graded** with a brand scrim so text stays legible. It plays ONCE — never looped
 * (no 3x repeat). Only use b-roll that fits the segment and roughly matches the clip length
 * (v2-4 + owner rules 2026-06-07).
 *
 * `styleIn`/`styleOut` are carried for debugging/QA only: `match`/`morph`/`carry` are authorial and
 * composite exactly as a cut (the two scenes are independently pre-rendered — a match cut is a hard
 * cut whose frames the AUTHOR composed to rhyme).
 */
export const SceneWrapper: React.FC<{
  durFrames: number;
  fadeIn: number;
  fadeOut: number;
  styleIn?: string;
  styleOut?: string;
  broll?: string;
  children: React.ReactNode;
}> = ({ durFrames, fadeIn, fadeOut, broll, children }) => {
  const f = useCurrentFrame();
  const inP = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], CLAMP) : 1;
  const outP = fadeOut > 0 ? interpolate(f, [durFrames - fadeOut, durFrames], [1, 0], CLAMP) : 1;
  const opacity = inP * outP;
  return (
    <AbsoluteFill style={{ opacity }}>
      {broll && (
        <AbsoluteFill>
          {/* OffthreadVideo = frame-accurate (no flicker); plays once, never looped */}
          <OffthreadVideo src={staticFile(broll)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,15,20,0.74), rgba(11,15,20,0.84))" }} />
        </AbsoluteFill>
      )}
      {children}
    </AbsoluteFill>
  );
};
