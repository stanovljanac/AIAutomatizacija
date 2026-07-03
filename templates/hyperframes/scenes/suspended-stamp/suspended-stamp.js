/* suspended-stamp — GSAP timeline for the 010 Short s4. License → SUSPENDED stamp → desaturate.
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
if (props.stampLabel && document.getElementById("stamp-text")) document.getElementById("stamp-text").textContent = String(props.stampLabel).trim();

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.3); }
var tCard = beatAt(0, 0.08);
var tStamp = Math.max(beatAt(1, 0.42), tCard + 0.7);
var tSub = Math.max(beatAt(2, 0.7), tStamp + 0.4);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#sub", { opacity: 0 });
gsap.set("#flash", { opacity: 0 });

tl.from("#license", { opacity: 0, y: 44 * U, scale: 0.95, duration: 0.6, ease: "power3.out" }, tCard);
tl.from("#lseal", { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(1.6)" }, tCard + 0.2);

// SUSPENDED slams; flash; the license desaturates
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.8, duration: 0.1, ease: "power2.out" }, tStamp);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tStamp + 0.1);
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -12, duration: 0.34, ease: "power4.out" }, tStamp + 0.02);
// desaturate the license content only — the red stamp must stay vivid (it's a child of the card)
tl.to([".lseal", ".ltitle", ".lname", ".lline", ".lmeta"], { filter: "grayscale(0.85) brightness(0.5)", opacity: 0.5, duration: 0.5, ease: "power2.inOut" }, tStamp + 0.1);
tl.to("#sub", { opacity: 1, duration: 0.4, ease: "power2.out" }, tSub);

window.__timelines["suspended-stamp"] = tl;
