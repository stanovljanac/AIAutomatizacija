---
name: video-render
description: Use to assemble the final video — building render props from script, alignment, scene-plan, and assets, placing scenes in time from the alignment timestamps, playing capture-segments with auto-zoom, adding burned-in animated English subtitles and the reusable intro/outro, rendering the mp4 + a Short + 2 thumbnails via the configured engine (Remotion / HyperFrames / combo). Triggers on "render", "build the video", or Step 4 of the workflow.
---

# Skill: Video render

You assemble the final video deterministically from `script.json` + `alignment.json` +
`scene-plan.json` + assets, via the engine in `config.render.engine`
(`remotion` | `hyperframes` | `combo` — chosen in the Phase-2 bake-off, D-019).

## Build props
- Write `render/props.json`: ordered scenes, each `{ scene_id, template, props, start,
  end }` where `start/end` come from `alignment.json` (scene i = first sentence start →
  last sentence end). **Never slice the audio** (PRD R11).
- Map each `template` to its component (VISUAL_IDENTITY §5).

## Compose
- **Captions:** burned-in, animated **English**, from `alignment.json` (same timings →
  always in sync). Large, high-contrast, word/line highlight.
- **capture-segment scenes:** play `captures/<capture_id>.mp4` inside the scene window
  with **auto-zoom-to-cursor + highlight** on the noted region (owner never edits).
- **Intro/outro:** reusable, **no music on long-form** (sound-design hit only).
- **Motion:** per VISUAL_IDENTITY §4; visual change every ~3–7s, snapped to sentences.

## Outputs
- `video/final.mp4` (long), `video/short.mp4` (1–2 key beats, **light music allowed**;
  length per **STYLE_GUIDE §7** — ~50–60s target, hard max 2:00, `config.defaults.short_seconds`
  / `short_seconds_max`), `video/thumb_a.png` + `thumb_b.png` (from `visual-prompts`).
- `render/props.json`. Set `brief.json.status: "rendered"`.

## Engine notes (combo)
- In `combo` mode, Remotion owns the timeline/sync/captions/intro-outro; a `template`
  flagged for HyperFrames is rendered to an MP4 block and imported into the Remotion
  timeline. Keep it deterministic; cache rendered blocks per scene.

## Dynamic scenes (D-022)
- **Visual density follows the narration.** A short line can be one calm template; a beat
  that lists/explains several things must **reveal sub-elements in sync** or split into
  **beats** — never a long static hold over a wall of text.
- **Reveal-sync:** `scene-plan` declares `revealOn: "sentences"` or `cueWords: [...]`; the
  builder turns these into per-element reveal frames from the alignment, passed as
  `props.reveals`. `icon-list`, `flow`, `bullet-steps`, `diagram` honor them.
- **Beats:** a `scene-plan` scene can carry a `beats: [{template, props, sentences:[from,to]}]`
  array — one script scene → several timed visuals (no re-voice needed).
- **Library:** prefer **icons** (`src/icons/Icon.tsx`), **`flow`** / **`icon-list`**, and
  bespoke illustration scenes (`src/custom/*`, `template:"custom"`) over plain text cards.
  Every video should mix in at least one custom/illustrated scene.
- **Continuity:** one persistent `BackgroundFX` lives in `Main`; templates render
  **transparent**; `SceneWrapper` crossfades (~9 frames). Don't paint per-scene backgrounds.

Render locally (default). If a scene is too heavy, simplify its template before
reaching for cloud.
