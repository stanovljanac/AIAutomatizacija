---
name: storyboard
description: Use to turn an approved script into a deterministic scene-plan (scene-plan.json) — mapping each scene's template tag to its render component and filling its props (titles, bullet lists, comparison rows, diagram nodes/edges, code, capture reference). Triggers on "scene plan", "plan the visuals", "storyboard", or Step 3.1 of the workflow. Fixed templates → this is automatic, with NO human gate.
---

# Skill: Scene plan (template mapping)

You convert an approved `script.json` into a **deterministic** `scene-plan.json`
(schema `pipeline/shared/schemas/scene-plan.schema.json`). Because templates are fixed
(D-013), there is **no human gate here** — you just fill props correctly.

> **Read the FORMAT recipe** (`pipeline/shared/formats/default.json` via `resolveFormat`). It sets
> `scene_set.preferred_templates`, `scene_set.custom_ratio_min` (keep at least this fraction of
> bespoke `template:"custom"` scenes so videos aren't the base gallery on repeat), and
> `scene_set.broll.enabled` — **stock b-roll is OFF by default** (owner dropped it); prefer
> code-drawn / custom scenes over stock footage. Open with a **hook-class** scene (`hook-card` or a
> custom `hook-*` such as `hook-stat-reveal`). Numbers shown to viewers can use `stat-callout`
> (it counts up) for a stronger reveal.

## What you do
For each scene, emit `{ scene_id, template, props }`:
- The `template` is already chosen in the script. Map it to its component
  (`style/VISUAL_IDENTITY.md` §5) and build the `props` it needs:
  - `hook-card` / `section-header` / `cta-card`: `{ title, subtitle? }`
  - `bullet-steps`: `{ title, items: [..] }`
  - `stat-callout`: `{ value, label }`
  - `term-highlight`: `{ term, definition }`
  - `comparison-table`: `{ columns: [..], rows: [[..]] }`
  - `diagram`: `{ nodes: [{id,label}], edges: [{from,to,label?}], reveal: "sequential" }`
  - `code-block`: `{ language, code, highlight_lines? }`
  - `capture-segment`: `{ capture_id }` (the recording fills the scene; render adds zoom)
  - `lower-third` / `transition`: minimal/none.
- Pull text from the scene's `on_screen_text`/`narration`; keep on-screen text short
  (≤ ~6 words per line) and legible (VISUAL_IDENTITY §3).

## Motivated motion (opt-in, surgical — never global)

Motion must **point at something the narration is talking about right now, and stop when it stops**.
Default state is **still** (we reverted a global camera that moved everything — it felt worse). Add
motion ONLY to **single-focus** scenes; keep tables / multi-row lists / body text **static**.

- **`props.focalZoom`** — punch the scene INTO a target, then release:
  `{ "target": { "x": 0.72, "y": 0.30 }, "scale": 1.4, "in": "<cue word>", "out": "<cue word>" }`
  (`target` = focus point as 0..1 fractions of the frame; `scale` ≤ ~1.6; `in`/`out` = narration
  words that trigger the zoom in/out — `out` optional, else holds to scene end). `build-props`
  resolves the cue words to frames. **Use for:** `capture-segment` (zoom to the cursor/region),
  `code-block` (a key line), `stat-callout` (the number), `term-highlight`. **Do NOT use for:**
  `comparison-table`, `bullet-steps`, `icon-list`, `section-header` — they clip/lose the eye.
- **`props.pip`** — a corner inset (prompt card / capture), like a screen recording:
  `{ "anchor": "top-right", "in": "<cue word>", "out": "<cue word>" }` (never bottom — caption zone).
- The bespoke **`prompt-focus`** scene (`template:"custom", props.component:"prompt-focus"`) is the
  brand-pillar "lead with a copy-pasteable prompt" beat: a prompt card slides in as a PiP, then a
  focal zoom punches into it for the pause-and-screenshot moment. Pass `prompt`, `heading`, and
  optional `focalZoom`/`pip` cue words.
- **Gotcha:** put the `in` cue BEFORE the `out` cue in the narration — an inverted order silently
  produces no zoom.

- **`engine`** (optional, per scene) — `"remotion"` (default) or `"hyperframes"` (V6/V7, LIVE). Routes a
  hero beat to a pre-rendered HyperFrames clip composited at the scene window. To use it, set the scene's
  `"engine": "hyperframes"` **and** add `"hf_scene": "<dir>"` to its `props`, where `<dir>` is a scene
  folder under `templates/hyperframes/scenes/`. Available heroes (all read `props.title` + optional
  `props.kicker`/`props.accent`):
  - **`hook-kinetic`** — calmer kinetic-type hook (clean, restrained, electric-blue).
  - **`hook-prism`** — BOLD 3D/WebGL: a brand **black+gold aurora** plasma bg + a rushing particle tunnel
    (kinetic title on top). The draft "prism shards" were removed and the palette moved to brand gold
    (`#ffb020`) in the owner re-skin (2026-06-13) — this is the go-to **bold opener**. Reads `props.title`
    + optional `props.kicker`/`props.accent`.
  - **`bad-row-gate`** — a CINEMATIC **content** beat (GSAP, black+gold): one bad row (e.g. a bad date)
    slides to the validation gate, is rejected with a red reason stamp, and drops into quarantine while
    the clean table stays pristine. Reads `props.{ name?, date?, amount?, reason? }`; pair it with
    `revealOn: "sentences"` so its 5 motion beats sync to the scene's 5 narration sentences. Not a hook —
    a concrete mini-example.
  **Scope (owner): the hook + up to 2 hero moments per video** — surgical, flashy beats only (hook opener,
  a number/section accent). Tables/lists/body text stay in Remotion; do NOT bold-background every scene.
  The clip is rendered to EXACTLY the scene window and Remotion overlays the synced captions on top
  (reveals/captions still come from the alignment). The renderer needs the extra `compile-hyperframes`
  step (see the `video-render` skill); if the clip is missing the scene gracefully falls back to its
  Remotion `template`.

## The scene boundary: `transitionOut` (D-060)

**The default is a hard cut, and the default is usually right** (`style/MOTION_SPEC.md` §3). A cut lands
**on** the narration beat. Before D-060 every boundary was an unconditional 9-frame dissolve that
*pre-rolled* the scene, so 300ms of the previous scene ghosted into every line — authored direction like
*"match-cut the doc into s3"* rendered as the same mush as everything else.

Set `transitionOut` on a scene (or a beat) **only when the boundary is doing work**:

| value | what the compositor does | when |
|---|---|---|
| `cut` (default) | windows abut; the cut lands on the beat | almost always — omit the field |
| `dissolve` | opacity cross-blend over the crossfade | a deliberate time/place jump, a soft settle |
| `push` | B slides in as A slides out | a lateral "next item" move |
| `match` · `morph` · `carry` | **a hard cut** | see below |

**`match`/`morph`/`carry` are a contract with YOU, not an instruction to the renderer.** The two scenes
are independently pre-rendered clips — the compositor has no idea what shape to align, and faking it
would be a lie. A match cut *is* a hard cut whose two frames were **composed to rhyme**. So the enum
value records the intent and makes it reviewable; **you** deliver it by drawing the shared element at the
same size and position in the last frame of scene *k* and the first frame of scene *k+1*. Say which
element that is in `direction.carry`.

On a scene with `beats`, the scene-level value governs the **last** beat's exit; inner boundaries default
to `cut`. The **last scene's** value is ignored (it cross-blends with the outro bumper) — build-props warns.

### Compose the OPENING FRAME (the one thing a cut changes)

Under a dissolve, a scene's first element had a ~7-frame runway to animate in *before* its window. Under a
cut there is no "before" — you cannot animate an element in before its scene exists, so `reveals[0]` clamps
to frame 0. **This is physics, not a bug.**

So: **compose the opening frame to ALREADY SHOW the first element.** A scene that fades up from nothing
now reads as an empty frame on the beat. Open on the thing, then move it.

## `direction`: where the art direction goes

`direction` is the schema'd home for the per-scene art-direction brief — **prose for the AUTHOR of the
visual, never for the renderer**:

```json
"direction": {
  "premise": "The terms doc scrolls; §9 REFUNDS quietly rewrites itself while nobody watches.",
  "palette": "black + gold hero",
  "carry": "the gold §9 chip — same size/position as s3's opening frame"
}
```

- **`premise`** (required) — what the scene is DOING for the viewer, and how it looks/moves. This is what
  a bespoke HyperFrames scene gets written from. When you author that scene under
  `templates/hyperframes/scenes/<dir>/`, build it against the shared contract in `templates/hyperframes/_lib/`
  (`var S = HF.scene({ id, width, height, frames, … })` + `HF.register(id, tl)`; load gsap + `hf-scene.js` as
  `../../_lib/…`) — that is the whole variables/`--u`/beat plumbing, so the scene file is just art direction.
  See the `video-render` skill's engine notes for the contract and the `../../_lib` path rule.
- **`palette`** — colour intent (heroes + intro/outro: black+gold; body: blue+gold).
- **`carry`** — the element that must survive the boundary: your half of a `match`/`morph`/`carry`.

**Do NOT put art direction in `props.note`.** `note` is an ordinary prop — on `008-receipt-to-spreadsheet`
s06 it is a **live rendered string**. Art direction had no documented home, which is exactly why briefs
drifted into an unschema'd field where no renderer or reviewer would ever read them.

**`direction` is inert by contract, and that is a cache rule, not a philosophy.** It never enters
`timeline.json`, so it never reaches the HyperFrames `jobVariables` — which is the whole render cache key.
A prose blob on the render side would re-render the clip on every typo fix. Anything the **renderer** must
obey becomes a new field next to `transitionOut` (the executable side); it is never "`direction` becoming
executable".

## Output & status
- Write `scene-plan.json`; validate:
  `node pipeline/shared/validate.js content/<id>/scene-plan.json`.
- Set `brief.json.status: "planned"`.

> **You only storyboard the LONG video.** The **Short scene-plan is DERIVED**, not hand-authored:
> `deriveShortPlanFile` (`pipeline/01-script/make-short.mjs`) reuses each kept scene's long plan entry under
> the Short's renumbered `scene_id` and strips `engine`/`hf_scene` (the Short is pure Remotion). The orchestrator's
> `plan_short` node calls it automatically after `make-short`. Author a `content/<id>/short/scene-plan.json` by hand
> only to OVERRIDE the derivation — it is respected and never overwritten.
- For **mini-demo** scenes, the actual recording is produced by the `screen-capture`
  skill (status → `captured`); thumbnails/rare images by `visual-prompts`.
