# CLAUDE.md — Project Router

> This file is intentionally **thin**. It tells you (the agent) WHO you are, WHERE
> everything lives, and WHICH file to open for any given task. Do not duplicate
> content here — link to the source of truth instead. Keep this under ~150 lines.

## What this project is

An automated, mostly-hands-off **YouTube content factory** that produces
professional, **English-language**, **faceless** videos about **boring, everyday
AI automations** — the small back-office tasks everyone ignores while chasing big
systems (data entry, invoicing, shift scheduling, reminder/invite emails, simple
record-keeping), growing into bigger systems, tool comparisons, and news. We give
**ideas and small worked examples**; viewers scale them to their own processes.
Channel: **The Automation Desk** (@TheAutomationDesk). Recurring series:
**Desk Fixes · Desk Loops · Automation Breakdowns · Desk Notes** (`style/CHANNEL.md`).

We never translate or copy anyone's video. We take *topics and facts*, then build
**original** English scripts, visuals, and voice. Every script carries an **original
human angle** (required — it's what keeps us monetizable under YouTube's anti-"AI-slop"
rules).

Full product spec: `docs/PRD.md`. How it works end to end: `docs/ARCHITECTURE.md`.
Why we pivoted from the old Serbian-AI channel: `docs/DECISIONS.md` (D-011…D-019).

## Your operating principles (read before any task)

1. **Quality > speed > cost.** Target **$0**; the stack is mostly **local** now, so
   cost risk is low. If a step can't be free at acceptable quality, flag it.
2. **Accuracy & originality.** Examples must actually work or be clearly framed as a
   concept; the **original human angle is mandatory** in every script. Answer the core
   question early with **specific, sourced facts** (names/dates/numbers — D-026). Sources
   give topics/facts, never sentences. Demo data is **synthetic** (never real client data).
   **Always disclose altered content** at upload (AI voice + visuals — D-025).
3. **Every text passes a review agent before a human sees it.** Author → review → fix.
   See `.claude/skills/script-review/SKILL.md`.
4. **Human gates: script → final video.** Gate 1 (topic+angle+type) is **auto** — the
   owner opted out of that stop, so classify + draft the angle and proceed straight to
   the script. Storyboard is automatic (fixed templates). Never publish without the
   final-video approval. See `docs/WORKFLOW.md`.
5. **Audio is one continuous track.** Scenes/captions snap to forced-alignment
   timestamps; audio is never cut. See `.claude/skills/voice-synthesis/SKILL.md`.
6. **Never delete or overwrite a file/asset without asking first.** Writing brand-new
   files is fine; clobbering existing ones is not. Check first, then ask — especially
   for anything you did not create.
7. **Write everything (code, docs, skills) AND channel output in English.**

## Where everything lives

| You need to…                         | Open this                                   |
|--------------------------------------|---------------------------------------------|
| Understand the product & goals       | `docs/PRD.md`                               |
| Understand the system / data flow    | `docs/ARCHITECTURE.md`                      |
| Know which tool to use & why         | `docs/TOOLS.md`                             |
| Follow the production steps          | `docs/WORKFLOW.md`                          |
| Know which phase we're in / next     | `docs/ROADMAP.md`                           |
| Log or read progress                 | `docs/PROGRESS.md`                          |
| Understand a past decision           | `docs/DECISIONS.md`                         |
| Install/configure the environment    | `docs/SETUP.md`                             |
| Write or fix the tone/language       | `style/STYLE_GUIDE.md`                      |
| Match the visual look                | `style/VISUAL_IDENTITY.md`                  |
| Know channel name/niche/SEO/account  | `style/CHANNEL.md`                          |

## The skills (auto-invoked per task)

Each skill is the **single source of truth** for that step. Open it FIRST, then act.

| Step | Skill file |
|------|-----------|
| **Implement/fix/refactor ANY code (the engineering cycle — every change)** | `.claude/skills/build-sprint/SKILL.md` |
| Find/score a topic from the idea-bank | topic logic in `pipeline/00-ideas` + WORKFLOW.md |
| Write the script (per archetype + angle) | `.claude/skills/script-writing/SKILL.md` |
| Fact-check & source the script (generate + verify) | `.claude/skills/fact-check/SKILL.md` |
| Review/QA the script         | `.claude/skills/script-review/SKILL.md` |
| Build the scene plan (templates) | `.claude/skills/storyboard/SKILL.md` |
| Thumbnail / occasional asset prompts | `.claude/skills/visual-prompts/SKILL.md` |
| Plan & guide a screen-capture demo | `.claude/skills/screen-capture/SKILL.md` |
| Synthesize voice + align     | `.claude/skills/voice-synthesis/SKILL.md` |
| Render the video (Remotion / engine) | `.claude/skills/video-render/SKILL.md` |
| QA the final video           | `.claude/skills/qa-video/SKILL.md` |
| Prepare & publish to YouTube | `.claude/skills/youtube-publish/SKILL.md` |

> `translation-localization` is **retired** (no second language). `TERMBANK.md` is
> retired too — see its tombstone note.

## The four video archetypes

The system cycles through these; I classify each topic into one and you approve it.
Each scene gets a `template` tag mapped deterministically to a render component.

1. **Ideas/Listicle** — "N ways AI can automate X", full code-driven visuals.
2. **Mini-demo** — a trivial real example you record in OBS; auto-zoom + "scale it".
3. **Diagram/Architecture** — narrated, code-drawn animated diagram.
4. **Comparison** — "best tool/model for X".

See `style/VISUAL_IDENTITY.md` for the scene vocabulary and components.

## The pipeline (code)

Numbered phases under `pipeline/`. Each reads the previous phase's output from the
video's `content/<id>/` folder and writes its own. Phases are **idempotent and
resumable**. See `docs/ARCHITECTURE.md` → "Pipeline contract".

```
pipeline/00-ideas → 01-script → 02-voice → 03-visuals → 04-render → 05-qa → 06-publish
```

## One topic = one folder

Every video lives in `content/<NNN>-<slug>/` (skeleton: `content/_TEMPLATE/`). The
**Short is nested inside it** at `content/<NNN>-<slug>/short/` (a lean sub-unit with its
own `script.json`/`voice/`/`scene-plan.json`/`alignment.json`/`video/`; it inherits the
topic, angle and sources from the long unit). `build-props.mjs` detects the Short by the
last path segment, so render it with `build-props.mjs <id>/short`. (Legacy `002-short`/
`003-short` stay flat for history.)
**Per-video content and the idea-bank are git-ignored; only the `_TEMPLATE` skeleton and
the system (code/docs/skills/schemas/templates) are committed.** Media files
(audio/video/images/captures) are ignored everywhere. 001/002 remain tracked for history
(owner choice — gitignore doesn't untrack); 003+ and `pipeline/00-ideas/ideas.json` are
ignored. The old Serbian example `content/001-sta-je-ai/` is **archived**, kept for
reference (also under git tag `serbian-ai-archive`).

## How to start a new video

Run `/novi-video` (see `.claude/commands/novi-video.md`) or follow `docs/WORKFLOW.md`
manually: copy `_TEMPLATE`, pick a scored idea, then walk the phases, honoring the
three gates.

## Golden rules recap (do not violate)

- Free/local first. Flag any cost.
- No word-for-word translation. Original English scripts only, each with a human angle.
- One continuous audio track; scenes snap to sentence timestamps.
- Synthetic demo data only; review agent before human; human approves final video.
- **Never delete/overwrite existing files or assets without asking first** (principle 6).
- **Every code change runs the build-sprint cycle** (atomize → build → test → verify with a
  *different* model → fix → docs); `npm test` must be green (Stop hook enforces). Not for
  planning/research/doc-only edits. See `.claude/skills/build-sprint/SKILL.md`.
- **Never `git commit` or `git push` unless the owner explicitly asks — every time.**
  Finishing a task or a "continue" instruction is NOT commit permission; leave changes
  in the working tree and wait for an explicit "commit". Offer push separately.
- Keep this file thin. New rules go in the relevant skill or `style/` file.
