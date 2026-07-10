/* verdict-not-trusted — GSAP timeline for 012 s02. Question → WORKS slam → NOT TRUSTED rotate-slam
 * → two gate glyphs rise. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stampA?, stampB? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 600;
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

if (props.stampA) document.getElementById("stampWorks").textContent = String(props.stampA).trim();
if (props.stampB) document.getElementById("stampTrust").textContent = String(props.stampB).trim().replace(/\s+/g, " ");

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 4 sentence beats
var tQ = beatAt(0, 0.03);
var tWorks = Math.max(beatAt(1, 0.24), tQ + 0.8);
var tTrust = Math.max(beatAt(2, 0.52), tWorks + 1.2);
var tGates = Math.max(beatAt(3, 0.76), tTrust + 1.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the question
tl.from("#question", { opacity: 0, y: 40 * U, duration: 0.55, ease: "power3.out" }, tQ);

// beat 1 — WORKS slams; the row of shipped episodes slides under it
tl.to("#question", { scale: 0.7, y: -105 * U, opacity: 0.55, duration: 0.5, ease: "power3.inOut" }, tWorks - 0.1);
tl.fromTo("#stampWorks", { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.34, ease: "power4.in" }, tWorks);
tl.fromTo("#ring", { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.6, duration: 0.7, ease: "power2.out" }, tWorks + 0.3);
tl.from(".ep", { opacity: 0, y: 34 * U, duration: 0.35, stagger: 0.08, ease: "back.out(1.8)" }, tWorks + 0.4);

// beat 2 — NOT TRUSTED rotate-slams over it; the question exits fully; the gold dims a notch
tl.to("#question", { opacity: 0, y: -170 * U, duration: 0.45, ease: "power2.in" }, tTrust);
tl.fromTo("#stampTrust", { opacity: 0, scale: 2.6, rotate: -8 }, { opacity: 1, scale: 1, rotate: -8, duration: 0.3, ease: "power4.in" }, tTrust);
tl.to("#stampWorks", { opacity: 0.5, duration: 0.4, ease: "power2.out" }, tTrust + 0.1);
tl.to("#stampTrust", { rotate: -6, duration: 0.35, ease: "back.out(2.5)" }, tTrust + 0.3);

// beat 3 — two gold gates rise; tagline underline sweeps on the stressed beat
tl.fromTo("#gateL", { opacity: 0, y: 90 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tGates);
tl.fromTo("#gateR", { opacity: 0, y: 90 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tGates + 0.12);
tl.from("#gateL .g-bar, #gateR .g-bar", { scaleY: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }, tGates + 0.3);
tl.to("#tagline", { opacity: 1, duration: 0.35, ease: "power2.out" }, tGates + 0.45);
tl.to("#rule", { scaleX: 1, duration: 0.5, ease: "power3.out" }, cl(tGates + 0.7, tGates + 0.5, D - 0.3));

window.__timelines["verdict-not-trusted"] = tl;
