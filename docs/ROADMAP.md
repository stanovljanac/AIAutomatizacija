# ROADMAP

Phased plan from the pivot to a repeatable, mostly-automated **The Automation Desk**
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

## Phase B — Toward full automation (prioritized backlog)

**North star:** every step automated **except** (a) final video approval, (b) the publish
click, (c) owner screen recordings — those stay human forever. Already planned under D-027:
Postiz distribution, `pipeline/07-distribute`, `make-short` generalization,
`blog-from-transcript`. New/sharpened ideas, ranked by accuracy-and-automation payoff:

1. **`fact-check` skill** (D-032, shipped this round) — generate + self-verify the factual
   backbone; biggest accuracy win; unblocks comparisons/news.
2. **`make-short` auto-derivation** — the Short stops being a hand-built folder; it's derived
   from the approved long script (feeds the parallel design, D-033).
3. **Auto-metadata** — fill `publish.json` (title/desc/tags/chapters) deterministically from
   `script.json` + `alignment.json` (formalize what we did by hand for 002).
4. **YouTube Analytics auto-logging** — pull views/CTR/retention → `log.md` + each idea's
   `metrics` → re-rank the idea-bank (close the growth loop, currently manual).
5. **Loudness normalize to −16 LUFS** in voice/render (config already names the target).
6. **Thumbnail auto-scoring** (legibility/contrast/brand) to inform the owner's 2-variant pick.
7. **Topic auto-sourcing for Desk Notes** — lightweight news watch → scored ideas.
8. **Parallel short-vs-long orchestrator** (D-033) — run the two branches concurrently; the
   real win is overlapping authoring/voice/align (renders serialize on one PC).

**Stays human forever (owner):** final video approval, the publish click, screen recordings.

---

## Phase C — Self-reviewing autonomous studio (owner: only final approval + thumbnail)

**North star (owner, 2026-06-07):** the system writes, reviews **itself with two OTHER models**
(not the author, and different from each other), merges the best of both reviews, applies the
changes, and **loops until BOTH external reviewers score ≥ 9/10** — then produces the final
video and **waits only for (a) the owner's final approval and (b) the owner's thumbnail.**
Everything else is automated, including drafting to YouTube.

### C1. Multi-model self-review loop (the core)
- **Author:** this agent drafts `script.json`, then `scene-plan.json` + "video-prep" (props).
- **Two independent reviewers = two different external models** (e.g. Gemini + one other —
  NOT the author model, and not the same as each other), each scoring against a rubric
  (original angle, accuracy vs `claims.json`, retention/structure, our hard rules: no-empty
  scene, captions ≤2 lines, Short 45–120s, on-screen sources, b-roll-fit, etc.). Each returns
  a **1–10 score + concrete fixes**.
- **Merge + apply:** the author takes the *best* fixes from both, applies them, and re-submits.
- **Loop until BOTH reviewers ≥ 9** (cap N iterations → then surface to owner). Review stages:
  **(1) script → (2) scene-plan/video-prep → (3) the rendered cut** (a final QA-grade pass).
- **Build:** `pipeline/shared/review/` — an LLM-judge harness that calls 2 model APIs with the
  rubric, parses scores+fixes, and drives the loop. Generalizes today's single `script-review`.
- **Constraints (honest):** needs **2 external model API keys** (prefer free tiers — Gemini
  free; pick a 2nd free/cheap model); has a per-video cost/latency; keys in `.env`, never
  committed. Define the rubric + score schema first; start with the script stage, then extend.

### C2. Auto-publish to YouTube (draft)
- Build `pipeline/06-publish/upload.mjs` (YouTube Data API v3): upload the long + Short as
  **private/draft** with the `publish.json` metadata + `thumb_final.png`, set altered-content.
- **One-time owner step:** OAuth consent to mint `token.json` (interactive, can't be headless).
  After that, uploads are automatic; the owner only **clicks publish** (or we schedule it).

### C3. Other automation to remove manual touches
- **Idea selection:** auto-pick the top-scored idea + draft the angle (Gate 1 already auto).
- **SEO at script-approval** (done as a rule) + **auto-metadata** from script/alignment.
- **make-short auto-derivation** from the approved long script (Phase B #2).
- **Loudness −16 LUFS** normalize; **caption-lag** rescale fix if it recurs.
- **Analytics loop:** pull CTR/retention → re-rank `ideas.json` (Phase B #4).
- **Distribution:** Postiz + `pipeline/07-distribute` cross-post the Short caption (D-027).

### C4. What stays the owner's (only these)
- **Final video approval** (Gate 3) and **thumbnail** (owner generates the image from the 2
  prompts; agent composites logos). Screen recordings remain owner-only **but only for the
  occasional mini-demo** — the autonomous loop defaults to full-auto archetypes (ideas /
  comparison / diagram) that need no recording.

Exit criteria:
- [ ] Two external models review each stage and the loop reaches ≥9/9 without human edits.
- [ ] A video goes idea → script → reviewed→fixed→re-reviewed → final render → **draft on
      YouTube**, with the owner touching only final-approval + thumbnail.

---

## Build execution status (Phase B/C)

Tracked in `docs/PROGRESS.md`. **v1 = Waves 0–2** (hands-off to a YouTube
draft, **including** the multi-model loop). Every wave runs the **build-sprint cycle** (D-041):
atomize → build → test → verify with a *different* model → fix → docs → commit only on request.
The detailed per-wave build handoffs and verifier-verdict log were removed once the work shipped
(recoverable from git history); the implementation methods now live in `docs/ARCHITECTURE.md` §12.

- **Wave 0 — foundations: ✅ DONE** (commit `ae92a6c`, Sonnet-verified, 46 tests). Ports
  (Runner/Reviewer), schemas (review/news/timeline/config), test-gate hook, generalized permissions,
  golden `_FIXTURE`.
- **Wave 1 — hands-off publish path: ✅ DONE** (commit `f611e78`, Sonnet-verified). Auto-metadata,
  `make-short`, loudness −16 LUFS, OAuth + YouTube upload (private-only), error policy, notifications.
- **O1 — orchestrator: ✅ DONE.** Resumable DAG runner + single-video composition (long‖short fan-out),
  `npm run make-video -- <id>`, stops at the owner gate.
- **Wave 2 — multi-model review loop: ✅ DONE.** Rubric + live Gemini adapter + Sonnet sub-agent +
  the loop wired into the script + cut stages. Verified to **fail closed**.
- **Integration: ✅ DONE.** voice/align → Python (mechanical); render/qa → `video-render` /
  `qa-video` skills via the Runner (real in headless, deferred to the top agent in Claude-Code). 166 tests.
- **Wave V — modular video formats + pro motion design (Remotion-core → HyperFrames hero scenes): ✅ DONE.**
  Owner-added before Wave 3 (videos were "slideshow"; want a strong first-30s hook + real motion +
  modular policy; drop stock b-roll). **V0** format-spec foundation (`formats/default.json` +
  `format.schema.json` + `lib/format.mjs` — the single source of truth for hook/motion/pacing/length/
  caption/scene knobs), **V1** build-props reads it, **V2** the motion system (kinetic type, number
  count-up, SVG draw-on, intensity budget), **V3** strong-hook enforcement + `HookStatReveal` opener +
  stock b-roll dropped, **V4** skills/style now point at the recipe, **V4b** a deterministic
  fails-closed QA gate (`pipeline/05-qa/check.mjs`, hybrid: code for mechanical rules + skill for
  perceptual) — **Phase 0 DONE, all Sonnet-verified**. **V5 (engine-agnostic timeline seam) ✅ DONE
  2026-06-10** (Sonnet-verified, **275 tests green**): `build-props.mjs` emits `content/<id>/timeline.json`
  (`lib/timeline.mjs`), `compile-remotion.mjs` renders it **byte-identical** to the pre-seam output
  (proven on `_FIXTURE`); per-scene `engine` field added. **V6 (first HyperFrames hero scene → `combo`)
  ✅ DONE 2026-06-11** (Sonnet-verified, **296 tests green**, UNCOMMITTED): `compile-hyperframes.mjs`
  reads the SAME timeline and renders `engine:"hyperframes"` scenes to silent clips at their exact window,
  composited into Remotion via `OffthreadVideo` (`HfClip`); first hero scene
  `templates/hyperframes/scenes/hook-kinetic`; `render.engine` = `combo`; **sync proven** on a 004 scratch
  (HF clip = exact 440-frame window, captions synced). **V7 kickoff ✅ 2026-06-12** (Sonnet-verified):
  `CaptureSegment` default cinematic **push-in** (demos never flat; auto-off under `focalZoom`) + first
  BOLD hero `templates/hyperframes/scenes/hook-prism` (Three.js/WebGL aurora + 3D shards). All
  committed + pushed. The remaining visual polish (hero recolor) is tracked under **Open follow-ups** below.
- **Wave 3 — freshness & news (anti-stale + Desk Notes): ✅ DONE 2026-06-12** (Sonnet-verified, **329 tests
  green**, UNCOMMITTED). **T3.1** the knowledge-freshness cache `pipeline/shared/knowledge/facts.json`
  (curated, source-backed model/price/version/limit values) + `refresh-facts.mjs` (staleness **auditor** —
  never overwrites; owner chose curated+staleness over auto-extract) + `facts.schema.json`; the
  live-never-recalled rule reinforced in `fact-check` + `script-writing`. **T3.2** `pipeline/00-ideas/
  fetch-news.mjs` (`NewsSource` port): no-dep RSS/Atom + HN-Algolia parsers → dedup by normalized-title hash
  (≥2 sources ⇒ higher score) → `news.json` → promote top corroborated items to Desk Notes ideas
  (`source.origin:"news"`). **T3.3** (schedule the refresh) folds into Wave 5. Open: wire official-source RSS
  endpoints when verified.
- **Wave 4 — swappability hardening: ✅ DONE 2026-06-12** (Sonnet-verified, **366 tests green**, UNCOMMITTED).
  **T4.1** (render-engine port) was already done by V5/V6. **T4.2** the `TtsProvider` dispatcher
  `pipeline/02-voice/voice-dispatcher.mjs` (provider→script registry; `run.mjs` routes voice through `voiceArgs`;
  draft=edge-tts, `--final`=Azure, D-024). **T4.3** the `Distributor` port seam
  `pipeline/07-distribute/distributor.mjs` + `distribution.schema.json` + a disabled `config.distribute` (Noop/Mock/
  Postiz-**stub**; live Postiz client = Wave 5 / T5.3).
- **Wave 5 — full autonomy + growth loop: ✅ core DONE** (headless + scheduled run, analytics loop;
  T5.3/T5.4 remain — see Open follow-ups). Methods now in `docs/ARCHITECTURE.md` §12.
  Done (all Sonnet-verified, **456 tests green**): **T5.2 analytics loop**
  (`fetch-analytics.mjs` → idea `metrics` → idempotent cluster-aware re-rank; `auth.mjs` += `yt-analytics.readonly`);
  the **Short scene-plan** build gap (derived from the long plan — no more pause); **T5.1 autonomous driver**
  (`pick-next.mjs` auto-pick + `auto-run.mjs` one-pass loop + gate-aware `notifiesOwner`; HeadlessRunner tested +
  live-smoked); and **T5.1e ✅ DONE 2026-06-12** — owner did the one-time YouTube OAuth (app published to
  **Production**, project `281348372291` → non-expiring refresh token at `C:\secure\token.json`, all three scopes
  incl. `yt-analytics.readonly`), and the **CronCreate** routine is registered (weekly, Mon 09:07, session-local,
  loops `auto-run` in Claude-Code mode → auto-draft PRIVATE → PushNotify the owner at gates). Remaining: **T5.3**
  live Postiz, **T5.4** thumbnail auto-scoring. (`GEMINI_API_KEY` already in `.env`; OAuth now done.)

## Open follow-ups (not blocking the first hands-off video)

- ~~**Hero recolor (visual polish).**~~ **DONE 2026-06-13.** `hook-prism` re-skinned: the prism/glass
  shards were removed (kept the aurora plasma + rushing particle tunnel) and the palette moved to brand
  **black + gold** (`#ffb020`). Also shipped the same wave: a new cinematic content hero
  `bad-row-gate` (one bad row → gate → "Invalid date" → quarantine), the gold-mark **black+gold intro/outro**
  (`Intro`/`Outro` + `BrandBackdrop`), and a `CodeBlock` line-number fix (no-shrink gutter + optional
  numbers/fontSize). Scope held to **hero + up to 2 hero moments per video** (heroes/stings = black+gold;
  body stays electric blue + gold pops). First applied to video 006.
- **T5.3 — live Postiz distribution (D-027).** Inject the live Postiz HTTP client into `PostizDistributor`,
  flip `config.distribute.enabled`, write `distribution.json` + cross-post the Short caption after upload.
  Owner one-time: `POSTIZ_BASE_URL` / `POSTIZ_API_KEY`.
- **T5.4 — thumbnail auto-scoring** (legibility / contrast / brand) to inform the owner's 2-variant pick.
- **Official-source RSS endpoints.** Some changelogs (anthropic/openai/google/microsoft/meta) currently
  point at HTML pages → `fetch-news.mjs` fails soft to 0 items; wire verified RSS endpoints when found.
- **Re-register the weekly autonomous run.** The CronCreate routine is session-local and auto-expires after
  7 days — re-register it each week (or keep a session alive / use `/loop`).

## What we deliberately deferred

- Products/affiliate/courses — until payout rails exist (D-017).
- AI-video (per-scene generative) and standard AI-image use — local-first (D-015).
- Avatar — dropped permanently; faceless forever (supersedes D-008).
- n8n full automation — until the manual pipeline is proven (D-006).
