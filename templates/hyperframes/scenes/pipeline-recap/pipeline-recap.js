/* pipeline-recap — GSAP timeline for 012 s14. Fields + nodes assemble → one gold token flows the
 * serpentine end to end, HALTING at both gates → the tally lands. Silent, deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "pipeline-recap", width: 1920, height: 1080, frames: 450, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, W = S.W, H = S.H, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

// 3 sentence beats
var tBuild = beatAt(0, 0.03);
var tFlow = Math.max(beatAt(1, 0.28), tBuild + 1.2);
var tTally = Math.max(beatAt(2, 0.72), tFlow + 2.6);

var tl = gsap.timeline({ paused: true });

// beat 0 — territory fields breathe in, nodes pop on in flow order
tl.fromTo(".field", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }, tBuild);
var order = ["#n1", "#n2", "#n3", "#n4", "#n5", "#n6", "#n7", "#n8", "#n9", "#n10", "#n11"];
for (var i = 0; i < order.length; i++) {
  tl.fromTo(order[i], { opacity: 0, scale: 0.6, y: 14 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.9)" }, tBuild + 0.3 + i * 0.09);
}

// beat 1 — ONE token flows end to end; nodes light as it passes; both gates HALT it
var stageH = H * 0.805;
function nodeCenter(sel) {
  var el = document.querySelector(sel);
  var left = parseFloat(el.style.left) / 100;
  var top = parseFloat(el.style.top) / 100;
  return { x: left * W + 90 * U - 17 * U, y: top * stageH + 44 * U - 17 * U };
}
var flowSpan = Math.max(2.4, tTally - tFlow - 0.3);
var stepT = flowSpan / 11.6; // 11 hops + 2 gate holds (0.3 step each)
var t = tFlow;
var start = nodeCenter("#n1");
tl.fromTo("#token", { opacity: 0, x: start.x, y: start.y }, { opacity: 1, duration: 0.25, ease: "power2.out" }, t);
for (var k = 1; k < order.length; k++) {
  var p = nodeCenter(order[k]);
  var isGate = order[k] === "#n5" || order[k] === "#n10";
  tl.to("#token", { x: p.x, y: p.y, duration: stepT, ease: "power1.inOut" }, t);
  t += stepT;
  // the node lights on arrival
  tl.to(order[k], { scale: 1.12, duration: 0.14, ease: "power2.out" }, t - 0.1);
  tl.to(order[k], { scale: 1, duration: 0.24, ease: "power2.inOut" }, t + 0.06);
  if (isGate) {
    // the gates HALT the token and flash gold
    tl.to(order[k], { boxShadow: "0 0 " + 46 * U + "px rgba(255,176,32,0.7)", duration: 0.2, ease: "power2.out" }, t);
    tl.to(order[k], { boxShadow: "0 " + 12 * U + "px " + 28 * U + "px rgba(0,0,0,0.5)", duration: 0.35, ease: "power2.inOut" }, t + 0.35);
    t += stepT * 0.8; // the visible pause
  }
}

// beat 2 — the tally: 2 gates · 3 checkers · 1 voice; checker nodes pulse green, gates gold
tl.fromTo("#tally", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, tTally);
tl.to("#n5, #n10", { boxShadow: "0 0 " + 40 * U + "px rgba(255,176,32,0.65)", duration: 0.35, ease: "power2.out" }, tTally + 0.25);
tl.to("#n3, #n4, #n9", { boxShadow: "0 0 " + 34 * U + "px rgba(34,211,167,0.55)", duration: 0.35, ease: "power2.out" }, tTally + 0.45);
tl.to("#token", { opacity: 0, duration: 0.3 }, tTally + 0.3);

HF.register("pipeline-recap", tl);
