/* genre-conveyor — GSAP timeline for 012 s04. Stations rise → hero card rides the belt gaining
 * layers as stations pulse → ships into the scheduler while $0.80 ticks. Silent, deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stat?{value,label,source} }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 660;
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

var stat = props.stat && typeof props.stat === "object" ? props.stat : {};
var statTarget = 0.8;
if (typeof stat.value === "string") { var m = stat.value.match(/([\d.]+)/); if (m) statTarget = parseFloat(m[1]); }
if (stat.label) document.getElementById("statlabel").textContent = String(stat.label);
if (stat.source) document.getElementById("statsource").textContent = String(stat.source);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 4 sentence beats
var tRise = beatAt(0, 0.03);
var tFlow = Math.max(beatAt(1, 0.24), tRise + 1.0);
var tStamp = Math.max(beatAt(2, 0.5), tFlow + 1.4);
var tShip = Math.max(beatAt(3, 0.74), tStamp + 1.4);
var shipSpan = Math.max(1.6, D - tShip - 0.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the rail rises station by station; belt dashes creep the whole scene (mass production hum)
tl.from("#kicker", { opacity: 0, y: -26 * U, duration: 0.45, ease: "power3.out" }, tRise);
tl.from(".station", { opacity: 0, y: 44 * U, duration: 0.5, stagger: 0.09, ease: "back.out(1.5)" }, tRise + 0.15);
tl.from("#beltwrap", { opacity: 0, duration: 0.5, ease: "power2.out" }, tRise + 0.5);
tl.to("#dashes", { x: -420 * U, duration: D - tRise - 0.5, ease: "none" }, tRise + 0.5);

// helpers
function pulse(sel, at) {
  tl.to(sel + " .chip", { scale: 1.14, boxShadow: "0 0 " + 44 * U + "px rgba(255,176,32,0.55)", duration: 0.26, ease: "power2.out" }, at);
  tl.to(sel + " .chip", { scale: 1, boxShadow: "0 " + 14 * U + "px " + 34 * U + "px rgba(0,0,0,0.55)", duration: 0.4, ease: "power2.inOut" }, at + 0.3);
}
var beltW = 0.92 * W;
var xAt = function (f) { return (beltW - 200 * U) * f; };

// beat 1 — no-code flow: st1+st2 pulse; hero card enters and rolls to the middle, SCRIPT layer stamps
tl.fromTo("#hero", { opacity: 0, x: -160 * U }, { opacity: 1, x: xAt(0.18), duration: 0.8, ease: "power2.out" }, tFlow);
tl.fromTo("#ghost1", { opacity: 0, x: -300 * U }, { opacity: 0.5, x: xAt(0.04), duration: 0.9, ease: "power2.out" }, tFlow + 0.35);
pulse("#st1", tFlow + 0.1);
pulse("#st2", tFlow + 0.6);
tl.to("#hero", { x: xAt(0.4), duration: Math.max(0.8, tStamp - tFlow - 0.9), ease: "none" }, tFlow + 0.9);
tl.fromTo("#hero .l-script", { opacity: 0, y: -12 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, tFlow + 0.75);

// beat 2 — ElevenLabs + template engine stamp their layers as the card passes
pulse("#st3", tStamp);
tl.fromTo("#hero .l-voice", { opacity: 0, y: -12 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, tStamp + 0.2);
pulse("#st4", tStamp + 0.65);
tl.fromTo("#hero .l-video", { opacity: 0, y: -12 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, tStamp + 0.85);
tl.to("#hero", { x: xAt(0.66), duration: Math.max(0.8, tShip - tStamp - 0.2), ease: "none" }, tStamp + 0.2);
tl.to("#ghost1", { x: xAt(0.3), duration: Math.max(0.8, tShip - tStamp), ease: "none" }, tStamp);
tl.fromTo("#ghost2", { opacity: 0, x: -300 * U }, { opacity: 0.5, x: xAt(0.1), duration: 1.0, ease: "power2.out" }, tStamp + 0.6);

// beat 3 — the scheduler ships it: st5 pulse, hero flies up-right and shrinks; the counter ticks
pulse("#st5", tShip);
tl.to("#hero", { x: xAt(0.97), duration: shipSpan * 0.36, ease: "power1.in" }, tShip + 0.1);
tl.to("#hero", { y: -260 * U, scale: 0.45, opacity: 0, duration: shipSpan * 0.3, ease: "power2.in" }, tShip + 0.1 + shipSpan * 0.32);
var statObj = { v: 0 };
var statEl = document.getElementById("statval");
tl.to("#stat", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tShip + 0.2);
tl.to(statObj, {
  v: statTarget, duration: Math.max(0.9, shipSpan * 0.55), ease: "power1.out",
  onUpdate: function () { statEl.textContent = "$" + statObj.v.toFixed(2); },
}, tShip + 0.3);
tl.to("#ghost2", { x: xAt(0.55), duration: Math.max(0.8, D - tShip - 0.4), ease: "none" }, tShip + 0.2);

window.__timelines["genre-conveyor"] = tl;
