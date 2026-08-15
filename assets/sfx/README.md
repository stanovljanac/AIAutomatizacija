# `assets/sfx/` — the shared sound-design library (D-063)

Drop audio files here and reference them **by filename** from a video's `scene-plan.json`:

```json
"audio": {
  "bed": { "src": "bed-low-pulse.mp3", "gain": 0.06 },
  "sfx": [
    { "src": "riser.mp3",  "atSeconds": 182.4, "gain": 0.45 },
    { "src": "impact.mp3", "atSeconds": 196.9, "gain": 0.7  }
  ]
}
```

`atSeconds` is on the **narration clock** — the same numbers you read off `alignment.json`, not
absolute video time. The build snaps each cue to a frame, so it lands exactly on the beat it was
written for.

## Rules

- **This library is shared across every video.** That's the point: a riser and an impact acquired
  once get reused on every hero moment. Name files by what they *do* (`riser`, `impact`, `whoosh`,
  `bed-low-pulse`), never by the video that first used them.
- **Licensing: CC0 / public-domain only** — the channel is monetized and altered-content disclosed;
  a licence question on a sound effect is not worth the strike. Record the source of each file in
  the table below when you add it.
- **Keep the bed quiet.** The narration normalizes to −16 LUFS and nothing here is side-chain
  ducked (deliberately — D-063). A bed above ~0.10 gain will fight the voice.
- A missing file is a **warning**, and the cue is dropped — a render never dies over sound design.

## Where the files come from

**Generated, by default.** `*.mp3` is git-ignored repo-wide, so a *downloaded* cue lives on one
machine and is gone on the next clone — and a missing cue fails soft, so the loss would show up as a
video that quietly has no sound design. The recipe is tracked instead of the result:

```
node scripts/make-sfx.mjs            # write the cues that don't exist yet
node scripts/make-sfx.mjs --force    # regenerate (overwrites)
```

Each cue is one `ffmpeg` expression over time — an envelope, a pitch sweep, a noise layer — so it is
readable and tunable in [`scripts/make-sfx.mjs`](../../scripts/make-sfx.mjs), and regenerating is
byte-identical. Nothing to attribute, no licence question on a monetized channel.

**Acquiring is still the fallback** for anything a formula can't make (a real room tone, a musical
bed). Drop the file in under the cue name it replaces — the generator never overwrites an existing
file without `--force`, so your file wins. Keep it **CC0 / public-domain only** and record it below.
Catalogues: **freesound.org** (filter *Creative Commons 0*) · **pixabay.com/sound-effects** ·
**mixkit.co/free-sound-effects** · **incompetech.com** (CC-BY — attribution required, so prefer CC0).

## Inventory

| File | What it is | Source | Licence |
|---|---|---|---|
| `riser.mp3` | 11.0s — exponential 120→900 Hz sweep, detuned + octave partials, rising air layer and an accelerating pulse; peaks at 10s and **resolves** over ~1s | generated (`make-sfx.mjs`) | ours — none required |
| `impact.mp3` | 1.8s — sub dropping 110→45 Hz + a 180 Hz thud (what phone speakers reproduce) + an 18 ms noise transient | generated (`make-sfx.mjs`) | ours — none required |
| `accent.mp3` | 0.65s — three fast-decaying partials (2100/3150/4200 Hz); bright enough to cut, short enough not to compete | generated (`make-sfx.mjs`) | ours — none required |

## What 016 wants

The s6 hero shot is the first user of this layer. Three cues, in order:

| Cue | Lands on | What it should be |
|---|---|---|
| `riser` | the start of the run (green checks begin) | a slow build under the node-by-node run, ~8–12s, resolving rather than stopping dead |
| `impact` | the hard cut to Gmail (labels snap on) | one clean low hit — this is the transformation |
| `accent` | `0 deleted` landing alone | a small high accent, quieter than the impact; it punctuates, it doesn't compete |

Optionally a `bed-low-pulse` under the whole video at gain ~0.05–0.06.
