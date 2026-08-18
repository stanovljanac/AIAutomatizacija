/* cws-whole-chat — 022 Short s2 (9:16). The mechanism as GRAVITY.
 *
 * Your chat is pinned to the top of the frame and never leaves it. You send ONE line; a ghost of the
 * WHOLE conversation detaches and falls down the frame, landing as a tower; a bar reads it from the
 * top down; one page flies back UP and becomes its answer; the tower drops out through the bottom.
 * Then it happens again, one line later and one storey taller — and on the third turn the tower no
 * longer fits, so its top is simply cut off under the chat. In 16:9 that has to be said with a
 * number; in 9:16 the frame itself says it.
 *
 * The frame is NEVER empty: the chat is the anchor and the tower is the visitor, so the tower
 * leaving is the point rather than a hole (lesson 2026-08-17).
 *
 * Deterministic, seek-driven (no callbacks — the capture engine seeks out of order).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cws-whole-chat", width: 1080, height: 1920, frames: 325, beatLo: 0.0, beatHi: 0.12 });
var D = S.D, beatAt = S.beatAt, props = S.props;
FX.init(S, { palette: "body", dust: 20, seed: 9, bloomY: 66 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });   // this scene drives its own camera

/* ── geometry ────────────────────────────────────────────────────────────────── */
var CHAT_X = 40, CHAT_Y = 46, CHAT_W = 1000, CHAT_H = 560;
var PITCH = 150, TOP = 24;
var BASE_N = 12;                    // the messages carried in from cws-forgot
var TURNS = 3;
var MSGS = BASE_N + 2 * TURNS;      // +1 you, +1 it, every turn

/* GAP is set so the escalation is FITS → BARELY → NO, not three towers of similar height: at 62 the
   third tower cleared the clip by only 6% of the frame and the payoff read as "about the same again".
   At 70 the turns are 840 / 980 / 1120px against an 880px band — turn 1 fits with room, turn 2 pushes
   past the top, turn 3 loses 240px of itself behind the chat and carries 58% of the frame. */
var BASE_Y = 1570, GAP = 70, PAGE_H = 36, TOWER_W = 760;
var PILE_N = 11;                    // the pages carried in from cws-forgot
var MAX_P = PILE_N + 2 * TURNS;     // 17 — the tallest tower, which is the one that will not fit
var GOLD = [10, 12, 14, 16];        // its own answers

/* ── the chat: the object cws-forgot already taught the viewer to recognise ──── */
var thread = document.getElementById("thread");
var r = FX.rng(23);
var bubs = [];
for (var i = 0; i < MSGS; i++) {
  var b = FX.el("bub " + (i % 2 === 0 ? "me" : "ai"), thread);
  var h = 108 + Math.round(r() * 46);
  var w = 420 + Math.round(r() * 200);
  b.style.top = FX.px(TOP + i * PITCH);
  b.style.width = FX.px(w);
  b.style.height = FX.px(h);
  for (var k = 0; k < (h > 138 ? 3 : 2); k++) {
    var l = FX.el("bl", b);
    l.style.left = FX.px(30);
    l.style.top = FX.px(28 + k * 30);
    l.style.width = FX.px((w - 74) * (0.5 + r() * 0.45));
  }
  b._y = TOP + i * PITCH;
  bubs.push(b);
}
/** the scroll that keeps message `n-1` sitting at the bottom of the panel */
function scrollFor(n) { return -Math.max(0, TOP + n * PITCH - 486); }

/* the ghost wears the chat's own shape, alternating sides, so what falls is legibly the conversation */
var ghost = document.getElementById("ghost");
var gr = FX.rng(23);
for (var g = 0; g < 6; g++) {
  var gl = FX.el("gl", ghost);
  var gw = 380 + Math.round(gr() * 190);
  gl.style.width = FX.px(gw);
  gl.style.top = FX.px(38 + g * 88);
  gl.style[g % 2 === 0 ? "right" : "left"] = FX.px(34);
}

/* ── the tower it all lands as ───────────────────────────────────────────────── */
var slabs = FX.pile(document.getElementById("towerhost"), {
  n: MAX_P, baseY: BASE_Y, w: TOWER_W, h: PAGE_H, gap: GAP, seed: 41, gold: GOLD,
});
var sweepBar = FX.sweep(document.getElementById("sweephost"), TOWER_W * 1.12);

/* ── the counter: what ONE line costs ────────────────────────────────────────── */
var chip = document.getElementById("chip");
var chipNum = FX.el("", chip, "b");
chip.insertBefore(document.createTextNode(props.sentLabel || "you sent 1 line · it read "), chipNum);
chip.appendChild(document.createTextNode(props.pagesLabel || " pages"));

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t0 = beatAt(0, 0.0);                          // "Between two messages it holds nothing."
var t1 = Math.max(beatAt(1, 0.24), t0 + 2.0);     // "Every time you hit send…"

var world = document.getElementById("world");
gsap.set(world, { scale: 1.3 });
gsap.set("#phone", { opacity: 0, y: FX.px(70) });
gsap.set("#chip", { opacity: 0 });
gsap.set("#ghost", { opacity: 0 });
gsap.set("#flyer", { opacity: 0 });
gsap.set("#impact", { opacity: 0 });
gsap.set("#floor", { opacity: 0 });
gsap.set(sweepBar, { opacity: 0 });
gsap.set("#thread", { y: FX.px(scrollFor(BASE_N)) });
for (var q = BASE_N; q < MSGS; q++) gsap.set(bubs[q], { opacity: 0 });
for (var p = PILE_N; p < MAX_P; p++) gsap.set(slabs[p], { opacity: 0 });

/* ── b0 — the camera gives ground and your chat is revealed above the pile, THEN the pile falls
   away. "Between two messages it holds nothing" is staged as the frame keeping the chat and losing
   everything else — emptiness as a departure, never as an empty frame. ─────────── */
FX.camera(tl, { at: t0 + 0.05, scale: 1, dur: 0.8, ease: "power2.inOut" });
FX.fromTo(tl, "#phone", { opacity: 0, y: FX.px(70) }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 0.28);
tl.to("#floor", { opacity: 1, duration: 0.4 }, t0 + 0.5);

/* the drop is timed to LAND on the end of b0, not a second early: the bare floor is the sentence
   ("it holds nothing"), and any longer than the sentence it stops being a beat and becomes a hole */
var wipe = Math.max(t1 - 0.95, 1.15);
tl.to("#towerhost", { y: FX.px(600), opacity: 0, duration: 0.55, ease: "power2.in" }, wipe);
FX.fromTo(tl, "#floor", { opacity: 1 }, { opacity: 0.35, duration: 0.5, ease: "power2.out" }, wipe + 0.5);

/* ── one turn, as one physical event ─────────────────────────────────────────── */
var READ = [0.72, 0.88, 1.05];

/**
 * @param {number} k    the turn (0-based)
 * @param {number} at   when your line is sent
 * @param {boolean} last  the last turn HOLDS: the tower that does not fit is the closing frame
 */
function turn(k, at, last) {
  var n = PILE_N + 1 + 2 * k;                    // pages handed over: 12, 14, 16
  var mine = bubs[BASE_N + 2 * k];
  var answer = bubs[BASE_N + 2 * k + 1];
  var topY = BASE_Y - (n - 1) * GAP - 12;

  /* you send one line — the only small thing in the whole sequence */
  FX.fromTo(tl, mine, { opacity: 0, y: FX.px(26), scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "back.out(2)" }, at);
  tl.to("#thread", { y: FX.px(scrollFor(BASE_N + 1 + 2 * k)), duration: 0.4, ease: "power2.out" }, at);
  FX.fromTo(tl, mine, { boxShadow: "0 0 " + FX.px(38) + " rgba(255,176,32,0.75)" },
    { boxShadow: "0 0 " + FX.px(0) + " rgba(255,176,32,0)", duration: 0.85, ease: "power2.out" }, at + 0.22);

  /* …and the WHOLE conversation detaches and falls. Two steps ON PURPOSE: it crosses the read zone
     at full size and only flattens in the last third. A ghost that squashes on the way down is a
     faint sliver for half a second, which leaves the bottom two thirds of a 9:16 frame empty under
     live narration — the exact defect the 2026-08-17 lesson is about, just in transit. */
  FX.fromTo(tl, "#ghost",
    { opacity: 0.95, y: 0, scaleY: 1, scaleX: 1 },
    { opacity: 0.95, y: FX.px(430), scaleY: 0.66, scaleX: 0.92, duration: 0.30, ease: "power2.in" }, at + 0.14);
  FX.fromTo(tl, "#ghost",
    { opacity: 0.95, y: FX.px(430), scaleY: 0.66, scaleX: 0.92 },
    { opacity: 0, y: FX.px(985), scaleY: 0.10, scaleX: 0.78, duration: 0.28, ease: "power1.in" }, at + 0.44);

  /* it lands as a tower, bottom page first, with weight */
  var land = at + 0.72;
  tl.set("#towerhost", { y: 0, opacity: 1 }, land - 0.02);
  for (var i = 0; i < n; i++) {
    FX.fromTo(tl, slabs[i], { opacity: 0, y: FX.px(-34) }, { opacity: 1, y: 0, duration: 0.18, ease: "power3.out" }, land + i * 0.013);
    tl.to(slabs[i], { filter: "brightness(1)", duration: 0.1 }, land);
  }
  for (var j = n; j < MAX_P; j++) tl.set(slabs[j], { opacity: 0 }, land - 0.02);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 0.14, ease: "power2.out" }, land + 0.18);
  tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.55, ease: "power2.out" }, land + 0.32);
  FX.count(tl, chipNum, { from: k === 0 ? 0 : PILE_N + 2 * k - 1, to: n, at: land, dur: 0.45, fmt: FX.comma });

  /* the bar reads it top-down — which in a vertical frame is just reading */
  var rd = land + 0.25, read = READ[k];
  FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.09 }, rd);
  FX.fromTo(tl, sweepBar, { y: FX.px(topY) }, { y: FX.px(BASE_Y + 18), duration: read, ease: "power1.inOut" }, rd);
  tl.to(sweepBar, { opacity: 0, duration: 0.1 }, rd + read);
  for (var d = 0; d < n; d++) {
    tl.to(slabs[n - 1 - d], { filter: "brightness(0.56)", duration: 0.1 }, rd + (d / n) * read);
  }

  /* it writes ONE page, and that page flies back UP into your chat as its answer */
  var wr = rd + read;
  FX.fromTo(tl, "#flyer", { opacity: 0, y: FX.px(topY - 900), scaleX: 1 },
    { opacity: 1, y: FX.px(topY - 924), duration: 0.14, ease: "power2.out" }, wr);
  FX.fromTo(tl, "#flyer",
    { opacity: 1, y: FX.px(topY - 924), scaleX: 1 },
    { opacity: 0, y: FX.px(CHAT_Y + 380 - 900), scaleX: 0.42, duration: 0.44, ease: "power2.inOut" }, wr + 0.15);
  FX.fromTo(tl, answer, { opacity: 0, y: FX.px(18), scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "back.out(2)" }, wr + 0.55);
  tl.to("#thread", { y: FX.px(scrollFor(BASE_N + 2 + 2 * k)), duration: 0.38, ease: "power2.out" }, wr + 0.55);

  /* …and the tower goes. Except the last one, which is the frame the scene ends on. */
  if (!last) {
    tl.to("#towerhost", { y: FX.px(560), opacity: 0, duration: 0.45, ease: "power2.in" }, wr + 0.62);
  } else {
    FX.camera(tl, { at: wr + 0.5, scale: 1.05, y: -30, dur: Math.max(D - wr - 0.55, 0.5), ease: "sine.out" });
  }
  return wr;
}

/* cycles 0 and 1 run tight; the last one gets the remainder, so the tower that does not fit is on
   screen for the end of the sentence instead of flashing past (the "no dead air" arithmetic) */
var STRIDE = 2.5;
/* the chip arrives WITH the first landing — showing "it read 0 pages" over a falling ghost states a
   number that is not true yet */
tl.to("#chip", { opacity: 1, duration: 0.26 }, t1 + 0.78);
for (var c = 0; c < TURNS; c++) turn(c, t1 + c * STRIDE, c === TURNS - 1);

/* FX.count writes its `from` at BUILD time; restate the opening value after the build. */
chipNum.textContent = "0";

HF.register("cws-whole-chat", tl);
