# PRD — Product Requirements Document

**Project:** AIAutomatizacija — automated Serbian-language AI YouTube channel
**Owner:** solo creator (you)
**Status:** Phase 0 (foundation) — see `docs/ROADMAP.md`
**Last updated:** 2026-05-31

---

## 1. Problem & opportunity

The Balkan/Serbian-speaking audience has almost no high-quality, consistent,
Serbian-language coverage of the fast-moving AI space. Most good content is in
English. There is a window to become the go-to Serbian channel for:

- AI news & model releases (Claude, GPT/Codex, Gemini, open models…)
- "How to actually use AI" explainers and tutorials
- New tools, skills, MCP servers, prompting techniques
- Practical automation and workflows

The catch: producing video is slow and the creator has ~3–4h on weekdays and
~7–8h on weekend days, no video-editing experience, and an old PC. So the channel
**must be automated** to be viable.

## 2. Goal

Build a **robust, scalable, mostly-hands-off system** that turns a *topic* into a
*published, professional Serbian video* with minimal human time — where the human
only reviews at three gates (script, storyboard, final video).

Success for the system = "press a button, get a publish-ready video that needs
only a quick human review."

## 3. Non-goals (explicitly out of scope, for now)

- Word-for-word translation/dubbing of other people's videos. **Never.**
- Real-time / live content.
- Multi-language output (Serbian only at first; YouTube auto-captions can add
  English later).
- A web dashboard / SaaS. CLI + Claude Code is enough until full automation.
- Paid tools as defaults. Paid is fallback only, documented and opt-in.

## 4. Target user (the channel's audience)

Serbian-speaking, AI-curious viewers: developers, students, founders, tech
enthusiasts, and "I keep hearing about AI, explain it to me" beginners. Tone is
"a knowledgeable older brother/colleague explaining it to you" — clear, warm,
professional, not stiff, not dumbed-down.

## 5. Content strategy

- **Formats:** mid/long videos (7–10 min) for watch-time & monetization, plus
  Shorts (mostly repurposed from long videos, sometimes standalone news bites).
- **Cadence (initial):** ~1 long video every 2–3 days + ~1 Short/day, ramping as
  the system matures toward potentially daily once fully automated.
- **Pillars (early videos, to "catch up"):**
  1. What is AI / what can it do (2026 state of the art)
  2. The major players & models (who's who)
  3. How to actually use AI day to day
  4. Tools, skills, MCP, prompting techniques
  5. News & releases as they happen
- **Channel niche:** AI generally (news + education), not just "automation." See
  naming discussion in `style/CHANNEL.md`.

## 6. Hard requirements

### 6.1 Originality & legal
- R1. Sources are used for **topics and facts only**, never reproduced sentences.
- R2. No word-for-word translation of any third-party script.
- R3. Visuals and voice are our own; tool screenshots are of our own sessions.
- R4. If a piece is *strictly someone's original IP* (e.g. their named skill we're
  reviewing), the publish step asks the human whether to credit the source.
- R5. We do **not** scrape YouTube transcripts (ToS risk). Facts come from blogs,
  docs, GitHub, newsletters, press releases. See `docs/DECISIONS.md` D-002.

### 6.2 Language & script quality (see `style/STYLE_GUIDE.md`)
- R6. No invented words. No needless "smart-sounding" jargon.
- R7. No English words spelled phonetically as Serbian when a clean Serbian word
  exists; the **term bank** (`style/TERMBANK.md`) is the authority. Accepted
  loanwords (prompt, token, embedding→embedovani) are allowed per the term bank.
- R8. Clear, fluent, calm pacing so every fact is heard clearly.
- R9. Script is written **segmented into scenes** so downstream automation can map
  text → audio → visuals cleanly.
- R10. Every script passes the **review agent** and is corrected before a human
  reads it.

### 6.3 Audio/visual sync (the "voice gets cut when scene changes" problem)
- R11. The voice-over is **one continuous track** generated from the whole script;
  it is **never cut**.
- R12. Scene changes happen on **sentence boundaries**, using forced-alignment
  timestamps; subtitles use the same timestamps. Result: scenes, audio, and
  captions are always in sync. See `.claude/skills/voice-synthesis/SKILL.md`.

### 6.4 Quality control
- R13. Automated QA runs before any human review (script QA + video QA).
- R14. **Early behavior:** QA *flags* issues, human decides. **Later behavior:**
  once rules are mature, QA may auto-reject & re-run a step. See ROADMAP.
- R15. Human gates: **script**, **storyboard**, **final video** (must approve
  before publish).

### 6.5 Cost & hardware
- R16. Default cost = **$0**. Paid is fallback/opt-in only.
- R17. The creator's PC (GTX 1050Ti 4GB VRAM, 16GB RAM, Windows) is the
  **orchestrator**. GPU-heavy steps run on **free cloud GPU** (Colab/Kaggle).
- R18. All heavy/cloud steps are **idempotent, resumable, and cached** so a
  dropped Colab session only repeats the current chunk, never the whole job.

### 6.6 Engineering
- R19. Monorepo, clearly foldered, each segment with its own rulebook.
- R20. `CLAUDE.md` is a thin router; rules live in the relevant skill/style file.
- R21. Code & docs in English; channel output in Serbian.
- R22. Media out of git; only text/JSON/config committed.
- R23. Documentation written as if for a team, so a newcomer can run it.

## 7. The system, in one diagram

```
            ┌─────────────────────────────────────────────────────────┐
            │                     ORCHESTRATOR                          │
            │              Claude Code (on your PC)                     │
            └─────────────────────────────────────────────────────────┘
   topic        script         voice           visuals        render   publish
 ┌────────┐  ┌──────────┐   ┌──────────┐    ┌──────────┐   ┌────────┐ ┌────────┐
 │00-topic│→ │01-script │ → │02-voice  │ →  │03-visuals│ → │04-rend.│→│06-pub. │
 │ discover│ │ write+QA │   │ TTS+align│    │ shots+AI │   │Remotion│ │ YT API │
 └────────┘  └────┬─────┘   └────┬─────┘    └────┬─────┘   └───┬────┘ └───┬────┘
                  │ GATE 1       │ GATE 2 (storyboard)         │ GATE 3   │
                  ▼              ▼                             ▼ 05-qa    ▼
              human ok       human ok                     auto QA→human  human ok
```

## 8. Definition of done — MVP (Phase 4)

A single video that proves the pipeline end to end:
- Topic: **"Šta je AI i šta sve može u 2026."**
- Length: **7–8 minutes**, faceless.
- Serbian narration (cloned voice if quality allows, else best free TTS).
- Dynamic visuals: motion graphics + screen captures + AI images with camera
  moves (NOT a slideshow of screenshots).
- Burned-in animated Serbian subtitles.
- Perfect audio/subtitle/scene sync (R11–R12).
- Passed automated QA, then approved by the human.
- Plus **one Short** derived from the same script.
- Reusable Remotion **intro/outro** (one variant for long, one for Shorts).

When this exists and is repeatable, everything else is iteration.

## 9. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Free Serbian TTS sounds bad | TTS adapter; test free first; ElevenLabs ~$11/mo fallback (D-003) |
| Colab sessions drop mid-job | Idempotent + cached chunked jobs; use Kaggle for long batches (R18) |
| Generative per-scene video too heavy/costly | Hybrid visuals; real gen-video only for rare "hero" shots (D-004) |
| "Reused content" demonetization | Originality rules R1–R5; original scripts & visuals |
| New YT account flagged as AI | Strategy in `style/CHANNEL.md` (D-005) |
| Scope creep / over-engineering | Roadmap phases; n8n & full auto deferred (D-006) |

## 10. Open questions (tracked, not blocking)

- OQ1. Which free TTS gives acceptable Serbian? (Resolve in Phase 2 by listening.)
- OQ2. Local vs cloud Remotion render speed for 7–8 min 2D video? (Measure in Phase 4.)
- OQ3. Channel: grow EconVault then rename, or start fresh? (See `style/CHANNEL.md`.)

Decisions are logged in `docs/DECISIONS.md`.
