/* receipts-hook — GSAP timeline for the 008 opener (one file, 16:9 + 9:16).
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{kicker,title,subtitle}
 *
 * Duration derivation (load-bearing, identical to bad-row-gate):
 *   data-duration = (durationFrames - 0.5) / fps   => ceils to EXACTLY durationFrames.
 *
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Key moments map to
 * revealsSeconds (sentence-start beats) when present, else fractions of D.
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 420;
var D = FRAMES / fps;
var U = Math.min(W, H) / 1080;
var props = V.props && typeof V.props === "object" ? V.props : {};
var beats = Array.isArray(V.revealsSeconds)
  ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; })
  : [];

// exact duration + geometry before the capture engine reads it
var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
var IS_PORTRAIT = H > W;
if (IS_PORTRAIT) root.classList.add("portrait");
document.documentElement.style.setProperty("--u", String(U));

// fill text from props (optional)
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker-text", props.kicker);
setText("subtitle", props.subtitle);
// re-split the title into word spans if a custom title is supplied (DOM nodes, not innerHTML —
// title text is ours, but textContent keeps it injection-safe and lint-clean)
if (typeof props.title === "string" && props.title.trim()) {
  var tEl = document.getElementById("title-text");
  if (tEl) {
    tEl.textContent = "";
    var parts = props.title.trim().split(/\s+/);
    parts.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      tEl.appendChild(span);
      if (i < parts.length - 1) tEl.appendChild(document.createTextNode(" "));
    });
  }
}

// ── beat timing ──
function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.1, D - 0.4);
}
var tKick = beatAt(0, 0.04);
var tTitle = Math.max(beatAt(0, 0.10), tKick + 0.15);
var tSheet = Math.max(beatAt(1, 0.24), tTitle + 0.35);
var rowGap = Math.min(0.55, Math.max(0.32, (D - tSheet - 1.2) / 4));
var tRows = [0, 1, 2, 3].map(function (i) { return tSheet + 0.4 + i * rowGap; });
var tFlag = Math.max(tRows[3] + 0.5, beatAt(4, 0.84));

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));
var rows = ["r1", "r2", "r3", "r4"].map(function (id) { return document.getElementById(id); });
var receipts = ["rc1", "rc2", "rc3", "rc4"].map(function (id) { return document.getElementById(id); });

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#subtitle", { opacity: 0, y: 16 * U });
gsap.set("#sheet", { opacity: 0, y: 26 * U, scale: 0.97, transformOrigin: "50% 40%" });
gsap.set("#glow", { scale: 0.9, opacity: 0.7 });
gsap.set("#flag", { opacity: 0, scale: 0.6, rotate: -6 });
rows.forEach(function (r) { gsap.set(r, { opacity: 0, x: 34 * U }); });
receipts.forEach(function (rc, i) {
  gsap.set(rc, { x: -W * 0.5, y: (i - 1.5) * 26 * U, rotation: (i - 1.5) * 7, opacity: 0, scale: 1 });
});

// ── timeline (paused; the renderer seeks it) ──
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ambient: slow glow breathe across the whole clip (deterministic)
tl.to("#glow", { scale: 1.08, opacity: 0.95, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tKick);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tKick + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.07 }, tTitle);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.35);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tTitle + 0.5);

// the sheet panel arrives
tl.to("#sheet", { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, tSheet);

// receipts fan in from the left (photos coming in)
receipts.forEach(function (rc, i) {
  tl.to(rc, { x: -W * 0.16 + i * 10 * U, y: (i - 1.5) * 30 * U, opacity: 1, duration: 0.5, ease: "power3.out" }, tKick + 0.1 + i * 0.12);
});

// each row types itself; the matching receipt flies into the sheet and fades (handoff).
// receipts now rest LOW (below the title/subtitle), so the handoff carries them toward the
// sheet without re-crossing the text: up-and-right on landscape, down-and-right on portrait.
var handoffDX = W * 0.42;
var handoffDY = IS_PORTRAIT ? H * 0.06 : -H * 0.06;
rows.forEach(function (r, i) {
  tl.to(receipts[i], { x: handoffDX, y: handoffDY + (i - 1.5) * 16 * U, opacity: 0, scale: 0.7, duration: 0.4, ease: "power1.in" }, tRows[i] - 0.28);
  tl.to(r, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, tRows[i]);
});

// the flagged row: gold "NOT SURE" stamps on, the row glows gold
tl.to("#flag", { opacity: 1, scale: 1, rotate: -3, duration: 0.45, ease: "back.out(2.4)" }, tFlag);
tl.fromTo("#r4",
  { boxShadow: "0 0 0 0 rgba(255,176,32,0)" },
  { boxShadow: "0 0 0 " + (2 * U) + "px rgba(255,176,32,0.65), 0 " + (12 * U) + "px " + (40 * U) + "px rgba(255,176,32,0.18)", duration: 0.5, ease: "power2.out" },
  tFlag);
tl.fromTo("#r4-total", { color: "#b6ab93" }, { color: "#ffd37a", duration: 0.4, ease: "power2.out" }, tFlag - 0.1);

// NO exit animation — the master timeline owns the cut; last frame stays composed.
window.__timelines["receipts-hook"] = tl;
