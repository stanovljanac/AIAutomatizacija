---
name: voice-synthesis
description: Use to generate the English narration and the alignment timestamps for a video — synthesizing one continuous edge-tts track from the script and running forced alignment to map sentences/words to time. Triggers on "voice", "narration", "TTS", "generate the voice", or Step 2 of the workflow. This skill owns the sync mechanism that prevents the "voice gets cut when the scene changes" bug.
---

# Skill: Voice synthesis & alignment

You produce the narration and the timing backbone of the whole video. The golden rule
(PRD R11–R12): **the audio is one continuous track and is never cut**; visuals and
captions are positioned in time to match it.

## Voice
- Engine: **edge-tts** (free, local). Single channel voice from `config.json.voice`
  (`provider: "edge-tts"`, `edge_tts.voice`, e.g. `en-US-AndrewNeural`). One consistent
  voice across all videos = brand recognition (D-014).
- Concatenate every scene's `narration` in order into one text, TTS it to
  `voice/narration.wav`. Respect `target_wpm` and normalize to `loudness_lufs`.

## Alignment
- Run forced alignment (WhisperX or aeneas) on the continuous audio + the script text →
  `alignment.json` mapping each **sentence** (and word) to `{start, end}` seconds.
- Schema: `pipeline/shared/schemas/alignment.schema.json`.

## Validate (hard gate before proceeding)
- Every `sentences[]` entry in `script.json` must have a timestamp. If any are
  missing/mismatched, **fail with a clear message** and do not proceed (R12).
- `node pipeline/shared/validate.js content/<id>/alignment.json`.

## Output & status
- `voice/narration.wav` (git-ignored), `alignment.json`.
- Set `brief.json.status: "voiced"`.

## Notes
- Phase 1 picks the channel voice by A/B listening to a few edge-tts voices; reuse
  `scripts/tts_sample_edge.py` for sampling.
- Chunk/cache long narrations so re-runs are cheap (pipeline contract §4.3).
