---
name: visual-prompts
description: Use for the thumbnail step — candidates-first (3 stills extracted from the video's own timeline by pipeline/04b-thumbnails; the owner picks), with 2 image prompts as the FALLBACK when no scene scores well — plus the rare optional concept-image prompt. Triggers on "thumbnail", "image prompt", "generate visuals", or Step 3.2 of the workflow. Does NOT design scenes (that's the scene-plan in storyboard); AI images are opt-in only.
---

# Skill: Visual prompts (thumbnails + rare concept images)

Most visuals are **code-driven** (fixed templates + code-drawn diagrams), so this skill
is small. It handles two things only:

## 1. Thumbnail = CANDIDATES FIRST, owner picks (2026-07-11); prompts are the FALLBACK
- **Primary flow (04b):** after the long render, `node pipeline/04b-thumbnails/extract.mjs <id>`
  extracts **3 caption-free candidate stills** from the video's own timeline — scored
  deterministically from scene metadata (`score-scenes.mjs` `WEIGHTS`: one large focal object,
  high contrast, minimal text; icon walls and bare title cards lose). Outputs
  `images/thumb_candidate_{1..3}.png`, final-ready `thumb_final_{1..3}.png`, and
  `thumb_candidates.json` (score + reasons — kept for future CTR learning).
- **The OWNER picks — no AI thumbnail reviewer/ranking** (owner decision 2026-07-11; revisit
  only with real CTR data). Hand all 3 finals to YouTube Studio's native **Test & Compare**
  when in doubt; record the pick with
  `node pipeline/06-publish/build-metadata.mjs <id> --choose-thumb <#>` (writes `chosen:true`
  + the canonical `images/thumb_final.png`).
- **Fallback (when no scene scores well or the owner rejects all 3): 2 image PROMPTS** the
  owner runs in a **free** tool (Bing Image Creator / Google ImageFX / Ideogram; Colab
  SDXL/Flux fallback) → into `visual-prompts.json`. The prompt makes the dramatic BACKGROUND
  and leaves clean space; do **not** bake words into the image. Never auto-generate an image
  yourself (owner rule 2026-06-07; the code-drawn `Thumbnail` composition stays retired).
- Compositing: the agent **only composites** what the owner asks (e.g. tool logos from
  `assets/brand/`) via the Remotion `ThumbComposite` still — **no title unless the owner asks**.

## 2. Rare concept image (optional, opt-in)
- Only when code-visual + stock genuinely won't convey an idea. Prefer **free stock**
  (Pexels/Pixabay) first.
- If an AI image is truly needed, write a tight prompt and run the **opt-in** Colab
  notebook (`config.ai_images.enabled` must be true). Keep it on-brand (dark, clean).
  AI-video is never used (D-015).

## Output
- `visual-prompts.json` (thumbnail specs + any stock queries / image prompts),
  validated against its schema. Assets land in `images/` (git-ignored).
