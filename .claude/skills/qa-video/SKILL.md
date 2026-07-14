---
name: qa-video
description: Use to automatically QA a rendered video before the human watches it — checking audio/subtitle/scene sync, no scene change mid-sentence, caption legibility, demo legibility, coverage, black gaps, loudness, and format. Auto-fixes pure technical breakage; flags content issues for owner approval; emits a 30s digest. Triggers on "QA the video", "check sync", or Step 5 of the workflow.
---

# Skill: Video QA

You catch problems **before** the owner watches (PRD R13–R14), and you produce a fast
30-second digest so the final gate is quick. Output: `qa.report.json` (schema
`pipeline/shared/schemas/qa.schema.json`).

> **Run the mechanical gate FIRST:** `node pipeline/05-qa/check.mjs <id>` — a deterministic,
> fails-closed checker (exit 1 on any HARD failure) that validates the artifact-level rules against
> the resolved format recipe (short length, first-30s hook, caption density, no-empty hold, coverage /
> black-gap) and writes `qa.report.json`. If it fails, fix the upstream script/scene-plan/build-props
> and re-run — don't proceed. THEN do the **perceptual** review below (the things code can't judge):
> legibility-in-context, emphasis, demo cursor/zoom, scene "fit", weak angle — sampling rendered
> frames with vision. The two halves together are the QA pass.

> **Thresholds come from the FORMAT recipe** (`pipeline/shared/formats/default.json`, resolved by
> `pipeline/shared/lib/format.mjs`), not magic numbers — read it first. Short length =
> `format.length.short.{min,max,target}`; caption lines = `format.captions.max_lines`; no-empty hold =
> `format.pacing.max_static_hold_seconds`; the opening-hook window = `format.hook.visual_detail`.
> If a future video uses a non-default format, QA against ITS resolved values.

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
- **Short length (HARD — `format.length.short`):** the Short (nested `content/<id>/short/`; legacy
  flat `*-short`) must be within **`format.length.short.{min,max}`** (default 45-120s, target ~55s),
  never padded/cut. `build-props.mjs` detects it by the last path segment and hard-fails outside this
  range; QA re-confirms. FAIL if outside.
- **Loudness/format:** sane levels (`loudness_lufs`); correct resolution/fps; Short vertical.
- **Pacing/dynamism:** a visual change every ~3-7s; no single scene is a long static hold
  (use beats / reveal-sync / window-aware custom motion).
- **No empty / static scene (HARD — owner rule 2026-06-07):** every scene must fill the frame
  and keep moving. FAIL if a sparse scene runs **longer than `format.pacing.max_static_hold_seconds`
  (default 6s) with no motion/reveals** (e.g. a `lower-third` held for 20s). `build-props.mjs` warns
  on this; the fix is to split the scene into reveal beats or use a fuller/animated template (a sparse
  template like `lower-third` is for SHORT overlays only, never a long standalone scene).
- **Strong hook (HARD — owner rule: jak hook i vizuelni detalji u prvih 30 sekundi):** the opening
  must grab. FAIL if no **hook-class** scene (a `hook-card` or a custom `hook-*` scene, e.g.
  `hook-stat-reveal`) opens the video within `format.hook.visual_detail.first_seconds` (default 30s),
  or if that opening is a static hold with no real motion. `build-props.mjs` warns; QA enforces. The
  first ~30s carry the most retention weight — open on a concrete, sourced hook with visible motion.
  - **Short cut = TIGHTER window (HARD).** On the vertical Short the gate uses
    `format.hook.visual_detail.short_first_seconds` (default **3s**), not the 30s long-form window —
    Short psychology means the purpose-built hook (`script.short_hook`, prepended by `make-short`)
    must land in the first ~3s. Same hook-class rule, tighter clock.

- **No paid-SaaS product names (HARD — owner rule 2026-06-24):** never name a paid SaaS product
  (Expensify, QuickBooks, …) on screen or in narration unless it's in `brief.approved_tools` (a paid
  promo or a tool the owner personally endorses). `check-lib` scans captions + scene-prop strings
  against `PAID_SAAS_DENYLIST`. Use a generic category instead ("a receipt OCR"). See
  [[no-paid-saas-products]].
- **No template slideshow (HARD — owner rule 2026-06-24):** on real-length videos (≥5 scenes) the
  bespoke ratio `(custom|hyperframes|capture-segment)/total` must be ≥ `format.scene_set.custom_ratio_min`
  (`bespoke_ratio`), no gallery template may be used more than `max_same_template` (default 3) times
  (`template_repeat`), and **no identical scene kind back-to-back** at any length (`no_adjacent_repeat`).
  Bespoke scenes keyed by component/hero don't read as repeats. This is the encoded version of
  bespoke-first ([[bespoke-first-video-system]], `style/MOTION_SPEC.md` §6) — author distinct scenes,
  don't reskin one card 5×.

> These HARD checks exist because they were skipped before. Treat a HARD failure like a
> failed build: fix it (and the upstream skill/script) before the video reaches the owner.
> The "is each beat *meaningfully* progressing" judgment (vs tic-motion) stays PERCEPTUAL — watch
> as an average viewer (MOTION_SPEC §1); the code checks are floors, not the whole bar.

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
