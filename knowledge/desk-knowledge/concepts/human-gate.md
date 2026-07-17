---
type: concept
status: stable
created: 2026-07-16
updated: 2026-07-16
related: [verdict-stamp.md, agent.md, failure.md, ../../../style/MOTION_SPEC.md]
depends_on: [index.md]
---

# The human gate — a barrier that HALTS a flow until a person passes it

**Purpose:** record how this channel has drawn the human checkpoint — the single most-reused
subject in the library (10 scenes) — so the next one is authored against what already landed.
**When to read:** read this before authoring any beat where a human approves, checks, blocks,
or is asked to decide; also read it before drawing any "flow with a checkpoint in it".
**Do not duplicate:** if writing about the gate/checkpoint metaphor, extend this file instead
of creating a new one; the **stamp that lands the verdict** is [verdict-stamp](verdict-stamp.md)
and the **judgment itself** is [agent](agent.md).

## The subject

The channel's thesis subject. It is the answer to *"where do you trust the machine?"* — never
"AI is useless". The gate is the place a flow **stops** and a person decides. It carries the
channel's whole [trust-design altitude](../lessons/2026-07-12-story-strength-scored-at-the-idea.md):
the video is not about the automation, it is about where a human stays in the loop.

## Metaphors used (and the scene that owns each)

| Metaphor | Scene | Video | The move |
|---|---|---|---|
| **Pillar in a flow** — draft → gate → shipped | [human-gate](../../../templates/hyperframes/scenes/human-gate/index.html) | 010 s12 | gate labelled `money · law · reputation`; gold ✓ pops; only then SHIPPED |
| **Full-frame portcullis** — the line smear-STOPS | [human-gate-one](../../../templates/hyperframes/scenes/human-gate-one/index.html) | 012 s09 | a massive gold gate *lowers over the whole frame*; the page gets visibly READ (highlight bar walks the lines, margin note lands), APPROVED stamps, line restarts |
| **The owner's hands** — a cursor presses PUBLISH | [gate-two-publish](../../../templates/hyperframes/scenes/gate-two-publish/index.html) | 012 s13 | player scrub, private draft, disclosure toggle → YES, a **human cursor** clicks |
| **Validation gate + quarantine** — the machine's own gate | [bad-row-gate](../../../templates/hyperframes/scenes/bad-row-gate/index.html) | (owner request 2026-06-13) | one bad row (`31/02/2026`) is rejected with a *reason* and diverted; the clean table never sees it |
| **Gate glyphs as a planted motif** | [verdict-not-trusted](../../../templates/hyperframes/scenes/verdict-not-trusted/index.html) | 012 s02 | two gold gate glyphs *rise* early — planting the shape s09/s13 pay off |
| **Territory + halting token** | [pipeline-recap](../../../templates/hyperframes/scenes/pipeline-recap/index.html) | 012 s14 | 11 nodes; a gold token flows end-to-end and visibly **HALTS at both gates** |
| **Word-world** — GATE as a full-frame letterform | [steal-the-shape](../../../templates/hyperframes/scenes/steal-the-shape/index.html) | 012 s16 | gold bars lower *inside* the letters, light comes through |
| **The gap itself** | [trust-gap](../../../templates/hyperframes/scenes/trust-gap/index.html) | 010 s07 | no gate drawn — the *absence* pulses gold, labelled "the point of trust" |
| **One glance, not a hundred** | [only-flags](../../../templates/hyperframes/scenes/only-flags/index.html) | 008 s09 | a "glance" ring lands on the **one** flagged row — the human checks 1, not 100 |
| **Kept judgment** (the inverse) | [fp-kept-judgment](../../../templates/hyperframes/scenes/fp-kept-judgment/index.html) | 017 s4 | the agent *chose silence* on cosmetic changes; `alerts sent: 0` |

## What landed (owner verdicts)

- **012 is the locked visual floor** (owner, 2026-07-10) — and `human-gate-one` is one of its
  scenes. Its move is the one to beat: **the gate is an event, not a label.** The production line
  physically halts, the gate has mass and lowers, and the page is **visibly read** before it is
  approved. Reading-then-approving is what makes it a *human* gate rather than a checkpoint icon.
- **Plant the shape early, pay it off late.** `verdict-not-trusted` (s02) raises gate glyphs
  ~7 minutes before `human-gate-one` (s09) uses them. Repetition of a *shape* across a video is
  earned continuity; repetition of a *scene* is a template.
- **The gate is worth more when the token stops.** `pipeline-recap`'s halting gold token is what
  makes an 11-node diagram legible in a Short — motion carries the meaning, not the labels.

## What was rejected (owner verdicts — dated, never the agent's own opinion)

- **Frameworks drawn as three-icons-in-a-row** (owner, 2026-07-09) — a gate rendered as one icon
  in a `[draft] → [gate] → [ship]` strip is a reject. Give the concept **full-stage treatment**;
  `steal-the-shape` exists *because* of this ban ("NEVER three icons in a row"). See the
  [lesson](../lessons/2026-07-09-no-flow-strip-framework-visuals.md).
- **A gate that is only a caption on a card** — a title-card scene; the standing
  [reject](../lessons/2026-06-28-title-card-scenes-get-rejected.md).

## Recurring elements

- A **label that names the stakes**, not the mechanism: `money · law · reputation`,
  `GATE 1 — A HUMAN`, `true? original? watchable?`. Never "validation step".
- **Evidence of reading** — a highlight bar walking the lines, a margin note (`tighten this ✎`),
  a scan. A gate that approves *instantly* reads as a rubber stamp.
- **A gold ✓ / APPROVED that arrives late and big** (`scale(2.2)`→`1`), then the flow resumes.
- **Something on the far side** — SHIPPED, a clean table, a restarted line. The gate must have a
  visible *consequence* or it is decoration.
- **The rejected thing goes somewhere** — quarantine tray, held-back card. Never just deleted.

## Colors & proportions

- **The gate is always GOLD** (`#FFB020`, border `rgba(255,176,32,0.4–0.7)`, glow
  `0 0 40–50px rgba(255,176,32,0.25–0.6)`) on a dark warm fill (`#211d12` → `#171207`).
  The thing being gated is **blue** (`rgba(79,140,255,0.35)` borders, `#8fb6ff` text). This is
  the semantic split: **blue = the machine's work · gold = the human's judgment.**
- Two proven scales: a **pillar** ~`360px × --u` beside a ~`300×360` doc with `70px` gap
  (`human-gate`), or **full-frame** — `inset: 0 0 19.5% 0`, beam at `top:6%`, four bars, gate
  starts at `translateY(-105%)` and lowers (`human-gate-one`). Full-frame is the 012-floor version.
- Portrait: the flow turns **vertical** (`.portrait .flow { flex-direction: column }`) — the gate
  lowers across the narrow axis, which is *stronger* than the landscape version.

## Avoid

- A gate that **approves without reading** — no scan/highlight/note = rubber stamp.
- A gate as **one icon in a horizontal strip** (2026-07-09 ban).
- Drawing the gate when the beat is really about the **verdict** ([verdict-stamp](verdict-stamp.md))
  or about **who decided** ([agent](agent.md)). The gate is the *halt*.
- Re-using `human-gate` (010) when the video needs its own — 012 authored `human-gate-one`
  as an **all-new asset** rather than reskinning, and that is the standard. Reused components
  must at minimum be [prop-driven](../lessons/2026-07-07-reused-components-must-be-prop-driven.md).

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [The agent — the gold node that JUDGES (vs the scraper that reports)](agent.md)
- [Failure — the silent one is the villain; the loud one is the hero](failure.md)
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md)
- [The verdict stamp — how a judgment LANDS](verdict-stamp.md)
