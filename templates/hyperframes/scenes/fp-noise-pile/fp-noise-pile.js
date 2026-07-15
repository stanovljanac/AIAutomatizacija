/* fp-noise-pile — GSAP timeline for 017 s2 THE OVERLOAD. A flat ToS doc + watcher badge;
 * toasts fire out of the page edge into a corner stack under a racing counter; cosmetic diffs
 * light on the doc; at "forty pings" the counter SNAPS to 40, the pile grays under a gold
 * NOISE wash; a MUTED stamp drops while ONE gold card slides off-screen unread.
 * Counters use proxy + onUpdate (seek-safe). Deterministic; flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 558;
var D = FRAMES / fps;
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.02, D - 0.4); }
// sentence beats: [0] "point a change-watcher at a vendor's ToS — it works, too well" (doc + first toasts)
// [1] "every reworded sentence, every shuffled paragraph: another alert" (cosmetic diffs → more toasts)
// [2] "imagine forty pings a week, thirty-nine are noise" (counter→40, gray + NOISE wash)
// [3] "you tune it out — right before it misses the one line" (MUTED stamp; gold card slides off)
var tDoc = beatAt(0, 0.0);
var tDiffs = Math.max(beatAt(1, 0.28), tDoc + 2.2);
var tNoise = Math.max(beatAt(2, 0.56), tDiffs + 2.0);
var tMute = Math.max(beatAt(3, 0.77), tNoise + 1.6);

var toasts = Array.prototype.slice.call(document.querySelectorAll(".toast"));
var cnumEl = document.getElementById("cnum");
var cProxy = { v: 0 };
function setCnum() { cnumEl.textContent = Math.round(cProxy.v); }

// deterministic per-toast resting jitter (flat Z only, <=3°)
var JIT = [1.4, -1.8, 0.8, -1.2, 2.0, -0.6, 1.1, -2.2, 0.9];
toasts.forEach(function (t, i) { gsap.set(t, { rotation: JIT[i % JIT.length] }); });

// ── resting state ──
gsap.set("#doc", { opacity: 0, y: 40 * U });
gsap.set("#watcher", { opacity: 0, scale: 0.5 });
gsap.set("#counter", { opacity: 0, y: -18 * U });
gsap.set(toasts, { opacity: 0, x: -120 * U, scale: 0.85 });
gsap.set(".difftag", { opacity: 0 });
gsap.set("#noisewash", { opacity: 0, scale: 0.92 });
gsap.set("#muted", { opacity: 0, scale: 2.0, rotation: -3, xPercent: -50 });
gsap.set("#missed", { opacity: 0, x: 0, y: 0 });

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ambient glow breathe (motivated: the "always-on watcher" hum)
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the doc lands, the watcher pins on, it "works — too well" ──
tl.to("#doc", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tDoc);
tl.to("#watcher", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, tDoc + 0.4);
// the watcher blinks (scans) — small motivated loop
tl.to(".w-iris", { attr: { r: 3.5 }, duration: 0.4, yoyo: true, repeat: 5, ease: "sine.inOut" }, tDoc + 0.8);
tl.to("#counter", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tDoc + 0.9);
// first three toasts fire on "works — too well"
var t0 = tDoc + 1.1;
toasts.slice(0, 3).forEach(function (t, i) {
  tl.to(t, { opacity: 1, x: 0, scale: 1, duration: 0.32, ease: "back.out(1.8)" }, t0 + i * 0.5);
});
tl.to(cProxy, { v: 3, duration: cl(tDiffs - t0 - 0.2, 0.8, 2.2), ease: "none", onUpdate: setCnum }, t0);

// ── beat 1 — cosmetic diffs light on the doc; each spawns another toast; the counter races ──
var diffIds = ["#d1", "#d2", "#d3"];
var diffSpan = cl(tNoise - tDiffs - 0.4, 1.8, 4.2);
diffIds.forEach(function (id, i) {
  var at = tDiffs + i * (diffSpan / 3);
  tl.to(id, { backgroundColor: "#8a6a24", duration: 0.25, ease: "power2.out" }, at);
  tl.fromTo(id + " .difftag", { opacity: 0, y: 8 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, at + 0.1);
  tl.to(toasts[3 + i], { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: "back.out(1.8)" }, at + 0.25);
});
// the remaining toasts pile up fast — relentless
toasts.slice(6).forEach(function (t, i) {
  tl.to(t, { opacity: 1, x: 0, scale: 1, duration: 0.26, ease: "back.out(1.6)" }, tDiffs + diffSpan * 0.6 + i * 0.3);
});
tl.to(cProxy, { v: 23, duration: cl(tNoise - tDiffs - 0.1, 1.5, 5), ease: "none", onUpdate: setCnum }, tDiffs);

// ── beat 2 — the counter SNAPS to 40; 39 gray out under the gold NOISE wash ──
tl.to(cProxy, { v: 40, duration: 0.7, ease: "power3.in", onUpdate: setCnum }, tNoise);
tl.to("#counter", { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.inOut" }, tNoise + 0.6);
// the pile desaturates — worthless
tl.to(toasts, { filter: "grayscale(1) brightness(0.5)", duration: 0.45, stagger: 0.03, ease: "power2.out" }, tNoise + 0.8);
tl.to("#doc", { filter: "brightness(0.75)", duration: 0.45 }, tNoise + 0.8);
tl.fromTo("#noisewash", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, tNoise + 1.0);

// ── beat 3 — MUTED slams; behind it, the ONE gold card slides off-screen unread ──
tl.to("#muted", { opacity: 1, scale: 1, duration: 0.28, ease: "power4.in" }, tMute);
tl.to("#muted", { rotation: -2, duration: 0.3, ease: "back.out(2.2)" }, tMute + 0.28);
// the watcher goes dim — nobody is listening anymore
tl.to("#watcher", { opacity: 0.35, duration: 0.4 }, tMute + 0.3);
// the missed clause: appears quietly from the doc's lower edge and slides away unread
tl.fromTo("#missed", { opacity: 0, x: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, tMute + 0.7);
tl.to("#missed", { x: 0.62 * W, opacity: 0, duration: cl(D - tMute - 1.4, 1.2, 2.4), ease: "power2.in" }, tMute + 1.3);
// a whisper of push-in
tl.to("#camera", { scale: 1.04, duration: cl(D - tDoc, 4, 16), ease: "power1.inOut" }, tDoc);

window.__timelines["fp-noise-pile"] = tl;
