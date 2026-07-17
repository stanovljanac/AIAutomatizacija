/* claims-trial — GSAP timeline for 012 s08. Chips drop from the sentence strip → beams scan the
 * source card → green flips; the unsourced one shatters. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ exampleClaim?{text,source} }
 */
var S = HF.scene({ id: "claims-trial", width: 1920, height: 1080, frames: 510, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

var ex = props.exampleClaim && typeof props.exampleClaim === "object" ? props.exampleClaim : {};
if (ex.text) document.getElementById("featText").textContent = "“" + String(ex.text) + "”";
if (ex.source) document.getElementById("srcTitle").textContent = String(ex.source);

// 3 sentence beats
var tDrop = beatAt(0, 0.03);
var tScan = Math.max(beatAt(1, 0.34), tDrop + 1.4);
var tMute = Math.max(beatAt(2, 0.72), tScan + 2.0);

var tl = gsap.timeline({ paused: true });

// beat 0 — the sentence strip lands; the claims DROP out of it into the column
tl.from("#strip", { opacity: 0, y: -40 * U, duration: 0.5, ease: "power3.out" }, tDrop);
var chips = ["#chipA", "#chipB", "#chipC"];
for (var i = 0; i < chips.length; i++) {
  tl.fromTo(chips[i], { opacity: 0, y: -120 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "bounce.out" }, tDrop + 0.5 + i * 0.24);
}
tl.fromTo("#srccard", { opacity: 0, x: 70 * U }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tDrop + 0.7);

// beat 1 — beams fire; A and the FEATURED policy chip verify green; source card pulses gold
function verify(beamSel, chipSel, at) {
  tl.fromTo(beamSel, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.3, ease: "power2.in" }, at);
  tl.to("#srccard", { scale: 1.04, duration: 0.16, ease: "power2.out" }, at + 0.3);
  tl.to("#srccard", { scale: 1, duration: 0.28, ease: "power2.inOut" }, at + 0.48);
  tl.to(beamSel, { opacity: 0, duration: 0.3, ease: "power1.out" }, at + 0.55);
  tl.to(chipSel, { borderColor: "rgba(34,211,167,0.85)", duration: 0.3, ease: "power2.out" }, at + 0.5);
  tl.fromTo(chipSel + " .cc-badge", { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2)" }, at + 0.55);
}
// beams need vertical alignment to their chip rows
gsap.set("#beamA", { top: "22%" });
gsap.set("#beamB", { top: "47%" });
gsap.set("#beamC", { top: "72%" });
verify("#beamA", "#chipA", tScan);
verify("#beamB", "#chipB", tScan + 0.9);

// beat 2 — the third claim FAILS: red beam, red flip, shatter, "never spoken"
tl.fromTo("#beamC", { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.3, ease: "power2.in" }, tMute);
tl.to("#beamC", { opacity: 0, duration: 0.25 }, tMute + 0.45);
tl.to("#chipC", { borderColor: "rgba(255,92,92,0.9)", duration: 0.25, ease: "power2.out" }, tMute + 0.4);
tl.fromTo("#chipC .cc-badge", { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(2)" }, tMute + 0.45);
tl.to("#chipC", { x: 5 * U, duration: 0.07, ease: "power1.inOut" }, tMute + 0.72);
tl.to("#chipC", { x: -4 * U, duration: 0.07, ease: "power1.inOut" }, tMute + 0.8);
tl.to("#chipC", { x: 0, duration: 0.07, ease: "power1.inOut" }, tMute + 0.88);
tl.to("#chipC", { opacity: 0.25, scale: 0.96, duration: 0.4, ease: "power2.out" }, tMute + 0.95);
var frags = ["#chipC .f1", "#chipC .f2", "#chipC .f3", "#chipC .f4"];
var fx = [-40, 20, -15, 45];
for (var fi = 0; fi < frags.length; fi++) {
  tl.fromTo(frags[fi], { opacity: 1, y: 0, x: 0, rotate: 0 }, { opacity: 0, y: (90 + fi * 24) * U, x: fx[fi] * U, rotate: fx[fi], duration: 0.7, ease: "power1.in" }, tMute + 0.95);
}
tl.fromTo("#muted", { opacity: 0, y: 14 * U }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, cl(tMute + 1.2, tMute, D - 0.3));

HF.register("claims-trial", tl);
