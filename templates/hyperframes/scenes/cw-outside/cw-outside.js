/* cw-outside — 022 s20 (phase 1) + s24 (phase 2).
 * Premise: both scenes concede that the remembering WORKS — and then locate it outside the model.
 * The gold frame is the boundary; the drawer, the summariser, the retriever and the memory file all
 * live beyond it and feed pages in. Nothing here is allowed to look like a flaw being mocked: every
 * helper visibly does its job before the pull-back makes the point.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-outside", width: 1920, height: 1080, frames: 476, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 73, bloomY: 50 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("flbl").textContent = props.frameLabel || "the model's window";
document.getElementById("dlbl").textContent = props.drawerLabel || "a file the app keeps";
document.getElementById("notetext").textContent = props.note || "your name";
document.getElementById("kicker").textContent = props.title || "The app remembers. The model re-reads.";
var MECH = props.mechanisms || ["summarise the old turns", "fetch only the page you need", "keep a note in a file"];
["l1", "l2", "l3"].forEach(function (id, i) { document.getElementById(id).textContent = MECH[i]; });
["i1", "i2", "i3"].forEach(function (id) {
  var host = document.getElementById(id);
  for (var k = 0; k < 3; k++) {
    var sh = FX.el("sh", host, "span");
    sh.style.top = FX.px(24 + k * 26);
  }
});

var DESK_Y = 700;
FX.desk(document.getElementById("deskhost"), { w: 760, top: DESK_Y });
var slabs = FX.pile(document.getElementById("pilehost"), { n: 12, baseY: DESK_Y - 16, w: 620, gap: 21, seed: 41 });

gsap.set(["#frame", "#drawer", "#note", "#kicker", "#m1", "#m2", "#m3"], { opacity: 0 });

/* ═══════════════ ph1 — s20: yes, it remembers your name. From outside. ═════════ */
if (PHASE === 1) {
  var t1 = Math.max(beatAt(1, 0.23), 2.4);   // "The note with your name lives outside the model…"
  var t2 = Math.max(beatAt(2, 0.72), t1 + 5.0);   // "Something else does the remembering."
  var t3 = Math.max(beatAt(3, 0.87), t2 + 1.6);   // "The model still just re-reads."

  gsap.set(slabs, { opacity: 0 });
  tl.to("#frame", { opacity: 1, duration: 0.4 }, 0.2);
  tl.to("#drawer", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t1 - 1.0);

  /* out of the drawer, across the boundary, and down as page ONE of a fresh pile */
  tl.to("#note", { opacity: 1, duration: 0.25 }, t1 + 0.2);
  tl.to("#note", { x: FX.px(700), y: FX.px(180), duration: 0.9, ease: "power2.inOut" }, t1 + 0.35);
  tl.to("#note", { opacity: 0, duration: 0.2 }, t1 + 1.2);
  FX.fromTo(tl, slabs[0], { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, t1 + 1.25);
  for (var i = 1; i < 12; i++) {
    FX.fromTo(tl, slabs[i], { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.26, ease: "power3.out" }, t1 + 1.5 + i * 0.16);
  }
  tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, t2 + 0.2);
  tl.to("#drawer", { boxShadow: "0 " + FX.px(20) + " " + FX.px(50) + " rgba(0,0,0,0.5), 0 0 " + FX.px(50) + " rgba(255,176,32,0.35)", duration: 0.5 }, t3);
  FX.camera(tl, { at: t2, scale: 1.03, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ══════════ ph2 — s24: they all work, and every one of them is outside ═════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.13), u0 + 1.6);   // "Summarising old turns, fetching only the page…"
  var u2 = Math.max(beatAt(2, 0.67), u1 + 8.0);   // "But look at what every one of them is…"
  var u3 = Math.max(beatAt(3, 0.96), u2 + 4.0);   // "That is the admission."

  gsap.set(slabs, { opacity: 1 });
  gsap.set("#frame", { opacity: 1 });

  /* each helper arrives, does its job, and the pile really does get smaller */
  [["#m1", 0], ["#m2", 1], ["#m3", 2]].forEach(function (pair, k) {
    var at = u1 + 0.3 + k * 2.6;
    FX.fromTo(tl, pair[0], { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.36, ease: "back.out(1.8)" }, at);
    /* three pages leave the desk per helper — it works, visibly */
    for (var j = 0; j < 3; j++) {
      var idx = 11 - (k * 3 + j);
      tl.to(slabs[idx], { opacity: 0, y: FX.px(-30), scaleX: 0.7, duration: 0.35, ease: "power2.in" }, at + 0.6 + j * 0.16);
    }
  });

  /* the pull-back: the point is WHERE they are, not what they do */
  FX.camera(tl, { at: u2 + 0.1, scale: 0.86, dur: 1.1, ease: "power2.inOut" });
  tl.to(["#m1", "#m2", "#m3"], { filter: "drop-shadow(0 0 " + FX.px(24) + " rgba(255,176,32,0.5))", duration: 0.6 }, u2 + 0.6);
  tl.to("#frame", { boxShadow: "inset 0 0 " + FX.px(120) + " rgba(255,176,32,0.2), 0 0 " + FX.px(60) + " rgba(255,176,32,0.28)", duration: 0.7 }, u2 + 0.8);
  tl.to("#kicker", { opacity: 1, duration: 0.42, ease: "power3.out" }, u3 - 0.4);
}

HF.register("cw-outside", tl);
