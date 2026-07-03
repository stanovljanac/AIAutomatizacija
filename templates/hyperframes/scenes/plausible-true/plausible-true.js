/* plausible-true — GSAP timeline for 010 s08. Two words line up under "=", then drift apart as it
 * becomes "≠". Silent, deterministic, seek-driven (two crossfading operators, no text swap).
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
var IS_PORTRAIT = H > W;
if (IS_PORTRAIT) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
var tP = beatAt(0, 0.05);
var tEq = Math.max(beatAt(3, 0.44), tP + 1.0);
var tNe = Math.max(beatAt(4, 0.68), tEq + 0.9);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set(["#wt", "#op-eq"], { opacity: 0 });
gsap.set("#op-ne", { opacity: 0 });
gsap.set("#tag", { opacity: 0 });
gsap.set("#wp", { opacity: 0 });

// "plausible" lands
tl.fromTo("#wp", { opacity: 0, y: 34 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tP);

// "= true" — they line up
tl.fromTo("#op-eq", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, tEq);
tl.fromTo("#wt", { opacity: 0, y: 34 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tEq + 0.12);

// they drift apart; "=" becomes "≠"; the tag lands
var drift = (IS_PORTRAIT ? 60 : 120) * U;
if (IS_PORTRAIT) {
  tl.to("#wp", { y: -drift, duration: 0.7, ease: "power2.inOut" }, tNe);
  tl.to("#wt", { y: drift, duration: 0.7, ease: "power2.inOut" }, tNe);
} else {
  tl.to("#wp", { x: -drift, duration: 0.7, ease: "power2.inOut" }, tNe);
  tl.to("#wt", { x: drift, duration: 0.7, ease: "power2.inOut" }, tNe);
}
tl.to("#op-eq", { opacity: 0, scale: 0.7, duration: 0.3, ease: "power2.in" }, tNe);
tl.fromTo("#op-ne", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.9)" }, tNe + 0.1);
tl.to("#tag", { opacity: 1, duration: 0.5, ease: "power2.out" }, tNe + 0.35);

window.__timelines["plausible-true"] = tl;
