# CLAUDE.md — Project Router

> Thin by design: it tells you (the agent) WHO you are, WHERE everything lives, and WHICH
> file to open for any task. Link to the source of truth; never duplicate it here. Keep
> under ~150 lines.

## What this project is

An automated, mostly-hands-off **YouTube content factory** that produces professional,
**English-language**, **faceless** videos about **boring, everyday AI automations** — the
small back-office tasks everyone ignores while chasing big systems (data entry, invoicing,
shift scheduling, reminder/invite emails, simple record-keeping), growing into bigger
systems, tool comparisons, and news. We give **ideas and small worked examples**; viewers
scale them to their own processes. Channel: **The Automation Desk** (@TheAutomationDesk).
Recurring series: **Desk Fixes · Desk Loops · Automation Breakdowns · Desk Notes**
(`style/CHANNEL.md`).

We never translate or copy anyone's video. We take _topics and facts_, then build
**original** English scripts, visuals, and voice. Every script carries an **original human
angle** (required — it keeps us monetizable under YouTube's anti-"AI-slop" rules).

Full product spec: `docs/PRD.md`. How it works end to end: `docs/ARCHITECTURE.md`. Why we
pivoted from the old Serbian-AI channel: `docs/DECISIONS.md` (D-011…D-019).

## Your operating principles (read before any task)

1. **Quality > speed > cost.** Target **$0**; the stack is mostly **local**, so cost risk is
   low. If a step can't be free at acceptable quality, flag it.
2. **Accuracy & originality.** Examples must actually work or be clearly framed as a concept;
   the **original human angle is mandatory** in every script. Answer the core question early
   with **specific, sourced facts** (names/dates/numbers — D-026). Sources give topics/facts,
   never sentences. Demo data is **synthetic** (never real client data). **Always disclose
   altered content** at upload (AI voice + visuals — D-025). For how-to/ideas/demo videos,
   **research the real-world workflow + tools first** (name real tools/competitors; keep the tool
   modular, the workflow the focus) — see `script-writing` Step 0.
3. **Every text passes a review agent before a human sees it.** Author → review → fix
   (`.claude/skills/script-review/SKILL.md`).
4. **Human gates: script → final video.** Gate 1 is a **scored content-value gate** (the review's
   idea-pass, `pipeline/shared/review/`): **≥90% auto-proceeds** to the script, **75–90% asks the
   owner**, **<75% is auto-rejected**. Above 90% there is no stop (classify, draft the angle, write
   the brief, proceed). Storyboard is automatic (fixed
   templates). Never publish without final-video approval (`docs/WORKFLOW.md`).
5. **Audio is one continuous track.** Scenes/captions snap to forced-alignment timestamps;
   audio is never cut (`.claude/skills/voice-synthesis/SKILL.md`).
6. **Never delete or overwrite a file/asset without asking first.** New files are fine;
   clobbering existing ones is not — check, then ask, especially for what you didn't create.
7. **Write everything (code, docs, skills) AND channel output in English.**

## Where everything lives

| You need to…                                                    | Open this                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Understand the product & goals                                  | `docs/PRD.md`                                                                                                            |
| Understand the system / data flow                               | `docs/ARCHITECTURE.md`                                                                                                   |
| Know which tool to use & why                                    | `docs/TOOLS.md`                                                                                                          |
| Follow the production steps                                     | `docs/WORKFLOW.md`                                                                                                       |
| Know which phase we're in / next                                | `docs/ROADMAP.md`                                                                                                        |
| Log or read progress                                            | `docs/PROGRESS.md`                                                                                                       |
| Understand how autonomy/freshness/swappability are wired        | `docs/ARCHITECTURE.md` §12                                                                                               |
| Understand a past decision                                      | `docs/DECISIONS.md`                                                                                                      |
| Install/configure the environment                               | `docs/SETUP.md`                                                                                                          |
| Write or fix the tone/language                                  | `style/STYLE_GUIDE.md`                                                                                                   |
| Match the visual look                                           | `style/VISUAL_IDENTITY.md`                                                                                               |
| Match the motion/pacing/transition craft (concrete numbers)     | `style/MOTION_SPEC.md`                                                                                                   |
| Know channel name/niche/SEO/account                             | `style/CHANNEL.md`                                                                                                       |
| Change how videos are made (hook/motion/pacing/length/captions) | `pipeline/shared/formats/default.json` — the **format recipe** (one place; resolved by `pipeline/shared/lib/format.mjs`) |

## The skills (auto-invoked per task)

Each skill is the **single source of truth** for that step. Open it FIRST, then act.

| Step                                                                       | Skill file                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| **Implement/fix/refactor ANY code (the engineering cycle — every change)** | `.claude/skills/build-sprint/SKILL.md`           |
| Find/score a topic from the idea-bank                                      | topic logic in `pipeline/00-ideas` + WORKFLOW.md |
| Write the script (per archetype + angle)                                   | `.claude/skills/script-writing/SKILL.md`         |
| Fact-check & source the script (generate + verify)                         | `.claude/skills/fact-check/SKILL.md`             |
| Review/QA the script                                                       | `.claude/skills/script-review/SKILL.md`          |
| Build the scene plan (templates)                                           | `.claude/skills/storyboard/SKILL.md`             |
| Thumbnail / occasional asset prompts                                       | `.claude/skills/visual-prompts/SKILL.md`         |
| Plan & guide a screen-capture demo                                         | `.claude/skills/screen-capture/SKILL.md`         |
| Synthesize voice + align                                                   | `.claude/skills/voice-synthesis/SKILL.md`        |
| Render the video (Remotion / engine)                                       | `.claude/skills/video-render/SKILL.md`           |
| QA the final video                                                         | `.claude/skills/qa-video/SKILL.md`               |
| Prepare & publish to YouTube                                               | `.claude/skills/youtube-publish/SKILL.md`        |

> `translation-localization` and `TERMBANK.md` are **retired** (no second language) — see
> their tombstone notes.

## The four video archetypes

The system cycles through these; the topic is classified into one (Gate 1, auto). Each scene
gets a `template` tag mapped deterministically to a render component. See
`style/VISUAL_IDENTITY.md` for the scene vocabulary.

1. **Ideas/Listicle** — "N ways AI can automate X", full code-driven visuals.
2. **Mini-demo** — a trivial real example recorded in OBS; auto-zoom + "scale it".
3. **Diagram/Architecture** — narrated, code-drawn animated diagram.
4. **Comparison** — "best tool/model for X".

## The pipeline (code)

Numbered phases under `pipeline/`. Each reads the previous phase's output from the video's
`content/<id>/` folder and writes its own. Phases are **idempotent and resumable**
(`docs/ARCHITECTURE.md` → "Pipeline contract").

```
pipeline/00-ideas → 01-script → 02-voice → 03-visuals → 04-render → 05-qa → 06-publish
```

## One topic = one folder

Every video lives in `content/<NNN>-<slug>/` (skeleton `content/_TEMPLATE/`). The **Short
nests inside** at `…/short/` — a lean sub-unit with its own `script.json`/`voice/`/
`scene-plan.json`/`alignment.json`/`video/`, inheriting the topic, angle and sources. Render
it with `build-props.mjs <id>/short` (it detects the Short by the last path segment).
**Per-video content + the idea-bank are git-ignored; only `_TEMPLATE` and the system
(code/docs/skills/schemas/templates) are committed**; media is ignored everywhere. (Legacy:
001/002 and `002-short`/`003-short` stay tracked/flat for history; the Serbian
`001-sta-je-ai/` is archived under tag `serbian-ai-archive`.)

## How to start a new video

Run `/novi-video` (`.claude/commands/novi-video.md`) or follow `docs/WORKFLOW.md`: copy
`_TEMPLATE`, pick a scored idea, then walk the phases, honoring the gates.

## Golden rules (do not violate)

- **Never `git commit` or `git push` unless the owner explicitly asks — every time.** Finishing
  a task or a "continue" is NOT commit permission; leave changes in the working tree. Offer push
  separately.
- **Never delete/overwrite an existing file or asset without asking first** (principle 6).
- **Every code change runs the build-sprint cycle** (atomize → build → self-test → fix → docs);
  `npm test` must be green (Stop hook enforces). No second-model verification — the owner reviews.
  Not for planning/research/doc-only edits. See `.claude/skills/build-sprint/SKILL.md`.
- Free/local first (flag any cost); original English scripts only, each with a human angle;
  one continuous audio track; synthetic demo data; review agent before human; human approves
  the final video. _(All expanded in the operating principles above.)_
- Keep this file thin. New rules go in the relevant skill or `style/` file.

## Behavioral guidelines (coding defaults)

**These are defaults, not laws.** An explicit instruction that contradicts one overrides it —
if asked to refactor, refactor; if asked for an abstraction, build it. They bias toward caution
over speed; on trivial or low-risk edits apply them lightly and don't over-ceremony.

1. **Think before coding.** State assumptions; surface tradeoffs; don't hide confusion. Ask
   **only** when the ambiguity would change what you build and context can't resolve it —
   otherwise proceed on the sensible default and say which one you took. If a simpler approach
   exists, push back before building the complex one.
2. **Simplicity first.** Write the minimum code that solves _this_ task — no speculative
   abstractions, single-use indirection, or unrequested config/flexibility. Test: would a senior
   engineer call it overcomplicated? (Shortening _existing, working_ code is a refactor — only
   when asked; see rule 3.)
3. **Surgical changes.** Touch only what the task requires; match existing style; don't fix or
   refactor neighboring code that isn't broken — **unless that cleanup is the request.** Flag
   unrelated dead code, don't delete it; remove only the orphans your own change created. Every
   changed line should trace back to the request.
4. **Goal-driven execution.** Turn vague asks into verifiable targets before coding: "add
   validation" → "write tests for invalid inputs, then make them pass"; "fix the bug" → "write a
   failing test that reproduces it, then make it pass." For multi-step work, state a brief plan
   with a verify-check per step.
