---
type: concept
status: stable
created: 2026-07-16
updated: 2026-07-16
related: [spreadsheet.md, verdict-stamp.md, agent.md, overload-pile.md]
depends_on: [index.md]
---

# The source document — the flat page the work comes from (receipt · invoice · email · ToS · filing)

**Purpose:** record the channel's most-drawn *object* (11+ scenes) — the page that gets read,
retyped, scanned, judged, or stamped — and the one form it always takes.
**When to read:** read this before drawing any document, page, receipt, invoice, email, contract,
policy sheet, or script page — i.e. before nearly every body scene.
**Do not duplicate:** if writing about how documents are drawn, extend this file; where the
document's data **lands** is [spreadsheet](spreadsheet.md); **many** documents at once is
[overload-pile](overload-pile.md).

## The subject

Whatever the video is about, the work starts on a page. The channel has drawn it as a receipt
photo, an order email, a Terms-of-Service page, a legal filing, a policy sheet, a `script.json`
page, a daily report, and an invoice — and **always in the same form**: a flat, face-on card with
a dark gradient fill, a blue border, and **abstract "lines" instead of real text**.

That abstraction is the load-bearing decision. Lines (not lorem text) mean the viewer *recognizes
a document* in <1s without reading, which is what mobile legibility and the §0 instant-legibility
bar require. Only the 1–3 strings that carry the beat are real: a tag (`DRAFT ANSWER`), a header
(`script.json · v3`), a total (`??.??`), a date (`31/02/2026`).

> **Naming note.** The subject was scoped as "invoice" when this note was planned. Built bottom-up
> from the scenes, the recurring object is the **source document** — the invoice/receipt is one
> skin of it. `steal-the-shape` (012 s16) makes the generalization itself the payoff:
> video → invoice → inbox → report.

## Metaphors used (and the scene that owns each)

| Skin | Scene | Video | The move |
|---|---|---|---|
| **Draft answer** — lines + a `DRAFT ANSWER` tag | [human-gate](../../../templates/hyperframes/scenes/human-gate/index.html) | 010 s12 | `300×360px × --u`, blue border, 3 lines. The canonical form |
| **A script page that gets READ** | [human-gate-one](../../../templates/hyperframes/scenes/human-gate-one/index.html) | 012 s09 | `script.json · v3`; a highlight bar **walks the lines**; a margin note `tighten this ✎` lands |
| **Terms of Service + a watcher badge** | [fp-noise-pile](../../../templates/hyperframes/scenes/fp-noise-pile/index.html) | 017 s2 | trivial diffs highlight on the page (synonym swap, ¶ moved, date reflow) — **visibly cosmetic** |
| **The same ToS, judged** | [fp-decision-card](../../../templates/hyperframes/scenes/fp-decision-card/index.html) | 017 s3 | the agent pulls **the same page** in; ONE scan line; the page **dims** and the decision card takes over |
| **A legal filing** | [cite-collapse](../../../templates/hyperframes/scenes/cite-collapse/index.html) | 010 hook | scrolls up; four gold citations; red stamps land row by row |
| **A receipt (crumpled, real)** | [monthly-retype](../../../templates/hyperframes/scenes/monthly-retype/index.html) | 008 s02 | a pile of them + hand-typing — the chore |
| **A receipt that resists** | [limits-privacy](../../../templates/hyperframes/scenes/limits-privacy/index.html) | 008 s11 | a **scrawl** receipt with a red ✗ — handwritten/blurry isn't read; it loves print. The honest limit |
| **Photos in, rows out** | [receipts-hook](../../../templates/hyperframes/scenes/receipts-hook/index.html) | 008 hook | receipt photos **fly in** and become rows |
| **An order email** | [wh-slow-machine](../../../templates/hyperframes/scenes/wh-slow-machine/index.html) | 014 s2 | one open email beside the sheet; fields lifted out by hand |
| **An official policy sheet** | [policy-punchline](../../../templates/hyperframes/scenes/policy-punchline/index.html) | 012 s03 | **unrolls over** the frozen pile; marker sweeps on the beats; date + source chip; DEMONETIZED strike |
| **The prompt itself** | [prompt-card](../../../templates/hyperframes/scenes/prompt-card/index.html) | 010 s11 + Short | full-frame, centered, large, held for **pause & screenshot** |

## What landed (owner verdicts)

- **The same document across scenes.** 017 draws one ToS page in s2 (over-alerting on it) and s3
  (judging it) — *"the SAME ToS page"*. One object, two beats, is continuity; two similar objects
  is a template.
- **The document reacts to being read** — a highlight bar walking the lines, a margin note, a dim
  on scan, marker sweeps landing **on the narration's stressed syllable**. A static page is a prop;
  a page that responds is a scene.
- **Full-frame and centered for anything screenshotable** (`prompt-card`, owner rule 2026-07-03):
  **NEVER a corner PiP, NEVER zoomed**. Hold it long enough to pause and screenshot. This is the
  channel's "lead with a copy-pasteable prompt" move.
- **Show the document's limit honestly** (`limits-privacy`): the scrawl receipt with a red ✗ is the
  channel admitting what doesn't work — and it ships with an on-screen source chip beside the claim.
- **Sourced pages carry their source on screen** — `policy-punchline` lands the date + source chip
  before the strike (D-026, [DECISIONS](../../../docs/DECISIONS.md)).

## What was rejected (owner verdicts — dated, never the agent's own opinion)

- **Flattening a document beat into a card.** `limits-privacy` and `monthly-retype` were both
  **restored from the script's bespoke intent after the storyboard flattened them to a card** —
  and `limits-privacy` specifically gives each of its three notes **its own small illustration
  "so it is not a reskinned icon-list"**. Standing
  [reject](../lessons/2026-06-28-title-card-scenes-get-rejected.md).
- **A real case / real client data.** Citations and case names in 010 are **synthetic and
  illustrative — invented, never a real cited case**; receipts and orders are synthetic. Both are
  stated in the scene comments as hard constraints.
- **A corner PiP or a zoom** for a document the viewer is meant to read (owner, 2026-07-03).
- **3D-tilted pages** ([lesson](../lessons/2026-07-12-no-3d-tilt-on-content-cards.md)) — flat,
  face-on. The 3D flip is a transient reveal only.

## Recurring elements

- **Abstract lines, not text:** `height: 12–14px × --u`, `border-radius: 6–7px × --u`, `width: 88%`
  with a `.short` variant at `52–58%`. Two or three lines read as "a document" instantly.
- **A tag / header** in blue-2 (`#8fb6ff`), weight `800–900`, that names what the page *is*.
- **1–3 real strings** — the ones the beat needs. Everything else stays abstract.
- **A badge pinned to it** (a watcher eye, a version) when the page has a state.
- **Evidence of reading** — highlight bar, margin note, scan line, marker sweep.

## Colors & proportions

- **The canonical card:** `width ~300–560px × --u`, fill `linear-gradient(180deg, #1a2432, #141c28)`,
  border `1.5–2.5px × --u solid rgba(79,140,255,0.35–0.55)`, radius `16–18px × --u`, shadow
  `0 18–24px 46–60px rgba(0,0,0,0.45–0.6)`. This exact recipe recurs across the library — match it.
- **Blue = the document (the machine's material). Gold = what a human/agent did to it** —
  highlights `rgba(255,176,32,0.22)` with a `0.5` border, notes, marker sweeps, the verdict.
- **Portrait:** widen and shorten (`.portrait .doc { width: 360px; height: 280px }`) rather than
  scaling the whole card down.

## Avoid

- **Lorem ipsum or realistic body text** — unreadable, and it invites reading instead of watching.
- **A document that just sits there** while narration describes it.
- **Real names, real cases, real client data** — synthetic always, and say so in the scene comment.
- **A page skin chosen for decoration.** The skin must be the viewer's *own* document — their
  invoice bot, their inbox, their ToS ([overload-pile](overload-pile.md)'s recognition rule).

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [The overload pile — inbox, feed, swarm: making the viewer FEEL "too much"](overload-pile.md)
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md)
