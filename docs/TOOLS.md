# TOOLS

Every tool the system uses: what it does, why we picked it, free/paid, limits, link.
**Default policy: free + local.** Paid/cloud is fallback/opt-in only and clearly
marked; when a step could cost money it stops and flags it (PRD R16).

> Verify versions/prices before relying on them — this space moves fast.
> Last reviewed 2026-06-02.

---

## Quick table

| Role | Default tool | Free? | Fallback / alt | Notes |
|------|--------------|-------|----------------|-------|
| Orchestration / agent | Claude Code | In subscription | — | The brain |
| Script / QA text / angle | Claude (via Claude Code) | In subscription | Claude API | Best English quality |
| Voice (TTS) | **edge-tts** (Microsoft neural) | Yes | (none needed) | Free, local, good English; one channel voice |
| Forced alignment | WhisperX / aeneas | Yes | — | Sentence/word timestamps |
| Render | **Remotion** (+ HyperFrames bake-off) | Yes | Revideo | See §8; engine chosen in Phase 2 |
| Screen capture | OBS Studio | Yes | — | You record mini-demos (synthetic data) |
| Stock images/video | Pexels + Pixabay APIs | Yes | — | Commercial-safe, have APIs |
| AI images (rare, opt-in) | Flux/SDXL on Colab/Kaggle | Yes | — | Optional; not a critical path |
| Cloud GPU (opt-in) | Colab + Kaggle | Yes | — | Only for occasional AI images |
| Music (Shorts only) | YouTube Audio Library, Pixabay Music | Yes | — | No music on long-form |
| Publish | YouTube Data API v3 | Yes (quota) | — | Semi-auto draft upload |
| Subtitles | Generated from alignment.json | Yes | — | Burned-in, animated, English |

---

## 1. Orchestration & text — Claude Code

- **Role:** runs the pipeline, picks skills, writes code, and does all text work
  (script writing, the original angle, QA review).
- **Why:** the brain; best English text; already in your subscription (D-001).
- **Free?** Within your Claude subscription limits.

## 2. Voice (TTS) — edge-tts (DECISIONS D-014)

- **Role:** turn the script narration into one continuous English audio track.
- **Why:** **free, local, and good** — Microsoft neural voices via the `edge-tts`
  package. With English output there is no Serbian-quality problem (the old blocker).
- **How:** pick ONE consistent channel voice (A/B a few in Phase 1), set it in
  `config.json.voice`. Reuse `scripts/tts_sample_edge.py` for sampling.
- **Free?** Yes. No own-voice recording, no ElevenLabs/Fish/OpenAudio.
- **Link:** https://github.com/rany2/edge-tts

## 3. Forced alignment — WhisperX / aeneas

- **Role:** given the continuous audio + script text, produce per-sentence/word
  timestamps → `alignment.json`. The backbone of sync (PRD R12).
- **Free?** Yes. **Links:** https://github.com/m-bain/whisperX • https://github.com/readbeyond/aeneas

## 4. Screen capture — OBS Studio

- **Role:** record real tool demos for the **mini-demo** archetype, on a trivial
  example with **synthetic data**.
- **How:** the `screen-capture` skill produces a precise click-list + a ready OBS
  profile (resolution/FPS/cursor highlight); you click record and follow. The render
  step adds auto-zoom/highlight, so you never edit.
- **Free?** Yes. **Link:** https://obsproject.com/

## 5. Stock — Pexels & Pixabay APIs

- **Role:** occasional free b-roll/images, commercial-safe, with APIs.
- **Free?** Yes. Get API keys; put them in `.env` (see SETUP.md).
- **Links:** https://www.pexels.com/api/ • https://pixabay.com/api/docs/

## 6. AI images — optional, opt-in (DECISIONS D-015)

- **Role:** rare concept illustrations / thumbnail backgrounds where code-visuals and
  stock won't do.
- **Why optional:** the channel's professionalism comes from clarity (clean
  motion-graphics, readable diagrams, real captures), not AI b-roll, which can read as
  "slop." So this is a side tool, never the critical path.
- **Where:** Flux/SDXL on free Colab/Kaggle GPU (won't fit a 4GB local GPU). Chunked +
  cached. **AI-video is deferred.**

## 7. Cloud GPU — Colab + Kaggle (opt-in)

- **Role:** run the optional AI-image notebook only.
- **Note:** kept available but **not required** for normal production. Local-first.

## 8. Render — Remotion (+ HyperFrames bake-off) (DECISIONS D-019, D-007)

- **Remotion:** React, mature, deterministic ("video as code"), free for individuals,
  already set up. Owns timeline/sync/captions/intro-outro.
  https://www.remotion.dev/
- **HyperFrames** (HeyGen, open-source): HTML/CSS/JS → deterministic MP4, **agent-native**
  (works with Claude Code skills; LLMs author HTML reliably), supports GSAP/Lottie/
  Three.js, 50+ blocks. Candidate for flashy scene-blocks imported into Remotion.
  https://github.com/heygen-com/hyperframes
- **Decision:** Phase-2 bake-off → set `render.engine` to `remotion` | `hyperframes` |
  `combo`. Revideo is the documented plan-B (React, open source).

## 9. Music — Shorts only

- **Role:** light background bed on **Shorts**. **No music on long-form** (clean voice +
  subtle sound-design only). Source: YouTube Audio Library / Pixabay Music (free).

## 10. Publish — YouTube Data API v3

- **Role:** create a **private/draft** upload (title, description, tags, chapters,
  thumbnail) + the Short; you review and click publish (PRD R15).
- **Setup:** OAuth client; store creds outside git (SETUP.md). Never commit tokens.
- **Link:** https://developers.google.com/youtube/v3

## 11. Subtitles

- **Role:** burned-in, animated **English** captions from `alignment.json`, rendered by
  the engine — perfectly in sync (same timestamps as the visuals).

---

## Deferred / not used (with reasons)

- **ElevenLabs / Fish / OpenAudio / voice cloning** — unnecessary now that output is
  English (edge-tts is free and good). The old Serbian-TTS struggle is closed (D-014).
- **Audacity / own-voice recording** — retired (faceless, AI voice only).
- **Avatar tools (HeyGen avatars/Synthesia/D-ID)** — dropped permanently (faceless).
- **YouTube transcript extractors** — not used (ToS/derivative risk, D-002).
- **n8n** — deferred until the manual pipeline is proven (D-006).

## Cost summary

- **Today: $0**, fully local (edge-tts + Remotion + stock) within the Claude
  subscription. No first-likely-paid-item anymore — the optional cloud GPU is free too.
