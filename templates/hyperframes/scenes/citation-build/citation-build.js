/* citation-build — GSAP timeline for 010 s03. Assemble → authoritative → nothing behind it →
 * dissolve. Silent, deterministic, seek-driven. The dissolved end-state is the intended content.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 300;
var D = FRAMES / fps;
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(i, frac) { var t = beats.length > i ? beats[i] : D * frac; return cl(t, 0.12, D - 0.3); }
// 8 sentence beats — the citation begins forming from the FIRST sentence (never blank)
var tS1 = beatAt(0, 0.05);
var tS2 = Math.max(beatAt(1, 0.16), tS1 + 0.5);
var tS3 = Math.max(beatAt(2, 0.30), tS2 + 0.4);
var tBadge = Math.max(beatAt(3, 0.44), tS3 + 0.6);
var tBehind = Math.max(beatAt(4, 0.56), tBadge + 0.6);
var tDiss = Math.max(beatAt(5, 0.72), tBehind + 0.9);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set("#badge", { opacity: 0 });
gsap.set("#behind", { opacity: 0 });
gsap.set("#magnifier", { opacity: 0 });
gsap.set(".pt", { opacity: 0 });

// assemble: segments land one by one from the first beat, underline draws
tl.from("#seg1", { opacity: 0, y: 26 * U, duration: 0.45, ease: "power3.out" }, tS1);
tl.from("#seg2", { opacity: 0, y: 26 * U, duration: 0.45, ease: "power3.out" }, tS2);
tl.from("#seg3", { opacity: 0, y: 26 * U, duration: 0.45, ease: "power3.out" }, tS3);
tl.from("#underline", { scaleX: 0, opacity: 0, duration: 0.5, ease: "power2.out" }, tS2 + 0.2);

// looks authoritative
tl.to("#badge", { opacity: 1, duration: 0.4, ease: "power2.out" }, tBadge);

// magnifier sweeps in, the empty panel reveals
tl.fromTo("#magnifier", { opacity: 0, x: -160 * U, rotate: -10 }, { opacity: 1, x: 20 * U, rotate: 0, duration: 0.6, ease: "power2.out" }, tBehind);
tl.to("#badge", { opacity: 0.2, duration: 0.4, ease: "power1.inOut" }, tBehind + 0.1);
tl.fromTo("#behind", { opacity: 0, y: 34 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tBehind + 0.15);
tl.from(".brow", { opacity: 0, x: -18 * U, duration: 0.4, stagger: 0.12, ease: "power2.out" }, tBehind + 0.35);

// dissolve: the citation de-renders into particles; underline retracts; magnifier lifts
tl.to("#magnifier", { opacity: 0, y: -30 * U, duration: 0.4, ease: "power2.in" }, tDiss);
var segTargets = [{ dx: -130, dy: 60, r: -12 }, { dx: 0, dy: 90, r: 6 }, { dx: 140, dy: 64, r: 12 }];
["#seg1", "#seg2", "#seg3"].forEach(function (sel, i) {
  var t = segTargets[i];
  tl.to(sel, { x: t.dx * U, y: t.dy * U, rotate: t.r, filter: "blur(" + (10 * U) + "px)", opacity: 0, scale: 1.15, duration: 0.75, ease: "power2.in" }, tDiss + i * 0.06);
});
tl.to("#underline", { scaleX: 0, opacity: 0, duration: 0.5, ease: "power2.in" }, tDiss + 0.1);

// particles fly outward (deterministic angles)
var N = 12, R = 300 * U;
for (var i = 0; i < N; i++) {
  var a = (i / N) * Math.PI * 2;
  var x = Math.cos(a) * R, y = Math.sin(a) * (R * 0.7);
  tl.fromTo(".pt:nth-child(" + (i + 1) + ")",
    { opacity: 0, x: 0, y: 0, scale: 0.6 },
    { opacity: 0.9, x: x, y: y, scale: 1, duration: 0.7, ease: "power2.out" }, tDiss + 0.12);
  tl.to(".pt:nth-child(" + (i + 1) + ")", { opacity: 0, duration: 0.4, ease: "power1.in" }, tDiss + 0.55);
}

window.__timelines["citation-build"] = tl;
