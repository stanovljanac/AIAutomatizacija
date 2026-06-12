# PROGRESS LOG

Running history of what was done, by whom (human/agent), and what's next. Newest
entries on top. Keep entries short and factual. Per-video history goes in each
video's `content/<id>/log.md`; this file is the project-level log.

Format:
```
## YYYY-MM-DD — <short title>
- who: human | agent
- did: …
- next: …
- blockers: … (optional)
```

---

## 2026-06-12 — Wave 3 shipped: anti-stale facts cache + multi-source news watch
- who: agent (Opus 4.8) + Sonnet 4.6 verifier (PASS) + owner (2 design calls)
- did: built **Wave 3 (Freshness & news)** from `docs/WAVES_3-5_PLAN.md`.
  - **T3.1 — knowledge-freshness cache.** New `pipeline/shared/knowledge/`: `facts.json` (curated,
    source-backed model/price/version/limit values, each with `source` + `retrieved`; seeded live via the
    `claude-api` skill + web — never from memory), `refresh-facts.mjs` (a **staleness auditor** that flags
    stale/unreachable/changed facts and **never overwrites a value**), `facts.schema.json` registered in both
    validators. Owner decision: **curated + staleness**, NOT auto-extract (auto-parsing a price from a feed
    risks writing a wrong number — the exact thing the anti-stale rule prevents). Owner also chose **no code
    checker** this wave (the review loop + fact-check already read facts.json). Rule reinforced in the
    `fact-check` + `script-writing` skills: model/tool/price/version is **fetched live, never recalled**.
  - **T3.2 — news watch.** `pipeline/00-ideas/fetch-news.mjs`: no-dep RSS/Atom + HN Algolia JSON parsers,
    dedup across sources by normalized-title hash (≥2 sources ⇒ higher score), writes `news.json`, promotes
    top corroborated items to **Desk Notes** ideas (`source.origin:"news"`, idempotent). Every source is
    fail-soft. the-decoder/tldr config URLs swapped to verified RSS endpoints. Live dry-run: 50 unique items
    from 3 working feeds.
  - **gate:** `npm test` 316 → **329 green** (13 author + 12 verifier regression tests). Verifier PASS, no
    bugs (BUILD_LOG 2026-06-12). `news.json` + `freshness-report.json` git-ignored; `facts.json` committed.
- next: **owner one-time** before the first hands-off video — `GEMINI_API_KEY` in `.env`, YouTube OAuth, and
  wire the Short scene-plan (WAVES_3-5_PLAN "What remains"). Then **Wave 4/5**. T3.3 (schedule the news/facts
  refresh) folds into Wave 5 (T5.1). Wire official-source RSS endpoints when verified.
- blockers: none. (Owner has not asked to commit — changes left in the working tree.)

## 2026-06-12 — V7 kickoff: capture push-in + first BOLD hero (`hook-prism`); owner steer captured
- who: agent (Fable 5 / Opus 4.8) + Sonnet 4.6 verifier + owner (live review)
- did: owner reviewed V6 and said the restrained `hook-kinetic` looked "the same as a flat card" + the
  Excel demo "just plays flat, no zoom." Two fixes, both Sonnet-verified PASS (BUILD_LOG 2026-06-12):
  (1) `CaptureSegment` (templates.tsx) gets a default cinematic **push-in** (1.0→1.20 over 2.5s),
  auto-disabled when an outer `focalZoom`/`kenBurns:false` is set — demos are never flat again.
  (2) A research-first subagent built a BOLD hero `templates/hyperframes/scenes/hook-prism/`
  (Three.js/WebGL aurora plasma + particle tunnel + converging 3D glass shards; rejected WebGPU since the
  render browser gates it off). Drop-in to the V6 contract; proven in-pipeline on 004's hook (re-tag →
  cache re-rendered → composited → rendered with synced captions). `npm test` 296 green; `tsc` 0.
- owner steer for the NEXT hero pass (tomorrow): **keep the aurora/plasma background, REPLACE the prism
  shards** with a cleaner motif, and **move the palette toward brand black/yellow** (logo-driven — flag
  VISUAL_IDENTITY for a palette review). **Scope = hook + up to 2 hero moments per video** (surgical).
  Capture push-in is the default but used **selectively** (video-dependent); precise per-step zoom (e.g.
  "zoom in when Claude's answer returns", a prompt that scrolls + grows) is the `focalZoom` mechanism,
  authored per video. `hook-prism` stays as infra-proof + draft, not the final look.
- next: tomorrow — "nastavljamo sa pravljenjem celokupnog sistema" (build out the whole system toward
  headless autonomy) + the hero recolor/replace-shards pass above.
- status: **V6+V7 committed + pushed.**

## 2026-06-11 — Wave V6: first HyperFrames hero scene → `combo` engine (sync proven)
- who: agent (Fable 5 / Opus 4.8) + Sonnet 4.6 verifier
- did: built the second renderer half. New `04-render/compile-hyperframes.mjs` reads the SAME
  `content/<id>/timeline.json` and renders every `engine:"hyperframes"` scene to a SILENT mp4 at its
  EXACT Remotion scene window (window math mirrors `compileTimeline` incl. crossfade pull-back + reveal
  lead), then `copyHyperframesClips` composites it into Remotion via `props.hfSrc` + a frame-pure
  `components/HfClip.tsx` (`OffthreadVideo`). `compile-remotion.mjs` passes `engine` through only for HF
  scenes (golden stays byte-identical). `build-props.mjs` does the copy/resolve in `combo` mode (never
  spawns a browser — rendering stays in the standalone CLI `compile-hyperframes.mjs <id> [--force]`).
  `config.render.engine` → `combo`. First hero scene `templates/hyperframes/scenes/hook-kinetic/`
  (kinetic-type hook, deterministic/silent; ships a `make-entry.mjs` pre-step because hyperframes v0.6.70
  reads frame-count/canvas from static entry attributes). **Sync PROVEN** on a scratch copy of 004: HF
  hook clip = exactly 440 frames @30fps (== the scene window), no audio stream, captions overlay synced;
  two stills confirm the look. `tsc` 0; `npm test` **296 green**. Verifier found 2 bugs (HIGH:
  `jobVariables` missing `hfScene` from the cache key → stale-clip reuse; LOW: `childEnv` aliased
  `process.env`); both fixed. Author also fixed 2 environment bugs during the live render (space in the
  repo path under `shell:true`; ffmpeg via the vendored `.bin`). See `docs/BUILD_LOG.md`.
- next: V7 — a small vetted menu of HF hero scenes; `storyboard` routes 1–3 per video;
  `qa-video`/`check.mjs` verifies the HF scene window (no black gaps, right duration, captions over it);
  wire `05-qa/check.mjs` into the orchestrator. **Generalize only after the owner signs off on V6.**
- blockers: owner review of the proof stills + an explicit **commit** instruction (V6 is uncommitted).

## 2026-06-10 — Wave V5: engine-agnostic timeline seam (render engine now swappable)
- who: agent (Fable 5 / Opus 4.8) + Sonnet 4.6 verifier (two passes)
- did: split the render step into a SYNC half and an ENGINE half so a second renderer (V6 HyperFrames)
  can plug in without touching the forced-alignment logic. New pure `04-render/lib/timeline.mjs`
  (`buildTimeline` → `content/<id>/timeline.json`, engine-agnostic, absolute SECONDS, per-scene `engine`
  field). New `04-render/compile-remotion.mjs` — pure `compileTimeline` (seconds→frames) +
  `copyRemotionAssets` + a standalone resume CLI. `build-props.mjs` is now a thin orchestrator
  (buildTimeline → validate+write timeline.json → compile → policy warnings → write props). Added
  `resolveCueWindowSeconds`/`localizeCueWindow` to `focal.mjs`; extended timeline + scene-plan schemas
  (per-scene `engine`). Committed `content/_FIXTURE/golden-props.json` as the byte-identical golden.
  **Acceptance met:** fixture props are byte-identical via both build-props and the standalone compile
  resume. `tsc` 0; `npm test` **275 green**. The Sonnet verifier caught a real IEEE-754 frame-drift bug
  (absolute-seconds rounding ≠ legacy intro+round on real alignments); fixed by frame-SNAPPING every
  single-value event in buildTimeline (captions stay un-snapped to preserve the golden; ≤1-frame
  per-word display wobble only). Re-verified PASS (snap proven sound by exhaustive search). See
  `docs/BUILD_LOG.md`. **Committed `486b9d0` + pushed to origin/main** (with motivated motion).
- next: V6 — author one vetted HyperFrames hero scene, build `compile-hyperframes.mjs` (render a
  `engine:"hyperframes"` scene to a silent MP4 at its timeline window, Remotion imports via
  OffthreadVideo), flip `render.engine` to `combo`, prove sync on one real video.

## 2026-06-10 — Motivated motion (focalZoom + PiP) built + generalized
- who: agent (Opus 4.8) + Sonnet 4.6 verifier + owner (approved direction)
- did: followed the research-first rule — subagent researched motivated zoom / picture-in-picture
  (where it helps vs hurts) → presented to owner → owner picked "prompt card + PiP + zoom" → built a
  single-scene PROOF (`PromptFocus`: prompt card slides in as a PiP, focal zoom punches into it, then
  out) → owner approved → **generalized into the pipeline**: `04-render/lib/focal.mjs` (cue-word →
  scene-local frame resolver), build-props resolves opt-in `props.focalZoom`/`props.pip`, frame-pure
  `FocalZoom` + `PipInset` components, `Main` wraps non-custom opt-in scenes (custom self-handle).
  Surgical, never global; tables/lists/body text stay still; captions untouched. 253 tests green; tsc
  0; end-to-end smoke verified (cue "day"/"back" → frames 65/157, zoom visible, caption put).
  Sonnet-verified PASS. **Committed `486b9d0` + pushed to origin/main** (with V5).
- next: owner reviews the proof clip/stills (sent). Then either tune, or proceed to V5 (timeline
  seam) / V6 (HyperFrames). Same focalZoom/pip prop now also enables capture-segment / code / stat
  zooms (opt-in via scene-plan). See `docs/WAVE_V_HANDOFF.md`.
- blockers: none.

## 2026-06-10 — V2.5 motion overhaul REVERTED; pivot to motivated motion (research-first)
- who: agent (Opus 4.8) + owner
- did: tried V2.5 (global per-scene Ken-Burns camera + zoom-through transitions + breathing bg +
  floating text on every scene) to beat the slideshow feel. Owner rejected it — global aimless motion
  broke templates (tables cut in half, floating text) and felt worse than clean static ("bolja mi je
  verzija 2 od 2.5 mnogo"). It was all uncommitted → `git restore`d back to the committed V2 look.
  Now: 242 tests green, tsc 0, working tree clean. Captured two standing rules (memory
  `research-first-then-surgical`): (1) research any new technique with a subagent BEFORE building,
  apply surgically not globally; (2) motion must be MOTIVATED (zoom into a prompt/PiP inset/key
  element when it's the point, zoom out when done — like capture-segment auto-zoom), tables/body text
  stay clean.
- next: research subagent on motivated zoom / picture-in-picture (where it helps vs hurts +
  deterministic Remotion mechanism) → present use-case matrix + design + single-scene proof to the
  owner BEFORE building. Then V5/V6 once the visual direction is settled. See `docs/WAVE_V_HANDOFF.md`.
- blockers: none.

## 2026-06-09 — Wave V4b: deterministic QA gate (hybrid) + checkpoint clip
- who: agent (Opus 4.8) + Sonnet 4.6 verifier
- did: built the CODE half of qa-video — `pipeline/05-qa/check.mjs` (+ pure `check-lib`) runs
  artifact-level HARD checks from the format recipe (Short length, first-30s hook, caption density,
  no-empty, coverage/black-gap), writes `qa.report.json`, **fails-closed** (exit 1). Reuses
  `policy.mjs` + the format. Perceptual checks stay in the skill (now runs the gate first). 242 tests
  green; Sonnet-verified (13 edge regressions). Sent the owner a ~58s gallery clip of the Phase-0
  visual jump.
- next: owner reviews the clip; then **V5** — emit engine-agnostic `timeline.json` +
  `compile-remotion.mjs` (byte-identical render) → **V6** `compile-hyperframes.mjs` + first
  HyperFrames hero scene (flip `render.engine` to `combo`).
- blockers: none.

## 2026-06-09 — Wave V4: skills + style now read the format recipe
- who: agent (Opus 4.8)
- did: pointed the workflow at the recipe as the single source of truth — `script-writing`,
  `storyboard`, `qa-video` (added the HARD first-30s hook check + format-sourced thresholds),
  `script-review`, plus `STYLE_GUIDE`/`VISUAL_IDENTITY` (numbers live in the recipe; b-roll off;
  motion intensity is a knob) and a `CLAUDE.md` "where everything lives" row + ROADMAP Wave V status.
  Doc-only (no build-sprint cycle). Owner decision: build a deterministic QA checker (hybrid) →
  next.
- next: **V4b** — `pipeline/05-qa/check.mjs` (artifact-level, fails-closed, reuse `policy.mjs` +
  format): short length, first-30s hook, caption density, no-empty, coverage → `qa.report.json`;
  perceptual checks stay in the skill. Then **checkpoint** (gallery clip) → **V5** timeline seam.
- blockers: none.

## 2026-06-09 — Wave V3: strong-hook rule + new hook scene + b-roll dropped
- who: agent (Opus 4.8) + Sonnet 4.6 verifier
- did: enforced "strong hook in the first 30s" (build-props warns via a pure policy helper;
  qa-video will hard-enforce in V4); made the no-empty-scene threshold a format knob
  (`pacing.max_static_hold_seconds`); dropped stock b-roll by default
  (`scene_set.broll.enabled=false` — code kept, just disabled); added a bespoke `HookStatReveal`
  opener (count-up stat + punch line). 220 tests green; Sonnet-verified (one null-guard fix).
- next: **V4** — point the skills (script-writing / storyboard / qa-video / script-review) and
  STYLE/VISUAL at the format recipe as the source of truth; add the qa-video HARD hook check;
  update ROADMAP.
- blockers: none. Deferred: true shared-element continuity (higher risk; persistent BG + new
  per-scene motion already read as continuous) — noted for a later pass.

## 2026-06-09 — Wave V2: motion system (first visible jump)
- who: agent (Opus 4.8) + Sonnet 4.6 verifier
- did: replaced the single-fade "slideshow" feel with a real motion vocabulary — kinetic
  word-by-word hook, number count-up, SVG draw-on diagram/flow connectors, spring presets,
  emphasis pop, and an intensity budget (calm/standard/lively) threaded from the format via
  `MotionContext`. `tsc` clean; 201 pipeline tests green; confirmed on rendered gallery stills.
  Sonnet-verified (2 low cosmetic fixes applied).
- next: **V3** — dedicated hook/opening scenes + first-30s enforcement (build-props warn,
  qa-video hard), shared-element continuity between scenes, and dropping stock b-roll via the
  format flag.
- blockers: none.

## 2026-06-09 — Wave V1: build-props reads the format recipe
- who: agent (Opus 4.8) + Sonnet 4.6 verifier
- did: wired `build-props.mjs` to the resolved format — intro/outro/crossfade/lead, caption
  density, and the Short-length gate now come from `formats/default.json` via the pure helper
  `04-render/lib/timings.mjs` (`deriveRenderTimings`), not hardcoded numbers. Passed the motion
  budget into props for the render side. Behavior-preserving (proven: fixture props identical —
  intro 45 / outro 75 / xf 9). 201 tests green; Sonnet-verified.
- next: **V2** — the motion system: expand `templates/remotion/src/lib/anim.ts` (kinetic type,
  number count-up, SVG path-draw, easing variety, emphasis, subtle ambient), upgrade the flattest
  templates, and gate movement by `motion.intensity`. This is the first visible "not a slideshow" jump.
- blockers: none. Tracked follow-ups: align `run.mjs` Short-target + the no-empty `secs>6` threshold
  to the format (BUILD_LOG).

## 2026-06-09 — Wave V0: modular video-format spec (foundation)
- who: agent (Opus 4.8) + Sonnet 4.6 verifier
- did: started **Wave V** (modular video formats + pro motion design → then HyperFrames hero
  scenes; owner-approved 0→1→2 sequencing). Shipped **V0**: a declarative format recipe
  (`pipeline/shared/formats/default.json`, schema `format.schema.json`, resolver
  `lib/format.mjs`) — the future single source of truth for production-policy knobs (hook length,
  motion intensity, pacing, captions, length, intro/outro, scene set, per-archetype structure) that
  today are scattered across prose + hardcoded constants. Wired into both validators via a
  `formats/`-dir rule. 191 tests green; Sonnet-verified (see BUILD_LOG).
- next: **V1** — wire `build-props.mjs` (+ theme/anim pass-through) to the resolved format so
  caption/intro/outro/crossfade/length come from the recipe; re-render `_FIXTURE` identical-or-better.
- blockers: none.

## 2026-05-31 — Project foundation created
- who: agent (planning session)
- did: Defined the whole project with the owner via a long Q&A. Created repo
  structure, `CLAUDE.md`, full `docs/` (PRD, ARCHITECTURE, TOOLS, WORKFLOW,
  ROADMAP, PROGRESS, DECISIONS, SETUP), `style/` files, all `.claude/skills/`,
  command `/novi-video`, Remotion template stubs, `_TEMPLATE`, and the worked
  example `001-sta-je-ai`.
- decisions logged: D-001…D-009 in `docs/DECISIONS.md`.
- next: Phase 1 — install environment per `docs/SETUP.md`, push repo to GitHub,
  then render the 10s Remotion test.
- blockers: none. Open questions OQ1 (free Serbian TTS quality), OQ2 (local render
  speed), OQ3 (channel account) tracked in PRD §10.

<!-- New entries below this line, newest on top. Add as you build each phase. -->

## 2026-06-09 — v1 orchestrator complete: Wave 1 (publish path) + O1 (DAG) + Wave 2 (review loop)
- who: agent (build, each step verified by an independent Sonnet sub-agent)
- did:
  - **Wave 1 publish path (P1–P7):** auto-metadata, make-short, loudness −16 LUFS, error-policy
    (retry→pause+notify), notifications, OAuth + **YouTube upload (private/draft only, never public)**.
  - **O1 orchestrator:** resumable DAG runner (parallel waves, manifest resume, error/gate pause) +
    the single-video composition with the long‖short fan-out (D-033); `npm run make-video -- <id>`.
  - **Wave 2 multi-model review loop:** shared rubric, live Gemini adapter (free tier), Sonnet
    sub-agent adapter, the loop (author merges fixes, re-review until both ≥9 or cap), wired into the
    script + cut stages. **Verified to fail closed** — a hard-gate-failing/unscored script can't pass.
  - Committed Wave 1 + policy as `f611e78` (Wave 0 was `ae92a6c`).
- decisions: D-040/D-041 (prior session). **156 tests green; verifier verdicts in BUILD_LOG.**
- next: **✅ integration wired** (voice/align → Python mechanical; render/qa → video-render /
  qa-video skills via the Runner — real headless, deferred to the top agent in Claude-Code).
  **166 tests green.** Everything remaining (the first real video + Waves 3–5) is captured in detail
  in **`docs/WAVES_3-5_PLAN.md`** — the resume-here handoff doc.
- blockers: none. Owner one-time steps for the live run: `GEMINI_API_KEY` (free, AI Studio) +
  YouTube OAuth `token.json` (`node pipeline/06-publish/auth.mjs`).

## 2026-06-08 — Phase B/C build kicked off: Wave 0 (foundations) + build-sprint policy
- who: agent + owner (co-design Q&A, then build)
- did:
  - **Co-designed Phase B/C** with the owner (16 decisions): hexagonal ports, hybrid runner,
    Remotion+HyperFrames combo kept, reviewer panel = Sonnet 4.6 + Gemini 3 Flash (free),
    bands ≥9 / ≥9.2, news = official + The Decoder + TLDR/HN (deduped), errors = retry→pause+notify,
    approval = YouTube draft + notification. Plan saved under `~/.claude/plans`.
  - **Shipped Wave 0** (commit `ae92a6c`): shared `validate-lib` + `npm test` (node --test) + golden
    `content/_FIXTURE/`; schemas review/news/timeline/config (+ ideas provenance); config panel/llm/
    news/error/notify; Runner + Reviewer ports with authoritative hard-gate-clamped scoring;
    generalized no-prompt permissions; purged the one-off Video-#4 commands. **46 tests green.**
  - **Independent Sonnet verifier** caught + we fixed a hard-gate scoring bug (partial gates passing).
  - **Codified the build-sprint cycle** as policy: Stop test-gate hook + `build-sprint` skill +
    CLAUDE.md rule + memory (D-041).
- decisions logged: D-040, D-041.
- next: Wave 1 (auto-metadata, make-short, loudness −16 LUFS, OAuth + upload, error/notify,
  orchestrator) → Wave 2 (live Gemini review loop). 
- blockers: none. Owner one-time steps (needed only for the live run): `GEMINI_API_KEY` (free,
  https://aistudio.google.com/apikey) and the YouTube OAuth `token.json`.

## 2026-06-07 (eve) — Video #4 produced end-to-end (experiment) + big system upgrades
- who: agent + owner (recording + 3 gate reviews)
- did:
  - **Produced video #4** "I Gave Claude & ChatGPT the Same Messy Spreadsheet" (mini-demo
    experiment): owner recorded 9 free-vs-free clips on a synthetic 2,000-row file (40 dup /
    30 broken dates / 25 bad totals planted); agent **verified the cleaned files vs the answer
    key** (ChatGPT 34/40 dupes + silent date blanking; Claude 40/40 + keeps/flags; totals tie),
    wrote the real-results script (24 scenes), rendered long (**Azure final voice**, 4:56) +
    Short (Azure, 50.7s). All per-video 004 media is git-ignored.
  - **Alignment root-fixed (D-035):** difflib sequence alignment + hyphen-split in
    `make_alignment.py` — kills the recurring caption drift.
  - **No-empty-scene + b-roll guardrails (D-036):** new `VersusNote` custom scene (real
    ChatGPT/Claude logos) replaced an empty lower-third; b-roll reverted (off-topic/looping/
    flicker) — SceneWrapper now `OffthreadVideo`, plays once; `pipeline/03-visuals/fetch-stock.mjs`
    built (Pexels/Pixabay) for future *fitting* use only.
  - **Thumbnails (D-037):** owner generates from 2 prompts (free tool); agent only composites
    via new `ThumbComposite` (ChatGPT/Claude/Excel logos, no title, covers the watermark).
  - **Capture wiring:** `build-props.mjs` now copies capture clips + brand logos into Remotion
    `public/` and wires `src` (first real mini-demo).
  - **Cross-platform metadata (D-038):** SEO at script-approval; YT desc = 3 sentences; Short =
    1 sentence + link; **Medium** description per video (600–700w, AI-search-cited prompt) →
    `medium.md`. `publish.json` ready (status draft_pending).
  - **Roadmap:** added **Phase C — self-reviewing autonomous studio** (2 other models review →
    loop to ≥9 → auto-draft to YouTube; owner only does final approval + thumbnail) (D-039).
  - Decisions logged **D-034…D-039**. Memories saved (comparison-as-experiment, b-roll rules,
    thumbnails-prompts, seo-at-script-approval, autonomous-studio north star).
- next: owner final-approves #4 → upload. **Upload blocker:** YouTube needs a one-time OAuth
  (`token.json`) to auto-draft; else manual upload. Then build Phase C (LLM-judge harness +
  `pipeline/06-publish/upload.mjs`). Short still has no Short-specific intro music (optional).
- blockers: YouTube OAuth not set up (one-time owner action) for auto-upload.

## 2026-06-07 — Folder refactor (nested Short) + Video #4 pivoted to a real experiment
- who: agent + owner (multiple gate reviews, incl. 2 independent model reviews)
- did:
  - **Folder refactor:** the Short now nests at `content/<id>/short/` (was a separate
    `<NNN>-short` top-level folder). `build-props.mjs` detects the Short by the **last path
    segment** + flattens artifacts to `<id>-short`; `new-video.mjs` scaffolds a lean
    `short/`; updated CLAUDE.md, ARCHITECTURE §3, video-render & qa-video skills. Verified
    (detection across new/legacy/false-positive; git-ignore intact; legacy 002/003-short still work).
  - **Video #4 pivoted** from a theory comparison ("Claude vs ChatGPT for Spreadsheets") to a
    **real experiment** — "I Gave Claude and ChatGPT the Same Messy Spreadsheet" (mini-demo /
    Desk Fixes). Drivers: experiment > review; **free-vs-free** (owner has Claude Pro but won't
    pay for ChatGPT — paid-vs-free is unfair); **never fabricate results**.
  - Built a deterministic **synthetic-data generator** (`scripts/make-synthetic-orders.mjs`,
    2000 rows, planted 40 dupes / 1139+30 dates / 25 bad totals) + a **scorer**
    (`scripts/score-orders-clean.mjs`). Owner recorded 9 clips free-vs-free + saved both tools'
    cleaned files & take-home scripts.
  - **Verified the cleaned files vs the planted truth:** Claude 40/40 dupes & kept/flagged
    broken dates; ChatGPT 34/40 (missed 6 last-name-first) & silently blanked 30 dates;
    totals 25/25 tie. Honest verdict: the flashier tool (ChatGPT) produced the *riskier* file.
  - **Script written, reviewed, APPROVED** (24 scenes, "demo-with-rigor" framing: planted-truth
    credibility beat, failure-mode naming, free-tier-only caveat, one copy-pasteable master
    prompt). **Voiced** = edge-tts Andrew −2% **draft**, ~4.8 min; whisper alignment, hard gate
    passed (65/65 sentences timed).
  - New rule **script-writing §11**: automation/how-to clips lead with one stylized
    copy-pasteable prompt (full prompt in description); reusable script > one-off. Idea-bank:
    003 → produced, 004 → in-progress, + sequel idea ("a rules system that won't let bad data
    in"); fixed invalid status enum values.
- decisions: framing = **demo with rigor as proof** (not a benchmark-showcase); length = let
  the captures **"breathe"** → ~6 min (render-side; B4). Memories saved: comparison=experiment,
  lead-with-copy-pasteable-prompt.
- next (tomorrow, B4): storyboard scene-plan; **wire captures into `build-props` (new code)** +
  the captures-breathe audio segmentation; 2 thumbnails; render long + Short; QA → final-video
  gate; then **Azure final voice** + publish prep.
- blockers: none. (edge-tts now installed in `.venv`; ffmpeg still not on PATH — not needed:
  Remotion bundles it and breathe is render-side.)

## 2026-06-06 — Video #3 produced ("5 Tasks an AI Can Do Like a Secretary") + render hardening
- who: agent + owner (gate reviews)
- did:
  - **Produced video #3** (first real idea-bank topic; Ideas / Desk Loops) end-to-end:
    script → fact-check (sourced decline stat, on-screen source) → review → scene-plan →
    Azure final voice → faster-whisper align → 17 beats → render. Long ~5:18 + Short 50.6s +
    2 thumbnails. **Per-video files are git-ignored** (003+ per CLAUDE.md); the *system*
    changes below are what's committed.
  - **4 new window-aware custom scenes** (`DeskScatter`, `CalendarFind`, `InboxTriage`,
    `MorningSynthesis`) + registered in `Main.tsx`. Motion spread across each window + the
    longest scenes split into beats (kills the static-hold feel — the owner's #1 complaint).
  - **Caption system rewrite (fixes owner-reported drift/overlap):** captions are now
    **chunked to ≤7 words / ≤2 lines, shown only as spoken** (was dumping whole sentences →
    3-6 lines + text ahead of audio). Long captions moved into a bottom **safe-zone** (lower,
    lighter); `Frame` + custom scenes bias content upward so captions never cover graphics.
    Short layout left as-is (owner: it was good).
  - **Thumbnails** redesigned — `Thumbnail.tsx` now supports multiple motifs (iconRow /
    bigIcon / flow); 2 distinct variants, dropped the confusing "DESK LOOPS" kicker. Owner
    picked **thumb A** for this upload.
  - **HARD rule enforcement** (owner: "make me follow our own rules"): `build-props.mjs`
    exits if a `*-short` is outside 45-120s; `qa-video` + `video-render` skills got HARD
    checks (Short length, captions ≤2 lines / safe-zone / no-overlap, pacing).
  - **Andrew slowed for next videos:** `config.voice.rate` +8% → **-2%** (~10% slower) to
    test whether it reduces the progressive caption lag on long videos.
  - **Permission allow-list** added (`.claude/settings.json`) so script-approval → final runs
    hands-off (pipeline/render/file-edits allowed; **git commit/push still prompt**).
- decisions:
  - **Captions on long videos:** if the progressive lag persists after slowing Andrew, drop
    burned-in captions on long-form and rely on YouTube's auto-captions; **keep burned-in on
    Shorts/Reels**. (Likely root cause is alignment time-scaling vs real audio duration — a
    rescale-by-actual-duration fix is the candidate if we revisit.)
  - **Gates this round:** script gate + final-video gate both used; owner publishing #3 himself.
  - Permission-prompt automation = the allow-list (option 2), not full bypass.
- next: owner publishes #3 (thumb A, altered-content=yes). Then video #4 from the idea-bank
  on the slower voice; watch the caption lag; wire Pexels/Pixabay b-roll (dark-graded) as the
  next system addition. Deferred: loudness -16 LUFS (needs ffmpeg on PATH).
- blockers: none.

## 2026-06-04 (late) — Rebrand → The Automation Desk + monetization compliance + Short draft
- who: agent + owner (strategy from a YouTube 2026 algorithm breakdown; reviewed by a 2nd model)
- did:
  - **Rebrand → The Automation Desk** (@TheAutomationDesk) across all docs/skills/Remotion/
    thumbnail/scene-plan (D-023). "Boring automations" becomes a *series*.
  - **Compliance (verified by research):** edge-tts violates Microsoft ToS for commercial use →
    **dual-TTS**: edge for drafts, **Azure AI Speech for the published final** (same Andrew voice,
    500k chars/mo free) — `scripts/make_voice_azure.py`, config `voice.final_provider`, `.env`
    keys (D-024). **Always disclose altered content = yes** at upload (D-025; reverses the old
    no-disclosure note). **Answer-first + specific facts** script rules (D-026).
  - **Anti-slop core (D-028):** human-fingerprint (owner angle + occasional real demo), the Desk
    series system (Desk Fixes/Loops/Breakdowns/Notes ↔ archetypes), topical clusters. Staged
    sequencing (compliance+presence before clip 1; auto-posting in parallel).
  - **Distribution plan (D-027):** Postiz (self-host, free) hub + `pipeline/07-distribute`
    (not built yet). Owner sets up accounts/store/Azure in parallel — see `docs/SOCIAL-SETUP.md`.
  - **Assets:** thumbnail B + a workflow motif; **re-rendered 002** (rebrand); built the
    **Short** (`content/002-short/`, 1080×1920, ~34s) — both still **edge-tts drafts** awaiting
    the owner's separate approval, then Azure for the final voice.
- next: owner approves the long + Short drafts (separately) + does Phase A in parallel; then
  Azure final voice + launch + Phase B machinery. Full plan in `docs/ROADMAP.md` + `docs/WAVES_3-5_PLAN.md`.
- blockers: none. (Uncommitted since `fd1c1fe`.)

## 2026-06-04 — Pilot 002 produced + dynamic-scene system (D-022)
- who: agent + owner (gate reviews)
- did:
  - **Produced pilot 002** end-to-end ("What AI Automation Actually Is"): script →
    edge-tts Andrew voice → **faster-whisper alignment** (F: venv `.venv`, F: HF cache;
    edge-tts emits no WordBoundary so we recover word timings from the clean TTS) →
    Remotion render → burned-in synced captions → mp4. Built the production renderer:
    `Main.tsx`, `pipeline/04-render/build-props.mjs`, scene-template library, `CaptionsTrack`.
  - **Iterated to dynamic scenes (D-022)** after owner feedback that scenes were too
    static: reveal-sync from alignment (`revealOn`/`cueWords`), scene **beats**, persistent
    background + **crossfade** (`SceneWrapper`), an **icon registry**, new **`flow`** +
    **`icon-list`** templates, and bespoke illustration scenes (`HandCopy`, `AiFlow`,
    `ChaosX`, `DeskScene`). Rewired 002's scene-plan to use them; dropped "in plain English"
    from the hook card. Re-rendered (~4:04, 1080p/30fps).
  - **Cleanup:** removed test/proof scaffolding (Test/Bakeoff/BakeoffLong/KineticText,
    hyperframes/bakeoff demo, Serbian colab/kaggle/tts scripts). Kept TemplateGallery (dev),
    HyperFrames CLI + agent skills (installed: hyperframes/gsap/three/lottie/…), 001 archive.
  - Rules added (owner): never shorten — **length follows the topic**; visual density
    follows the narration; build custom/illustrated scenes, don't loop the same templates;
    **Gate 1 is auto** (no stop) — real gates are script + final video. Decisions D-020…D-022.
- next: owner watches the dynamic 002 (Gate 3). On approval: thumbnail (2 variants) + Short +
  YouTube draft, then produce video #2 from the idea-bank on the new system.
- owner feedback 2026-06-04 (applied): **redesigned `ChaosX`** into an iconified
  microservice tangle (servers/DB/AI/queues with labels); reveal lead nudged (-0.22s) so
  animations land on the word; outro is now the channel handle only ("@BoringAIAutomations"
  — historical: predates the D-023 rebrand to **@TheAutomationDesk**), CTA stays on the prior
  scene. Committed & pushed the iteration (fd1c1fe).
- blockers: none.

## 2026-06-02 — PIVOT: Serbian-AI → "Boring AI Automations" (English, faceless)
- who: agent + owner (long decision interview)
- did: After Serbian TTS proved an unfixable free blocker (D-010), re-founded the
  project as an **English, faceless** channel about **boring everyday AI automations**
  for builders/freelancers. Ran a full design interview (9 rounds) and executed the
  Phase-0 doc migration:
  - Tagged `serbian-ai-archive` at HEAD (old work preserved; nothing deleted).
  - Logged **D-011…D-019** (pivot, name, archetypes+fixed-templates, edge-tts EN voice,
    local-first compute, EconVault account, ad-RPM, human-angle rule, render bake-off).
  - Rewrote `CLAUDE.md`, `README.md`, all `docs/` (PRD, ARCHITECTURE, WORKFLOW, ROADMAP,
    TOOLS, SETUP) and `style/` (CHANNEL, STYLE_GUIDE, VISUAL_IDENTITY); retired
    `TERMBANK.md` → EN note.
  - Updated skills: retired `translation-localization`, rewrote the rest for EN +
    4 archetypes + 3 gates, added new `screen-capture` skill.
  - Schemas: updated `brief`/`script` (archetype, angle, template tags), added
    `ideas` + `scene-plan`; wired the validator. Updated `config.json` (edge-tts, en,
    `render.engine`). Renamed phase `00-topic` → `00-ideas`.
  - Seeded the **idea-bank**: `pipeline/00-ideas/ideas.json` (50 scored, multi-tagged
    ideas) — validates. Added a `_TEMPLATE/script.sample.json` (validates).
- decisions: D-011…D-019 added (supersede, don't delete; D-008 avatar dropped).
- next: **Phase 1** — A/B a few edge-tts EN voices, owner picks the channel voice;
  build the thumbnail template. Then Phase 2 render bake-off (Remotion vs HyperFrames)
  + the scene-template library. Owner actions: confirm EconVault access, approve name.
- blockers: none. (`content/001-sta-je-ai` kept as an archived example.)


## 2026-06-01 — Phase 2: voice clone WORKS (OpenAudio S1-mini); Colab recipe + open Serbian question
- who: agent + human (recording + Colab runs)
- did:
  - Owner recorded the voice sample in Audacity; analyzed both takes with a quick
    WAV meter (16-bit mono 48kHz, ~3.4 min): **clean room** (noise floor −71..−81
    dBFS, SNR ~37–40 dB, 0 clipping), just low level. Verdict: **usable for
    cloning**. Kept the louder take as `voice/reference/owner-sample.wav`.
  - **Voice cloning works:** a 22s test produced natural **Serbian** in the owner's
    voice via **OpenAudio S1-mini** (open, free) on a free Colab GPU.
  - Hard-won **working Colab recipe** (also in `scripts/colab/`, DECISIONS D-010):
    clone fish-speech → `apt portaudio19-dev` → `pip install -e .` → pin
    `torchvision==0.23.0` and `transformers==4.57.3`. The model is **gated** on HF
    (needs a free token via Colab Secrets `HF_TOKEN`); it's **cached on Google
    Drive** so later sessions copy it instead of re-downloading 3.6 GB.
  - Built `scripts/colab/fish_speech_full_narration.ipynb` (v2): token login + Drive
    cache + fast sanity check + full "Šta je AI" narration. Dropped the throwaway
    clone-test/disguise notebooks (their job is folded in).
- open question (OQ1): **Serbian is NOT on S1-mini's official language list** (it
  lists ru/pl + others). The 22s test sounded right anyway (Slavic proximity), but
  we judge the **full narration by ear** before committing. If insufficient →
  ElevenLabs paid fallback (D-003).
- decisions: **D-010** added.
- next: owner finishes HF-token setup, runs the full-narration notebook, listens to
  the whole Serbian narration → decide free vs paid. Then implement `02-voice`
  (continuous TTS + forced alignment) or flip to ElevenLabs. Voice-disguise
  (pitch/formant) only if owner dislikes own voice after hearing the full take.
- blockers: none (pending the owner's listen).

## 2026-05-31 — Phase 2 started: voice recording script written
- who: agent
- did: wrote `voice/RECORDING_SCRIPT.md` — 8 varied sections (neutral narration,
  lists, questions, excitement, technical terms, conversational, numbers/names,
  CTA) in the channel "ti"-tone. Gave the owner Audacity install + recording/cleanup
  settings (mono, 44.1/48kHz, peaks −12..−6 dB, noise reduction, export to
  `voice/reference/owner-sample.wav`, normalize toward −16 LUFS). Script is
  git-ignored (personal). Current text ≈ 6–8 min of speech — enough for a first
  clone test; can extend toward ~30 min later for max quality.
- next: owner installs Audacity now, records the sample (next session). Then Colab
  A/B — Fish Speech S2 vs XTTS on the same paragraph — + forced alignment →
  `alignment.json`. Pick a backend by listening; log in DECISIONS.
- blockers: none.

## 2026-05-31 — Phase 1 COMPLETE (validator, scaffold, config)
- who: agent
- did: closed the remaining Phase-1 items so all three exit criteria pass.
  - **Schema validator:** root `package.json` + `ajv`/`ajv-formats`; wrote
    `pipeline/shared/validate.js` (infers schema from filename, `--schema`
    override, precise error paths). `npm run validate -- <file>` or
    `node pipeline/shared/validate.js <file>`.
    - Ran on `content/001-sta-je-ai/script.json` → **PASS** (SETUP §8 step 1).
    - Bonus: all 7 worked-example artifacts (brief, script, storyboard,
      visual-prompts, alignment, qa.report, publish) **PASS** — schemas + example
      are coherent.
    - Negative test (missing `scenes`, `language:"en"`) correctly **FAILs** with
      exit 1 and pinpointed errors — proves it's a real validator.
  - **/novi-video scaffold:** `pipeline/00-topic/new-video.mjs` deterministically
    picks the next id, copies `_TEMPLATE`, writes a schema-valid `brief.json`
    (idempotent; refuses to overwrite). Wired as `npm run new-video`. Added a note
    to `.claude/commands/novi-video.md`. Verified by scaffolding + validating a
    throwaway `002-test-scaffold` (then removed).
  - **Local config:** created `pipeline/shared/config.json` and `.env` from the
    examples (no secrets — `.env` keys left blank to fill in Phase 4/6).
  - **Fixed a gap:** `.gitignore` did NOT actually ignore `pipeline/shared/config.json`
    even though SETUP/CLAUDE.md said it should — added the rule. Verified with
    `git check-ignore` that `.env`, `config.json`, `out/`, `*.wav`, and
    `node_modules/` are all ignored; `git status` shows only text/source.
- result: **Phase 1 exit criteria all met** — `remotion studio` opens, 10s test
  renders (intro/outro + subtitle, continuous audio), schema validation runs.
- next: **Phase 2 — Voice.** Write `voice/RECORDING_SCRIPT.md` (varied Serbian,
  ~30 min), record the sample in Audacity (now is when Audacity is needed), then a
  Colab notebook to A/B Fish Speech vs XTTS on the same paragraph and pick a
  backend by listening. (Install FFmpeg on PATH before Phase 5 QA.)
- blockers: none.

## 2026-05-31 — Phase 1: Remotion render path working
- who: agent (+ human did the Windows installs)
- did:
  - Verified toolchain: Git 2.39, Node v20.17, npm 9.6, Python 3.11 all present.
    FFmpeg NOT installed and `winget` unavailable on this PC — flagged, but **not
    blocking**: Remotion ships its own ffmpeg, so the render works; system FFmpeg
    is only needed for the QA scripts in Phase 5 (install manually before then).
  - Installed Remotion 4.0.470 + React 19 + TypeScript in `templates/remotion`.
  - Built the Phase-1 `TestComposition` (10s @ 30fps, 1920×1080): `Root` + `Test`
    + components `Intro`, `Outro`, `KineticText`, `Subtitles` (word-highlight),
    `BackgroundFX`, and `theme.ts` (color/type tokens from VISUAL_IDENTITY
    defaults). Added `scripts/make-dummy-audio.mjs` (deps-free 10s WAV) and a
    single continuous `Audio` track — never cut, proving the production timing
    contract (ARCHITECTURE §6).
  - Rendered `templates/remotion/out/test.mp4`: 1.3 MB, **10.05s, h264 1920×1080
    30fps + aac stereo audio** (verified with Remotion's bundled ffprobe).
  - Confirmed `npx remotion studio` boots the template (Server ready on :3000).
  - Tooling decision for the owner: **defer OBS and Audacity** — OBS is only for
    Phase 3+ screen-capture demos, Audacity only for the Phase 2 voice sample;
    neither is needed for Phase 1.
- next: finish the remaining Phase-1 item — implement the `pipeline/shared`
  schema validator (`validate.js`) and run it on `content/001-sta-je-ai/script.json`
  (SETUP §8 step 1). Install FFmpeg on PATH before Phase 5 QA. Then start Phase 2
  (voice): write `voice/RECORDING_SCRIPT.md` and record the sample in Audacity.
- blockers: none. (FFmpeg + winget missing are noted, non-blocking for now.)
