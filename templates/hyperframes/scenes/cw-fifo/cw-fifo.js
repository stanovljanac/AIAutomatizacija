/* cw-fifo — 022 s19.
 * Premise: the viewer's grievance ("I KNOW I told it that") is answered by showing the page they
 * pinned in the hook falling quietly off the front of the desk while newer pages keep landing. The
 * absence of any alarm is the design: no red, no cue, no label — just a gap where it used to be.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-fifo", width: 1920, height: 1080, frames: 483, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 67, bloomY: 50 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("chip").textContent = props.sourceChip || "rolling first-in-first-out · platform docs";
document.getElementById("kicker").textContent = props.title || "First in. First out.";
document.getElementById("pinlbl").textContent = props.pinLabel || "the thing you told it at the start";

var DESK_Y = P ? 1330 : 796;
FX.desk(document.getElementById("deskhost"), { w: P ? 900 : 1120, top: DESK_Y });
var N = 16, GAPY = 22, PIN = 1;             // the pinned page sits near the BOTTOM of the pile
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: N, baseY: DESK_Y - 16, w: P ? 700 : 740, gap: GAPY, seed: 41, gold: [PIN],
});
var pinY = (DESK_Y - 16) - PIN * GAPY;
/* the label stands OFF the paper, level with the page it names, and reaches it with a leader */
var PILE_L = 960 - (P ? 700 : 740) / 2;         // the pile's left edge
var LBL_X = P ? 60 : 96;
var lbl = document.getElementById("pinlbl");
lbl.style.top = FX.px(pinY - 26);
var line = document.getElementById("pinline");
line.style.top = FX.px(pinY + 4);
line.style.left = FX.px(LBL_X + (P ? 620 : 560));
line.style.width = FX.px(Math.max(PILE_L - LBL_X - (P ? 620 : 560) + 26, 40));
document.getElementById("gap").style.top = FX.px(pinY + 8);

var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.20), t0 + 1.6);   // "Some chat interfaces handle that quietly…"
var t2 = Math.max(beatAt(2, 0.73), t1 + 5.0);   // "So the thing you are certain you told it…"
var t3 = Math.max(beatAt(3, 0.95), t2 + 2.0);   // "It is not there."

gsap.set("#kicker", { opacity: 0 });
gsap.set(["#chip", "#gap"], { opacity: 0 });

/* the pinned page is found first — so the viewer knows exactly what to watch */
tl.to(["#pinlbl", "#pinline"], { opacity: 1, duration: 0.36, ease: "power3.out" }, t0 + 0.3);
tl.to(slabs[PIN], { scale: 1.05, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" }, t0 + 0.4);
tl.to("#chip", { opacity: 1, duration: 0.35 }, t1 - 0.4);
tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, t1 + 0.2);

/* new pages keep landing on top; the oldest slide off the FRONT and out of frame */
var drops = [0, PIN, 2, 3];
drops.forEach(function (idx, k) {
  var at = t1 + 0.9 + k * 0.85;
  tl.to(slabs[idx], { y: FX.px(300), x: FX.px(-120), rotation: -7, opacity: 0, duration: 0.75, ease: "power2.in" }, at);
  if (idx === PIN) {
    tl.to(["#pinlbl", "#pinline"], { opacity: 0, duration: 0.3, ease: "power2.in" }, at + 0.1);
    tl.to("#gap", { opacity: 1, duration: 0.5, ease: "sine.out" }, at + 0.5);
    tl.to("#gap", { opacity: 0.25, duration: 2.4, ease: "sine.inOut" }, at + 1.2);
  }
  /* and something new lands on top in the same breath, so the pile never looks emptied */
  var add = slabs[N - 1 - k];
  FX.fromTo(tl, add, { y: FX.px(-60), opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, at + 0.15);
});

/* the last framing is the hook's framing: the camera holds on the gap */
FX.camera(tl, { at: t2 + 0.2, scale: 1.12, y: -((pinY - 540) * 0.12) - 40, dur: 1.2, ease: "power2.inOut" });
tl.to(slabs.filter(function (_, i) { return drops.indexOf(i) < 0; }), { filter: "brightness(0.62)", duration: 0.8, ease: "sine.out" }, t3);

HF.register("cw-fifo", tl);
