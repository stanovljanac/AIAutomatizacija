/* wh-one-pass — GSAP timeline for 014 s3 THE MONEY SHOT. 40 email cards funnel into a gold AI node
 * ("Running..."), then the spreadsheet fills in a fast CASCADE — a green check per row, the counter
 * RACES 0->40, the s2 clock SNAPS 54 -> 0. The cursor pulls back and goes still. A gold "40/40 — one
 * pass" stamp locks over the clean sheet. Counters use proxy + onUpdate (seek-safe). Deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "wh-one-pass", width: 1080, height: 1920, frames: 302, beatLo: 0.02, beatHi: 0.4 });
var fps = S.fps, W = S.W, H = S.H, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "So this time, I didn't." [1] "handed it the pile — you do it" [2] "read every email, filled every row" [3] "I just watched" [4] "one pass, the hour was gone"
var tReset = beatAt(0, 0.0);
var tHandoff = Math.max(beatAt(1, 0.14), tReset + 0.7);
var tFill = Math.max(beatAt(2, 0.35), tHandoff + 1.3);
var tWatched = Math.max(beatAt(3, 0.68), tFill + 1.6);
var tStamp = Math.max(beatAt(4, 0.78), tWatched + 0.6);

var stage = document.getElementById("stage");
function center(el) { var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; }
var node = { x: W * 0.5, y: H * 0.33 };
var pcards = Array.prototype.slice.call(document.querySelectorAll(".pcard"));

// ── resting state ──
gsap.set("#glow", { opacity: 0, scale: 0.9 });
gsap.set(["#clock", "#rows"], { opacity: 0, y: -14 * U });
gsap.set("#pilecount", { opacity: 0 });
gsap.set(pcards, { opacity: 0, y: 16 * U, scale: 1 });
gsap.set("#ainode", { opacity: 0, scale: 0.6 });
gsap.set("#pulse", { opacity: 0, scale: 0.5 });
gsap.set("#running", { opacity: 0, y: 10 * U });
gsap.set("#sheet", { opacity: 0, y: 22 * U });
gsap.set(".sh-row .cell", { opacity: 0 });
gsap.set(".sh-row .check", { opacity: 0, scale: 0.4 });
gsap.set(".sh-row .sweep", { opacity: 0 });
gsap.set("#cursor", { opacity: 0, left: node.x, top: node.y + 150 * U, xPercent: -50, yPercent: -50, x: 0, y: 0 });
gsap.set("#watching", { opacity: 0, left: W * 0.62, top: H * 0.4, xPercent: -50, yPercent: -50, y: 10 * U });
gsap.set("#stamp", { opacity: 0 });

var clockProxy = { v: 54 }, rowProxy = { v: 0 };
var clockEl = document.getElementById("clock-min"), rowsEl = document.getElementById("rows-n");

var tl = gsap.timeline({ paused: true });

// ── beat 0 — "So this time, I didn't.": the pile + HUD + faint sheet appear ──
tl.to("#glow", { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, tReset);
tl.to(["#clock", "#rows"], { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.08 }, tReset);
tl.to("#pilecount", { opacity: 1, duration: 0.4 }, tReset + 0.1);
tl.to(pcards, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power2.out" }, tReset + 0.15);
tl.to("#sheet", { opacity: 0.5, y: 0, duration: 0.5, ease: "power3.out" }, tReset + 0.3);

// ── beat 1 — "handed it the pile — you do it": cards funnel into the AI node; Running... ──
tl.to("#cursor", { opacity: 1, duration: 0.2 }, tHandoff - 0.1);
pcards.forEach(function (c, i) {
  var cc = center(c);
  tl.to(c, { x: node.x - cc.x, y: node.y - cc.y, scale: 0.2, opacity: 0, duration: 0.5, ease: "power2.in" }, tHandoff + i * 0.02);
});
tl.to("#pilecount", { opacity: 0, duration: 0.3 }, tHandoff + 0.2);
// AI node powers up
tl.to("#ainode", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, tHandoff + 0.25);
tl.fromTo("#pulse", { opacity: 0.7, scale: 0.6 }, { opacity: 0, scale: 1.8, duration: 0.9, ease: "power2.out", repeat: 2 }, tHandoff + 0.4);
tl.to("#glow", { opacity: 1, scale: 1.15, duration: 0.6, ease: "power2.out" }, tHandoff + 0.3);
tl.to("#running", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tHandoff + 0.55);
tl.to("#spin", { rotation: 360, duration: 0.7, repeat: Math.max(1, Math.round((tFill - tHandoff) / 0.7)), ease: "none", transformOrigin: "50% 50%" }, tHandoff + 0.55);
// the cursor "tosses" the pile toward the node then eases off
tl.to("#cursor", { left: node.x, top: node.y + 70 * U, duration: 0.5, ease: "power2.inOut" }, tHandoff);

// ── beat 2 — "read every email, filled every row": the sheet fills in one cascade ──
tl.to("#sheet", { opacity: 1, duration: 0.3, ease: "power2.out" }, tFill - 0.1);
tl.to("#running", { opacity: 0, y: -8 * U, duration: 0.3 }, tFill + 0.1);
tl.to("#ainode", { y: -18 * U, scale: 0.92, opacity: 0.9, duration: 0.5, ease: "power2.inOut" }, tFill);
var rows = Array.prototype.slice.call(document.querySelectorAll(".sh-row"));
var fillSpan = cl(tWatched - tFill - 0.2, 1.2, 3.0);
tl.to(rowProxy, { v: 40, duration: fillSpan, ease: "power1.out", onUpdate: function () { rowsEl.textContent = Math.round(rowProxy.v); } }, tFill + 0.1);
tl.to(clockProxy, { v: 0, duration: fillSpan * 0.7, ease: "power3.in", onUpdate: function () { clockEl.textContent = Math.round(clockProxy.v); } }, tFill + 0.15);
rows.forEach(function (r, i) {
  var at = tFill + 0.15 + i * (fillSpan / rows.length) * 0.9;
  tl.fromTo(r.querySelector(".sweep"), { opacity: 0 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 1 }, at);
  tl.to(r.querySelectorAll(".cell"), { opacity: 1, duration: 0.16, stagger: 0.03, ease: "power1.out" }, at + 0.04);
  tl.to(r.querySelector(".check"), { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2.2)" }, at + 0.14);
});

// ── beat 3 — "I just watched": the cursor pulls back and goes still ──
tl.to("#cursor", { left: W * 0.86, top: H * 0.4, duration: 0.6, ease: "power3.out" }, tWatched);
tl.to("#cursor", { opacity: 0.6, duration: 0.3 }, tWatched + 0.4);
tl.to("#watching", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" }, tWatched + 0.25);

// ── beat 4 — "one pass, and the hour was gone": the gold stamp locks; HUD flips to done ──
tl.to("#watching", { opacity: 0, duration: 0.25 }, tStamp);
tl.to(clockProxy, { v: 0, duration: 0.2, onUpdate: function () { clockEl.textContent = Math.round(clockProxy.v); } }, tStamp);
// HUD flips to a green "done" state (direct property tweens — seek-safe)
tl.to(["#clock", "#rows"], { color: "#d7ffe9", borderColor: "rgba(53,208,127,0.55)", duration: 0.3 }, tStamp + 0.1);
tl.to(["#clock .dot"], { backgroundColor: "#35d07f", duration: 0.3 }, tStamp + 0.1);
// the AI node steps aside so the completed sheet + stamp read cleanly
tl.to("#ainode", { opacity: 0, scale: 0.7, duration: 0.3, ease: "power2.in" }, tStamp);
tl.to("#glow", { opacity: 0.7, duration: 0.4 }, tStamp);
tl.to("#stamp", { opacity: 1, scale: 1, rotation: -3, duration: 0.32, ease: "power4.in" }, tStamp);
tl.to("#stamp", { rotation: -1.5, duration: 0.34, ease: "back.out(2.2)" }, tStamp + 0.32);
tl.to("#stamp .big", { textShadow: "0 0 " + (64 * U) + "px rgba(255,176,32,0.7)", duration: 0.9, yoyo: true, repeat: 2, ease: "sine.inOut" }, tStamp + 0.5);
// gentle push-in on the finished sheet
tl.fromTo("#stage", { scale: 1.0 }, { scale: 1.03, duration: cl(D - tFill, 2, 8), ease: "power1.inOut", transformOrigin: "50% 52%" }, tFill);

HF.register("wh-one-pass", tl);
