---
name: video-render
description: Use to assemble the final video — building render props from script, alignment, scene-plan, and assets, placing scenes in time from the alignment timestamps, playing capture-segments with auto-zoom, building the English caption cues (shipped as subtitles.srt, not burned in — D-072) and the reusable intro/outro, rendering the mp4 + a Short + 3 thumbnail candidate stills via the configured engine (Remotion / HyperFrames / combo). Triggers on "render", "build the video", or Step 4 of the workflow.
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
  timeline. Editing the sync/segmentation → touch `lib/timeline.mjs`. HyperFrames (V6, DONE) =
  `compile-hyperframes.mjs` reads the SAME timeline for `engine:"hyperframes"` scenes.

## Compose
- **No captions in the picture (D-072, owner 2026-10-17).** `format.captions.burn_in` is **false** by
  default: `compileTimeline` emits `burnCaptions:false` and `Main` skips `CaptionsTrack`. The cues are
  still built (same chunking, same timings — QA scans them as the narration text) and ship as
  **`video/subtitles.srt`** (`node pipeline/06-publish/build-srt.mjs <id>` / `<id>/short`), which the
  owner uploads in Studio at publish; a viewer who wants subtitles turns on CC. A video approved with
  captions in the picture is pinned with `brief.format_recipe.captions.burn_in: true` (025). The rules
  below apply to the cues — and to the picture only when `burn_in` is true.
- **Captions (hard rules):** animated **English**, from `alignment.json` (same
  timings → always in sync). **Chunked into ≤ ~7-word groups (≤ 2 lines), each shown only
  while its words are spoken** — never dump a whole long sentence at once (that caused 3-6
  line blocks and text appearing before it was said). `build-props.mjs` builds the chunks;
  `CaptionsTrack` renders one chunk at a time. Large, high-contrast, current-word highlight.
  **Key takes** (`scenes[].key_takes`) are always their own chunk; `format.captions.sentence_breaks`
  breaks at every sentence and splits a long one into even chunks at its punctuation (no one-word
  orphans). Without either, the legacy greedy chunking is unchanged (`lib/timeline.mjs`).
- **Layout safe-zone (hard rule):** the bottom band stays clear of key content even without our
  captions — YouTube's CC and player bar (and on a Short, the Shorts UI) sit there; **scene content and any
  bottom-anchored elements (cards, captions inside custom scenes) must stay above it** so
  nothing on top covers the graphics. On 16:9 the `Frame` reserves a bottom pad and custom
  scenes bias their content upward; the vertical Short keeps its own (already-good) layout.
- **Short length (hard rule — STYLE_GUIDE §7):** the Short (nested `content/<id>/short/`;
  legacy flat `*-short`) runs **45-120s** (target ~50-60s). `build-props.mjs` detects the
  Short by the last path segment and hard-fails outside that range — fix the Short script,
  don't ship 30s. Render it with `build-props.mjs <id>/short` (artifacts use a flat id, e.g.
  `<id>-short`).
- **No intro — the default since D-068 (owner, 2026-10-09; first tried on the 024 Short):**
  `formats/default.json` `intro` is 0 for long and Short. There is no bumper at all — `Main.tsx` skips the
  Intro sequence (not even the xf blend), scene 0 starts at **frame 0** instead of its first word
  (`lib/timeline.mjs`) and has no fade-in (`lib/transitions.mjs`). The hook owns frame 0. Only a video's own
  `brief.format_recipe: { intro: { long_seconds: 1.5 } }` brings a bumper back.
- **Re-voice (Azure final) = re-read every word time.** Scene windows re-time themselves, typed numbers do
  not: on 024 the final voice moved word offsets up to 0.37s and the plan's SFX seconds up to 1.09s.
  Scenes read word marks from props (`cues` / `offsets`; the `fz-*` scenes wrap each typed mark as
  `off("Name", x)`), the per-video plan derives them from `alignment.json`, and typed marks/SFX are carried
  across with a word warp from the draft alignment (kept in `_draft-edge/`). Lesson
  `2026-10-10-a-re-voice-moves-every-word.md`.
- **The motion budget is a default too (D-068):** `compile-hyperframes` hands `format.motion.budget`
  (camera 0.855, background 0.81 and still unless a window opens it, takes at 0.35) to every HF scene
  whose props carry no `motion`. MOTION_SPEC §17.
- **capture-segment scenes:** play `captures/<capture_id>.mp4` inside the scene window. **Never flat:**
  by default the clip gets a cinematic **push-in** (scale 1.0→1.20 over 2.5s, origin upper-centre) so the
  demo always has motion. For a **precise** zoom (punch into a cell/button when the narration names it, a
  prompt that scrolls, etc.) set `props.focalZoom { target:{x,y}, scale, in, out }` on the scene — that
  takes over (the push-in auto-disables so they don't compound). Use bold zooms **selectively** (owner:
  video-dependent, not every capture). `props.kenBurns:false` opts a scene out of the push-in entirely;
  `props.zoomOrigin` re-aims it (owner never edits the footage).
- **Outro:** reusable, **no music on long-form** (sound-design hit only). No intro (above).
- **Motion:** per VISUAL_IDENTITY §4; visual change every ~3–7s, snapped to sentences.

## Outputs
- **ONE file per video, at the best quality — never a second version (owner, 2026-10-16, D-071).** The
  deliverable is `video/final.mp4` (and `short/video/final.mp4`), nothing else: no `-share.mp4`, no
  `-phone.mp4`, no "lighter copy", whatever the size. A kept older render is a backup (`video/_v1/`), not a
  version. Quality is set in code, in one place — `pipeline/shared/lib/encode.mjs` `MASTER_CRF` (12):
  Remotion composites lossless PNG frames at that CRF (`remotion.config.ts`), the HF clips are normalised at
  it, and `repair-dropouts` re-encodes at it. Never re-encode the master below it.
- `video/final.mp4` (long), `short/video/final.mp4` (the nested Short — 1–2 key beats,
  **light music allowed**; length per **STYLE_GUIDE §7** — ~50–60s target, hard max 2:00,
  `config.defaults.short_seconds` / `short_seconds_max`).
- `render/props.json`. Set `brief.json.status: "rendered"`.
- **MANDATORY after every render — repair compositor dropouts:**
  `node scripts/repair-dropouts.mjs content/<id>/video/final.mp4` (and the Short's). Remotion's
  compositor intermittently loses a single frame of an OffthreadVideo clip: the video layer renders
  pure black for one frame while the burned-in caption above it still draws. The clips are normalised
  at render time to reduce it, but that is **not sufficient** — the 022 long cut still kept four.
  The script re-scans after repairing and exits non-zero if anything survived, so a clean exit is the
  evidence. Full write-up:
  `knowledge/desk-knowledge/lessons/2026-08-18-a-rendered-clip-is-not-a-seekable-clip.md`.
- **Thumbnails (04b, after the long render):** `node pipeline/04b-thumbnails/extract.mjs <id>`
  grabs **3 caption-free candidate stills** from the video's own timeline (HF scene clips are
  caption-free by construction; Remotion scenes fall back to a caption-gap grab from final.mp4)
  → `images/thumb_candidate_{1..3}.png` + `thumb_final_{1..3}.png` + `thumb_candidates.json`
  (score + reasons per candidate). The **owner picks** — no AI ranking. The 2-image-prompt flow
  (`visual-prompts`) is the **fallback** when no scene scores well. The orchestrator runs this
  as the `thumbnails` node automatically.

## Fixing ONE scene — patch, never re-render the cut (D-065, 2026-08-23)

**Once `video/final.mp4` exists, a scene fix costs ~4 minutes, not ~2 hours.** The HyperFrames clips
are already cached per scene, so the expensive step is the Remotion composite pass — 11,331 frames at
`--concurrency=1` is about two hours for a 6-minute cut. Re-running all of it to change 11 seconds is
the single biggest waste in the pipeline, and the owner called it out on 023.

```
node pipeline/04-render/build-props.mjs <id>            # after editing scene-plan / the HF scene
node pipeline/04-render/compile-hyperframes.mjs <id>    # re-renders ONLY the changed scene (cached)
node pipeline/04-render/build-props.mjs <id>            # copies the new clip, sets props.hfSrc
node pipeline/04-render/patch-scenes.mjs <id> --scenes s1.0 --out v1.1
node scripts/repair-dropouts.mjs content/<id>/video/final-v1.1.mp4
```

`patch-scenes.mjs` re-renders only the frames the named scenes own, then splices them into the base
mp4. Add `--dry-run` to see the plan first; omit `--out` and it refuses (it will not overwrite the
base render in place). Measured on 023 s1.0: **392 of 11,331 frames = 3.5%**.

Why the splice is safe, and what to keep true if you touch it:
- **x264 puts an IDR frame on every hard scene cut**, so a scene boundary is already a splice point
  (023's keyframes at 0/250/392/642/1070 are exactly the compiled `fromFrame` of s2.0/s4.0).
  `snapToKeyframes` widens outward to the enclosing keyframes, so both cuts are always keyframe cuts.
- **The untouched part is a STREAM COPY** — verified bit-identical, no generation loss, no seam.
- **The replacement frames come from Remotion itself** (`--frames=A-B`), not from ffmpeg, so the
  segment carries the same encoder settings and SPS/PPS as the base and the concat demuxer can run
  with `-c copy`. Measured PSNR against the original head: 50.9 dB (visually lossless).
- **The segment is rendered `--muted` and the base's audio stream is re-muxed untouched** — audio MD5
  identical. Drift is impossible by construction (PRD R11: never slice the audio).
- **Every segment is normalised to the base file's timebase** (`-video_track_timescale`, read off the
  keyframe scan). The concat demuxer keeps only its FIRST input's tbn and does not rescale the rest —
  Remotion writes 90000, our renders carry 15360, and mixing them shipped two broken 023 cuts on
  2026-08-24 (all 11,331 frames present, picture dead at 1:04 under 6:17 of audio).
- The run **verifies frames + played seconds + tbn against the base** and refuses the file otherwise;
  a splice that loses a frame desyncs every caption after it, and one that mixes timebases keeps every
  frame while ending the picture early. Never judge a patched file by the container's `Duration` — it
  reports the longest track, so intact audio masks a truncated video.
- A patched file still needs `repair-dropouts` and `frame-gate` — patching changes which frames were
  composited, not whether the compositor dropped one.

Fall back to a full render when there is no base file, when `alignment.json` changed (every scene
window moves), or when the intro/outro/caption layer changed.

## Engine notes (combo — V6 DONE)
- In `combo` mode Remotion still owns the one continuous narration, the timeline/sync, captions, and
  intro/outro. A scene tagged `engine:"hyperframes"` + `props.hf_scene:"<scene-dir>"` (declared in
  `scene-plan.json`; the dir lives under `templates/hyperframes/scenes/`, e.g. `hook-kinetic`) is
  rendered to a **silent** MP4 at its EXACT scene window and composited via `OffthreadVideo` (`HfClip`).
- **Render order matters — three commands:**
  1. `node pipeline/04-render/build-props.mjs <id>` → writes `timeline.json` (carries the `engine` field)
     + props. It WARNS that the HF clip is missing (expected on the first pass) and the scene would fall
     back to its Remotion template.
  2. `node pipeline/04-render/compile-hyperframes.mjs <id> [--force]` → renders each HF scene to
     `content/<id>/video/hf/<sceneId>.mp4` (idempotent: skips when the clip + its `.variables.json` are
     unchanged). Needs `templates/hyperframes/.bin` ffmpeg (vendored; auto-added to PATH).
  3. `node pipeline/04-render/build-props.mjs <id>` again → now copies the clip into
     `templates/remotion/public/<outId>/hf/` and sets `props.hfSrc` so Remotion composites it.
- The HF clip is rendered to be **exactly** the scene's `durFrames` long — both compilers call the same
  `lib/transitions.mjs` `sceneWindow`, so it covers the window 1:1 with no black gap **by construction**
  (it used to be two hand-mirrored formulas). Keep HF scenes **deterministic + silent**; the clips are
  cached per scene by the variables-file hash.
- **Cache boundary (D-060):** the cache key is the whole variables JSON, so a field is either a render
  input or it isn't. `transition_out` and `direction` both sit **outside** `jobVariables` — editing a
  scene's `direction.premise` re-renders **nothing**. The cache still invalidates *correctly*: changing
  s2's `transition_out` changes **s3's** `durationFrames`, so s3 re-renders and s2 is correctly reused.
- **`templates/hyperframes/_lib/` — the shared scene substrate (D-060 Phase 3).** One vendored
  `gsap.min.js` (was 60 identical copies) + `hf-scene.js`, which owns the whole variables contract:
  `readVars`, the fps/W/H/FRAMES/D derivation, `props`/`beats` normalisation, the `data-duration`
  write, the `portrait` class, the `--u` unit, `cl`/`beatAt`, and `HF.register`. A scene declares its
  contract in two lines (see `_lib/hf-scene.js` header) and spends the rest on art direction.
- **Fully-3D cuts use `_lib/hf-world.js` + `hf-world.css`** (024, 2026-10-08): the shared HDR post
  chain (bloom pyramid, ACES, grade, grain, analytic camera motion blur), the stage, and the builders
  (number `lattice` with wet-floor reflection, real `chat` window, `card`, `frameBox`, `beam`,
  `sparks`, `dust`, `ring`). A scene = `HW.create` + `HW.shots([...])` + its own objects; each 3D scene
  dir carries its own `vendor/three.*.min.js` (the file server roots at the scene). Rules learned
  building it: MOTION_SPEC §15. Measured cost: ~35–65s per 11–19s clip at `--quality standard`,
  ~1 min each at `high`, on the GPU path (`browserGpuMode → hardware`).
- **The motion budget (`HW.motion`, MOTION_SPEC §16, 024 Short):** a scene that reads
  `props.motion = { scale, focus:[[t0,t1]], focusScale }` and passes it to `HW.create({ motion })` and
  `HW.shots(list, D, { motion, kick })` gets camera travel and its ambient clock scaled, and settles
  on each key-take window. No `props.motion` → identity: the scene renders exactly as before.
- **Reference `_lib` as `../../_lib/…` — never `../_lib/…`, and never let `make-entry.mjs` rewrite it.**
  The render entry is disposable and lives in `<scene>/compositions/`, and the HF file server roots at
  the **scene** dir, so a browser-relative `../_lib` escapes the root and 404s. What makes it work is the
  CLI compiler resolving `src`/`href` against the **project** dir, finding an outside-the-project asset
  and copying it into the render output (`[Compiler] Found N asset(s) outside project directory`).
- **A broken HF scene does NOT fail the render — the guard does.** Measured: a 404'd gsap yields
  `gsap is not defined`, no timeline registers, and `hyperframes render` still exits 0 with a valid but
  **frozen** mp4. `detectDeadRender` scans the render log for the 404 / `[Browser:PAGEERROR]` /
  "timelines not registered" signals, **deletes** the clip (else the next run skips it as cached-and-fine)
  and throws. If you ever see that error, fix the scene's asset paths — do not delete the guard.

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
  **transparent**. Don't paint per-scene backgrounds.
- **Scene boundaries (D-060):** `SceneWrapper` no longer crossfades everything. The compiler resolves
  each scene's `fadeIn`/`fadeOut` from the authored `transitionOut` (**default: a hard cut**, landing on
  the narration beat); only `dissolve`/`push` overlap two windows, and the intro/outro **bumpers** keep
  their fixed ~9-frame blend. **A fade of 0 must bypass `interpolate`** — `interpolate(0,[0,0],[0,1])`
  is 0, so the naive path would flash the background for one frame at *every* cut. `fadeIn`/`fadeOut`
  are optional in `MainProps` (`?? xf`), so a pre-D-060 props file still renders as it did.

Render locally (default). If a scene is too heavy, simplify its template before
reaching for cloud.
