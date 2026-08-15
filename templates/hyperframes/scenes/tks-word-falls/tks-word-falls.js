/* tks-word-falls — GSAP timeline for the 021 Short's hook. Frame 1 already shows the word; on the
 * first spoken beat the letters fall away and three gold capsules snap into their place with a hard
 * stop. The transformation IS the hook — no build-up, no title card, no logo first.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tks-word-falls", width: 1080, height: 1920, frames: 126, beatLo: 0.0, beatHi: 0.12 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var WORD = String(props.word || "strawberry");
var CHUNKS = Array.isArray(props.chunks) && props.chunks.length ? props.chunks : ["st", "raw", "berry"];

var wordEl = document.getElementById("word");
WORD.split("").forEach(function (ch) {
  var s = document.createElement("span"); s.textContent = ch; wordEl.appendChild(s);
});
var letters = wordEl.querySelectorAll("span");

var capsEl = document.getElementById("caps");
CHUNKS.forEach(function (c) {
  var s = document.createElement("span"); s.className = "cap"; s.textContent = c; capsEl.appendChild(s);
});
var caps = capsEl.querySelectorAll(".cap");

document.getElementById("kicker").textContent = props.kicker || "";

// [0] "You have never sent an AI a word." [1] "This is what it actually receives."
var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.61), t0 + 1.6);

gsap.set(letters, { y: 0, opacity: 1, rotation: 0 });
gsap.set(caps, { opacity: 0, y: -70 * U, scale: 0.86 });
gsap.set("#kicker", { opacity: 0 });
gsap.set("#rule", { scaleX: 0 });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.08, duration: D, ease: "sine.inOut" }, 0);

// the letters FALL — fast, inside the first second
letters.forEach(function (el, i) {
  tl.to(el, { y: 260 * U, rotation: i % 2 ? 11 : -11, opacity: 0, duration: 0.36, ease: "power2.in" }, t0 + 0.12 + i * 0.022);
});
// …and the capsules SNAP into their place, hard stop
caps.forEach(function (el, i) {
  tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "back.out(3)" }, t0 + 0.52 + i * 0.1);
});
tl.to("#kicker", { opacity: 1, duration: 0.3 }, t0 + 0.9);

// "This is what it actually receives." — the gold rule sweeps under them and the row settles
tl.to("#rule", { scaleX: 1, duration: 0.42, ease: "power3.out" }, t1);
tl.to(caps, { y: -10 * U, duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1 + 0.1);
tl.fromTo("#root", { scale: 1 }, { scale: 1.04, duration: Math.max(D - t0, 1), ease: "sine.out" }, t0);

HF.register("tks-word-falls", tl);
