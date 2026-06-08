# Waves 3–5 plan + handoff (continue here)

This is the **resume-tomorrow** doc. It captures exactly where the Phase B/C build stands, the
seams already in place, and the atomized, context-rich tasks left in Waves 3–5 — plus what remains
to ship the **first real hands-off video**. Pair it with `docs/ROADMAP.md` (status) and
`docs/BUILD_LOG.md` (per-wave verifier verdicts). The original high-level plan lived in
`~/.claude/plans/` (machine-local); this committed doc is the source of truth going forward.

> **Every code task below runs the build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`,
> D-041): atomize → build → `npm test` green → **verify with a DIFFERENT model** (Sonnet 4.6;
> Haiku for trivial) that adds regression tests → fix → update docs → **commit only when the owner
> asks**. The Stop test-gate hook blocks finishing on red. Log each verifier verdict in `BUILD_LOG.md`.

---

## Where we are (done + committed)

**v1 (Waves 0–2) + O1 orchestrator + integration are complete — 166 tests green, every step
Sonnet-verified.** Commits: `ae92a6c` (Wave 0), `f611e78` (Wave 1 + DAG + policy), and the v1
tail (O1b + Wave 2 + integration + docs) committed alongside this doc.

Built and tested:
- **Ports (swappability seams)** — `Runner` (`orchestrator/runner.mjs`: claude-code / headless
  `claude -p` / mock), `Reviewer` (`review/`), `Publisher` (`06-publish/upload.mjs`), and the
  schemas for a future `RenderEngine` swap (`schemas/timeline.schema.json`) and `NewsSource`
  (`schemas/news.schema.json`) — both **defined in Wave 0 but not yet consumed**.
- **Orchestrator** — `orchestrator/dag.mjs` (resumable DAG: parallel waves, manifest resume,
  error/gate pause) + `orchestrator/run.mjs` (the single-video DAG, long‖short fan-out D-033,
  `npm run make-video -- <id>`). Voice/align run real Python; render/qa go through the Runner
  (real headless / deferred to the top agent in Claude-Code); review runs the live panel loop.
- **Publish path** — auto-metadata + chapters, make-short, loudness −16 LUFS, OAuth + YouTube
  upload (private/draft only).
- **Review loop** — rubric + live Gemini adapter + Sonnet sub-agent + loop until both ≥9 (auto-skip
  the script gate at ≥9.2). **Verified fails-closed.**
- **Config** already carries `news.sources`, `llm.providers`, `review.panel`, `error.retry`,
  `notify` (Wave 0).

---

## What remains to ship the FIRST real hands-off video (do this before/with Wave 3)

The orchestrator graph is proven on the fixture. A *real* run needs these (mostly owner one-time +
two small build gaps):

1. **Owner one-time (browser, not terminal):**
   - `GEMINI_API_KEY` in `.env` — free, https://aistudio.google.com/apikey (2nd reviewer; the 1st is
     a Sonnet sub-agent, no key). Without it the review node pauses asking for it.
   - YouTube OAuth → `token.json`: run `node pipeline/06-publish/auth.mjs` once (consent in browser).
2. **Build gap — short scene-plan:** `plan_short` reads `content/<id>/short/scene-plan.json`, which
   the `storyboard` skill must generate for the Short (today it pauses/defers). Wire `storyboard` to
   emit the Short scene-plan after `make-short` derives `short/script.json`. Small.
3. **How a real Claude-Code run behaves:** `make-video <id>` runs mechanical nodes for real and
   **pauses at each agent node** (script if missing, render, qa) — the top agent fulfils it by
   running that skill (`script-writing`, `video-render`, `qa-video`), marks the node done in
   `run-manifest.json`, and re-runs `make-video` to resume. (Full unattended auto = headless mode,
   Wave 5.) Document this loop in `WORKFLOW.md` when wiring T5.1.

---

## Wave 3 — Freshness & news (anti-stale + Desk Notes)  ◀ next

**Goal:** the system follows AI-automation news from a trusted multi-source feed and never relies on
the model's stale training memory for model/tool/price/version facts.

- **T3.1 — Knowledge-freshness cache.** `pipeline/shared/knowledge/facts.json` (current model
  versions, prices, free-tier limits) + `knowledge/refresh-facts.mjs` that refreshes it from the
  official changelog feeds in `config.news.sources` (type `official`). Add `schemas/facts.schema.json`
  + register it. Reinforce the hard rule in `fact-check` + `script-writing` skills: any
  model/tool/price/version claim is **fetched live, never recalled** (the April-2026 free-tier shift
  is the worked proof — see this session's web checks). *Verify:* a script quoting a model price is
  corrected to the value in `facts.json`. *Deps:* none (parallel with T3.2).
- **T3.2 — News watch (`NewsSource` port).** `pipeline/00-ideas/fetch-news.mjs`: pull each enabled
  `config.news.sources` entry — official RSS/changelog + **The Decoder + TLDR AI + Hacker News
  (Algolia JSON API)** — normalize to `schemas/news.schema.json` (already exists), **dedup across
  sources by normalized-title hash** (≥2 sources ⇒ higher `score`), write `pipeline/00-ideas/news.json`,
  and promote top items to **Desk Notes** ideas in `ideas.json` (`source.origin:"news"`). *Context:*
  HN Algolia is clean JSON (easiest); RSS needs a tiny no-dep XML/regex parser; The Decoder/TLDR
  expose RSS — prefer their feed URLs over HTML scraping (update `config.news.sources` URLs to the
  RSS endpoints). Tests mock `fetch`. *Verify:* a corroborated item becomes one scored Desk Notes idea.
- **T3.3 — schedule the refresh** (folds into Wave 5 scheduling).

## Wave 4 — Swappability hardening (only when a real need appears)

**Goal:** make the Wave-0 seams real so an engine/TTS swap is a config flip, not a rewrite. Lower
priority — the Remotion+HyperFrames **combo works today** (D-019); do this when we actually want to
swap or add a provider.

- **T4.1 — Render engine port (biggest win).** Have `04-render/build-props.mjs` emit the
  engine-agnostic `timeline.json` (`schemas/timeline.schema.json`, seconds-based — already defined),
  then `04-render/compile-remotion.mjs` (→ frames/props) and `compile-hyperframes.mjs` (→ seconds/HTML).
  Decouples the sync crown-jewel from the engine. *Verify:* flip `config.render.engine` and re-render
  the fixture timeline on the other engine with no other change. *Context:* the rich HyperFrames skill
  set is already installed under `templates/hyperframes`.
- **T4.2 — `TtsProvider` dispatcher.** Wrap `scripts/make_voice.py` / `make_voice_azure.py` behind one
  `voice-dispatcher` entry; alignment is already engine-agnostic. Adding ElevenLabs/etc. = one adapter.
- **T4.3 — `Distributor` port** seam (consumed by Wave 5 / D-027).

## Wave 5 — Full autonomy + growth loop

**Goal:** the system self-schedules and closes the data loop; the owner only does final approval +
thumbnail.

- **T5.1 — Headless + scheduled run.** `HeadlessRunner` (shells `claude -p`) already exists in
  `runner.mjs` — test it against the real `claude` CLI, then a scheduled trigger (Claude Code
  CronCreate / `/schedule`) that runs `make-video` on a cadence, auto-picks the top idea/news, and
  `PushNotification`/emails the owner at the 2 gates only. *Context:* in headless mode the agent
  nodes (script/render/qa/review) actually run via `claude -p`, so no human-in-the-loop pauses.
- **T5.2 — Analytics loop.** `06-publish/fetch-analytics.mjs` (YouTube Analytics API via the
  already-installed `googleapis`) → views/CTR/retention into each idea's `metrics` in `ideas.json`
  → re-rank the bank (Phase B #4). *Verify:* a fake stats payload re-orders the bank.
- **T5.3 — Distribution.** `pipeline/07-distribute/` via **Postiz** (self-hosted, free — D-027):
  cross-post the Short caption after upload. *Owner:* one-time Postiz setup.
- **T5.4 — Thumbnail auto-scoring** (legibility/contrast/brand) to inform the owner's 2-variant pick
  (Phase B #6).

---

## Conventions to keep (so nothing regresses)

- New JSON artifact → add a schema in `pipeline/shared/schemas/` and register it in **both**
  `validate.js` (CJS) and `lib/validate-lib.mjs` (ESM `FILENAME_TO_SCHEMA`).
- Reuse the seams: `validate-lib`, `testkit`, the `Runner`/`Reviewer`/`Publisher` ports, `dag.mjs`.
- Pipeline contract: read/write only `content/<id>/`, idempotent, resumable, schema-validated,
  `brief.json.status` updated, free/local by default; flag any cost.
- Commit only on explicit owner request; the test-gate hook + a different-model verifier are mandatory.
