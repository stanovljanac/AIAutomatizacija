# BUILD LOG — independent (different-model) verification records

One entry per build unit/wave: what was verified, by which model, the verdict, and any bugs
found/fixed. This is step 4 of the **build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`,
D-041) — a record that a *different model* than the author actually checked the work.

Newest on top.

---

## 2026-06-09 — Wave V4b (deterministic QA checker — the mechanical half of qa-video)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** new `pipeline/05-qa/check.mjs` (CLI, fails-closed) + pure `05-qa/lib/check-lib.mjs`
  (`runChecks`/`summarize`) — artifact-level HARD checks gated by the format recipe: Short length,
  first-30s hook (reuses `policy.mjs`), caption density, no-empty hold, coverage (black-gap). Emits
  `content/<id>/qa.report.json` (qa.schema.json), exits 1 on any high failure. `SPARSE_TEMPLATES`
  moved to `policy.mjs` (shared with build-props — behavior identical). Perceptual checks stay in the
  qa-video SKILL (which now runs this gate first). Owner-approved hybrid.
- **result:** pipeline `npm test` **242 green**; end-to-end `build-props → check.mjs` on the fixture →
  QA PASS (5/5), report validates, exit 0.
- **bugs found:** none. Verifier added **13** coverage/edge regression tests (out-of-order scenes,
  crossfade overlap not a false gap, pre-intro scene, tolerance boundary, trailing gap, fails-closed
  semantics, schema validity).
- **verdict:** PASS.

## 2026-06-09 — Wave V3 (strong-hook enforcement + new hook scene + drop b-roll)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** new pure `pipeline/04-render/lib/policy.mjs` (`isHookClass`/`openingHasHook`) + a first-30s
  hook WARN in build-props (qa-video will enforce it HARD on the cut — V4); a
  `format.pacing.max_static_hold_seconds` knob replacing the hardcoded no-empty threshold; build-props
  honors `scene_set.broll.enabled` (default **false** → stock dropped per owner; the fetch + SceneWrapper
  branch are kept, disabled); a new bespoke hook scene `HookStatReveal` (count-up stat + punch line)
  registered in Main + previewed in the gallery.
- **result:** `tsc` 0; pipeline `npm test` **220 green**; build-props runs end-to-end on the fixture
  (exit 0); `HookStatReveal` visually verified (count-up to 26,000 → punch line under a drawn bar).
- **bug found + fixed:** `policy.mjs openingHasHook` crashed on a `null` scene element (read
  `s.fromFrame` before guarding). **Fixed:** `s != null && isHookClass(s) && s.fromFrame < …`; the
  verifier's regression test is now green.
- **deferred (noted):** true cross-scene *shared-element* continuity — higher risk vs. the sync
  contract, and the persistent BackgroundFX + new per-scene motion already read as continuous. Revisit
  later if the owner wants morph transitions.
- **verdict:** PASS (after the null-guard fix).

## 2026-06-09 — Wave V2 (motion system: the first "not a slideshow" jump)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** Remotion motion-design upgrade. `templates/remotion/src/lib/anim.ts` gained a real motion
  vocabulary (ramp / springPreset snappy·gentle·bouncy / countUp / draw / pop / drift / motionScale +
  the pure `splitNumeric`/`formatNumber`); new `lib/motion.ts` (MotionContext/useMotion — the
  intensity budget from `props.motion`); `Main.tsx` provides the budget. Upgraded **HookCard**
  (word-by-word kinetic reveal + accent underline draw), **StatCallout** (numbers count up with
  grouping; non-numeric fallback; emphasis pop, disabled at `calm`), **Diagram** + **Flow** (SVG
  draw-on connectors via strokeDashoffset; spring node pops). All frame-pure (determinism preserved).
- **result:** `tsc --noEmit` exit 0; pipeline `npm test` **201 green** (Remotion isn't in the pipeline
  suite). Verified visually via `TemplateGallery` stills (kinetic hook; count-up reading 20,708
  mid-count with comma grouping; diagram/flow arrows drawing on before nodes pop).
- **bugs found + fixed:** two LOW cosmetic edge cases, both fixed — `splitNumeric("-5")` showed "-0"
  at count start (regex now captures a leading minus into the number); Diagram/Flow connector arrows
  could pre-draw at frame 0 for a very-early narration cue (clamped `Math.max(rd - …, 0)`).
- **verdict:** PASS — deterministic, type-clean, props-compatible; lively-but-calm achieved.

## 2026-06-09 — Wave V1 (wire build-props to the format recipe)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** `build-props.mjs` now resolves the format (`resolveFormat` from brief/script) and reads
  its timing/caption constants via the new pure helper `04-render/lib/timings.mjs`
  (`deriveRenderTimings`) instead of hardcoded magic numbers — intro/outro/crossfade/lead, caption
  max-words/gap/tail, and the Short-length gate. Adds `motion: fmt.motion` to the emitted props
  (render side consumes it from V2). Behavior-preserving: seeded format values mirror the old constants.
- **result:** **201 tests green** (was 197; +4 verifier regressions). Author also ran build-props
  end-to-end on a throwaway `_FIXTURE` copy: emitted props had introFrames 45 / outroFrames 75 /
  crossfade 9 (identical to old) + the motion budget; artifacts cleaned up.
- **bugs found + fixed:** none (no production bugs).
- **flagged (out of V1 scope, tracked):**
  - `orchestrator/run.mjs:81` still passes `config.defaults.short_seconds` to the Short derivation —
    will silently diverge if `fmt.length.short.target` changes. Wire to the format when the
    orchestrator path is next touched (V5).
  - `build-props.mjs` no-empty-scene guard threshold (`secs > 6`) is still hardcoded — make it a
    `fmt.pacing` knob in V3 (where the no-empty enforcement is revisited).
- **verdict:** PASS — behavior-preserving; build the motion system (V2) on top.

## 2026-06-09 — Wave V0 (modular video-format spec foundation)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** new `schemas/format.schema.json` + `formats/default.json` (the channel "show bible":
  hook/motion/pacing/captions/length/intro/outro/scene-set/archetype-structure knobs) +
  `lib/format.mjs` (`resolveFormat`: default ← series ← archetype ← brief.format, deep-merge,
  schema-validated). Both validators got a `formats/`-dir → format-schema rule; `validateFile`
  now passes the full path so the rule applies.
- **result:** **191 tests green** (was 177; +14 verifier regression tests).
- **bugs found + fixed:**
  - `lib/format.mjs deepMerge(base, null)` returned `null` and wiped the base (latent footgun — all
    current callers guard, but unsafe for a future caller). **Fixed:** a null/undefined override is
    now a no-op (returns the base); the documenting test was flipped to assert the safe contract.
  - verifier confirmed: the `validateFile` full-path change is non-breaking (and fixes a latent
    wrong-schema resolution for `formats/` files); the dir-rule is correct on Windows backslash paths
    and does not mis-fire on content artifacts or a file named `formats.json`; seeded `default.json`
    values exactly mirror today's `build-props.mjs` constants (behavior-preserving for V1).
  - note for V1: `build-props` reads `cfg.render.crossfadeFrames` / `cfg.defaults.short_seconds`;
    the format layer names them `transition_frames.crossfade` / `length.short.target` — map these
    names explicitly when wiring.
- **verdict:** PASS — sound foundation; V1 can wire `build-props` to the resolved format.

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
