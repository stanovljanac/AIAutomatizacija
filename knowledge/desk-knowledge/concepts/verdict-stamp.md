---
type: concept
status: stable
created: 2026-07-16
updated: 2026-07-16
related: [human-gate.md, failure.md, agent.md, ../../../style/MOTION_SPEC.md]
depends_on: [index.md]
---

# The verdict stamp — how a judgment LANDS

**Purpose:** record the channel's most-reused *element* (11+ scenes) — the stamp that slams a
decision onto the frame — so its force isn't diluted by overuse or softened into a checkmark.
**When to read:** read this before drawing any moment where a decision becomes final: approved,
rejected, flagged, suspended, ignored, demonetized, not-found.
**Do not duplicate:** if writing about stamps / verdicts / the moment a judgment becomes visible,
extend this file; the **barrier** that precedes it is [human-gate](../concepts/human-gate.md) and
the **failure being judged** is [failure](failure.md).

## The subject

Not "approval" — **the verdict**. The stamp is how the channel makes a decision *physical*: it
arrives late, big, rotated, and loud, and the frame is different afterward. It is the payoff
beat of the gate, the agent, and the failure alike, which is why it appears everywhere.

Its origin is a hard editorial constraint, worth preserving: on 010 the stamps were declared
**"the ONLY alarm imagery in the video — functional, analytical, not true-crime"**
([cite-collapse](../../../templates/hyperframes/scenes/cite-collapse/index.html)). The stamp is
how we get urgency **without** fear-mongering. That is its job.

## Metaphors used (and the scene that owns each)

| Verdict | Scene | Video | The move |
|---|---|---|---|
| **SUSPENDED** on a law license | [suspended-stamp](../../../templates/hyperframes/scenes/suspended-stamp/index.html) | 010 Short s4 | one clean slam; the license **desaturates**. Not the AI — the person who trusted it |
| **NOT FOUND / DOESN'T EXIST** row by row | [cite-collapse](../../../templates/hyperframes/scenes/cite-collapse/index.html) | 010 hook | red stamps land *per citation*, then one SUSPENDED slams over the whole brief |
| **NOT FOUND** under a magnifier | [magnifier-notfound](../../../templates/hyperframes/scenes/magnifier-notfound/index.html) | 010 Short s2 | search-then-stamp: the sweep earns the verdict |
| **APPROVED** | [human-gate-one](../../../templates/hyperframes/scenes/human-gate-one/index.html) | 012 s09 | `rotate(-10deg) scale(2.4)` → settles; gold on gold |
| **✗ + a reason** | [bad-row-gate](../../../templates/hyperframes/scenes/bad-row-gate/index.html) | — | the stamp **says why** ("Invalid date"). A verdict without a reason is noise |
| **IGNORED · cosmetic** | [fp-kept-judgment](../../../templates/hyperframes/scenes/fp-kept-judgment/index.html) | 017 s4 | the *discrimination* made visible — stamping restraint, not action |
| **REJECT** ×3, each different | [writer-vs-reviewer](../../../templates/hyperframes/scenes/writer-vs-reviewer/index.html) | 012 s07 | a **different** reason each volley; the doc visibly edits itself, v1→v3 |
| **DEMONETIZED** strike | [policy-punchline](../../../templates/hyperframes/scenes/policy-punchline/index.html) | 012 s03 | a red strike across everything, after the source chip lands |
| **EXPORT ORDER** | [killswitch](../../../templates/hyperframes/scenes/killswitch/index.html) | 007 | the stamp *causes* the next beat — the core goes dark |
| **"BEST THING IT EVER DID"** (ironic) | [hook-snap](../../../templates/hyperframes/scenes/hook-snap/index.html) | 013 s1 | a gold stamp slammed over a wreck — verdict as punchline |
| **40/40 — one pass** | [wh-one-pass](../../../templates/hyperframes/scenes/wh-one-pass/index.html) | 014 s3 | the *positive* verdict, locking over a finished sheet |

## What landed (owner verdicts)

- **The stamp earns the frame by being the only alarm.** 010 shipped with stamps as the sole
  urgency device and no siren/true-crime imagery — this is the channel's tone floor.
- **A verdict with a reason beats a verdict.** `bad-row-gate` ("Invalid date"), `fp-kept-judgment`
  ("IGNORED · **cosmetic**"), `writer-vs-reviewer` (a different reject reason per volley). The
  reason is what makes it a judgment rather than a buzzer.
- **Stamp the restraint, not just the action** (017 s4). Stamping *what the agent chose not to do*
  is the single strongest use in the library — it is the beat that makes it an agent, not an alarm.
- **Accuracy is part of the design.** `suspended-stamp` documents: **SUSPENDED (temporary), never
  "revoked"**. The word on the stamp is a factual claim and is fact-checked like any other.

## What was rejected (owner verdicts — dated, never the agent's own opinion)

- **A stamp over nothing.** The verdict must land *on* a drawn subject (a license, a row, a brief,
  a sheet). A stamp over a bare background is a [title card](../lessons/2026-06-28-title-card-scenes-get-rejected.md)
  with a graphic on it (standing reject).
- **Announcing the honest catch.** 017 s4 opens **directly on the limitation — no announce**
  (owner). Do not build up to a stamp with a "but here's the catch" beat; land it.
- **Clutter around the monolith.** 017 s5: three example targets were cut to **voice-only**
  (owner de-clutter, 2026-07-15) so the stamped line holds alone.

## Recurring elements

- **Slam physics:** starts big and rotated (`scale(2.2–2.4)`, `rotate(-10deg)`), lands to `1`,
  overshoot ease (`back.out`). It **arrives late** in the beat — the frame waits for it.
- **The frame reacts:** the subject **desaturates** to gray (11 scenes use `grayscale`/`saturate(0)`),
  dims, or freezes. A stamp with no consequence to the frame is a sticker.
- **A short, upper-case, screenshotable word.** 1–3 words, letter-spaced `4–6px × --u`.
- **A glow, not a flash:** `box-shadow: 0 0 40–50px rgba(255,176,32,0.4–0.6)`.

## Colors & proportions

- **Gold `#FFB020` = approved / kept / the point.** **Red `#ff5c5c` = rejected / not found /
  failed** (32 scenes). Green `#22D3A7` = passed-clean (15 scenes) — green is for *rows*, gold is
  for *judgments*. **Gray = discarded.**
- Type `~56–58px × --u`, weight `900`, border `6px × --u`, radius `14px × --u`, fill
  `rgba(26,18,6,0.6)` — a translucent plate so the stamped subject stays readable *through* it.
- The ✓ badge form: `90px` circle, gradient `gold-2 → gold`, dark glyph `#1a1206` (never white).
- Portrait: the stamp scales with `--u` and stays centered on the subject; it never crosses into
  the bottom 19.5% caption band.

## Avoid

- **Stamping every beat.** The library has 11 — but *per video* the stamp is a payoff. If two
  scenes both slam a verdict, the second one is free of charge and lands for nothing.
- **A green ✓ as the verdict** — green reads as "row passed", not "a decision was made". Gold.
- **A stamp without a reason** where a reason exists.
- **Alarm dressing** — sirens, flashing red frames, true-crime tone. The stamp is *analytical*.
- Using a stamp when the beat is the **halt** ([human-gate](human-gate.md)) or the **failure
  itself** ([failure](failure.md)) — the stamp is the *moment it becomes final*.

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [The agent — the gold node that JUDGES (vs the scraper that reports)](agent.md)
- [Failure — the silent one is the villain; the loud one is the hero](failure.md)
- [The human gate — a barrier that HALTS a flow until a person passes it](human-gate.md)
- [The overload pile — inbox, feed, swarm: making the viewer FEEL "too much"](overload-pile.md)
- [The source document — the flat page the work comes from (receipt · invoice · email · ToS · filing)](source-document.md)
- [The spreadsheet — rows, green checks, and the ONE gold flag](spreadsheet.md)
