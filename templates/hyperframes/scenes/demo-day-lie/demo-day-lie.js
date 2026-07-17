/* demo-day-lie — GSAP timeline for 013 s2. Glossy DEMO DAY face → camera swings ~180° around
 * the 3D rig → WEEK 3 reverse face: token flips EXPIRED, free-tier meter melts to red 503s,
 * red spike at the end feeds the hard cut. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "demo-day-lie", width: 1080, height: 1920, frames: 279, beatLo: 0.05, beatHi: 0.5 });
var fps = S.fps, W = S.W, D = S.D, U = S.U, props = S.props, cl = S.cl, beatAt = S.beatAt;

var tDemo = beatAt(0, 0.01);
var tSwing = Math.max(beatAt(1, 0.36), tDemo + 1.6);

// deterministic confetti table [left%, delay-jitter, hue]
var CONF = [[12, 0, "#4FC3F7"], [28, 0.05, "#FFB020"], [44, 0.02, "#4ade80"], [58, 0.07, "#4FC3F7"], [72, 0.03, "#FFB020"], [86, 0.06, "#4ade80"]];
var confBox = document.getElementById("conf");
for (var ci = 0; ci < CONF.length; ci++) {
  var c = document.createElement("div");
  c.className = "confetti";
  c.style.left = CONF[ci][0] + "%";
  c.style.top = "18%";
  c.style.background = CONF[ci][2];
  confBox.appendChild(c);
}

var tl = gsap.timeline({ paused: true });

// beat 0 — headline + the glossy demo face performs
tl.fromTo("#headline", { opacity: 0, y: 34 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tDemo + 0.05);
tl.from("#rig", { y: 60 * U, opacity: 0, duration: 0.55, ease: "power3.out" }, tDemo);
// a touch of idle orbit so the stage reads 3D even before the swing
tl.fromTo("#rig", { rotationY: -8 }, { rotationY: 8, duration: cl(tSwing - tDemo, 1, 4), ease: "sine.inOut" }, tDemo);
tl.from(".p-row", { opacity: 0, x: -40 * U, duration: 0.4, stagger: 0.14, ease: "power3.out" }, tDemo + 0.35);
tl.fromTo("#sheen", { x: 0 }, { x: W * 1.6, duration: 0.9, ease: "power2.inOut" }, tDemo + 0.7);
for (var k = 0; k < CONF.length; k++) {
  tl.fromTo(confBox.children[k], { opacity: 1, y: 0, rotation: 0 },
    { y: (150 + (k % 3) * 60) * U, rotation: (k % 2 ? 200 : -160), opacity: 0, duration: 1.1, ease: "power1.in" },
    tDemo + 0.9 + CONF[k][1]);
}

// beat 1 — THE CAMERA SWING to the reverse angle (the same product, week three)
tl.to("#rig", { rotationY: 188, duration: 1.05, ease: "power3.inOut" }, tSwing);
tl.to("#camera", { scale: 1.06, duration: 1.05, ease: "power2.inOut" }, tSwing);
tl.to("#headline", { opacity: 0.85, duration: 0.4 }, tSwing);
// week-3 face degrades: token flips to EXPIRED, meter melts to red, 503 lines slam
tl.to("#tokenchip", { rotationX: 180, duration: 0.5, ease: "back.out(1.6)" }, tSwing + 1.15);
tl.to("#mfill", { scaleX: 0.12, duration: 1.1, ease: "power2.inOut" }, tSwing + 1.2);
tl.to("#mfill", { background: "linear-gradient(90deg, #ff5c5c, #b91c1c)", duration: 0.4 }, tSwing + 1.7);
// OK → 503 readout swap (two stacked spans; opacity only — fully seek-safe)
tl.to("#mreadOk", { opacity: 0, duration: 0.18 }, tSwing + 1.8);
tl.to("#mreadBad", { opacity: 1, scale: 1.15, duration: 0.2, ease: "back.out(2)" }, tSwing + 1.85);
tl.to("#mreadBad", { scale: 1, duration: 0.2 }, tSwing + 2.05);
tl.fromTo(".err.e1", { opacity: 0, x: -30 * U }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, tSwing + 2.1);
tl.fromTo(".err.e2", { opacity: 0, x: -30 * U }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, tSwing + 2.45);
// the whole dim panel shivers once (the machine coughing)
tl.to("#rig", { x: 6 * U, duration: 0.06, yoyo: true, repeat: 3, ease: "power1.inOut" }, tSwing + 2.5);
// closing red spike → hard cut into s3
tl.fromTo("#spike", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power3.in" }, cl(D - 0.45, tSwing + 2.6, D - 0.2));

HF.register("demo-day-lie", tl);
