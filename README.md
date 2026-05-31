# AIAutomatizacija

An automated, mostly-hands-off **YouTube content factory** for professional,
**Serbian-language** videos about AI — news, model releases, tools, prompting
techniques, and tutorials.

> **New here? Read this top to bottom once.** It's written so that someone who has
> never seen this project can understand how it works and run it.

---

## The idea in one paragraph

We watch the global AI scene (YouTube channels, official blogs, docs, GitHub) for
**topics**. For a chosen topic we research the **facts** from clean, citable
sources, then write a **100% original Serbian script** (never a translation of
anyone's video), generate a **Serbian voice-over**, build **dynamic visuals**
(real tool screen-recordings + motion graphics + AI images), assemble everything
in code (Remotion), automatically **QA** it (audio/subtitle/scene sync), and after
a human approval, publish to YouTube — title, description, tags, thumbnail
included.

## Why it's built this way

- **Free first.** Every default tool is free. Paid upgrades are documented but
  off by default. See `docs/TOOLS.md`.
- **Originality protects the channel.** YouTube demonetizes "reused content," and
  translating someone's script is a copyright/ToS risk. We take ideas, not
  sentences. See `style/STYLE_GUIDE.md`.
- **Quality is the priority**, then speed, then cost.
- **The human stays in control** at three gates: script, storyboard, final video.

## How the system is organized

```
CLAUDE.md            ← the router the AI agent reads first
docs/                ← the "brain": product, architecture, tools, workflow, roadmap
.claude/skills/      ← one skill (rulebook) per production step
.claude/commands/    ← slash commands like /novi-video
style/               ← identity: tone, term bank, visual look, channel/SEO
pipeline/            ← the code, as numbered phases 00→06
templates/remotion/  ← the reusable video project (intro/outro/scenes)
content/             ← one folder per video (media is git-ignored)
assets/              ← shared fonts, music, captured screenshots
scripts/             ← helper scripts (setup, batch jobs)
```

Full map with explanations: `docs/ARCHITECTURE.md`.

## The production flow (high level)

```
topic → research → script → [HUMAN GATE] → voice + storyboard → [HUMAN GATE]
      → visuals → render → auto-QA → [HUMAN GATE] → publish
```

Detailed, step-by-step: `docs/WORKFLOW.md`.

## Quick start

1. Install everything: follow `docs/SETUP.md` (Windows).
2. Read `docs/ROADMAP.md` to see the current phase.
3. Start your first video: run `/novi-video` (or copy `content/_TEMPLATE`).
4. Learn from the worked example: `content/001-sta-je-ai/`.

## Tech at a glance (all free by default)

- **Brain / automation:** Claude Code + Node/Python scripts
- **Script / translation / QA text:** Claude Code subscription
- **Voice:** open-source TTS on free cloud GPU (Colab/Kaggle), with a paid
  ElevenLabs fallback if Serbian quality is insufficient
- **Visuals:** real screen recordings + Remotion motion graphics + free AI images
  (Flux/SDXL on Colab) + free stock (Pexels/Pixabay)
- **Render:** Remotion (free for individuals), locally first
- **Publish:** YouTube Data API (semi-automatic; human confirms)

Why each tool, with links and limits: `docs/TOOLS.md`.

## Status

See `docs/ROADMAP.md` (phases) and `docs/PROGRESS.md` (log).

## License / usage

Private project. Output is original Serbian-language content. Source material is
used only for topic discovery and fact-checking, never reproduced. See
`style/STYLE_GUIDE.md` → "Originality & sourcing".
