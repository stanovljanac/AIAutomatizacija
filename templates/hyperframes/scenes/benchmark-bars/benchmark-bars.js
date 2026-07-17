/* benchmark-bars — GSAP timeline for the "Rise proof" beat (16:9 + 9:16).
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *   props: { kicker?, title?, leftLabel?, rightLabel?, leftPct?, rightPct?, delta?, source? }
 *
 * Duration: data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Number
 * count-ups run via onUpdate (seek-safe). Key moments map to revealsSeconds, else fractions.
 */

var S = HF.scene({ id: "benchmark-bars", width: 1920, height: 1080, frames: 300 });
var fps = S.fps, D = S.D, props = S.props, beats = S.beats, cl = S.cl;

// props
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker", null);
if (props.kicker && document.querySelector("#kicker .kicker-text")) document.querySelector("#kicker .kicker-text").textContent = String(props.kicker).trim();
setText("title", props.title);
setText("name-left", props.leftLabel);
setText("name-right", props.rightLabel);
setText("delta", props.delta);
setText("source", props.source);

var leftPct = Number(props.leftPct) >= 0 ? Number(props.leftPct) : 88;
var rightPct = Number(props.rightPct) >= 0 ? Number(props.rightPct) : 75;
document.getElementById("fill-left").style.height = leftPct + "%";
document.getElementById("fill-right").style.height = rightPct + "%";

// beat timing
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.15, D - 0.4);
}
var tIntro = 0.1;
var tLeft = beatAt(0, 0.18);
var tRight = beatAt(1, 0.45);
var tDelta = Math.max(beatAt(2, 0.72), tRight + 0.4);

// count-up proxies
var pL = { v: 0 }, pR = { v: 0 };
var valLeft = document.getElementById("val-left");
var valRight = document.getElementById("val-right");

var tl = gsap.timeline({ paused: true });

// resting state
gsap.set("#fill-left", { scaleY: 0 });
gsap.set("#fill-right", { scaleY: 0 });
gsap.set("#delta", { opacity: 0, scale: 0.4 });
gsap.set("#source", { opacity: 0 });

// intro
tl.fromTo("#kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tIntro);
tl.fromTo("#title", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, tIntro + 0.1);
tl.fromTo("#name-left", { opacity: 0 }, { opacity: 1, duration: 0.4 }, tIntro + 0.3);
tl.fromTo("#name-right", { opacity: 0 }, { opacity: 1, duration: 0.4 }, tIntro + 0.3);

// 1) Fable 5 bar grows + counts up
tl.to("#fill-left", { scaleY: 1, duration: 0.9, ease: "power3.out" }, tLeft);
tl.to(pL, { v: leftPct, duration: 0.9, ease: "power3.out", onUpdate: function () { valLeft.textContent = Math.round(pL.v) + "%"; } }, tLeft);

// 2) GPT-5.5 bar grows + counts up (shorter)
tl.to("#fill-right", { scaleY: 1, duration: 0.9, ease: "power3.out" }, tRight);
tl.to(pR, { v: rightPct, duration: 0.9, ease: "power3.out", onUpdate: function () { valRight.textContent = Math.round(pR.v) + "%"; } }, tRight);

// 3) +13 badge pops, source fades in, gold glow pulse
tl.to("#delta", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.6)" }, tDelta);
tl.to("#glow", { opacity: 1.2, scale: 1.1, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 }, tDelta);
tl.to("#source", { opacity: 1, duration: 0.5, ease: "power2.out" }, Math.min(tDelta + 0.3, D - 0.5));

// NO exit — the master timeline owns the cut.
HF.register("benchmark-bars", tl);
