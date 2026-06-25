/* monthly-retype — GSAP timeline for 008 s02 ("The monthly retype"). One file, 16:9 + 9:16.
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{kicker,title,subtitle}
 *
 * Duration: data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Four beats:
 *   0 title + empty sheet + caret    1 the crumpled-receipt pile tumbles in
 *   2 rows hand-type cell by cell (the caret walks down)    3 a total flashes RED + a "~10 min" clock
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 510;
var D = FRAMES / fps;
var U = Math.min(W, H) / 1080;
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
document.documentElement.style.setProperty("--u", String(U));

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker-text", props.kicker);
setText("subtitle", props.subtitle);
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
var tTitle = beatAt(0, 0.04);
var tPile = Math.max(beatAt(1, 0.22), tTitle + 0.6);
var tType = Math.max(beatAt(2, 0.45), tPile + 0.7);
var tErr = Math.max(beatAt(3, 0.74), tType + 1.6);

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));
var rows = ["r1", "r2", "r3"].map(function (id) { return document.getElementById(id); });
var receipts = ["rc1", "rc2", "rc3", "rc4"].map(function (id) { return document.getElementById(id); });
var caret = document.getElementById("caret");
var caretPx = 34 * U;
function caretTopFor(r) { return r.offsetTop + (r.offsetHeight - caretPx) / 2; }

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#subtitle", { opacity: 0, y: 16 * U });
gsap.set("#glow", { scale: 0.92, opacity: 0.7 });
gsap.set("#sheet", { opacity: 0, y: 26 * U, scale: 0.975, transformOrigin: "50% 35%" });
gsap.set("#caret", { opacity: 0, top: caretTopFor(rows[0]) });
gsap.set("#errtag", { opacity: 0, y: 8 * U });
gsap.set("#clock", { opacity: 0, y: 8 * U });
rows.forEach(function (r) { gsap.set(r.querySelectorAll(".cell"), { opacity: 0, x: 10 * U }); });
receipts.forEach(function (rc, i) {
  gsap.set(rc, { x: -W * 0.4, y: (i - 1.5) * 16 * U, rotation: (i - 1.5) * 9, opacity: 0, scale: 1 });
});

// ── timeline (paused; the renderer seeks it) ──
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { scale: 1.07, opacity: 0.92, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tTitle);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tTitle + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.07 }, tTitle + 0.05);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.4);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tTitle + 0.55);

// empty sheet + the caret arrives and starts blinking (manual data entry)
tl.to("#sheet", { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tTitle + 0.2);
tl.to("#caret", { opacity: 1, duration: 0.2, ease: "power1.out" }, tTitle + 0.55);
tl.to("#caret", { opacity: 0.12, duration: 0.5, repeat: Math.ceil(D), yoyo: true, ease: "none" }, tTitle + 0.6);

// beat 1 — the crumpled-receipt pile tumbles into the lower-left
receipts.forEach(function (rc, i) {
  tl.to(rc, { x: i * 16 * U - 22 * U, y: (i - 1.5) * 12 * U, rotation: (i - 1.5) * 8, opacity: 1, duration: 0.5, ease: "power3.out" }, tPile + i * 0.12);
});

// beat 2 — rows hand-type, the caret walks down row by row
var rowStep = Math.min(0.7, Math.max(0.42, (tErr - tType - 0.4) / 3));
rows.forEach(function (r, i) {
  var at = tType + i * rowStep;
  tl.to("#caret", { top: caretTopFor(r), duration: 0.28, ease: "power2.inOut" }, at);
  tl.to(r.querySelectorAll(".cell"), { opacity: 1, x: 0, duration: 0.3, ease: "power2.out", stagger: 0.12 }, at + 0.12);
});

// beat 3 — the fat-fingered total flashes RED; the "~10 min" clock + typo tag land.
// (color + glow are TWEENED, not class-toggled: the renderer SEEKS frames and GSAP suppresses
//  callbacks on seek, so a classList toggle would not apply deterministically — tweens do.)
tl.fromTo("#bad-amount",
  { color: "#f5f1e8", textShadow: "0 0 0px rgba(255,90,77,0)" },
  { color: "#ff5a4d", textShadow: "0 0 " + (18 * U) + "px rgba(255,90,77,0.65)", duration: 0.4, ease: "power2.out" },
  tErr);
tl.fromTo("#r3",
  { boxShadow: "0 0 0 0 rgba(255,90,77,0)" },
  { boxShadow: "0 0 0 " + (2 * U) + "px rgba(255,90,77,0.5), 0 " + (10 * U) + "px " + (30 * U) + "px rgba(255,90,77,0.16)", duration: 0.4, ease: "power2.out" },
  tErr);
tl.to("#errtag", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2.0)" }, tErr + 0.12);
tl.to("#clock", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tErr + 0.2);

// NO exit animation — the master timeline owns the cut.
window.__timelines["monthly-retype"] = tl;
