/* human-gate — GSAP timeline for 010 s12. Draft → HUMAN CHECK gate → shipped. Silent, deterministic,
 * seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ gateLabel? }
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
if (props.gateLabel && document.getElementById("gate-sub")) document.getElementById("gate-sub").textContent = String(props.gateLabel).trim();

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
// 3 sentence beats
var tIntro = beatAt(0, 0.06);
var tGate = Math.max(beatAt(1, 0.34), tIntro + 0.7);   // "crosses a human before it ships"
var tShip = Math.max(beatAt(2, 0.68), tGate + 1.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
gsap.set("#approve", { opacity: 0 });
gsap.set("#shipped", { opacity: 0 });

// intro — the flow appears, gate present
tl.from("#gate", { opacity: 0, y: 30 * U, duration: 0.55, ease: "power3.out" }, tIntro);
tl.from("#doc", { opacity: 0, x: -60 * U, duration: 0.55, ease: "power3.out" }, tIntro + 0.15);

// the human check approves — gold ✓ stamp lands, gate glows
tl.to("#approve", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, tGate);
tl.to("#gate-pillar", { boxShadow: "0 " + (18 * U) + "px " + (46 * U) + "px rgba(0,0,0,0.45), 0 0 " + (44 * U) + "px rgba(255,176,32,0.5)", duration: 0.6, ease: "power2.out" }, tGate + 0.1);

// only then does it ship
tl.fromTo("#shipped", { opacity: 0, x: 40 * U, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, tShip);

window.__timelines["human-gate"] = tl;
