/* cite-collapse — GSAP timeline for the 010 hook (16:9 + 9:16). Authoritative citations, then
 * red functional stamps per beat, then a SUSPENDED verdict. Silent, deterministic, seek-driven.
 *
 * VARIABLES CONTRACT: fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *   props: { kicker?, suspendedLabel? }
 * Duration: data-duration = (durationFrames - 0.5) / fps => ceils to EXACTLY durationFrames.
 * No exit tweens — the master Remotion timeline owns the cut.
 */

var S = HF.scene({ id: "cite-collapse", width: 1920, height: 1080, frames: 300 });
var fps = S.fps, W = S.W, H = S.H, D = S.D, props = S.props, beats = S.beats, cl = S.cl;

if (props.kicker && document.querySelector("#kicker .kicker-text")) document.querySelector("#kicker .kicker-text").textContent = String(props.kicker).trim();
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("verdict-text", props.suspendedLabel);

function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.12, D - 0.3);
}
// 5 sentence beats: enter, stamp0, stamp1, stamp2, verdict
var tEnter = beatAt(0, 0.05);
var t0 = Math.max(beatAt(1, 0.30), tEnter + 0.7);
var t1 = Math.max(beatAt(2, 0.44), t0 + 0.22);
var t2 = Math.max(beatAt(3, 0.58), t1 + 0.22);
var tV = Math.max(beatAt(4, 0.74), t2 + 0.5);

var tl = gsap.timeline({ paused: true });

// resting state
gsap.set("#stamp0, #stamp1, #stamp2", { opacity: 0 });
gsap.set("#verdict", { opacity: 0 });
gsap.set("#flash", { opacity: 0 });

// intro — kicker + the filing rise in, rows stagger
tl.from("#kicker", { opacity: 0, y: 14, duration: 0.5, ease: "power2.out" }, 0.1);
tl.from("#doc", { opacity: 0, y: 46 * (Math.min(W, H) / 1080), duration: 0.7, ease: "power3.out" }, tEnter);
tl.from(".cite", { opacity: 0, y: 22, duration: 0.5, stagger: 0.09, ease: "power2.out" }, tEnter + 0.28);
tl.from("#synthetic", { opacity: 0, duration: 0.4, ease: "power1.out" }, tEnter + 0.8);

// the stamps land, one per beat
function stamp(sel, at) {
  tl.to(sel, { opacity: 1, scale: 1, rotate: -9, duration: 0.26, ease: "power4.out" }, at);
}
stamp("#stamp0", t0);
stamp("#stamp1", t1);
stamp("#stamp2", t2);

// the verdict slams; the brief desaturates; a single functional flash
tl.to("#doc", { filter: "grayscale(0.85) brightness(0.62)", duration: 0.5, ease: "power2.inOut" }, tV);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.85, duration: 0.1, ease: "power2.out" }, tV + 0.02);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tV + 0.12);
tl.to("#verdict", { opacity: 1, scale: 1, rotate: -11, duration: 0.4, ease: "back.out(2.1)" }, tV + 0.04);

// NO exit — the master timeline owns the cut.
HF.register("cite-collapse", tl);
