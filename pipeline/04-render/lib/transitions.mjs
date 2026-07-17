// D-060 — the scene BOUNDARY policy: what the compositor does between scene k and scene k+1.
// Pure (no fs, no media), mirroring lib/policy.mjs's shape. This is the ONE home for the scene-window
// math that used to be copy-pasted in three places (compile-remotion, compile-hyperframes,
// 04b-thumbnails/extract) — the third copy had no parity test and failed silently.
//
// The authored value lives on the OUTGOING scene (`transition_out`), because a transition is a property
// of the boundary, not of a scene. The default is `cut` (MOTION_SPEC §3: "Default to a hard cut") —
// a cut lands ON the alignment mark, where the old unconditional 9-frame crossfade pre-rolled every
// scene by 300ms and ghosted the previous one into every line of narration.
//
// `match` / `morph` / `carry` compile to a hard CUT. They cannot be mechanized — the two scenes are
// independently pre-rendered and the compositor has no idea what shape to align — and a hard cut IS
// the correct compositor behavior for a match cut: a match cut is a hard cut whose two frames were
// composed to rhyme. The enum value's job is to be recorded, to reach the author, and to be reviewable.

/** Every authored boundary style. Anything else is a schema error. */
export const TRANSITION_STYLES = ["cut", "dissolve", "push", "match", "morph", "carry"];

/** The styles the compositor actually BLENDS — i.e. the only ones that overlap two scene windows. */
export const BLENDED = new Set(["dissolve", "push"]);

/** Frames scene k+1 is pulled back to overlap scene k, given scene k's authored exit style. */
export function overlapFrames(style, xf) {
  return BLENDED.has(style ?? "cut") ? xf : 0;
}

/**
 * The compositor's window for `timeline.scenes[k]`, in frames.
 *
 * ASYMMETRY (the one non-obvious thing in this file — read before changing):
 *   - k === 0      never pulls back (there is no scene before it) but still fades IN at `xf`: the
 *                  intro bumper is extended forward by xf and the first scene blends out of it.
 *   - k === n − 1  always fades OUT at `xf` regardless of its authored `transition_out`: the outro
 *                  bumper is pulled back by xf and cross-blends with it (Main.tsx). The last scene's
 *                  authored exit is therefore IGNORED — build-props warns rather than dropping it
 *                  silently.
 *   - the window END never depends on the pull-back, so every window ends exactly on its alignment
 *     mark and the narration can never desync (see the sync tests).
 *
 * @param {object} timeline   a timeline.json object
 * @param {number} k          index into timeline.scenes
 * @returns {{ fromFrame:number, durFrames:number, fadeIn:number, fadeOut:number, styleIn:string, styleOut:string }}
 */
export function sceneWindow(timeline, k) {
  const fps = timeline.format.fps;
  const F = (s) => Math.round(s * fps);
  const xf = F(timeline.crossfade_seconds ?? 0);
  const scenes = timeline.scenes;
  const sc = scenes[k];

  const styleIn = k > 0 ? scenes[k - 1].transition_out ?? "cut" : "cut";
  const styleOut = sc.transition_out ?? "cut";

  const pullback = k > 0 ? overlapFrames(styleIn, xf) : 0;
  const fromFrame = F(sc.start_seconds) - pullback;
  const durFrames = Math.max(F(sc.end_seconds) - fromFrame, 1);

  const fadeIn = k === 0 ? xf : pullback;
  const fadeOut = k === scenes.length - 1 ? xf : overlapFrames(styleOut, xf);

  return { fromFrame, durFrames, fadeIn, fadeOut, styleIn, styleOut };
}
