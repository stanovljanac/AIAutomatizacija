# PRD — Product Requirements Document

**Project:** The Automation Desk — automated, faceless, **English** YouTube channel
**Owner:** solo creator
**Status:** Phase 0 (re-founding after the Serbian-AI pivot) — see `docs/ROADMAP.md`
**Last updated:** 2026-06-02
**Pivot rationale:** `docs/DECISIONS.md` D-011…D-019.

---

## 1. Problem & opportunity

English YouTube is saturated with "AI/tech" and with **big-system** automation
content (huge Zapier/n8n builds). Almost nobody covers the **small, boring, everyday
back-office tasks** people still do by hand — data entry, invoicing, shift scheduling,
reminder/invite emails, simple record-keeping. These are:

- high **search intent** ("how to automate X in Excel/Sheets/Outlook…"),
- high **RPM** (B2B/software advertiser interest),
- **low competition** (too dull for most creators),
- and watched by **builders** who turn each idea into paid work for clients.

There is a window to own the "boring automation ideas" niche, faceless and in English,
fully produced by an automated pipeline.

The constraint: the owner has limited time (~10h/week, variable), **no video-editing
skill**, and an old PC. So the channel **must be automated** — the owner only reviews
at gates and records the occasional tiny screen demo.

## 2. Goal

A **robust, mostly-hands-off system** that turns a *scored idea* into a *published,
professional English video* with minimal human time — the human only reviews at three
gates (topic+angle+type, script, final video) and records short OBS demos for the
mini-demo archetype.

Success = "pick a top idea, get a publish-ready video that needs only a quick review."

## 3. Non-goals (out of scope, for now)

- Word-for-word translation/dubbing of anyone's video. **Never.**
- A second output language (English only; YouTube auto-captions can add others later).
- Full done-for-you systems built on-camera. We give **ideas + minimal examples**; the
  viewer scales them. We are not free consultants.
- Paid products/memberships/affiliate (deferred — D-017).
- A web dashboard / SaaS. CLI + Claude Code is enough.
- Paid tools as defaults. Paid is fallback only, documented and opt-in.

## 4. Target user (the channel's audience)

Builders / freelancers / automation & no-code agencies who **create automations for
other people** and want resell-able inspiration; secondarily, curious small-business
owners. Tone = a **sharp practical engineer who also teaches warmly**: the lazy-smart
shortcut, beginner-accessible, light dry wit, no hype. (STYLE_GUIDE §1.)

## 5. Content strategy

- **Four archetypes** (cycled; I classify, owner approves):
  1. **Ideas/Listicle** — "N ways AI can automate X" (full code-driven visuals).
  2. **Mini-demo** — a trivial real example recorded in OBS + "scale it".
  3. **Diagram/Architecture** — narrated, code-drawn animated diagram.
  4. **Comparison** — "best tool/model for X".
- **Depth:** conceptual + a minimal example; sometimes ideas only. Always close with
  "scale this to your own process." Synthetic demo data only.
- **Formats:** long-form (length by type) + 1-2 auto-repurposed **Shorts** each.
- **Cadence:** on-demand, idea-bank **score order**; no rigid schedule.
- **Pillars:** organized by painful task (see `style/CHANNEL.md` §5).

## 6. Hard requirements

### 6.1 Originality & legal
- R1. Sources are used for **topics and facts only**, never reproduced sentences.
- R2. No word-for-word translation of any third-party script.
- R3. Visuals and voice are our own; tool screenshots are of our own (synthetic-data) sessions.
- R4. **Every script carries an original human angle** (owner-approved at the script gate).
  This is the anti-"AI-slop" / monetization safeguard. (D-018.)
- R5. We do **not** scrape YouTube transcripts (ToS risk). Facts come from docs, blogs,
  vendor pages, release notes. (DECISIONS D-002.)
- R6. **Sourcing rigor is hybrid by type:** Comparisons/stats require `sources.md`;
  Ideas/Demo rely on tested feasibility + the angle; pure-conceptual ideas are clearly
  framed as "an idea."

### 6.2 Language & script quality (see `style/STYLE_GUIDE.md`)
- R7. Output language is **English**; code/docs also English.
- R8. Clear, fluent, calm pacing; one idea per sentence so every step is heard.
- R9. Script is **scene-segmented** with a `template` tag per scene so downstream
  automation maps text → audio → fixed render component cleanly.
- R10. Every script passes the **review agent** and is corrected before a human reads it.

### 6.3 Audio/visual sync (the "voice gets cut when scene changes" problem)
- R11. The voice-over is **one continuous track** generated from the whole script;
  it is **never cut**.
- R12. Scene changes happen on **sentence boundaries**, using forced-alignment
  timestamps; subtitles use the same timestamps. See `voice-synthesis` skill.

### 6.4 Quality control & gates
- R13. Automated QA runs before any human review (script QA + video QA).
- R14. QA **auto-fixes pure technical breakage** (no audio / cut-off / missing captions)
  and **flags content issues** for the owner to approve a fix; it emits a **30s digest**.
- R15. **Three human gates:** ① topic+angle+type, ② script, ③ final video. Storyboard is
  automatic (fixed templates). Mini-demo inserts a capture step before the final gate.

### 6.5 Cost & hardware
- R16. Default cost = **$0**. The core stack is **local** (edge-tts + render + stock).
- R17. The owner's PC is the orchestrator + renderer. **Cloud GPU (Colab/Kaggle/HF) is
  optional, opt-in** for occasional AI images only; AI-video is deferred. (D-015.)
- R18. Any cloud/heavy step stays **idempotent, resumable, and cached**.

### 6.6 Engineering
- R19. Monorepo, clearly foldered, each segment with its own rulebook.
- R20. `CLAUDE.md` is a thin router; rules live in the relevant skill/style file.
- R21. Code, docs, **and** channel output in English.
- R22. Media out of git; only text/JSON/config committed.
- R23. Documentation written as if for a team.

## 7. The system, in one diagram

```
            ┌─────────────────────────────────────────────────────────┐
            │                     ORCHESTRATOR                          │
            │              Claude Code (on your PC)                     │
            └─────────────────────────────────────────────────────────┘
   idea         script         voice           visuals        render   publish
 ┌────────┐  ┌──────────┐   ┌──────────┐    ┌──────────┐   ┌────────┐ ┌────────┐
 │00-ideas│→ │01-script │ → │02-voice  │ →  │03-visuals│ → │04-rend.│→│06-pub. │
 │ score  │  │ write+QA │   │edge-tts  │    │templates │   │engine  │ │ YT API │
 └────────┘  └────┬─────┘   │ +align   │    │+captures │   └───┬────┘ └───┬────┘
   GATE 1 ───────►│ GATE 2  └──────────┘    └────┬─────┘       │ 05-qa    │
 topic+angle+type │ script      (capture step for mini-demo) ─►│ auto QA  ▼
                  ▼             ▼                              ▼ →digest→ GATE 3 → human ok
```

## 8. Definition of done — MVP (pilot video)

A single video that proves the pipeline end to end:
- Archetype: an **Ideas/Listicle or Diagram** topic (full-AI path, no capture).
- English narration via **edge-tts** (single channel voice).
- Fixed-template visuals (motion-graphics / code-drawn diagram), burned-in animated
  English captions, **perfect audio/caption/scene sync** (R11–R12).
- An **original human angle** present and owner-approved.
- Passed automated QA (digest), then approved by the human.
- A reusable intro/outro and a generated **thumbnail (2 variants)**.
- Plus **one Short** derived from the same script.

When this exists and is repeatable, everything else is iteration.

## 9. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Templated "AI-slop" demonetization | Mandatory human angle (R4/D-018); varied archetypes; real examples |
| Render engine is the hard-to-swap core | Phase-2 bake-off Remotion vs HyperFrames before building the library (D-019) |
| Many similar "automate X" videos feel samey | Rich scene vocabulary; rotate task/sector/tool; metrics-driven re-rank |
| Cloud fragility breaks hands-off runs | Local-first core; cloud is opt-in only (D-015) |
| New niche on an old account flagged | Full EconVault repurpose, clean keywords (D-016) |
| Scope creep into full system builds | "Ideas + minimal example" rule; non-goal §3 |

## 10. Open questions (tracked, not blocking)

- OQ1. Render engine: Remotion-solo vs Remotion+HyperFrames combo? (Resolve in Phase 2 bake-off.)
- OQ2. Which edge-tts EN voice becomes the channel voice? (A/B listen in Phase 1.)
- OQ3. EconVault rename timing vs current YouTube rule? (Verify before first publish.)

Decisions are logged in `docs/DECISIONS.md`.
