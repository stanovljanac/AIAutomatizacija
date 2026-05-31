# WORKFLOW

The end-to-end process from a topic to a published video, with the three human
gates. This is the operational runbook. For the *why* see `docs/PRD.md`; for the
*how it's wired* see `docs/ARCHITECTURE.md`.

There are **two modes**:
- **Manual mode** (now): you drive each step, the agent does the work.
- **Auto mode** (later): the orchestrator runs steps back-to-back, stopping only
  at the three gates. Both modes follow the same steps below.

The three human gates: **① Script · ② Storyboard · ③ Final video.**

---

## Step 0 — Pick & validate a topic  → `pipeline/00-topic`

**Goal:** choose one topic and gather *facts from clean sources* (never
transcripts).

1. Get a candidate topic. Two paths:
   - **You provide it:** "Make a video about Anthropic's new skill X."
   - **Discovery:** the agent scans clean sources (official blogs: Anthropic,
     OpenAI, Google DeepMind; docs; GitHub releases; newsletters; subreddits/X
     posts) and proposes topics with an angle and a why-now. YouTube channels may
     be used **only to see what's trending as a topic**, never as a text source
     (DECISIONS D-002).
2. Write `brief.json`: `{ id, title_working, angle, audience, target_seconds,
   format: "long"|"short", sources: [], status: "new" }`.
3. Research → `sources.md`: bullet facts, each with a citable link. Paraphrased,
   never copied. These facts are the raw material the script is built from.
4. Set `status: "researched"`.

**Output:** `brief.json`, `sources.md`.

---

## Step 1 — Write the script  → `pipeline/01-script`

**Goal:** a scene-segmented, high-retention Serbian script that obeys the style
guide, then passes the review agent.

1. **Write.** Use `.claude/skills/script-writing/SKILL.md`. The script is written
   directly in Serbian (we're not translating anyone), structured as **scenes**
   (hook → intro → points/demos → cta → outro), each scene with `narration`,
   `sentences`, `visual_intent`, and optional `on_screen_text`/`screen_capture`.
   Output: `script.json` (schema in `pipeline/shared/schemas/script.schema.json`).
2. **Localize/clean.** Apply `.claude/skills/translation-localization/SKILL.md`:
   enforce `style/TERMBANK.md` (EN→SR terms), remove invented words and needless
   jargon, fix any English-spelled-as-Serbian.
3. **Review (mandatory).** Run `.claude/skills/script-review/SKILL.md`. The review
   agent checks: factual consistency vs `sources.md`, style-guide compliance, term
   bank, pacing, scene segmentation, retention. Output: `script.review.json` with
   `pass: true|false` and a list of issues.
4. **Fix loop.** If `pass: false`, the writer applies fixes and re-runs review.
   Repeat until pass (early phase: cap at N loops, then surface to human).
5. Set `status: "scripted"`.

### ▶ GATE ① — Human reviews the script
You read `script.json` (already auto-reviewed and clean). Approve or request
changes. On approval → `status: "script_approved"`.

**Output:** `script.json`, `script.review.json`.

---

## Step 2 — Voice + alignment  → `pipeline/02-voice`

**Goal:** one continuous Serbian narration track + precise timestamps.

1. **Synthesize.** Use `.claude/skills/voice-synthesis/SKILL.md`. Concatenate all
   scene `narration` in order and TTS it as **one continuous audio**
   (`voice/narration.wav`). Never cut the audio (PRD R11). Backend chosen via
   `config.json` (`free_tts` default, `elevenlabs` fallback).
2. **Align.** Run forced alignment (WhisperX/aeneas) → `alignment.json` mapping
   each sentence (and word) to `{start, end}` seconds.
3. **Validate.** Every sentence in `script.json` must have a timestamp. If any are
   missing/mismatched, fail with a clear message (don't proceed).
4. Set `status: "voiced"`.

**Output:** `voice/narration.wav` (git-ignored), `alignment.json`.

---

## Step 3 — Storyboard + visual prompts  → `pipeline/03-visuals`

**Goal:** decide what's on screen for every scene, then produce the visuals.

1. **Storyboard.** Use `.claude/skills/storyboard/SKILL.md`. For each scene write
   a concrete on-screen plan: type (motion-text | stock | AI-image | screen-
   capture | hero-clip), composition, camera move, and which `on_screen_text`
   appears. Output: `storyboard.json`.

### ▶ GATE ② — Human reviews the storyboard
Cheap to change now, expensive to re-render later. You approve the per-scene plan
(this is also where we avoid wasting free GPU time). On approval →
`status: "storyboard_approved"`.

2. **Prompts.** Use `.claude/skills/visual-prompts/SKILL.md`: turn each AI-image
   scene into a detailed image prompt, and where a "hero" animated shot is wanted,
   derive a video-animation prompt. Output: `visual-prompts.json`.
3. **Acquire assets:**
   - Stock → fetch via Pexels/Pixabay API into `images/`.
   - AI images → generate on Colab/Kaggle (chunked+cached) into `images/`.
   - Screen captures → you record with OBS into `captures/` (guided list the
     agent prepares), or we build a Remotion UI mock / AI mock if you lack access.
4. Set `status: "visualized"`.

**Output:** `storyboard.json`, `visual-prompts.json`, `images/`, `captures/`.

---

## Step 4 — Render  → `pipeline/04-render`

**Goal:** assemble the final mp4.

1. Use `.claude/skills/video-render/SKILL.md`. Build Remotion `render/props.json`
   from `script.json` + `alignment.json` + `storyboard.json` + asset paths.
2. Scenes are placed in time using `alignment.json` (scene i shows from its first
   sentence's start to its last sentence's end). Subtitles use the same timings.
3. Add the reusable **intro/outro** (long variant) and burned-in animated Serbian
   subtitles.
4. Render locally first (`templates/remotion`). If too slow, move to cloud (OQ2).
   Output: `video/final.mp4`.
5. Set `status: "rendered"`.

**Output:** `video/final.mp4` (git-ignored), `render/props.json`.

---

## Step 5 — Automated QA  → `pipeline/05-qa`

**Goal:** catch problems *before* the human watches (PRD R13).

Use `.claude/skills/qa-video/SKILL.md`. Checks:
- **Sync:** does each scene's visible window match its sentences' timestamps?
- **Subtitles:** do caption cues match `alignment.json` (no drift, no overlap)?
- **Scene/audio coherence:** no scene change mid-sentence; narration continuous.
- **Coverage:** every scene rendered; audio length ≈ sum of scenes; no black gaps.
- **Loudness/format:** sane audio levels; correct resolution/fps; Short variant
  vertical if applicable.

Output: `qa.report.json` with `pass` + issues.
- **Early phase:** QA **flags**; human decides (PRD R14).
- **Later phase:** QA may **auto-reject and re-run** the offending step.

Set `status: "qa_passed"` when clean.

---

### ▶ GATE ③ — Human reviews the final video
You watch `video/final.mp4`. This is the last gate. Approve → `status: "ready"`.

---

## Step 6 — Publish  → `pipeline/06-publish`

**Goal:** prepare everything and upload as a draft for your final click.

1. Use `.claude/skills/youtube-publish/SKILL.md`. Generate:
   - SEO title (Serbian, keyword-aware), description with keywords/timestamps,
     tags, and a thumbnail spec (rendered via Remotion template).
   - If the topic is *strictly someone's original IP* we're reviewing, the step
     **asks** whether to credit the source (PRD R4).
2. Build the **Short** from the same script (key beats) or as a standalone, per
   `brief.json.format`.
3. Upload via YouTube Data API as **private/draft** with all metadata + thumbnail.
4. You review title/description/tags (keyword + SEO check) and **click publish**.
5. Set `status: "published"`. Append outcome to `content/<id>/log.md` and
   `docs/PROGRESS.md`.

**Output:** `publish.json`, draft on YouTube.

---

## Starting a video

- **Slash command:** `/novi-video` (see `.claude/commands/novi-video.md`) scaffolds
  a new `content/<NNN>-<slug>/` from `_TEMPLATE` and walks Step 0.
- **Manually:** copy `content/_TEMPLATE` → `content/<NNN>-<slug>/`, fill
  `brief.json`, then follow the steps.

## Gate discipline (do not skip)

```
Step1 ──► GATE ① script
Step3.1 ─► GATE ② storyboard
Step5 ──► GATE ③ final video ──► publish
```
Never publish without Gate ③. Never render without Gate ②. Never voice without
Gate ① (so we don't synth a bad script).
