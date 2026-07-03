/* stat-grid — GSAP timeline for 010 s05 (on-screen number 1). 63 cells, 57 cascade red, counter
 * rolls to 57, source baked in. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, of?, caption?, source? }
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

var TOTAL = 63, BAD = 57;
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("source-text", props.source);
setText("caption", props.caption);
if (props.of) document.getElementById("of").textContent = String(props.of).trim();
var TARGET = Number(props.value) > 0 ? Math.round(Number(props.value)) : BAD;

// build the grid — 6 fixed cells stay gold, the rest are "bad" (will flip red)
var GOOD = { 4: 1, 15: 1, 25: 1, 34: 1, 47: 1, 58: 1 };
var gridEl = document.getElementById("grid");
var badCells = [];
for (var i = 0; i < TOTAL; i++) {
  var c = document.createElement("div");
  c.className = "cell" + (GOOD[i] ? " good" : "");
  gridEl.appendChild(c);
  if (!GOOD[i]) badCells.push(c);
}

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
var tIntro = beatAt(0, 0.05);
var tCascade = Math.max(beatAt(1, 0.26), tIntro + 0.5);
var tSuspend = Math.max(beatAt(3, 0.74), tCascade + 1.4);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set("#source", { opacity: 0 });
gsap.set("#big", { scale: 1 });

// intro — number line + caption + grid pop in (all gold)
tl.from("#statline", { opacity: 0, y: 26 * U, duration: 0.5, ease: "power3.out" }, tIntro);
tl.from("#caption", { opacity: 0, y: 18 * U, duration: 0.45, ease: "power2.out" }, tIntro + 0.15);
tl.from(".cell", { opacity: 0, scale: 0.5, duration: 0.4, stagger: { each: 0.012, from: "center" }, ease: "back.out(1.6)" }, tIntro + 0.2);

// cascade — 57 cells flip red in a wave; the counter rolls to 57; source fades in
badCells.forEach(function (c, k) {
  tl.to(c, {
    backgroundColor: "rgba(255,92,92,0.22)", borderColor: "rgba(255,92,92,0.75)",
    boxShadow: "inset 0 0 " + (16 * U) + "px rgba(255,92,92,0.3)", duration: 0.28, ease: "power2.out"
  }, tCascade + k * 0.02);
});
var counter = { v: 0 };
tl.to(counter, { v: TARGET, duration: badCells.length * 0.02 + 0.3, ease: "power1.out", onUpdate: function () { document.getElementById("big").textContent = String(Math.round(counter.v)); } }, tCascade);
tl.to("#source", { opacity: 1, duration: 0.5, ease: "power2.out" }, tCascade + 0.5);

// suspended — the number gives one decisive pulse
tl.to("#big", { scale: 1.1, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1 }, tSuspend);

window.__timelines["stat-grid"] = tl;
