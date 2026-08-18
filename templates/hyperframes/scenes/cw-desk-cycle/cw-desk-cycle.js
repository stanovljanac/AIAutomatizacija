/* cw-desk-cycle — 022 s4 (phase 1, 16:9) and Short s2 (phase 2, 9:16).
 * Premise: the argument is physical, so the scene has to be physical. A stack with mass lands on a
 * desk, is read top-to-bottom, gets one new page, and the desk is WIPED — then the identical stack
 * lands again, one page taller, faster each time. Nothing is kept; everything is re-handed.
 * Deterministic, seek-driven (no callbacks — tl.set() is a zero-duration tween and seeks correctly).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-desk-cycle", width: 1920, height: 1080, frames: 532, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 24, seed: 9, bloomY: P ? 58 : 52 });

var PHASE = Number(props.phase) || 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── the desk and the pile that lands on it ──────────────────────────────────── */
var DESK_Y = P ? 1330 : 742;
var PILE_Y = DESK_Y - 16;
var PILE_W = P ? 760 : 820;
var N = 11;

FX.desk(document.getElementById("deskhost"), { w: P ? 980 : 1180, top: DESK_Y });
var pileHost = document.getElementById("pilehost");
/* N pages + ONE spare: the spare is what makes the last landing literally "one page taller" */
var slabs = FX.pile(pileHost, { n: N + 1, baseY: PILE_Y, w: PILE_W, gap: 22, seed: 41, gold: [N - 1] });
var spare = slabs[N];
gsap.set(spare, { opacity: 0 });
var topY = PILE_Y - (N - 1) * 22;
var sweepBar = FX.sweep(document.getElementById("sweephost"), PILE_W * 1.1);

document.getElementById("brainlbl").textContent = props.wrong || "a brain";
document.getElementById("tag").textContent = props.tag || "its own last answer";
document.getElementById("kicker").textContent = props.title || "A desk, not a brain.";

/**
 * ONE turn of the mechanism, as a physical event: the stack lands, is read from the top, one page is
 * written, the desk is wiped. `k` scales the whole cycle (0.55 = a faster, later repeat).
 * Returns the time the desk is clean again.
 */
function cycle(at, k, opts) {
  opts = opts || {};
  var land = 0.42 * k, read = 0.62 * k, write = 0.3 * k, wipe = 0.26 * k;
  /* land — from above and slightly left, settling with overshoot: the stack has WEIGHT */
  tl.set(pileHost, { x: FX.px(-70), y: FX.px(-90), opacity: 0 }, at);
  tl.to(pileHost, { x: 0, y: 0, opacity: 1, duration: land, ease: "back.out(1.5)" }, at);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.75, scale: 1, duration: 0.12, ease: "power2.out" }, at + land - 0.06);
  tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.5, ease: "power2.out" }, at + land + 0.06);

  /* read — one gold bar travels the whole stack, top to bottom */
  var t = at + land + 0.1;
  tl.set(sweepBar, { y: FX.px(topY - 6), opacity: 0 }, t);
  tl.to(sweepBar, { opacity: 1, duration: 0.08 }, t);
  tl.to(sweepBar, { y: FX.px(PILE_Y + 16), duration: read, ease: "power1.inOut" }, t);
  tl.to(sweepBar, { opacity: 0, duration: 0.12 }, t + read);

  /* write — one new page lands on top of everything, including its own last answer */
  var w = t + read + 0.06;
  FX.fromTo(tl, slabs[N - 1], { y: FX.px(-46), opacity: 0.2 }, { y: 0, opacity: 1, duration: write, ease: "power3.out" }, w);
  if (opts.tag) {
    tl.to("#tag", { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, w + 0.1);
    tl.to("#tag", { opacity: 0, duration: 0.3, ease: "power2.in" }, w + 2.1);
  }

  /* wipe — one hard motion, with a visible smear. The desk keeps nothing. */
  var v = w + write + (opts.hold || 0.12);
  tl.to(pileHost, { x: FX.px(P ? 900 : 1500), opacity: 0, duration: wipe, ease: "power3.in" }, v);
  FX.fromTo(tl, "#wipe", { x: FX.px(-900), opacity: 0 }, { x: FX.px(900), opacity: 1, duration: wipe * 0.8, ease: "power2.in" }, v);
  tl.to("#wipe", { opacity: 0, duration: 0.12 }, v + wipe * 0.8);
  return v + wipe;
}

/* ═══════════════════════════════════ PHASE 1 — s4 ═══════════════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.14), t0 + 1.4);   // "Every turn, you put the whole stack down…"
  var t2 = Math.max(beatAt(2, 0.64), t1 + 6.0);   // "It reads the stack from the top…"
  var t3 = Math.max(beatAt(3, 0.92), t2 + 3.4);   // "Then you hand it the stack again."

  gsap.set(["#deskhost", "#tag", "#kicker"], { opacity: 0 });
  gsap.set(pileHost, { opacity: 0 });
  gsap.set("#tag", { y: FX.px(14) });
  gsap.set("#kicker", { y: FX.px(20) });

  /* b0 — the wrong picture goes, the desk arrives over it */
  tl.to(["#brain", "#brainlbl"], { opacity: 0, scale: 0.86, duration: 0.5, ease: "power2.in" }, t0 + 0.9);
  FX.fromTo(tl, "#deskhost", { opacity: 0, y: FX.px(70) }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, t0 + 1.1);
  tl.to("#kicker", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t0 + 1.5);

  /* b1 — the stack lands, FANS so you can count it, and its gold top page is named */
  tl.set(pileHost, { x: FX.px(-70), y: FX.px(-110), opacity: 0 }, t1 + 0.1);
  tl.to(pileHost, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, t1 + 0.1);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 0.14 }, t1 + 0.5);
  tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.6 }, t1 + 0.66);

  /* the fan: every page steps out so the stack becomes countable, then closes again */
  slabs.forEach(function (s, i) {
    if (i === N) return;
    tl.to(s, { x: FX.px(s._dx - 150 + i * 30), rotation: s._rot * 0.4, duration: 0.5, ease: "power3.out" }, t1 + 1.5 + i * 0.05);
  });
  tl.to("#tag", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t1 + 3.9);
  FX.fromTo(tl, slabs[N - 1], { scale: 1 }, { scale: 1.08, duration: 0.26, yoyo: true, repeat: 1, ease: "power2.out" }, t1 + 3.9);
  tl.to("#tag", { opacity: 0, duration: 0.3, ease: "power2.in" }, t2 - 1.5);
  slabs.forEach(function (s, i) {
    if (i === N) return;
    tl.to(s, { x: FX.px(s._dx), rotation: s._rot, duration: 0.45, ease: "power3.inOut" }, t2 - 1.4 + i * 0.03);
  });

  /* b2 — read, write, wipe. Then the cycle repeats, faster each time. */
  var c1 = cycle(t2 + 0.05, 1.0, { hold: 0.3 });
  var c2 = cycle(c1 + 0.28, 0.62);
  var c3 = cycle(c2 + 0.18, 0.44);

  /* b3 — and the identical stack lands again, one page taller */
  tl.set(pileHost, { x: FX.px(-70), y: FX.px(-110), opacity: 0 }, t3);
  tl.to(pileHost, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, t3);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1.04, duration: 0.14 }, t3 + 0.4);
  tl.to("#impact", { opacity: 0, scale: 1.35, duration: 0.7 }, t3 + 0.56);
  /* one page taller — an actual extra page, not a stretched stack */
  FX.fromTo(tl, spare, { opacity: 0, y: FX.px(-52) }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t3 + 0.6);
  FX.camera(tl, { at: t3 + 0.4, scale: 1.05, dur: Math.max(D - t3 - 0.5, 0.6), ease: "sine.out" });

/* ═══════════════ PHASE 3 — Short s1: the hook, on the object, in 3s ═════════════ */
} else if (PHASE === 3) {
  var w1 = beatAt(1, 0.42);   // "You have handed it the same pile of paper, over and over."
  gsap.set(["#brain", "#brainlbl", "#kicker", "#tag"], { opacity: 0 });
  gsap.set("#deskhost", { opacity: 1 });
  /* no title, no runway: the stack is already falling on frame one, and the cycle never stops */
  var k0 = cycle(-0.25, 0.78);
  var k1 = cycle(Math.min(k0 + 0.1, w1), 0.6);
  var k2 = cycle(k1 + 0.08, 0.46, { tag: true });
  cycle(k2 + 0.06, 0.38);
  FX.camera(tl, { at: 0, scale: 1.07, dur: D, ease: "sine.inOut" });

/* ═══════════════════════════════ PHASE 2 — Short s2 ═════════════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.25), u0 + 2.0);   // "Every time you hit send…"

  gsap.set(["#brain", "#brainlbl"], { opacity: 0 });
  gsap.set("#kicker", { opacity: 0 });
  gsap.set("#deskhost", { opacity: 1 });
  gsap.set("#tag", { opacity: 0, y: FX.px(14) });

  /* the pile is already here (carried from the Short's s1) and is wiped in front of you */
  var e0 = cycle(u0 - 0.2, 0.72);
  /* the HELD emptiness — the point of the beat, so it is composed, not accidental */
  tl.to("#deskhost", { opacity: 0.55, duration: 0.4, ease: "sine.out" }, e0);
  tl.to("#deskhost", { opacity: 1, duration: 0.3, ease: "sine.out" }, e0 + 0.9);
  /* then it all goes back in — including everything it said itself */
  var e1 = cycle(Math.max(u1, e0 + 1.0), 0.9, { tag: true });
  cycle(e1 + 0.2, 0.6);
  FX.camera(tl, { at: u1, scale: 1.06, dur: Math.max(D - u1 - 0.2, 0.8), ease: "sine.inOut" });
}

HF.register("cw-desk-cycle", tl);
