---
type: lesson
status: stable
created: 2026-08-25
updated: 2026-10-17
related: [2026-08-19-a-thumbnail-must-say-ai-at-a-glance.md, 2026-08-23-patch-the-render-dont-repeat-it.md, ../../../.claude/skills/youtube-publish/SKILL.md, ../../../docs/DECISIONS.md]
depends_on: []
---
# Publish metadata drafted at script approval is stale — re-stamp it against the rendered cut

**Purpose:** this file exists so the SEO package we draft early (D-055 timing) is never shipped with
the timestamps it was drafted with, and so a chapter label is always checked against the frame that
is actually on screen at its stamp.
**When to read:** read at the publish step of any video, before handing `publish.md` to the owner —
and before drafting chapters at script approval.
**Do not duplicate:** if writing about publish metadata, chapters, or the timing of SEO drafting,
extend this file.

## Finding

**Drafting the SEO early is right for the WORDS and wrong for every NUMBER that is a time.** The
owner's rule (draft title/description/tags the moment the script is approved, so the names exist
early) is sound — but at that moment the only clock in the folder is `alignment.json`, which measures
**audio time**. The delivered cut is not the audio: it carries an intro before scene 1. Every chapter
stamped against the audio therefore points *before* the beat it names, and each chapter opens inside
its predecessor.

The corollary is about labels, not stamps: **a chapter label can only be verified once the cut
exists**, because the rule that makes chapter labels good — quote the line that is on screen at that
stamp — has nothing to check against at script-approval time. Both halves of a chapter are
provisional until the render lands.

## Evidence

**023-attention** (Desk Lessons Ep.4, 6:17.75, 26 scenes, intro 1.5 s). The 17 chapters in
`publish.draft.json` were correct in content and internally consistent — and every single one was
early:

| draft stamp | scene | rendered start | error |
|---|---|---|---|
| 0:11 | s2 | 13.07 s | **+2.07 s** |
| 1:03 | s6 | 65.37 s | **+2.37 s** |
| 1:41 | s9 | 103.40 s | **+2.40 s** |
| 3:55 | s17 | 237.03 s | **+2.03 s** |
| 5:56 | s26 | 358.03 s | **+2.03 s** |

Uniform **+1.6 to +2.4 s** across all 17 — the 1.5 s intro plus per-stamp rounding. Not a drift that
grows, and not one an eye catches on a spot-check; a systematic, silent offset in every stamp.

The label half failed independently. The publish-stage review (Sonnet, D-053) opened at **8/10** and
its MAJOR was `5:06 The three habits` — a summary of the s22–s24 arc that quoted no on-screen line and
duplicated the 4:53 chapter, plus three labels stitched from props that never share a frame (one of
them, `Attention — shares that total 1.0000000`, named a number that does not resolve until ~13 s
into the scene it was stamped on). Re-stamped and re-labelled, it went **9/10, all three hard gates
green**, one cosmetic nit.

This is the second episode in a row where chapters were the weakest field: **022**'s review needed
three iterations on the same two failures — labels that paraphrased instead of quoting, and a
relabel that landed in the `chapters` array but not in the copy of the list inside `description`,
which is the copy YouTube actually parses.

## Decision

At the publish step, three mechanical things, every video:

1. **Re-derive every stamp from `timeline.json` `start_seconds`** — the rendered timeline, intro
   included. `alignment.json` is the wrong clock the moment an intro exists; `buildChapters`'
   `introOffset` argument exists for exactly this and defaults to 0, so a hand-authored draft misses
   it silently.
2. **Generate the `Chapters:` block inside `description` FROM the `chapters` array**, never by hand.
   The two are the same list and only one of them is what YouTube reads.
3. **Every label is the line actually on screen at that stamp** — read it off the scene's
   `on_screen_text` or its props, and if a beat has no on-screen line of its own, it does not get a
   chapter. Prefer giving two adjacent beats their own verbatim chapters over one label that
   summarises both.

And at script approval, draft the chapters as **beats, not timestamps** — the labels are the useful
early output; the stamps are placeholders that the publish step overwrites.

Checks that catch the rest: monotonic, first at `0:00`, every gap ≥ 10 s, last stamp inside the
runtime, and the description block character-identical to the array.

**The ≥ 10 s gap is the one that fails silently, so it is now in code (2026-10-17).** One chapter
under 10 s makes YouTube show **no chapters at all**, with no warning in Studio. Writing the check
down here did not stop it: **025**'s draft gave the 7 s payoff beat s7 ("Not smarter. Undoable.",
1:41) its own chapter before s8 at 1:48, and the published **021** carries two (`Sarah is 1 chunk.
Okonkwo is 3.` 9 s, `The part you pay for` 8 s), so 021 has likely shown no chapters since upload.
`build-metadata.mjs` `chapterProblems()` now checks count ≥ 3, first at `0:00` and every gap ≥ 10 s,
and `publish.md` prints a ⚠ block above the hand-off when one fails. Fix by folding the short beat
into a neighbour's chapter (025: "1:41 Undoable, not smarter: why it matters now"). Do not drop the
beat.

## Applies to

Every video's publish package: [`.claude/skills/youtube-publish/SKILL.md`](../../../.claude/skills/youtube-publish/SKILL.md),
`pipeline/06-publish/build-metadata.mjs`. Measured on `content/023-attention`
(`publish.review.json`), with the precedent in `content/022-context-window/publish.review.json`.

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- _none yet_
