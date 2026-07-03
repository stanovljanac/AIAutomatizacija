/* prompt-card — GSAP timeline for 010 s11 / Short s6. Full-frame centered prompt, no zoom, pausable.
 * Silent, deterministic, seek-driven. Establishes the card on sentence 0 (never blank).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ heading?, prompt?, hint?, cardLabel? }
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
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("heading", props.heading);
setText("prompt", props.prompt);
setText("hint", props.hint);
setText("card-label", props.cardLabel);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.3); }
var tHead = beatAt(0, 0.05);
var tBody = Math.max(beats.length > 1 ? beatAt(1, 0.22) : tHead + 0.6, tHead + 0.5);
var tHint = Math.max(beatAt(Math.max(beats.length - 1, 0), 0.72), tBody + 0.8);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
gsap.set("#hint", { opacity: 0 });

// establish heading + card frame on sentence 0 (never blank)
tl.from("#heading", { opacity: 0, y: 26 * U, duration: 0.5, ease: "power3.out" }, tHead);
tl.from("#card", { opacity: 0, y: 40 * U, scale: 0.97, duration: 0.6, ease: "power3.out" }, tHead + 0.12);
// the prompt text reveals
tl.from("#prompt", { opacity: 0, duration: 0.5, ease: "power2.out" }, tBody);
// pause & screenshot hint
tl.to("#hint", { opacity: 1, duration: 0.45, ease: "power2.out" }, tHint);

window.__timelines["prompt-card"] = tl;
