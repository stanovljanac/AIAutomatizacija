---
name: video-render
description: Use to assemble the final video — building render props from script, alignment, scene-plan, and assets, placing scenes in time from the alignment timestamps, playing capture-segments with auto-zoom, adding burned-in animated English subtitles and the reusable intro/outro, rendering the mp4 + a Short + 2 thumbnails via the configured engine (Remotion / HyperFrames / combo). Triggers on "render", "build the video", or Step 4 of the workflow.
---

# Skill: Video render

You assemble the final video deterministically from `script.json` + `alignment.json` +
`scene-plan.json` + assets, via the engine in `config.render.engine`
(`remotion` | `hyperframes` | `combo` — chosen in the Phase-2 bake-off, D-019).

## Build props — via the engine-agnostic timeline (V5)
- Run `node pipeline/04-render/build-props.mjs <id>` (Short: `<id>/short`). It does two steps:
  1. **`buildTimeline`** (`lib/timeline.mjs`) → `content/<id>/timeline.json` — the engine-agnostic
     **source of truth** in absolute **seconds**, with a per-scene `engine` field (default `remotion`).
     Scene `start/end` come from `alignment.json` (scene i = first sentence start → last sentence end);
     reveals/focal cues resolve to seconds here. This is the SYNC logic — it lives in ONE place.
  2. **`compile-remotion.mjs`** translates the timeline → Remotion props (seconds→frames, byte-identical)
     and copies assets (narration/captures/logos/b-roll). Resume from an existing timeline with
     `node pipeline/04-render/compile-remotion.mjs <id>`.
- **Never slice the audio** (PRD R11). Map each `template` to its component (VISUAL_IDENTITY §5).
- Editing the renderer (frames math, public/ asset layout) → touch `compile-remotion.mjs`, NOT the
  timeline. Editing the sync/segmentation → touch `lib/timeline.mjs`. Adding HyperFrames (V6) = a new
  `compile-hyperframes.mjs` that reads the SAME timeline for `engine:"hyperframes"` scenes.

## Compose
- **Captions (hard rules):** burned-in, animated **English**, from `alignment.json` (same
  timings → always in sync). **Chunked into ≤ ~7-word groups (≤ 2 lines), each shown only
  while its words are spoken** — never dump a whole long sentence at once (that caused 3-6
  line blocks and text appearing before it was said). `build-props.mjs` builds the chunks;
  `CaptionsTrack` renders one chunk at a time. Large, high-contrast, current-word highlight.
- **Layout safe-zone (hard rule):** captions live in the bottom band; **scene content and any
  bottom-anchored elements (cards, captions inside custom scenes) must stay above it** so
  captions never cover the graphics. On 16:9 the `Frame` reserves a bottom pad and custom
  scenes bias their content upward; the vertical Short keeps its own (already-good) layout.
- **Short length (hard rule — STYLE_GUIDE §7):** the Short (nested `content/<id>/short/`;
  legacy flat `*-short`) runs **45-120s** (target ~50-60s). `build-props.mjs` detects the
  Short by the last path segment and hard-fails outside that range — fix the Short script,
  don't ship 30s. Render it with `build-props.mjs <id>/short` (artifacts use a flat id, e.g.
  `<id>-short`).
- **capture-segment scenes:** play `captures/<capture_id>.mp4` inside the scene window
  with **auto-zoom-to-cursor + highlight** on the noted region (owner never edits).
- **Intro/outro:** reusable, **no music on long-form** (sound-design hit only).
- **Motion:** per VISUAL_IDENTITY §4; visual change every ~3–7s, snapped to sentences.

## Outputs
- `video/final.mp4` (long), `short/video/final.mp4` (the nested Short — 1–2 key beats,
  **light music allowed**; length per **STYLE_GUIDE §7** — ~50–60s target, hard max 2:00,
  `config.defaults.short_seconds` / `short_seconds_max`), `images/thumb_a.png` +
  `thumb_b.png` (from `visual-prompts`).
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
