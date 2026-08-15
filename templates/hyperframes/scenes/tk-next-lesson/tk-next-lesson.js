/* tk-next-lesson — GSAP timeline for 021 s23 (phase 1), s24 (phase 2) and Short s5 ("short").
 * The causal sign-off: everything arrives as chunks → how many fit at once? → the context window,
 * SHOWN for one beat and never taught here. No "subscribe for more"; the next concept is the CTA.
 * Deterministic, seek-driven; late elements in reserved space, never over the text.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-next-lesson", width: 1920, height: 1080, frames: 313, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = String(props.phase == null ? 1 : props.phase);

// the long row of capsules — the video's own unit, streaming
var track = document.getElementById("streamtrack");
for (var i = 0; i < 34; i++) {
  var c = document.createElement("span");
  c.className = "cp" + (i % 4 === 3 ? " dim" : "");
  track.appendChild(c);
}

document.getElementById("series").textContent = props.series || "Desk Lessons";
document.getElementById("next").textContent = props.plate || "Next: the context window";
document.getElementById("brand").textContent = props.brand || "";
document.getElementById("question").textContent = props.question || "";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

gsap.set(["#window", "#question", "#shelf", "#plate", "#brand"], { opacity: 0 });

if (PHASE === "2") {
  // s24: [0] "Before you go: what's the dumbest-looking thing…" [1] "I collect them."
  var q0 = beatAt(0, 0.0), q1 = Math.max(beatAt(1, 0.9), q0 + 3.0);
  var CARDS = Array.isArray(props.cards) && props.cards.length
    ? props.cards : ["counted the r's wrong", "broke a 280-char limit", "reversed the string badly"];
  var host = document.getElementById("cards");
  CARDS.forEach(function (t) {
    var s = document.createElement("span"); s.className = "fc"; s.textContent = t; host.appendChild(s);
  });
  var fcs = host.querySelectorAll(".fc");

  // OPENS on the frame s23 left behind — empty, waiting
  gsap.set("#stream", { opacity: 0.18 });
  gsap.set("#window", { opacity: 0.5, scale: 1 });
  gsap.set("#brand", { opacity: 0.9 });

  // the question lands INSIDE the frame
  tl.to("#window", { opacity: 0.22, duration: 0.5 }, q0 + 0.1);
  tl.fromTo("#question", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, q0 + 0.2);
  // …and the collection drifts in from the edges — warm, human, a little funny
  tl.to("#shelf", { opacity: 1, duration: 0.01 }, q1 - 0.1);
  // tight stagger: "I collect them" is the LAST line of the video, so the whole collection has to
  // land before the outro bumper takes the frame
  fcs.forEach(function (el, k) {
    var from = k % 2 === 0 ? -420 * U : 420 * U;
    tl.fromTo(el, { opacity: 0, x: from, y: -40 * U, rotation: k % 2 ? 6 : -6 },
      { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.34, ease: "power3.out" }, q1 + k * 0.07);
  });
  tl.fromTo("#root", { scale: 1 }, { scale: 1.025, duration: Math.max(D - q0, 1.2), ease: "sine.out" }, q0);
} else {
  // s23 / Short s5: [0] "…arrives as chunks" [1] "how many can it hold before it starts forgetting?"
  // [2] "That's the context window — and that's the next lesson."
  var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.2), t0 + 1.4), t2 = Math.max(beatAt(2, 0.71), t1 + 3.4);

  // OPENING FRAME: the capsules are ALREADY streaming (a cut has no runway)
  gsap.set("#streamtrack", { x: 0 });
  tl.to("#streamtrack", { x: -1350 * U, duration: Math.max(t2 - t0 + 1.0, 3), ease: "power1.out" }, t0);

  // the frame CLOSES around a subset; everything outside it dims and drops away
  tl.fromTo("#window", { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, t1 + 1.4);
  tl.to("#streamtrack", { opacity: 0.5, filter: "saturate(0.35)", duration: 0.6, ease: "power2.out" }, t1 + 1.6);
  tl.fromTo("#window", { boxShadow: "0 0 " + 40 * U + "px rgba(255,176,32,0.30)" },
    { boxShadow: "0 0 " + 70 * U + "px rgba(255,176,32,0.5)", duration: 0.8, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1 + 2.0);

  // the next-lesson plate, in reserved space
  tl.to("#plate", { opacity: 1, duration: 0.42, ease: "power3.out" }, t2);
  tl.fromTo("#plate", { y: 20 * U }, { y: 0, duration: 0.42, ease: "power3.out" }, t2);
  if (PHASE === "short") tl.to("#brand", { opacity: 0.9, duration: 0.4 }, t2 + 0.6);
  tl.fromTo("#root", { scale: 1 }, { scale: 1.03, duration: Math.max(D - t1, 1.2), ease: "sine.out" }, t1);
}

HF.register("tk-next-lesson", tl);
