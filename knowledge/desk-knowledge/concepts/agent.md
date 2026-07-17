---
type: concept
status: stable
created: 2026-07-16
updated: 2026-07-16
related: [human-gate.md, verdict-stamp.md, overload-pile.md, ../../../docs/CHANNEL_MAP.md]
depends_on: [index.md]
---

# The agent — the gold node that JUDGES (vs the scraper that reports)

**Purpose:** record how the channel draws "an AI agent" — the subject the channel's altitude
shifted toward — so the distinction that defines it (judgment, not watching) stays visible.
**When to read:** read this before any beat where an AI *does* something: watches, decides,
filters, drafts, reviews, acts. Also read it before drawing a machine node of any kind.
**Do not duplicate:** if writing about how the agent/machine is depicted, extend this file; the
**human** counterpart is [human-gate](human-gate.md), the **decision landing** is
[verdict-stamp](verdict-stamp.md), and what it filters is [overload-pile](overload-pile.md).

## The subject

The channel's Phase-2 altitude ("AI at work" — agents, verification, human checkpoints; theme:
**trust design in AI workflows**; see [CHANNEL_MAP](../../../docs/CHANNEL_MAP.md)). Note that
`CLAUDE.md` still describes the older Phase-1 framing — the docs lag; this note follows the scenes.

**The one distinction the channel exists to draw:** a **scraper watches and reports everything**;
an **agent decides what matters**. 017 is built entirely on it — *"That's a scraper, not an agent"*
→ *"an agent decides which change actually matters"*. Every agent drawing should be able to answer
"what did it choose **not** to do?"

## Metaphors used (and the scene that owns each)

| Metaphor | Scene | Video | The move |
|---|---|---|---|
| **Radar beam + ping swarm** (the *anti*-agent) | [fp-ping-flip](../../../templates/hyperframes/scenes/fp-ping-flip/index.html) | 017 s1 | scraper POV: dumb relentless "changed / changed / changed" pings; on the thesis they **freeze, gray out**, then funnel into a gold agent node |
| **The gold node pulls the page in** | [fp-decision-card](../../../templates/hyperframes/scenes/fp-decision-card/index.html) | 017 s3 | ONE gold scan line, then a hero **decision card** assembles — *"don't list the changes — judge them"* |
| **Stamping restraint** | [fp-kept-judgment](../../../templates/hyperframes/scenes/fp-kept-judgment/index.html) | 017 s4 | it read six changes and chose silence on three; `alerts sent: 0`. The agent-vs-alarm proof |
| **Two agents volleying** | [writer-vs-reviewer](../../../templates/hyperframes/scenes/writer-vs-reviewer/index.html) | 012 s07 | writer ↔ reviewer; a different REJECT reason each pass; the doc **edits itself**, v1→v3 |
| **A swappable engine slot** | [swappable-engine](../../../templates/hyperframes/scenes/swappable-engine/index.html) | 008 s06 | the rail `[photos] → [ your engine ] → [rows]` is fixed; the **middle chip swaps** (AI assistant · Vision API · Doc AI) while everything else stays identical |
| **"Running…" then the cascade** | [wh-one-pass](../../../templates/hyperframes/scenes/wh-one-pass/index.html) | 014 s3 | 40 cards funnel into a gold node; the work **visibly runs** before the result |
| **The agent halts and flags a human** | [failure-log](../../../templates/hyperframes/scenes/failure-log/index.html) | 012 s15 | on a real 503 the build **stops and asks** — the honest catch |
| **DRAFT / CHECK / GATE as word-worlds** | [steal-the-shape](../../../templates/hyperframes/scenes/steal-the-shape/index.html) | 012 s16 | the agent as a *shape* the viewer can steal, re-skinned video→invoice→inbox→report |

## What landed (owner verdicts)

- **Carry the node across scenes.** 017's gold agent node is *the same object* in s1, s3, s4
  (`fp-decision-card`: "the gold AGENT node **carried from s1**"). Continuity of one object across
  a video is what makes it feel like a character rather than a diagram legend.
- **The work must visibly run** — `wh-one-pass`'s "Running…" → cascade → counter race, and
  `fp-decision-card`'s single scan line. Narrating a result is the standing
  [reject](../lessons/2026-06-27-proof-must-be-visible.md); *one escalating chain* beats three
  parallel examples in a Short.
- **Show what it ignored.** 017 s4 is the library's strongest agent beat because it draws the
  **negative space** of the decision.
- **The tool is modular, the workflow is the focus** — `swappable-engine` keeps the rail fixed and
  swaps only the middle chip. This is also how the channel avoids being a tool tutorial.

## What was rejected (owner verdicts — dated, never the agent's own opinion)

- **Naming paid SaaS.** `swappable-engine` exists partly to **drop the Expensify / QuickBooks
  names the owner banned** — only generic or pre-approved (`brief.approvedTools`) engines appear.
  Enforced as a QA denylist.
- **The icon-list version of "the tool is swappable"** — `swappable-engine` replaced a **rejected
  icon-list**; and three-icons-in-a-row is banned outright (owner, 2026-07-09,
  [lesson](../lessons/2026-07-09-no-flow-strip-framework-visuals.md)).
- **A scanning animation for its own sake.** 017 s3's comment is explicit: *"VISIBLE PROOF, never
  a scanning animation for its own sake"* — one scan line, then the decision. Scanning is not
  thinking; deciding is.
- **Hardcoded strings in a reused agent scene** — a known live defect (`fp-*` scenes hardcode
  on-screen text, so scene-plan props are dead data). Standing
  [lesson](../lessons/2026-07-07-reused-components-must-be-prop-driven.md).

## Recurring elements

- **The gold node** — a glowing circular/orb node, `#FFB020`, that things **funnel into** and a
  judgment comes out of. It is the agent's body. Blue chips go in; a gold decision comes out.
- **A decision card** assembled **top→bottom in a fixed order** (chip → claim → evidence →
  verdict), FLAT and face-on, big and centered.
- **A gray wall / desaturated swarm** for the un-judged alternative — the scraper's output.
- **A state label the viewer recognizes:** `Running…`, `alerts sent: 0`, `v1→v3`, `40/40`.
- **A `?` resolving to a ✓** where judgment completes ([wh-takes-keeps](../../../templates/hyperframes/scenes/wh-takes-keeps/index.html)).

## Colors & proportions

- **Gold = the agent's judgment. Blue = its raw input/output.** The scraper's pings are gold *on
  black* while dumb, then **desaturate to gray** the moment the thesis lands — the color change
  *is* the argument.
- The node reads at Short scale: it is the **largest single object** in the frame at the moment it
  decides, and it sits clear of the bottom 19.5% caption band.
- Cards stay **flat and face-on** ([no 3D tilt](../lessons/2026-07-12-no-3d-tilt-on-content-cards.md));
  the 3D flip is reserved for the transient scraper→agent reveal (017 s5, 014 s5).

## Avoid

- **An agent that only watches** — that's a scraper; if the scene has no judgment, it has no agent.
- **A robot / brain / humanoid.** The library has none. The agent is a **node in a workflow**.
- **An agent with no visible restraint** — if it acts on everything, the viewer can't tell it from
  the alarm they already have.
- **Naming a paid tool** as the engine (owner ban) — generic, or pre-approved via `brief.approvedTools`.
- Drawing the agent when the beat is really the **human's** call — see [human-gate](human-gate.md).

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [Failure — the silent one is the villain; the loud one is the hero](failure.md)
- [The human gate — a barrier that HALTS a flow until a person passes it](human-gate.md)
- [The overload pile — inbox, feed, swarm: making the viewer FEEL "too much"](overload-pile.md)
- [The source document — the flat page the work comes from (receipt · invoice · email · ToS · filing)](source-document.md)
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md)
- [The verdict stamp — how a judgment LANDS](verdict-stamp.md)
