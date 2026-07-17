/* stat-grid — GSAP timeline for 010 s05 (on-screen number 1). 63 cells, 57 cascade red, counter
 * rolls to 57, source baked in. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, of?, caption?, source? }
 */
var S = HF.scene({ id: "stat-grid", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beatAt = S.beatAt;

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

var tIntro = beatAt(0, 0.05);
var tCascade = Math.max(beatAt(1, 0.26), tIntro + 0.5);
var tSuspend = Math.max(beatAt(3, 0.74), tCascade + 1.4);

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

HF.register("stat-grid", tl);
