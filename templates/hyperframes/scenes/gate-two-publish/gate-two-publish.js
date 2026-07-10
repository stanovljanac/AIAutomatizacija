/* gate-two-publish — GSAP timeline for 012 s13. Watch (scrub) → private draft w/ metadata →
 * disclosure toggle YES → human cursor presses PUBLISH → PRIVATE flips PUBLIC. Deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ disclosureLabel? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 750;
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

if (props.disclosureLabel) {
  var lbl = String(props.disclosureLabel).split(":")[0];
  document.getElementById("disclabel").textContent = lbl;
}

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 4 sentence beats
var tWatch = beatAt(0, 0.03);
var tDraft = Math.max(beatAt(1, 0.28), tWatch + 1.6);
var tDisc = Math.max(beatAt(2, 0.55), tDraft + 1.4);
var tClick = Math.max(beatAt(3, 0.8), tDisc + 1.8);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — watching, start to end: the scrub runs the full bar; gate 2 glyph rises
tl.from("#player", { opacity: 0, x: -100 * U, duration: 0.55, ease: "power3.out" }, tWatch);
tl.fromTo("#gate2", { opacity: 0, y: 60 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tWatch + 0.3);
var scrubSpan = Math.max(1.4, tDraft - tWatch - 0.6);
var playW = 680 * U - 48 * U; // player width minus padding
tl.to("#scrubfill", { scaleX: 1, duration: scrubSpan, ease: "none" }, tWatch + 0.55);
tl.to("#playhead", { x: playW, duration: scrubSpan, ease: "none" }, tWatch + 0.55);
var tObj = { v: 0 };
var tEl = document.getElementById("tcur");
tl.to(tObj, {
  v: 365, duration: scrubSpan, ease: "none",
  onUpdate: function () { var s = Math.round(tObj.v); tEl.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); },
}, tWatch + 0.55);

// beat 1 — the draft card slides in: metadata written, PRIVATE badge
tl.fromTo("#draft", { opacity: 0, x: 120 * U }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, tDraft);
tl.from("#draft .d-line, #draft .d-sec", { opacity: 0, y: 14 * U, duration: 0.35, stagger: 0.12, ease: "power2.out" }, tDraft + 0.4);
tl.fromTo("#bpriv", { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, tDraft + 0.5);

// beat 2 — the disclosure toggle flips YES (a form you answer honestly)
tl.to("#disclose", { borderColor: "rgba(255,176,32,0.9)", boxShadow: "0 0 " + 30 * U + "px rgba(255,176,32,0.25)", duration: 0.35, ease: "power2.out" }, tDisc);
tl.to("#knob", { x: 60 * U, backgroundColor: "#FFB020", duration: 0.4, ease: "back.out(1.6)" }, tDisc + 0.35);
tl.to(".tg-yes", { opacity: 1, duration: 0.3, ease: "power2.out" }, tDisc + 0.6);

// beat 3 — the human finger: cursor flies to PUBLISH, presses, PRIVATE flips PUBLIC, burst
tl.fromTo("#cursor", { opacity: 0, x: 120 * U, y: 60 * U }, { opacity: 1, x: 0, y: 0, duration: 0.5, ease: "power2.out" }, tClick);
tl.to("#cursor", { x: -0.13 * W, y: -0.08 * H, duration: 0.55, ease: "power2.inOut" }, tClick + 0.5);
tl.to("#publishbtn", { scale: 0.92, boxShadow: "0 " + 4 * U + "px " + 12 * U + "px rgba(0,0,0,0.5)", duration: 0.14, ease: "power2.in" }, tClick + 1.05);
tl.to("#publishbtn", { scale: 1.04, boxShadow: "0 " + 12 * U + "px " + 30 * U + "px rgba(0,0,0,0.45), 0 0 " + 50 * U + "px rgba(255,176,32,0.55)", duration: 0.3, ease: "back.out(2.5)" }, tClick + 1.2);
tl.fromTo("#burst", { opacity: 0.9, scale: 0.3 }, { opacity: 0, scale: 1.7, duration: 0.7, ease: "power2.out" }, tClick + 1.2);
tl.to("#bpriv", { opacity: 0, y: -14 * U, duration: 0.3, ease: "power2.in" }, tClick + 1.3);
tl.fromTo("#bpub", { opacity: 0, y: 14 * U, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, tClick + 1.45);
tl.to("#finger", { opacity: 1, duration: 0.4, ease: "power2.out" }, cl(tClick + 1.6, tClick, D - 0.3));

window.__timelines["gate-two-publish"] = tl;
