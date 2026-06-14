/* orb-risefall — GSAP timeline for the HERO/hook (16:9 + 9:16).
 *
 * VARIABLES CONTRACT (see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *   props: { phase?: "rise"|"fall"|"full", kicker?, title?, subtitle? }
 *
 * Duration: data-duration = (durationFrames - 0.5) / fps. Determinism: NO Math.random /
 * Date.now (seeded PRNG for dot angles). One paused, seek-driven GSAP timeline. The orb
 * follows a quadratic arc via a proxy tween (onUpdate is seek-safe); the SVG trail draws on
 * with the same timing.
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
var phase = (props.phase === "rise" || props.phase === "fall" || props.phase === "full") ? props.phase : "full";
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
var IS_PORTRAIT = H > W;
if (IS_PORTRAIT) root.classList.add("portrait");
document.documentElement.style.setProperty("--u", String(Math.min(W, H) / 1080));

// props → DOM
if (props.kicker && document.querySelector("#kicker .kicker-text")) document.querySelector("#kicker .kicker-text").textContent = String(props.kicker).trim();
if (props.title) document.getElementById("title").textContent = String(props.title).trim();
var subEl = document.getElementById("subtitle");
if (props.subtitle && String(props.subtitle).trim()) subEl.textContent = String(props.subtitle).trim(); else subEl.style.display = "none";

// seeded PRNG (deterministic)
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
var rand = mulberry32(0x9e3779b9);

// ── arc anchors (px) ──
function P(x, y) { return { x: x * W, y: y * H }; }
var A = IS_PORTRAIT
  ? { start: P(0.28, 0.80), c1: P(0.34, 0.40), peak: P(0.50, 0.40), c2: P(0.66, 0.40), crash: P(0.72, 0.70) }
  : { start: P(0.14, 0.80), c1: P(0.30, 0.42), peak: P(0.50, 0.42), c2: P(0.70, 0.42), crash: P(0.86, 0.74) };

function quad(p0, c, p1, t) {
  var mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x, y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y };
}
// orb position at proxy t in [0,1] for the active phase
function orbAt(t) {
  if (phase === "rise") return quad(A.start, A.c1, A.peak, t);
  if (phase === "fall") return quad(A.peak, A.c2, A.crash, t);
  if (t <= 0.5) return quad(A.start, A.c1, A.peak, t * 2);
  return quad(A.peak, A.c2, A.crash, (t - 0.5) * 2);
}

// ── build the SVG trail path ──
var svg = document.getElementById("arc");
svg.setAttribute("viewBox", "0 0 " + W + " " + H);
var path = document.getElementById("arc-path");
var d;
if (phase === "rise") d = "M " + A.start.x + " " + A.start.y + " Q " + A.c1.x + " " + A.c1.y + " " + A.peak.x + " " + A.peak.y;
else if (phase === "fall") d = "M " + A.peak.x + " " + A.peak.y + " Q " + A.c2.x + " " + A.c2.y + " " + A.crash.x + " " + A.crash.y;
else d = "M " + A.start.x + " " + A.start.y + " Q " + A.c1.x + " " + A.c1.y + " " + A.peak.x + " " + A.peak.y + " Q " + A.c2.x + " " + A.c2.y + " " + A.crash.x + " " + A.crash.y;
path.setAttribute("d", d);
var L = path.getTotalLength();
path.style.strokeDasharray = L;
path.style.strokeDashoffset = L;

// ── orb dots (deterministic ring) ──
var dotsWrap = document.getElementById("dots");
var NDOTS = 26;
var dotData = [];
for (var i = 0; i < NDOTS; i++) {
  var el = document.createElement("div");
  el.className = "dot";
  dotsWrap.appendChild(el);
  var ang = (i / NDOTS) * Math.PI * 2 + rand() * 0.2;
  var rad = (0.34 + rand() * 0.16); // fraction of orb radius
  dotData.push({ el: el, ang: ang, rad: rad, fly: 1.6 + rand() * 1.8 });
}
var orbR = (IS_PORTRAIT ? 150 : 110) * (Math.min(W, H) / 1080); // px radius (half of wrap size)
function placeDots(spread) {
  for (var i = 0; i < dotData.length; i++) {
    var dd = dotData[i];
    var r = orbR * dd.rad * spread;
    gsap.set(dd.el, { x: Math.cos(dd.ang) * r, y: Math.sin(dd.ang) * r });
  }
}
placeDots(1);

// ── timeline phases ──
var tTitle = (beats.length > 0 ? beats[0] : 0.2);
var tS, tE, tShatter;
if (phase === "rise") { tS = 0.25; tE = D - 0.15; tShatter = -1; }
else if (phase === "fall") { tS = 0.18; tE = D * 0.60; tShatter = tE; }
else { tS = 0.18; tE = D * 0.80; tShatter = tE; }
var travelDur = Math.max(tE - tS, 0.5);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// resting state
gsap.set("#orb-wrap", { xPercent: -50, yPercent: -50 });
var p0 = orbAt(0);
gsap.set("#orb-wrap", { x: p0.x, y: p0.y, scale: phase === "fall" ? 1.0 : 0.7, opacity: 0 });
gsap.set("#smoke", { opacity: 0, scale: 0.6 });
gsap.set("#content", { opacity: 0, y: 18 });

// content reveal
tl.to("#content", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, Math.min(tTitle, D - 0.6));

// orb appears
tl.to("#orb-wrap", { opacity: 1, duration: 0.4, ease: "power2.out" }, tS);

// travel along the arc (proxy → onUpdate sets transform + grows during rise)
var proxy = { t: 0 };
tl.to(proxy, {
  t: 1, duration: travelDur, ease: phase === "fall" ? "power1.in" : "power1.inOut",
  onUpdate: function () {
    var pt = orbAt(proxy.t);
    var sc = phase === "fall" ? (1.0 - 0.12 * proxy.t) : (0.7 + 0.4 * Math.min(proxy.t / 0.5, 1));
    gsap.set("#orb-wrap", { x: pt.x, y: pt.y, scale: sc });
  }
}, tS);

// the trail draws on with the same timing
tl.to(path, { strokeDashoffset: 0, duration: travelDur, ease: phase === "fall" ? "power1.in" : "power1.inOut" }, tS);

// rise: a bright flare at the peak
if (phase === "rise") {
  tl.to("#orb", { boxShadow: "0 0 90px rgba(255,176,32,0.95), 0 0 220px rgba(255,176,32,0.5)", duration: 0.5, ease: "power2.out", yoyo: true, repeat: 1 }, tE - 0.6);
}

// fall / full: SHATTER at the crash
if (tShatter > 0) {
  // dots fly outward + fade
  for (var j = 0; j < dotData.length; j++) {
    var dj = dotData[j];
    tl.to(dj.el, { x: Math.cos(dj.ang) * orbR * dj.fly * 2.4, y: Math.sin(dj.ang) * orbR * dj.fly * 2.4 - orbR * 0.4, opacity: 0, duration: 0.9, ease: "power2.out" }, tShatter);
  }
  // a quick hot flash then the orb darkens to embers
  tl.to("#orb", { boxShadow: "0 0 120px rgba(255,106,77,0.9), 0 0 260px rgba(255,106,77,0.4)", duration: 0.12, ease: "power2.out" }, tShatter);
  tl.to("#orb", {
    filter: "grayscale(0.7) brightness(0.45)",
    background: "radial-gradient(circle at 50% 42%, #6b5a3a 0%, #2a2114 45%, #120d07 78%, transparent 100%)",
    boxShadow: "0 0 30px rgba(80,60,30,0.3)",
    scale: 0.92, duration: 0.7, ease: "power2.inOut"
  }, tShatter + 0.12);
  tl.to(".orb-ring", { opacity: 0, duration: 0.5, ease: "power2.in" }, tShatter + 0.1);
  // smoke rises
  tl.to("#smoke", { opacity: 0.8, scale: 2.2, y: -orbR * 1.2, duration: 1.0, ease: "power2.out" }, tShatter + 0.1);
  tl.to("#smoke", { opacity: 0.0, duration: 0.6, ease: "power1.in" }, tShatter + 0.9);
}

// NO exit — the master timeline owns the cut.
window.__timelines["orb-risefall"] = tl;
