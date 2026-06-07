---
name: visual-prompts
description: Use to produce the thumbnail spec (2 variants) and the rare optional concept-image prompt — most visuals are code-driven templates/diagrams, so this skill is narrow. Triggers on "thumbnail", "image prompt", "generate visuals", or Step 3.2 of the workflow. Does NOT design scenes (that's the scene-plan in storyboard); AI images are opt-in only.
---

# Skill: Visual prompts (thumbnails + rare concept images)

Most visuals are **code-driven** (fixed templates + code-drawn diagrams), so this skill
is small. It handles two things only:

## 1. Thumbnail = always 2 PROMPTS for the owner (HARD — owner rule 2026-06-07)
- **NEVER auto-generate the thumbnail yourself** (neither the old code-drawn `Thumbnail`
  composition nor any agent-made image — they were poor). **Always write exactly 2 image
  prompts** the owner runs in a **free** tool (Bing Image Creator / Google ImageFX /
  Ideogram; Colab SDXL/Flux fallback) → into `visual-prompts.json`. The prompt makes the
  dramatic BACKGROUND and leaves clean space; do **not** bake words into the image.
- After the owner drops their chosen image in `images/`, the agent **only composites**
  what the owner asks (e.g. the tool logos from `assets/brand/`) via the Remotion
  `ThumbComposite` still — **no title unless the owner asks**. Render to a final PNG; the
  owner uploads it. (The legacy code-drawn `Thumbnail` composition is retired for production.)

## 2. Rare concept image (optional, opt-in)
- Only when code-visual + stock genuinely won't convey an idea. Prefer **free stock**
  (Pexels/Pixabay) first.
- If an AI image is truly needed, write a tight prompt and run the **opt-in** Colab
  notebook (`config.ai_images.enabled` must be true). Keep it on-brand (dark, clean).
  AI-video is never used (D-015).

## Output
- `visual-prompts.json` (thumbnail specs + any stock queries / image prompts),
  validated against its schema. Assets land in `images/` (git-ignored).
