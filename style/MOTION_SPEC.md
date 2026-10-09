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
that answer. A scene that merely "displays the line" is a reject
([lesson](../knowledge/desk-knowledge/lessons/2026-06-28-title-card-scenes-get-rejected.md)); a
scene that **lands the idea** is the floor.

**Know what we've already drawn — then conceive fresh.** Before authoring, read the relevant
[concept note](../knowledge/desk-knowledge/concepts/index.md) for the subject (the gate, the
verdict stamp, the agent, the overload pile, the spreadsheet, the source document, failure): what
metaphors we've used, what landed, what the owner rejected, and the recurring elements/colors/
proportions. It is a **vocabulary as input to this section — never a selector.** Do not open a
note and pick a metaphor off it; that is the template failure §0 exists to ban. Read it so your
fresh answer is informed, and so a rejected metaphor isn't re-invented a fourth time.

**The whole-video floor (owner, 2026-07-10): video 012 `studio-reveal` is the MINIMUM benchmark
for visuals, animation, and transitions — every future video meets or beats it, never below.**
What earned it: per-scene icons, and a visual flow *conceived to follow the script itself* (each
beat drawn as its own bespoke HF scene: territory fields, a flowing token, a self-building scene).
Layout craft it also pinned down: any element that appears later in a scene (badge, CTA, tag)
gets its own reserved space — it must never land on top of existing text (012 lab-outro fix).

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
  black+gold, body blue+gold ([VISUAL_IDENTITY](VISUAL_IDENTITY.md) §2; the shared substrate —
  gold `#FFB020` in 59/60 scenes, `--u` scaling, the semantic colors — is catalogued in
  [concepts/](../knowledge/desk-knowledge/concepts/index.md)).
- **Fill the stage (owner rule, 2026-07-07).** Scene content spans the **top 5% → 85% band**
  (bottom ~15% is the caption band): big type, big icons — never a small cluster floating in
  the middle of the frame. On portrait especially, scale content up until the band is used.
  And **transitions never reflow layout**: swap visuals with absolutely-positioned layers moved
  by `transform`/`opacity` (fly-out, slide-up, crossfade) — an element whose *height* collapses
  mid-scene visibly "shifts the page" and is a reject (011 S2 v1).

This is the meta-rule the rest of this file (pacing, hook, transitions, variety) operationalizes.
When a scene clears §1–§6 but still feels *templated*, it has failed §0. Push every scene to
out-think 009 S1
([lesson](../knowledge/desk-knowledge/lessons/2026-06-27-proof-must-be-visible.md)).

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
**150–300ms**; dissolves **rarely**, soft mood beats only (**0.5–1s**).

**The default is mechanized (D-060).** Every scene boundary obeys the outgoing scene's `transitionOut`
in `scene-plan.json`, and an unauthored boundary is a **hard cut** that lands *on* the narration beat.
The **9 frames (~300ms) is the DISSOLVE/PUSH blend duration and the intro/outro bumper** — it is **not**
a per-scene default. (Until D-060 it was: every scene was wrapped in an unconditional 9-frame crossfade
that also *pre-rolled* the scene, ghosting the previous one into every line of narration — the spec said
"default to a hard cut" and the renderer did the opposite.)

`match`/`morph`/`carry` compile to a **cut**: the compositor cannot align two independently pre-rendered
clips, and a match cut *is* a hard cut whose two frames were **composed to rhyme**. The enum records the
intent; the author draws the shared element into both frames (`direction.carry`). Bespoke transitions are
authored per beat **on top of** cuts.

**Consequence for authoring:** under a cut a scene has no runway to animate its first element in — the
scene's **opening state IS the first reveal**. Compose the opening frame to already show the thing, then
move it. A scene that fades up from nothing reads as an empty frame on the beat.

## 4. Kinetic typography & text motion

- **Reveals:** char stagger **20–50ms** for a fast wave, or **0.1–0.2s per word** for a deliberate
  read. Recipe: split text → fade-in opacity + slight upward translate (**10–20px**) + stagger.
  Don't over-rotate/scale body text.
- **Emphasis:** scale-pop or color/highlight + a marker/underline sweep — landed **on the narration's
  stressed syllable** (the beat). That timing is the multiplier.
- **Counters:** tick numbers up to the final value; for any stated stat, fade the **on-screen source
  label** in next to the number as it lands (D-026, [DECISIONS](../docs/DECISIONS.md)).
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

**Card & panel angles (owner rule, 2026-07-12).** Content cards, panels, and terminals rest
**flat and face-on** — never a persistent 3D tilt (`rotateX`/`rotateY` under perspective). On a
phone the skewed card reads as a mistake and its raised corner climbs over neighboring text
(the 013 s3 dutch-angle terminal that triggered this rule). 3D rotation is allowed only as a
**transient reveal**, never a resting pose — two approved patterns:
- **Flip-reveal:** the card Y-flips 180° to show its other face (013 demo-day card — approved).
- **Stacked-deck reveal:** cards stacked with slight offsets; the top card slides/flicks away to
  expose the one beneath (approved — use it for before/after and list beats).

A subtle flat Z-rotation (≤3°, e.g. a stamp or sticker) is fine. Environmental planes (perspective
grid floors, backdrop tunnels) are exempt — they are backdrop, not content. The §0 reserved-space
rule still applies: a card's travel path must never cross existing on-screen text.

## 6. Visual variety — every scene is its own

Signals of "same template" (banned): one card layout reused N× with only words swapped; one looping
background; no color change across sections; no diagrams/B-roll/data-viz; the **three-icons-in-a-row
flow strip** (icon → arrow → icon → arrow → icon) for any concept/framework — owner ban 2026-07-09
("draft-check-gate as 3 dumb icons in a horizontal row"): frameworks get **full-stage acts,
territory fields, or morphs** — big, new, dynamic — never a horizontal icon strip.

Rules:
- **No layout used twice in a row.** Rotate among: full-bleed statement, split-screen, flow/diagram,
  code block, data-viz/counter, B-roll-with-overlay, quote/number card, screen-capture demo.
- **Shift palette per section** to mark chapters; never let >3 consecutive scenes share one palette
  without a deliberate section break. House palette: heroes + intro/outro **black+gold**, body
  **blue+gold** (`VISUAL_IDENTITY.md`); push contrast between adjacent sections.
- **Make dry facts move** — bars, flows, counters; don't narrate over a still.
- **1–2 graphics per scene** (staging). Mixed media within a video, not one mode on repeat.
- **B-roll:** only when a clip genuinely fits; never loop to fill; `OffthreadVideo`; prefer
  code-drawn over irrelevant footage (D-027; [VISUAL_IDENTITY](VISUAL_IDENTITY.md) §5.2).
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

## 9. The stage is built once — the shared substrate (D-064)

**The failure this fixes (owner, 2026-08-16, after 021):** 021 shipped 24 bespoke scenes and still
read as *"slideshow sa rečima i običnom pozadinom"*. The scenes were not lazy — the **frame** was.
Every scene re-invented a thin stage (one radial + one grid) in its own CSS and then spent its whole
budget on typography, so nothing in the picture ever had depth, grain, light, weight or continuous
life. Clearing §1–§6 is not enough if the frame itself is unproduced.

**The rule: never build a background again.** Include the substrate and spend the scene on the idea.

```html
<script src="../../_lib/gsap.min.js"></script>
<script src="../../_lib/hf-scene.js"></script>
<script src="../../_lib/hf-fx.js"></script>
<link rel="stylesheet" href="../../_lib/hf-fx.css" />
<link rel="stylesheet" href="my-scene.css" />
```
```js
var S = HF.scene({ id: "my-scene", width: 1920, height: 1080, frames: 400 });
FX.init(S, { palette: "body" });      // stage layers + palette + dust
var tl = gsap.timeline({ paused: true });
FX.ambient(tl);                       // the always-on secondary motion
```

What that buys, for free, in every scene: a **six-layer stage** (depth ground · masked blueprint grid ·
two volumetric light shafts · a re-aimable focal bloom · deterministic dust · stepped film grain ·
vignette · caption band), a **camera rig** (`FX.camera`), **physical paper** (`FX.pile` edge-on slabs,
`FX.sheet` face-on, `FX.desk`, `FX.sweep`) with real contact + ambient shadows, gradient gold type,
source chips, quote/myth plates, the gold slash (`FX.strike`) and counters (`FX.count`).

Authoring rules that come with it:
- **`FX.ambient(tl)` is not optional.** It is what makes §1 ("every ~3s something moves forward") true
  underneath whatever the scene stages on top. A scene that drives its own camera passes `{push:false}`.
- **Use `FX.fromTo(tl, target, from, to, at)`, never `gsap.fromTo`, for any beat later than 0.** fromTo
  defaults to `immediateRender:true` and applies its `from` values at *build* time — a page meant to
  fade in at 12s sits at opacity 0.2 from frame 0. Never "fix" this with a global
  `gsap.defaults({immediateRender:false})`: `gsap.set()` depends on immediateRender and silently stops
  applying, erasing every opening state (tried, reverted — D-064).
- **One spine object per video.** 022's is THE PILE: the same stack of pages appears in eleven scenes,
  and that continuity is what a deck of cards cannot buy. Pick the object before writing scene one.
- Determinism is unchanged: `FX.rng(seed)` only — no `Math.random`, no `Date.now`, no `tl.add(callback)`.

---

## 10. Repeating mechanisms & portrait scale (owner, 2026-08-17 — caught on a frame)

Two defects the 022 render exposed, with the numbers that prevent them. Full write-up:
[lesson](../knowledge/desk-knowledge/lessons/2026-08-17-a-cycle-must-never-empty-the-frame.md).

**A cycle moves the object; it never erases it.** A scene whose idea is a repeating mechanism
("every turn…", "every time you hit send…") must be staged as a HANDOVER, not as a wipe. Erasing the
subject in place reads as a render fault, and a helper that both starts *and* ends a cycle makes the
scene's length the author's problem — chain three of them into a 10.4s scene and whatever is left
over is dead air under live narration (022 s4: **5s of empty desk**; Short s1: 2s).

- **Never end a beat on an empty stage.** The next instance must be entering while the previous one
  is still leaving. One host per turn — a single host cannot overlap itself.
- **Escalation is what ACCUMULATES on screen**, not what disappears: a receding trail of the earlier
  copies, a chip counting `turn 1 · 2 · 3 · 4`, a read sweep that takes visibly longer each turn.
- **Chain the cycle from the beats and clamp the tail** so a re-timed render can't overrun the last
  beat (`S.cl(Math.max(t3, chainEnd), …, D - 1.05)`).

**Portrait is its own composition, not a crop.** An 11-page stack at 22px pitch is 242px — **12.6%**
of a 1920 frame, a thin strip on a phone.

- **A 9:16 hero object carries 55–65% of frame height.** Grow UPWARD and let the camera give ground
  only as fast as it must, so the object still visibly outgrows the shot (022 Short: 47% → 60%).
- **Pivot a portrait camera near the ground line** (`transform-origin: 50% 80%`), never the centre —
  a centre-pivot pull-back drives the subject down into the burned-in caption band.
- **Measure the INK, not the box** (owner, 2026-08-17, on the 022 Short's growth curve: *"previše je
  mala… ne bih znao ni šta se dešava na ekranu"*). A plot can occupy 83% of the width and still be a
  small mark, because a quadratic hugs its baseline — two thirds of the drawn line lived in the last
  third of the box. Size the object so the part that MOVES fills the band, then check it on a frame
  at phone scale, not on the layout numbers.
- **A single labelled point explains nothing.** A projection needs BOTH ends named — where the
  measurement stops and where the projection lands (`8 questions · 4.5× measured` →
  `40 questions ≈ 20×`) — plus what the axis counts. One marker on a curve is decoration.
- **Reserved space lives OUTSIDE the camera rig.** A counter or chip inside `#world` gets scaled out
  of frame by the camera move; put it in its own layer above the stage.
- **A label never sits on the subject when the subject is bright.** Gold type over paper loses at any
  plate alpha; 022 s19 came back unreadable twice. Stand the label OFF the object in empty frame and
  reach it with a thin leader line — then nothing can wash out.
- **The Short's hook is never the mechanism.** Open on what the viewer recognises, then hand off —
  and author the hook's last frame to be the mechanism scene's first frame (same geometry, same
  seed, same camera scale) so the cut is a continuation.

**Labels sit on the subject, so contrast is judged against the subject.** A translucent gold plate
(`rgba(255,176,32,0.08)`) over a GOLD page is unreadable. Any label landing on the object uses the
`.fx-chip` treatment: opaque near-black plate, gold hairline, gold text — never a tinted fill.

---

## 11. 3D scenes (Three.js / `HF3`) — the extra rules a rendered scene needs (2026-08-17)

3D is opt-in and per-scene; the default substrate is still 2D DOM + GSAP (§9). When a beat genuinely
earns real geometry — depth you can orbit, a room you can see INTO, paper that shadows the sheet
below it — these are the rules that separate a shippable scene from a test clip. Full write-up:
[lesson](../knowledge/desk-knowledge/lessons/2026-08-17-a-3d-test-clip-is-not-a-scene.md).

- **Every mark comes from `S.beatAt(...)`, never from a literal second.** `t / D` drives the camera;
  the action belongs under the sentence that describes it. A 3D scene authored at a fixed length
  cannot be re-slotted, and stretching it leaves the shot inert for the remainder.
- **Anything the depth-of-field must focus has to WRITE DEPTH.** `HF3.composite` reads the depth
  buffer, so `depthWrite: false` on a label or a glass pane hands those pixels the depth of the wall
  behind them and blurs them to the maximum CoC. Use `depthWrite: true` + `alphaTest`.
- **Words split by role.** Labels that name an object live IN the scene (`HF3.textPlane`) so they
  orbit, occlude and take the depth of field. The line a scene installs stays FLAT DOM in the house
  typography — a kicker in perspective breaks §5.
- **Paper needs pitch ≈ thickness.** Any looser and a stack reads as shelves or venetian blinds.
  When a thick panel becomes a sheet, scale its thickness down as it lands.
- **Stage the object for the shot it is IN.** If it holds the frame alone before it redistributes,
  it is staged large and shrinks into its final arrangement — not the other way round.
- **Same props contract as the 2D twin**, so the two takes swap on one field (`props.hf_scene`) and
  can be compared inside a full render instead of as isolated clips.
- **Judge on frames pulled at the real slot length**, never on the test render.

---

## 12. The frame gate — "plain" is now measured, not argued (owner, 2026-08-22)

The owner rejected 021 and then 022 with the same verdict: *"očigledno je AI video — sve su scene
previše jednostavne, proste i generičke."* Every rule in §0 and §10 already said otherwise. They were
ignored because nothing checked them, so now something does:
`node pipeline/05-qa/frame-gate.mjs <id>` measures **every scene's settled frame** and fails the
render on the ones that are plain, empty, or too small in frame.

**What the calibration found — and the hypothesis it killed.** The obvious theory was that the
rejected videos have EMPTY frames. Measured over 24 frames per video, that is false:

| | ink coverage (median) | fine detail (median) | detail p25 |
|---|---|---|---|
| **012** — the benchmark floor | 15.6% | 4.15% | 2.45% |
| **022** — rejected | **17.5%** | 3.92% | 1.81% |
| **021** — rejected ("slideshow") | 17.6% | **2.04%** | 1.45% |

022 is *fuller* than the video the owner locked as the floor. Emptiness is not the defect. What
separates them is **what is drawn inside the filled area**: 022's pages are blank white bars, its
cards are an empty rounded rect with a dot and a line, and its 18-model grid reads as a UI loading
skeleton. So the discriminating measurement is **fine detail density** — readable text, texture and
material produce small-scale variation; flat fills and smooth gradients do not, however much of the
frame they cover.

**The three floors** (`lib/ink-coverage.mjs`, per scene role):
- **detail ≥ 2.4%** of the stage (body scenes) — the primary gate, set at 012's measured p25.
- **coverage ≥ 8%** and **box ≥ 18%** — the backstop for the genuinely empty frame.
- `cta`/`outro` get much lower floors: the signature black+gold monolith close is ONE line of big
  type BY DESIGN and must never be bullied into clutter. `hook` gets higher ones (§2).

**What this means when you author.** A big object does not pass. A *readable* object passes. Give
every page real synthetic text, every card real content, every surface a material. The gate's own
message says it: *"blank bars and flat cards score low however big they are."*

**Honest limits — do not oversell this number.** The gate reliably finds plain and empty frames and
it ranks 021 worst exactly as the owner did (50% of scenes fail, vs 19% for 022). It does **not**
reproduce the owner's overall preference: 012 fails 29% of its own scenes. It is a per-scene floor
detector and an authoring forcing function, never a substitute for the owner's verdict at Gate ③.

**Two mechanical traps, both paid for once:**
- The floors are calibrated at **960×540** (540×960 portrait) and are meaningless at any other size,
  because a flat shape's detail contribution is its *perimeter* — shrink the frame and every blank
  fill starts scoring as texture. `ANALYSIS_SIZE` is fixed for this reason.
- Span must be measured on **trimmed** ink. Untrimmed, a source chip in one corner and the subject in
  the middle bracket the frame between them and report an 81%-tall subject that covers a third of the
  height.

---

## 13. The layering law — nothing is ever half-visible over something else (owner, 2026-08-23)

The owner's review of the 023 long cut named one defect three different ways, and all three are the
same mistake: **an element left at partial opacity over another element.** Gold type printed straight
onto lit white text with only a 10%-in-the-centre radial scrim under it; a struck-through myth parked
at `opacity: 0.24`, neither readable nor gone; scenes where a zoom or a slide left two things
occupying the same square inch. His words: *"nije jasan fokus gde treba gledalac da prati radnju."*

- **Flat type over a scene carries its OWN opaque plate** — ≥ 0.94 alpha, with a rule or hairline so
  it reads as a deliberate plate and not as a hole. A radial scrim is not a plate: it is darkest at
  the edges and lightest exactly where the type lands.
- **What is killed leaves at 0.** A struck myth, a replaced label, a superseded figure: `opacity: 0`,
  or off the frame. There is no such thing as 0.2 of a dead element.
- **Recede by COLOUR or DEPTH, never by alpha.** A backgrounded object that drops its alpha lets
  whatever is behind it print through its own face. Multiply its colour toward the ground
  (`color.multiplyScalar`, `filter: brightness()`), push it back in Z and let the depth of field do
  the work, or both — it stays opaque either way.
- **A recessed object must stay legible.** Measured on this cut: fading the pasted stack to 22% made
  it vanish against a dark panel and turned the money frame — *you pasted a mountain and got a stub* —
  into an empty rectangle. If the thing being priced cannot be seen, the point is not on screen.
  Give a recessive object a palette that survives being stepped back (this family: **paper**).
- **After a camera move, re-check every pair.** The overlaps the owner caught were not authored; they
  appeared when a zoom or a slide brought two settled elements into the same space. Judge the frame
  at the END of the move, not at the start.

## 14. The 3D / 2D ratio (owner, 2026-08-23)

The owner asked for **more Three.js**, at roughly **50/50** across a cut, *"or wherever 3D makes more
sense, do 3D."* 3D is still opt-in per scene (§11) — this is a target for the plan, not a licence to
render everything in a room.

- **3D earns a beat when the idea is spatial**: depth, occlusion, something physically arriving,
  scale you have to look INTO, a stack that shadows what is under it.
- **2D wins when the beat is a reading task**: dense type, an exact comparison, a number the viewer
  must take away. Flat DOM keeps type pin-sharp; depth of field softens the one line that matters.
- **Author both takes against the same props contract** (§11) so a beat can be swapped on
  `props.hf_scene` alone and compared inside a real render. `at3d-hook-v11` / `at-hook-v12` are the
  worked pair.

## 15. Fully-3D videos — the `hf-world` kit (2026-10-08, first used on 024)

When a whole cut is 3D (owner brief for 024: *"every scene a dynamic 3D environment, fast-paced"*), build
it on `templates/hyperframes/_lib/hf-world.js` (+ `hf-world.css`), loaded after `hf-three.js`. It owns
what nine scenes must share so the cut reads as ONE world: the renderer, an HDR (half-float, MSAA) post
chain — bloom pyramid, ACES, palette grade, vignette, grain — the floor/grid/sky/fog/light stage, and
the builders (`lattice`, `chat`, `card`, `frameBox`, `beam`, `sparks`, `dust`, `ring`, `label`). A
scene is then a shot list + its own objects. `hf-three.js` is untouched (the 023 scenes depend on it).

Rules that came out of building it, each paid for once on a frame:
- **Motion blur comes from the camera path, never from history.** The camera is a pure function of
  time, so `ctx.render(t, camFn)` projects where the look-point was one frame ago and smears along that
  vector — deterministic under random seeking. `HW.shots([...])` reports the shot index so a hard cut
  never smears across the cut.
- **Chromatic aberration only where the frame is sharp.** Mixing a sharp offset sample into a smeared or
  defocused pixel splits the channels into green/magenta blocks. Keep it radial and ≤ 2.5px.
- **A cut is a camera that jumps; a shot is a camera that never stops.** Fast pace = a new shot on
  most sentences (3-7 per scene) with continuous moves inside each, plus whip-pans whose smear hides
  the cut between scene clips.
- **Impact shake is small and slow** (≈34 rad/s, ≤0.2 units). Fast shake turns every frame into smear.
- **Fog is a distance budget.** Anything the narration names on the horizon must sit inside it (024's
  "future model" vanished at fog 0.016 / 90 units; it reads at 0.0085 / 45 units).
- **Read every claim's highlight against the line it lands under.** A gold reading-beam left on through
  "not learning" made the unchanged block look changed. Light ends where the sentence does.
- **Real content on every surface still applies** (§12): the lattice prints real model weights, chat
  windows carry real model output, pages carry real synthetic text.

---

## 16. Pace and the motion budget — the knobs the owner tunes (024 Short, 2026-10-09)

Owner on the 024 long cut: *"okay but it is too fast paced… Motion doesn't need to be constantly
moving something in the background or anywhere in the scene. It is too much to focus on and it's
losing focus to the important stuff."* The 024 Short is the test case: **10% slower, key takes a
further 5% slower, no intro, 10% less motion, settle on every key take.** What the owner prefers there
goes into the next video, so every one of those is a NUMBER on a knob, not a feel:

| Knob | Where | 024 long | 024 Short |
|---|---|---|---|
| speaking pace | `brief.voice_rate` | `+3%` | `-6%` (measured **1.10×** speech time) |
| key-take pace | `scenes[].key_takes` + `brief.voice_rate_key` | — | `-11%` (measured **1.166×**) |
| scripted holds | `scenes[].pause_after` | 0.35–0.6s | ×1.10, ×1.155 before a take |
| intro bumper | `brief.format_recipe.intro.short_seconds` | 1.5s | **0** — the hook owns frame 0 |
| motion | `props.motion.scale` (`HW.motion`) | 1 | **0.9** |
| settle on a take | `props.motion.focus` / `focusScale` | — | key-take windows at **0.35×** |
| captions | key takes / `format.captions.sentence_breaks` | greedy 7-word chunks | a take is its own caption; sentence breaks, even chunks |

What the budget does (`HW.motion` in `_lib/hf-world.js`):
- **Camera travel × scale, anchored on where the shot was composed to LAND.** The camera path splits
  into runs at hard cuts; inside a run the camera covers `scale` of its path and still lands on the
  end framing. A `keep: true` shot is story motion (the camera chasing the subject) and is left alone.
- **Ambient clock × scale** — dust drift, tile twinkle, idle bobbing, a storm's fall, a port's spin
  all read `M.amb(t)`, so "less moving in the background" is one number.
- **Focus windows settle the room on a key take:** inside one, the camera clock and the ambient clock
  run at `focusScale`, dust dims by half, and the frame edges darken a little — the take's line (a
  `.hw-take` plate with a gold rule sweeping under it) is the one thing that moves. Impact kicks are
  added at real time, so a hit still lands on its word.
- **Fewer simultaneous movers, by authoring.** The Short cut the long's busiest devices (the apology
  spiral, the barrage, the tracking shot along six chats) rather than slowing them down.

**Measured on the 024 Short** (`content/024-frozen/short/motion.json`; motion energy = mean absolute
luma change between consecutive frames, equal pixel budgets):
- **The Short moves 26% less than the long cut** (7.52 vs 10.19; per matched scene 0.62–0.96).
- **The budget knob alone is only ~3% of that** (A/B of each scene with and without it: 0.971 overall;
  inside the key-take windows 0.68–0.91). Camera travel and the ambient clock are a small share of what
  moves on screen — the cards, sparks, typing and colour changes are story motion the knob does not
  touch — and a slower camera blurs less, so its sharper frames give back part of the gain.
- **What actually calmed it was AUTHORING:** cutting the busiest devices, the 10% slower pace (the same
  events spread over more time), and holds on the takes. The one scene that stayed busy (s3, 0.96) is
  dominated by a whole-block colour change (blue → molten gold), which the metric counts as motion.
- **So set a motion target as a MEASURED ratio, not a knob value.** "10% less motion" = motion energy
  ≈ 0.90 of the reference cut, checked with `motion-ab.mjs`; `scale` is one of the tools, not the
  definition.

---

## Enforcement (where each rule is checked, so it can't be skipped)

| Rule | Check |
|---|---|
| Hook-class scene w/ motion in first 30s (§2) | `lib/policy.mjs` + `qa-video` (HARD) |
| No long static hold (§1) | `build-props` warn + `qa-video` (HARD), `format.pacing.max_static_hold_seconds` |
| Sequential reveals in order (§1/§4) | `lib/timeline.mjs` monotonic clamp |
| Hard cut is the default; the boundary honors `transitionOut` (§3) | `lib/transitions.mjs` `sceneWindow` — the ONE copy of the window math (both engine compilers + 04b-thumbnails call it); `SceneWrapper` obeys `fadeIn`/`fadeOut`; a bogus style is rejected by `scene-plan.schema.json`; the last scene's ignored `transitionOut` warns in `build-props` |
| Capture clips silent (§ screen-capture) | `compile-remotion.mjs` strip-at-ingest + `qa-video` silence assert |
| No paid-SaaS product names (§7) | `qa-video` denylist vs `brief.approvedTools` |
| Bespoke ratio / no repeated template (§6) | `qa-video` custom-ratio + no-repeat checks |
| Scene is not plain / empty / too small in frame (§0, §10, §12) | `pipeline/05-qa/frame-gate.mjs` — measures every scene's settled, caption-free frame against the calibrated detail/coverage/box floors in `05-qa/lib/ink-coverage.mjs` (HARD; `--warn-only` to inspect) |

Sources for the numbers above: YouTube retention-editing & 3-second-rule studies (AIR Media-Tech,
Visla, MotionEdits); hook research (PrePublish, 1of10, OpusClip); transition craft (StudioBinder,
Captions, Adobe); kinetic-type & GSAP (GSAPify, Good Fella Lab); motion durations/eases (Material 3,
Nielsen Norman Group); explainer variety (Vyond, TechSmith); icon/Lottie licenses (LottieFiles, Adham
Dannaway). Full URLs in the research log for this change (2026-06-24 PROGRESS entry).
