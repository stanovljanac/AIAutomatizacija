# MOTION_SPEC.md — the craft rules every video is authored against

> **Why this file exists.** Videos kept shipping as "template slideshows": title cards held
> 15–20s over a looping background, the same card reused 5×, no real transitions, no motion.
> Rules about variety/motion lived as vague prose and were ignored. This file is the **single,
> concrete, numeric source of truth** for pacing, motion, transitions, and visual variety — the
> craft an editor would apply. Author bespoke scenes (HyperFrames HTML + GSAP/anime) to *these
> numbers*. Where a rule is machine-checkable it is enforced in code (see "Enforcement" at the
> bottom); the rest is non-negotiable authoring discipline.
>
> Companion files: `style/VISUAL_IDENTITY.md` (the look — palette, type, scene vocabulary),
> `pipeline/shared/formats/default.json` (the knobs). When this file gives a number and the format
> recipe has a matching knob, the knob wins at render time and should mirror this file.

Reference benchmark for craft (not style): **Kurzgesagt** — continuous secondary motion, one idea
on screen at a time, beat-synced reveals. Emulate the *technique*, keep our cleaner dev aesthetic.

---

## 0. The strategist standard — every scene is *conceived*, not filled

**The bar (owner, 2026-06-29): every scene must be thought through like a strategist before a
single prop is placed — and each new scene should meet this standard or beat it.** Do not reach
for a template and swap the words. Ask, in order: *what does this beat need to make the viewer
feel or realize, and what is the single most disarming way to show it?* Then author the scene to
that answer. A scene that merely "displays the line" is a reject ([[no-title-card-scenes]]); a
scene that **lands the idea** is the floor.

**The reference scene — 009 S1 / `HookFeedHype`** (the first scene authored to this standard).
The strategist move: the strongest possible hook is to **mirror the viewer's own feed back at
them.** A full-bleed, fast doom-scroll of AI "get-rich" hype — a faux search bar typing *"make me
money with AI"*, an endless stream of hype cards (`$10,000/month`, `AI trading bot +1,240%`, *make
money while you sleep*) with VIRAL/AD/LIVE tags, pumping green charts, fake view counts, a gold "$"
rain, a glow that pulses on the narration beats and a scroll that *accelerates* on beat 2. It is
recognized instantly ("that IS my feed"), it never stops moving, and it **sets up the very next
beat** — the S2 flip, "so I asked mine to do the opposite." See
[`templates/remotion/src/custom/HookFeedHype.tsx`](../templates/remotion/src/custom/HookFeedHype.tsx).

What made it good — the checklist every scene is now held to:
- **Strategic premise.** It earns its place with one sharp idea (here: empathy/recognition), not a
  decorated title. State that premise in the component's top comment, as `HookFeedHype` does.
- **Instant legibility.** The viewer "gets it" in <1s, mobile-legible, no reading required.
- **Full of motivated motion.** Constant secondary motion tied to the meaning and **keyed to the
  narration beats** (§1, §2), never tic-motion for its own sake.
- **Sets up the next beat.** Each scene hands off to the one after it; the video is a line of
  dominoes, not a slideshow.
- **Frame-pure & deterministic.** `useCurrentFrame`/anim helpers only — no `Date`/`Math.random`
  in the timeline — so it seeks and renders identically every time.
- **Caption-safe & on-palette.** Viewport clipped/faded clear of the caption band; hook family
  black+gold, body blue+gold ([[bespoke-first-video-system]], [[video-dynamism-and-length]]).

This is the meta-rule the rest of this file (pacing, hook, transitions, variety) operationalizes.
When a scene clears §1–§6 but still feels *templated*, it has failed §0. Push every scene to
out-think 009 S1 ([[proof-must-be-visible]]).

---

## 1. Pacing — meaningful progression, not motion for its own sake

**The rule: every ~3s the viewer's understanding or attention must MOVE forward.** Not "pixels
changed" — *progression*: a new point lands, a number resolves, the focus shifts to the next
element, a reveal advances the idea. Kurzgesagt holds a wide shot for 8s and still feels alive
because the **focus** moves, not because the whole screen flips. Bind motion to the narration's
meaning.

**This is a guardrail, not a goal — do NOT game it.** Adding a zoom/blink/sweep every 2s just to
"pass" is *worse* than a still: tic-motion with no meaning reads as cheap and distracts. One
deliberate, motivated move beats five decorative ones (see §5 staging: 1–2 moving graphics/scene).

What's actually banned is **dead air**: a static title over a looping background held 15–20s with no
progression. The **code check is only a loose floor** (`format.pacing.max_static_hold_seconds`) that
catches that egregious case; "is each beat *meaningfully* advancing?" is the review agent's judgment,
watching as an average viewer. A card may *exist* for 12s only if it keeps **progressing** (staged
reveals that each add a point), never if it just wiggles.

Tiered cadence (vary it; don't apply one rigid value):
- **Opener / first 15s:** a visible reset every **2–4s** (tightest pacing of the whole video).
- **Body:** a real visual break (cutaway, new layout, zoom, new graphic) every **20–30s** of
  narration, and within that window the screen still micro-changes every **≤3s**.
- **Pattern interrupts** (bigger jolts — section/color shift, motion burst, B-roll): every
  **30–60s** to re-engage before the natural drop-off points.

## 2. The hook (0–30s) — earn the watch

The steepest drop is between **second 10 and 20** (inflection ~15s). Intro branding **≤5s** (or
none). A pattern interrupt in the first 5s is worth ~+20% retention.

Author the hook in three phases:
- **0–5s — pattern interrupt:** a bold visual / specific claim / one-line question that out-competes
  the next video. Kinetic typography or a hard motion burst (an HF hero), **never a calm card.**
- **5–15s — specific payoff promise, with a number** (ties to D-026: lead with a sourced fact).
  "The one check that makes it safe to trust" + a concrete figure beats "this video covers receipts."
- **15–30s — stakes / the journey starts**, with another interrupt right around 15s to survive the
  inflection.

The opener must be a **hook-class** scene with real motion in the first 30s (enforced).

## 3. Transitions — cuts first, effects with meaning

**Default to a hard cut.** Reach for an effect only when it carries meaning. Lean on **L-cuts**
(visual changes lead or lag the continuous narration at sentence boundaries) — the single biggest
"feels professional" trick available to us since audio is one track.

Tasteful vocabulary (use): hard cut · **match / graphic cut** (compose B so a shape aligns with A —
a code line becomes a chart bar) · **push / slide** (directional, modern UI) · **mask / shape wipe**
(great for section changes) · **morph** (one object becomes another; key beats only) · **zoom /
push-in** · occasional **whip-pan / smear** for an energetic jump.

Banned (amateur tells): star/heart wipes, page curls, cube spins, cross-zoom flares, light-leaks
everywhere, and — worst — *relying on transitions instead of cuts*.

Durations: graphic-to-graphic push/slide/wipe/morph **200–500ms** (default **~300ms**); whip/smear
**150–300ms**; dissolves **rarely**, soft mood beats only (**0.5–1s**). Our base crossfade stays the
small 9-frame (~300ms) blend; bespoke transitions are authored per beat on top of cuts.

## 4. Kinetic typography & text motion

- **Reveals:** char stagger **20–50ms** for a fast wave, or **0.1–0.2s per word** for a deliberate
  read. Recipe: split text → fade-in opacity + slight upward translate (**10–20px**) + stagger.
  Don't over-rotate/scale body text.
- **Emphasis:** scale-pop or color/highlight + a marker/underline sweep — landed **on the narration's
  stressed syllable** (the beat). That timing is the multiplier.
- **Counters:** tick numbers up to the final value; for any stated stat, fade the **on-screen source
  label** in next to the number as it lands (D-026 / [[on-screen-source-for-stats]]).
- **Eases:** `back.out(1.7)` for a playful snap, `power3.out` / `expo.out` for a clean decelerate.

## 5. Motion-design principles (Disney → UI/mograph) with numbers

Always **ease** (never linear). Use **anticipation** (a 2–3px counter-move before a slide),
**overshoot/follow-through** (`back.out`; secondary elements settle a beat after the primary), and
**staging** (one focal change at a time — **1–2 moving graphics per scene max**).

Canonical durations (author to these):

| Use | Duration |
|---|---|
| Immediate feedback (toggle/focus) | 100ms |
| Small dropdown/tooltip | 150ms |
| Standard transition/panel/menu | 200ms |
| Modal / substantial change | 200–300ms |
| Scene transition / hero moment | ~350–500ms |
| **General envelope** | **100–400ms** (>500ms drags) |

**Enter vs exit:** enter is longer + **decelerate** `cubic-bezier(0.05,0.7,0.1,1)` (~300ms); exit is
faster + **accelerate** `cubic-bezier(0.3,0,0.8,0.15)` (~200–250ms). List/parent→child **stagger
40–120ms**. Standard ease `cubic-bezier(0.2,0,0,1)`. Honor `prefers-reduced-motion` with a fade-only
fallback where feasible.

## 6. Visual variety — every scene is its own

Signals of "same template" (banned): one card layout reused N× with only words swapped; one looping
background; no color change across sections; no diagrams/B-roll/data-viz.

Rules:
- **No layout used twice in a row.** Rotate among: full-bleed statement, split-screen, flow/diagram,
  code block, data-viz/counter, B-roll-with-overlay, quote/number card, screen-capture demo.
- **Shift palette per section** to mark chapters; never let >3 consecutive scenes share one palette
  without a deliberate section break. House palette: heroes + intro/outro **black+gold**, body
  **blue+gold** (`VISUAL_IDENTITY.md`); push contrast between adjacent sections.
- **Make dry facts move** — bars, flows, counters; don't narrate over a still.
- **1–2 graphics per scene** (staging). Mixed media within a video, not one mode on repeat.
- **B-roll:** only when a clip genuinely fits; never loop to fill; `OffthreadVideo`; prefer
  code-drawn over irrelevant footage ([[broll-must-fit-never-loop]]).
- **Bespoke-first:** most visual scenes are authored fresh as HyperFrames compositions; the Remotion
  template gallery is a fallback, not the default. Reuse *techniques*, never a fixed deck.

## 7. Named tools / products (owner rule, 2026-06-24)

Free or generic tooling may be named (Google Sheets, Python, an open vision API, "a purpose-built
receipt OCR"). **Never name a paid SaaS product** (Expensify, QuickBooks, Dext, Ramp, BILL…) in
narration or on screen as something to use, unless the owner pre-approved it for that video (a paid
promo or a tool the owner personally endorses) via `brief.approvedTools`. Keep the tool modular and
the workflow the focus. Enforced as a denylist in QA.

## 8. Asset sources (free, commercial-safe — verify license at use)

Icons: **Lucide** (ISC), **Tabler** (MIT), **Phosphor** (MIT, 6 weights for emphasis). Animations:
**LottieFiles** free search-tab (Lottie Simple License — commercial OK, attribution not required) via
the `lottie` HF adapter. No mandatory in-video attribution for any of these.

---

## Enforcement (where each rule is checked, so it can't be skipped)

| Rule | Check |
|---|---|
| Hook-class scene w/ motion in first 30s (§2) | `lib/policy.mjs` + `qa-video` (HARD) |
| No long static hold (§1) | `build-props` warn + `qa-video` (HARD), `format.pacing.max_static_hold_seconds` |
| Sequential reveals in order (§1/§4) | `lib/timeline.mjs` monotonic clamp |
| Capture clips silent (§ screen-capture) | `compile-remotion.mjs` strip-at-ingest + `qa-video` silence assert |
| No paid-SaaS product names (§7) | `qa-video` denylist vs `brief.approvedTools` |
| Bespoke ratio / no repeated template (§6) | `qa-video` custom-ratio + no-repeat checks |

Sources for the numbers above: YouTube retention-editing & 3-second-rule studies (AIR Media-Tech,
Visla, MotionEdits); hook research (PrePublish, 1of10, OpusClip); transition craft (StudioBinder,
Captions, Adobe); kinetic-type & GSAP (GSAPify, Good Fella Lab); motion durations/eases (Material 3,
Nielsen Norman Group); explainer variety (Vyond, TechSmith); icon/Lottie licenses (LottieFiles, Adham
Dannaway). Full URLs in the research log for this change (2026-06-24 PROGRESS entry).
