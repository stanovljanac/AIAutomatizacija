---
name: script-writing
description: Use when writing or drafting a video script for The Automation Desk channel — turning an approved brief (brief.json + optional sources.md) into a scene-segmented, template-tagged, high-retention English script (script.json) for one of the four archetypes, with the original human angle baked in. Triggers on "write the script", "draft the video", or Step 1 of the workflow. Do NOT use for reviewing a script (use script-review).
---

# Skill: Script writing

You write the **original English** script for a video as scene-segmented, template-
tagged JSON (`script.json`, schema `pipeline/shared/schemas/script.schema.json`).
Read `style/STYLE_GUIDE.md` first — it is the writing law. This skill produces; it
does not self-approve (that's `script-review`, then the human gate).

## Step 0 — Real-world workflow research (NON-NEGOTIABLE; all archetypes except news & comparison)
Before you script a how-to / ideas / mini-demo / diagram video, research how the process is
**actually done in the real world right now** — do NOT design an automation from imagination.
(We learned this the hard way: an unresearched build hung a recurring job on a free hosted tier
that returned 503s in real use. Research would have caught it.)

Research and write up (in a `research.md` next to the brief, or a `research` block in `brief.json`):
1. **How is this task really done today, and with which tools?** Name the real ones, **including
   competitor firms / models / other tools** (e.g. off-the-shelf apps, no-code platforms, AI agents,
   purpose-built APIs). Use `WebSearch` — this is current-state, not from memory.
2. **Stress-test the weak link for realism + reliability BEFORE building** (free-tier limits/503,
   session caps, accuracy, privacy). If the obvious approach isn't reliable for the real use
   (especially recurring tasks), say so and route around it.
3. **What's the best-practice way to automate this specific process?**
4. Output **a few options + an explicit recommendation.**

Then design so the **WORKFLOW (the process automation) is the focus and the TOOL is modular**:
feature the one we used, but **name alternatives/competitors on-screen** so any viewer can replicate
with their own tool or a substitute. Tools sit to the side and are swappable; the lesson is the
workflow. (Sourced tool/price/model facts still follow rule 9 — verified, not from memory.)

## Step 0.5 — The STORY TEST (before the first sentence; 2026-07-12, the 013 lesson)
A technically well-written script cannot save a weak story — grade the STORY first, and if it
fails, **push back on the brief/angle instead of writing** (route it back to the idea-pass; the
rubric's `transformation` category scores the same thing). The 013 draft passed every craft rule
and still didn't justify a video: "my pipeline retries and halts" is an implementation practice,
not an idea. Test the story on five questions:
1. **Transformation.** Where does the viewer's head START and where does it END? If the hook line
   and the closing line could swap places, nothing transformed — reject the framing. (013: opened
   "fail loud", closed "fail loud". Inbox opened "everyone builds apps", closed "point it at the
   inbox" — that transforms.)
2. **Symptom → philosophy.** The incident/anecdote/feature is only the SYMPTOM. Find the belief
   behind it and lead with that. (Not "a 503 crashed my run" but "the most dangerous automation
   isn't the one that fails — it's the one that keeps going.")
3. **Stranger test.** Why does someone who has never seen this channel and doesn't care about our
   system keep watching? "My pipeline has retries/halt/notifications" is a feature showcase — a
   stranger shrugs "…and?". The story must be about THEIR risk, THEIR workflow, THEIR belief.
4. **Transferable framework.** The takeaway must apply beyond this video's subject — to the
   viewer's invoices, email, agents, code ("Draft → Check → Gate" transfers; "retry on error"
   doesn't). If the lesson only works in our studio, it's a scene inside a bigger video, not a
   video.
5. **Conflict / "wait, what?".** At least one beat must break expectation — a contrast (pipeline A
   shrugs-and-ships vs pipeline B halts-and-tells), a refusal ("the AI could have continued — it
   didn't"), a flipped question. If every beat goes exactly as expected, there is no video.

When a story fails this test, the fix is usually to **climb one level up** (the philosophy above
the incident) and to **build the contrast in** (show the bad world next to the good one), not to
polish sentences.

## Inputs
- `brief.json` — has `archetype`, `angle`, `task`, `tool`, `target_seconds`.
- `sources.md` — facts (Comparisons/stats only; Ideas/Demo may have none).
- **The FORMAT recipe** — `pipeline/shared/formats/default.json` (resolved per brief by
  `pipeline/shared/lib/format.mjs`). It is the **single source of truth** for the production-policy
  knobs that used to be scattered in this file: `hook.target_seconds` (when the hook lands),
  `hook.answer_first_seconds` (the answer-first window), `archetype_structure.<archetype>` (the beat
  skeleton below), and length/pacing. **Honor the recipe's values**; the numbers in the rules below
  are the current defaults from it. The opening must use a **hook-class** scene (`hook-card` or a
  custom `hook-*`) with real motion within `hook.visual_detail.first_seconds` — qa-video enforces this.

## Non-negotiables (from STYLE_GUIDE §2, PRD R4/R8/R9)
1. **Bake in the original human angle** (from `brief.angle`) — surface it in/after the
   hook. No generic info-dump.
1b. **Deliver the promised takeaway.** The idea-pass already set `brief.takeaway` (the ONE reusable
   thing a viewer applies/believes tomorrow) and `brief.value_type`. The script MUST land that
   takeaway clearly — the script-review checks it was delivered, not just implied. Never name a paid
   SaaS product as a tool to use unless it's in `brief.approved_tools` (see [[no-paid-saas-products]]).
1c. **The honest-catch beat never announces itself (owner rule, 2026-07-07).** No "now the honest
   part" / "to be honest" — open the beat directly on the strongest limitation ("It won't ship you
   a startup…"); vary the phrasing per video, never repeat a stock beat-opener across videos
   (STYLE_GUIDE §9 blacklist). Sole kept signature: "Unsexy — that's the point.", `everyone-asks-ai`
   lane only.
2. **Ideas + minimal example**; end with "scale this to your own process." We do not
   build full systems.
3. **Accuracy by archetype:** Comparisons/stats trace to `sources.md`; demos use
   **synthetic data**; pure-conceptual claims are framed as ideas, not tested fact.
4. **One idea per sentence** (sentences are timing units).
5. Hook lands in ≤ 10s; one subtle CTA (subscribe); short branded outro.
6. **Prefer concrete proof, by judgment (not a hard rule).** A real mini-example or a
   specific before→after gives the viewer something tangible instead of pure theory, and
   usually helps — so consider one reasonably early. BUT some topics are carried perfectly
   well by strong narration alone with no example, or work better with a longer intro and
   then an example. Decide per topic; never force an example where it doesn't belong.
7. **Thorough, not short. Length follows the topic.** A video runs exactly as long as its
   topic needs to be covered well — **there is no target length**, and you never pad or cut
   to hit a number. Explain at a calm, detailed pace and err toward more depth; let simple
   topics be short and rich topics be long. The viewer should finish feeling they actually
   learned something. (Owner rule, 2026-06-03.)
8. **Visual variety — don't loop the same templates.** The 12 fixed templates are a
   reliable BASE, not the whole vocabulary. Every video should include some **fresh / bespoke
   scenes** (mark them `template: "custom"`) so videos don't all look identical — build them
   with Remotion + the installed HyperFrames / GSAP / Three / Lottie skills. Mix custom
   beats in with the base templates; never ship a video that is just the gallery on repeat.
   **No scene may be empty or a long static hold** (owner rule 2026-06-07): a long caveat or
   list must split into reveal beats or use a full/animated template — a bare `lower-third`
   held ~20s is a fail. Enforced in `build-props` (warn) + qa-video (HARD).
9. **Answer-first + specific facts (D-026).** Answer the topic's core question in the **first
   30–60 seconds** (AI overviews weight the opening most), then the hook, then the deeper
   build. Use **specific names, dates, numbers, places** — "26,000 workers in Malaysia were
   laid off in 2026 because…", not "lots of people lost jobs." Every specific factual claim
   traces to `sources.md`. **Never write a model name, tool version, price, or free-tier
   limit from memory** — those come live-verified from `pipeline/shared/knowledge/facts.json`
   (the curated freshness cache) via `fact-check`; if it's not there yet, fact-check fetches
   and adds it. Recalled numbers go stale and break monetization.
10. **Human fingerprint + series (D-028).** Carry the owner-approved **original angle/POV** and
   honest "what wasn't worth it" takes; the channel's series tag belongs on the section-header:
   **Desk Fixes** (mini-demo) · **Desk Loops** (ideas/diagram) · **Automation Breakdowns**
   (comparison) · **Desk Notes** (news/short). Every Nth video should plan a real
   owner-recorded demo (mini-demo) — genuine footage is the strongest anti-"content-farm" signal.
11. **Lead with one copy-pasteable prompt (automation/how-to clips) — owner rule 2026-06-07.**
   When a clip teaches a result the viewer can reproduce with AI, feature **one stylized,
   copy-pasteable prompt** on screen, held long enough to **pause and screenshot**. If it fits
   on screen, show it big; if it's too long, show the gist on screen and put the **full prompt
   in the description / pinned comment**. The diagnostic build-up (separate find-this, fix-that
   steps) is optional flavor — the single reproduce-it prompt is the payoff. And remember: a
   one-off chat result isn't automation — prefer the **reusable script/system** as the takeaway.

## Write to the archetype (STYLE_GUIDE §5 ≙ `format.archetype_structure.<archetype>`)
- **ideas:** hook → framing → N items (idea → why it pays → tiny illustration →
  takeaway) → scale-it close.
- **mini-demo:** hook → the boring task → `capture-segment` of the trivial example →
  "scale it to real volume" → close.
- **diagram:** hook → build the diagram step by step → walk the flow → caveats → close.
- **comparison:** hook → contenders + criteria → comparison table → honest verdict
  (with the angle) → close.

## Per-scene fields (script.schema.json)
`id`, `role` (hook|intro|point|demo|transition|cta|outro), **`template`** (pick from
the scene vocabulary in `style/VISUAL_IDENTITY.md` §5), `narration`, `sentences`
(split), optional `on_screen_text` (≤6 words), `capture_id` (only for `capture-segment`).

Guideline: 1–4 sentences / ~5–20s per scene; never a 60s wall of narration.

## Output & status
- Write `script.json` (valid against the schema; `language: "en"`, include top-level
  `archetype` and `angle`).
- Validate: `node pipeline/shared/validate.js content/<id>/script.json`.
- Set `brief.json.status: "scripted"`, then hand to `script-review`.
