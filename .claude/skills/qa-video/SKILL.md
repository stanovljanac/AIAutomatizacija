---
name: qa-video
description: Use to automatically QA a rendered video before the human watches it — checking audio/subtitle/scene synchronization, that scenes never change mid-sentence, subtitle drift, coverage, black gaps, loudness, and format. Triggers on "QA the video", "check sync", "proveri video", or Step 5 of the workflow. Produces qa.report.json; early phase flags issues, later phase can auto-reject and re-run.
---

# Skill: Video QA

You catch problems **before** the human watches (PRD R13). Your top priority is the
exact issue the owner cares about most: **subtitles and audio must match, and
scene changes must align with the audio — never cut the voice or switch scenes
mid-sentence** (PRD R12).

## Read first
- The video's `script.json`, `alignment.json`, `storyboard.json`,
  `render/props.json`, and `video/final.mp4`.
- `docs/ARCHITECTURE.md` §6 (what "in sync" means here).
- Schema: `pipeline/shared/schemas/qa.schema.json`.

## Inputs → Output
- **In:** the files above.
- **Out:** `content/<id>/qa.report.json`:
```json
{
  "pass": false,
  "checked_at": "2026-05-31T00:00:00Z",
  "checks": [
    { "name": "scene-on-sentence-boundary", "pass": false,
      "detail": "Scene s05 starts at 41.9s but sentence ends at 42.4s (mid-sentence).",
      "scene": "s05", "severity": "high",
      "fix": "Re-render: snap s05.start to alignment end of previous sentence." }
  ],
  "summary": "1 high sync issue."
}
```

## Checks (run all)
1. **Scene-on-sentence-boundary (critical):** every `scenes[i].start/end` in
   `render/props.json` equals an alignment sentence start/end (within ~50ms). No
   scene boundary lands inside a sentence. → `high` if violated.
2. **Subtitle sync:** subtitle cue times match `alignment.json` word/sentence
   times; no drift accumulation; no overlapping cues; cues on screen long enough
   to read. → `high` on drift.
3. **Audio continuity:** narration plays as one track; total `duration` matches
   `alignment.json`; no silence gap > ~1.5s that isn't intended. → `high`.
4. **Coverage:** every scene in `script.json` appears in `props.json` and is
   visible for its full span; no missing scenes. → `high`.
5. **No black/empty frames** between scenes (transition overlaps cover cuts). →
   `medium`.
6. **Format:** resolution/fps correct (1920×1080@30 long / 1080×1920@30 Short);
   Short captions inside safe band. → `medium`.
7. **Loudness/clipping:** integrated loudness in a sane range; no clipping. →
   `medium`.
8. **Motion sanity:** flag any scene that is effectively static for > ~6s (D-004
   "no slideshow"). → `low/medium`.

## How to measure
- Use `render/props.json` + `alignment.json` for timing checks (cheap, exact).
- Use `ffprobe`/`ffmpeg` on `final.mp4` for duration, fps, resolution, loudness,
  and black-frame detection. (Subtitle timing is best verified against props +
  alignment rather than OCR.)

## Pass rule & behavior
- **`pass: true`** only when there are **no `high`** issues.
- **Early phase (PRD R14):** flag everything; the human decides at Gate ③.
- **Later phase (ROADMAP P5):** for known fixable `high` issues (e.g. a scene
  boundary off by a few ms), you may **auto-instruct a re-render** of the affected
  scene via video-render, then re-check — without human help.

## Output rules
- Always write `qa.report.json`. Set `status = "qa_passed"` only when `pass: true`.
- Name the exact scene/cue and a concrete fix for every issue (so a re-render is
  targeted, saving render time).

## Don'ts
- Don't pass a video with any `high` sync issue — that's the whole point.
- Don't "fix" by cutting audio; fix by re-snapping scene timing to alignment.
- Don't skip QA to save time; it runs before every human review.
