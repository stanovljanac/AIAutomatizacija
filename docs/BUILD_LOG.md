# BUILD LOG — independent (different-model) verification records

One entry per build unit/wave: what was verified, by which model, the verdict, and any bugs
found/fixed. This is step 4 of the **build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`,
D-041) — a record that a *different model* than the author actually checked the work.

Newest on top.

---

## 2026-06-09 — Orchestrator integration (wire the deferred executors)
- **verifier:** Sonnet 4.6, independent of the author (Opus 4.8).
- **scope:** `orchestrator/run.mjs` — voice/align wired to the Python scripts (mechanical, real);
  render/qa wired to the video-render / qa-video skills (agent steps via the Runner: real in
  headless, deferred to the top agent in Claude-Code mode); `ctx` gains `root` + `python`.
- **result:** **166 tests green.** Verifier added 7 tests.
- **verified correct + safe:** Short executors target `<id>/short` (long ones never do); a non-zero
  exit (incl. spawn error `code:-1`) throws → `guardStep` converts it to a pause, never a crash;
  agent steps defer to `{__pause}` in Claude-Code mode and proceed on `.data` in headless.
- **no real bugs.** Nits (documented, not fixed): `qa` passes only `ctx.id` to the skill (the skill
  discovers paths); `runVideo` must always be started with the LONG id (Shorts are internal executors).
- **verdict:** integration correct and safe.

## 2026-06-09 — Wave 2 (multi-model self-review loop)
- **verifier:** Sonnet 4.6, independent of the author (Opus 4.8).
- **scope:** `review/rubric.mjs`, live `review/gemini.mjs`, `review/claude-subagent.mjs`,
  `review/loop.mjs`, `review/build.mjs`, and the `reviewStage` wiring in `orchestrator/run.mjs`.
- **result:** **156 tests green.** Verifier added 22 tests (`review/wave2-verify.test.mjs`).
- **CORE SAFETY PROPERTY VERIFIED — fails closed:** no path lets a hard-gate-failing or unscored
  artifact reach `passed:true`. Layered defense: `normalizeReviewResult` fills missing gates with
  `false`; `panelScore` recomputes the score from categories (ignoring the model's self-score) and
  requires all 4 gate keys `=== true`; a hard-gate fail clamps below 9; the schema rejects empty/
  malformed review docs. Confirmed with `accuracy:false` + perfect categories and a bare `{score:10}`.
- **no real bugs.** Nits: Gemini throttle `_lastCall` is per-instance (fine — one Gemini per panel);
  a stale `[BUG]` label in panel-edges.test.mjs is actually fixed (cosmetic).
- **verdict:** review loop is safe and sound. v1 (Waves 0–2) complete.

## 2026-06-09 — O1 orchestrator (DAG runner + single-video composition)
- **verifier:** Sonnet 4.6, independent of the author (Opus 4.8).
- **scope:** `shared/orchestrator/dag.mjs` (resumable DAG runner) + `run.mjs` (video DAG composition,
  long‖short fan-out, gate pause, manifest persistence) + tests.
- **result:** **121 tests green.** Verifier added 6 probe tests.
- **verified sound:** resumability (results survive the manifest JSON round-trip), parallel-wave
  safety (a paused sibling stops the run; the other is still persisted), gate-vs-error distinction,
  multi-node cycle detection, and the long/short fan-out join at `qa`.
- **hardening applied (nits the verifier flagged):** `runDag` now tolerates a literal-`null` manifest
  (corrupt file) without crashing; it returns `blockedAll` (every blocked node this wave), not just the
  first. Regression tests added.
- **notes for Wave 2:** keep voice/render executor results JSON-serializable (file paths as strings,
  not Buffers); the live review panel runs its reviewers *inside* one node, so DAG-level simultaneous
  blocks stay rare.
- **verdict:** orchestrator is sound to wire the live review loop (Wave 2) + real voice/render executors.

## 2026-06-08 — Wave 1 Batch 1B (YouTube publish path: OAuth + upload)
- **verifier:** Sonnet 4.6, independent of the author (Opus 4.8).
- **scope:** P4 `auth.mjs` (OAuth bootstrap), P5 `upload.mjs` (Publisher port) + tests.
- **result:** **102 tests green** after the fix. Verifier added 17 tests.
- **CRITICAL invariant verified SAFE:** no code path can upload as `public` — `buildVideoResource`
  and `publishDraft` default to `private` for every missing/undefined-config case (4 dedicated tests).
- **bug found + fixed:** `publishDraft` wrote `youtube_video_id`/`status` AFTER `setThumbnail`, so a
  thumbnail failure orphaned an already-uploaded private draft. **Fixed:** record id/status
  immediately after upload, and a thumbnail failure now surfaces a `thumbnail_warning` instead of
  failing the publish (the draft is up; owner sets the thumbnail in Studio). Test flipped to pin the fix.
- **design note:** `getAuthorizedClient` throws on a missing client_secret (misconfig) — the
  orchestrator must guard it; returns `authorized:false` (no crash) when only the token is absent.
- **verdict:** publish path is private-only and sound to wire into the orchestrator.

## 2026-06-08 — Wave 1 Batch 1A (key-free publish-path modules)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** P1 `build-metadata.mjs`, P2 `make-short.mjs`, P3 `normalize-loudness.mjs`,
  P6 `error-policy.mjs`, P7 `notify.mjs` + tests; publish.schema extension.
- **result:** **75 tests green** after fixes.
- **bugs found + fixed:**
  - `build-metadata.mjs buildChapters` — chapters were emitted in script order, not time order →
    **non-monotonic** chapters when alignment isn't ordered (YouTube rejects these). **Fixed:** sort
    entries by start time, then force the first to `0:00`. Regression test added.
  - `make-short.mjs makeShort` — when a script has **no `hook` role**, `scenes[0]` is used as the hook
    *and* still appears in `points`, duplicating a scene in the Short. **Fixed:** de-dup by identity
    (seen-set). Two regression tests added (no-hook dedup; hook-only → 1 scene).
  - nit: the verifier's own "U.S. abbreviation" test asserted a regex it couldn't satisfy; rewritten
    as a robust structural assertion (description = ≤2 hook sentences + 1 keyword sentence).
- **verdict:** sound to wire into the orchestrator and proceed to P4/P5 (YouTube auth + upload).

## 2026-06-08 — Wave 0 (autonomy foundations)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** validate-lib + testkit; schemas (review/news/timeline/config + ideas provenance);
  config + config.schema; Runner port; Reviewer port + panel scoring/verdict; golden fixture; permissions.
- **result:** **46 tests green** after fixes.
- **bugs found + fixed:**
  - `pipeline/shared/review/panel.mjs` — `gatesOk` used `every(Boolean)` over *present* keys, so a
    reviewer omitting a required hard gate (e.g. `on_screen_source`) wrongly counted as gates-OK and
    could auto-pass. **Fixed:** require all 4 gate keys explicitly; regression test added
    (`panel-edges.test.mjs`).
  - nit: `config.schema.json` weights block hardened with `additionalProperties:false`.
- **verdict:** sound to build Wave 1 on top of.
