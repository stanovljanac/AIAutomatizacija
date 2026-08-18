---
type: lesson
status: stable
created: 2026-08-17
updated: 2026-08-17
related: [2026-08-16-the-stage-is-built-once.md, 2026-06-28-title-card-scenes-get-rejected.md, ../../../style/MOTION_SPEC.md]
depends_on: []
---

# A repeating mechanism must move the object, never delete it — and in 9:16 it must fill the frame

**Purpose:** this file exists so the two defects the 022 render exposed — a cycle that leaves the
stage empty, and a hero object that is a thin strip on a phone — are never re-authored.
**When to read:** read before authoring any scene whose idea is a REPEATING mechanism (a loop, a
turn, a cycle, "every time you…"), and before authoring any portrait cut.
**Do not duplicate:** if writing about scene cycles, handovers or portrait scale, extend this file.

## Finding

022's mechanism scene was staged as **land → read → write → WIPE**. Three cycles were chained and
they fit in the first ~5.3s of a 10.4s scene, so the last wipe left **five seconds of empty desk
under live narration**; the Short's hook had the same hole for two seconds. The owner caught it on
a frame, not as an impression: *"na 16s Shorta je prazan sto dok naracija i titl idu."*

Two separate mistakes, and the small one is the interesting one:

1. **Arithmetic.** A helper that both starts and ends a cycle silently makes the scene's length the
   author's problem: chain N of them and whatever is left over is dead air. Nothing in the pipeline
   catches it, because the clip is exactly the right number of frames and every frame renders.
2. **Vocabulary.** Even with the arithmetic fixed, *erasing the object in place* is the wrong verb.
   It reads as a render fault — a thing vanished — not as a process. The idea ("nothing is kept, so
   the whole stack is handed over again") is a MOVEMENT, and it has to be drawn as one.

The portrait defect is pure composition. An 11-page stack at 22px pitch is 242px tall: **12.6% of a
1920-frame**, a thin strip on a phone. And the Short used the SAME object for its hook and its
mechanism, so the first sixteen seconds were one unexplained abstract shape with no second of
context — a hook has to be the thing the viewer recognises.

## What to do

- **Give the cycle a direction, not an eraser.** The stack now enters from the left, is read, gains
  a page, and RECEDES to the right onto a dim trail of its own earlier copies while the next one is
  already entering. Use one host PER TURN (`cw-handoff` uses four carriers built from the same seed)
  — a single host cannot overlap itself, and the overlap is what keeps the read zone occupied.
- **In 9:16, grow upward and let the camera give ground.** `cw-tower` lifts the whole stack off the
  desk, reads it while it hangs there (that gap *is* "it holds nothing" — emptiness as separation,
  never as an empty frame), and drops it back one page taller; the camera pulls back only as far as
  it must, so the tower still goes from ~47% to ~60% of frame height. **A portrait hero object must
  carry 55–65% of the frame.**
- **Never make the escalation depend on the object leaving.** Repetition reads as escalation when
  something *accumulates on screen*: the trail, the turn chip counting 1·2·3·4, the read sweep
  taking visibly longer every turn because there is more to re-read.
- **PACE the turns across the beats; never chain them back-to-back** (added 2026-08-18). Chaining is
  the same arithmetic bug wearing the opposite coat: tighten the cycle and the turns now finish
  *early*, leaving the hole at the END instead of between them — `cw-whole-chat` packed three turns
  into 11.5s of an 18.1s slot and left four seconds of bare desk before the closing handover. Start
  turn *k* at `t1 + k * (t3 - t1) / N` and let the READ absorb the slack, which is also the honest
  place for it: a taller stack takes longer to read. Then overlap the seams — return the moment the
  old object starts LEAVING, not when it has gone, so the next one is entering over it.
- **A ghost in transit must cross at full size.** A copy that squashes as it leaves is a thin sliver
  for most of its trip, which empties the frame just as thoroughly as a wipe. Move it in two steps:
  full size across the gap, flatten only as it lands.
- **The Short's hook is not the mechanism.** Open on what the viewer recognises (their own thread),
  then hand off to the mechanism. `cws-forgot` ends on exactly the stack and camera framing
  `cw-tower` opens on, so the cut is a continuation.
- **Take the label OFF the subject entirely** (revised 2026-08-18). First pass: the s19 pin label was
  `rgba(255,176,32,0.08)` gold-on-gold over a GOLD page and was unreadable, so it was given the
  `.fx-chip` treatment — opaque plate, gold hairline, gold text. It came back unreadable a SECOND
  time on the next cut: over a stack of bright paper the plate simply does not win, whatever its
  alpha. The rule is therefore stronger than "use a chip": when the subject is bright, the label
  stands OFF it in empty frame and reaches it with a thin leader line. Nothing is layered over paper,
  so nothing can wash out.
- **When a group leaves a pile, settle the remainder.** 022 s2 redistributed pages bottom-up, so the
  leftovers stayed floating at their old height and landed across the next row's label.

## Evidence

- Owner note, 2026-08-17, with frame references: empty desk at 0:16 of the Short and 52–60s of the
  long cut; unreadable label at 4:16; overlap at 25–29s.
- `templates/hyperframes/scenes/cw-handoff` (long s4), `cw-tower` (Short s2), `cws-forgot`
  (Short s1) replace `cw-desk-cycle`'s three phases; `cw-fifo`/`cw-window-frame` carry the two
  small fixes. All verified on real renders, not by reading the timeline.
- The numbers are written into `style/MOTION_SPEC.md` §10.

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
- [A 3D test clip is not a scene — four things that must change before it can carry a beat](2026-08-17-a-3d-test-clip-is-not-a-scene.md)
- [A clip that plays perfectly is not necessarily a clip the compositor can SEEK — normalise it](2026-08-18-a-rendered-clip-is-not-a-seekable-clip.md)
