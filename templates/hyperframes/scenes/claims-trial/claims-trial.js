/* claims-trial — GSAP timeline for 012 s08. Chips drop from the sentence strip → beams scan the
 * source card → green flips; the unsourced one shatters. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ exampleClaim?{text,source} }
 */
function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") return window.__hyperframes.getVariables();
  var out = {};
  try { var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]"); for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default; } catch (e) {}
  if (window.__hfVariables && typeof window.__hfVariables === "object") Object.assign(out, window.__hfVariables);
  return out;
}
var V = readVars();
var fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
var W = Number(V.width) > 0 ? Number(V.width) : 1920;
var H = Number(V.height) > 0 ? Number(V.height) : 1080;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 510;
var D = FRAMES / fps;
var props = V.props && typeof V.props === "object" ? V.props : {};
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

var ex = props.exampleClaim && typeof props.exampleClaim === "object" ? props.exampleClaim : {};
if (ex.text) document.getElementById("featText").textContent = "“" + String(ex.text) + "”";
if (ex.source) document.getElementById("srcTitle").textContent = String(ex.source);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 3 sentence beats
var tDrop = beatAt(0, 0.03);
var tScan = Math.max(beatAt(1, 0.34), tDrop + 1.4);
var tMute = Math.max(beatAt(2, 0.72), tScan + 2.0);

window.__timelines = window.__timelines || {};
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

window.__timelines["claims-trial"] = tl;
