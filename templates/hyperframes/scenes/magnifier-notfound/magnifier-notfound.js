/* magnifier-notfound — GSAP timeline for the 010 Short s2. Citation → magnifier sweep → NOT FOUND.
 * Silent, deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stampLabel? }
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
var W = Number(V.width) > 0 ? Number(V.width) : 1080;
var H = Number(V.height) > 0 ? Number(V.height) : 1920;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 180;
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
if (props.stampLabel && document.getElementById("stamp-text")) document.getElementById("stamp-text").textContent = String(props.stampLabel).trim();

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.3); }
var tCard = beatAt(0, 0.06);
var tStamp = Math.max(beatAt(1, 0.46), tCard + 0.8);
var tSub = Math.max(beatAt(2, 0.7), tStamp + 0.5);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
gsap.set("#magnifier", { opacity: 0 });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#sub", { opacity: 0 });
gsap.set("#flash", { opacity: 0 });

tl.from("#card", { opacity: 0, y: 40 * U, scale: 0.95, duration: 0.6, ease: "power3.out" }, tCard);
tl.from("#cite", { opacity: 0, y: 18 * U, duration: 0.45, ease: "power2.out" }, tCard + 0.2);
tl.from("#underline", { scaleX: 0, opacity: 0, duration: 0.45, ease: "power2.out" }, tCard + 0.35);

// magnifier sweeps across the citation
tl.fromTo("#magnifier", { opacity: 0, x: -60 * U, rotate: -8 }, { opacity: 1, x: 300 * U, rotate: 4, duration: 0.9, ease: "power1.inOut" }, tStamp - 0.7);
// NOT FOUND slams; a single functional flash
tl.to("#magnifier", { opacity: 0, duration: 0.3, ease: "power2.in" }, tStamp);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.8, duration: 0.1, ease: "power2.out" }, tStamp);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tStamp + 0.1);
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -11, duration: 0.34, ease: "power4.out" }, tStamp + 0.02);
// desaturate the citation content only — the red stamp must stay vivid (it's a child of the card)
tl.to(["#cite", "#underline"], { filter: "grayscale(0.75) brightness(0.55)", opacity: 0.5, duration: 0.5, ease: "power2.inOut" }, tStamp + 0.1);
tl.to("#sub", { opacity: 1, duration: 0.4, ease: "power2.out" }, tSub);

window.__timelines["magnifier-notfound"] = tl;
