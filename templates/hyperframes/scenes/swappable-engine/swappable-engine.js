/* swappable-engine — GSAP timeline for 008 s06 ("The tool is swappable"). One file, 16:9 + 9:16.
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],
 *   props{kicker,title,subtitle?,note?}
 * Duration: data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Five beats:
 *   0 title + the rail (folder → slot → sheet)    1 chip A slides into the slot (output ✓)
 *   2 swap: chip B, then chip C (same output ✓)    3 "fixed" tags on the ends, the slot glows
 *   4 the honest "a chat login isn't an API key" note
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 540;
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
setText("honest", props.note);
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

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.1, D - 0.4);
}
var tTitle = beatAt(0, 0.03);
var tA = Math.max(beatAt(1, 0.22), tTitle + 0.9);
var tB = Math.max(beatAt(2, 0.42), tA + 0.9);
var tC = tB + Math.min(1.1, Math.max(0.7, (beatAt(3, 0.66) - tB) * 0.5));
var tFixed = Math.max(beatAt(3, 0.66), tC + 0.7);
var tNote = Math.max(beatAt(4, 0.85), tFixed + 0.6);

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#subtitle", { opacity: 0, y: 16 * U });
gsap.set("#glow", { scale: 0.92, opacity: 0.7 });
gsap.set(["#n-folder", "#a1", "#slot", "#a2", "#n-sheet"], { opacity: 0, y: 22 * U });
gsap.set([".chip"], { opacity: 0, y: 40 * U });
gsap.set([".fixedtag"], { opacity: 0, y: -6 * U });
gsap.set("#honest", { opacity: 0, y: 10 * U });

// ── timeline (paused; the renderer seeks it) ──
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

tl.to("#glow", { scale: 1.06, opacity: 0.9, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tTitle);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tTitle + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.06 }, tTitle + 0.05);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.4);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tTitle + 0.55);

// the rail builds left→right
tl.to(["#n-folder", "#a1", "#slot", "#a2", "#n-sheet"], { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.12 }, tTitle + 0.35);

// pulse the sheet's green check (the output) — called on each chip land
function pulseOutput(at) {
  tl.fromTo("#n-sheet .check",
    { boxShadow: "0 0 0px rgba(52,211,154,0)" },
    { boxShadow: "0 0 " + (20 * U) + "px rgba(52,211,154,0.7)", duration: 0.28, yoyo: true, repeat: 1, ease: "power2.out" }, at);
  tl.fromTo("#n-sheet .check", { scale: 1 }, { scale: 1.16, duration: 0.28, yoyo: true, repeat: 1, ease: "power2.out" }, at);
}

// chip swap helper: previous slides up & out, new rises in
function swapChip(inSel, outSel, at) {
  if (outSel) tl.to(outSel, { opacity: 0, y: -40 * U, duration: 0.32, ease: "power2.in" }, at);
  tl.fromTo(inSel, { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, at + (outSel ? 0.12 : 0));
  pulseOutput(at + (outSel ? 0.45 : 0.4));
}

// beat 1 — chip A in;  beat 2 — swap to B, then C (same output each time)
swapChip("#chip-a", null, tA);
swapChip("#chip-b", "#chip-a", tB);
swapChip("#chip-c", "#chip-b", tC);

// beat 3 — the ends are FIXED, the slot is the only thing that changes (gold glow)
tl.to(".fixedtag", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.12 }, tFixed);
tl.fromTo("#slot",
  { boxShadow: "0 0 0px rgba(255,176,32,0)" },
  { boxShadow: "0 0 " + (30 * U) + "px rgba(255,176,32,0.32)", duration: 0.6, ease: "power2.out" }, tFixed);
tl.to("#slot", { scale: 1.03, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut", transformOrigin: "50% 50%" }, tFixed);

// beat 4 — the honest note
tl.to("#honest", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tNote);

// NO exit animation — the master timeline owns the cut.
window.__timelines["swappable-engine"] = tl;
