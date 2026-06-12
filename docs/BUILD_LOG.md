# BUILD LOG — independent (different-model) verification records

One entry per build unit/wave: what was verified, by which model, the verdict, and any bugs
found/fixed. This is step 4 of the **build-sprint cycle** (`.claude/skills/build-sprint/SKILL.md`,
D-041) — a record that a *different model* than the author actually checked the work.

Newest on top.

---

## 2026-06-12 — YouTube OAuth consent CLI (so `node auth.mjs` actually works) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8) — security-adjacent (token handling).
- **scope:** `auth.mjs` only exported helpers — there was no runnable consent flow, so the documented
  `node pipeline/06-publish/auth.mjs` did nothing. New `runConsent({clientSecretPath, tokenPath, log, open, onReady,
  deps})`: validates (missing path / missing file → Google-Cloud-Console hint / missing token path), **idempotent**
  (existing token short-circuits before any server/network), else a throwaway **127.0.0.1 loopback** server on an
  ephemeral port (redirect `http://localhost:<port>`) prints the auth URL, captures the `?code=`, `getToken` →
  `saveToken(tokenPath, …)`, closes. `deps.google` injectable + `onReady(port)` make the FULL loopback hermetically
  testable (fake googleapis, no browser/network). CLI `isMain` guard loads `.env`, reads `YOUTUBE_CLIENT_SECRET_PATH`
  / `YOUTUBE_TOKEN_PATH`, best-effort browser-open. The one consent now also covers Analytics (YT_SCOPES already
  has `yt-analytics.readonly`).
- **result:** **456 tests green** (author wrote 4; verifier added 3 regression tests; 453→456).
- **bug found + fixed:** none (clean PASS). Verifier confirmed: tokens/auth-code are **never logged** (only the file
  path); the redirect_uri matches across generateAuthUrl/getToken (same port); a `getToken` rejection closes the
  server + rejects (no hang); a no-`code` request waits without resolving; the existing-token path starts no server.
- **verifier regression tests (3):** getToken-throws frees the server + writes no token; no-code request waits then a
  later code resolves; a log-audit proving access_token/refresh_token/code never appear in output.
- **verdict:** sound + safe. `node pipeline/06-publish/auth.mjs` is the one-time consent; owner still must drop a
  real `client_secret.json` (Desktop OAuth client) at `YOUTUBE_CLIENT_SECRET_PATH` and set `YOUTUBE_TOKEN_PATH`.

## 2026-06-12 — .env auto-loading (so the owner's secrets actually take effect) — verifier PASS
- **verifier:** Haiku 4.5 (`claude-haiku-4-5-20251001`), independent of the author (Opus 4.8) — small/mechanical change.
- **scope:** the code reads secrets from `process.env` (GEMINI_API_KEY, YOUTUBE_*, …) but **nothing loaded `.env`**,
  so a key the owner put in `.env` never reached the process — the documented "first setup, then cron" path would
  silently fail. New `pipeline/shared/lib/load-env.mjs` (`loadEnv`) uses Node's **built-in** `process.loadEnvFile`
  (≥20.12; this box is v20.17) — **zero new dependency** (free-first). Real OS env vars WIN over `.env` (verified).
  Never throws (missing/malformed/old-runtime → `{loaded:false}`). Wired into the CLI `isMain` guards of `run.mjs`,
  `auto-run.mjs`, `fetch-analytics.mjs` ONLY (not module top-level), so unit tests stay hermetic.
- **result:** **449 tests green** (author wrote 3; verifier added 1 hermetic-leak regression test; 448→449).
- **bug found + fixed:** none (clean PASS). Verifier confirmed OS-env precedence, missing-file no-op, the
  isMain-only wiring (importing an entrypoint does not pull the real `.env`), and that the `await import()` in the
  guard runs (`auto-run --dry-run` OK).
- **verdict:** sound. `.env` now takes effect for `make-video` / `auto-run` / `fetch-analytics` runs.

## 2026-06-12 — Wave 5 / T5.1 (Autonomous driver: pick → scaffold → run → classify) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope — the headless + scheduled-run foundation** (owner chose **CronCreate** as the trigger). One pass per
  invocation, looped by the scheduler:
  - **Auto-pick** (`pipeline/00-ideas/pick-next.mjs`): `pickNextIdea` (top **backlog** by effective score =
    `adjusted_score ?? score`, deterministic id tie-break), `briefFromIdea`, `markIdeaInProgress` (pure),
    `planNextVideo` (busy/empty/pick). Reuses `scaffoldVideo` — extracted from `new-video.mjs` (now exports
    `slugify`/`nextVideoId`/`scaffoldVideo`; CLI unchanged) — so a pick seeds a real `content/<id>/` + brief.
  - **Gate-aware notify** (`orchestrator/run.mjs`): `AGENT_DEFERRAL_NODES` + `notifiesOwner(info)` — the owner is
    pinged only on owner-actionable pauses (the 2 gates `review_script`/`gate_owner`, a failed `review_cut`, the
    `upload` OAuth prompt, **any error**), never on Claude-Code skill hand-offs (`script`/`plan_long`/`render_*`/`qa`).
  - **Autonomous driver** (`orchestrator/auto-run.mjs`): `classifyPause` (`done`/`ownerGate`/`agentTask`) + `autoRun`
    (idle→pick+scaffold, persisting the in-progress marker **before** the run; busy→resume; empty→noop). The
    scheduler loops it; the wrapper fulfils `agentTask` hand-offs and PushNotifies on `ownerGate`.
  - **HeadlessRunner**: now hermetically unit-tested (mock `runCommand` — args/`--model`/non-zero/non-JSON paths).
    A **live `claude -p "...OK" --output-format json` smoke** confirmed the real CLI returns
    `{"type":"result","result":"OK",...}` → `JSON.parse` contract holds (one-off, not in the hermetic suite).
- **result:** **445 tests green** (author wrote ~32; verifier added 8 regression tests; baseline 437→445).
- **bug found + fixed (verifier):** `pick-next.mjs:51` **`briefFromIdea` propagated an `undefined` archetype** when
  an idea lacked the field → the spread `{archetype:"ideas", ...briefFromIdea(idea)}` overwrote the default with
  `undefined`, producing a **schema-invalid brief.json** (archetype is enum-required). Fixed → `idea.archetype || "ideas"`
  (matches the `|| ""` pattern for the other optional fields; a non-falsy invalid string still passes through for
  downstream validation to catch).
- **verifier regression tests (8):** `adjusted_score:0` is a real score (loses to a raw 60); missing-archetype →
  schema-valid brief; **news `suggestArchetype` ⊆ brief enum** (a news-promoted idea can never make an invalid brief);
  `classifyPause` completeness over every real pausing node (no silent `blocked` fall-through; errors always ownerGate);
  null/undefined result → done; persist-before-run holds even if `runVideo` throws; busy resumes without re-picking.
- **edge cases OK-as-is:** `classifyPause`'s `{kind:"blocked"}` branch is unreachable by any wired node (kept for
  safety); `metadata` throws (→ error → ownerGate), never `__pause`; lean-Short prune list matches `_TEMPLATE`.
- **verdict:** sound. The autonomous loop is wired and safe to re-fire (busy guard + persist-before-run). Remaining
  for live autonomy: register the **CronCreate** routine on the owner's cadence (needs the owner's number) + the
  one-time `GEMINI_API_KEY`/YouTube OAuth so the review/upload nodes don't pause.

## 2026-06-12 — Short scene-plan build gap (the storyboard wire-up) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope:** close the last build gap before a full hands-off run (WAVES_3-5_PLAN "What remains" #2). The Short
  scene-plan is now **derived** instead of pausing for a hand-authored file. `pipeline/01-script/make-short.mjs`:
  extracted `pickShortScenes` (the single selection-truth shared by the Short script + plan), added `makeShortPlan`
  (reuse each kept scene's long plan entry under the Short's renumbered `scene_id`; `leanForShort` strips long-only
  `engine`/`hf_scene` so the Short renders pure Remotion; `minimalProps` fallback when the long plan lacks an entry)
  and `deriveShortPlanFile` (writes `short/scene-plan.json`, schema-validated, **idempotent + non-clobbering** — a
  hand-authored Short plan is respected). `orchestrator/run.mjs`: `plan_short` now calls `deriveShortPlanFile(...)`
  (no agent pause) with deps `["short_script","plan_long"]` (needs the long plan to exist).
- **result:** **405 tests green** (author wrote 5; verifier added 5 regression tests; baseline 400→405).
- **bugs found + fixed:** **none** (clean PASS, no production code changed). Verifier stressed the core **id-parity**
  invariant (short SCRIPT ids ≡ short PLAN scene_ids) across 7 `targetSeconds` values + custom `wpm` + the dedup
  fallback-hook case, the renumbering join when a middle scene drops, rich-prop survival, and the missing-long-plan
  error path — all correct.
- **verifier regression tests (5):** id-parity sweep (5..100s, scenes actually dropping); dedup fallback-hook never
  doubles; custom-`wpm` parity; `leanForShort` preserves `revealOn`/`cueWords`/`beats`/`focalZoom`/`pip` while
  stripping `engine`/`hf_scene`; `deriveShortPlanFile` throws a clear `ENOENT` when the long scene-plan isn't produced yet.
- **edge cases OK-as-is:** empty-scenes (rejected by `minItems:1`, same as `makeShort`, can't reach this phase);
  `null` longPlan → all-minimal fallback (graceful); `run.test.mjs` still overrides `plan_short` (graph completes).
- **verdict:** sound. A real run no longer pauses at `plan_short`; the Short inherits the long video's storyboard work.

## 2026-06-12 — Wave 5 / T5.2 (Analytics loop — close the growth loop) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope — T5.2** (Phase B #4): `pipeline/06-publish/fetch-analytics.mjs` — pull each PRODUCED video's real
  YouTube Analytics, write them into that idea's `metrics`, then **re-rank** the bank so the next auto-pick
  prefers clusters that actually performed. Pure + injected-client (mirrors `upload.mjs`):
  - `fetchVideoAnalytics({client,videoId})` → one `reports.query` (`ids:channel==MINE`, `filters:video==<id>`);
    `parseAnalyticsRow` maps by `columnHeaders` name (never positional); `toIdeaMetrics` → schema fields
    (`views`/`avg_view_seconds`/`retention_pct`/`ctr`/`fetched`), never fabricating a 0 for an absent column.
  - `performanceScore` 0..100 — each present signal normalized vs a baseline (1.0 = on-par), clamped [0,2],
    weights **re-normalized over present signals** so a missing metric never drags the score to 0; `null` when no signal.
  - `rerankBank` — produced ideas blend `score`→measured `performance`; backlog ideas get a **bounded task-cluster
    nudge** (double down on what works). **Idempotent:** `adjusted_score` always re-derived from the immutable
    `score` + metrics, never accumulated; predicted `score` preserved. Re-sorts by `adjusted_score ?? score`.
  - `runAnalyticsLoop` — resolve produced ideas → `youtube_video_id` via each video's `publish.json`, fetch
    (fail-soft per video), apply, re-rank. Null-client path re-ranks existing metrics only.
  - Schema: extended `ideas.schema.json` (`metrics.retention_pct`/`fetched`, idea `adjusted_score`/`performance`).
    `auth.mjs` `YT_SCOPES` += `yt-analytics.readonly` so the one-time consent also covers analytics.
- **result:** **395 tests green** (author wrote 20; verifier added 9 regression tests; baseline 366→386→395).
  Acceptance check passes: a fake stats payload re-orders the bank (strong-cluster backlog overtakes weak).
- **bugs found + fixed:** **none** (clean PASS). Verifier exercised idempotency (3× + on an already-adjusted
  bank → re-derives, no drift), missing-signal re-normalization, the cluster-accumulation idiom, ragged/string
  `columnHeaders`, zero-value preservation, CTR fallback chain, and [0,100] clamping — all correct.
- **verifier regression tests (9):** 3-run idempotency; stale-`adjusted_score` re-derivation; string `columnHeaders`;
  ragged row; `0` row value preserved; CTR fallback chain (`annotation`/`impressions`/`card`); two-in-a-cluster
  accumulation; `adjusted_score` clamped at 100 and at 0 (both still schema-valid).
- **verdict:** sound. Open follow-up (T5.1): wire a scheduled trigger to run the loop on a cadence; live numbers
  arrive only after the first upload sets `publish.youtube_video_id`.

## 2026-06-12 — Wave 4 (Swappability hardening: TTS dispatcher + Distributor seam) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope — T4.2 + T4.3** (owner confirmed: T4.1 render-engine port already done by V5/V6, so Wave 4 = these two;
  **unify edge + Azure** behind the seam, **no new provider**; **Node selector + Python backends**):
  - **T4.2 — TtsProvider dispatcher.** `pipeline/02-voice/voice-dispatcher.mjs`: pure `selectVoiceProvider` /
    `selectVoiceBackend` / `voiceArgs` (provider→script via `VOICE_SCRIPTS`: edge-tts→`make_voice.py`,
    azure→`make_voice_azure.py`), injectable `synthesizeVoice`, + a `<id> [--final]` CLI. Draft =
    `config.voice.provider` (default edge-tts), final = `config.voice.final_provider` (default azure) — D-024.
    `orchestrator/run.mjs` `voice_long`/`voice_short` now call `voiceArgs(ctx.config, id)` instead of hardcoding
    `make_voice.py`; **default stays edge-tts** so existing nodes are unchanged. Alignment untouched/provider-agnostic.
  - **T4.3 — Distributor port seam** (consumed by Wave 5 / T5.3 + D-027; **seam only, no live network**).
    `pipeline/07-distribute/distributor.mjs`: pure `watchUrl` / `buildCrossPost` / `buildDistributionPlan`
    (emits schema-valid `distribution.json`) + the port (`Distributor` abstract, `NoopDistributor`,
    `MockDistributor`, `PostizDistributor` **stub** — `.post()` throws until a client is injected) +
    `createDistributor` (noop when `config.distribute.enabled` is false/absent, else postiz). New
    `schemas/distribution.schema.json` registered in BOTH validators; `distribute` config section (disabled)
    in `config.json` + `config.example.json` + `config.schema.json`.
- **result:** **366 tests green** (author wrote 11 + 14 = 25; verifier added 12 regression tests; baseline 354→366).
  Both config files validate via the CLI auto-map; real-config routing smoke-tested (draft→`make_voice.py`,
  `--final`→`make_voice_azure.py`).
- **bug found + fixed (verifier):** the CLI validator never mapped **`config.example.json`** → `config.schema.json`
  (pre-existing gap; in scope now that the `distribute` block lives in that file too) — added the mapping to both
  `validate.js` and `validate-lib.mjs`; verifier test guards against schema drift.
- **verifier regression tests:** default-invariant across every empty/partial/null config shape
  (`voiceArgs({}|{voice:{}}|null|undefined, id)` → `make_voice.py`); draft/final fallbacks when only one provider
  is set; `buildCrossPost` caption fallback (empty/non-array `title_options`) + empty-string `videoUrl` → id-link;
  explicit provider override with `enabled:false`; `publish={}` still emits a schema-valid plan; config.example map.
- **verdict:** sound. The two existing adapters (edge-tts/Azure; noop/postiz) prove each seam; adding ElevenLabs or
  a real Postiz client is one adapter, not a rewrite. Open follow-up: Wave 5 / T5.3 wires the live Postiz client +
  the after-upload `distribution.json` write.

## 2026-06-12 — Wave 3 (Freshness & news: anti-stale facts cache + news watch) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **scope — T3.1 + T3.2:**
  - **T3.1** `pipeline/shared/knowledge/facts.json` (curated, source-backed cache: model/price/version/limit,
    each with `source` + `retrieved`) + `refresh-facts.mjs` (a **staleness AUDITOR** — flags stale-by-age,
    unreachable source, value-no-longer-on-page; **never overwrites a value** — owner chose "curated +
    staleness", not auto-extract) + `schemas/facts.schema.json` registered in both validators. Doc rule
    reinforced in `fact-check` + `script-writing` (model/tool/price/version **fetched live, never recalled**).
  - **T3.2** `pipeline/00-ideas/fetch-news.mjs` (`NewsSource` port): no-dep RSS/Atom + HN Algolia JSON parsers,
    dedup across sources by normalized-title hash (≥2 sources ⇒ higher score), `news.json`, and promotion of
    top corroborated items to **Desk Notes** ideas (`source.origin:"news"`, idempotent). Fail-soft per source.
    Config RSS endpoints for the-decoder/tldr verified live and updated.
- **result:** **329 tests green** (author wrote 12 + 1; verifier added 12 regression tests).
- **bugs found + fixed:** none by the verifier (clean PASS). Author self-caught + fixed during build:
  (a) HTML **numeric entity decode** (`&#039;`/`&#x27;`) — generic decimal/hex decoder + test;
  (b) **relative-URL guard** in `parseRss` (verifier flagged it as a schema-validity risk) — skip non-absolute
  links so `news.json` stays `format: uri`-valid; regression test added.
- **verifier regression tests:** boundary staleness (age == max_age is fresh), future/empty/missing facts;
  same-source-name doesn't inflate corroboration, recency-bucket cutoffs, promotion non-mutation + max cap.
- **live smoke:** `fetch-news --dry-run` parsed the-decoder (10) + tldr-ai (20) + HN (20) = 50 unique;
  official HTML sources fail-soft to 0 (RSS endpoints TBD, out of this wave's scope).
- **verdict:** sound. Open follow-ups: wire official-source RSS endpoints when verified; T3.3 (schedule the
  refresh) folds into Wave 5.

## 2026-06-12 — V7 visual-lift kickoff (capture push-in + bold `hook-prism` hero) — verifier PASS
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Fable 5 / Opus 4.8). These are
  visual changes (TSX + HTML/JS/Three.js), NOT covered by `node --test`; the gate is `tsc --noEmit` +
  rigorous code review of the determinism/frame-purity contract.
- **scope — two changes:**
  1. **capture-segment default push-in** (`templates/remotion/src/templates/templates.tsx` `CaptureSegment`):
     the owner flagged the Excel demo "just plays flat, no zoom like before." Root cause: `CaptureSegment`
     had ZERO motion (the promised auto-zoom was never implemented — only the opt-in `focalZoom` existed and
     004's scene-plan never set it). Fix: a frame-pure cinematic push-in (scale 1.0→1.20 over the first
     2.5s, `Easing.out(cubic)`, origin "50% 40%"), SKIPPED when `kenBurns:false` or an outer `focalZoom`
     (target + scale>1) is active so the two never compound.
  2. **bold hero scene `templates/hyperframes/scenes/hook-prism/`** (Three.js/WebGL): the owner said the
     restrained `hook-kinetic` was "not visibly different from a flat card — go MUCH bolder (3D/particles/
     shaders)." A research-first subagent (per the `research-first-then-surgical` rule; rejected TypeGPU/
     WebGPU because chrome-headless-shell gates WebGPU off → would render black, chose WebGL) built an
     aurora fragment-shader bg + glowing particle tunnel + converging 3D glass shards, title crisp on top.
     Drop-in to the SAME V6 variables contract (same `make-entry.mjs` math; vendored three.js + gsap, no
     CDN). Proven in-pipeline: re-tagged 004's hook `hf_scene:"hook-prism"`, the cache correctly
     re-rendered (the V6 `hfScene` cache-key fix working live), composited via `props.hfSrc`, rendered the
     hook in context with synced narration + captions.
- **verifier verdict:** **PASS, no blocking bugs.** Change 1: `tsc` 0; push is frame-pure; the focalZoom
  skip condition is exactly symmetric with `renderScene`'s FocalZoom-wrap guard (truth-table checked — no
  double-zoom, no missed-push in any input combo); short-scene clamping safe (`extrapolateRight:"clamp"` +
  `overflow:hidden`). Change 2: determinism confirmed — no `requestAnimationFrame`/`Date.now`/
  `performance.now`/unseeded `Math.random` in any output-affecting path; the Three.js layer renders only on
  `hf-seek`, all state a pure function of seek time; `make-entry.mjs` uses the identical epsilon-proof
  `(FRAMES-0.5)/fps` formula (189f@30fps verified); fully vendored; silent; 19.5% bottom caption reserve;
  both orientations handled. Non-blocking notes: stale code comment (1.14/2s → fixed to 1.20/2.5s);
  redundant timeline double-registration (matches hook-kinetic, harmless); theoretical sub-frame async
  three.js import race (graceful `.catch` in place); a stale gitignored compositions entry.
- **status:** `npm test` **296 green** (visual changes add no unit tests); `tsc` 0. Awaiting owner
  direction on look/scope before wiring into the skills + a full 004 render + commit. **Uncommitted.**

## 2026-06-11 — Wave V6 (first HyperFrames hero scene → `combo` engine; sync proven on a real video)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Fable 5 / Opus 4.8).
- **scope:** add a second renderer alongside Remotion that reads the SAME engine-agnostic
  `content/<id>/timeline.json`. New `pipeline/04-render/compile-hyperframes.mjs` — pure
  `buildHyperframesJobs` (timeline seconds → render jobs whose `durationFrames`/`revealsSeconds` mirror
  `compileTimeline`'s window math EXACTLY, incl. crossfade pull-back + reveal lead), `jobVariables` (the
  fixed variables contract), `buildEntryCommand` + `buildRenderCommand` (isolated CLI shape),
  side-effecting `renderHyperframesScenes` (spawn-injected, idempotent: skip when mp4 + variables file
  unchanged), `copyHyperframesClips` (clip → `templates/remotion/public/<outId>/hf/`, sets `props.hfSrc`),
  and a standalone CLI. `compile-remotion.mjs` now passes `engine:"hyperframes"` through via a conditional
  spread (key ABSENT for remotion scenes → golden stays byte-identical). `build-props.mjs` runs
  `copyHyperframesClips` in `combo`/`hyperframes` mode (never spawns a browser — rendering stays in the
  CLI). `config.render.engine` → `"combo"`. Remotion: new frame-pure `components/HfClip.tsx` (full-bleed
  silent `OffthreadVideo`); `Main.tsx` swaps an HF scene's clip in for its template inside the SAME
  crossfade `Sequence`, captions overlay as usual, graceful fallback when `hfSrc` is missing. First hero
  scene `templates/hyperframes/scenes/hook-kinetic/` (kinetic-type hook; needs a `make-entry.mjs` pre-step
  because hyperframes v0.6.70 reads frame-count/canvas from STATIC entry attributes).
- **acceptance (sync proven on a real video):** on a scratch copy of 004 with the hook tagged
  `engine:"hyperframes"`, the timeline put scene `s01.0` at `fromFrame 45 / durFrames 440`; the HF clip
  rendered to **exactly 440 frames @ 30fps, 1920×1080, NO audio stream** (ffprobe), composited via
  `props.hfSrc`, and ONLY `s01.0` carried an `engine` key. Two Remotion stills inside the window (f60 mid
  hook, f200 fully landed) confirmed the kinetic hero plays under the synced narration captions. `tsc` 0;
  `npm test` **296 green**.
- **bugs found + fixed (the verifier earned its keep):**
  1. **HIGH** — `jobVariables()` omitted `hfScene` from the idempotency cache key, so changing ONLY
     `props.hf_scene` (a different hero template) would silently reuse the stale clip. **Fix:** `hfScene`
     now leads the variables payload (the file records which template rendered it; the hero scene ignores
     the extra key). Regression tests pin the re-render-on-change behavior.
  2. **LOW/latent** — when `templates/hyperframes/.bin` is absent, `childEnv` aliased `process.env`
     instead of a spread copy (a future write would corrupt the parent env). **Fix:** always
     `{ ...process.env }`.
  Plus two real bugs the **author** caught during the live sync proof (not in the unit tests): the
  spawned render broke on the space in the repo path (`AI Automatizacija`) under `shell:true` → added a
  win32 arg-quoting helper `q()`; and the render couldn't find ffmpeg → prepend the vendored
  `templates/hyperframes/.bin` to the child PATH. The verifier confirmed both fixes correct and added a
  spaces-in-path skip-logic regression test.
- **verifier-added regression tests:** 6 (parity at index 2-of-4 + last-scene; hfScene cache-key invalidation
  end-to-end; childEnv freshness; spaces-in-path skip logic). 290 → **296 green** after fixes.
- **verdict:** PASS (after the two production fixes were applied; re-run green). **Uncommitted** — awaiting
  owner review of the proof stills + an explicit commit instruction.

## 2026-06-10 — Wave V5 (engine-agnostic timeline seam: build-props → timeline.json → compile-remotion)
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Fable 5 / Opus 4.8) — two
  passes (initial review + a re-verification of the fix).
- **scope:** split the render step so the engine becomes swappable (de-risks V6 HyperFrames). New pure
  `pipeline/04-render/lib/timeline.mjs` (`buildTimeline` → engine-agnostic `content/<id>/timeline.json`
  in absolute SECONDS, per-scene `engine` field, the forced-alignment sync logic). New
  `pipeline/04-render/compile-remotion.mjs` — pure `compileTimeline` (seconds→frames, byte-identical) +
  `copyRemotionAssets` (narration/captures/logos/b-roll) + a standalone resume CLI. `build-props.mjs`
  slimmed to an orchestrator (buildTimeline → validate+write timeline.json → compile → policy warnings →
  write props). `lib/focal.mjs` gained `resolveCueWindowSeconds` (cue words→abs seconds) +
  `localizeCueWindow` (abs seconds→scene-local frames); `resolveCueWindow` kept. timeline.schema.json
  (+ branding/crossfade/motion/engine/focal-seconds) and scene-plan.schema.json (optional per-scene
  `engine`) updated. `content/_FIXTURE/golden-props.json` committed as the byte-identical golden.
- **acceptance:** re-rendering the fixture (via build-props AND the standalone compile resume) produces
  Remotion props **byte-identical** to `golden-props.json`. `tsc` 0; `npm test` **275 green** (+21 over
  the 253 baseline + the verifier's regressions).
- **bug found + fixed (the verifier earned its keep):** the first cut stored timeline times as
  `introSeconds + rawSeconds` and rounded in compile — but `round((introSeconds+raw)*fps) ≠ introFrames +
  round(raw*fps)` in IEEE-754 (e.g. raw=0.55@30fps → 61.499…→61, not 62), so scene cuts/reveals/focal
  cues would drift 1 frame on real alignments; the fixture dodged every drift point so the golden still
  passed. **Fix:** `buildTimeline` now SNAPS every single-value event to an exact frame
  (`(introFrames + round(raw*fps))/fps`), making compile's `round(sec*fps)` recover the legacy frame
  EXACTLY for all inputs. Captions stay un-snapped on purpose (their relFrom/relDur are raw-difference
  rounded; snapping would break the golden) — accepted residual ≤1-frame per-word *display* wobble at FP
  boundaries, never an audio desync. The verifier's `[KNOWN-DRIFT]` tests were converted to
  `[verifier-fix]` tests that drive the real pipeline on adversarial drift-point alignments and assert
  exact legacy parity for scenes/reveals/focal.
- **re-verification:** PASS. Snap fix proven sound by exhaustive search (N≤100k, fps∈{24,25,30,60,29.97,
  23.976}, zero counterexamples); the fix-verification tests confirmed non-circular; byte-identical
  intact; caption decision quantified as acceptable (±1 frame, per-word fade only). One verifier
  regression test added pinning the caption FP-boundary behavior.
- **verdict:** PASS. **Committed `486b9d0`** (with the motivated-motion work below).

## 2026-06-10 — Motivated motion (focalZoom + PiP) — generalized into the pipeline
- **verifier:** Sonnet 4.6 (`claude-sonnet-4-6`), independent of the author (Opus 4.8).
- **context:** after the **V2.5 global-camera revert**, the owner's vision (zoom INTO a prompt/element
  when the voice names it, PiP inset in a corner, release when done) was **researched first** (subagent,
  per the new rule), proven on one scene (owner-approved), then generalized.
- **scope:** new `pipeline/04-render/lib/focal.mjs` (`cueSeconds` + `resolveCueWindow` — map narration
  cue words → scene-local frames, pure); build-props resolves opt-in `props.focalZoom`/`props.pip`
  per scene (no-op when absent); new frame-pure `FocalZoom` + `PipInset` components + `anim.ts`
  `focalEnvelope`/`focalTransform`; `Main` wraps **non-custom** scenes that opt in (custom scenes
  self-handle → no double-zoom); `PromptFocus` prompt-card scene (PiP + zoom) made prop-driven;
  scene-plan schema documents the opt-in props. **Surgical, never global**; captions untouched
  (separate track); tables/lists/body text stay still by policy.
- **result:** `tsc` 0; pipeline `npm test` **253 green** (+4 verifier regressions). End-to-end smoke:
  a hook scene with `focalZoom:{in:"day",out:"back"}` resolved to `inAt 65 / outAt 157`, and a Main
  still mid-zoom showed the scene punched into its target while the caption stayed put.
- **bugs found:** none. **Low/doc note:** an inverted cue order (`out` word earlier than `in`) silently
  yields no zoom (envelope ~0) — documented in the storyboard skill.
- **verdict:** PASS. **Committed `486b9d0`** (together with V5 above).

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
