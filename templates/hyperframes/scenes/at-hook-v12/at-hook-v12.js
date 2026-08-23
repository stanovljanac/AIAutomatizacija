/* at-hook-v12 — 023 s1 (hook hero, 2D). V1.2: the flat alternative to at3d-hook-v11.
 *
 * THE SHOT. A whole chat window, face-on, with all four edges in frame — a question and a good,
 * short answer already in it. Then four pasted DOCUMENTS slam into the thread one after another;
 * the content scrolls under the title strip and the scroll thumb collapses to a stub. The good
 * answer pins itself under the chrome so it is still there when the new reply arrives: one line,
 * with a gold rule under each answer at its own length. "Worse" becomes a size.
 *
 * WHY FLAT, WHEN 3D EXISTS. Three things DOM gives that the room does not, all of them answers to
 * the 023 review: type stays pin-sharp (no depth-of-field softening the line the viewer must read),
 * stacking order is exact (nothing can print through anything), and the measure comparison can be
 * drawn to the pixel.
 *
 * EVERY MARK COMES FROM S.beatAt(...), never from a literal second (MOTION_SPEC §11) — the scene has
 * to fill whatever window the alignment gives it.
 *
 * Deterministic: one paused, seek-driven GSAP timeline. No rAF, no Date.now, no Math.random.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-hook-v12", width: 1920, height: 1080, frames: 344, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
var px = FX.px;

/* the hero palette: black + gold. The stage (ground, grid, shafts, bloom, dust, grain, vignette)
   comes from _lib so this file spends itself on art direction. */
FX.init(S, { palette: "hero", dust: 20, seed: 12, bloomX: 50, bloomY: 30 });

document.getElementById("myth").textContent = props.myth || "losing focus";
document.getElementById("kickertext").textContent = props.title || "It doesn't focus. It spends.";
document.getElementById("blbltext").textContent = props.budgetLabel || "the total";

var PASTED = (props.promptLines && props.promptLines.length ? props.promptLines : [
  "Here is everything about the Ridgeway account.",
]);
var ANSWER_FULL = props.answerFull || "Ridgeway's vendor code is RW-88, used on the August invoice run.";
var ANSWER_THIN = props.answerThin || "Ridgeway is a vendor.";

/* ── the thread ──────────────────────────────────────────────────────────────── */
var THREAD = [
  { cls: "user", text: PASTED[0] || "Here is everything about the Ridgeway account." },
  { cls: "ai good", text: ANSWER_FULL, measure: true },
  { cls: "paper", title: "onboarding-brief.pdf", ruled: 5 },
  { cls: "paper", title: "contract-2019.pdf", ruled: 4 },
  { cls: "paper", title: "Q2-review-thread.txt", ruled: 6 },
  { cls: "paper", title: "vendor-sheet-v4.xlsx", ruled: 5 },
];
var FIRST_FLOOD = 2;                       // index of the first pasted document

var threadEl = document.getElementById("thread");
var viewEl = document.getElementById("wview");
var pinnedEl = document.getElementById("pinned");

/** Build one message and return its element. Ragged rule widths give a page real texture. */
function message(spec, host) {
  var el = FX.el("msg " + spec.cls, host);
  if (spec.title) {
    FX.el("ptitle", el).textContent = spec.title;
    for (var k = 0; k < spec.ruled; k++) {
      var l = FX.el("pline", el);
      l.style.width = (k % 4 === 0 ? 56 : k % 3 === 0 ? 82 : 96) + "%";
    }
  } else {
    el.appendChild(document.createTextNode(spec.text));
  }
  if (spec.measure) FX.el("measure", el);
  return el;
}

var els = THREAD.map(function (spec) { return message(spec, threadEl); });
/* the reply that comes back — the same builder, so it is unmistakably one more message */
var thinEl = message({ cls: "ai", text: ANSWER_THIN, measure: true }, threadEl);

/* the sticky copy of the good answer. DOM position:sticky does not work inside a transformed
   scroller, so the pin is an explicit opaque element under the chrome. */
pinnedEl.appendChild(document.createTextNode(ANSWER_FULL));
var pinnedMeasure = FX.el("measure", pinnedEl);

/* ── lay the thread out ──────────────────────────────────────────────────────
   Absolute tops computed once from measured heights, so nothing reflows mid-animation and every
   scroll offset in the timeline is a number we can seek to exactly. */
var GAP = 22 * U;
var tops = [];
var yCur = 0;
var all = els.concat([thinEl]);
for (var i = 0; i < all.length; i++) {
  all[i].style.top = yCur + "px";
  tops.push(yCur);
  yCur += all[i].offsetHeight + GAP;
}
var heights = all.map(function (e) { return e.offsetHeight; });
var VIEW_H = viewEl.clientHeight;

/** The thread offset that puts the BOTTOM of message `n` on the bottom of the viewport (a real chat
 *  is bottom-anchored; it never shows dead space under the newest message). Never scrolls up. */
function anchor(n) {
  var bottom = tops[n] + heights[n];
  return Math.min(VIEW_H - bottom, 0);
}
/** Thumb scale for a thread whose last visible message is `n` — the stub that says "there is more". */
function thumbScale(n) {
  var contentH = tops[n] + heights[n];
  return Math.max(Math.min(VIEW_H / contentH, 1), 0.09);
}

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.14);                        // "The answer came back worse."
var b2 = beatAt(2, 0.34);                        // "Everyone calls that losing focus."
var b3 = beatAt(3, 0.56);                        // "It has no focus to lose…"
var ESTABLISH = Math.min(0.55, b1 * 0.34);
var PASTE_END = Math.max(b1 - 0.22, ESTABLISH + 0.35);
var FLOOD_N = THREAD.length - FIRST_FLOOD;
var STEP = (PASTE_END - ESTABLISH) / FLOOD_N;

var tl = gsap.timeline({ paused: true });

/* the two messages that are there from frame 1; everything after them waits below the fold */
gsap.set(els.slice(FIRST_FLOOD).concat([thinEl]), { opacity: 0, y: px(40) });
gsap.set([".measure"], { scaleX: 0 });
gsap.set("#thread", { y: anchor(FIRST_FLOOD - 1) });
gsap.set("#thumb", { scaleY: thumbScale(FIRST_FLOOD - 1) });
gsap.set("#pinned", { opacity: 0 });
gsap.set("#mythwrap", { opacity: 0, y: px(52) });
gsap.set("#cone", { opacity: 0, scaleY: 0.7 });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#budget", { opacity: 0 });
gsap.set("#bfill", { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: px(28) });
gsap.set("#scrim", { opacity: 0 });

/* ── b0: the flood. Each document shoves in and the thread scrolls to it ─────── */
for (var f = 0; f < FLOOD_N; f++) {
  var idx = FIRST_FLOOD + f;
  var at = ESTABLISH + f * STEP;
  tl.to(els[idx], { opacity: 1, y: 0, duration: STEP * 0.7, ease: "power3.out" }, at);
  tl.to("#thread", { y: anchor(idx), duration: STEP * 0.86, ease: "power2.inOut" }, at);
  tl.to("#thumb", { scaleY: thumbScale(idx), duration: STEP * 0.86, ease: "power2.inOut" }, at);
}
/* the good answer pins itself under the chrome the moment the thread scrolls past it */
tl.to("#pinned", { opacity: 1, duration: 0.22, ease: "power2.out" }, ESTABLISH + STEP * 0.55);

/* ── b1: the reply lands; the thread steps back; both answers get measured ───── */
var thinIdx = all.length - 1;
tl.to(thinEl, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b1);
tl.to("#thread", { y: anchor(thinIdx), duration: 0.5, ease: "power2.inOut" }, b1);
tl.to("#thumb", { scaleY: thumbScale(thinIdx), duration: 0.5, ease: "power2.inOut" }, b1);
/* the paste steps back by COLOUR, never by opacity — a semi-transparent page lets whatever is
   behind it print through, which is the defect this whole revision exists to remove */
tl.to(els.slice(FIRST_FLOOD), { filter: "brightness(0.5) saturate(0.6)", duration: 0.5, ease: "sine.inOut" }, b1);
tl.to(els[0], { filter: "brightness(0.55)", duration: 0.5, ease: "sine.inOut" }, b1);
tl.to(els[1], { filter: "brightness(0.55)", duration: 0.5, ease: "sine.inOut" }, b1);
/* THE MEASURE: each answer's rule draws at its own length — the full one, then the stub */
tl.to(pinnedMeasure, { scaleX: 1, duration: 0.42, ease: "power3.out" }, b1 + 0.24);
tl.to(thinEl.querySelector(".measure"), { scaleX: 1, duration: 0.34, ease: "power3.out" }, b1 + 0.46);

/* ── b2: the myth, on an opaque band ─────────────────────────────────────────── */
tl.to("#scrim", { opacity: 0.55, duration: 0.5, ease: "sine.out" }, b2 - 0.1);
tl.to("#mythwrap", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b2);
tl.to("#cone", { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }, b2 + 0.12);

/* ── b3: the strike, the bar, the line ───────────────────────────────────────── */
tl.to("#slash", { scaleX: 1, duration: 0.28, ease: "power3.out" }, b3);
tl.to("#cone", { opacity: 0, scaleY: 0.1, duration: 0.36, ease: "power3.in" }, b3 + 0.12);
/* KILLED MEANS GONE — the old hook parked the struck myth at 0.24 and it read as a smudge */
tl.to("#mythwrap", { opacity: 0, y: px(-40), duration: 0.36, ease: "power2.in" }, b3 + 0.3);
tl.to("#scrim", { opacity: 0.6, duration: 0.5, ease: "sine.inOut" }, b3 + 0.3);
/* the window drops out of the top band so the bar and the line own it outright */
tl.to("#win", { y: px(252), scale: 0.88, duration: 0.9, ease: "power2.inOut" }, b3 + 0.2);
tl.to("#budget", { opacity: 1, duration: 0.28 }, b3 + 0.42);
/* it does not fill up to something — it arrives already spent to the last cent */
tl.to("#bfill", { scaleX: 1, duration: 0.5, ease: "power4.out" }, b3 + 0.48);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b3 + 0.74);

HF.register("at-hook-v12", tl);
