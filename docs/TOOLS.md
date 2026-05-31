# TOOLS

Every tool the system uses: what it does, why we picked it, whether it's free,
its limits, and the link. **Default policy: free.** Paid tools are fallback/opt-in
only and clearly marked. When a step could cost money, the pipeline stops and
flags it (PRD R16).

> Verify versions/prices before relying on them — this space moves fast. Last
> reviewed 2026-05-31.

---

## Quick table

| Role | Default tool | Free? | Fallback / paid | Notes |
|------|--------------|-------|------------------|-------|
| Orchestration / agent | Claude Code | In subscription | — | The brain |
| Script / translation / QA text | Claude (via Claude Code) | In subscription | Claude API | Best Serbian quality |
| Voice (TTS) | Open-source TTS on cloud GPU | Yes | ElevenLabs Creator ~$11/mo | Adapter; decide by listening |
| Forced alignment | WhisperX / aeneas | Yes | — | Gives sentence/word timestamps |
| AI images | Flux / SDXL on Colab | Yes | — | For abstract concepts |
| Stock images/video | Pexels + Pixabay APIs | Yes | — | Commercial-safe, have APIs |
| Screen capture | OBS Studio | Yes | — | You record real tool demos |
| Video render | Remotion | Yes (individuals) | — | React-based, deterministic |
| Cloud GPU | Google Colab + Kaggle | Yes | Colab Pro $ | Kaggle ~30h/wk, longer sessions |
| Audio recording | Audacity | Yes | — | For your voice-clone sample |
| Music (intro/outro) | YouTube Audio Library, Pixabay Music | Yes | — | Only intro/outro |
| Publish | YouTube Data API v3 | Yes (quota) | — | Semi-auto draft upload |
| Subtitles | Generated from alignment.json | Yes | — | Burned-in, animated, Serbian |

---

## 1. Orchestration & text — Claude Code

- **Role:** Runs the whole pipeline, picks skills, writes code, and does all
  text work (script writing, translation/localization, QA review).
- **Why:** It's the brain; best Serbian text quality; already in your subscription
  so effectively free within limits (DECISIONS D-001).
- **Free?** Within your Claude subscription limits.
- **Limits:** Rate/usage limits on heavy days. For batch text, space out runs.
- **Link:** https://www.claude.com/product/claude-code

## 2. Voice (TTS) — open-source first, ElevenLabs fallback

- **Role:** Turn the script's narration into one continuous Serbian audio track.
- **Why this approach:** We build a **TTS adapter** (one interface, swappable
  backends) so the pipeline doesn't depend on any single tool (ARCHITECTURE §7).
- **Default (free):** open-source TTS on a free cloud GPU. Candidates to test for
  Serbian quality, in order:
  1. **Fish Speech / Fish Audio S2** — claims 80+ languages, low-memory, strong
     cloning. Test Serbian output first. Open source.
     https://github.com/fishaudio/fish-speech
  2. **XTTS-v2 (Coqui)** — extremely popular cloning model, BUT **Serbian is not
     in its official language list** (it has ru/cs/pl). Only use if a Serbian
     fine-tune/community model proves good. https://huggingface.co/coqui/XTTS-v2
  3. Newer open multilingual models as they appear (check
     https://github.com/wildminder/awesome-ai-voice).
- **Fallback (paid, opt-in):** **ElevenLabs Creator (~$11/mo)** — can speak
  Serbian with a cloned voice, has commercial rights and professional voice
  cloning (~100 min/mo). **Important:** ElevenLabs has **no Serbian voices in the
  library** and **does not let you export/download the voice model** — generation
  is cloud-only via their API, and the **free tier has no commercial rights**
  (cannot be used on a monetized channel). So free ElevenLabs is not an option for
  publishing; the paid Creator tier is the fallback. (DECISIONS D-003)
  https://elevenlabs.io/pricing
- **Decision rule:** Generate the same Serbian paragraph with each free option,
  listen, and only pay if all free options are clearly unprofessional.

## 3. Your voice-clone sample — Audacity

- **Role:** Record ~30 min of clean Serbian speech to clone your voice.
- **Why:** Free, open-source, great raw recording + built-in noise reduction.
- **Free?** Yes. **Link:** https://www.audacityteam.org/
- **How:** Mic close, quiet treated room, no echo. Read the varied script in
  `voice/RECORDING_SCRIPT.md` (created in Phase 2). 30 min is ideal (not too much):
  instant cloning needs ~1–2 min, but a professional, non-robotic clone benefits
  from 30 min of varied intonation. Record in **Serbian** (output is Serbian).

## 4. Forced alignment — WhisperX / aeneas

- **Role:** Given the continuous audio + the script text, produce timestamps for
  each sentence/word → `alignment.json`. This is the backbone of sync (PRD R12).
- **Why:** WhisperX gives accurate word-level timing; aeneas is a lighter
  text↔audio aligner. Either is fine; pick by ease on your setup.
- **Free?** Yes (open source).
- **Links:** https://github.com/m-bain/whisperX • https://github.com/readbeyond/aeneas

## 5. AI images — Flux / SDXL on Colab

- **Role:** Generate visuals for abstract concepts where no good stock exists.
- **Why:** Free on cloud GPU; high quality. We animate them with camera moves in
  Remotion so they look cinematic without true generative video.
- **Free?** Yes, on free Colab/Kaggle GPU (won't fit your 4GB VRAM locally).
- **Note:** Per-scene generative *video* is deferred to rare "hero" shots only —
  too heavy/costly to be free for every scene (DECISIONS D-004).

## 6. Stock — Pexels & Pixabay APIs

- **Role:** Free b-roll and images, commercial-safe, with APIs for automation.
- **Free?** Yes. Get API keys; put them in `.env` (see SETUP.md).
- **Links:** https://www.pexels.com/api/ • https://pixabay.com/api/docs/

## 7. Screen capture — OBS Studio

- **Role:** Record real tool demos (Claude Code running, a skill executing, a
  benchmark page) — the "show, don't tell" that carries AI content.
- **Why:** Free, professional, the standard. Matches the reference channels'
  style (real footage, not slideshows).
- **Free?** Yes. **Link:** https://obsproject.com/
- **If you can't capture something** (no access to a tool): we recreate it as an
  AI-generated mock or a Remotion-built UI animation (your call per video).

## 8. Render — Remotion

- **Role:** Assemble narration + visuals + subtitles + intro/outro into the final
  mp4, deterministically, driven by `script.json` + `alignment.json` +
  `storyboard.json`.
- **Why:** Mature, huge ecosystem, deterministic ("video as code"), and **free
  for individuals/small teams** (DECISIONS D-007). You already understand React.
- **Free?** Yes for individuals; check the license if you ever incorporate.
- **Link:** https://www.remotion.dev/
- **Alternatives considered:** Revideo (good plan B, React-based, open source),
  Rendervid (open source, has an MCP for agents but newer/less mature). Logged in
  DECISIONS D-007.

## 9. Cloud GPU — Google Colab + Kaggle

- **Role:** Run TTS and image generation that won't fit your local GPU.
- **Why free works:** Colab free gives a T4 (~16GB) but **disconnects after
  ~90 min idle / ~12h max**; Kaggle gives ~30h/week with **longer, steadier
  sessions** — use Kaggle for long batches. We make every job **chunked + cached**
  so a disconnect only repeats the current chunk (PRD R18, ARCHITECTURE §4.3).
- **Links:** https://colab.research.google.com/ • https://www.kaggle.com/code

## 10. Publish — YouTube Data API v3

- **Role:** Create a **private/draft** upload with title, description, tags, and
  thumbnail prepared; you review and click publish (PRD R15, semi-auto).
- **Why:** Free quota; keeps you in control of the final publish action.
- **Free?** Yes within daily quota (uploads are quota-costly; fine at our volume).
- **Setup:** OAuth client; store creds outside git (SETUP.md). Never commit
  tokens/secrets.
- **Link:** https://developers.google.com/youtube/v3

## 11. Subtitles

- **Role:** Burned-in, animated Serbian captions (word/line highlight) generated
  from `alignment.json`, rendered by Remotion.
- **Why burned-in:** Standard for faceless content; holds attention; perfectly in
  sync because it uses the same timestamps as the visuals.
- **Free?** Yes (it's our own render). English auto-captions can be added later
  via YouTube's own tools when the channel grows.

---

## Deferred / not used yet (with reasons)

- **n8n** (free, self-hosted workflow tool): great for *full* automation later;
  deferred to keep the moving parts minimal until the manual pipeline is proven
  (DECISIONS D-006).
- **Paid avatar tools** (HeyGen/Synthesia/D-ID): free tiers are watermarked demos;
  not usable for free publishing. Avatar is deferred anyway (faceless first, then
  a stylized 2D avatar) (PRD §5, DECISIONS D-008).
- **YouTube transcript extractors:** **not used** — extracting transcripts breaks
  YouTube ToS and risks building derivative content. We use clean sources instead
  (DECISIONS D-002).

## Cost summary

- **Today: $0.** Everything default is free or in your existing Claude subscription.
- **First likely paid item (only if needed): ElevenLabs Creator ~$11/mo** for
  voice, and only if free Serbian TTS is clearly not good enough.
- **Later, success-dependent:** cloud storage (e.g. Terabox 1TB free first), maybe
  Colab Pro for faster/longer GPU, maybe a paid render path. All opt-in.
