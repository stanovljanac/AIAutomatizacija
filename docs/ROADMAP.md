# ROADMAP

Phased plan from the pivot to a repeatable, mostly-automated **Boring AI Automations**
channel. Each phase has **exit criteria** — concrete, checkable conditions. Quality
first; no hard deadline. Log details in `docs/PROGRESS.md`.

> Inherited infra (from the old project, still good): Node/Python/Remotion installed,
> `pipeline/shared` schemas + validator, `/novi-video` scaffold, a working local
> Remotion render path (intro → text scene → outro). We reuse these.

---

## Phase 0 — Re-found (docs & charter)  ◀ in progress

**Goal:** the repo's docs, skills, and style files describe the **new** channel
coherently, and the old work is safely archived.

Exit criteria:
- [x] `git tag serbian-ai-archive` created (old Serbian work preserved).
- [ ] `CLAUDE.md` + all `docs/` + all `style/` rewritten/updated for the new niche (EN).
- [ ] `DECISIONS.md` D-011…D-019 logged.
- [ ] Skills updated (translation-localization retired; capture + idea-bank added).
- [ ] Schemas + `config.json` updated; `_TEMPLATE` updated; `001-sta-je-ai` archived.
- [ ] EconVault cleared & rebranded (keywords/branding to the new niche).

## Phase 0b — Idea-bank

**Goal:** a scored, multi-tagged backlog to drive production.

Tasks:
- Define `pipeline/00-ideas/ideas.schema.json` and `ideas.json`.
- Seed ~50–100 ideas across task/sector/tool/archetype with a predicted-popularity
  `score` (free search-suggest/competitor signals + judgment).

Exit criteria:
- [ ] `ideas.json` validates and has ≥ 50 scored, tagged ideas.
- [ ] The top ~10 are sanity-checked for real search demand.

## Phase 1 — Voice & thumbnail proof

**Goal:** lock the channel voice and the thumbnail look (cheap, fast wins).

Tasks:
- Generate the same English paragraph with a few **edge-tts** voices; A/B listen.
- Set `config.json.voice` to the chosen voice.
- Implement `02-voice`: continuous edge-tts + forced alignment, chunked/cached.
- Build the Remotion `ThumbnailTemplate` (2 variants).

Exit criteria:
- [ ] A 30–60s English narration sounds professional (not robotic). **(The Serbian
      blocker is gone — this is the proof.)**
- [ ] `alignment.json` has correct per-sentence timestamps for a test script.
- [ ] Two on-brand thumbnail variants render from a sample title.

## Phase 2 — Render bake-off + template library

**Goal:** decide the engine, then build the fixed-template visual system once.

Tasks:
- **Bake-off:** build ONE representative scene in **Remotion** and **HyperFrames**;
  compare agent-authoring ease, reliability, quality, integration cost. Set
  `render.engine` (`remotion` | `hyperframes` | `combo`). (DECISIONS D-019.)
- Lock `style/VISUAL_IDENTITY.md` values (palette/fonts/motion).
- Build the scene-template components: `hook-card`, `section-header`, `bullet/steps`,
  `stat-callout`, `term-highlight`, `comparison-table`, `diagram` (code-drawn),
  `code-block`, `capture-segment` (auto-zoom), `lower-third`, `transition`, `cta-card`,
  plus `Intro/Outro` (long + Short) and `Subtitles`.

Exit criteria:
- [ ] Bake-off verdict logged; `render.engine` set.
- [ ] Each template renders on-brand and data-driven from `scene-plan.json`.
- [ ] An animated **code-drawn diagram** renders legibly.

## Phase 3 — Pilot video (Definition of Done)

**Goal:** produce one full video end to end — an **Ideas/Listicle or Diagram** topic
(full-AI path, no capture).

Tasks:
- Run the whole workflow on the top idea.
- Implement/confirm `05-qa` (auto-fix technical, flag content, 30s digest).
- Implement `06-publish`: title/desc/tags/chapters/thumbnail + draft upload + 1 Short.

Exit criteria (the MVP done-definition, mirrors PRD §8):
- [ ] `content/<id>/video/final.mp4` exists; correct length for its archetype.
- [ ] Audio continuous; scenes & captions in sync (QA passed).
- [ ] Original human angle present; approved at all three gates.
- [ ] Draft (private) on YouTube with full metadata + chosen thumbnail.
- [ ] One Short produced; reusable intro/outro used.

## Phase 4 — Expand archetypes

**Goal:** add the remaining formats and the Shorts pipeline.

Tasks:
- **Mini-demo:** ship the OBS capture profile + click-list flow + auto-zoom/highlight.
- **Comparison:** comparison-table component + sources discipline.
- Auto-extract 1–2 **Shorts** per long video (light music).

Exit criteria:
- [ ] One mini-demo and one comparison video produced and approved.
- [ ] Shorts auto-generate from a long video.

## Phase 5 — Cadence & growth loop

**Goal:** make videos #N easy; close the data loop.

Tasks:
- Produce in idea-bank **score order**; remove every avoidable manual touch.
- Log CTR/retention to `PROGRESS.md` + each idea's `metrics`; **re-rank** the bank.
- Optional later: opt-in AI images, n8n scheduling (deferred — D-006), more automation.

Exit criteria:
- [ ] A new video goes idea → draft with human time only at the 3 gates (+ capture).
- [ ] Real metrics have re-ranked the idea-bank at least once.
- [ ] A sustainable cadence is documented.

---

## What we deliberately deferred

- Products/affiliate/courses — until payout rails exist (D-017).
- AI-video (per-scene generative) and standard AI-image use — local-first (D-015).
- Avatar — dropped permanently; faceless forever (supersedes D-008).
- n8n full automation — until the manual pipeline is proven (D-006).
