# WORKFLOW

The end-to-end process from a scored idea to a published video, with the **three
human gates**. This is the operational runbook. For the *why* see `docs/PRD.md`; for
the *how it's wired* see `docs/ARCHITECTURE.md`.

There are **two modes**:
- **Manual mode**: you drive each step, the agent does the work.
- **Autonomous mode** (Wave 5, wired): a scheduler loops the orchestrator, which runs
  steps back-to-back and stops only at the gates. Both modes follow the same steps. See
  **"Autonomous mode"** below.

The three human gates: **① Topic + angle + type · ② Script · ③ Final video.**
Storyboard is now automatic (fixed templates). The mini-demo archetype inserts a
**capture step** between ② and ③.

---

## Step 0 — Pick & frame an idea  → `pipeline/00-ideas`

**Goal:** choose one scored idea, classify its archetype, and propose the angle.

1. Get a candidate idea. Two paths:
   - **You provide it:** "Make a video about automating shift schedules."
   - **From the idea-bank:** the agent reads `pipeline/00-ideas/ideas.json` and picks
     the top-`score` unproduced idea (score = free search-suggest/competitor signals +
     judgment). The agent may refresh the bank from clean sources first.
2. The agent writes `brief.json`: `{ id, title_working, archetype, angle, audience,
   target_seconds, format: "long+short"|"long"|"short", task, sector, tool, sources: [],
   status: "ideated" }`, and **classifies the archetype + drafts the original angle**.
3. If the archetype needs facts (Comparison/stats), research → `sources.md` (paraphrased
   facts, citable links; never transcripts — D-002). Ideas/Demo may skip formal sources.

### ▶ GATE ① — scored content-value gate (the review's IDEA pass)
Before scripting, the review's **idea-pass** (`pipeline/shared/review/`, idea stage) scores the
idea 0-10 on value / reusable-takeaway / packaging / audience-fit (hard gates: a real value type +
a single takeaway + on-brand). The score bands the gate:
- **≥9.0 (≥90%) → auto-proceed** — classify archetype, draft angle, write `brief.json` (now carries
  `value_type`, `takeaway`, `lane`, `value_score`/`value_band`), go straight to the script. No stop.
- **7.5–9.0 (75–90%) → ASK the owner** — the only band where Gate ① pauses.
- **<7.5 (<75%) → auto-reject** — park the idea; `pickNextIdea` skips `value_band:"reject"`.
A variety soft-cap nudges off >2 of the same lane/archetype/tool in a row (never hard-blocks).

**Output:** `brief.json`, optional `sources.md`.

---

## Step 1 — Write the script  → `pipeline/01-script`

**Goal:** a scene-segmented, template-tagged English script with the angle baked in,
that passes the review agent.

1. **Write.** Use `.claude/skills/script-writing/SKILL.md`. Structure by the brief's
   **archetype** (STYLE_GUIDE §5), each scene with `role`, **`template`**, `narration`,
   `sentences`, optional `on_screen_text`/`capture_id`. Output: `script.json`
   (schema `pipeline/shared/schemas/script.schema.json`).
2. **Fact-check (generate + verify).** Run `.claude/skills/fact-check/SKILL.md` (`draft`
   mode): extract every checkable claim (names/dates/numbers/prices/versions/limits/stats),
   verify each against a **fetched** primary/reputable source, and write `sources.md` +
   `claims.json`. HIGH-severity unverified claims go back to the writer. This removes the
   owner's old manual "Google it to confirm" step (D-032).
3. **Review (mandatory).** Run `.claude/skills/script-review/SKILL.md`. Checks: the
   **original human angle is present**, accuracy (delegates to `claims.json`), style/pacing,
   scene segmentation + valid `template` tags, retention. Output: `script.review.json`
   (`pass: true|false` + issues).
4. **Fix loop.** If `pass: false`, the writer fixes and re-runs fact-check + review (cap at
   N loops, then surface to you).
5. Set `status: "scripted"`.

### ▶ GATE ② — You review the script
You read `script.json` (already auto-reviewed and clean). Approve or request changes.
On approval → `status: "script_approved"`.

**Output:** `script.json`, `script.review.json`.

---

## Step 2 — Voice + alignment  → `pipeline/02-voice`

**Goal:** one continuous English narration + precise timestamps.

1. **Synthesize.** Use `.claude/skills/voice-synthesis/SKILL.md`. Concatenate all scene
   `narration` in order and TTS it as **one continuous track** (`voice/narration.wav`)
   via **edge-tts**, the single channel voice from `config.json.voice`. Never cut audio.
2. **Align.** Forced alignment (WhisperX/aeneas) → `alignment.json` mapping each sentence
   (and word) to `{start, end}` seconds.
3. **Validate.** Every sentence in `script.json` must have a timestamp; otherwise fail
   clearly (don't proceed).
4. Set `status: "voiced"`.

**Output:** `voice/narration.wav` (git-ignored), `alignment.json`.

---

## Step 3 — Scene plan + assets  → `pipeline/03-visuals`

**Goal:** turn each scene's `template` into concrete render props, and gather any assets.

1. **Scene plan (automatic — no gate).** Use `.claude/skills/storyboard/SKILL.md`: map
   each scene `template` to its component + fill props (text, bullet lists, diagram
   structure, comparison rows, etc.). Output: `scene-plan.json`. Because templates are
   fixed/deterministic, this needs no human gate.
2. **Assets:**
   - **Code visuals / diagrams** → defined in the scene plan; no external asset.
   - **Thumbnails / rare concept images** → `.claude/skills/visual-prompts/SKILL.md`
     (stock via Pexels/Pixabay, or the optional Colab AI-image notebook).
   - **Mini-demo capture** → use `.claude/skills/screen-capture/SKILL.md`: the agent
     produces a precise OBS click-list with **synthetic data**; **you record** into
     `captures/`. Status → `captured`.
3. Set `status: "planned"` (or `captured` for mini-demos).

**Output:** `scene-plan.json`, `visual-prompts.json` (thumbnails), `images/`, `captures/`.

---

## Step 4 — Render  → `pipeline/04-render`

**Goal:** assemble the final mp4 + a Short + 3 thumbnail candidates.

1. Use `.claude/skills/video-render/SKILL.md`. Build `render/props.json` from
   `script.json` + `alignment.json` + `scene-plan.json` + asset paths.
2. Scenes are placed in time from `alignment.json` (scene i = first sentence start →
   last sentence end). Captures play inside `capture-segment` scenes with auto-zoom/
   highlight. Subtitles use the same timings (burned-in, animated, English).
3. Add the reusable **intro/outro** (no music on long-form). Render via the selected
   `render.engine` (Remotion / hyperframes / combo).
4. Build the **Short** (1–2 key beats; light music allowed).
5. **Thumbnail candidates (04b, D-056):** `node pipeline/04b-thumbnails/extract.mjs <id>`
   grabs 3 **caption-free** stills from the video's own timeline (scored deterministically;
   you pick — no AI ranking). Fallback: 2 image prompts (`visual-prompts` skill).
6. Set `status: "rendered"`.

**Output:** `video/final.mp4`, `video/short.mp4`, `images/thumb_candidate_{1..3}.png` +
`thumb_final_{1..3}.png` + `thumb_candidates.json`, `render/props.json` (media git-ignored).

---

## Step 5 — Automated QA  → `pipeline/05-qa`

**Goal:** catch problems *before* you watch.

Use `.claude/skills/qa-video/SKILL.md`. Checks: sync (scene windows match timestamps),
subtitles (no drift/overlap), no scene change mid-sentence, coverage/no black gaps,
**caption legibility/contrast**, **demo legibility**, loudness, format (and vertical
Short).

- **Technical breakage** (no audio / cut-off / missing captions) → **auto-fix and
  re-render** that step.
- **Content issues** → **flag** and propose a fix for you to approve (human perspective).
- **Claim re-check** → run `.claude/skills/fact-check/SKILL.md` (`final` mode) on the rendered
  narration: every spoken HIGH claim is still `verified` and unchanged since draft (D-032).
- Emit a **30s digest** (key claims, the angle, sources, risk flags) for fast judgment.

Set `status: "qa_passed"` when clean. Output: `qa.report.json` (incl. digest).

### ▶ GATE ③ — You review the final video
You watch `video/final.mp4` (with the digest). Last gate. Approve → `status: "ready"`.

---

## Step 6 — Publish  → `pipeline/06-publish`

**Goal:** prepare everything and upload as a draft for your final click.

1. Use `.claude/skills/youtube-publish/SKILL.md`. Generate English SEO title,
   description (keyword in first lines), tags, **chapters** → `publish.json` +
   **`publish.md`** (copy-paste export). The package passes the **publish review stage**
   (single-Sonnet panel, D-057) before you see it. Pick the thumbnail from the **3
   candidates** (Test & Compare takes all 3); record it with
   `node pipeline/06-publish/build-metadata.mjs <id> --choose-thumb <#>`.
2. **You upload manually (D-055 — API drafts suspended)**, copy-pasting from `publish.md`,
   and set "Altered content = Yes" in Studio.
3. You review title/description/tags and **click publish**.
4. Set `status: "published"`. Append outcome to `content/<id>/log.md`,
   `docs/PROGRESS.md`, and the idea's `metrics` (for re-ranking the idea-bank).

**Output:** `publish.json`, draft on YouTube.

---

## Starting a video

- **Slash command:** `/novi-video` scaffolds a new `content/<NNN>-<slug>/` from
  `_TEMPLATE` and walks Step 0 (incl. archetype + angle).
- **Manually:** copy `content/_TEMPLATE` → `content/<NNN>-<slug>/`, fill `brief.json`,
  then follow the steps.

## Gate discipline (do not skip)

```
Step0 ──► GATE ① topic + angle + type
Step1 ──► GATE ② script
Step5 ──► GATE ③ final video ──► publish
```
Never publish without Gate ③. Never voice without Gate ② (so we don't synth a bad
script). Never produce without Gate ① (so we don't build the wrong thing).

## Autonomous mode (Wave 5)

The system can produce hands-off: the owner does **only** Gate ② (if the script can't
auto-pass ≥9.2) and Gate ③ (final approve + thumbnail). A scheduler loops one driver.

**The loop — `pipeline/shared/orchestrator/auto-run.mjs` (one pass per call):**
1. **Idle?** `pick-next` picks the top **backlog** idea by effective score
   (`adjusted_score ?? score` — analytics re-ranks it, T5.2), scaffolds `content/<id>/`
   with a brief seeded from the idea, and marks the idea **in-progress** (persisted
   *before* the run, so a crash never orphans the pick).
2. **Busy?** It **resumes** the in-progress video (the DAG resumes from
   `run-manifest.json`) — never starts a second one. Safe to re-fire anytime.
3. It runs the video DAG to the next pause and **classifies** it:
   - `done` — reached Gate ③ / complete; nothing more to automate.
   - `ownerGate` — a human is needed (Gate ②/③, a failed review, or the upload OAuth
     prompt) **or an error** → the wrapper PushNotifies the owner. (`notifiesOwner`.)
   - `agentTask` — a skill hand-off (Claude-Code mode: `script`/`plan_long`/`render_*`/
     `qa`) → the wrapping agent runs that skill, marks the node done in
     `run-manifest.json`, and re-runs `auto-run`. The owner is **not** pinged for these.

**Trigger (owner's choice = CronCreate):** a scheduled **cloud agent** fires on a cadence
with a prompt that loops `auto-run`: run it → if `agentTask`, fulfil the skill + mark the
node done + re-run → repeat until `done` or `ownerGate` → then PushNotify the owner and
stop. Because the cloud agent *is* Claude, agent nodes run in **Claude-Code mode** (it
fulfils the hand-offs itself) — no per-node `claude -p`.

**Manual drive (any time):** `npm run make-video -- <id>` runs the same DAG for one video;
in Claude-Code mode it pauses at each agent node for the top agent to fulfil, then resume.

**Owner one-time before the first autonomous run:** `GEMINI_API_KEY` in `.env` (2nd
reviewer) and YouTube OAuth (`node pipeline/06-publish/auth.mjs`) — without them the review
and upload nodes pause as `ownerGate`s.
