// Derive the render timing/caption constants from a resolved FORMAT recipe (lib/format.mjs).
// These used to be hardcoded in build-props.mjs; pulling them through the format spec makes
// "how long is the intro / how dense are captions / how long may a Short be" editable in one
// place (formats/default.json) instead of buried as magic numbers. Pure + side-effect free so
// it is unit-testable without any media.
//
// Frame values use Math.round(seconds * fps) to match build-props' historical rounding exactly.

/**
 * @param {object} fmt   a resolved format recipe (see pipeline/shared/lib/format.mjs)
 * @param {object} opts  { fps, vertical }  vertical = the 9:16 Short
 * @returns timing constants build-props consumes.
 */
export function deriveRenderTimings(fmt, { fps, vertical }) {
  const sec = (s) => Math.round(s * fps);
  return {
    introFrames: sec(vertical ? fmt.intro.short_seconds : fmt.intro.long_seconds),
    outroFrames: sec(vertical ? fmt.outro.short_seconds : fmt.outro.long_seconds),
    crossfadeFrames: fmt.transition_frames?.crossfade ?? 9,
    leadFrames: sec(fmt.reveals?.lead_seconds ?? 0.22),
    captions: {
      maxWords: fmt.captions.max_words,
      gapSeconds: fmt.captions.gap_seconds,
      tailSeconds: fmt.captions.tail_seconds,
    },
    shortLen: {
      min: fmt.length.short.min,
      max: fmt.length.short.max,
      target: fmt.length.short.target,
    },
  };
}
