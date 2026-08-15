---
name: voice-synthesis
description: Use to generate the English narration and the alignment timestamps for a video — synthesizing one continuous edge-tts track from the script and running forced alignment to map sentences/words to time. Triggers on "voice", "narration", "TTS", "generate the voice", or Step 2 of the workflow. This skill owns the sync mechanism that prevents the "voice gets cut when the scene changes" bug.
---

# Skill: Voice synthesis & alignment

You produce the narration and the timing backbone of the whole video. The golden rule
(PRD R11–R12): **the audio is one continuous track and is never cut**; visuals and
captions are positioned in time to match it.

## Voice — dual provider (D-024)
- **Drafts → edge-tts** (free, fast iteration): `python scripts/make_voice.py <id>`.
  **Never ship an edge-tts file in a published video** — edge-tts violates Microsoft's ToS
  for commercial use and is unreliable.
- **Final/published → Azure AI Speech** (licensed, same Andrew voice, 500k chars/mo free):
  `python scripts/make_voice_azure.py <id>` (needs `AZURE_SPEECH_KEY`/`REGION` in `.env`).
  Run it **once the video + Short are locked** (saves the quota), then re-align.
- **One dispatcher picks the backend (the TtsProvider seam — Wave 4 / T4.2):**
  `node pipeline/02-voice/voice-dispatcher.mjs <id> [--final]` — selects the synth script from
  `config.voice.provider` (draft, default edge-tts) or `config.voice.final_provider` (`--final`, Azure)
  via the `VOICE_SCRIPTS` registry. The orchestrator's voice nodes route through it (`voiceArgs`), so a
  provider swap is a config flip and adding a new TTS (ElevenLabs/…) is one registry entry + one script —
  you still call the same `make_voice*.py` underneath. Alignment is unchanged/provider-agnostic.
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

## Alignment
- Per-word timing comes from **edge-tts's own WordBoundary events** — no separate aligner.
  `make_voice.py` writes `voice/narration.mp3` and `alignment.json` in the same pass.
- **edge-tts ≥7 defaults to `boundary="SentenceBoundary"`**, which emits no word events at all and
  lands every word at 0.0s — a valid-looking alignment with a dead clock. The script asks for
  `WordBoundary` explicitly and **fails loud** if none arrive; never "fix" that by removing the guard.
- `python scripts/make_alignment.py <id>` (faster-whisper) exists as the provider-agnostic fallback
  for audio that carries no word events — e.g. re-aligning the Azure final voice. Re-run it whenever
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
- Channel voice was picked by A/B listening to edge-tts voices (`scripts/tts_sample_edge_en.py`);
  the same voice id is used on Azure for the final.
- For drafts iterate with edge; only spend Azure quota on the locked final + Short.
