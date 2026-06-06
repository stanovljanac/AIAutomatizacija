---
name: qa-video
description: Use to automatically QA a rendered video before the human watches it — checking audio/subtitle/scene sync, no scene change mid-sentence, caption legibility, demo legibility, coverage, black gaps, loudness, and format. Auto-fixes pure technical breakage; flags content issues for owner approval; emits a 30s digest. Triggers on "QA the video", "check sync", or Step 5 of the workflow.
---

# Skill: Video QA

You catch problems **before** the owner watches (PRD R13–R14), and you produce a fast
30-second digest so the final gate is quick. Output: `qa.report.json` (schema
`pipeline/shared/schemas/qa.schema.json`).

## Checks
- **Sync:** each scene's visible window matches its sentences' timestamps.
- **Subtitles (HARD):** caption cues match `alignment.json` (no drift); each cue shows
  **≤ 2 lines** and only while its words are spoken (chunked, never a whole long sentence
  dumped at once); **legible** (size/contrast ≥ 4.5:1). FAIL if any cue exceeds 2 lines or
  text appears before it is said.
- **No overlap (HARD):** captions live in the bottom safe-zone and must **not** cover scene
  graphics; scene content/bottom-anchored elements stay above the caption band. FAIL on overlap.
- **Scene/audio coherence:** no scene change mid-sentence; narration continuous (R11).
- **Demo legibility (mini-demo):** capture region readable; cursor/zoom land on the action.
- **Coverage:** every scene rendered; audio length ≈ sum of scenes; no black gaps.
- **Short length (HARD — STYLE_GUIDE §7):** the Short (nested `content/<id>/short/`; legacy
  flat `*-short`) must be **45-120s** (target ~50-60s), never padded/cut. `build-props.mjs`
  detects it by the last path segment and hard-fails outside this range; QA re-confirms.
  FAIL if outside.
- **Loudness/format:** sane levels (`loudness_lufs`); correct resolution/fps; Short vertical.
- **Pacing/dynamism:** a visual change every ~3-7s; no single scene is a long static hold
  (use beats / reveal-sync / window-aware custom motion).

> These HARD checks exist because they were skipped before. Treat a HARD failure like a
> failed build: fix it (and the upstream skill/script) before the video reaches the owner.

## Fix policy (D-…, owner's rule)
- **Pure technical breakage** (no audio / cut-off / missing captions / black frames):
  **auto-fix and re-render** the offending step (`config.review.qa_autofix_technical`).
- **Content issues** (wrong emphasis, awkward pacing, a claim that needs a source, a
  weak angle): **flag** and propose a fix for the **owner to approve** — do not silently
  change content (human perspective matters).

## Digest (for the final gate)
Emit a `digest` in `qa.report.json`: one-paragraph summary, the **angle**, key claims +
their sources, the fix decisions made, and any flagged risks. ~30 seconds to read.

## Status
- `pass: true` and clean → `brief.json.status: "qa_passed"` → **Gate ③ (human watches)**.
- On unresolved content flags, surface the digest and wait for the owner.
