/* failure-log — GSAP timeline for 012 s15. Headline → 503 terminal + incident card → 531 counter
 * with source chip + check wave → dusk closes in on the lone silhouette. Silent, deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, label?, source? }
 */
var S = HF.scene({ id: "failure-log", width: 1920, height: 1080, frames: 900, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

var target = 531;
if (props.value != null) { var m = String(props.value).match(/(\d+)/); if (m) target = parseInt(m[1], 10); }
if (props.label) document.getElementById("countlabel").textContent = String(props.label);
if (props.source) document.getElementById("srcchip").textContent = String(props.source);

// 4 sentence beats
var tHead = beatAt(0, 0.03);
var tLog = Math.max(beatAt(1, 0.22), tHead + 1.4);
var tTests = Math.max(beatAt(2, 0.52), tLog + 3.0);
var tDesk = Math.max(beatAt(3, 0.8), tTests + 2.6);

var tl = gsap.timeline({ paused: true });

// beat 0 — the limitation, stated plainly
tl.from("#headline", { opacity: 0, y: 40 * U, duration: 0.55, ease: "power3.out" }, tHead);
tl.to("#bydesign", { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, tHead + 0.6);

// beat 1 — the REAL incident: terminal lines land, the build halts, the incident card slaps on
tl.to("#term", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tLog);
tl.fromTo("#tl1", { opacity: 0, x: -18 * U }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, tLog + 0.5);
tl.fromTo("#tl2", { opacity: 0, x: -18 * U }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, tLog + 1.1);
tl.fromTo("#tl3", { opacity: 0, x: -18 * U }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, tLog + 1.8);
tl.to("#term", { x: 4 * U, duration: 0.07 }, tLog + 2.1);
tl.to("#term", { x: -3 * U, duration: 0.07 }, tLog + 2.18);
tl.to("#term", { x: 0, duration: 0.07 }, tLog + 2.26);
tl.fromTo("#incident", { opacity: 0, scale: 1.5, rotate: 2 }, { opacity: 1, scale: 1, rotate: 2, duration: 0.3, ease: "power4.in" }, tLog + 2.35);

// beat 2 — the flip: terminal recedes; the tests counter ticks with its SOURCE CHIP + check wave
tl.to("#headline", { opacity: 0.35, scale: 0.9, y: -20 * U, duration: 0.5, ease: "power2.inOut" }, tTests);
tl.to("#term", { opacity: 0.22, scale: 0.94, duration: 0.5, ease: "power2.inOut" }, tTests);
tl.to("#testszone", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tTests + 0.2);
var cObj = { v: 0 };
var cEl = document.getElementById("count");
var countSpan = Math.max(1.2, Math.min(2.2, tDesk - tTests - 0.8));
tl.to(cObj, { v: target, duration: countSpan, ease: "power1.inOut", onUpdate: function () { cEl.textContent = String(Math.round(cObj.v)); } }, tTests + 0.35);
var waves = document.querySelectorAll("#checkwave span");
for (var wi = 0; wi < waves.length; wi++) {
  tl.fromTo(waves[wi], { opacity: 0, y: 16 * U }, { opacity: 1, y: 0, duration: 0.22, ease: "back.out(2)" }, tTests + 0.4 + (countSpan * wi) / waves.length);
}

// beat 3 — dusk: everything dims; the lamp cone and the one person remain
tl.to("#dusk", { opacity: 1, duration: 0.9, ease: "power2.inOut" }, tDesk);
tl.to("#term, #headline", { opacity: 0, duration: 0.6, ease: "power2.inOut" }, tDesk);
tl.to("#testszone", { opacity: 0.12, scale: 0.92, duration: 0.7, ease: "power2.inOut" }, tDesk + 0.1);
tl.to("#desk", { opacity: 1, duration: 0.7, ease: "power2.out" }, tDesk + 0.4);
tl.to("#lampcone", { opacity: 1, duration: 0.9, ease: "power2.out" }, tDesk + 0.7);
tl.fromTo("#deskline", { opacity: 0, y: 14 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, cl(tDesk + 1.2, tDesk, D - 0.4));

HF.register("failure-log", tl);
