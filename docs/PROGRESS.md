# PROGRESS LOG

Project-level log of what was done and what's next. **Newest entries on top.** Keep entries
short and factual. Per-video history goes in each video's `content/<id>/log.md`.

The long per-wave build history (Waves 0–5 + Wave V step logs) was trimmed once the work shipped —
the **decisions** live in `docs/DECISIONS.md`, the **implementation methods** in `docs/ARCHITECTURE.md`
(§6 sync, §9 engine, §12 autonomy/freshness/swappability), and the full step-by-step history is
recoverable from git.

Format:
```
## YYYY-MM-DD — <short title>
- who: human | agent
- did: …
- next: …
- blockers: … (optional)
```

---

## 2026-07-11 — Thumbnail intelligence (04b) + publish.md + publish review stage (plan v2, Phases 1+2)
- who: agent (owner-approved plan `serialized-plotting-sundae.md`)
- did: Built plan v2's "build now" scope. **(1) `pipeline/04b-thumbnails/`** — `score-scenes.mjs`
  (deterministic thumbnail score from scene metadata; ONE exported `WEIGHTS` object, `reasons` =
  fired criteria; icon walls lose, bare title cards + CTA/outro scenes excluded) + `extract.mjs`
  (settled-frame selection from the timeline's own reveals; HF clips grabbed caption-free by
  construction, Remotion scenes only at caption gaps in final.mp4; 3 candidates + final-ready
  composites + schema-valid `thumb_candidates.json`). **(2) Publish side** — `publish.md` human
  export (fields 1:1 with publish.json, which stays canonical; `--md-only` / `--choose-thumb`
  CLI; the pick writes `chosen:true` + the canonical `images/thumb_final.png`) and a **publish
  review stage** on the single-Sonnet panel (SEO/claims rubric; `stage_overrides.publish`;
  orchestrator `review_publish` node; `reviewStage` now resolves stage overrides). Wired
  `thumbnails` + `review_publish` into the DAG. **Verified on 012:** 3 clean 1280×720
  caption-free stills (hook freeze / NOT-TRUSTED verdict / gray-pile 60-a-month), `publish.md`
  generated with publish.json untouched, live Sonnet publish review scored 7.4 (pause band) with
  real fixes (incl. the stale `medium.cover` path — fixed via the canonical-copy on pick).
  Decisions D-056/D-057. npm test green.
- next: owner eyeballs 012's 3 candidates and picks (`--choose-thumb <#>`); consider the
  reviewer's description nit (the "80¢-a-video, 60-a-month" unit ambiguity) before upload.
  Phase 3 (LinkedIn skill, research-first) in a later round; CTR→weights learning stays a
  separate project.

## 2026-07-10 — 012 Gate ③ passed with fixes; 012 locked as the minimum visual benchmark; publish pack (manual upload)
- who: agent (owner directed)
- did: Owner reviewed 012 and set it as the **minimum benchmark for visuals/animations/transitions**
  going forward (MOTION_SPEC §0 "whole-video floor" + memory). Applied his 2 fixes: MY DESK nodes
  centered in their GATE fields (s14 `pipeline-recap`), and the `lab-outro` "next build" tag +
  station row moved below the text stack so late-appearing elements never cover text (long + Short).
  Re-rendered the 3 affected HF clips (frame-verified), re-assembled both finals. Wrote the full
  publish pack: `publish.json` (schema PASS — titles, 3-sentence answer-first description, 15
  real-timestamp chapters, tags, pinned comment, community post, Short caption) + `medium.md`
  (AI-search-optimized blog). **Owner decisions:** skip the Azure re-voice (ship edge-tts for 012)
  and **NO API upload — owner uploads manually** (testing his draft-underperformance theory; memory
  + publish.json note). npm test 534/534.
- next: owner uploads long + Short manually (Altered content = Yes), posts community text + Medium.

## 2026-07-07 — 011 "read my inbox" scripted (first KOS-driven video) + 2 review-born lessons
- who: agent (owner directed — "ideas for the next video + test the new KOS system on it")
- did: Ran the first video through the **KOS loop end to end**. READ the 3 `desk-knowledge/lessons/`
  first, applied them, then WROTE knowledge back from a real review.
  - **011 `everyone-asks-ai` Short** — "Everyone Asks AI to Build an App. I Asked It to Read My
    Inbox." Scaffolded `content/011-read-my-inbox/` (git-ignored); Step-0 **research-first**
    (vibe-coding hype vs AI inbox triage; tool routed FREE/model-agnostic, paid apps kept
    off-screen) → `research.md` + `sources.md`; wrote `brief.json` (score 88) + `short/script.json`
    (7 beats, mirrors the gate-passed 009 arc; each scene notes the KOS lesson it honors —
    S4 visible-run proof, no title-card, S6 model-agnostic). `validate.js` PASS.
  - **Owner-relayed 2nd-model review → 4 edits applied:** S3 stat de-recited (momentum) → demoted
    to a sourced corner chip, opened experience-first on the mess; S5 invented anecdote removed →
    general truth; S4 got an "aha" zoom-on-the-buried-mail beat; CTA rewritten for identity
    ("the most useful AI I built doesn't build anything"). Re-validated PASS.
  - **KOS write-back (the loop closing):** authored 2 evidence-backed lessons —
    `dont-break-momentum-with-a-spoken-stat` + `no-invented-anecdotes-in-scripts` — and ran
    `node scripts/knowledge-lint.mjs --fix` (0 errors).
- did (cont. — production): owner APPROVED at the script gate → SEO package → edge-tts voice +
  faster-whisper align → scene-plan (6 bespoke inbox components + recap-cta reuse) → 6 new
  frame-pure Remotion components built (hook-inbox-feed doom-scroll, app-to-inbox-flip,
  inbox-pile, inbox-sort-run centerpiece w/ aha zoom, forgotten-cascade, sort-you-decide) →
  render → mechanical QA 10/10 → perceptual still-review caught 3 (S7 reused RecapCta HARDCODED
  009's text — declared-but-ignored title prop; S6 sparse open; S3 layout hole) → fixed → v2.
- did (cont. — owner final-gate feedback, 3 rules born):
  - **Fill-the-stage layout rule** (owner): content spans the 5%→85% band, big type; transitions
    NEVER reflow layout (S2 v1 height-collapse jank rejected) → S2 rebuilt as absolute fly-out/
    slide-up swap; S3/S5/S6/S7 upsized + spread → rule written into `MOTION_SPEC.md` §0.
  - **No announced honesty** (owner): "Now the honest part" was a stock beat-opener tic across
    videos → 011 S6 rewritten to open directly on the limitation; blacklisted in STYLE_GUIDE §9 +
    script-writing rule 1c. "Unsexy — that's the point." KEPT as the everyone-asks-ai series
    signature (owner decision).
  - Re-voiced (81.0s) + re-aligned + re-rendered.
- KOS write-back: **5 lessons total this cycle** (momentum-stat, no-invented-anecdotes,
  fill-the-stage, no-stock-beat-openers, prop-driven-reuse); `knowledge-lint --fix` 0/0;
  `npm test` 531 green.
- did (cont. — 2026-07-08, SHIPPED): owner approved v4 at the FINAL-VIDEO gate → Azure final
  voice (~0.24% quota) → re-align → final render → QA 10/10 → 2 thumbnail prompts →
  **uploaded PRIVATE draft https://youtu.be/-pBNgF-zPgU** (publish.json `uploaded_private`,
  brief `ready`). 011 is the first video produced end-to-end through the KOS loop.
- next: owner in Studio — Altered content = Yes, thumbnail, pinned comment, playlists
  (Everyone Asks AI + Desk Notes), community post, Publish. Analytics → ideas.json (growth loop).

## 2026-07-04 — KOS v1.0 implemented: knowledge base standard + validator + adoption (D-050)
- who: agent (owner directed — "implement KOS per `knowledge/KOSplan.md`")
- did: Implemented the Knowledge Operating System per the approved plan:
  - **Bootstrap standard** `knowledge/bootstrap/` — `SYSTEM.md` (entry, Agent-Skills-compatible)
    + 9 specs (philosophy / architecture / metadata / linking / sizing-and-splitting / lifecycle /
    adoption / maintenance / validation); 855 lines total, every file under its §5 budget.
  - **Validator** `scripts/knowledge-lint.mjs` — the 9 checks of plan §4.9 (frontmatter schema
    via ajv, Purpose header, link resolution + no-wikilinks, size caps by role, orphans/
    reachability, category integrity, deprecated placement, stale drafts, evidence-for-canon)
    + `--fix` (generates Backlinks footers + AUTO-INDEX category listings); exit 0/1/2.
    18 tests in `scripts/knowledge-lint.test.mjs`; `npm test` widened to `pipeline/ scripts/`.
  - **Adoption (Phases A–E)** on this repo — mapping per plan §2.3 (canonical stays in place:
    DECISIONS/style/facts.json/rubric/skills); instantiated `knowledge/desk-knowledge/`:
    `index.md`, `PROJECT.md` (canonical map + knowledge sources + local rules), and `lessons/`
    seeded with 3 evidence-backed lessons (title-card rejections → MOTION_SPEC §0 + `no_title_card`;
    proof-must-be-visible; research-real-workflow-first / 008 Gemini-503). CLAUDE.md got the
    pointer row ("Where everything lives").
- verify: `npm test` **531 green** (513 + 18 new); `node scripts/knowledge-lint.mjs --fix` →
  **0 errors, 0 warnings** across 6 instance files; second `--fix` run = no changes (idempotent).
- next: live the loop — write/update lessons + research after each video cycle, run the
  validator on every instance write; monthly maintenance sweep; consider Stop-hook wiring
  once the instance is stable.

## 2026-07-04 — 010 SEO/publish prep + Medium post (owner-requested)
- who: agent (owner directed)
- did: Prepared the publish-side deliverables for 010 "the point of trust" (Desk Notes / ideas).
  Finalized `content/010-point-of-trust/seo.json` — trimmed the description to the owner
  MAX-3-sentence answer-first rule (full cite-or-refuse prompt lives in the pinned comment),
  locked the 8 chapter timestamps from `timeline.json` (0:00→3:54), set the home playlist
  **Desk Notes**, added the Community-tab post + Medium metadata (title + cover = thumb_final).
  Wrote `content/010-point-of-trust/medium.md` (AI-search-optimized, ~640 words). Recommended
  title: **"AI Wrote Fake Court Cases. A Lawyer Got Suspended."**
- next: owner picks a thumbnail, uploads 010 as private/draft (altered content = Yes), adds it to
  the Desk Notes playlist, pins the comment, then publishes. (010's `content/` files are
  git-ignored per design — they stay local; only this log entry is committed.)

## 2026-06-29 — New "Everyone Asks AI" series lane + strategist-scene standard
- who: agent (owner directed)
- did:
  - **Strategist-scene standard** written into `style/MOTION_SPEC.md` §0: every scene is *conceived*
    like a strategist (meet or beat 009 S1 `HookFeedHype` — mirror the viewer's feed), never a
    templated title card. Reference scene + 6-point checklist.
  - **New content lane `everyone-asks-ai`** added to `ideas.schema.json` + `brief.schema.json` enums
    and the `CHANNEL.md` series table (the repeatable "I did the opposite" reframe format). Clarified
    `ai-news` (weekly roundup = owner's "Desk News" playlist) vs `desk-notes` vs `everyone-asks-ai`.
    Re-tagged 009 brief `desk-notes` → `everyone-asks-ai`.
- next: 009 gets its own "Everyone Asks AI" YouTube playlist (owner-side); build more in the format.
- verify: `npm test` green (513); `validate.js` PASS on 009 brief with the new lane.

## 2026-06-29 — 009 Short S1 hook rebuilt (doom-scroll feed) + dropped second-model verification (D-049)
- who: agent (owner directed — rejected the S1 opener as a static title card)
- did: Two owner-directed changes.
  - **S1 hook rebuilt from scratch.** Owner rejected the old S1 (the `money-hero` HyperFrames clip: gold
    aurora + "Desk Notes" kicker + word-by-word "make me money" that then sat static — dynamic background,
    dead foreground). Replaced with a bespoke Remotion custom component **`HookFeedHype`** (`hook-feed-hype`,
    registered in `Main.tsx`): a full-bleed, fast **doom-scroll of AI get-rich hype** — "EVERYONE'S FEED ·
    RIGHT NOW" + a search bar reading "make me money with AI" (blinking caret), endless upward-scrolling hype
    cards (`$10k/month`, `AI trading bot +480%`, `money while you sleep`, viral/AD/LIVE/HOT tags, green pump
    sparklines, fake view counts) + gold "$" rain + a gold glow that pulses on the narration beats and a
    scroll that accelerates on beat 2 ("trading bots, side hustles, money while you sleep"). Frame-pure,
    seek-accurate, reveals-synced; caption zone kept clear (viewport clipped to top ~75%, edge-faded).
    `scene-plan.json` S1 switched from `engine:hyperframes`/`hf_scene:money-hero` to `template:custom`
    `component:hook-feed-hype` → this Short is now pure Remotion (no HF clips). Old `templates/hyperframes/
    scenes/money-hero/` is now orphaned (left in place — owner to decide on removal).
  - **Removed the different-model (Sonnet) verification** from the build-sprint cycle per owner (D-049):
    the owner is the real reviewer, so no model-on-model check. Updated the `build-sprint` skill, `CLAUDE.md`
    golden rule, `docs/ROADMAP.md`, `docs/DECISIONS.md` (D-041 amended + new D-049), and the
    `build-sprint-cycle` memory. Scoped to code only — the video review panel (D-040) is unaffected.
- verify: `npm test` **513 green**; rebuilt props OK (no hook-rule / engine-mismatch warnings); rendered S1
  preview stills at frames 70/175/270 — feed scrolls, tags/charts/$-rain render, captions clear. No
  second-model verification (per D-049).
- next: owner reviews the new S1 hook; if approved, re-render the full 009 Short.

## 2026-06-28 — 009 Short REBUILT: every scene bespoke (killed the title-card deck) + anti-title-card QA gate
- who: agent (owner directed — rejected the first 009 render as a reskinned-template slideshow)
- did: Owner reviewed the rendered 009 Short and rejected it — only S4 (MoneyLeakRun, a spreadsheet that
  visibly RUNS) was good; every other scene was a title/subtitle on a dark/aurora background ("empty
  slides with just titles"). Frame-extraction confirmed it. REBUILT every scene to the S4 bar:
  - 5 new bespoke Remotion components (frame-pure, reveals-synced like MoneyLeakRun): `HypeFlip` (S2
    hype→leak flip), `WeekGridLeak` (S3 week-grid + $28,500 counter + on-screen source), `ErrorCascade`
    (S5 typo→wrong-invoice→never-paid causal chain w/ arrows), `TimeReturned` (S6 week-grid callback,
    lost hours flip gold→green), `RecapCta` (S7 stop-the-printer + recap checks + Subscribe).
  - S1 hook = NEW bespoke 3D HF hero `money-hero` (fork of hook-prism): rushing GOLD-COIN money-storm in
    gold-black behind kinetic "make me money" (replaces the generic aurora). Deterministic/seek-driven.
  - Re-wired Main.tsx CUSTOM map + 009 scene-plan; re-ran build-props + compile-hyperframes; re-rendered.
    Mechanical QA 10/10 green; bespoke_ratio now 7/7 (100%) vs the rejected 4/8.
  - ENFORCED in code (not just docs): new HARD QA check `no_title_card` fails title-only kinds
    (section-header/term-highlight/stat-callout/cta-card + text-only HF hook-kinetic) in
    `pipeline/05-qa/lib/check-lib.mjs` + tests. Full suite 513 green.
  - QA model: verified GEMINI_API_KEY valid + `gemini-3.5-flash` reachable + `.env` auto-loaded by
    load-env.mjs. Configured panel = claude-subagent (sonnet) + gemini-3.5-flash. The prior Sonnet+Haiku
    panel (see 2026-06-27 entry) was a wrong manual substitution when Gemini was assumed broken — corrected.
- next: owner reviews the rebuilt render (`templates/remotion/out/009-rebuild.mp4`; old
  `content/009-boring-money-leak/short/video/final.mp4` left intact for comparison). On approval: replace
  final.mp4 + re-voice to the Azure final voice + re-render. Build-sprint different-model verifier (Sonnet)
  NOT spawned (harness no-spawn default) — available on request.
- blockers: **C: drive 100% full (~1.7 GB free)** — Remotion/Chrome temp had to be redirected to F: to
  render; flag to owner (will keep breaking renders/other tools until freed).

## 2026-06-27 — 009 standalone viral Short (counter-trend money) through script gate + S4 component
- who: agent (owner directed, plan: uradi-mi-reserach-za-delegated-tarjan.md)
- did: Scaffolded `content/009-boring-money-leak/` (short-only, Desk Notes); researched + fact-checked
  the stats ($28,500/yr & 9hrs≈¼-week from the Parseur 2025 survey; up-to-4% error from industry
  benchmarks) → `sources.md` + `claims.json`; wrote the 7-beat Short (`short/script.json`),
  reviewed by a **different-model panel** (Sonnet 4.6 + Haiku 4.5, 3 iterations) → owner APPROVED at
  the script gate with mandated fixes (S4 visible-run, S5 single escalating chain, new title).
  Hand-authored `short/scene-plan.json` (HF heroes hook-prism/hook-kinetic + bespoke S4). Parked the
  4 ideas into `ideas.json` (#5 mapped onto ai-vs-macros-excel, not duplicated) + added the
  "Everyone asks AI to X, I asked it to Y" repeatable Short series.
  Built new portrait Remotion component **`MoneyLeakRun`** (S4 visible run: messy rows → Running…
  live counter → 39 ✔ / 1 ⚠ Review → invoice flips to Chased), registered in Main.tsx CUSTOM map.
- verify: Sonnet 4.6 verifier — PASS (tsc --noEmit exit 0; frame-pure/deterministic; valid icons;
  robust final-state hold). Fixed its 2 findings (3-frame Running/Done flicker; redundant identity
  interpolate). Root `npm test` 509/509 green.
- did (cont. — render+QA): edge-tts voice + faster-whisper alignment (87.9s, ~90.3s total, gate OK);
  compiled 3 HF heroes; V6 combo render to 1080×1920 (2708f). QA mechanical gate caught
  `no_adjacent_repeat` (S3 split was two stat-callouts) → auto-fixed beat-1 to term-highlight.
  Perceptual still-review (remotion still, no ffmpeg) caught that MoneyLeakRun's beats were on fixed
  seconds → resolved ~8s before narrated; fixed the component to drive beats off `data.reveals`
  (sentence-start frames) so the run lands on "watch it run", the resolve on "39 clean/1 flagged",
  and the invoice flip on "already chased" — verified on stills, re-rendered. qa.report.json = 13
  checks green, every on-screen stat shows its source. 2 thumbnail PROMPTS written (never auto).
- next: stage YouTube PRIVATE draft (SEO title/desc/tags) → owner FINAL-VIDEO gate. On approval:
  Azure final voice (same Andrew voice) → re-align → re-render before publish (edge-tts is draft-only).
- blockers: GEMINI_API_KEY in .env is invalid (panel ran Sonnet+Haiku instead); ffmpeg not on PATH
  (Remotion bundles its own; used `remotion still` for QA frames instead of ffmpeg extraction).

## 2026-06-25 — 008 fully re-authored bespoke + full re-render (owner: "make all scenes + render")
- who: agent (owner directed)
- did: Authored the remaining four bespoke HF scenes the storyboard had flattened into cards, each
  render-verified standalone then wired into the pipeline (engine:"hyperframes" + `revealOn:"sentences"`
  so `buildTimeline` feeds them per-sentence reveal beats):
    • s02 `monthly-retype` (intro, black+gold) — manual hand-typing + a red mistyped total.
    • s06 `swappable-engine` (body, blue+gold) — a fixed rail (folder → engine slot → checked sheet)
      with engine chips swapping in; REPLACES the icon-list AND the banned Expensify/QuickBooks. The
      s06 NARRATION was rewritten to drop Expensify/QuickBooks/Veryfi (tool-agnostic; engine names
      shown on-screen, verified) → re-voiced (edge-tts) + re-aligned (faster-whisper); 0 paid-SaaS
      words remain in the track.
    • s07 `receipts-mathcheck` (body) — the self-check thesis (subtotal+tax → Expected AGREES → gold
      REVIEW). • s09 `only-flags` (body) — clean green rows, one gold REVIEW, a glance ring + "1 to
      check" counter. • s11 `limits-privacy` (body) — three illustrated honest-note cards (scrawl ✗ /
      keep-image + IRS source chip irs.gov / green privacy lock).
  Determinism guardrail applied across scenes: color/flag states are TWEENED, never class-toggled,
  because the renderer SEEKS frames and GSAP suppresses callbacks on seek. Consistent vendors/numbers
  across hook/gate/math/flags (Brightleaf $128.40 · Marlow ??.??) so the cut tells one story; section
  colours: heroes/intro/outro black+gold, body blue+gold.
  Ran the full combo pipeline: re-voice+align → compile-hyperframes --force (7 clips at real scene
  windows) → build-props (timeline 9218f/307.3s, hfSrc wired) → Remotion render.
- verify: each scene render-verified by frame extraction (meaningful per-beat progression, no
  tic-motion); script.json + scene-plan.json schema-PASS; alignment 303.3s with the new s06 VO;
  look-test clips in `content/008-receipt-to-spreadsheet/looktest/` (01..07). Full-cut QA + owner
  Gate ③ next.
- next: QA the rendered mp4 (sync / captions / no-paid-saas / anti-slideshow) + spot-check frames;
  present the assembled cut + before/after to the owner; (Short + thumbnails + publish after approval).

## 2026-06-25 — 008 bespoke re-author: hook receipts fix + s07 math-check scene (owner-approved look)
- who: agent (owner directed)
- did: Owner approved the new kinetic hook + redesigned gate look ("clear, not cluttered"), with one
  fix: the receipt cards overlapped the subtitle. Lowered them in `receipts-hook` (resting `top`
  40%→52%, portrait 30%→36%) and made the sheet handoff orientation-aware so they feed the sheet
  without re-crossing the text — render-verified (frames at 2.8s/3.6s/13.5s, no overlap). Then started
  restoring the script's bespoke intent that the storyboard had flattened: the script marks s02/s07/
  s09/s11 as `custom` scenes but scene-plan had collapsed them into `term-highlight` cards (the
  slideshow root cause). Authored the first one — **`receipts-mathcheck`** (s07, the video's thesis):
  a reconciliation panel that SHOWS the self-check (Printed total → re-add Subtotal+Tax → Expected
  AGREES in green → a gold REVIEW strip for Marlow's unreadable total → "Typing/Checking — automated"
  badges). **Blue+gold body palette** (heroes/intro/outro stay black+gold) for section variety; same
  vendors/numbers as the hook + gate (Brightleaf $128.40 · Marlow ??.??) so the three scenes are one
  continuous story. Pointed scene-plan s01 at `receipts-hook` (was `hook-prism`).
- verify: render-verified each beat (frames 4.6/9.4/13.9/17.3s) — meaningful progression, not
  tic-motion; fixed a pill/value collision on the Expected row. `npm test` **508 green** (no pipeline
  code changed — new scene is template HTML/CSS/JS; render IS the verification). Look-test clips for
  owner: `content/008-receipt-to-spreadsheet/looktest/{01-hook,02-gate,03-mathcheck}.mp4`.
- next: author the remaining flattened-`custom` scenes (s02 "the monthly retype", s09 "only check the
  flags", s11 "limits + privacy"); rework s06 to drop Expensify/QuickBooks (VO rewrite + re-synth +
  bespoke "swappable engine" visual); then wire scene-plan → full render → QA against the new rules →
  before/after to owner at Gate ③.

## 2026-06-24 — Layer 1: QA enforcement (anti-slideshow + paid-SaaS) + gate layout fix
- who: agent (owner directed)
- did: Encoded the quality rules as HARD QA checks in `pipeline/05-qa/lib/check-lib.mjs` so a
  slideshow/paid-SaaS cut fails the build, not just review: **`no_paid_saas`** (scans captions +
  scene props vs `PAID_SAAS_DENYLIST`, allows `brief.approved_tools`), **`no_adjacent_repeat`** (no
  identical scene kind back-to-back; bespoke scenes keyed by component/hero), and on real-length
  videos (≥5 scenes) **`bespoke_ratio`** (≥ `custom_ratio_min`) + **`template_repeat`** (no gallery
  template > `max_same_template`=3). `check.mjs` passes `approved_tools`. qa-video skill documents
  them. The OLD 008 (5× term-highlight, 0 bespoke, Expensify/QuickBooks) would now FAIL the build.
  Began the bespoke phase: **redesigned `bad-row-gate`** so the gate bar can't bisect the row — the
  row is now compact + seated in the left third, gate at 47% (right of it), clean table further
  right; travel nudges the row to the gate (item 5).
- verify: `npm test` **508 green** (6 new QA tests). **NOTE:** the different-model verifier for the
  QA-enforcement unit was INTERRUPTED (session limit / classifier unavailable) and did NOT complete —
  **re-verify pending**. The `bad-row-gate` fix WAS render-verified: rendered the scene with the real
  008 values ("Marlow Street Market … total ??.??") and inspected frames at 7s/9s — the row now sits
  fully left of the gate, no bisecting; flag stamp clears the gate. (item 5 ✓)
- next: re-run the QA-enforcement verifier; author the new kinetic 008 hook (rework per owner);
  render hook+gate look-test for owner; then author the remaining bespoke scenes → full render → QA.

## 2026-06-24 — Layer 0: content-value gate (unified review idea-pass) + lanes broadened
- who: agent (owner directed)
- did: Added the *worth-making* gate the system lacked. Made the existing multi-model review
  **stage-parametric** (`pipeline/shared/review/rubric.mjs` `STAGE_RUBRICS`, `panel.mjs`
  stage-aware gates + `resolvePanelCfg`/`ideaGateDecision`/`reviewIdea`) and added an **`idea`
  stage** — same panel, one rubric, no parallel rulebook; the **script stage stays byte-identical**.
  The idea-pass scores a topic (value / reusable-takeaway / packaging / audience-fit; gates:
  value-type + takeaway + on-brand) and bands it: **≥9.0 qualify (auto) · 7.5–9.0 owner · <7.5
  reject**. Schemas carry `value_type`/`takeaway`/`lane`/`value_score`/`value_band`/`approved_tools`
  (`brief`+`ideas`); `review.schema` allOf enforces per-stage keys; `config` adds the idea
  `stage_override` (9.0/7.5). `pick-next` skips `value_band:"reject"` + a **variety soft-cap**
  (`recentFromBank`/`extendsRun` — no >2 same lane/archetype/tool in a row, never hard-blocks).
  Broadened lanes in `style/CHANNEL.md` (added AI How-To / Tool Review / AI News); Gate 1 is now the
  scored gate in WORKFLOW + CLAUDE + the [[gate1-autoproceed]] memory; script-writing/script-review
  skills carry + verify the takeaway. Reframed `MOTION_SPEC.md` §1 ("meaningful progression, not
  tic-motion"; code check is a floor). Owner decisions: bespoke-first, broaden lanes now, soft
  declare gate with a <75% reject floor, named-tools = no paid SaaS unless approved.
- verify: different-model verifier = **Sonnet 4.6** → **PASS**, no bugs (noted my required-gates
  change also fixed a latent partial-hard-gate pass); added 23 regression tests. `npm test` **502 green**.
- next: Layer 1 QA enforcement in code (paid-SaaS denylist, custom-ratio, no-repeat-template,
  capture-silence) → redesign `bad-row-gate` (item 5) → re-author 008 bespoke (items 1,4,6,7,8,9)
  → render → QA → Gate ③.

## 2026-06-24 — Bespoke-first pivot + first two render fixes (008 rejected, root-caused)
- who: agent (owner directed)
- did: Owner rejected the 008 render as another "template slideshow" and called the root cause:
  the render system is a fixed gallery (14 Remotion templates + ~12 prebuilt customs + 6 HF heroes)
  whose only lever is filling props, so every video is the same deck with new words. **Decisions
  (owner):** (1) **bespoke-first authoring** — HyperFrames becomes the default scene surface,
  Remotion is the assembler (timeline, narration, captions, intro/outro, capture zoom); (2)
  **re-author 008 fresh** as the proof; (3) **named tools:** free/generic OK, never paid SaaS
  (Expensify/QuickBooks) unless owner-approved. Plan in `.claude/plans/uzas-…`. Ran a craft-research
  pass (pacing/transitions/kinetic-type/icons) → to become `style/MOTION_SPEC.md`. Shipped the two
  unambiguous code fixes: **(item 3)** monotonic reveal clamp in `lib/timeline.mjs` (008 flow nodes
  revealed out of order when a downstream cue word was spoken before an upstream one); **(item 2)**
  strip capture audio at ingest in `compile-remotion.mjs` (`stripAudioCommand`/`copyCaptureSilent`
  via vendored ffmpeg `-an -c:v copy`, raw-copy fallback + loud warning) so screen-recording audio
  can't leak into the final video.
- verify: different-model verifier = **Sonnet 4.6** → **PASS**, no bugs; added 3 regression tests
  (equal-time reveals unchanged, single-element untouched, all captures stripped). `npm test`
  **464 green**.
- next: distill `MOTION_SPEC.md` + wire format knobs; encode QA rules (paid-SaaS denylist,
  custom-ratio, no-repeat-template, capture-silence); redesign `bad-row-gate` (item 5); re-author
  008 bespoke (items 1,4,6,7,8,9); render → QA → owner Gate ③.

## 2026-06-14 — 008 "Stop Retyping Receipts" started (Desk Fixes mini-demo) — through Gate ② + capture assets
- who: agent (owner gated)
- did: Picked next video via research (owner chose a Desk Fixes mini-demo on "messy PDF/receipt →
  clean sheet" — idea `expense-receipt-to-sheet`, 83). Scaffolded `content/008-receipt-to-spreadsheet`,
  wrote brief + 15-scene script (angle: "AI removes the typing, not the responsibility — it lies on
  the total"). Fact-check (draft): 3 verified, 1 corrected (IRS accepts legible digital copies →
  fixed the s11 "keep paper" line). script-review PASS. **Owner APPROVED at Gate ②**; generated SEO
  (publish.json) + medium.md at approval. Built the capture assets: a synthetic-receipt generator
  (`gen-receipts.mjs` → 8 fake receipts + answer key), the tested parse/flag core
  (`receipt-parse.mjs`), the deployable Apps Script give-away (`receipt-to-sheet.gs`), and
  `captures/plan.md`. The s07 "catch" is made REAL (not staged) by printing+creasing+photographing
  the faint-total receipt so OCR genuinely flags it.
- verify: different-model verifier = **Sonnet 4.6** → PASS, no behavioral bugs (2 cosmetic .gs-mirror
  notes, benign), added 11 regression tests. Captures suite 32/32; full repo `npm test` **457 green**.
- next: **owner records 3 OBS clips** (cap-extract-one, cap-catch-error, cap-scale-it) per
  `captures/plan.md` → then voice → render → QA → Gate ③ → draft upload. (Mini-demo capture is the
  one owner-blocking step.)

## 2026-06-14 — 007 "Rise & Fall of Fable 5" shipped (long + 2 shorts, private drafts)
- who: agent (owner gated)
- did: Produced video 007 (Desk Notes) on the Claude Fable 5 launch→shutdown story surfaced by our
  own news-watch. Long (218s) + a 2-part Short series (Rise/Fall). Fixed stale `facts.json`
  (Fable 5 marked suspended). First cut was rejected at Gate ③ (template "slideshow" + a flawed
  "use a worse model" message), so I **authored 3 new bespoke HyperFrames hero scenes** —
  `orb-risefall` (rise/fall/full), `benchmark-bars`, `killswitch` (under
  `templates/hyperframes/scenes/`) — rebuilt all three videos hero-driven, and **reframed the
  takeaway** to "use any model, keep a fallback" (see [[sensible-takeaway-not-preachy]]). Composited
  the owner's thumbnail (FABLE 5 gold). Uploaded all three as PRIVATE drafts; cross-linked captions.
- artifacts: long https://youtu.be/ppuPa2kSOdk · rise https://youtu.be/9eNMhvKqRa4 ·
  fall https://youtu.be/v8ZJFXf6Fvo (all private). `npm test` 457 green.
- next: owner sets "Altered content = Yes" + publishes; post Community + Medium; watch reach on the
  Short series. Owner wants MORE bespoke hero animations on every future video.

## Where the system stands (2026-06-12)

**The hands-off studio is built and wired end-to-end** (`npm test` = 456 green). The pipeline runs
`00-ideas → 01-script → 02-voice → 03-visuals → 04-render → 05-qa → 06-publish`, idempotent and
resumable, one folder per video.

Shipped (all built behind ports, different-model verified):
- **v1 (Waves 0–2) + orchestrator** — resumable DAG, multi-model review loop (Sonnet sub-agent +
  Gemini, loop to ≥9, fails-closed), publish path (auto-metadata, make-short, −16 LUFS, OAuth +
  private YouTube upload).
- **Wave V** — modular FORMAT recipe (`formats/default.json`), real motion vocabulary, strong-hook
  enforcement, deterministic QA gate, the engine-agnostic `timeline.json` seam, and the
  Remotion + HyperFrames **combo** (1–3 hero scenes/video).
- **Waves 3–5** — anti-stale facts cache + multi-source news watch; `TtsProvider` + `Distributor`
  seams; the analytics → re-rank growth loop; the autonomous driver (`pick-next` → `auto-run` →
  classify) with gate-aware owner notifications; **YouTube OAuth live** (Production app, non-expiring
  token) and a **weekly CronCreate** autonomous run. Methods: `docs/ARCHITECTURE.md` §12.

**Owner does only:** the script gate, the final-video gate, and the thumbnail pick. The system
auto-drafts to YouTube **private** and pings the owner at the gates.

**Open follow-ups** (none block the first hands-off video) are tracked in `docs/ROADMAP.md`:
hero recolor (brand black/yellow), live Postiz (T5.3), thumbnail auto-scoring (T5.4), official-source
RSS endpoints, and re-registering the weekly run (session-local, expires after 7 days).

**Next:** produce the first full video — `005-bulk-personalized-emails` is scaffolded and scripted,
parked at the review hand-off (it will pause for the owner to record the Gmail screen capture).

<!-- New per-session entries below this line, newest on top. -->

## 2026-06-13 — FIRST VIDEO SHIPPED (006 uploaded as private draft)
- who: agent
- did: Took 006 through finalization. Swapped the voice to the **Azure final** (licensed Andrew) on
  long + Short, re-aligned + re-rendered (same approved visuals), QA 5/5. Generated the publish package
  (owner-edited 3–4 sentence long description + Short cross-post caption, 15 chapters, pinned validator
  prompt, `medium.md` 633-word AI-citation post). Thumbnail = the Sarah-scene still (owner's pick over the
  AI images, which had gibberish text + a watermark). **Uploaded both as PRIVATE drafts** via the
  YouTubePublisher port (OAuth live) — long + Short, with the long URL auto-filled into the Short caption.
- next: owner clicks Publish (after setting "Altered content = Yes" + pinning the comment in Studio).
  The end-to-end hands-off pipeline is proven on a real upload. Next idea: "gate a form" (006's CTA).
- note: this completes the **"first full video"** open item from the build-status memory.

## 2026-06-13 — Visual upgrade wave (owner feedback on 006) + re-render
- who: agent
- did: Acted on the owner's review of 006. Shipped, behind the build-sprint cycle (457 tests green;
  **different-model verify = Sonnet, verdict PASS, no blocking bugs**):
  1. **`hook-prism` re-skin** — removed the prism/glass shards (Three.js), kept the aurora plasma +
     particle tunnel, recolored to brand **black+gold** (`#ffb020`). Now the go-to bold opener.
  2. **`bad-row-gate`** — a NEW cinematic HyperFrames scene (GSAP): one bad row (Sarah, `31/02/2026`)
     slides to the gate, is rejected with an "Invalid date" stamp, drops into quarantine while the clean
     table stays pristine. The owner-requested concrete mini-example.
  3. **Cinematic intro/outro** — `Intro`/`Outro` rebuilt with the gold desk mark over a gold
     `BrandBackdrop` aurora (deterministic drifting blobs/particles). Black+gold; gold-mark baked in.
  4. **`CodeBlock` fix** — line-number gutter no longer shrinks on long lines (`flex:0 0 36px`); added
     `showLineNumbers`/`fontSize` props (Short drops numbers, per owner rule "no line numbers when code
     wraps").
  5. **`timeline.mjs`** — `revealOn:"sentences"` now generates per-sentence reveals for list-less scenes
     (so the HF Sarah scene syncs its 5 motion beats to its 5 narration sentences) + a regression test.
  Then re-wired 006 (s01→`hook-prism`; inserted `s07b` Sarah between s07/s08), re-voiced + re-aligned
  (75 sentences, 313s), re-rendered long (5:13, 52 MB) + Short (47.7s), QA 5/5 both, perceptual frames
  verified (gold intro, gold aurora hook, Sarah scene, aligned code-block, gold outro).
- next: owner **GATE ③** on the re-rendered `content/006-validated-cleanup-system/video/final.mp4`.
- docs: `style/VISUAL_IDENTITY.md` §7 (palette split + gold mark baked), `docs/ROADMAP.md` (hero-recolor
  marked DONE), `.claude/skills/storyboard/SKILL.md` (hero list updated).

## 2026-06-13 — First full autonomous video produced end-to-end (006)
- who: agent
- did: Ran the whole new pipeline on `006-validated-cleanup-system` (Diagram / "Desk Loops",
  the sequel 004 teased). Picked the top *producible-hands-off* idea (score 84; the literal
  top, 005 bulk-emails @88, is a mini-demo blocked on an owner screen-capture). Script (21
  scenes) → fact-check (1-10-100 rule verified, Labovitz & Chang 1992, on-screen source) →
  **independent multi-model review loop** (Gemini live + Sonnet subagent, 3 iterations →
  Gemini 9.65 / Sonnet 9.00, band "soft", gates ✓) → Andrew voice (edge-tts) + faster-whisper
  align (290s, 70/70) → storyboard (combo engine, HyperFrames `hook-kinetic` hero) →
  hand-authored 50s Short → combo render (long 4:54 1080p, short 47.7s 9:16) → QA gate 5/5 on
  both + perceptual frame review. 2 thumbnail prompts written (owner generates).
- next: **owner GATE ③** — watch `content/006-validated-cleanup-system/video/final.mp4`,
  approve, pick a thumbnail. Then publish (not done — never upload/commit without the owner).
- blockers: none. (Combo engine, multi-model review, voice/align, render, QA all worked first
  full run.)
