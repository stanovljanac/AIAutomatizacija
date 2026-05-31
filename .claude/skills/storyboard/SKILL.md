---
name: storyboard
description: Use to turn an approved script into a per-scene visual plan (storyboard.json) — deciding what's on screen for each scene (motion-text, stock, AI-image, screen-capture, or hero-clip), composition, and camera move. Triggers on "storyboard", "plan the visuals", "napravi storyboard", or Step 3.1 of the workflow. Runs before visual-prompts and before the storyboard human gate.
---

# Skill: Storyboard

You convert an approved `script.json` into a concrete, scene-by-scene visual plan.
This is cheap to change and expensive to re-render, so it precedes **Gate ②**
(WORKFLOW Step 3). Honor the locked look in `style/VISUAL_IDENTITY.md`.

## Read first
- `style/VISUAL_IDENTITY.md` (palette, fonts, motion language, components).
- The video's `script.json` and `alignment.json` (timings already exist by now).
- Schema: `pipeline/shared/schemas/storyboard.schema.json`.

## Inputs → Output
- **In:** `content/<id>/script.json`, `content/<id>/alignment.json`.
- **Out:** `content/<id>/storyboard.json`.

## For each scene, decide
- `visual_type`: one of
  - `motion-text` — kinetic typography (great for definitions, lists, hooks).
  - `stock` — Pexels/Pixabay clip/image (generic real-world b-roll).
  - `ai-image` — generated image for an abstract concept (animated with a camera
    move so it's not static).
  - `screen-capture` — a real tool recording (best for tutorials/demos).
  - `hero-clip` — a rare generative video moment (intro/marquee only) (D-004).
- `composition`: layout (full-bleed, lower-third + visual, split, card).
- `camera_move`: `ken-burns` | `parallax` | `pan-to-highlight` | `zoom-in` |
  `static-not-allowed` (avoid pure static; D-004 / VISUAL_IDENTITY §4).
- `component`: which Remotion component renders it (ImagePan, ScreenCapture,
  KineticText, ChapterCard, …).
- `on_screen_text`: pull from the scene if present.
- `assets_needed`: e.g. `["stock:ai coding", "capture:claude-code-run"]`.
- `duration_hint`: derived from `alignment.json` (scene span), for sanity only —
  the render uses alignment, not this number.

## Principles
- **No slideshow.** Every scene has motion (camera move or kinetic text). A static
  screenshot held for 8 seconds is forbidden (D-004).
- **Show, don't tell.** Prefer a real `screen-capture` or `ai-image` over generic
  stock when explaining something specific.
- **Variety & rhythm.** Alternate visual types so consecutive scenes don't look the
  same; aim for a visible change every ~3–7s within scenes (VISUAL_IDENTITY §4).
- **Match the script.** `visual_type` must serve the scene's `visual_intent`.
- **Capture list.** Collect every `screen-capture` into a guided shot list the
  human can record with OBS (or mark for an AI/Remotion mock if no access).

## Output rules
- Valid `storyboard.json` (all scenes covered, schema-valid).
- Produce a `captures_needed` summary (list of recordings the human must make).
- Stop for **Gate ②** (human approves the plan) before any asset generation.

## Don'ts
- Don't generate images/prompts here — that's the visual-prompts skill (Step 3.2).
- Don't plan true generative video for ordinary scenes (cost/GPU; D-004).
- Don't ignore the locked visual identity.
