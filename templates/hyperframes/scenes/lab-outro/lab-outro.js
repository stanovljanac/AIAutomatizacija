/* lab-outro — GSAP timeline for 012 s17. The lab title → the dim diagram + one hot station
 * ("next build") → single subscribe. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ title?, subtitle? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 360;
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

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 3 sentence beats
var tLab = beatAt(0, 0.04);
var tDiag = Math.max(beatAt(1, 0.3), tLab + 0.9);
var tSub = Math.max(beatAt(2, 0.72), tDiag + 1.6);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the lab
tl.from("#lab", { opacity: 0, y: 40 * U, duration: 0.55, ease: "power3.out" }, tLab);

// beat 1 — every station gets its own build: the dim diagram breathes in; ONE node runs hot
tl.to("#minidiag", { opacity: 1, duration: 0.6, ease: "power2.out" }, tDiag);
tl.from(".mnode", { scale: 0.3, duration: 0.4, stagger: 0.05, ease: "back.out(1.8)" }, tDiag);
tl.to("#labsub", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tDiag + 0.3);
tl.to("#hotnode", { scale: 1.5, duration: 0.35, ease: "power2.out" }, tDiag + 0.8);
tl.to("#hotnode", { scale: 1.25, duration: 0.4, ease: "power2.inOut" }, tDiag + 1.2);
tl.fromTo("#nexttag", { opacity: 0, y: 12 * U }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.8)" }, tDiag + 1.0);

// beat 2 — one subtle CTA
tl.fromTo("#subrow", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }, tSub);
tl.to(".subbtn", { scale: 1.06, duration: 0.25, ease: "power2.out" }, tSub + 0.5);
tl.to(".subbtn", { scale: 1, duration: 0.3, ease: "power2.inOut" }, tSub + 0.78);

window.__timelines["lab-outro"] = tl;
