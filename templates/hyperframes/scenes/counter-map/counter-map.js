/* counter-map — GSAP timeline for 010 s06 (on-screen number 2). Seeded dot field lights up while a
 * counter rolls to 1,695 then ticks past ("and counting"). Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, label?, source? }
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
setText("source-text", props.source);
setText("label", props.label);
var TARGET = Number(props.value) > 0 ? Math.round(Number(props.value)) : 1695;
function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

// seeded PRNG (mulberry32) — deterministic dot layout, no Math.random
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
var rnd = mulberry32(1695);
var dotsEl = document.getElementById("dots");
var N = 150;
var dots = [];
for (var i = 0; i < N; i++) {
  var d = document.createElement("div");
  d.className = "dot";
  d.style.left = (rnd() * 100).toFixed(2) + "%";
  d.style.top = (rnd() * 100).toFixed(2) + "%";
  dotsEl.appendChild(d);
  dots.push(d);
}

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
var tIntro = beatAt(0, 0.05);
var tRoll = Math.max(beatAt(2, 0.34), tIntro + 0.8);
var tPeak = Math.max(beatAt(3, 0.58), tRoll + 1.6);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set("#source", { opacity: 0 });
gsap.set("#big", { scale: 1 });

// intro — globe + readout appear
tl.from(".meridian", { opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.08, ease: "power2.out" }, tIntro);
tl.from("#readout", { opacity: 0, y: 24 * U, duration: 0.55, ease: "power3.out" }, tIntro + 0.1);

// the roll — dots light up (gold/red) in a seeded order; counter climbs to TARGET
var rollDur = tPeak - tRoll;
var lit = Math.round(N * 0.72);
for (var k = 0; k < lit; k++) {
  var at = tRoll + (k / lit) * rollDur;
  var warm = (k % 5 === 0);
  tl.to(dots[k], {
    backgroundColor: warm ? "rgba(255,92,92,0.9)" : "rgba(255,176,32,0.85)",
    boxShadow: "0 0 " + (10 * U) + "px " + (warm ? "rgba(255,92,92,0.6)" : "rgba(255,176,32,0.55)"),
    scale: 1.25, duration: 0.35, ease: "power1.out"
  }, at);
}
var counter = { v: 0 };
tl.to(counter, { v: TARGET, duration: rollDur, ease: "power1.inOut", onUpdate: function () { document.getElementById("big").textContent = fmt(counter.v); } }, tRoll);
tl.to("#source", { opacity: 1, duration: 0.5, ease: "power2.out" }, tRoll + 0.4);

// the number HOLDS at the sourced value (1,695) — accuracy first. "and counting" is carried by the
// label + a few extra dots that keep lighting after the count lands, never by an unsourced number.
tl.to("#big", { scale: 1.06, duration: 0.3, ease: "power2.out", yoyo: true, repeat: 1 }, tPeak);
var extra = dots.slice(lit, Math.min(lit + 12, N));
extra.forEach(function (d, j) {
  tl.to(d, { backgroundColor: "rgba(255,176,32,0.8)", boxShadow: "0 0 " + (10 * U) + "px rgba(255,176,32,0.5)", scale: 1.2, duration: 0.4, ease: "power1.out" }, tPeak + 0.3 + j * 0.12);
});

window.__timelines["counter-map"] = tl;
