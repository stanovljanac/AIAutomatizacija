---
name: visual-prompts
description: Use to produce the thumbnail spec (2 variants) and the rare optional concept-image prompt — most visuals are code-driven templates/diagrams, so this skill is narrow. Triggers on "thumbnail", "image prompt", "generate visuals", or Step 3.2 of the workflow. Does NOT design scenes (that's the scene-plan in storyboard); AI images are opt-in only.
---

# Skill: Visual prompts (thumbnails + rare concept images)

Most visuals are **code-driven** (fixed templates + code-drawn diagrams), so this skill
is small. It handles two things only:

## 1. Thumbnail spec (every video, 2 variants)
- Build props for the Remotion `ThumbnailTemplate` (VISUAL_IDENTITY §9): a 1–4 word
  English phrase, brand background + accent, one focal element (clean icon / cropped UI
  / bold graphic — no AI-art clutter).
- Produce **2 variants** (e.g. different phrase or focal element) → `images/thumb_a.*`,
  `images/thumb_b.*` (rendered in Step 4). The owner picks one at publish.

## 2. Rare concept image (optional, opt-in)
- Only when code-visual + stock genuinely won't convey an idea. Prefer **free stock**
  (Pexels/Pixabay) first.
- If an AI image is truly needed, write a tight prompt and run the **opt-in** Colab
  notebook (`config.ai_images.enabled` must be true). Keep it on-brand (dark, clean).
  AI-video is never used (D-015).

## Output
- `visual-prompts.json` (thumbnail specs + any stock queries / image prompts),
  validated against its schema. Assets land in `images/` (git-ignored).
