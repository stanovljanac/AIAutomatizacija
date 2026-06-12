# Wave V — Modular video formats + pro motion design (HANDOFF / resume here)

This is the **resume-tomorrow** doc for the visual-quality + modularity track ("Wave V"), inserted
**before** Wave 3 at the owner's request. Pair it with `docs/PROGRESS.md` (newest-on-top log),
`docs/BUILD_LOG.md` (per-wave different-model verifier verdicts), `docs/ROADMAP.md` (status), and
`docs/WAVES_3-5_PLAN.md` (the news/freshness + autonomy track that resumes after this). The full
original plan lives at `~/.claude/plans/shiny-twirling-quokka.md` (machine-local); this committed doc
is the source of truth.

> **Every code task runs the build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`, D-041):
> atomize → build → `npm test` green → **verify with a DIFFERENT model** (Sonnet 4.6) that adds
> regression tests → fix → docs → **commit only when the owner asks**. Log each verifier verdict in
> `BUILD_LOG.md`.

---

## ⚠ Update 2026-06-12 — V7 kickoff (capture push-in + first BOLD hero `hook-prism`); owner steer captured

V6's restrained `hook-kinetic` read "the same as a flat card" to the owner. V7 started the visible lift,
Sonnet-verified PASS (see BUILD_LOG 2026-06-12). Two things shipped + **owner feedback to act on next**:

1. **Capture demos are no longer flat.** `templates/remotion/src/templates/templates.tsx` `CaptureSegment`
   now has a default **cinematic push-in** (scale 1.0→1.20 over 2.5s, `Easing.out(cubic)`, origin
   "50% 40%"), SKIPPED when `props.kenBurns:false` OR an outer `props.focalZoom` (target + scale>1) is
   active (no double-zoom). The owner's call: **push-in is the default but should be used SELECTIVELY, not
   on every capture** — it's video-dependent. The richer per-step motion the owner wants (e.g. an "update/
   new-skill" video: record typing the skill name → **zoom in when Claude's answer returns**; a prompt
   being written → **bigger text + vertical scroll**) is the precise `props.focalZoom` mechanism (works
   today) and bespoke capture handling — author per video in the scene-plan, NOT a global default.
2. **First BOLD hero scene `templates/hyperframes/scenes/hook-prism/`** (Three.js/WebGL): aurora plasma bg
   + glowing particle tunnel + converging 3D glass shards, title crisp on top. Drop-in to the V6 contract
   (same `make-entry.mjs`/variables; vendored three.js+gsap, no CDN; deterministic, silent; 189f both
   orientations). Proven in-pipeline on 004's hook with synced captions.

**OWNER STEER (do this next — tomorrow's hero pass):**
- **Keep the aurora/plasma BACKGROUND style** (he likes it) but **replace the prism/glass SHARDS with
  something else** (shards are the part he doesn't like — pick a cleaner motif; particles/embers/light
  streaks/data-glyphs are candidates).
- **Move the palette toward the BRAND: black + yellow** (logo-driven). Current hero/VISUAL_IDENTITY uses
  dark + blue/mint — the owner now wants it closer to the logo's black/gold. **Flag VISUAL_IDENTITY for a
  palette review** before/with the hero recolor (don't silently diverge).
- **Scope = hook + up to 2 hero moments per video** for now (surgical). Possibly go fuller-HyperFrames /
  more motion-graphics later. Do NOT blanket bold backgrounds on every scene (the V2.5 lesson).
- `hook-prism` stays as the **infrastructure proof + first draft**, not the final look. `hook-kinetic`
  also stays (the calmer option).
- **No redo / no re-architecture:** the hero refinement is a self-contained edit of ONE scene folder
  (`templates/hyperframes/scenes/hook-prism/`). Because it's a drop-in to the V6 contract, the new look
  applies automatically to the **next/any video** — just author it once. It does NOT need to happen
  before continuing; it can land later, in parallel with Waves 3–5.

**Resume tomorrow:** "sutra nastavljamo sa pravljenjem celokupnog sistema" — build out the whole system
(continue toward headless autonomy: Waves 3–5 + the hero recolor above). The V6+V7 engineering is
**committed + pushed**; the hero-look refinement is the open visual task.

---

## ⚠ Update 2026-06-10 — V2.5 (global camera) REVERTED; next = MOTIVATED motion (research-first)

After Phase 0 shipped, an attempt to push past the slideshow feel — **V2.5** — added a *global*
per-scene Ken-Burns camera, zoom-through transitions, a breathing background, and floating text on
**every** scene. **The owner rejected it** ("glup iskreno, bolje mi je kad je statično… tabele na
pola, tekst koji lebdi je katastrofa… bolja mi je verzija 2 od 2.5 mnogo"). It was all uncommitted, so
it was **`git restore`d back to the committed V2 look** (this doc's Phase-0 state) — `npm test` = 242
green, `tsc` 0, working tree clean.

**Two lessons captured (now standing rules — see the `research-first-then-surgical` memory):**
1. **Research-first:** before adding ANY new visual/motion/technical technique, dispatch a research
   subagent (how/when it's used, what it contributes, whether it's even smart) — then apply
   **surgically (opt-in), never globally.** Don't blanket-apply a shiny idea.
2. **Motion must be MOTIVATED.** The owner's actual vision: a prompt/element in a corner, or a
   **picture-in-picture inset like a screen recording**; **zoom IN** to focus on it when it's the
   point, **zoom OUT** when done. (A generalization of the `capture-segment` auto-zoom.) Tables / body
   text / lists stay clean and mostly static — motion only where it earns its keep.

**Status (built, uncommitted, owner-reviewed proof):** the motivated-motion feature now exists on top
of the V2 baseline. Following the research-first rule: a subagent researched motivated zoom / PiP →
owner picked "prompt card + PiP + zoom" → a single-scene proof was approved → it was generalized:
- `pipeline/04-render/lib/focal.mjs` — `resolveCueWindow` maps narration cue words → scene-local
  frames (pure, tested).
- `build-props.mjs` resolves opt-in `props.focalZoom` / `props.pip` per scene (no-op when absent).
- Frame-pure `templates/remotion/src/components/{FocalZoom,PipInset}.tsx` + `anim.ts`
  `focalEnvelope`/`focalTransform`; `Main` wraps **non-custom** opt-in scenes (custom scenes
  self-handle); the `PromptFocus` prompt-card scene (PiP + zoom).
- Declared in `scene-plan.json` — see the `storyboard` skill. **Surgical, never global**; captions
  untouched; tables/lists/body text stay still. 253 tests green; `tsc` 0; Sonnet-verified.
**Resume point:** owner reviews the proof clip/stills (`out/prompt_focus_proof.mp4` + `pf_*` — sent).
If approved, **commit** (currently uncommitted), then proceed to V5 (timeline seam) → V6 (HyperFrames
combo). The same `focalZoom`/`pip` props also enable capture-segment / code / stat zooms.

---

## ✅ Update 2026-06-10 — V5 (engine-agnostic timeline seam) DONE (committed `486b9d0`, Sonnet-verified)

The render step is now split into a **sync half** and an **engine half**, so V6 can add a second
renderer without touching the forced-alignment logic. **`npm test` 275 green; `tsc` 0; fixture props
byte-identical to `content/_FIXTURE/golden-props.json`** (via build-props AND the standalone compile
resume). Built:
- `pipeline/04-render/lib/timeline.mjs` — pure `buildTimeline(...)` → `content/<id>/timeline.json`
  (engine-agnostic, absolute **seconds**, per-scene `engine` field, default `"remotion"`). Carries the
  beats/reveals/focal/caption sync. **Frame-snapped:** every single-value time is stored as
  `(introFrames + round(raw*fps))/fps` so a compiler's `round(sec*fps)` recovers the exact legacy frame
  (captions are intentionally un-snapped — see the code comment + BUILD_LOG for the ≤1-frame rationale).
- `pipeline/04-render/compile-remotion.mjs` — pure `compileTimeline(timeline,{leadFrames,tailSeconds})`
  (seconds→frames, byte-identical) + `copyRemotionAssets(...)` (narration/captures/logos/b-roll) + a
  **standalone CLI** to resume from an existing `timeline.json`.
- `pipeline/04-render/build-props.mjs` — now a thin orchestrator: read inputs → buildTimeline →
  validate + write `timeline.json` → compileTimeline + copy assets → policy warnings → write props.
- `lib/focal.mjs` +`resolveCueWindowSeconds` (build) / `localizeCueWindow` (compile). Schemas:
  timeline (branding/crossfade/motion/engine/focal-seconds) + scene-plan (optional per-scene `engine`).

**The acceptance test (T4.1, minus HyperFrames) is met.** The Sonnet verifier found + the author fixed
an IEEE-754 frame-drift bug (see BUILD_LOG 2026-06-10 V5). **Resume point: V6** below.

---

## ⚠ Update 2026-06-11 — V6 (first HyperFrames hero scene → `combo`) DONE & sync-PROVEN; UNCOMMITTED

The HyperFrames renderer half now exists and is proven on a real video. **`npm test` 296 green; `tsc` 0;
golden-props still byte-identical; Sonnet-verified (2 bugs found + fixed).** Built:
- `pipeline/04-render/compile-hyperframes.mjs` — reads the SAME `content/<id>/timeline.json` as Remotion;
  pure `buildHyperframesJobs` (window math mirrors `compileTimeline` EXACTLY — crossfade pull-back +
  reveal lead, so an HF clip is exactly the scene's `durFrames`), `jobVariables` (the fixed variables
  contract), `buildEntryCommand`+`buildRenderCommand`, side-effecting `renderHyperframesScenes`
  (spawn-injected, idempotent, prepends the vendored `templates/hyperframes/.bin` ffmpeg to PATH, win32
  arg-quoting for the spaced repo path) and `copyHyperframesClips` (clip → `public/<outId>/hf/`, sets
  `props.hfSrc`). Standalone CLI: `node pipeline/04-render/compile-hyperframes.mjs <id> [--force]`.
- `compile-remotion.mjs` passes `engine:"hyperframes"` through (conditional spread; key ABSENT for
  remotion scenes → golden byte-identical). `build-props.mjs` runs the copy/resolve in `combo` mode (it
  NEVER spawns a browser — rendering is the CLI's job). `config.render.engine` = `"combo"`.
- Remotion: frame-pure `components/HfClip.tsx` (full-bleed silent `OffthreadVideo`); `Main.tsx` swaps an
  HF scene's clip in for its template inside the SAME crossfade `Sequence` (captions overlay; graceful
  fallback when `hfSrc` is missing).
- First hero scene `templates/hyperframes/scenes/hook-kinetic/` (kinetic-type hook, deterministic/silent;
  ships a `make-entry.mjs` pre-step — hyperframes v0.6.70 reads frame-count/canvas from STATIC entry
  attributes, so `--variables-file` alone can't set clip length).

**Sync proof:** scratch copy `content/004-hfproof` with the hook tagged `engine:"hyperframes"`,
`props.hf_scene:"hook-kinetic"` → timeline put `s01.0` at fromFrame 45 / durFrames 440; the HF clip
rendered to **exactly 440 frames @30fps, 1920×1080, NO audio**; two Remotion stills inside the window
show the kinetic hero under the synced narration captions. **Resume point: V7** (generalize) — but only
after the **owner reviews the proof stills + says commit** (V6 is uncommitted).

---

## TL;DR — where we are

**Phase 0 (V0–V4b) + motivated-motion + V5 committed `486b9d0`; V6 (HyperFrames `combo`) built &
sync-proven, Sonnet-verified, `npm test` = 296 green, `tsc` 0 — UNCOMMITTED (awaiting owner review +
commit).** The videos went from "centered cards that fade in and crossfade" (a slideshow) to real motion
design; the production policy is a single **modular recipe**; opt-in **motivated motion** (focalZoom/PiP
on cue words) is generalized; **V5** split the render into the engine-agnostic `timeline.json` seam (the
sync logic) + `compile-remotion.mjs` (the renderer); and **V6** added the second renderer
(`compile-hyperframes.mjs`) that reads the SAME timeline to composite a HyperFrames hero scene into
Remotion via `OffthreadVideo` — proven frame-exact on a real video.

**Next: V7** — generalize: a vetted menu of HF hero scenes, `storyboard` routes 1–3 per video,
`qa-video`/`check.mjs` verifies the HF scene window, wire `check.mjs` into the orchestrator. The combo
is the committed end-state (D-019).

## Why this wave exists (context)

The owner watched the early videos and flagged they were "literally a slideshow — slides that move
while a voice talks." Goals: a **strong hook + real visual detail in the first 30 seconds**,
professional **motion design** (kinetic typography, animated/drawn diagrams, number reveals), motion
that is **lively but calm** (NOT constant animation — that distracts), and to **drop stock b-roll**.
Separately, the owner wants the "how videos are made" policy to be **modular** (editable in one place).
A subagent research pass + D-019 settled the engine question: **Remotion stays the core** (it owns the
forced-alignment sync crown jewel), and **HyperFrames** is added for 1–3 flashy "hero" beats per video.
Owner-approved sequencing: **0 → 1 → 2** (Remotion motion lift → timeline seam → HyperFrames), with a
checkpoint after Phase 0.

---

## What's DONE (V0–V4b) and how each piece works

### V0 — the FORMAT recipe (the modular backbone)
- `pipeline/shared/formats/default.json` — the complete base recipe. **This is the one place to edit**
  hook timing, motion intensity, pacing, length, captions, intro/outro, crossfade, scene set,
  per-archetype beat skeleton.
- `pipeline/shared/schemas/format.schema.json` — its schema (top-level closed; only `name` required so
  partial overrides validate via the merged result). Registered in BOTH validators via a **dir-rule**:
  any file under `pipeline/shared/formats/` validates against the format schema
  (`pipeline/shared/validate.js` + `pipeline/shared/lib/validate-lib.mjs`).
- `pipeline/shared/lib/format.mjs` — `resolveFormat(brief, {dir})`: deep-merges
  `default.json ← formats/<series>.json ← formats/<archetype>.json ← brief.format`, then validates the
  result. Override files are **partial** (only the merged result is complete). `deepMerge` replaces
  arrays, never mutates, and treats a null/undefined override as a no-op. Series files don't exist yet
  (only `default.json` is seeded); the override mechanism is there for per-series presets later.

### V1 — build-props reads the recipe (behavior-preserving)
- `pipeline/04-render/lib/timings.mjs` — pure `deriveRenderTimings(fmt, {fps, vertical})` → intro/outro
  frames, crossfade, lead, caption max-words/gap/tail, Short length band. Values mirror the OLD
  hardcoded constants exactly (proven: fixture props identical — intro 45 / outro 75 / xf 9).
- `pipeline/04-render/build-props.mjs` — resolves the format from `brief.json` (fallback
  `script.archetype`), reads timings from it, and passes `fmt.motion` into the emitted props.

### V2 — the motion system (the visible jump)
- `templates/remotion/src/lib/anim.ts` — expanded from one helper (`fadeUp`) to a real **frame-pure**
  vocabulary: `ramp`, `springPreset` (snappy/gentle/bouncy), `countUp` (number count-up), `draw` (SVG
  strokeDashoffset), `pop` (emphasis), `drift` (ambient), `motionScale`/`ambientOn` (intensity budget),
  and pure `splitNumeric`/`formatNumber` (for count-up of "26,000"/"92%"/"3x"…). `fadeUp`/`progress`
  kept unchanged.
- `templates/remotion/src/lib/motion.ts` — `MotionContext`/`useMotion()` carry the **intensity budget**
  (calm | standard | lively) from `props.motion`; `Main.tsx` provides it. This is the "lively but not
  constant" dial — `calm` holds where the narration carries it.
- Upgraded templates in `templates/remotion/src/templates/templates.tsx`: **HookCard** (word-by-word
  kinetic reveal + accent underline draw), **StatCallout** (numbers count up with grouping; emphasis
  pop on landing; non-numeric values fall back to a plain reveal), **Diagram** + **Flow** (SVG draw-on
  connector arrows via a shared `ConnectorArrow`; spring node pops).

### V3 — strong-hook enforcement + new hook scene + drop b-roll
- `pipeline/04-render/lib/policy.mjs` — pure `isHookClass(scene)` (a `hook-card` or a custom scene whose
  `props.component` starts with `"hook"`), `openingHasHook(scenes, openingEndFrame)`, plus the shared
  `SPARSE_TEMPLATES` and `HOOK_TEMPLATES` sets.
- `build-props.mjs` now: WARNS if no hook-class scene opens within
  `format.hook.visual_detail.first_seconds` (default 30s); reads the no-empty threshold from
  `format.pacing.max_static_hold_seconds`; and honors `format.scene_set.broll.enabled` (**false by
  default** → stock b-roll skipped; the fetch path + SceneWrapper branch are kept, just disabled).
- `templates/remotion/src/custom/HookStatReveal.tsx` — a bespoke **hook-class** opener (a big stat
  counts up, then a punch line lands under a drawn accent bar). Registered in `Main.tsx`'s CUSTOM map as
  `"hook-stat-reveal"` and previewed in the gallery.

### V4 — skills + style now read the recipe
- `script-writing`, `storyboard`, `qa-video`, `script-review` skills + `style/STYLE_GUIDE.md` +
  `style/VISUAL_IDENTITY.md` + a `CLAUDE.md` "where everything lives" row + `ROADMAP.md` all point to the
  format recipe as the **single source of truth for the numeric/structural knobs** (the prose keeps the
  *taste*; the recipe keeps the *numbers*).

### V4b — deterministic QA gate (owner-approved hybrid)
- `pipeline/05-qa/lib/check-lib.mjs` — pure `runChecks(props, fmt, {vertical, durationSeconds})` →
  `{pass, checks}`. Artifact-level HARD checks gated by the recipe: **short_length**, **hook_opening**
  (reuses `policy.mjs`), **caption_density**, **no_empty_scene**, **coverage** (black-gap). `pass` is
  false iff any high-severity check fails (**fails-closed**).
- `pipeline/05-qa/check.mjs` — CLI: reads alignment/script/brief + the emitted props, runs the checks,
  writes `content/<id>/qa.report.json` (validated against `qa.schema.json`), exits 1 on a hard failure.
- The **perceptual** half (legibility-in-context, emphasis, demo cursor, scene "fit", weak angle) stays
  in the `qa-video` SKILL, which now runs `check.mjs` FIRST, then does the judgment review on sampled
  frames.

---

## How it all fits (data flow)

```
brief.json ─┐
            ├─► resolveFormat(brief)  ──►  fmt (the recipe)
script.json ┘                                 │
                                              ▼
script + scene-plan + alignment ──► build-props.mjs ─────────────────────────────────────────┐
   (forced-alignment timestamps;          │  buildTimeline() (lib/timeline.mjs)               │
    the SYNC crown jewel, unchanged)       ▼                                                  │
                          content/<id>/timeline.json  (engine-agnostic, SECONDS, per-scene engine)
                                              │  compileTimeline() + copyRemotionAssets()      │
                                              ▼  (compile-remotion.mjs: seconds→frames)         │
                          templates/remotion/props/<outId>.json (+ fmt.motion) ◄───────────────┘
                                              ▼
                                   Remotion: Main (MotionContext=fmt.motion)
                                   → templates/custom scenes → final.mp4
                                              │
content/<id>/qa.report.json ◄── 05-qa/check.mjs (props + alignment + fmt, fails-closed)
```
The **timeline.json seam** decouples the sync logic (buildTimeline) from the renderer (compile-remotion);
the sibling `compile-hyperframes.mjs` (V6, DONE) reads the SAME timeline for `engine:"hyperframes"`
scenes, renders each to a silent clip at its exact window, and composites it back into Remotion via
`props.hfSrc` + `HfClip` (`OffthreadVideo`).

The continuous narration + per-sentence/word alignment sync is **unchanged** — Wave V only enriched the
visuals on top of it and pulled the policy numbers into the recipe.

## Key files — open this for that

| You need to… | Open |
|---|---|
| Change hook/motion/pacing/length/captions policy | `pipeline/shared/formats/default.json` |
| Understand format resolution / overrides | `pipeline/shared/lib/format.mjs` |
| See/extend the motion vocabulary | `templates/remotion/src/lib/anim.ts` (+ `lib/motion.ts`) |
| Edit a scene template's look/motion | `templates/remotion/src/templates/templates.tsx` |
| Add/edit a bespoke (custom) scene | `templates/remotion/src/custom/*` (register in `Main.tsx` CUSTOM) |
| Build the engine-agnostic timeline (sync logic, seconds) | `pipeline/04-render/lib/timeline.mjs` |
| Compile the timeline → Remotion props (frames) + assets | `pipeline/04-render/compile-remotion.mjs` |
| Render HF scenes → silent clips + composite into Remotion | `pipeline/04-render/compile-hyperframes.mjs` |
| Add/edit a HyperFrames hero scene | `templates/hyperframes/scenes/<name>/` (e.g. `hook-kinetic`) |
| Change render timing wiring | `pipeline/04-render/build-props.mjs` (+ `lib/timings.mjs`) |
| Hook/sparse policy logic | `pipeline/04-render/lib/policy.mjs` |
| The deterministic QA gate | `pipeline/05-qa/check.mjs` (+ `lib/check-lib.mjs`) |

## Commands (copy-paste)

```bash
npm test                                            # 296 green (run from repo root)
node pipeline/04-render/build-props.mjs <id>        # timeline.json + Remotion props (needs voice/narration.mp3)
node pipeline/04-render/compile-remotion.mjs <id>   # resume: timeline.json → Remotion props only
node pipeline/04-render/compile-hyperframes.mjs <id> [--force]  # render engine:"hyperframes" scenes → silent clips
node pipeline/05-qa/check.mjs <id>                  # deterministic QA → content/<id>/qa.report.json
node pipeline/shared/validate.js pipeline/shared/formats/default.json   # validate the recipe

# Full combo render (HF hero + Remotion): build → render HF clips → composite → render
node pipeline/04-render/build-props.mjs <id> && node pipeline/04-render/compile-hyperframes.mjs <id> && node pipeline/04-render/build-props.mjs <id>

# Visual checks (Remotion dev gallery — no narration needed):
cd templates/remotion
npx tsc --noEmit                                    # type-check the render project
npx remotion still TemplateGallery out/g.png --frame=22          # one frame (then Read the PNG)
npx remotion render TemplateGallery out/gallery.mp4              # full ~58s gallery clip
```

---

## What's LEFT (after the owner reviews the clip)

### V5 — Engine-agnostic timeline seam (de-risk; render stays identical) — ✅ DONE 2026-06-10
- `build-props.mjs` emits `content/<id>/timeline.json` (engine-agnostic, **seconds**, per-scene
  `engine`); the frames-math + asset-copying moved into `pipeline/04-render/compile-remotion.mjs`
  (pure `compileTimeline` + `copyRemotionAssets` + standalone resume CLI); `lib/timeline.mjs` holds the
  pure `buildTimeline`. **Acceptance MET:** fixture props byte-identical (build-props + standalone
  resume); 275 tests green; tsc 0; Sonnet-verified (IEEE-754 drift bug found + fixed via frame-snapping).

### V6 — First HyperFrames hero scene (flip to `combo`) — ✅ DONE 2026-06-11 (uncommitted, Sonnet-verified)
- `pipeline/04-render/compile-hyperframes.mjs` reads the SAME `content/<id>/timeline.json`, renders each
  `engine:"hyperframes"` scene to a **silent** MP4 at its EXACT scene window (window math mirrors
  `compileTimeline` incl. crossfade pull-back + reveal lead), then composites via `props.hfSrc` +
  `components/HfClip.tsx` (`OffthreadVideo`). `config.render.engine` = `"combo"`. First hero scene
  `templates/hyperframes/scenes/hook-kinetic/` (kinetic-type hook; ships `make-entry.mjs` since
  hyperframes v0.6.70 reads frame-count/canvas from static entry attributes). **Acceptance MET:** sync
  proven on `content/004-hfproof` (HF clip = exactly the 440-frame window, no audio, captions overlay);
  296 tests green; tsc 0; golden byte-identical; Sonnet found+fixed 2 bugs (`jobVariables` cache key,
  `childEnv` alias). **Declare HF scenes in `scene-plan.json`** with `"engine":"hyperframes"` +
  `props.hf_scene:"<scene-dir>"` — see the `storyboard` + `video-render` skills. Chain:
  `build-props` → `compile-hyperframes <id>` (renders the clips) → `build-props` again (composites).

### V7 (follow-up) — Generalize + wire in
- A small vetted menu of HF hero scenes (kinetic-type, drawn architecture diagram, particle/shader bg);
  `storyboard` routes 1–3 per video; `qa-video`/`check.mjs` verifies the HF scene **window** (no black
  gaps, right duration, captions over it).
- **Wire `05-qa/check.mjs` into the orchestrator** (`pipeline/shared/orchestrator/run.mjs`) so the qa
  node runs the deterministic gate before the agent's perceptual pass (headless autonomy).

### Deferred (noted, lower priority)
- **Shared-element continuity** (morph a recurring anchor between scenes) — higher risk vs. the sync
  contract; the persistent BackgroundFX + new per-scene motion already read as continuous.
- **AV-level QA** (ffprobe: real loudness, black-frame, actual resolution/fps) — needs a real render;
  add alongside V6 / Wave 5 headless. (`check.mjs` does the artifact-level checks now.)
- **Align `run.mjs` Short target to the format** — `orchestrator/run.mjs` still passes
  `config.defaults.short_seconds` to the Short derivation; switch it to `format.length.short.target`
  when the orchestrator path is next touched (flagged in BUILD_LOG V1).

### Still needed for the FIRST real hands-off video (from `WAVES_3-5_PLAN.md`, unchanged)
- Owner one-time: `GEMINI_API_KEY` in `.env` (2nd reviewer) + YouTube OAuth (`node pipeline/06-publish/auth.mjs`).
- A Short `scene-plan.json` (storyboard emits it after `make-short` derives `short/script.json`).

## Conventions (don't regress)
- New JSON artifact → schema in `pipeline/shared/schemas/` + register in BOTH `validate.js` and
  `lib/validate-lib.mjs` (or use the `formats/` dir-rule pattern).
- The format recipe is the source of truth for numeric/structural knobs; skills/style hold the taste.
- Remotion components must be **frame-pure** (no `Date.now`/`Math.random`/refs affecting output) — the
  sync + determinism contract depends on it.
- Commit only on explicit owner request; the Stop test-gate hook + a different-model verifier are mandatory.

## How to resume tomorrow
1. Read this doc + the top of `docs/PROGRESS.md` + the top of `docs/BUILD_LOG.md`.
2. Run `npm test` (expect **296 green**) and `cd templates/remotion && npx tsc --noEmit` (expect 0) to
   confirm the baseline before changing anything.
3. **First: owner reviews the V6 proof** (the `content/004-hfproof` stills) and, if happy, says **commit**
   (V6 is uncommitted). The scratch `content/004-hfproof` + `templates/remotion/{props,public}/004-hfproof*`
   are disposable proof artifacts — delete them once reviewed.
4. Then start **V7** (the resume point — see "V7 (follow-up) — Generalize + wire in"): add a vetted MENU of
   HF hero scenes under `templates/hyperframes/scenes/`, have `storyboard` route 1–3 per video (tag
   `engine:"hyperframes"` + `props.hf_scene`), extend `qa-video`/`05-qa/check.mjs` to verify the HF scene
   window (no black gaps, exact duration, captions over it), and wire `check.mjs` into
   `pipeline/shared/orchestrator/run.mjs`. To render a combo video: `build-props <id>` →
   `compile-hyperframes <id>` → `build-props <id>` → Remotion render `Main` with `props/<outId>.json`.
5. Follow the **build-sprint cycle** (atomize → build → `npm test` green → Sonnet verify → fix → docs →
   commit only on request). Log the verifier verdict in `BUILD_LOG.md`.
