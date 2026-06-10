// MOTIVATED-MOTION resolver: turn a scene's cue-word-driven `focalZoom` / `pip` declarations into
// SCENE-LOCAL frame numbers the FocalZoom / PipInset components consume. Pure + testable.
//
// Motion stays bound to the forced-alignment narration — zoom IN when a cue word is spoken, OUT on
// another — so it lands on the subject and never drifts globally (the lesson from the reverted V2.5).
// Opt-in per scene; absent → no-op.

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, "");

/** Absolute start-seconds of the first scene word matching `cue` (normalized); null if absent/none. */
export function cueSeconds(cue, sceneWords) {
  if (cue == null) return null;
  const target = norm(cue);
  const hit = (sceneWords ?? []).find((w) => w && norm(w.w) === target);
  return hit ? hit.start : null;
}

/**
 * Add scene-local `inAt` / `outAt` frames to a cue-window object (`{ in?, out?, inAt?, outAt?, … }`).
 * `in`/`out` are narration cue WORDS resolved against this scene's words; if a cue is absent it falls
 * back to a provided numeric `inAt` (default 0) / `outAt` (default null = hold to scene end). All
 * other fields (target, scale, anchor, content, dur…) are preserved. Pure: never mutates the input.
 *
 * @param obj         the focalZoom or pip declaration (or null)
 * @param sceneWords  alignment words for this scene (each { w, start })
 * @param ctx         { introFrames, fps, sceneFromFrame } — to map seconds → scene-local frames
 */
export function resolveCueWindow(obj, sceneWords, { introFrames, fps, sceneFromFrame }) {
  if (!obj || typeof obj !== "object") return obj;
  const F = (s) => Math.round(s * fps);
  const toLocal = (sec) => Math.max(introFrames + F(sec) - sceneFromFrame, 0);
  const inSec = cueSeconds(obj.in, sceneWords);
  const outSec = cueSeconds(obj.out, sceneWords);
  return {
    ...obj,
    inAt: inSec == null ? (obj.inAt ?? 0) : toLocal(inSec),
    outAt: outSec == null ? (obj.outAt ?? null) : toLocal(outSec),
  };
}

/**
 * V5 build-side resolver (engine-agnostic): turn a cue-window's narration cue WORDS (`in`/`out`) into
 * ABSOLUTE, FRAME-SNAPPED video-SECONDS for the timeline. The value is the legacy frame
 * `introFrames + Math.round(cueSec*fps)` divided by fps, so a compiler's `round(sec*fps)` recovers the
 * exact frame with no float drift (see lib/timeline.mjs contract). A cue that is absent → null (the
 * compiler reads null as "scene start" for in, "hold to scene end" for out). The cue WORDS are dropped;
 * every other field (target/scale/anchor/content/dur…) is kept. Pure: never mutates the input.
 */
export function resolveCueWindowSeconds(obj, sceneWords, { introFrames, fps }) {
  if (!obj || typeof obj !== "object") return obj;
  const { in: inCue, out: outCue, inAt, outAt, ...rest } = obj;
  const snap = (sec) => (sec == null ? null : (introFrames + Math.round(sec * fps)) / fps);
  return {
    ...rest,
    inAtSeconds: snap(cueSeconds(inCue, sceneWords)),
    outAtSeconds: snap(cueSeconds(outCue, sceneWords)),
  };
}

/**
 * V5 compile-side localizer (Remotion frames): turn the timeline's ABSOLUTE-second `inAtSeconds` /
 * `outAtSeconds` window into the SCENE-LOCAL frames the FocalZoom / PipInset components consume
 * (`inAt` / `outAt`). null inAtSeconds → inAt 0 (scene start); null outAtSeconds → outAt null (hold to
 * end). Equivalent by construction to the legacy `resolveCueWindow` for the cue-word case. Pure.
 */
export function localizeCueWindow(win, { fps, sceneFromFrame }) {
  if (!win || typeof win !== "object") return win;
  const { inAtSeconds, outAtSeconds, ...rest } = win;
  const F = (s) => Math.round(s * fps);
  const toLocal = (sec) => Math.max(F(sec) - sceneFromFrame, 0);
  return {
    ...rest,
    inAt: inAtSeconds == null ? 0 : toLocal(inAtSeconds),
    outAt: outAtSeconds == null ? null : toLocal(outAtSeconds),
  };
}
