# Phase 04-render — see pipeline/README.md and the matching skill in .claude/skills/

## Sound design (D-063, opt-in)

The narration is the one continuous track and is never cut. A video may mix **extra** tracks beside
it: a quiet looped bed, and one-shot cues (a riser into a run, an impact on a reveal).

Author it in `scene-plan.json`:

```json
"audio": {
  "bed": { "src": "bed-low-pulse.mp3", "gain": 0.06 },
  "sfx": [{ "src": "impact.mp3", "atSeconds": 196.9, "gain": 0.7 }]
}
```

`atSeconds` is on the **narration clock** (the numbers in `alignment.json`), frame-snapped by
`lib/timeline.mjs` → `timeline.audio_layers` → `compile-remotion.mjs` → `props.bed` / `props.sfx` →
`<Audio>` in `Main.tsx`. Files live in the shared `assets/sfx/` library (CC0 only — see its README)
and are staged into `public/sfx/`. A missing file warns and drops the cue; sound design never kills a
render. A plan with no `audio` block produces byte-identical output to before.

**Scripted silence** is the sibling feature and lives in the voice phase, not here — a script scene
declares `pause_after: [{ after_sentence, seconds }]` and `scripts/make_voice.py` splices real silence
into the narration, widening the beat it sits in.
