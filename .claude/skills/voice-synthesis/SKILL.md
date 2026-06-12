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

## Alignment
- edge-tts emits no WordBoundary events here, so we recover per-word timing from the (clean)
  TTS audio with **faster-whisper** and snap it to the known script:
  `python scripts/make_alignment.py <id>` → `alignment.json` (sentence + word `{start,end}`).
  Re-run it whenever the audio changes (e.g. after the Azure final voice).
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
