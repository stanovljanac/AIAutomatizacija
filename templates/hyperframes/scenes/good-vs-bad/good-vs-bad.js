/* good-vs-bad — GSAP timeline for 010 s10. Two chat panels: invent (silent) vs refuse (loud). The
 * refusal is highlighted as the stronger one. Silent, deterministic, seek-driven.
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
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
// 4 sentence beats
var tFrame = beatAt(0, 0.05);
var tBad = Math.max(beatAt(1, 0.28), tFrame + 0.7);
var tGood = Math.max(beatAt(2, 0.52), tBad + 0.9);
var tWin = Math.max(beatAt(3, 0.76), tGood + 0.9);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set(["#b-ai1", "#v-bad", "#b-ai2", "#v-good"], { opacity: 0 });
gsap.set(["#b-user1", "#b-user2"], { opacity: 0 });

// both panel frames + the user prompts appear
tl.from("#panel-bad", { opacity: 0, x: -50 * U, duration: 0.5, ease: "power3.out" }, tFrame);
tl.from("#panel-good", { opacity: 0, x: 50 * U, duration: 0.5, ease: "power3.out" }, tFrame);
tl.to("#b-user1", { opacity: 1, duration: 0.35, ease: "power2.out" }, tFrame + 0.4);
tl.to("#b-user2", { opacity: 1, duration: 0.35, ease: "power2.out" }, tFrame + 0.4);

// LEFT invents a confident cited answer
tl.fromTo("#b-ai1", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tBad);
tl.to("#v-bad", { opacity: 1, duration: 0.4, ease: "power2.out" }, tBad + 0.5);

// RIGHT refuses
tl.fromTo("#b-ai2", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tGood);
tl.to("#v-good", { opacity: 1, duration: 0.4, ease: "power2.out" }, tGood + 0.5);

// the refusal is the stronger one — right panel lifts + glows, left recedes
tl.to("#panel-good", { scale: 1.04, boxShadow: "0 " + (24 * U) + "px " + (60 * U) + "px rgba(0,0,0,0.5), 0 0 " + (46 * U) + "px rgba(255,176,32,0.4)", duration: 0.6, ease: "power2.out" }, tWin);
tl.to("#panel-bad", { opacity: 0.42, scale: 0.97, duration: 0.6, ease: "power2.inOut" }, tWin);

window.__timelines["good-vs-bad"] = tl;
