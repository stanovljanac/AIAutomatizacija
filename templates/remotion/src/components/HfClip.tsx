import React from "react";
import { OffthreadVideo, staticFile } from "remotion";

/**
 * A pre-rendered SILENT HyperFrames hero clip composited at its exact scene window (V6 "combo"
 * engine, D-019). The clip was rendered by pipeline/04-render/compile-hyperframes.mjs to be EXACTLY
 * durFrames long, so playing it from frame 0 of the scene's Sequence covers the window 1:1.
 * OffthreadVideo = frame-accurate (no flicker), mirroring SceneWrapper's b-roll usage; `muted`
 * because the one continuous narration track lives ONLY in Remotion — HF scenes carry no audio.
 * Frame-pure: output depends only on the current frame.
 */
export const HfClip: React.FC<{ src: string }> = ({ src }) => (
  <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
);
