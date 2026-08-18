/* cw-handoff — 022 long s4 (16:9). THE MECHANISM HERO.
 *
 * Premise: nothing is kept, so the whole stack is HANDED OVER again every turn — and a handover is
 * a movement, not an erasure. The old cut wiped the desk in place, which reads as a render fault and
 * left the frame empty under live narration. Here the stack crosses the frame left → right: it lands,
 * is read (visibly slower each turn, because it is taller), gains one gold page of the model's own
 * answer, and recedes to the right as a dim ghost while the next, taller copy is already entering.
 * Four carriers, one per turn, so the handover truly OVERLAPS and the read zone is never bare.
 *
 * Deterministic, seek-driven (no callbacks — the capture engine seeks out of order).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-handoff", width: 1920, height: 1080, frames: 544, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 24, seed: 9, bloomY: P ? 58 : 50 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── geometry ────────────────────────────────────────────────────────────────── */
var DH = S.H / S.U;                       // design-space height (1080 landscape, 1920 portrait)
var DESK_Y = P ? 1440 : 838;
var BASE_Y = DESK_Y - 20;                 // where page 0 rests
var PILE_W = P ? 700 : 820;
var GAP = 34, PAGE_H = 20;                // a thick, loose ream — the stack has to have MASS
var CX = P ? 0 : -140;                    // the read zone sits left of centre; the trail gets the right
var GOLD = [9, 11, 13, 15];               // the model's own answers; the whites between are yours
var IN_X = P ? -900 : -1320;              // off-frame left  (a carrier starts here)
var TURNS = 4;

/* where a carrier parks once it has been handed over: a receding line up and to the right —
   distance without a 3D tilt (MOTION_SPEC §5 bans resting rotateX/Y on cards). */
var SLOT = [
  { x: 560, y: -30, s: 0.58, o: 0.30 },
  { x: 720, y: -70, s: 0.44, o: 0.20 },
  { x: 828, y: -104, s: 0.34, o: 0.13 },
];

FX.desk(document.getElementById("deskhost"), { w: P ? 1000 : 1880, top: DESK_Y });
var sweepBar = FX.sweep(document.getElementById("sweephost"), PILE_W * 1.08);
gsap.set(sweepBar, { xPercent: -50, x: FX.px(CX) });
document.getElementById("impact").style.left = "calc(50% + " + FX.px(CX) + ")";

document.getElementById("brainlbl").textContent = props.wrong || "a brain";
document.getElementById("tag").textContent = props.tag || "its own last answer";
document.getElementById("kicker").textContent = props.title || "A desk, not a brain.";

/* ── the four carriers: the SAME stack, one turn further on ──────────────────────
 * Carrier k opens with 11 + 2k pages and writes its gold answer as page 11 + 2k. Every carrier is
 * built from seed 41, so page i has identical jitter/tilt in all four — it is one object, not four
 * props that happen to look alike. */
var stage = document.getElementById("stage");
var carriers = [];
for (var k = 0; k < TURNS; k++) {
  var host = FX.el("carrier", stage);
  host.style.zIndex = String(k === TURNS - 1 ? 22 : 20 - k);
  host.style.transformOrigin = "50% " + ((BASE_Y / DH) * 100) + "%";
  var count = 12 + 2 * k;                 // pages once its own answer is written
  var slabs = FX.pile(host, { n: count, baseY: BASE_Y, w: PILE_W, h: PAGE_H, gap: GAP, seed: 41, gold: GOLD });
  gsap.set(host, { opacity: 0, x: FX.px(IN_X) });
  gsap.set(slabs[count - 1], { opacity: 0 });   // the answer this turn has not written yet
  carriers.push({ host: host, slabs: slabs, count: count });
}
/* the top of carrier k's stack while it is being read (before its answer lands) */
function readTop(k) { return BASE_Y - (carriers[k].count - 2) * GAP - 8; }

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.14), t0 + 1.6);    // "Every turn, you put the whole stack down…"
var t2 = Math.max(beatAt(2, 0.63), t1 + 5.0);    // "It reads the stack from the top…"
var t3 = Math.max(beatAt(3, 0.90), t2 + 3.0);    // "Then you hand it the stack again."

gsap.set(["#deskhost", "#tag", "#kicker", "#turnchip"], { opacity: 0 });
gsap.set("#tag", { x: FX.px(-16) });
gsap.set("#kicker", { y: FX.px(20) });

/* b0 — the wrong picture goes; the desk that replaces it runs the whole width */
tl.to(["#brain", "#brainlbl"], { opacity: 0, scale: 0.86, duration: 0.5, ease: "power2.in" }, t0 + 0.7);
FX.fromTo(tl, "#deskhost", { opacity: 0, y: FX.px(70) }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, t0 + 0.9);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t0 + 1.25);

/** The turn counter — a property tween + onUpdate, so an out-of-order seek still lands on the
 * right number (a callback would simply never fire). */
var turnNode = document.getElementById("turnchip");
function turnTo(n, at) {
  FX.count(tl, turnNode, { from: n, to: n, at: at, dur: 0.01, fmt: function (v) { return "turn " + Math.round(v); } });
  FX.fromTo(tl, turnNode, { scale: 1 }, { scale: 1.1, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" }, at);
}

/** A carrier lands: it slides in from off-frame left and settles with a contact flash. */
function land(k, at, dur) {
  var c = carriers[k];
  FX.fromTo(tl, c.host, { opacity: 1, x: FX.px(IN_X) }, { x: FX.px(CX), duration: dur, ease: "power3.out" }, at);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.8, scale: 1, duration: 0.14, ease: "power2.out" }, at + dur - 0.1);
  tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.55, ease: "power2.out" }, at + dur + 0.05);
}

/** It is read, top to bottom. `read` grows every turn — a taller stack takes longer to re-read. */
function readPass(k, at, read) {
  FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.1 }, at);
  FX.fromTo(tl, sweepBar, { y: FX.px(readTop(k)) }, { y: FX.px(BASE_Y + 18), duration: read, ease: "power1.inOut" }, at);
  tl.to(sweepBar, { opacity: 0, duration: 0.14 }, at + read);
  return at + read;
}

/** It writes ONE page — its own answer, in gold, on top of everything including your last one. */
function write(k, at) {
  var c = carriers[k];
  FX.fromTo(tl, c.slabs[c.count - 1], { opacity: 0.2, y: FX.px(-48) }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, at);
  return at + 0.32;
}

/** And it is handed over: away to the right, smaller and dimmer, onto the trail of its own copies. */
function handOver(k, at, dur) {
  var c = carriers[k], s = SLOT[k];
  FX.fromTo(tl, c.host,
    { x: FX.px(CX), y: 0, scale: 1, opacity: 1 },
    { x: FX.px(s.x), y: FX.px(s.y), scale: s.s, opacity: s.o, duration: dur, ease: "power2.out" }, at);
  /* it keeps receding for the rest of the scene, so the trail is never a frozen prop */
  tl.to(c.host, { x: FX.px(s.x + 46), opacity: s.o * 0.72, duration: Math.max(D - at - dur, 0.4), ease: "none" }, at + dur);
  return at + dur;
}

/* ═══════════════════════ turn 1 — landed, counted, and named ═══════════════════ */
land(0, t1, 0.62);
tl.to("#turnchip", { opacity: 1, duration: 0.3, ease: "power2.out" }, t1 + 0.25);
turnTo(1, t1 + 0.25);

/* the fan: every page steps out so the stack becomes countable, then closes again */
var c0 = carriers[0];
var fanAt = t1 + 0.85, fanClose = fanAt + 2.6;
c0.slabs.forEach(function (s, i) {
  if (i === c0.count - 1) return;                       // the unwritten answer stays hidden
  tl.to(s, { x: FX.px(s._dx - 150 + i * 30), rotation: s._rot * 0.4, duration: 0.5, ease: "power3.out" }, fanAt + i * 0.05);
  tl.to(s, { x: FX.px(s._dx), rotation: s._rot, duration: 0.45, ease: "power3.inOut" }, fanClose + i * 0.03);
});

/* the load-bearing detail: its own last answer is INSIDE the stack you hand back */
var tagEl = document.getElementById("tag");
tagEl.style.top = FX.px(c0.slabs[9]._y - 24);
tagEl.style.left = "calc(50% + " + FX.px(CX + 620) + ")";
tl.to(tagEl, { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, fanAt + 1.45);
FX.fromTo(tl, c0.slabs[9], { scale: 1 }, { scale: 1.09, duration: 0.26, yoyo: true, repeat: 1, ease: "power2.out" }, fanAt + 1.45);
tl.to(tagEl, { opacity: 0, duration: 0.3, ease: "power2.in" }, fanClose + 0.3);

/* ═══════════ turns 1–3 — read, write, hand over; the next is already coming in ══ */
var READ = [1.00, 1.45, 2.35];             // visibly slower every turn: there is more to re-read
var LAND = 0.55, GIVE = 0.9, OVERLAP = 0.60;
var at = fanClose + 0.45;

for (var i = 0; i < 3; i++) {
  if (i > 0) {
    land(i, at, LAND);
    tl.to("#turnchip", { opacity: 1, duration: 0.2 }, at);
    turnTo(i + 1, at + 0.1);
    at += LAND + 0.25;
  }
  at = write(i, readPass(i, at, READ[i]) + 0.1);
  handOver(i, at + 0.12, GIVE);
  at = at + 0.12 + GIVE - OVERLAP;         // the next carrier enters BEFORE this one has parked
}

/* ═══ b3 — "Then you hand it the stack again." The same stack, one page taller, holds ═══ */
var last = S.cl(Math.max(t3, at), t1 + 6, D - 1.05);
land(TURNS - 1, last, 0.7);
turnTo(TURNS, last + 0.35);
FX.camera(tl, { at: last + 0.5, scale: 1.06, dur: Math.max(D - last - 0.55, 0.6), ease: "sine.out" });

/* FX.count writes its `from` value at BUILD time, so the last turnTo() would otherwise leave the
   chip reading "turn 4" on frame 0. Restate the opening value after the timeline is built. */
turnNode.textContent = "turn 1";

HF.register("cw-handoff", tl);
