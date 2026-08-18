---
type: concept
status: stable
created: 2026-07-16
updated: 2026-07-16
related: [agent.md, spreadsheet.md, source-document.md, ../../../style/MOTION_SPEC.md]
depends_on: [index.md]
---

# The overload pile — inbox, feed, swarm: making the viewer FEEL "too much"

**Purpose:** record how the channel draws volume-as-a-problem (8 scenes) — the beat that earns
every automation the channel proposes — so it stays a felt experience, not a stated number.
**When to read:** read this before any beat about too many emails / alerts / files / videos /
messages, and before any hook that mirrors the viewer's own feed.
**Do not duplicate:** if writing about piles, feeds, swarms, inboxes, or "the volume problem",
extend this file; the **thing being piled** is [source-document](source-document.md) and what
sorts it is [agent](agent.md).

## The subject

The channel's most reliable **empathy** device. Named as the reference standard in
[MOTION_SPEC §0](../../../style/MOTION_SPEC.md): **009 S1 `HookFeedHype`** — *"the strongest
possible hook is to mirror the viewer's own feed back at them."* The pile's job is recognition
("that IS my inbox"), which is why it is almost always a hook or the beat right after one.

`attention/inbox` is a real subject coordinate in the taxonomy (011, 016) and a known
near-duplicate risk — see the [subject-map lesson](../lessons/2026-07-15-subject-map-stops-near-duplicates.md).
Before drawing another one, check it is a distinct angle, not a re-tread.

## Metaphors used (and the scene that owns each)

| Metaphor | Scene | Video | The move |
|---|---|---|---|
| **Doomscroll feed** of AI-hype headlines | [wh-doomfeed](../../../templates/hyperframes/scenes/wh-doomfeed/index.html) | 014 s1 | mirrors the viewer's feed; a **red anxiety pulse breathes** underneath; freezes on a gold Enter press, then **shatters** into 3D shards |
| **Toast alerts piling into a corner stack** | [fp-noise-pile](../../../templates/hyperframes/scenes/fp-noise-pile/index.html) | 017 s2 | *"make the viewer FEEL their own over-alerting tool"* — each trivial diff spawns another toast; counter races to 40; **39 desaturate** under a gold NOISE wash |
| **Ping swarm → gray wall** | [fp-ping-flip](../../../templates/hyperframes/scenes/fp-ping-flip/index.html) | 017 s1 | "changed / changed / changed" stacks gold-on-black, then freezes into a worthless gray wall |
| **Absurd z-stacked rain** | [gray-pile-flaw](../../../templates/hyperframes/scenes/gray-pile-flaw/index.html) | 012 s05 | identical gray videos rain into a tilting pile; counter → 60/month; three checkpoint slots blink red and **EMPTY** |
| **A flat inbox with a red badge** | [wh-slow-machine](../../../templates/hyperframes/scenes/wh-slow-machine/index.html) | 014 s2 | inbox badge "40", one open email, and a cursor filling a sheet **by hand** — the pile as a *chore*, not a spectacle |
| **The pile funnels and is consumed** | [wh-one-pass](../../../templates/hyperframes/scenes/wh-one-pass/index.html) | 014 s3 | the same 40 cards funnel into the gold node — the pile's **payoff** |
| **A pile of crumpled receipts** | [monthly-retype](../../../templates/hyperframes/scenes/monthly-retype/index.html) | 008 s02 | physical clutter + a `~10 min` clock conveying tedium |
| **Context re-skin** — the pile is *anything* | [steal-the-shape](../../../templates/hyperframes/scenes/steal-the-shape/index.html) | 012 s16 | video→invoice→**inbox**→report: the shape generalizes |

## What landed (owner verdicts)

- **Mirror the feed** (the §0 reference standard, 009 S1). Recognition in <1s, no reading required,
  never stops moving, and it **sets up the very next beat** — the flip.
- **Same pile, twice, is a contract.** 014 draws 40 emails in s2 (by hand, sticks at 6/40) and the
  **same 40** in s3 (one pass, 40/40) — with the **same clock** snapping 54 → 0. The pile's value is
  that it makes the payoff measurable. Reusing the exact data/props across scenes is continuity.
- **Kill it with color, not motion.** The strongest endings are `grayscale` (017: 39 of 40 desaturate;
  fp-ping-flip's gray wall). Gray = "this was all worthless" says it without a word.
- **A counter that RACES** is the pile's soundtrack — 0→40, →60/month, →1,695. It carries the
  scale claim so narration doesn't have to.

## What was rejected (owner verdicts — dated, never the agent's own opinion)

- **Stock beat-openers / looping b-roll of a busy office** — stock b-roll is **OFF by default**;
  only when a clip genuinely fits, played **once** (`OffthreadVideo`, no loop). Prefer code-drawn.
  See [VISUAL_IDENTITY](../../../style/VISUAL_IDENTITY.md) §5.2 (D-027) and the
  [no-stock-beat-openers lesson](../lessons/2026-07-07-no-stock-beat-openers.md).
- **A card that says "too many emails."** Standing
  [title-card reject](../lessons/2026-06-28-title-card-scenes-get-rejected.md) — the pile must be *felt*.
- **Layout that reflows as the pile grows** (owner, 2026-07-07; 011 S2 v1) — pile with absolutely
  positioned layers moved by `transform`/`opacity`; an element whose *height* collapses visibly
  shifts the page and is a reject. See the [lesson](../lessons/2026-07-07-fill-the-stage-no-reflow-transitions.md).
- **Breaking the momentum with a spoken stat** — the counter is on-screen; don't narrate it.
  See the [lesson](../lessons/2026-07-07-dont-break-momentum-with-a-spoken-stat.md).

## Recurring elements

- **A racing counter** with a real ceiling (40, 60/month, 1,695) — and if it is a *claim*, an
  on-screen **source chip** next to it (D-026, [DECISIONS](../../../docs/DECISIONS.md)).
- **Identical items** — the pile's items are *the same*, which is the point (identical gray videos,
  identical "changed" pings). Variety would undercut the tedium.
- **Continuous secondary motion** — a stream that never stops until a beat freezes it.
- **A freeze, then a verdict** — the pile stops on the thesis line, then desaturates / shatters /
  funnels. The pile always **ends**; it is never left running.
- **A pulse underneath** (`wh-doomfeed`'s red anxiety breath) — emotional bed, not decoration.

## Colors & proportions

- **Full-bleed.** The pile fills the stage (top 5% → 85%); a small cluster of cards floating mid-frame
  is the exact failure [fill-the-stage](../lessons/2026-07-07-fill-the-stage-no-reflow-transitions.md)
  bans. On portrait, scale up until the band is used.
- Hook piles are **black + gold**; body piles (`wh-slow-machine`, `monthly-retype`) are **blue + gold**.
- The pile's items are **blue-bordered** (`rgba(79,140,255,0.5)`) chips ~`120×74px × --u` with a
  dark gradient fill — then **gray** once judged worthless.
- Red `#ff5c5c` for the badge/anxiety pulse only — the pile itself is not an emergency.

## Avoid

- **A pile with no payoff** — if nothing funnels, freezes, or gets sorted, it is wallpaper.
- **A pile as the whole video.** It is an *opening* argument. 017 spends s2 on it and moves on.
- **Another inbox pile without checking the subject map** — `attention/inbox` is claimed (011, 016).
- **Fear.** The pile is tedium and noise, not doom — analytical, not true-crime
  ([verdict-stamp](verdict-stamp.md)).

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [The agent — the gold node that JUDGES (vs the scraper that reports)](agent.md)
- [The source document — the flat page the work comes from (receipt · invoice · email · ToS · filing)](source-document.md)
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md)
- [A frame from our own video is rarely a thumbnail — it must say "AI" and name the mechanism without narration](../lessons/2026-08-19-a-thumbnail-must-say-ai-at-a-glance.md)
