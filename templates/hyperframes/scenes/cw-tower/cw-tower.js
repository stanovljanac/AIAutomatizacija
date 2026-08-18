/* cw-tower — 022 Short s2 (9:16). THE MECHANISM, VERTICAL.
 *
 * Premise: in portrait the only composition that fills the frame is growth UPWARD, so the argument
 * is staged as a tower that outgrows the shot. Nothing is ever deleted: the whole stack LIFTS off
 * the desk — that gap is "between two messages it holds nothing", emptiness as separation instead
 * of as an empty frame — is read while it hangs there, gains one page, and drops back with weight.
 * The camera gives ground only as fast as it must, so the tower still visibly grows: ~47% of the
 * frame on turn 1, ~60% by turn 4, with the measured count climbing beside it.
 *
 * Deterministic, seek-driven (no callbacks — the capture engine seeks out of order).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-tower", width: 1080, height: 1920, frames: 325, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 22, seed: 31, bloomY: P ? 62 : 52 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });   // this scene drives its own camera

/* ── geometry ────────────────────────────────────────────────────────────────── */
var DESK_Y = P ? 1585 : 890;
var BASE_Y = DESK_Y - 22;
var TOWER_W = P ? 760 : 720;
var GAP = P ? 58 : 34, PAGE_H = P ? 34 : 20;
var BASE_N = 11;                    // the pile carried in from s1
var TURNS = 4;
var MAX_N = BASE_N + 2 * TURNS;     // +1 your message, +1 its answer, every turn
var GOLD = [10, 12, 14, 16, 18];    // its own answers; the whites between them are yours
var LIFT = P ? -134 : -72;

FX.desk(document.getElementById("deskhost"), { w: P ? 960 : 1180, top: DESK_Y });
var tower = document.getElementById("towerhost");
var slabs = FX.pile(tower, { n: MAX_N, baseY: BASE_Y, w: TOWER_W, h: PAGE_H, gap: GAP, seed: 41, gold: GOLD });
for (var i = BASE_N; i < MAX_N; i++) gsap.set(slabs[i], { opacity: 0 });

var sweepBar = FX.sweep(document.getElementById("sweephost"), TOWER_W * 1.1);
document.getElementById("bare").style.top = FX.px(BASE_Y + 4);
document.getElementById("impact").style.top = FX.px(BASE_Y + 6);

/* ── the header: what the model actually read, and where the number comes from ── */
var SENT = Array.isArray(props.sent) && props.sent.length >= 8 ? props.sent : [154, 215, 279, 366, 433, 489, 548, 606];
var COUNT = [SENT[0], SENT[2], SENT[4], SENT[7]];
document.getElementById("chip").textContent = props.sourceChip || "measured · tiktoken o200k_base";
document.getElementById("numlbl").textContent = props.readLabel ? "tokens " + props.readLabel + " this turn" : "tokens read this turn";
var numNode = document.getElementById("num");

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.24), t0 + 1.6);   // "Every time you hit send…"

var world = document.getElementById("world");
gsap.set(world, { scale: P ? 1.3 : 1.12 });
gsap.set(["#chip", "#numlbl"], { opacity: 0 });

tl.to("#chip", { opacity: 1, duration: 0.3, ease: "power2.out" }, t0 + 0.35);
tl.to("#numlbl", { opacity: 1, duration: 0.3, ease: "power2.out" }, t0 + 0.45);

/**
 * ONE turn, as one physical event:
 *   your page lands on top → the tower LIFTS clear of the desk (the gap IS the emptiness) →
 *   a gold bar reads it top to bottom, longer every turn → its answer is written →
 *   the tower drops back with a contact flash, one page taller than it was.
 * `k` is the turn index; returns the time the tower is seated again.
 */
function turn(k, at, read) {
  var mine = slabs[BASE_N + 2 * k];        // the message you just sent
  var answer = slabs[BASE_N + 2 * k + 1];  // what it writes back
  var lift = 0.36, add = 0.3, drop = 0.4;

  /* you hit send */
  FX.fromTo(tl, mine, { opacity: 0, y: FX.px(-70) }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, at);

  /* the tower comes off the desk — and the desk under it is bare */
  FX.fromTo(tl, tower, { y: 0 }, { y: FX.px(LIFT), duration: lift, ease: "power2.out" }, at + 0.16);
  FX.fromTo(tl, "#bare", { opacity: 0 }, { opacity: 1, duration: 0.24, ease: "sine.out" }, at + 0.24);

  /* everything goes back in and is read again from scratch, including its own pages */
  var topY = BASE_Y - (BASE_N + 2 * k) * GAP + LIFT - 10;
  var r = at + 0.16 + lift + 0.06;
  FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.1 }, r);
  FX.fromTo(tl, sweepBar, { y: FX.px(topY) }, { y: FX.px(BASE_Y + LIFT + 20), duration: read, ease: "power1.inOut" }, r);
  tl.to(sweepBar, { opacity: 0, duration: 0.12 }, r + read);
  FX.count(tl, numNode, { from: k === 0 ? 0 : COUNT[k - 1], to: COUNT[k], at: r, dur: read, ease: "power1.inOut", fmt: FX.comma });

  /* it writes its answer */
  var w = r + read + 0.06;
  FX.fromTo(tl, answer, { opacity: 0.2, y: FX.px(-56) }, { opacity: 1, y: 0, duration: add, ease: "power3.out" }, w);

  /* and the whole thing drops back onto the desk */
  var d = w + add + 0.06;
  tl.to("#bare", { opacity: 0, duration: 0.18, ease: "power2.in" }, d);
  FX.fromTo(tl, tower, { y: FX.px(LIFT) }, { y: 0, duration: drop, ease: "back.out(1.9)" }, d);
  FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1, duration: 0.12, ease: "power2.out" }, d + drop * 0.55);
  tl.to("#impact", { opacity: 0, scale: 1.35, duration: 0.5, ease: "power2.out" }, d + drop * 0.55 + 0.14);
  return d + drop;
}

/* ── the run: four turns, each read longer than the last, the camera giving ground ── */
var READ = [0.78, 0.98, 1.20, 1.42];
var CAM = P ? [1.3, 1.19, 1.10, 1.03, 1.0] : [1.12, 1.08, 1.05, 1.02, 1.0];
var at = t0 + 0.12;

for (var k = 0; k < TURNS; k++) {
  if (k === 1) at = Math.max(at, t1 - 0.35);   // turn 2 opens on "every time you hit send"
  var end = turn(k, at, READ[k]);
  /* only as much pull-back as it takes to keep the growing tower in frame */
  FX.camera(tl, { at: at + 0.2, scale: CAM[k + 1], dur: Math.max(end - at - 0.2, 0.5), ease: "sine.inOut" });
  at = end + 0.12;
}

/* the last frame the Short hands to s3: the tower at full height, seated, still breathing */
FX.camera(tl, { at: at, scale: CAM[TURNS] * 1.02, dur: Math.max(D - at - 0.05, 0.4), ease: "sine.out" });

/* FX.count writes its `from` at BUILD time, so the last turn would leave the counter showing a
   mid-run value on frame 0. Restate the opening value once the timeline is built. */
numNode.textContent = FX.comma(0);

HF.register("cw-tower", tl);
