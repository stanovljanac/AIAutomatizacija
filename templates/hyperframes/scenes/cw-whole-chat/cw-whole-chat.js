/* cw-whole-chat — 022 long s4, ALTERNATIVE TAKE. The disproportion, not the stack.
 *
 * Your chat is the anchor and never leaves the frame; the desk is a visitor. You send ONE line, a
 * ghost of the WHOLE conversation flies across and lands as paper, it is read, one page flies back
 * as its answer — and then the desk drops everything, which is now the POINT rather than a hole,
 * because the frame still has your chat in it. A chip counts what one line costs.
 *
 * Deterministic, seek-driven (no callbacks — the capture engine seeks out of order).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-whole-chat", width: 1920, height: 1080, frames: 544, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props;

FX.init(S, { palette: "body", dust: 22, seed: 9, bloomX: 62, bloomY: 50 });
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── geometry ────────────────────────────────────────────────────────────────── */
var DESK_X = 1290, DESK_Y = 856;          // design px; the desk sits right of centre
var BASE_Y = DESK_Y - 18;
var PILE_W = 620, PAGE_H = 18, GAP = 30;
var TURNS = 4;
var START_N = 11;                          // messages already in the chat when we arrive
var MAX_N = START_N + 2 * TURNS;           // +1 you, +1 it, every turn
var PITCH = 88, BUB_TOP = 26;

/* gold = its answers. Odd indices, so the alternation itself says "half of what you hand back is
   its own voice" — the point b1 makes out loud. */
var GOLD = [];
for (var gi = 1; gi < MAX_N; gi += 2) GOLD.push(gi);

FX.desk(document.getElementById("deskhost"), { w: 1060, top: DESK_Y, x: (DESK_X / 1920) * 100 });
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: MAX_N, baseY: BASE_Y, w: PILE_W, h: PAGE_H, gap: GAP, seed: 41,
  x: (DESK_X / 1920) * 100, gold: GOLD,
});
var sweepBar = FX.sweep(document.getElementById("sweephost"), PILE_W * 1.1);
gsap.set(sweepBar, { xPercent: -50, x: FX.px(DESK_X - 960) });

document.getElementById("brainlbl").textContent = props.wrong || "a brain";
document.getElementById("tag").textContent = props.tag || "its own last answer";
document.getElementById("kicker").textContent = props.title || "A desk, not a brain.";
document.getElementById("phonelbl").textContent = props.appLabel || "your chat";

/* ── the chat: the object the hook already taught the viewer to recognise ────── */
var thread = document.getElementById("thread");
var r = FX.rng(23);
var bubs = [];
for (var i = 0; i < MAX_N; i++) {
  var b = FX.el("bub " + (i % 2 === 0 ? "me" : "ai"), thread);
  var h = 54 + Math.round(r() * 22);
  var w = 210 + Math.round(r() * 150);
  b.style.top = FX.px(BUB_TOP + i * PITCH);
  b.style.width = FX.px(w);
  b.style.height = FX.px(h);
  for (var k = 0; k < (h > 66 ? 3 : 2); k++) {
    var l = FX.el("bl", b);
    l.style.left = FX.px(18);
    l.style.top = FX.px(16 + k * 17);
    l.style.width = FX.px((w - 46) * (0.5 + r() * 0.45));
  }
  b._y = BUB_TOP + i * PITCH;
  bubs.push(b);
}
/** the thread scroll that keeps message `n-1` sitting at the bottom of the panel */
function scrollFor(n) { return -Math.max(0, BUB_TOP + n * PITCH - 570); }

/* ── the counter: what ONE line costs ────────────────────────────────────────── */
var chip = document.getElementById("chip");
var chipNum = FX.el("", chip, "b");
chip.insertBefore(document.createTextNode(props.sentLabel || "you sent 1 line · it read "), chipNum);
chip.appendChild(document.createTextNode(props.pagesLabel || " pages"));

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.14), t0 + 1.6);    // "Every turn, you put the whole stack down…"
var t2 = Math.max(beatAt(2, 0.63), t1 + 5.0);    // "It reads the stack from the top…"
var t3 = Math.max(beatAt(3, 0.90), t2 + 3.0);    // "Then you hand it the stack again."

gsap.set(["#phone", "#phonelbl", "#deskhost", "#tag", "#kicker", "#chip", "#ghost", "#flyer"], { opacity: 0 });
gsap.set("#kicker", { y: FX.px(18) });
gsap.set(slabs, { opacity: 0 });
gsap.set("#thread", { y: FX.px(scrollFor(START_N)) });
for (var q = START_N; q < MAX_N; q++) gsap.set(bubs[q], { opacity: 0 });

/* b0 — the wrong picture goes; your chat and the desk that replaces it arrive */
tl.to(["#brain", "#brainlbl"], { opacity: 0, scale: 0.86, duration: 0.5, ease: "power2.in" }, t0 + 0.6);
FX.fromTo(tl, "#phone", { opacity: 0, x: FX.px(-70) }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, t0 + 0.55);
tl.to("#phonelbl", { opacity: 1, duration: 0.35 }, t0 + 1.0);
FX.fromTo(tl, "#deskhost", { opacity: 0, y: FX.px(60) }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, t0 + 0.85);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t0 + 1.15);

var PHONE_CX = 356, TOPBAR = 248;         // the chat panel's centre X and its first-message origin

/**
 * The HANDOVER half of a turn: you send one line, and a ghost of the WHOLE conversation crosses the
 * frame and lands as paper. `n` = how many messages the chat holds once your line is in.
 * Returns { land, n, topY } so the caller can chain the reading half onto it.
 */
function handover(k, at) {
  var n = START_N + 1 + 2 * k;            // 12, 14, 16, 18
  var mine = bubs[START_N + 2 * k];

  /* you send one line — the only small thing in the whole sequence */
  FX.fromTo(tl, mine, { opacity: 0, y: FX.px(26), scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, at);
  tl.to("#thread", { y: FX.px(scrollFor(n)), duration: 0.42, ease: "power2.out" }, at);
  FX.fromTo(tl, mine, { boxShadow: "0 0 " + FX.px(40) + " rgba(255,176,32,0.75)" },
    { boxShadow: "0 0 " + FX.px(0) + " rgba(255,176,32,0)", duration: 0.9, ease: "power2.out" }, at + 0.25);

  /* …and the WHOLE conversation is copied and handed over. TWO STEPS: it crosses the desk at full
     size and only flattens as it lands. A ghost that squashes on the way over is a thin sliver for
     most of its trip, which leaves the right half of a 16:9 frame bare under live narration — the
     defect the owner caught on the first 022 cut, re-created here in a different shape. */
  FX.fromTo(tl, "#ghost",
    { opacity: 0.95, x: 0, y: 0, scaleX: 1, scaleY: 1 },
    { opacity: 0.95, x: FX.px((DESK_X - PHONE_CX) * 0.62), y: FX.px((BASE_Y - 844) * 0.5), scaleX: 1.06, scaleY: 0.72, duration: 0.42, ease: "power2.in" }, at + 0.14);
  FX.fromTo(tl, "#ghost",
    { opacity: 0.95, x: FX.px((DESK_X - PHONE_CX) * 0.62), y: FX.px((BASE_Y - 844) * 0.5), scaleX: 1.06, scaleY: 0.72 },
    { opacity: 0, x: FX.px(DESK_X - PHONE_CX), y: FX.px(BASE_Y - 844), scaleX: 1.16, scaleY: 0.1, duration: 0.26, ease: "power1.in" }, at + 0.56);

  /* it lands as paper, bottom page first, with weight */
  var land = at + 0.78;
  for (var i = 0; i < n; i++) {
    FX.fromTo(tl, slabs[i], { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.2, ease: "power3.out" }, land + i * 0.014);
    tl.to(slabs[i], { filter: "brightness(1)", duration: 0.12 }, land);
  }
  FX.fromTo(tl, "#pilehost", { y: 0, opacity: 1 }, { y: 0, opacity: 1, duration: 0.05 }, land - 0.05);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 0.14, ease: "power2.out" }, land + 0.2);
  tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.55, ease: "power2.out" }, land + 0.34);
  FX.count(tl, chipNum, { from: k === 0 ? 0 : START_N + 2 * k - 1, to: n, at: land, dur: 0.5, fmt: FX.comma });

  return { land: land, n: n, topY: BASE_Y - (n - 1) * GAP - 8 };
}

/**
 * The READING half: a gold bar crosses the stack top-to-bottom (dimming what it has passed, so the
 * progress is visible), it writes ONE page, that page flies back and becomes its answer in your
 * chat, and the desk drops the rest. Returns the time the desk is clear.
 */
function readAndReturn(k, h, read) {
  var n = h.n, answer = bubs[START_N + 2 * k + 1];
  var rd = h.land + 0.55;

  FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.1 }, rd);
  FX.fromTo(tl, sweepBar, { y: FX.px(h.topY) }, { y: FX.px(BASE_Y + 16), duration: read, ease: "power1.inOut" }, rd);
  tl.to(sweepBar, { opacity: 0, duration: 0.12 }, rd + read);
  for (var j = 0; j < n; j++) {
    tl.to(slabs[n - 1 - j], { filter: "brightness(0.58)", duration: 0.12 }, rd + (j / n) * read);
  }

  /* it writes ONE page, and that page becomes its answer in your chat */
  var wr = rd + read + 0.06;
  var restY = answer._y + scrollFor(n + 1) + TOPBAR - 300;   // .flyer's CSS top is 300
  FX.fromTo(tl, "#flyer", { opacity: 0, x: 0, y: FX.px(h.topY - 300), scaleX: 1 },
    { opacity: 1, y: FX.px(h.topY - 322), duration: 0.16, ease: "power2.out" }, wr);
  FX.fromTo(tl, "#flyer",
    { x: 0, y: FX.px(h.topY - 322), scaleX: 1, opacity: 1 },
    { x: FX.px(PHONE_CX - DESK_X), y: FX.px(restY), scaleX: 0.4, opacity: 0, duration: 0.55, ease: "power2.inOut" }, wr + 0.18);
  FX.fromTo(tl, answer, { opacity: 0, y: FX.px(18), scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "back.out(2)" }, wr + 0.62);
  tl.to("#thread", { y: FX.px(scrollFor(n + 1)), duration: 0.4, ease: "power2.out" }, wr + 0.62);

  /* and the desk drops everything. Nothing is kept — but the frame still has your chat in it. */
  var fall = wr + 0.72;
  FX.fromTo(tl, "#pilehost", { y: 0, opacity: 1 }, { y: FX.px(230), opacity: 0, duration: 0.36, ease: "power2.in" }, fall);
  /* return when the drop STARTS, not when it ends: the next turn is chained from here so its ghost
     is already crossing while this pile is still falling. A cycle that waits for the previous one to
     finish leaves the read zone bare for a second, every turn (MOTION_SPEC §10). */
  return fall;
}

/* ── the run: each read longer, each stack bigger ─────────────────────────────────
 * The three turns are PACED ACROSS b1→b3, never chained back-to-back. Chaining makes the scene's
 * length the author's problem: with the turns packed they finished at ~11.5s of an 18.1s slot and
 * left FOUR SECONDS of bare desk before the closing handover (022 v2, the same defect in a new
 * shape — MOTION_SPEC §10). The read is what absorbs the slack, which is also the honest place to
 * put it: a taller stack takes longer to read. */
var CYC = Math.max((t3 - 0.55 - t1) / 3, 2.75);
var READ = [1.0, 1.1, 1.25].map(function (m) { return S.cl((CYC - 2.61) * m, 0.85, 2.6); });

/* turn 1 also carries the load-bearing label: its own answer is INSIDE what you hand back */
var tagEl = document.getElementById("tag");
tagEl.style.left = (((DESK_X + 330) / 1920) * 100) + "%";
tagEl.style.top = FX.px(BASE_Y - 9 * GAP - 24);
tl.to("#chip", { opacity: 1, duration: 0.3 }, t1 + 0.7);

for (var k = 0; k < 3; k++) {
  var h = handover(k, t1 + k * CYC);
  if (k === 0) {
    tl.to(tagEl, { opacity: 1, duration: 0.32, ease: "power3.out" }, h.land + 0.5);
    FX.fromTo(tl, slabs[9], { scale: 1 }, { scale: 1.08, duration: 0.26, yoyo: true, repeat: 1, ease: "power2.out" }, h.land + 0.5);
    tl.to(tagEl, { opacity: 0, duration: 0.28, ease: "power2.in" }, h.land + 2.2);
  }
  readAndReturn(k, h, READ[k]);
}

/* b3 — "Then you hand it the stack again." The biggest handover crosses, lands, and HOLDS: no read,
   no drop. The last thing on screen is the whole conversation sitting on the desk again. */
var last = S.cl(t3 - 0.5, t1 + 3 * CYC - 0.45, D - 1.5);
var hf = handover(3, last);
FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.12 }, hf.land + 0.45);
FX.fromTo(tl, sweepBar, { y: FX.px(hf.topY) }, { y: FX.px(BASE_Y + 16), duration: Math.max(D - hf.land - 0.6, 0.5), ease: "power1.in" }, hf.land + 0.45);
FX.camera(tl, { at: hf.land, scale: 1.05, x: -34, dur: Math.max(D - hf.land - 0.05, 0.6), ease: "sine.out" });

/* FX.count writes its `from` at BUILD time; restate the opening value after the build. */
chipNum.textContent = "0";

HF.register("cw-whole-chat", tl);
