/* machine-section — GSAP timeline for 012 s06. Blue wash flip → title → gold rule sweep →
 * subtitle + empty diagram sockets. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ kicker?, title?, subtitle? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 240;
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

if (props.kicker) document.getElementById("kicker").textContent = String(props.kicker).toUpperCase();
if (props.title) document.getElementById("title").textContent = String(props.title).toUpperCase();
if (props.subtitle) document.getElementById("subtitle").textContent = String(props.subtitle);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 2 sentence beats
var tIn = beatAt(0, 0.05);
var tShape = Math.max(beatAt(1, 0.5), tIn + 1.0);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the chapter flips blue; kicker + title land
tl.fromTo("#bluewash", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, tIn);
tl.from("#kicker", { opacity: 0, y: -24 * U, duration: 0.4, ease: "power3.out" }, tIn + 0.1);
tl.from("#title", { opacity: 0, y: 50 * U, scale: 0.92, duration: 0.55, ease: "power3.out" }, tIn + 0.22);

// beat 1 — the promise: gold rule sweeps, subtitle lands, the EMPTY canvas sockets appear
tl.to("#rule", { scaleX: 1, duration: 0.5, ease: "power3.out" }, tShape);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tShape + 0.25);
tl.to("#canvasdots", { opacity: 1, duration: 0.7, ease: "power2.out" }, tShape + 0.35);
tl.from(".socket", { scale: 0.4, duration: 0.5, stagger: 0.06, ease: "back.out(1.8)" }, tShape + 0.35);

window.__timelines["machine-section"] = tl;
