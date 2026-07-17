/* qa-eye — GSAP timeline for 012 s12. Lens scans the strip → checklist ticks → the bad frame is
 * caught, pulled out, FIXED, reinserted → "caught & fixed". Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ items?[] }
 */
var S = HF.scene({ id: "qa-eye", width: 1920, height: 1080, frames: 660, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, W = S.W, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

var items = Array.isArray(props.items) ? props.items : null;
if (items && items.length >= 4) {
  for (var ii = 0; ii < 4; ii++) document.querySelector("#chk" + (ii + 1) + " .chk-text").textContent = String(items[ii]);
}

// 4 sentence beats
var tScan = beatAt(0, 0.03);
var tChecks = Math.max(beatAt(1, 0.24), tScan + 1.2);
var tCatch = Math.max(beatAt(2, 0.55), tChecks + 1.8);
var tWhy = Math.max(beatAt(3, 0.82), tCatch + 2.4);

var stripW = 0.94 * W;

var tl = gsap.timeline({ paused: true });

// beat 0 — the strip rolls in; the lens starts its pass
tl.from("#filmstrip", { opacity: 0, x: 80 * U, duration: 0.55, ease: "power3.out" }, tScan);
tl.fromTo("#lens", { opacity: 0, x: -0.05 * stripW }, { opacity: 1, x: 0.06 * stripW, duration: 0.4, ease: "power2.out" }, tScan + 0.4);
tl.to("#lens", { x: 0.88 * stripW, duration: Math.max(1.6, tCatch - tScan - 1.0), ease: "power1.inOut" }, tScan + 0.85);

// beat 1 — the checklist ticks in with tight stagger while the lens keeps moving
var chks = ["#chk1", "#chk2", "#chk3", "#chk4"];
for (var ci = 0; ci < 4; ci++) {
  tl.fromTo(chks[ci], { opacity: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.7)" }, tChecks + ci * 0.28);
  tl.fromTo(chks[ci] + " .chk-box", { scale: 1.6 }, { scale: 1, duration: 0.24, ease: "back.out(2.2)" }, tChecks + ci * 0.28 + 0.14);
}

// beat 2 — THE CATCH: lens snaps back onto the bad frame; red flag; frame pops out and gets fixed
var badX = 0.36 * stripW; // approx. center of frame 3 of 6
tl.to("#lens", { x: badX, duration: 0.35, ease: "power3.out" }, tCatch);
tl.to("#lens .lens-ring", { borderColor: "#ff5c5c", boxShadow: "0 0 " + 38 * U + "px rgba(255,92,92,0.55)", duration: 0.2 }, tCatch + 0.3);
tl.fromTo("#flagx", { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power3.in" }, tCatch + 0.4);
tl.to("#badframe", { borderColor: "rgba(255,92,92,0.95)", boxShadow: "0 0 " + 30 * U + "px rgba(255,92,92,0.4)", duration: 0.25 }, tCatch + 0.4);
tl.to("#badframe", { y: -70 * U, scale: 1.12, duration: 0.45, ease: "back.out(1.4)" }, tCatch + 0.75);
// the FIX: the overflowing caption bar shrinks back into the safe band
tl.to("#badcap", { height: 20 * U, bottom: "10%", backgroundColor: "rgba(242,245,248,0.55)", duration: 0.5, ease: "power2.inOut" }, tCatch + 1.3);
tl.to("#flagx", { opacity: 0, duration: 0.25 }, tCatch + 1.75);
tl.to("#badframe", { y: 0, scale: 1, borderColor: "rgba(34,211,167,0.85)", boxShadow: "0 0 " + 26 * U + "px rgba(34,211,167,0.35)", duration: 0.45, ease: "power2.inOut" }, tCatch + 1.9);
tl.to("#lens .lens-ring", { borderColor: "#FFB020", boxShadow: "0 0 " + 38 * U + "px rgba(255,176,32,0.4)", duration: 0.3 }, tCatch + 1.9);

// beat 3 — why it exists: the strip pulses green once; the caught counter lands
tl.to(".fframe", { borderColor: "rgba(34,211,167,0.7)", duration: 0.4, stagger: 0.05, ease: "power2.out" }, tWhy);
tl.fromTo("#caught", { opacity: 0, y: 20 * U }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" }, cl(tWhy + 0.4, tWhy, D - 0.3));

HF.register("qa-eye", tl);
