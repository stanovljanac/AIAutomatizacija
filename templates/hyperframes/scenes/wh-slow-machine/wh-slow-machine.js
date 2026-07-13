/* wh-slow-machine — GSAP timeline for 014 s2 THE WORST HOUR. A flat inbox (red "40" badge), an
 * open order email, and a spreadsheet the cursor fills BY HAND — Name -> Item -> Address chips fly
 * one at a time into row 1 (deliberate), then rows 2-6 grind on while a clock crawls and the row
 * counter ticks. On "just a slow machine" the color DRAINS to gray (grayscale filter) and the
 * counter STICKS at 6/40 ("54 min left"). Counters use proxy + onUpdate (seek-safe, cf benchmark-bars).
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 407;
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
// sentence beats: [0] "Here's the hour." [1] "forty emails... retype by hand" [2] "Name, item, address. Copy, paste, next." [3] "by row six, slow machine"
var tSetup = beatAt(0, 0.0);
var tHand = Math.max(beatAt(1, 0.09), tSetup + 0.8);
var tFields = Math.max(beatAt(2, 0.58), tHand + 3.0);
var tSlow = Math.max(beatAt(3, 0.84), tFields + 2.0);

// ── geometry: measure source (email field) & target (row-1 cell) centers relative to #stage ──
var stage = document.getElementById("stage");
function center(el) {
  var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
}
var fkeys = ["name", "item", "addr"];
var efIds = { name: "ef-name", item: "ef-item", addr: "ef-addr" };
var cellIds = { name: "c1n", item: "c1i", addr: "c1a" };
var SRC = { name: center(document.getElementById("ef-name")), item: center(document.getElementById("ef-item")), addr: center(document.getElementById("ef-addr")) };
var TGT = { name: center(document.getElementById("c1n")), item: center(document.getElementById("c1i")), addr: center(document.getElementById("c1a")) };

// ── resting state ──
gsap.set(["#clock", "#rows"], { opacity: 0, y: -14 * U });
gsap.set("#inbox .lbl", { opacity: 0 });
gsap.set(".mini", { opacity: 0, y: 14 * U });
gsap.set("#badge", { opacity: 0, scale: 0.6 });
gsap.set("#email", { opacity: 0, x: -24 * U });
gsap.set("#sheet", { opacity: 0, x: 24 * U });
gsap.set(".sh-row .cell", { opacity: 0 });
gsap.set(".sh-row .check", { opacity: 0, scale: 0.4 });
gsap.set("#cursor", { opacity: 0, left: SRC.name.x, top: SRC.name.y, xPercent: -50, yPercent: -50, x: 0, y: 0 });
fkeys.forEach(function (k) { gsap.set("#fly-" + k, { opacity: 0, left: SRC[k].x, top: SRC[k].y, xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.94 }); });
gsap.set("#stage", { filter: "grayscale(0)" });

var clockProxy = { v: 60 }, rowProxy = { v: 0 };
var clockEl = document.getElementById("clock-min"), rowsEl = document.getElementById("rows-n");

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ── beat 0 — the hour appears ──
tl.to(["#clock", "#rows"], { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08 }, tSetup);
tl.to("#inbox .lbl", { opacity: 1, duration: 0.4 }, tSetup + 0.1);
tl.to(".mini", { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }, tSetup + 0.15);
tl.to("#email", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tSetup + 0.25);
tl.to("#sheet", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tSetup + 0.3);

// ── beat 1 — "forty emails, retype by hand": badge flares; row 1 filled by hand, chip by chip ──
tl.fromTo("#badge", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)" }, tHand);
tl.to("#badge", { scale: 1.07, duration: 0.55, yoyo: true, repeat: 3, ease: "sine.inOut" }, tHand + 0.4);
tl.to("#cursor", { opacity: 1, duration: 0.25, ease: "power2.out" }, tHand + 0.2);
// clock begins its slow crawl (minutes LEFT: 60 -> ~56 across the manual row — barely dented)
tl.to(clockProxy, { v: 56, duration: cl(tFields - tHand, 1.5, 8), ease: "none", onUpdate: function () { clockEl.textContent = Math.round(clockProxy.v); } }, tHand);

var flyStep = cl((tFields - tHand - 0.8) / 3, 0.9, 2.2);
fkeys.forEach(function (k, i) {
  var at = tHand + 0.5 + i * flyStep;
  tl.to("#cursor", { left: SRC[k].x, top: SRC[k].y, duration: 0.4, ease: "power2.inOut" }, at);
  tl.to("#" + efIds[k], { color: "#ffd37a", duration: 0.2 }, at + 0.15);       // the field value lights (grab)
  tl.to("#cursor", { scale: 0.82, duration: 0.11, yoyo: true, repeat: 1 }, at + 0.28); // mechanical click
  tl.to("#fly-" + k, { opacity: 1, scale: 1, duration: 0.16 }, at + 0.34);
  tl.to("#fly-" + k, { x: TGT[k].x - SRC[k].x, y: TGT[k].y - SRC[k].y, duration: flyStep * 0.5, ease: "power2.inOut" }, at + 0.4);
  tl.to("#cursor", { left: TGT[k].x, top: TGT[k].y, duration: flyStep * 0.5, ease: "power2.inOut" }, at + 0.4);
  tl.to("#fly-" + k, { opacity: 0, duration: 0.12 }, at + 0.4 + flyStep * 0.5);
  tl.to("#" + cellIds[k], { opacity: 1, duration: 0.18, ease: "power2.out" }, at + 0.38 + flyStep * 0.5);
});
var row1Done = tHand + 0.5 + 3 * flyStep;
tl.to("#k1", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.2)" }, row1Done);
tl.to(rowProxy, { v: 1, duration: 0.3, ease: "none", onUpdate: function () { rowsEl.textContent = Math.round(rowProxy.v); } }, row1Done);

// ── beat 2 — "Name, item, address. Copy, paste, next.": rows 2-6 grind on; counter races ──
var rows = Array.prototype.slice.call(document.querySelectorAll(".sh-row")).slice(1); // rows 2..6
var gridSpan = cl(tSlow - tFields - 0.1, 1.4, 3.2);
tl.to(rowProxy, { v: 6, duration: gridSpan, ease: "none", onUpdate: function () { rowsEl.textContent = Math.round(rowProxy.v); } }, tFields + 0.1);
tl.to(clockProxy, { v: 54.6, duration: gridSpan, ease: "none", onUpdate: function () { clockEl.textContent = Math.round(clockProxy.v); } }, tFields);
rows.forEach(function (r, i) {
  var at = tFields + 0.15 + i * (gridSpan / rows.length);
  tl.to(r.querySelectorAll(".cell"), { opacity: 1, duration: 0.2, stagger: 0.04, ease: "power1.out" }, at);
  tl.to(r.querySelector(".check"), { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, at + 0.16);
  tl.to("#cursor", { left: center(r.querySelector(".cell")).x, top: center(r.querySelector(".cell")).y, duration: (gridSpan / rows.length) * 0.72, ease: "power1.inOut" }, at);
});

// ── beat 3 — "by row six, I'm just a slow machine": DRAIN to gray, stick at 6/40, 54 min left ──
tl.to("#stage", { filter: "grayscale(0.92) brightness(0.86)", duration: 0.85, ease: "power2.inOut" }, tSlow);
tl.to(clockProxy, { v: 54, duration: 0.5, ease: "power1.out", onUpdate: function () { clockEl.textContent = Math.round(clockProxy.v); } }, tSlow);
// the cursor loops robotically in place — the human reduced to a machine
tl.to("#cursor", { x: "+=" + 12 * U, duration: 0.5, yoyo: true, repeat: Math.max(2, Math.ceil((D - tSlow) / 0.5)), ease: "sine.inOut" }, tSlow + 0.3);
// a faint slow push-in throughout
tl.fromTo("#stage", { scale: 1.0 }, { scale: 1.03, duration: cl(D - tSetup, 4, 14), ease: "power1.inOut", transformOrigin: "50% 44%" }, tSetup);

window.__timelines["wh-slow-machine"] = tl;
