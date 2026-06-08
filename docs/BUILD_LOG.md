# BUILD LOG — independent (different-model) verification records

One entry per build unit/wave: what was verified, by which model, the verdict, and any bugs
found/fixed. This is step 4 of the **build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`,
D-041) — a record that a *different model* than the author actually checked the work.

Newest on top.

---

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
