---
type: lesson
status: stable
created: 2026-08-23
updated: 2026-10-17
related: [2026-08-18-a-rendered-clip-is-not-a-seekable-clip.md, 2026-08-16-the-stage-is-built-once.md, ../../../docs/DECISIONS.md, ../../../style/MOTION_SPEC.md]
depends_on: []
---
# Fixing one scene is a splice, not a re-render — and the cut points are already there

**Purpose:** this file exists so nobody ever again pays a two-hour composite pass to change eleven
seconds of a video, so the safety argument for the splice is traceable to measurements rather than to
confidence, and — after the 2026-08-24 incident below — so a splice is never again checked on frame
count alone.
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
- **Normalise every segment to the base file's timebase** (`-video_track_timescale`), because the
  concat demuxer will not. See "The frame count is not the guarantee" below — this one was learned by
  shipping two broken files.
- **Verify frames AND played time AND the timebase, then fail closed.** A splice one frame short would
  desync every caption after it, silently; a splice with a mixed timebase keeps every frame and still
  ends the picture a minute in. The run rejects any output that differs from the base on any of the
  three.
- **A scene's pixels never leave its own window.** The obvious guess — that a transition makes a scene
  bleed into its neighbours — is wrong for this compositor: `sceneWindow` pulls the INCOMING scene back
  over its predecessor, the intro is extended forward INTO scene 0's window, and the outro is pulled
  back INTO the last scene's. So the patched range is exactly `[fromFrame, fromFrame + durFrames)`,
  with no widening. `affectedFrameRange` calls the same `lib/transitions.mjs` the compilers call, so
  this cannot drift apart from the render.

## The frame count is not the guarantee — the timebase is (incident, 2026-08-24)

**Both patched 023 files that went to the owner were broken, and the verify gate passed them both.**
The picture froze at about 1:05 under a 6:17 narration. Nothing was wrong with the audio, the scenes,
the props or the Remotion render — the mp4 timestamps were.

**Mechanism.** An mp4 stores time in *ticks*, at a per-track rate (`tbn`). Remotion writes **90000**;
our `final.mp4` carries **15360**. The concat demuxer takes the output timebase from its **FIRST**
input and passes the other files' packets through **without rescaling them**. Patching scene 1 starts
at frame 0, so `planPatch` emits no head segment and the Remotion part is first — and the tail's
15360-tick stamps were then read as 90000. The ratio is exactly `90000 / 15360 = 5.859375`, so the
picture ran out at `377.75 s / 5.859375 = 64.5 s`. A patch in the MIDDLE of a cut breaks the other
way: head first, so the timebase is right and the patched scene plays 5.86× slow (measured: 1462
frames rendered as 2:32.68 instead of 48.73 s). Every one of the 26 scenes was exposed.

**Why the gate passed it.** The old check compared decoded frame counts: 11331 = 11331. All three
manual checks made when the tool was built — bit-identical tail, head PSNR, audio MD5 — look at
**pixels and samples**. Not one of them looked at **time**. The container's `Duration` is no help
either: it reports the longest track, so the intact 6:17 audio hid the truncated 6:17→1:04 video.

| File | Decoded frames | Video track plays | tbn |
|---|---|---|---|
| `final.mp4` (base) | 11331 | **6:17.70** ✓ | 15360 |
| `final-v1.1.mp4`, `final-v1.2.mp4` (shipped, broken) | 11331 | **1:04.50** ✗ | 90000 |
| `final-v1.2-fixed.mp4` (after the fix) | 11331 | **6:17.70** ✓ | 15360 |

**The generalisable rule: verify the property that would break, not the property that is easy to
count.** A splice moves *time*; the gate measured *quantity*. When a check and a failure mode do not
name the same physical property, the check is decoration. (The test file said as much out loud —
"FRAME COUNT IS CONSERVED" — and one of its fixtures even carried `time=00:06:17` and discarded it.)

**Fixed by** pinning every ffmpeg step (`cut`, `concat`, `mux`) to the base file's `tbn`, read off the
keyframe scan we already run, and by extending the gate to frames + played seconds + timebase — with
tests that replay this exact log and reject it. A missing timescale is now a hard error, never a
silent omission. Also removed: `-fflags +genpts` sat AFTER `-i` on the concat, i.e. on the OUTPUT,
where `genpts` is a no-op; it looked like timestamp insurance and was doing nothing.

**One latent trap left open:** the Remotion segment file is named `<id>-patch-<from>-<to>.mp4`, so two
variants of the same scene overwrite each other's segment. `v1.1`'s segment was gone by the time the
bug was found, which is why repairing `v1.2` was free (stream copy, ~1 min) and repairing `v1.1` would
have cost a re-render. If variants of one scene are ever iterated again, put the variant in the name.

## The segment must carry the base's CRF, not today's config (2026-10-16/17)

"Same encoder, same settings" stopped being true without anyone touching `patch-scenes`. Since 022,
`repair-dropouts` re-encodes a master whenever it repairs a dropped frame — at CRF 16 — while Remotion
renders at its default CRF 18. So every base that had a dropout was a CRF 16 file, and every patch
spliced a CRF 18 stretch into it: a patch slightly lower in quality than the cut around it.
- **Not a decoding hazard — measured, not assumed.** x264 ties the PPS init QP to the CRF, so a
  mismatched concat looked like it could decode the second part against the wrong PPS. It does not: a
  stream-copy concat of a CRF 16 and a CRF 18 x264 part decodes bit-exact (PSNR ∞ against the part's own
  clean decode) with the vendored ffmpeg (2026-10-17). The fix below is about quality, nothing else.
- **Fix (D-071):** `patch-scenes` reads the base's CRF back out of its own x264 SEI
  (`pipeline/shared/lib/encode.mjs` `readX264Crf`) and renders the segment `--crf=<that>` (config default
  when unreadable). Every master encode now shares one value (`MASTER_CRF`, 12) and one preset (medium),
  so new bases and their repairs agree by construction.
- **Measured on the 025 Short (2026-10-17):** base CRF 12 (PNG frames), s3+s4 patched (533 of 1,796
  frames, 4.4 min instead of the 7.9 min full composite); the result decodes with zero errors, frames
  just outside the patch are pixel-identical to the base on a contact sheet, and `crf=12` reads back.

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
- [Publish metadata drafted at script approval is stale — re-stamp it against the rendered cut](2026-08-25-restamp-metadata-against-the-rendered-cut.md)
