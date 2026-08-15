/* tk-vocab-shelf — GSAP timeline for 021 s4 (phase 1) and s5 (phase 2). Frequency builds the
 * vocabulary: a river of text, four fusions, a shelf that sorts itself — then one frequent word
 * survives whole while a rare one cracks into scraps. Concept altitude only.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-vocab-shelf", width: 1920, height: 1080, frames: 350, beatLo: 0.0, beatHi: 0.25 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var RIVER = Array.isArray(props.riverWords) && props.riverWords.length
  ? props.riverWords
  : ["invoice", "the", "automation", "please", "send", "report", "chunk", "monday"];
var FUSIONS = Array.isArray(props.fusions) && props.fusions.length
  ? props.fusions
  : [["auto", "mation"], ["pay", "ment"], ["sched", "ule"], ["in", "voice"]];

// the shelf shape is fixed for BOTH phases so s5 opens on exactly the shelf s4 built
var SHELF = [
  { t: "automation", thin: false }, { t: "payment", thin: false }, { t: "schedule", thin: false },
  { t: "invoice", thin: false }, { t: "onk", thin: true }, { t: "als", thin: true }, { t: "wo", thin: true },
];

var riverTrack = document.getElementById("rivertrack");
for (var pass = 0; pass < 3; pass++) {
  RIVER.forEach(function (w, i) {
    var s = document.createElement("span");
    s.className = "rw" + (i % 3 === 0 ? " dim" : "");
    s.textContent = w;
    riverTrack.appendChild(s);
  });
}

var shelfEl = document.getElementById("shelf");
SHELF.forEach(function (p) {
  var s = document.createElement("span");
  s.className = "pill" + (p.thin ? " thin" : "");
  s.textContent = p.t;
  shelfEl.appendChild(s);
});
var pills = shelfEl.querySelectorAll(".pill");

document.getElementById("caption").textContent = props.caption || "";
document.getElementById("chip").textContent = props.sourceChip || "";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

if (PHASE === 1) {
  // sentence beats: [0] "Nobody wrote that list of chunks by hand." [1] "…merging the pieces that
  // turned up together most often." [2] "So frequency decides shape."
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.24), t0 + 1.8);
  var t2 = Math.max(beatAt(2, 0.83), t1 + 5.2);

  gsap.set("#handlist", { opacity: 0, y: 18 * U });
  gsap.set("#hslash", { scaleX: 0 });
  gsap.set("#river", { opacity: 0 });
  gsap.set("#rivertrack", { x: 0 });
  gsap.set(pills, { opacity: 0, y: -40 * U, scale: 0.8 });
  gsap.set("#shelflabel", { opacity: 0 });
  gsap.set("#caption", { opacity: 0, y: 20 * U });
  gsap.set(["#cards", "#chip"], { opacity: 0 });

  // b0 — the hand-written list, crossed out
  tl.to("#handlist", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t0 + 0.1);
  tl.to("#hslash", { scaleX: 1, duration: 0.24, ease: "power4.out" }, t0 + 1.0);
  tl.to("#handlist", { opacity: 0, y: -30 * U, duration: 0.34, ease: "power2.in" }, t1 - 0.2);

  // b1 — the river, then four fusions, each dropping a finished capsule onto the shelf
  tl.to("#river", { opacity: 1, duration: 0.3 }, t1);
  tl.to("#rivertrack", { x: -1500 * U, duration: Math.max(t2 - t1 + 1.2, 2), ease: "none" }, t1);
  tl.to("#shelflabel", { opacity: 1, duration: 0.3 }, t1 + 0.5);

  var fusionEl = document.getElementById("fusion");
  FUSIONS.slice(0, 4).forEach(function (pairText, i) {
    var at = t1 + 1.3 + i * 1.0;
    var pair = document.createElement("div");
    pair.className = "pair";
    pair.id = "pair" + i;
    var a = document.createElement("span"); a.className = "frag left"; a.textContent = pairText[0];
    var b = document.createElement("span"); b.className = "frag right"; b.textContent = pairText[1];
    pair.appendChild(a); pair.appendChild(b);
    fusionEl.appendChild(pair);

    gsap.set(pair, { opacity: 0 });
    gsap.set(a, { x: -200 * U });
    gsap.set(b, { x: 200 * U });
    // the two fragments COLLIDE…
    tl.to(pair, { opacity: 1, duration: 0.16 }, at);
    tl.to(a, { x: 0, duration: 0.3, ease: "power3.in" }, at);
    tl.to(b, { x: 0, duration: 0.3, ease: "power3.in" }, at);
    // …and FUSE: one flash, then the finished capsule drops onto the shelf
    tl.to([a, b], { backgroundColor: "#ffb020", color: "#16232f", borderColor: "#ffd37a", duration: 0.14 }, at + 0.3);
    tl.to(pair, { y: 230 * U, scale: 0.62, opacity: 0, duration: 0.42, ease: "power2.in" }, at + 0.46);
    tl.to(pills[i], { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, at + 0.72);
  });
  // the rare scraps land quietly with the last fusion — they are shelf furniture, not the point
  [4, 5, 6].forEach(function (k, i) {
    tl.to(pills[k], { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "power3.out" }, t1 + 4.4 + i * 0.14);
  });

  // b2 — "frequency decides shape": one sorting sweep, fat left / thin right (the DOM order already
  // is the sorted order, so the sweep is a settle, not a re-layout)
  tl.to("#river", { opacity: 0.25, duration: 0.4 }, t2);
  tl.to(pills, { y: -18 * U, duration: 0.22, stagger: 0.03, ease: "power2.out" }, t2);
  tl.to(pills, { y: 0, duration: 0.34, stagger: 0.03, ease: "back.out(2.2)" }, t2 + 0.22);
  tl.to("#caption", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t2 + 0.3);
} else {
  // ── s5: opens on the shelf ALREADY built ──
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.61), u0 + 4.5);
  var u2 = Math.max(beatAt(2, 0.9), u1 + 2.4);

  var WHOLE = props.whole || "automation";
  var RARE = props.rare || "Okonkwo";
  var PARTS = Array.isArray(props.rareParts) && props.rareParts.length ? props.rareParts : [" Ok", "onk", "wo"];

  document.getElementById("wholeword").textContent = WHOLE;
  document.getElementById("wholenum").textContent = props.wholeCount || "1";
  document.getElementById("rareword").textContent = RARE;
  var scrapsEl = document.getElementById("scraps");
  PARTS.forEach(function (p) {
    var s = document.createElement("span"); s.className = "sc"; s.textContent = p; scrapsEl.appendChild(s);
  });
  var scraps = scrapsEl.querySelectorAll(".sc");

  gsap.set(["#handlist", "#river", "#caption"], { opacity: 0 });
  gsap.set(pills, { opacity: 1, y: 0, scale: 1 });
  gsap.set("#shelflabel", { opacity: 1 });
  gsap.set("#cards", { opacity: 1 });
  gsap.set("#whole", { opacity: 0, y: -60 * U });
  gsap.set("#rare", { opacity: 0, y: -60 * U });
  gsap.set("#meterfill", { scaleX: 0 });
  gsap.set("#wholenum", { opacity: 0, scale: 1.6 });
  gsap.set(scraps, { opacity: 0, y: -20 * U });
  gsap.set("#chip", { opacity: 0 });

  // b0 — the frequent word survives WHOLE: one fat solid capsule, one gold 1
  tl.to("#chip", { opacity: 1, duration: 0.3 }, u0 + 0.4);
  tl.to("#whole", { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.6)" }, u0 + 0.5);
  tl.to("#wholenum", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.2)" }, u0 + 1.1);
  // the frequency meter fills — this is WHY it survived whole (shown, never explained again)
  tl.to("#meterfill", { scaleX: 1, duration: 2.1, ease: "power2.out" }, u0 + 1.5);
  tl.fromTo("#whole", { boxShadow: "0 0 0 rgba(255,176,32,0)" },
    { boxShadow: "0 " + 14 * U + "px " + 44 * U + "px rgba(255,176,32,0.26)", duration: 0.8, ease: "sine.out" }, u0 + 2.4);

  // b1 — the rare word lands and CRACKS into scraps
  tl.to("#rare", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u1);
  tl.to("#rareword", { opacity: 0, scale: 0.9, duration: 0.26, ease: "power2.in" }, u1 + 0.7);
  scraps.forEach(function (el, i) {
    tl.to(el, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2.4)" }, u1 + 0.85 + i * 0.13);
    tl.fromTo(el, { rotation: i % 2 ? 4 : -4 }, { rotation: 0, duration: 0.4, ease: "power2.out" }, u1 + 0.85 + i * 0.13);
  });

  // b2 — clear the stage for the names
  tl.to("#shelfwrap", { y: 320 * U, opacity: 0, duration: 0.5, ease: "power2.in" }, u2);
  tl.to("#cards", { y: -40 * U, opacity: 0, duration: 0.45, ease: "power2.in" }, u2 + 0.35);
  tl.to("#chip", { opacity: 0, duration: 0.3 }, u2 + 0.5);
}

HF.register("tk-vocab-shelf", tl);
