---
name: visual-prompts
description: Use to turn an approved storyboard into concrete asset instructions — detailed image-generation prompts for ai-image scenes and derived video-animation prompts for hero-clip scenes, plus stock search queries. Triggers on "image prompts", "generate visuals", "napravi promptove za slike", or Step 3.2 of the workflow. Runs after the storyboard gate, before asset acquisition.
---

# Skill: Visual prompts

You translate an approved `storyboard.json` into precise instructions for getting
each asset: image prompts (for AI generation), animation prompts (for rare hero
clips), and stock search queries. This is Step 3.2 (after Gate ②).

## Read first
- `style/VISUAL_IDENTITY.md` (look, palette, mood — prompts must match the brand).
- The video's `storyboard.json`.
- Schema: `pipeline/shared/schemas/visual-prompts.schema.json`.

## Inputs → Output
- **In:** `content/<id>/storyboard.json`.
- **Out:** `content/<id>/visual-prompts.json`.

## Per scene, by `visual_type`

### `ai-image`
Write a **detailed image prompt** that bakes in the brand look:
- Subject + concept (what abstract idea this scene shows).
- Style descriptors consistent with VISUAL_IDENTITY (e.g. "clean dark UI aesthetic,
  near-black background #0B0F14, electric-blue accent, modern, minimal, high
  contrast, subtle grid, cinematic depth").
- Composition with **room for a camera move** (don't fill every corner — leave
  space for parallax/pan and for on-screen text if any).
- Negative prompt (avoid: text artifacts, watermarks, clutter, garish neon).
- Target aspect: 16:9 for long, 9:16 for Short.
- Output a stable `asset_id` (e.g. `s04-img`) so generation is cached per id.

### `hero-clip` (rare)
Derive a **video-animation prompt** from the image concept: describe the motion
(slow push-in, drifting particles, light sweep), keep it short (2–4s), brand-
consistent. Mark `budget: "hero"` so the pipeline knows it's an expensive, rare
asset (D-004).

### `stock`
Write 1–3 **search queries** for Pexels/Pixabay (concrete nouns/scenes), plus a
fallback query. Note orientation (landscape/portrait).

### `screen-capture`
No prompt — reference the `capture_id` from the storyboard's capture list. If the
human can't capture it, note `mock: true` (Remotion UI mock or AI mock).

### `motion-text`
No image needed — note the exact on-screen text and any emphasis words.

## Output shape (per asset)
```json
{
  "scene": "s04",
  "visual_type": "ai-image",
  "asset_id": "s04-img",
  "prompt": "…detailed, brand-consistent…",
  "negative_prompt": "text, watermark, clutter, neon",
  "aspect": "16:9",
  "camera_move": "parallax",
  "budget": "normal"
}
```

## Principles
- **Brand consistency first** — every AI image should look like it belongs to the
  same channel (same palette/mood). The viewer should feel one identity.
- **Leave space for motion & text** — flat, full prompts kill the camera move.
- **Cacheable** — stable `asset_id`s so Colab generation skips already-done assets
  on a re-run (ARCHITECTURE §4.3).
- **Cost-aware** — only `hero` budget for true generative video, and rarely.

## Handoff
- Stock → fetch via API into `images/`.
- AI images / hero clips → generate on Colab/Kaggle (chunked+cached) into `images/`.
- Then proceed to render (Step 4).

## Don'ts
- Don't write prompts that bake in hard-coded text (let Remotion add text so it's
  crisp, editable, and on-brand).
- Don't request photoreal humans resembling the owner (D-008).
- Don't escalate ordinary scenes to `hero` budget.
