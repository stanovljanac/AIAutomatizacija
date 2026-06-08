# `_FIXTURE` — golden test fixture (not a real video)

A tiny, deterministic, schema-valid video unit used by the testkit and by the
Sonnet verifier to exercise every pipeline phase headlessly. It is **committed**
(unlike real `content/<id>/` folders, which are git-ignored) so a fresh clone can
run `npm test`.

- `brief.json` / `script.json` / `scene-plan.json` / `alignment.json` — a 3-scene
  "ideas" archetype about invoice-email triage. No media, no real data.
- `alignment.json` is generated from `script.json` (even word spacing per window);
  regenerate with the one-liner in the F4 task if the script changes.

Do not point real production at this folder.
