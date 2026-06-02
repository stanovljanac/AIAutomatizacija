# Boring AI Automations

An automated, mostly-hands-off **YouTube content factory** for professional,
**English-language**, **faceless** videos about **boring, everyday AI automations** —
the small back-office tasks everyone ignores (data entry, invoicing, scheduling,
reminder/invite emails, simple record-keeping).

> **New here? Read this top to bottom once.** It's written so someone who has never
> seen this project can understand how it works and run it.
>
> _This project pivoted from a Serbian-AI channel. The old work is preserved under git
> tag `serbian-ai-archive`. Why we pivoted: `docs/DECISIONS.md` D-011…D-019._

---

## The idea in one paragraph

We mine a scored **idea-bank** of boring automation tasks for **topics**. For a chosen
idea we pick one of four **archetypes**, draft an **original angle**, write a 100%
original **English script** (never a translation), generate an **English AI voice-over**
(edge-tts), build **fixed-template visuals** (clean motion graphics + code-drawn
diagrams + the occasional real screen-recording you make in OBS), assemble it in code
(Remotion), automatically **QA** it (audio/subtitle/scene sync), and after a human
approval, publish to YouTube — title, description, tags, chapters, thumbnail, and a
Short included.

## Why it's built this way

- **Free + local first.** The core runs on your PC (edge-tts + Remotion + stock). Cloud
  is optional. See `docs/TOOLS.md`.
- **Originality protects the channel.** YouTube demonetizes "reused content" and
  templated AI-slop. We take ideas, not sentences, and **every script carries an
  original human angle**. See `style/STYLE_GUIDE.md`.
- **Quality first**, then speed, then cost.
- **The human stays in control** at three gates: topic+angle+type, script, final video.

## How the system is organized

```
CLAUDE.md            ← the router the AI agent reads first
docs/                ← the "brain": product, architecture, tools, workflow, roadmap
.claude/skills/      ← one skill (rulebook) per production step
.claude/commands/    ← slash commands like /novi-video
style/               ← identity: tone, visual look, channel/SEO
pipeline/            ← the code, as numbered phases 00→06
templates/remotion/  ← the reusable video project (intro/outro/scene templates)
content/             ← one folder per video (media is git-ignored)
assets/              ← shared fonts, sfx, icons
scripts/             ← helper scripts (setup, OBS profile, optional colab)
```

Full map: `docs/ARCHITECTURE.md`.

## The four archetypes

1. **Ideas/Listicle** — "N ways AI can automate X" (full code-driven visuals).
2. **Mini-demo** — a trivial real example you record in OBS + "scale it".
3. **Diagram/Architecture** — narrated, code-drawn animated diagram.
4. **Comparison** — "best tool/model for X".

## The production flow (high level)

```
idea → [GATE ① topic+angle+type] → script → [GATE ② script] → voice + scene-plan
     → (capture, mini-demo only) → render → auto-QA → [GATE ③ final video] → publish
```

Detailed: `docs/WORKFLOW.md`.

## Quick start

1. Install everything: follow `docs/SETUP.md` (Windows).
2. Read `docs/ROADMAP.md` for the current phase.
3. Start a video: run `/novi-video` (or copy `content/_TEMPLATE`).

## Tech at a glance (free + local by default)

- **Brain / automation:** Claude Code + Node/Python scripts
- **Script / QA / angle:** Claude Code subscription
- **Voice:** **edge-tts** (free, local, English) — one consistent channel voice
- **Visuals:** fixed-template motion graphics + code-drawn diagrams (Remotion); your OBS
  captures for mini-demos; free stock (Pexels/Pixabay); rare opt-in AI images
- **Render:** Remotion (Phase-2 bake-off vs HyperFrames), local
- **Publish:** YouTube Data API (semi-automatic; human confirms)

Why each tool, with links and limits: `docs/TOOLS.md`.

## Status

See `docs/ROADMAP.md` (phases) and `docs/PROGRESS.md` (log).

## License / usage

Private project. Output is original English-language content. Source material is used
only for topic discovery and fact-checking, never reproduced. See
`style/STYLE_GUIDE.md` → "Originality & sourcing".
