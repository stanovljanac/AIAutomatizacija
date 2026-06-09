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

## TL;DR — where we are

**Phase 0 (V0–V4b) is DONE, all Sonnet-verified, `npm test` = 242 green, working tree committed.**
The videos went from "centered cards that fade in and crossfade" (a slideshow) to real motion design,
and the production policy (hook length, motion, pacing, length, captions, scene set) is now a single
**modular recipe** instead of scattered prose + hardcoded constants. A ~58s gallery clip of the visual
jump was rendered and sent to the owner for review (`templates/remotion/out/gallery_v2.mp4`, gitignored).

**Next (awaiting the owner's reaction to the clip):** V5 (engine-agnostic `timeline.json` seam) → V6
(first **HyperFrames** hero scene composited into Remotion, flip `render.engine` to `combo`). The combo
is the committed end-state (D-019); Phase 0 is the Remotion-side foundation it builds on.

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
script + scene-plan + alignment ──► build-props.mjs ──► templates/remotion/props/<outId>.json
   (forced-alignment timestamps;     (timeline math, reads fmt:           │  (+ fmt.motion)
    the SYNC crown jewel, unchanged)  intro/outro/captions/hook/broll)    ▼
                                                       Remotion: Main (MotionContext=fmt.motion)
                                                       → templates/custom scenes → final.mp4
                                              │
content/<id>/qa.report.json ◄── 05-qa/check.mjs (props + alignment + fmt, fails-closed)
```

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
| Change render timing wiring | `pipeline/04-render/build-props.mjs` (+ `lib/timings.mjs`) |
| Hook/sparse policy logic | `pipeline/04-render/lib/policy.mjs` |
| The deterministic QA gate | `pipeline/05-qa/check.mjs` (+ `lib/check-lib.mjs`) |

## Commands (copy-paste)

```bash
npm test                                            # 242 green (run from repo root)
node pipeline/04-render/build-props.mjs <id>        # build Remotion props (needs voice/narration.mp3)
node pipeline/05-qa/check.mjs <id>                  # deterministic QA → content/<id>/qa.report.json
node pipeline/shared/validate.js pipeline/shared/formats/default.json   # validate the recipe

# Visual checks (Remotion dev gallery — no narration needed):
cd templates/remotion
npx tsc --noEmit                                    # type-check the render project
npx remotion still TemplateGallery out/g.png --frame=22          # one frame (then Read the PNG)
npx remotion render TemplateGallery out/gallery.mp4              # full ~58s gallery clip
```

---

## What's LEFT (after the owner reviews the clip)

### V5 — Engine-agnostic timeline seam (de-risk; render stays identical)
- Make `build-props.mjs` emit `content/<id>/timeline.json` (engine-agnostic, **seconds**, schema
  `pipeline/shared/schemas/timeline.schema.json` already exists) with a per-scene `engine` field
  (default `"remotion"`). Move the frames-math + asset-copying into a new `pipeline/04-render/compile-remotion.mjs`.
- **Acceptance:** re-render the fixture and confirm the Remotion props are **byte-identical** to today.
  (This is the long-planned T4.1, minus HyperFrames.)

### V6 — First HyperFrames hero scene (flip to `combo`)
- Build `pipeline/04-render/compile-hyperframes.mjs`: render a scene tagged `engine:"hyperframes"` to a
  **silent** MP4 at its exact duration with **scene-relative** reveal offsets (`reveal_at − scene.start`);
  Remotion imports it via `OffthreadVideo` at the scene window. The one continuous `narration.mp3` lives
  ONLY in Remotion; HF scenes are silent visuals. Author ONE vetted hero scene (e.g. a kinetic-type hook
  or a 3D/shader accent) under `templates/hyperframes/scenes/<name>/`. Flip `config.render.engine` to
  `"combo"`. **Prove sync on one real video** before generalizing. (HyperFrames is installed at
  `templates/hyperframes/`, v0.6.70, but has zero compositions today.)

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
2. Check the owner's reaction to the gallery clip. If the visuals are approved → start **V5** (emit
   `timeline.json` + `compile-remotion.mjs`, prove byte-identical). If the owner wants tweaks → adjust
   `formats/default.json` (timing/intensity) and/or the templates first.
3. Run `npm test` (expect 242 green) and `cd templates/remotion && npx tsc --noEmit` (expect 0) to
   confirm the baseline before changing anything.
