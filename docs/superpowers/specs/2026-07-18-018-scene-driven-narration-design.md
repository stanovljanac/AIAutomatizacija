# 018 — Scene-Driven Narration Sync (design)

**Date:** 2026-07-18
**Video:** `content/018-life-story` — pinned "my story" brand-film.
**Problem owner:** owner watched `mystory.mp4` and found the narration drifts ~6 s ahead
of the animation by the midpoint.

## Problem

`narration-timing-v4.json` is **line-driven**: each line's `start`/`end` is just the
previous line's end + a fixed `base_gap` (0.26 s), trimmed to fit 100.05 s. There is no
concept of a *scene*, so the voice slides off the animation's beats:

- "The years pass" lands at **12.01 s**; the animation's scene wants **15.0 s**.
- "Everything starts to have a shape" lands at **36.9 s**; the animation wants **43.0 s**
  (~6 s of accumulated drift).

Trimming can't fix a drift this size — the narration must be **anchored to scene cuts**.

## Principle

Scene is the unit of rhythm; the voice breathes inside it (documentary/ad edit model):
lock the scene beats first, then let narration float within each window. Scene-driven,
not line-driven — confirmed by the owner.

## Source of truth for scene beats

The animation is one authored **GSAP master timeline** in `the-living-notebook.html`
(7 named scenes S1–S7 + transitions). `mystory.mp4` is a recording of that timeline, so
the scene beats already exist as authorial truth — we don't guess them from pixels.

**Extraction (owner-approved method):** copy the HTML into scratchpad (never touch the
original), add `tl.addLabel()` at each scene block, run it in a headless browser
(chromium via hyperframes/remotion; vendor the two GSAP files locally if the CDN is
blocked), and dump `tl.labels` → `gsap-scene-times.json` (absolute seconds per scene).

**Calibration to the mp4:** GSAP gives the *relative* spacing of all 7 scenes; the owner's
known anchors fix the *absolute* map. Fit an affine transform `mp4 = a·gsap + b` from the
anchor pairs, check residuals are small. If the map is non-affine (screen-recording jitter),
fall back to owner-provided per-scene beats.

## Data model — `narration-timing-v5.json`

Flat `lines[]` becomes `scenes[]`:

```jsonc
{
  "video": "mystory.mp4",
  "video_dur": 100.05,
  "voice": "…", "source_track": "voice/narration-v5.mp3",
  "calibration": { "affine": { "a": 1.0, "b": 0.0 }, "anchors": [...], "residuals": [...] },
  "scenes": [
    {
      "id": "s2", "label": "curiosity",
      "start": 17.0,              // hard anchor (mp4 sec)
      "lines": [
        { "i": 4, "text": "…screen starts pulling him…", "pause_before": 0.0,
          "start": 17.0, "end": 24.25 }
      ]
    }
  ]
}
```

## Placement algorithm (per scene, in order)

```
cursor = scene.start
for line in scene.lines:
    cursor    += line.pause_before
    line.start = cursor
    line.end   = cursor + duration(line)
    cursor     = line.end
assert scene.lines[-1].end <= next_scene.start        # overrun guard
```

On overrun: shrink that scene's explicit `pause_before` slack; if still over, emit
`overrun +X.Xs` and trim the VO for that window (Option-B behaviour).

## Anchors & explicit pauses (owner-specified)

| mp4 time | line | rule |
|---|---|---|
| 15.0 | "The years pass" | 0.5 s pause before; spoken at 15.0 |
| 17.0 | "…screen starts pulling him…" | scene 2 start |
| 28.0 | "…how does this actually work?" | line **ends** at 28.0, then 0.5 s pause |
| —    | "So he chases it…" | begins after that pause |
| 43.0 | "Everything starts to have a shape." | at 43.0, then 0.5 s pause |
| —    | "Then he's thrown into the real world, and he starts working." | line 9, whole, after that pause |

## Line 9 stays whole

No split (owner's call, 2026-07-18). Line 9 — "Then he's thrown into the real world, and
he starts working." — plays as one continuous clip after the 0.5 s pause that follows
"Everything starts to have a shape." No re-synthesis; existing v4 line mp3s are reused.

## Budget note

Speech ≈ 89 s over a 100.05 s video → ~8 s of "breath" to distribute. Hitting the 43.0 s
anchor pushes most of that breath into the first half. Feasible but tight; the overrun
guard will surface any window that can't hold its lines, and we trim there.

## Deliverables

1. **Scratchpad one-off** extractor (not committed to `scripts/`) → `gsap-scene-times.json`.
2. Calibration + builder → `narration-timing-v5.json` (scene-structured).
3. Reassembled `voice/narration-v5.mp3` (reuse existing v4 line mp3s) +
   `preview-narration-v5.mp4` for owner review.

## Non-goals

- Not re-recording the animation (Option B stands).
- Not splitting line 9 (owner's call).
- Not switching TTS voice yet (Azure swap is a later, separate step).
- **Not generalizing into the pipeline — 018 is a one-time bespoke job.** The normal
  full workflow (skills/pipeline phases) is used for regular videos; this scene-anchoring
  is a hand-tuned fix for the pinned film only. Keep the tooling in scratchpad.
