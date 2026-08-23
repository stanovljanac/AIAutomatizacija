---
type: lesson
status: stable
created: 2026-08-23
updated: 2026-08-23
related: [2026-08-18-a-rendered-clip-is-not-a-seekable-clip.md, 2026-08-16-the-stage-is-built-once.md, ../../../docs/DECISIONS.md, ../../../style/MOTION_SPEC.md]
depends_on: []
---
# Fixing one scene is a splice, not a re-render — and the cut points are already there

**Purpose:** this file exists so nobody ever again pays a two-hour composite pass to change eleven
seconds of a video, and so the safety argument for the splice is traceable to measurements rather
than to confidence.
**When to read:** read before re-rendering a cut that already has a `video/final.mp4`, and before
changing anything in `pipeline/04-render/patch-scenes.mjs`.
**Do not duplicate:** if writing about partial renders, mp4 splicing or render cost, extend this file.

## Finding

**A rendered cut is not a monolith. It is already cut into scene-length pieces, and the encoder put
the cut points there for us.** x264 emits an IDR (key) frame whenever the picture changes wholesale —
which is exactly what a hard scene cut is. So the frames of a single scene can be replaced by
stream-copying everything around them, with no re-encode of the untouched part and no visible seam.

The cost difference is not marginal. On 023 (26 scenes, 6:18, 11,331 frames) the Remotion composite
pass runs at `--concurrency=1` — forced by the Chrome tab OOM across 26 `OffthreadVideo` sources — and
takes about two hours. Re-rendering only scene 1 costs **392 frames = 3.5% of the cut**, about four
minutes. Every owner note on a single scene had been paying the full two hours.

## Evidence

Measured 2026-08-23 on `content/023-attention/video/final.mp4`, by patching scene s1.0 with itself
(unchanged) and comparing the result against the base:

| Property | Result |
|---|---|
| Keyframes in the base | 54; at n = **0, 250, 392, 642, 892, 1070**, … |
| Compiled `fromFrame` of s2.0 / s4.0 | **392 / 1070** — the encoder's keyframes ARE the scene cuts |
| Frames re-rendered for s1.0 | 392 of 11,331 (**3.5%**) |
| Tail (frames 392→end), decoded pixel hash | **bit-identical** to the base |
| Head (frames 0–391), PSNR vs base | **50.9 dB** average, 46.1 dB min — visually lossless |
| Audio stream MD5 | **identical** (`d09245b3…`) |
| Duration | 00:06:17.75 = 00:06:17.75 |
| Decoded video frame count | 11,331 = 11,331 |

The head differs from the base only because it is a fresh x264 pass with fresh rate-control state —
same picture, different bits. That is why the check is PSNR, not a hash.

## Why each safeguard is load-bearing

- **Snap both cuts outward to keyframes.** A cut on a non-key frame cannot be stream-copied; widening
  only ever re-renders *more* frames, and can never move a cut off a keyframe.
- **Render the replacement with Remotion, not ffmpeg.** Same encoder, same settings, same SPS/PPS as
  the base — which is what lets the concat demuxer run `-c copy`. An ffmpeg-encoded head would risk a
  parameter-set mismatch at the join.
- **Render `--muted` and re-mux the base's audio.** Not an optimisation — the correctness guarantee.
  Nothing cuts, re-times or re-encodes audio anywhere in the patch, so drift is impossible by
  construction and PRD R11 ("never slice the audio") stays true through a patch.
- **Verify the frame count and fail closed.** A splice one frame short would desync every caption
  after it, silently. The run rejects any output whose decoded frame count differs from the base.
- **A scene's pixels never leave its own window.** The obvious guess — that a transition makes a scene
  bleed into its neighbours — is wrong for this compositor: `sceneWindow` pulls the INCOMING scene back
  over its predecessor, the intro is extended forward INTO scene 0's window, and the outro is pulled
  back INTO the last scene's. So the patched range is exactly `[fromFrame, fromFrame + durFrames)`,
  with no widening. `affectedFrameRange` calls the same `lib/transitions.mjs` the compilers call, so
  this cannot drift apart from the render.

## When a patch is NOT valid

Fall back to a full render when the base file does not exist, when `alignment.json` changed (every
scene window moves, so every frame index is different), or when the intro/outro/caption layer changed.
A patched file still needs `repair-dropouts` and `frame-gate` — patching changes which frames were
composited, not whether the compositor dropped one.

## A trap found while authoring against this

**Regenerate the render entry after ANY change to a scene's `index.html`.** `make-entry.mjs` writes a
disposable entry from the scene's HTML; CSS and JS are linked by href and so pick up edits, but HTML
structure does not. Iterating a scene by hand with a stale entry renders the OLD structure while the
new CSS applies, which produced a false defect hunt: a budget bar measured RGB(89,64,16) against
RGB(224,153,24) in its twin, and three plausible-but-wrong culprits (a scrim's z-index, the vignette,
a blend mode) were investigated before the real cause. The pipeline is not exposed to this —
`renderHyperframesScenes` runs `make-entry` before every render — only hand-driven loops are.

## Applies to

Any `content/<id>` with a rendered `video/final.mp4`, long or Short. Commands and fallbacks:
[`.claude/skills/video-render/SKILL.md`](../../../.claude/skills/video-render/SKILL.md) §"Fixing ONE
scene"; the decision and its measurements: `docs/DECISIONS.md` D-065.

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- _none yet_
