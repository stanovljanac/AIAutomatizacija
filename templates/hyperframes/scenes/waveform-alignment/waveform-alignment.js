/* waveform-alignment — GSAP timeline for 012 s10. Wave draws → pulses (it's THIS voice) →
 * word tokens click onto the ruler → caption/scene chips snap; scissors banned. Deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ term? }
 */
var S = HF.scene({ id: "waveform-alignment", width: 1920, height: 1080, frames: 630, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// 4 sentence beats
var tDraw = beatAt(0, 0.03);
var tPulse = Math.max(beatAt(1, 0.26), tDraw + 1.2);
var tTokens = Math.max(beatAt(2, 0.48), tPulse + 1.2);
var tSnap = Math.max(beatAt(3, 0.76), tTokens + 1.8);

var tl = gsap.timeline({ paused: true });

// beat 0 — one continuous take: the wave draws end to end, unbroken
tl.from("#toplabel", { opacity: 0, y: -26 * U, duration: 0.45, ease: "power3.out" }, tDraw);
var bw = document.getElementById("bwpath");
var bwlen = 3400;
gsap.set(bw, { strokeDasharray: bwlen, strokeDashoffset: bwlen });
tl.to(bw, { strokeDashoffset: 0, duration: Math.max(1.2, tPulse - tDraw - 0.1), ease: "power1.inOut" }, tDraw + 0.2);

// beat 1 — "the voice you're hearing right now": the wave PULSES on a fixed pattern, LIVE chip pops
tl.fromTo("#live", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, tPulse);
var pulses = [0, 0.35, 0.62, 1.0, 1.3, 1.68];
for (var pi = 0; pi < pulses.length; pi++) {
  tl.to("#bigwave", { scaleY: 1.18, duration: 0.14, ease: "power2.out" }, tPulse + pulses[pi]);
  tl.to("#bigwave", { scaleY: 1, duration: 0.2, ease: "power2.inOut" }, tPulse + pulses[pi] + 0.15);
}

// beat 2 — forced alignment: ruler appears; word tokens rise off the wave and CLICK onto it
tl.to("#ruler", { opacity: 1, duration: 0.4, ease: "power2.out" }, tTokens);
var toks = ["#tk1", "#tk2", "#tk3"];
var cons = ["#cn1", "#cn2", "#cn3"];
for (var ti = 0; ti < 3; ti++) {
  var at = tTokens + 0.25 + ti * 0.42;
  tl.fromTo(toks[ti], { opacity: 0, y: 150 * U, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.9)" }, at);
  tl.to(cons[ti], { scaleY: 1, duration: 0.3, ease: "power2.out" }, at + 0.2);
}

// beat 3 — captions + scenes SNAP to the words; the scissors get banned
tl.fromTo("#snapCap", { opacity: 0, y: -60 * U, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.in" }, tSnap);
tl.to("#snapCap", { scale: 1.08, duration: 0.12, ease: "power2.out" }, tSnap + 0.33);
tl.to("#snapCap", { scale: 1, duration: 0.2, ease: "power2.inOut" }, tSnap + 0.46);
tl.fromTo("#snapScn", { opacity: 0, y: -60 * U, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.in" }, tSnap + 0.3);
tl.to("#snapScn", { scale: 1.08, duration: 0.12, ease: "power2.out" }, tSnap + 0.63);
tl.to("#snapScn", { scale: 1, duration: 0.2, ease: "power2.inOut" }, tSnap + 0.76);
tl.fromTo("#scissors", { opacity: 0, y: -30 * U, rotate: -18 }, { opacity: 1, y: 0, rotate: 0, duration: 0.4, ease: "power2.out" }, tSnap + 0.85);
tl.fromTo("#ban", { opacity: 0, scale: 1.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power4.in" }, tSnap + 1.3);
tl.to("#scissors", { opacity: 0.4, duration: 0.3 }, tSnap + 1.55);
tl.fromTo("#bottomline", { opacity: 0, y: 16 * U }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, cl(tSnap + 1.6, tSnap, D - 0.3));

HF.register("waveform-alignment", tl);
