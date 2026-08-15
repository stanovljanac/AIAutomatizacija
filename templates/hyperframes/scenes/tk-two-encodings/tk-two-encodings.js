/* tk-two-encodings — GSAP timeline for 021 s12 (phase 1) and s13 (phase 2). Both encodings cut the
 * word into THREE, so the count is not the story: the gold cut-ticks are, and they slide between the
 * rails. Then the cause (a different pile of text) runs behind each rail and one gold line lands.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-two-encodings", width: 1920, height: 1080, frames: 412, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var TOP = Array.isArray(props.top) && props.top.length ? props.top : ["str", "aw", "berry"];
var BOTTOM = Array.isArray(props.bottom) && props.bottom.length ? props.bottom : ["st", "raw", "berry"];

document.getElementById("labelA").textContent = props.topLabel || "cl100k_base · GPT-4 era";
document.getElementById("labelB").textContent = props.bottomLabel || "o200k_base · GPT-4o era";
document.getElementById("caption").textContent = props.caption || "";
document.getElementById("chip").textContent = props.sourceChip || "tiktoken";
document.getElementById("line").textContent = props.line || "";

/** Draw one rail's word as pieces, with a gold cut-tick after every piece but the last. */
function drawWord(hostId, parts) {
  var host = document.getElementById(hostId);
  var ticks = [];
  parts.forEach(function (t, i) {
    var pc = document.createElement("span");
    pc.className = "pc";
    pc.textContent = t;
    if (i < parts.length - 1) {
      var tk = document.createElement("span");
      tk.className = "tick";
      pc.appendChild(tk);
      ticks.push(tk);
    }
    host.appendChild(pc);
  });
  return ticks;
}
var ticksA = drawWord("wordA", TOP);
var ticksB = drawWord("wordB", BOTTOM);

// the cause, shown once: a river behind each rail, at a DIFFERENT density
["trackA", "trackB"].forEach(function (id, r) {
  var host = document.getElementById(id);
  var words = Array.isArray(props.riverWords) && props.riverWords.length
    ? props.riverWords : ["invoice", "token", "please", "chunk", "report", "data", "monday", "email"];
  var passes = r === 0 ? 2 : 4; // the older encoding saw a smaller, different pile
  for (var p = 0; p < passes; p++) {
    words.forEach(function (w) {
      var s = document.createElement("span"); s.className = "rw"; s.textContent = w; host.appendChild(s);
    });
  }
});

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.04, duration: D, ease: "sine.inOut" }, 0);

if (PHASE === 1) {
  // [0] "And these chunks aren't universal." [1] "Change the model and the same word comes apart
  // differently." [2] "The older encoding cuts strawberry into three pieces." [3] "The current one
  // also uses three — but not the same three."
  var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.15), t0 + 1.4),
      t2 = Math.max(beatAt(2, 0.43), t1 + 2.4), t3 = Math.max(beatAt(3, 0.72), t2 + 2.6);

  // OPENING FRAME: both rails already there, the same word on both, uncut
  gsap.set([ticksA, ticksB], { scaleY: 0 });
  gsap.set(["#countA", "#countB"], { opacity: 0 });
  gsap.set(["#riverA", "#riverB", "#line"], { opacity: 0 });
  gsap.set("#caption", { opacity: 0 });
  gsap.set("#railB", { opacity: 0.45 });

  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.2);
  tl.to("#railA", { borderColor: "rgba(255,176,32,0.3)", duration: 0.4 }, t1);

  // the OLDER encoding cuts first
  ticksA.forEach(function (tk, i) {
    tl.to(tk, { scaleY: 1, duration: 0.24, ease: "back.out(2.4)" }, t2 + 0.2 + i * 0.22);
  });
  tl.to("#countA", { opacity: 1, duration: 0.26, ease: "back.out(2)" }, t2 + 0.9);

  // …then the current one — same count, DIFFERENT boundaries
  tl.to("#railB", { opacity: 1, borderColor: "rgba(255,176,32,0.3)", duration: 0.4 }, t3);
  ticksB.forEach(function (tk, i) {
    tl.to(tk, { scaleY: 1, duration: 0.24, ease: "back.out(2.4)" }, t3 + 0.25 + i * 0.22);
  });
  tl.to("#countB", { opacity: 1, duration: 0.26, ease: "back.out(2)" }, t3 + 0.95);
  // lead the eye to the BOUNDARY, not the count: the ticks slide between the rails
  tl.fromTo(ticksB, { x: -34 * U }, { x: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.08 }, t3 + 1.3);
  tl.fromTo(ticksA, { scaleY: 1 }, { scaleY: 1.18, duration: 0.35, yoyo: true, repeat: 1, ease: "sine.inOut" }, t3 + 1.4);
  tl.to("#caption", { opacity: 1, duration: 0.3 }, t3 + 2.1);
} else {
  // [0] "Same word, same ten letters, different atoms — because a different pile of text was
  // scanned." [1] "There's no correct way to cut a word." [2] "There's only what each model
  // happened to learn."
  var u0 = beatAt(0, 0.0), u1 = Math.max(beatAt(1, 0.63), u0 + 3.4), u2 = Math.max(beatAt(2, 0.82), u1 + 1.2);

  // OPENS on both rails exactly as s12 left them: cut, counted, lit
  gsap.set([ticksA, ticksB], { scaleY: 1 });
  gsap.set(["#countA", "#countB"], { opacity: 1 });
  gsap.set(["#railA", "#railB"], { opacity: 1, borderColor: "rgba(255,176,32,0.3)" });
  gsap.set("#caption", { opacity: 1 });
  gsap.set("#line", { opacity: 0, scale: 1.15 });
  gsap.set("#chip", { opacity: 1 });

  // the cause, once: a different pile of text behind each rail
  tl.to(["#riverA", "#riverB"], { opacity: 0.9, duration: 0.4 }, u0 + 1.1);
  tl.fromTo("#trackA", { x: 0 }, { x: -700 * U, duration: 3.2, ease: "none" }, u0 + 1.1);
  tl.fromTo("#trackB", { x: 0 }, { x: -1500 * U, duration: 3.2, ease: "none" }, u0 + 1.1);
  tl.to(["#riverA", "#riverB"], { opacity: 0, duration: 0.5 }, u0 + 4.0);

  // both rails dim to gray; one gold line lands alone in the centre
  tl.to(["#railA", "#railB"], { opacity: 0.2, filter: "grayscale(1)", duration: 0.5, ease: "sine.out" }, u1 - 0.2);
  tl.to("#caption", { opacity: 0, duration: 0.3 }, u1 - 0.2);
  tl.to("#line", { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.6)" }, u1);
  // held ≥3s, with only a slow push — the second screenshotable frame of the video
  tl.fromTo("#line", { letterSpacing: -2 * U + "px" }, { letterSpacing: 0 + "px", duration: Math.max(D - u1, 1), ease: "sine.out" }, u1);
  tl.fromTo("#root", { scale: 1 }, { scale: 1.025, duration: Math.max(D - u2, 0.8), ease: "sine.out" }, u2);
}

HF.register("tk-two-encodings", tl);
