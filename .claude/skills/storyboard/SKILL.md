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

## Output & status
- Write `scene-plan.json`; validate:
  `node pipeline/shared/validate.js content/<id>/scene-plan.json`.
- Set `brief.json.status: "planned"`.
- For **mini-demo** scenes, the actual recording is produced by the `screen-capture`
  skill (status → `captured`); thumbnails/rare images by `visual-prompts`.
