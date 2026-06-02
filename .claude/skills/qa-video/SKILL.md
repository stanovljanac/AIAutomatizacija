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
- **Subtitles:** caption cues match `alignment.json` (no drift/overlap); **legible**
  (size/contrast ≥ 4.5:1).
- **Scene/audio coherence:** no scene change mid-sentence; narration continuous (R11).
- **Demo legibility (mini-demo):** capture region readable; cursor/zoom land on the action.
- **Coverage:** every scene rendered; audio length ≈ sum of scenes; no black gaps.
- **Loudness/format:** sane levels (`loudness_lufs`); correct resolution/fps; Short vertical.

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
