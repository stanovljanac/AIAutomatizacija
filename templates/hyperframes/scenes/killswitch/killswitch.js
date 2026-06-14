/* killswitch — GSAP timeline for the "Fall climax" beat (16:9 + 9:16).
 *
 * VARIABLES CONTRACT (see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *   props: { kicker?, coreLabel?, orderLabel?, offLabel? }
 *
 * Duration: data-duration = (durationFrames - 0.5) / fps. Determinism: NO Math.random /
 * Date.now. One paused, seek-driven GSAP timeline. Glow pulse lives on a SEPARATE element from
 * the core's dark transition so seeking never has two tweens fighting over one property.
 */

function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") {
    return window.__hyperframes.getVariables();
  }
  var out = {};
  try {
    var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
    for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default;
  } catch (e) {}
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
var beats = Array.isArray(V.revealsSeconds)
  ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; })
  : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
var IS_PORTRAIT = H > W;
if (IS_PORTRAIT) root.classList.add("portrait");
document.documentElement.style.setProperty("--u", String(Math.min(W, H) / 1080));

if (props.kicker && document.querySelector("#kicker .kicker-text")) document.querySelector("#kicker .kicker-text").textContent = String(props.kicker).trim();
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("core-label", props.coreLabel);
setText("stamp-text", props.orderLabel);
setText("off-text", props.offLabel);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.15, D - 0.4);
}
var tCore = beatAt(0, 0.08);
var tOrder = Math.max(beatAt(1, 0.42), tCore + 0.8);
var tDark = Math.max(beatAt(2, 0.6), tOrder + 0.5);
var tOff = Math.max(beatAt(3, 0.78), tDark + 0.4);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// resting state
gsap.set("#core", { opacity: 0, scale: 0.85 });
gsap.set("#core-glow", { opacity: 0, scale: 0.9 });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#off", { opacity: 0, scale: 0.8 });
gsap.set("#flash", { opacity: 0 });

// intro: core powers up
tl.fromTo("#kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.1);
tl.to("#core", { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.5)" }, tCore);
tl.to("#core-glow", { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, tCore);
// alive pulse on the glow only (separate element) — a few deterministic breaths until the order hits
tl.to("#core-glow", { opacity: 0.55, scale: 1.08, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.round((tOrder - tCore) / 0.7)) }, tCore + 0.7);

// the export order slams in
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -8, duration: 0.32, ease: "power4.out" }, tOrder);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.1, ease: "power2.out" }, tOrder + 0.02);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tOrder + 0.12);

// the core goes dark: glow dies, color drains, border + label gray out
tl.to("#core-glow", { opacity: 0, scale: 0.8, duration: 0.5, ease: "power2.in" }, tDark);
tl.to("#core", {
  filter: "grayscale(1) brightness(0.5)",
  borderColor: "#3a3630",
  boxShadow: "0 0 0 rgba(0,0,0,0), inset 0 0 calc(60px * var(--u)) rgba(0,0,0,0.6)",
  duration: 0.6, ease: "power2.inOut"
}, tDark);
tl.to("#core-label", { color: "#5a554c", textShadow: "none", duration: 0.6, ease: "power2.inOut" }, tDark);
// stamp recedes as the verdict takes over
tl.to("#stamp", { opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.in" }, tDark + 0.3);

// the verdict lands
tl.to("#off", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" }, tOff);

// NO exit — the master timeline owns the cut.
window.__timelines["killswitch"] = tl;
