/* desk-pivot — GSAP timeline for 010 transitions (s04, s09). A gold sweep + chevrons drive a section
 * title in. Silent, deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ kicker?, title? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 150;
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
setText("ktext", props.kicker);
setText("ttl", props.title);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
var t0 = beats.length ? cl(beats[0], 0.08, D - 0.4) : D * 0.06;

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
gsap.set("#kicker", { opacity: 0 });
gsap.set(".chev span", { opacity: 0 });

// the gold rule sweeps across
tl.fromTo("#sweep", { x: -W * 0.7, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, t0);
// chevrons drive the eye forward
tl.to(".chev span", { opacity: 1, x: 10 * U, duration: 0.3, stagger: 0.08, ease: "power2.out" }, t0 + 0.2);
// kicker + title snap in
tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power2.out" }, t0 + 0.25);
tl.fromTo("#ttl", { opacity: 0, y: 30 * U, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, t0 + 0.35);

window.__timelines["desk-pivot"] = tl;
