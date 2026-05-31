---
name: video-render
description: Use to assemble the final video in Remotion — building render props from script, alignment, storyboard, and assets, placing scenes in time from the alignment timestamps, adding burned-in animated Serbian subtitles and the reusable intro/outro, then rendering the mp4. Triggers on "render", "build the video", "renderuj", or Step 4 of the workflow.
---

# Skill: Video render (Remotion)

You assemble the final video deterministically. Timing comes from
`alignment.json` — you **place scenes and subtitles in time to match the
continuous audio** (PRD R11–R12, ARCHITECTURE §6). You never cut the audio.

## Read first
- `docs/ARCHITECTURE.md` §6 (sync) and `style/VISUAL_IDENTITY.md` (components/look).
- The video's `script.json`, `alignment.json`, `storyboard.json`,
  `visual-prompts.json`, and the assets in `images/` / `captures/`.
- The Remotion project in `templates/remotion/`.

## Inputs → Output
- **In:** all of the above + `voice/narration.wav`.
- **Out:** `content/<id>/render/props.json` and `content/<id>/video/final.mp4`
  (git-ignored). For Shorts also `video/short.mp4`.

## Step 1 — Build `render/props.json`
A single data object driving the Remotion composition:
```jsonc
{
  "fps": 30,
  "width": 1920, "height": 1080,        // 1080x1920 for Short
  "audio": "voice/narration.wav",
  "duration": 467.2,                     // from alignment.json
  "intro": { "variant": "long" },
  "outro": { "variant": "long" },
  "scenes": [
    {
      "id": "s01",
      "start": 0.00, "end": 9.84,        // from alignment (first/last sentence)
      "visual_type": "motion-text",
      "component": "KineticText",
      "props": { "text": "ŠTA JE AI — 2026", "accent": "#4F8CFF" },
      "camera_move": "none"
    },
    {
      "id": "s04",
      "start": 38.2, "end": 49.0,
      "visual_type": "ai-image",
      "component": "ImagePan",
      "props": { "src": "images/s04-img.png", "move": "parallax" }
    }
  ],
  "subtitles": { "source": "alignment.json", "style": "wordHighlight" }
}
```
- **Scene timing:** `scene.start` = start of its first sentence in `alignment.json`;
  `scene.end` = end of its last sentence. This guarantees scenes change exactly on
  sentence boundaries while audio plays continuously.
- **Subtitles:** generated from `alignment.json` word/sentence timings → always in
  sync. Burned-in, animated (word/line highlight), Serbian, per VISUAL_IDENTITY.
- Map each storyboard `component`/`camera_move` to the matching Remotion component
  (KineticText, ImagePan, ScreenCapture, ChapterCard, LowerThird, BackgroundFX).

## Step 2 — Render
- Local first (`config.json.render.location = "local"`):
  `npx remotion render <Composition> out.mp4 --props=render/props.json`.
- If too slow for 7–8 min (OQ2), switch to cloud render.
- Use the **long** intro/outro for long videos, **Short** variants for Shorts.

## Step 3 — Short variant (if `brief.json.format` includes short)
- Reframe to 9:16, keep captions in the safe band (VISUAL_IDENTITY §6), use a
  trimmed scene set (the key beats) or a standalone short script.

## Quality bar (match the reference channels)
- No static holds — every scene has motion (camera move or kinetic text) (D-004).
- Readable subtitles, on-brand colors/fonts, consistent intro/outro.
- A visible change roughly every 3–7s, snapped to sentence boundaries.

## Output rules
- Write `render/props.json` (inspectable; lets QA and humans see the timing plan).
- Render `video/final.mp4`; set `status = "rendered"`.
- Hand off to **qa-video** (Step 5) before any human review.

## Don'ts
- Don't compute timing yourself — read it from `alignment.json`.
- Don't cut/resample the narration audio.
- Don't hardcode per-video styling — use the locked components/props.
- Don't burn text into images; render text in Remotion (crisp, editable).
