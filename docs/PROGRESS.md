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

## 2026-07-17 — HF `_lib/` extraction — Phase 3 of the D-060 plan
- who: agent (owner: "implement phase 3 from <D-060 plan>")
- did: Shipped `templates/hyperframes/_lib/` and migrated all 60 scenes onto it. **(1)** One vendored
  `gsap.min.js` replaces 60 byte-identical copies (4.3 MB → 72 KB). **(2)** `hf-scene.js` owns the whole
  variables contract (`readVars`, fps/W/H/FRAMES/D, `props`/`beats`, `data-duration` write, portrait class,
  `--u`, `cl`/`beatAt`, `HF.register`); each scene's ~21-line preamble → `var S = HF.scene({…})` + aliases
  (net **−1519 lines**). A codemod did the migration line-by-line, keeping bespoke code (e.g. `orb-risefall`'s
  `sortBeats:false`, the 12 scenes with custom `beatAt` clamps). **(3)** Render guard `detectDeadRender` in
  `compile-hyperframes.mjs`: a scene whose JS dies (404'd asset → `gsap is not defined` → no timeline) still
  exits 0 with a valid frozen mp4 — the guard scans the render log, deletes the poisoned clip, and throws.
- verified: `../../_lib/…` is the load-bearing path (HF file server roots at the scene dir; the CLI compiler
  copies the outside-project asset in — `../_lib` 404s silently). Built a decoded-pixel equivalence harness
  (software rasterizer `--no-browser-gpu -w 1` is bit-stable; GPU + mp4 container are not). All 60 scenes:
  **bit-identical to git original or within their own GPU-noise floor**; the lone outlier (`killswitch`, ~60 dB)
  is a sub-visual rasterization artifact with the timeline math proven byte-identical. **Zero real defects.**
  `npm test` green (618). Note: HF renders are NOT reproducible under CPU contention — parallel renders can't
  be hash-compared (this cost several false positives before I isolated it).
- next: nothing for Phase 3. New scenes (018+) author against `_lib` (see storyboard + video-render skills).
- blockers: none.

## 2026-07-16 — Concept KB (`concepts/`) — Phase 2 of the D-060 plan
- who: agent (owner: "implement phase 2 from <D-060 plan>")
- did: Shipped `knowledge/desk-knowledge/concepts/` — the **visual vocabulary**: 7 concept notes +
  an index, built **bottom-up from the 60 authored scenes** in `templates/hyperframes/scenes/` (the
  plan's instruction: trust the scenes, not the docs — the docs lag). Source of truth was each scene's
  own header comment, which records its premise, video/scene, palette and — crucially — its **owner
  rejections**. Notes: [human-gate](../knowledge/desk-knowledge/concepts/human-gate.md) (10 scenes),
  [verdict-stamp](../knowledge/desk-knowledge/concepts/verdict-stamp.md) (11),
  [agent](../knowledge/desk-knowledge/concepts/agent.md) (8),
  [overload-pile](../knowledge/desk-knowledge/concepts/overload-pile.md) (8),
  [spreadsheet](../knowledge/desk-knowledge/concepts/spreadsheet.md) (7),
  [source-document](../knowledge/desk-knowledge/concepts/source-document.md) (11),
  [failure](../knowledge/desk-knowledge/concepts/failure.md) (8). Each = metaphors used (per scene +
  video) · what landed · what the **owner** rejected (dated) · recurring elements · colors ·
  proportions · what to avoid.
  **Bottom-up corrected 3 of the 7 planned names:** `approval` → **`verdict-stamp`** (the stamp is the
  reused element; approval is one of its verdicts), `inbox` → **`overload-pile`** (the subject is
  volume-as-a-problem; inbox is one skin), `invoice` → **`source-document`** (the object is the flat
  page — receipt/email/ToS/filing). `agent`/`human-gate`/`spreadsheet`/`failure` kept as planned.
  **Verified substrate** rather than asserting it: gold `#FFB020` in **59/60** scenes, `--u` in
  **60/60**, `--blue: #4F8CFF` in 23, red `#ff5c5c` in 32, green `#22D3A7` in 15, the 19.5% caption
  band in 40 — catalogued **once** in the index so no note repeats it.
  **Wired in:** MOTION_SPEC §0 now sends the author to the relevant concept note first, explicitly as
  a **vocabulary INPUT, never a selector** (reaching for a note as a template is the exact §0 failure);
  global `index.md` + `PROJECT.md` updated (`concepts/` now live alongside `lessons/`/`research/`).
  Also fixed MOTION_SPEC's **6 dangling `[[wikilinks]]`** → relative links (KOS rule 5); the plan said
  5. Remaining wikilinks in PROGRESS/CHANNEL/superpowers-plans are out of this scope.
  Phase 2b (make the KB live: `render → owner Gate-2 verdict → KB update`) and Phase 3 (HF `_lib/`)
  stay parked in ROADMAP.
- next: Owner review. Phase 2b is what makes this pay off — today the KB is a one-time write and only
  the owner's reject is signal (never the agent's self-review).
- blockers: none. `knowledge-lint` clean (0 errors/0 warnings, 26 files); `npm test` 614/614 green.

## 2026-07-16 — D-060: the scene boundary honors the authored transition (default: hard cut)
- who: agent (owner: "implement phase 1 from <D-060 plan>")
- did: Shipped the D-060 plan (its "Phase 1"; Phases 2/3 were explicitly deferred → parked in ROADMAP).
  **The problem:** the agent already wrote real art direction per scene and the renderer destroyed the
  part that crossed a boundary — 017's `props.note` carried "Match-cut the doc into s3" / "Push into s4" /
  "Carry the gold YOU node into s5", **no renderer reads `props.note`**, and `Main.tsx` wrapped every
  scene in an unconditional 9-frame crossfade that also *pre-rolled* it, ghosting the previous scene into
  every line of narration. MOTION_SPEC §3 already said "default to a hard cut".
  **Built:** new pure `pipeline/04-render/lib/transitions.mjs` (`TRANSITION_STYLES`, `BLENDED`,
  `overlapFrames`, `sceneWindow`) — now the **ONE** copy of the window math, which had three consumers and
  only two ever compared (`04b-thumbnails`' `hfClipLocalSeconds` was an untested hand-mirror that fails
  *silently*; the third parity leg is now tested). Schemas gained `transitionOut` (scene + beat, default
  `cut`; `match`/`morph`/`carry` are authorial and compile to a cut) and `direction` (`{premise*, palette,
  carry}`), deliberately kept off the render side of the cache boundary. `SceneWrapper` takes
  `fadeIn`/`fadeOut` and **bypasses `interpolate` on a 0-fade** (the black-flash trap). `build-props` warns
  when the last scene's `transitionOut` is ignored (it blends with the outro bumper).
  **Verified:** `npm test` **614 green** (+ new `transitions.test.mjs`; acceptance = every window starts
  AND ends on its alignment mark; a cache-boundary test that fails loudly if `direction` ever moves to the
  render side); `tsc --noEmit` clean; **real render** of a scratch copy of the 017 Short — all 5 windows
  abut exactly on their marks, and a `fadeIn:9` probe frame proved the cut path renders at full opacity
  (no black flash). Golden regenerated and audited to exactly the predicted diff (s2/s3 `from +9`/`dur −9`,
  reveals `[2,77,167]→[0,68,158]`, ends `210/450/645` and all captions/motion/audio byte-identical).
- next: **owner review.** Nothing retroactive — this serves 018 onward; 001–017 keep `props.note` as an
  ignored prop (it stays a **live rendered string** on 008 s06, so it was not touched). Two owner calls:
  (1) delete dead `motion.transition` config? (2) 017's HF scenes were authored against a crossfade and
  open on an empty frame — under a cut that is now visible; the fix is authorial (compose the opening
  frame to already show the first element), taught in the `storyboard` skill.

## 2026-07-15 — 017 Short produced end-to-end: voice → 5 bespoke HF scenes → render → QA PASS → at Gate ③
- who: agent (owner: "Start producing 017 shorts video")
- did: Took the Gate-②-approved **017 fine-print-watch Short** through the full production chain.
  **Voice** — draft edge-tts (Andrew, −2%) + faster-whisper alignment: 21 sentences, 244 words,
  **90.6s** (the approved words read ~90s, not the 55s target — surfaced as an owner flag, not trimmed).
  **Storyboard** — hand-authored `short/scene-plan.json` (014 shorts-only pattern) + **5 NEW bespoke
  HF scenes** (`fp-ping-flip`, `fp-noise-pile`, `fp-decision-card`, `fp-kept-judgment`, `fp-flip-close`)
  built to the script's approved notes (MOTION_SPEC craft: seek-safe proxy counters, flat/face-on cards,
  transient-only 3D, reserved-space brand/CTA). **Render** — compile-hyperframes (5 clips) → build-props
  ×2 → Remotion → `short/video/final.mp4` (93.0s, 1080×1920, 25.2 MB). **Perceptual check on 26 stills**
  caught one reserved-space violation (s4 handover card crossed dimmed actions-row text) — fixed in
  scene JS, s4 re-rendered. **QA** — `check.mjs` 10/10 green + digest in `qa.report.json`; `npm test`
  594 green. **Publish pack** — publish.json/md + medium.md + inline publish review PASS 9.0
  (016 bridge kept as `<LONG_URL>` placeholder). `brief.status: qa_passed`.
- next: **GATE ③ — owner watches `content/017-fine-print-watch/short/video/final.mp4`.** Owner calls:
  (1) ship at 90.6s or trim+re-voice; (2) Azure final voice vs ship edge-tts (012 precedent);
  (3) thumbnail frame pick from final.mp4. Then manual upload (D-055). 016 render still blocked on
  the owner's n8n-canvas screenshot.
- blockers: none for 017 (waiting on the owner gate).

## 2026-07-15 — D-059 Phases 3–5: owner approved 016 → shipped the idea-guard (subject map + seed-gate), retired 015
- who: agent (owner: "Rework 016 approved. Kreni dalje sa implementacijom" → the plan's code/docs, not render)
- did: Owner **approved the reworked 016 script** (Gate ②). Then built the plan's remaining implementation
  (Phases 3–5 of the AI-agent-series tracker), the "smallest thing that stops the next 015":
  **Phase 3 (map)** — `docs/CHANNEL_MAP.md`: subject taxonomy (root *AI Decision Automation*; 4 branches
  attention/change-detection/failure-detection/execution) with 011 & 016 → attention/inbox, 017 →
  change-detection/policy, 015 struck through; cross-linked from `style/CHANNEL.md` §3.
  **Phase 4 (guard)** — optional `subject` (+`series`) in `ideas.schema.json`;
  `pipeline/00-ideas/produced_subjects.json` (machine mirror); **subject-collision warning** in
  `pick-next.mjs` (`subjectCollision`, surfaced in `--dry-run` + the real pick, never blocks); **seed-gate**
  `pipeline/00-ideas/seed-gate.mjs` (`seedGate` + CLI) — a brief can't be scripted without an idea-pass
  `value_band` (and not `rejected`), wired as script-writing **Step 0.0**. **Retired 015** —
  `everyone-asks-ai-series` reverted backlog + inbox seed dropped; `content/015-*/brief.json` →
  `status: rejected` (brief.schema gained `rejected`) + retired_note/subject; folder left on disk (principle 6).
  **Phase 5 (cleanup)** — 8 new unit tests (subjectCollision null-safety, seedGate absent/reject/retired),
  KOS lesson `2026-07-15-subject-map-stops-near-duplicates`, `knowledge-lint --fix` clean, docs cross-links.
  Verified: `npm test` **594 green**; schema PASS on ideas.json + 015 brief; collision guard fires on
  attention/inbox against the real registry.
- next: **content production** (separate from plan code): 017 (unblocked) & 016 → voice → storyboard →
  render → QA → Gate ③. 016 s3 still needs the owner's real n8n-canvas screenshot.
- blockers: 016 render blocked on the n8n-canvas screenshot; 017 fully unblocked.

## 2026-07-15 — D-059 Phase 2: reworked 016 (n8n inbox) as "The AI Agent" Ep.2, at the script gate
- who: agent (owner approved 017 → "Nastavi sa implementacijom" the AI-agent-series launch)
- did: Owner **approved the 017 Short** (Gate ②) — unblocked Phase 2. Reworked **016** per D-059 point 5 into
  the series' **human-approval / failure-handling installment** (touched `content/016/{brief.json, script.json,
  script.review.json}` only). Removed the 015 dependency (brief.angle + old s2 rewritten; no 015 ref remains).
  **Restructured** to failure → why plain automation fails → how the agent thinks → safe design: opens on the
  fear (a bot silently trashes the email that mattered), reframes to "automate the DECIDING, not the DOING,"
  keeps the real-template teardown but **collapsed the node-by-node middle 5 scenes → 2** (one reasoning beat +
  one visible dry-run); **13 scenes → 10**. Foregrounded the guardrails: fragile classifier (recoverable because
  label-only), the auto-trash "line you don't cross" + an explicit human gate, two smaller guardrail catches.
  Kept the copy-paste template CTA + on-screen sources (4876/14852, CE-free). Tagged `subject: "attention/inbox"`,
  moved `series` Desk Loops → **"The AI Agent"** with the shared series signature in the outro to match 017.
  Facts unchanged from the prior verified pass (sources.md still valid). Validator PASS; **script-review PASS**
  (asset deps s3 real-canvas / s7 14852 chip; minor pacing; series-change flagged for owner).
  **Owner notes round 1 (same day):** (a) s4/s5 reframed off the node-tour into a universal safe-agent pipeline
  Input→Context→Decision→Output, punch = what's MISSING ("no delete node, no reply node"); (b) s7 now attacks the
  evergreen PATTERN (AI guess wired to an irreversible action), not a specific public template (14852 = one example).
- next: **owner Gate ②** on the reworked 016 script → approve or send notes. On approval: voice → storyboard
  (grab the real n8n canvas for s3) → render → QA → Gate ③. Then D-059 Phase 3 (Channel Map) + Phase 4 (idea guard).
- blockers: 016 s3 needs the real n8n-canvas screenshot at the asset step; series-tag change is revertible.

## 2026-07-14 (round 2) — Phase 2 content: 015 Short + 016 n8n long, both at the script gate
- who: agent (Phase 2 of the 014-analytics plan; owner: "both #4 and #5 to their gates")
- did: Two scripts produced on the new Phase-1 system, each stopping at **Gate ② (script approval)**.
  **015** — standalone everyone-asks-ai Short ("write emails → find the ones I shouldn't answer"):
  5 bespoke scenes, purpose-built 3s hook, visible-proof sort beat, `closing_question`, bridge → 016.
  **016** — n8n inbox-triage teardown (diagram/long+short): built on a REAL citable template
  (n8n workflow 4876, node names verified via the template API; free/self-host verified), label-only
  safety spine, one synthetic email dry-run through the graph, fragile-classifier + auto-trash failure
  modes, copy-paste template in desc/pin. Dogfoods Phase 1: 015 hook gate, 016 `short_hook`-derived
  Short, both bridges + closing questions. Idea-bank: `everyone-asks-ai-series` → in-progress + new
  `n8n-inbox-triage-teardown` → 016. Per-video detail in each `content/<id>/log.md`.
- next: **owner Gate ②** on both scripts. On approval: voice → storyboard (grab the real n8n canvas
  asset for 016 s3) → render → QA → Gate ③.
- blockers: 016 s3/s10 need real n8n-canvas screenshots at the asset step.

## 2026-07-14 — Phase 1 system upgrades: Short hook + Short→Long bridge + unified CTA-question (D-058)
- who: agent (owner: "Pocni da implementiras insights-actionable-steps plan")
- did: Shipped the three Tier-S reusable upgrades from the analytics plan (each improves every future
  video), build-sprint cycle, `npm test` **582 green** (+10).
  **(1) Separate Short hook generator** — new `script.short_hook` (own cold-open narration +
  `on_screen_text` punch, optional `hook-*` `component`); `make-short.mjs` now PREPENDS it as the
  Short's s1 and DROPS the inherited long hook (id-parity with the derived scene-plan preserved). QA
  hook gate is Short-aware: the vertical cut must land a hook-class beat in the first
  `hook.visual_detail.short_first_seconds` (default **3s**) vs the long-form 30s
  (`check-lib.mjs` + `build-props.mjs` warn). One-continuous-audio respected (voiced in the Short's own
  TTS pass, never spliced).
  **(2) Short→Long bridge** — `build-metadata.buildBridge` assembles `publish.bridge` (related_long_id,
  `<LONG_URL>`, short_caption, pinned_comment, template_link, end_screen_target) + a **manual_checklist**
  rendered as checkboxes in `publish.md` (D-055: we build the package; the owner clicks the native
  link/end-screen UI). Inputs from `brief.bridge`; distributor cross-post now prefers the bridge caption.
  **(3) Unified CTA-question → pinned comment** — `script.closing_question` (one topical question) seeds
  `build-metadata.buildPinnedComment` → `publish.pinned_comment` (authored `script.pinned_comment` wins),
  mirrored into the bridge. STYLE_GUIDE §9 reconciled: one topical question is allowed, not begging;
  subscribe stays singular. script-review told not to flag it.
  Gate-1 threshold (`gate1.min_score`) was already config-driven (`config.review.panel` idea override,
  9.0/7.5) — no literal to factor out; documented, no code change.
- next: Phase 2 content — Short #4 (everyone-asks-ai: "emails I shouldn't answer") + Long #5 (n8n inbox
  triage), both on the new system, through the owner gates.
- blockers: none.

## 2026-07-12 (round 4) — 013 Short SEO/publish pack (owner: skip re-align)
- who: agent (owner: "Preskoci re align i daj mi SEO/Publish pack za 013 short video")
- did: Built the publish package on the QA-passed Short (`brief.status: qa_passed`) — re-align
  skipped per owner (not needed: Shorts have no chapters, the only alignment consumer). Wrote
  `publish.json` (3 title options led by **"Never Trust the Green Checkmark"**, ≤3-sentence
  answer-first description with the `automation error handling` search term, 14 tags, Short
  caption + `<LONG_URL>`→012 cross-link, community post w/ `<SHORT_URL>`, loud-stop pinned
  comment, Medium title), `medium.md` (AI-citation format on the transcript), and `publish.md`
  (Studio copy-paste, via `build-metadata.mjs --md-only`). **Publish-stage review panel** (single
  Sonnet, D-053): iter 0 = 8.75 → 2 minor wording fixes (title 2 de-quoted; retry cadence hedged
  as illustrative; "silent failure" keyword added) → **iter 1 = 9.0, all 3 hard gates pass**
  (accuracy / no_overpromise / disclosure_set) → soft band, owner gate. Review saved to
  `content/013-fail-loud/publish.review.json`. Per-video files are gitignored (by design).
- next: **owner picks a title + uploads MANUALLY (D-055)**, sets Altered content = Yes. If title
  option 2/3 is chosen, sync `short.title` + community post. Reminder: script was reworked after
  render — a re-voice/re-align/re-render is still pending before the true final if VO must match.

## 2026-07-12 — 013 verdict: story too small → idea-first doctrine + card-angle rule + script rework
- who: human (verdict + endorsed a second-model review "95%") + agent (fixes, doctrine, rework)
- did: **(1) Visual fix** — 013 s3 `incident-503` dutch-angle terminal (rotY −12°/rotX 3°) rejected:
  card was skewed and climbing over the "503" headline. Removed ALL 3D tilt (cards now flat,
  face-on, resting below the text), regenerated the render entry, verified with 3 extracted stills.
  New canonical rule **MOTION_SPEC §5 "Card & panel angles"**: no persistent rotateX/rotateY on
  content cards; 3D only as transient reveals — flip-reveal (approved) + **stacked-deck reveal**
  (owner wants more); floors exempt. Lesson: `knowledge/.../2026-07-12-no-3d-tilt-on-content-cards.md`.
  **(2) Idea-first doctrine** (the big one): a well-written script can't save a weak story — "my
  pipeline retries and halts" is an implementation practice, not an idea. Added **`transformation`**
  scored category (weight 0.20) to the idea-pass rubric + STRANGER TEST in the `takeaway_present`
  gate (`rubric.mjs`, `review.schema.json`, `config.json`, tests — 564/564 green); added **Step 0.5
  STORY TEST** (5 questions: transformation, symptom→philosophy, stranger, transferable framework,
  conflict) to `script-writing`. Lesson: `2026-07-12-story-strength-scored-at-the-idea.md`.
  **(3) 013 script reworked** (v1 backed up as `script.v1-failloud.json`): reframed from "fail loud"
  feature-story to **"the dangerous automation isn't the one that fails — it's the one that keeps
  going"** — new s2 `green-lie` (stacked-deck: ✓ on top, ✗ underneath, the viewer's OWN invoice
  bot), s3 = Pipeline A vs B contrast (564-counter dropped), 503 demoted to the s4 receipt, s5 locks
  "will it tell me?". Panel (Sonnet, 3 iterations): 8.0, ALL hard gates green ×3; loop cap →
  owner gate. Review: `content/013-fail-loud/short/script.review.json`.
- next: **owner reads the reworked script (Gate 2)**; on approval → re-voice → re-align → re-prop
  scenes (new s2; silent-vs-loud without stat) → re-render → QA. Recommendation on the table:
  insert one practical viewer-facing video before publishing 013 (no two studio-videos back to back).

## 2026-07-12 (round 2) — owner endorses the reframe (80–90% fixed), gives 4 craft line-edits
- who: human (line edits) + agent (applied + made them canon)
- did: Owner approved the symptom→philosophy reframe and asked for 4 sharper moves, all applied to
  013 + written into STYLE_GUIDE so they hold for every future script:
  **(1) Thesis-first hook** — s1 now opens on the reversal ("The most dangerous automation isn't
  the one that crashes. It's the one that keeps going.") THEN "Mine crashed last month" as the
  transition; curiosity gap on line one, no predictable "my thing broke → best thing ever" setup
  (STYLE_GUIDE §5). **(2) Viewer's language** — s3 drops "Pipeline A/B" for "silent vs loud / one
  fails and keeps publishing" (§5 + §9 blacklist). **(3) Symbol on screen, plain voice** — s4 VO
  says "the review model went down / waiting longer each time"; the 503 + doubling bars stay
  on-screen only, never spoken as "five-oh-three" (§5 + §9). **(4) Symbol-forward title** —
  "Never Trust the Green Checkmark" (the green check is the villain) replaces the abstract title;
  `brief.title_options` carries 3 (§8). New auto-memory `hook-and-voice-craft`; KOS lesson extended.
  Script + brief re-validate PASS.
- next: **owner reads round-2 script (Gate 2)** → on approval, voice/align/prop/render/QA as above.

## 2026-07-12 (round 3) — 013 Short rendered end to end (owner approved the script) → Gate 3
- who: agent (owner: "Mnogo mnogo bolje. Nastavi i uradi render full shortsa")
- did: Full Short pipeline on the round-2 script. **Voice** re-synth (edge-tts, 57.2s) + **alignment**
  re-run — small.en whisper collapsed s3's dense middle (~15 words → one timestamp), re-ran with
  **medium.en** (143/144 words) → clean sentence windows. **5 bespoke HF scenes** built/adapted:
  **s1 hook-snap** restructured thesis-first (kinetic reversal up top → crash+shatter on 'Mine
  crashed' → stamp); **s2 green-lie** (NEW scene) — invoice-bot stamps a green ✓ every morning,
  ERROR swallowed, deck FANS AWAY to red ✗ underneath, day burns to 22 'still all green'; **s3
  silent-vs-loud** — dropped the 564 counter + A/B, relabeled SILENT/LOUD, added RETRY chip + gold
  'LOUD' punch; **s4 incident-503** — reused with the 2026-07-12 flat-terminal fix (no 3D tilt);
  **s5 flip-question** — 'WILL IT TELL ME WHEN IT DOESN'T?' + monolith 'THE DANGEROUS ONE / KEEPS
  GOING.' + 'follow for the next test'. Verified every scene via extracted stills, fixed s2 end-dim
  (too dark → DAY 22 now legible). Assembled via Remotion combo (concurrency 1, timeout 120s after a
  frame-734 OffthreadVideo stall) → **final.mp4 59.6s incl. intro/outro, 20.8 MB**. **QA: mechanical
  10/10 + perceptual all-scenes pass**; digest in qa.report.json. brief.status=qa_passed. Tests 564/564.
- next: **owner watches `content/013-fail-loud/short/video/final.mp4` (Gate 3, final)**. Two optional
  tweaks flagged in the QA digest (s3 caption chunk; green-check monolith swap). On approval →
  Azure final voice + re-align + re-render, then SEO/publish pack (manual upload).

## 2026-07-11 — 013 "fail-loud" Short produced fully autonomously (idea → final render, zero owner input)
- who: agent (owner directive: skip all gates except the final video; Short only, ≤58s)
- did: Picked `automation-maintenance-story` (84) as 012's natural sequel; reframed as **fail loud >
  fail silent** on our real 503 incident (D-053) — all claims own-system or sourced (`sources.md`),
  research-first (retry/backoff/alerting best practice). Script 5 scenes/143 words → self-review →
  edge-tts 54.78s → align → **5 NEW bespoke HF scenes**: `hook-snap` (glitch shatter, CSS-3D shards,
  camera punch+shake+dolly, impact flash), `demo-day-lie` (3D camera SWING to the reverse face),
  `incident-503` (dutch-angle terminal, **real Three.js warning beacon**, doubling retry bars,
  smear-stop → gold HALT gate → notification), `silent-vs-loud` (contrast rails + 564 counter with
  source chip), `flip-question` (3D Y-flip, FAIL LOUD > FAIL SILENT monolith ≥4s, brand row in
  reserved space). Own frame-review caught + fixed 4 craft issues (dark shatter, D-054 notification
  overlap, backface ghost text, rail spacing) before assembly. Final: **57.2s** 1080×1920@30,
  QA 10/10 + digest. Files: `content/013-fail-loud/short/video/final.mp4`.
- next: owner watches the Short (FINAL GATE) → verdict drives fixes + whether the long video happens.
  SEO/publish pack after the verdict.

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
