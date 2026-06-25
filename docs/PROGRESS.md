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
