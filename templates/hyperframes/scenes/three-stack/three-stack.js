/* three-stack — GSAP timeline for 010 s02. Three plates stack, then a gold "point of trust" seam.
 * Silent, deterministic, seek-driven. No exit tweens (master timeline owns the cut).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ markerLabel? }
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
var props = V.props && typeof V.props === "object" ? V.props : {};
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
document.documentElement.style.setProperty("--u", String(Math.min(W, H) / 1080));
if (props.markerLabel && document.getElementById("seam-pill")) document.getElementById("seam-pill").textContent = String(props.markerLabel).trim();

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(i, frac) { var t = beats.length > i ? beats[i] : D * frac; return cl(t, 0.12, D - 0.3); }
// 6 sentence beats — establish a plate from the FIRST sentence (never blank), stack across 0/1/2
var U = Math.min(W, H) / 1080;
var tA = beatAt(0, 0.05);
var tB = Math.max(beatAt(1, 0.20), tA + 0.5);
var tC = Math.max(beatAt(2, 0.36), tB + 0.5);
var tSeam = Math.max(beatAt(5, 0.72), tC + 1.0);    // "the point of trust"

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set("#seam", { opacity: 0 });

// plates slide + stack, one per sentence, from the very first beat
tl.from("#plateA", { opacity: 0, x: -80 * U, duration: 0.55, ease: "power3.out" }, tA);
tl.from("#plateB", { opacity: 0, x: 80 * U, duration: 0.55, ease: "power3.out" }, tB);
tl.from("#plateC", { opacity: 0, y: 60 * U, duration: 0.6, ease: "back.out(1.4)" }, tC);

// the seam takes over — plates dim, the gold marker glows in
tl.to(["#plateA", "#plateB", "#plateC"], { filter: "brightness(0.42) saturate(0.7)", duration: 0.55, ease: "power2.inOut" }, tSeam);
tl.fromTo("#seam", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, tSeam + 0.1);
tl.fromTo("#seam-pill", { boxShadow: "0 0 0 rgba(255,176,32,0)" }, { boxShadow: "0 0 " + (40 * U) + "px rgba(255,176,32,0.75)", duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, tSeam + 0.5);

window.__timelines["three-stack"] = tl;
