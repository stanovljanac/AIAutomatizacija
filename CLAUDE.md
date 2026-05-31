# CLAUDE.md — Project Router

> This file is intentionally **thin**. It tells you (the agent) WHO you are, WHERE
> everything lives, and WHICH file to open for any given task. Do not duplicate
> content here — link to the source of truth instead. Keep this under ~150 lines.

## What this project is

An automated, mostly-hands-off **YouTube content factory** that produces
professional, Serbian-language videos about AI (news, model releases, tools,
prompting techniques, tutorials). We take **topics/ideas** from the global AI
scene, then write **original** Serbian scripts and build **original** visuals and
voice — we never translate someone else's video word-for-word.

Full product spec: `docs/PRD.md`
How the system works end to end: `docs/ARCHITECTURE.md`

## Your operating principles (read before any task)

1. **Quality > speed > cost.** Cost target is **$0** until the channel proves
   itself. If a step cannot be free at acceptable quality, flag it — do not
   silently spend money.
2. **Originality is non-negotiable.** Sources give us *topics and facts*, never
   sentences. See `style/STYLE_GUIDE.md` → "Originality & sourcing".
3. **Every text passes a review agent before a human sees it.** Author → review →
   fix loop. See `.claude/skills/script-review/SKILL.md`.
4. **Human gates are: script → storyboard → final video.** Never publish without
   the human approving the final video. See `docs/WORKFLOW.md`.
5. **Audio is one continuous track.** Scenes change on sentence boundaries via
   forced-alignment timestamps; audio is never cut. See
   `.claude/skills/voice-synthesis/SKILL.md`.
6. **Write everything (code, docs, skills) in English.** Channel output (scripts,
   subtitles, titles) is in **Serbian**.

## Where everything lives

| You need to…                         | Open this                                   |
|--------------------------------------|---------------------------------------------|
| Understand the product & goals       | `docs/PRD.md`                               |
| Understand the system / data flow    | `docs/ARCHITECTURE.md`                      |
| Know which tool to use & why         | `docs/TOOLS.md`                             |
| Follow the production steps          | `docs/WORKFLOW.md`                          |
| Know what phase we're in / next      | `docs/ROADMAP.md`                           |
| Log or read progress                 | `docs/PROGRESS.md`                          |
| Understand a past decision           | `docs/DECISIONS.md`                         |
| Install/configure the environment    | `docs/SETUP.md`                             |
| Write or fix the tone/language       | `style/STYLE_GUIDE.md`                      |
| Translate an EN term to SR           | `style/TERMBANK.md`                         |
| Match the visual look                | `style/VISUAL_IDENTITY.md`                  |
| Know channel name/niche/SEO          | `style/CHANNEL.md`                          |

## The skills (auto-invoked per task)

Each skill is the **single source of truth** for that step. When a task matches,
open the skill FIRST, then act.

| Step | Skill file |
|------|-----------|
| Find/validate a topic        | `.claude/skills/` *(topic logic lives in `pipeline/00-topic` + WORKFLOW.md)* |
| Write the script             | `.claude/skills/script-writing/SKILL.md` |
| Review/QA the script         | `.claude/skills/script-review/SKILL.md` |
| Translate & localize text    | `.claude/skills/translation-localization/SKILL.md` |
| Build the storyboard         | `.claude/skills/storyboard/SKILL.md` |
| Generate image/video prompts | `.claude/skills/visual-prompts/SKILL.md` |
| Synthesize voice + align     | `.claude/skills/voice-synthesis/SKILL.md` |
| Render the video (Remotion)  | `.claude/skills/video-render/SKILL.md` |
| QA the final video           | `.claude/skills/qa-video/SKILL.md` |
| Prepare & publish to YouTube | `.claude/skills/youtube-publish/SKILL.md` |

## The pipeline (code)

Code is organized as **numbered phases** under `pipeline/`. Each phase reads the
previous phase's output from the video's `content/<id>/` folder and writes its own.
Phases are **idempotent and resumable** (safe to re-run; cached work is skipped).
See `docs/ARCHITECTURE.md` → "Pipeline contract".

```
pipeline/00-topic → 01-script → 02-voice → 03-visuals → 04-render → 05-qa → 06-publish
```

## One video = one folder

Every video lives in `content/<NNN>-<slug>/` (e.g. `content/001-sta-je-ai/`).
Skeleton of that folder: `content/_TEMPLATE/`. Real example you can learn from:
`content/001-sta-je-ai/`.

**Media files (audio/video/images) are git-ignored.** Only text/JSON/config is
committed. See `.gitignore`.

## How to start a new video

Run the slash command `/novi-video` (see `.claude/commands/novi-video.md`) or
follow `docs/WORKFLOW.md` manually. Either way: copy `_TEMPLATE`, then walk the
phases, honoring the three human gates.

## Golden rules recap (do not violate)

- Free first. Flag any cost.
- No word-for-word translation. Original scripts only.
- No invented words, no needless jargon, no English-spelled-as-Serbian when a
  clean Serbian word exists (`style/TERMBANK.md` decides).
- One continuous audio track; scenes snap to sentence timestamps.
- Review agent before human; human approves final video before publish.
- Keep this file thin. New rules go in the relevant skill or `style/` file.
