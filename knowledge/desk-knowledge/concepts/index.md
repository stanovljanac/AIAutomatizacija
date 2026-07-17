# Concepts — the visual vocabulary

The subjects this channel has drawn **more than once**, and how. Each note answers: *what
metaphors have we used for X, which ones landed, which the owner rejected, what elements /
colors / proportions recur, and what to avoid.*

**Built bottom-up from [`templates/hyperframes/scenes/`](../../../templates/hyperframes/scenes)**
(60 authored scenes as of 2026-07-16) — from the compositions themselves, not from the docs,
because the docs lag the scenes. A subject earns a note at **3+ independent drawings**.

## How to use this (read this line before the notes)

This is a **vocabulary as INPUT to [MOTION_SPEC §0](../../../style/MOTION_SPEC.md)** — the
strategist standard, where every scene is *conceived*. It is **never a selector**: you do not
open a note and pick a metaphor off it. §0 still applies in full — ask what the beat needs and
what the most disarming way to show it is, then author fresh. These notes exist so that
answer is informed by what the channel has already tried, and so a rejected metaphor is not
re-invented a fourth time. Reaching for a note as a template is the exact
[title-card / template failure](../lessons/2026-06-28-title-card-scenes-get-rejected.md) §0 bans.

**The "rejected" lines are the owner's verdicts only** — never the agent's review of its own
output. A self-graded KB is an echo chamber; only the owner's Gate-2 reject is signal. Every
rejection here is dated and traceable to an owner call. See the Phase 2b feedback loop in
[ROADMAP](../../../docs/ROADMAP.md).

## The shared substrate (true of ~every scene, so no note repeats it)

- **Gold `#FFB020` is the one constant** — 59 of 60 scenes. It is never decoration: gold marks
  **judgment, the human, and the thing that matters**. See [verdict-stamp](verdict-stamp.md).
- **Palette split** (owner, 2026-06-13, [VISUAL_IDENTITY](../../../style/VISUAL_IDENTITY.md)):
  heroes + intro/outro = **black + gold**; body = **blue + gold** (`--blue: #4F8CFF`, 23 scenes).
- **Semantic colors:** blue = the machine/draft · gold = judgment/human/kept · red `#ff5c5c` =
  loud failure (32 scenes) · green `#22D3A7` = passed/clean (15 scenes) · **gray = discarded,
  noise, or dead** (11 scenes desaturate something deliberately).
- **Everything scales by `--u`** — all 60 scenes. Never hardcode px.
- **The bottom ~19.5% is the caption band** (40 scenes pad for it explicitly); content fills the
  **top 5% → 85%** ([fill the stage](../lessons/2026-07-07-fill-the-stage-no-reflow-transitions.md)).
- **Cards rest FLAT and face-on**; 3D only as a transient reveal
  ([no 3D tilt](../lessons/2026-07-12-no-3d-tilt-on-content-cards.md)).
- **Silent + deterministic**, one paused seek-driven GSAP timeline, beats = sentences.
- **The plumbing of that substrate is ONE shared file** — `templates/hyperframes/_lib/hf-scene.js`
  (D-060 Phase 3, 2026-07-17). `--u`, the fps/frames/duration contract, `props`/`beats`, and the
  paused-timeline registration are no longer retyped per scene: a scene declares `var S = HF.scene({…})`
  and spends the rest of the file on art direction. gsap is vendored once at `_lib/gsap.min.js`.

<!-- AUTO-INDEX:BEGIN -->
- [The agent — the gold node that JUDGES (vs the scraper that reports)](agent.md) — concept, stable
- [Failure — the silent one is the villain; the loud one is the hero](failure.md) — concept, stable
- [The human gate — a barrier that HALTS a flow until a person passes it](human-gate.md) — concept, stable
- [The overload pile — inbox, feed, swarm: making the viewer FEEL "too much"](overload-pile.md) — concept, stable
- [The source document — the flat page the work comes from (receipt · invoice · email · ToS · filing)](source-document.md) — concept, stable
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md) — concept, stable
- [The verdict stamp — how a judgment LANDS](verdict-stamp.md) — concept, stable
<!-- AUTO-INDEX:END -->
