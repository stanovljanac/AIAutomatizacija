---
name: voice-synthesis
description: Use to generate the English narration and the alignment timestamps for a video — synthesizing one continuous edge-tts track from the script and running forced alignment to map sentences/words to time. Triggers on "voice", "narration", "TTS", "generate the voice", or Step 2 of the workflow. This skill owns the sync mechanism that prevents the "voice gets cut when the scene changes" bug.
---

# Skill: Voice synthesis & alignment

You produce the narration and the timing backbone of the whole video. The golden rule
(PRD R11–R12): **the audio is one continuous track and is never cut**; visuals and
captions are positioned in time to match it.

## Voice — one provider, edge-tts (D-076)
- **edge-tts is the channel voice, draft and published alike:** `python scripts/make_voice.py <id>`.
  The voice the owner approves at Gate ③ is the voice that ships — there is **no re-voice step** before
  publish. (D-024's Azure final was retired on 2026-10-20: it re-made the same Andrew voice, cost a
  re-align and moved every typed word time, for no audible gain.)
- **One dispatcher picks the backend (the TtsProvider seam — Wave 4 / T4.2):**
  `node pipeline/02-voice/voice-dispatcher.mjs <id>` — selects the synth script from
  `config.voice.provider` (default edge-tts) via the `VOICE_SCRIPTS` registry. The orchestrator's voice
  nodes route through it (`voiceArgs`), so adding a new TTS (ElevenLabs/…) is one registry entry + one
  script. Alignment is unchanged/provider-agnostic.
- One consistent channel voice = brand recognition. Each scene's `narration` is concatenated
  in order into one continuous track `voice/narration.mp3`; never cut the audio (PRD R11).

## Scripted silence (D-063)
- A designed hold — the beat before a run, the pause after a punchline — cannot come from
  punctuation: measured on our voice, a sentence break buys ~0.42s and an ellipsis ~0.79s. Declare it
  on the script scene instead:
  `"pause_after": [{ "after_sentence": 1, "seconds": 3.2 }]` (index into THAT scene's `sentences`).
- `make_voice.py` then synthesizes in **segments** split at each pause, splices real silence between
  them, and shifts every later timestamp. The scene window still runs from one sentence start to the
  next, so the silence widens the beat it sits in. The track is *lengthened*, never cut.
- Silence is generated with the repo's vendored ffmpeg (`templates/hyperframes/.bin`). Use it
  sparingly — one held beat per video is a device; three is a pacing problem.

## Pace knobs and key takes (024 Short, 2026-10-09)
- **Default pace (D-068)** = the format recipe's `voice` in `pipeline/shared/formats/default.json`:
  `rate "-11%"`, `rate_key "-15%"` — 5% slower than the 024 Short (whose `-6%` / `-11%` measured
  1.10× / 1.166× the long cut's speech time). `make_voice.py` reads it
  (`recipe_pacing`); `config.json`'s `rate` is only the fallback when the recipe has none.
- **Per-video pace** = `brief.voice_rate` (e.g. `"-6%"`) overrides the recipe. A brief that sets its own
  `voice_rate` keeps its own `voice_rate_key` (or none) — the recipe's key rate never mixes in. A nested
  Short with its own `short/brief.json` uses its own; without one it inherits the long brief's. The
  **first** brief found wins.
- **Key takes** = the lines the viewer must remember: `"key_takes": [sentence idx]` on a script scene,
  spoken at `brief.voice_rate_key` (slower than `voice_rate`). A rate change starts a new segment, like a
  pause does.
- **The opening is spoken 12% faster (D-078, MOTION_SPEC §19).** Every sentence that ends within
  `format.opening.max_seconds` (15, estimated from word counts) inside the first `max_scenes` (3) scenes
  is spoken at `faster(rate, opening.tempo)`: `-11%` → `+0%`, a key take's `-15%` → `-5%`. The
  boundary is an ordinary rate-change segment. `alignment.json` records
  `opening: {scenes, sentences, tempo}` for `compile-hyperframes` and QA. `brief.format_recipe.opening.tempo: 1`
  switches it off for one video (a nested Short inherits its long's brief).
- **edge-tts pads a short request to ~1.87s** (measured), so a lone key take would trail ~1s of silence.
  A segment that ends only because the RATE changes is cut back to `RATE_BOUNDARY_TAIL` (0.30s after its
  last word ≈ an ordinary 0.39s sentence break). Pause boundaries are untouched.
- **A rate string is a request, not a measurement.** edge-tts is not repeatable run to run (the same
  `-6%` request gave 20.88s and 20.11s). When a pace target matters, measure it against a reference
  synthesis of the same text (024: `content/024-frozen/render/short_pace.py` → `short/pace.json`).
  Measured on Andrew: long `+3%` → `-6%` = **1.10×** speech time, `-11%` = **1.166×**.

## Alignment
- Per-word timing comes from **edge-tts's own WordBoundary events** — no separate aligner.
  `make_voice.py` writes `voice/narration.mp3` and `alignment.json` in the same pass.
- **edge-tts ≥7 defaults to `boundary="SentenceBoundary"`**, which emits no word events at all and
  lands every word at 0.0s — a valid-looking alignment with a dead clock. The script asks for
  `WordBoundary` explicitly and **fails loud** if none arrive; never "fix" that by removing the guard.
- `python scripts/make_alignment.py <id>` (faster-whisper) exists as the provider-agnostic fallback
  for audio that carries no word events (an outside recording, a future provider). Re-run it whenever
  the audio changes.
- Schema: `pipeline/shared/schemas/alignment.schema.json`.

## Validate (hard gate before proceeding)
- Every `sentences[]` entry in `script.json` must have a timestamp. If any are
  missing/mismatched, **fail with a clear message** and do not proceed (R12).
- `node pipeline/shared/validate.js content/<id>/alignment.json`.

## Output & status
- `voice/narration.mp3` (git-ignored), `alignment.json`.
- Set `brief.json.status: "voiced"`.

## Notes
- Channel voice was picked by A/B listening to edge-tts voices (`scripts/tts_sample_edge_en.py`).
- edge-tts is not repeatable run to run, so **never re-synthesize an approved track** — the master and
  its Shorts keep the narration they were cut to.
