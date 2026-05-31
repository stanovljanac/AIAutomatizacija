---
name: voice-synthesis
description: Use to generate the Serbian narration and the alignment timestamps for a video — synthesizing one continuous TTS track from the script and running forced alignment to map sentences/words to time. Triggers on "voice", "narration", "TTS", "generiši glas", "sinhronizacija", or Step 2 of the workflow. This skill owns the sync mechanism that prevents the "voice gets cut when the scene changes" bug.
---

# Skill: Voice synthesis & alignment

You produce the narration and the timing backbone of the whole video. The golden
rule: **the audio is one continuous track and is never cut** (PRD R11). Scenes and
subtitles are later positioned in *time* to match the audio, not the other way
around (PRD R12, ARCHITECTURE §6).

## Read first
- `docs/ARCHITECTURE.md` §6 (the sync mechanism) and §7 (compute split).
- The video's `script.json`.
- `pipeline/shared/config.json` → `voice.provider` (`free_tts` | `elevenlabs`).
- Schema: `pipeline/shared/schemas/alignment.schema.json`.

## Inputs → Output
- **In:** `content/<id>/script.json`, `config.json`.
- **Out:**
  - `content/<id>/voice/narration.wav` (git-ignored) — ONE continuous track.
  - `content/<id>/alignment.json` — per-sentence (and word) `{start,end}` seconds.

## Step 1 — Synthesize (TTS adapter)
- Concatenate all scenes' `narration` **in order** into the full narration text
  (keep a map of which sentence belongs to which scene).
- Synthesize as **one continuous audio**. Never render per-scene clips and stitch
  them (that's what caused the old cut-voice bug). Insert natural pauses via
  punctuation, not by slicing.
- Backend via the **adapter** (so the pipeline is vendor-agnostic, D-003):
  - `free_tts`: run the chosen open-source model on Colab/Kaggle (Fish Speech S2
    first; XTTS only if a good Serbian fine-tune exists). Use the cloned-voice
    reference from `voice/` if available.
  - `elevenlabs`: call the API with the cloned voice (paid fallback).
- **Chunking for cloud:** if the model needs chunked input, chunk on **sentence**
  boundaries, synthesize each, then **concatenate into one wav** — the *output* is
  still a single continuous track. Cache each chunk by a stable id so a Colab
  disconnect only repeats the missing chunk (ARCHITECTURE §4.3).
- Target a calm pace (~150–170 wpm). Normalize loudness (e.g. -16 LUFS-ish).

## Step 2 — Forced alignment
- Run WhisperX (word-level) or aeneas (sentence-level) on `narration.wav` against
  the script text.
- Produce `alignment.json`:
```json
{
  "audio": "voice/narration.wav",
  "duration": 467.2,
  "sentences": [
    { "scene": "s01", "index": 0, "text": "…", "start": 0.00, "end": 6.12 },
    { "scene": "s01", "index": 1, "text": "…", "start": 6.12, "end": 9.84 }
  ],
  "words": [ { "scene": "s01", "w": "Veštačka", "start": 0.00, "end": 0.42 } ]
}
```
- Every sentence in `script.json` MUST get a timestamp. Map each back to its scene.

## Step 3 — Validate (fail loudly, don't proceed)
- Sentence count in `alignment.json` == sentence count in `script.json`.
- Timestamps are monotonic (each start ≥ previous end, within tolerance).
- `duration` ≈ last sentence end. No gaps > ~1.5s except intended pauses.
- If any check fails: stop, write a clear error, do **not** mark `voiced`.

## Output rules
- Set `brief.json.status = "voiced"` only after validation passes.
- The render step (Step 4) will use `alignment.json` to place scenes & subtitles.

## Quality / fallback (D-003)
- In Phase 2 we choose the provider by **listening** to the same Serbian paragraph
  from each free option. If free quality is clearly unprofessional, flip
  `config.json.voice.provider` to `elevenlabs`. Log the decision in DECISIONS.

## Don'ts
- **Never** cut/splice the final audio per scene. One continuous track only.
- Don't let scene boundaries fall mid-sentence (scenes change on sentence ends).
- Don't hard-depend on one vendor — always go through the adapter.
- Don't skip validation; bad alignment = drifting subtitles/scenes later.
