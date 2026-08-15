/* tk-atom-monolith — GSAP timeline for 021 s22 (THE TAKEAWAY MONOLITH). The wrong model stops dead
 * during the scripted 0.8s silence; the right one lands in the SAME position. The spine capsule
 * refuses the probe (never receives what's inside one) and pays a credit per capsule.
 * Deterministic, seek-driven; flat, face-on. Held ≥4s with nothing else moving.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-atom-monolith", width: 1920, height: 1080, frames: 344, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

document.getElementById("wrong").textContent = props.wrong || "a token = a small word";
document.getElementById("right").textContent = props.right || "A CHUNK IS THE MODEL'S ATOM.";
document.getElementById("brand").textContent = props.brand || "The Automation Desk";

var N = Math.max(3, Math.min(Number(props.credits) || 6, 10));
var chost = document.getElementById("credits");
for (var i = 0; i < N; i++) {
  var c = document.createElement("span"); c.className = "cr"; chost.appendChild(c);
}
var creds = chost.querySelectorAll(".cr");

// [0] "So here's the swap worth keeping." [1] "Not: a token is a small word."  ← 0.8s SCRIPTED PAUSE
// [2] "A chunk is the model's atom." [3] "It never receives what's inside one, and it pays for every one."
var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.16), t0 + 1.0),
    t2 = Math.max(beatAt(2, 0.47), t1 + 2.2), t3 = Math.max(beatAt(3, 0.64), t2 + 1.4);

gsap.set(["#wrong", "#right", "#spine", "#brand"], { opacity: 0 });
gsap.set(".cr", { opacity: 0 });
gsap.set("#ring", { opacity: 0, scale: 1 });
gsap.set("#probe", { opacity: 0, y: -30 * U });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// the wrong model, in gray
tl.to("#wrong", { opacity: 1, duration: 0.36, ease: "power3.out" }, t1);
// THE SCRIPTED PAUSE — it simply STOPS. No slash, no shatter: the gray line alone, held.
// (Nothing is animated between t1+0.4 and t2 on purpose.)

// the gold line lands in the SAME position, at the same weight
tl.to("#wrong", { opacity: 0, duration: 0.24, ease: "power2.in" }, t2 - 0.1);
tl.fromTo("#right", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.4)" }, t2);

// the spine capsule returns beneath it
tl.to("#spine", { opacity: 1, duration: 0.4, ease: "power3.out" }, t3);
tl.fromTo("#sheen", { x: -200 * U }, { x: 620 * U, duration: 1.2, ease: "power2.inOut" }, t3 + 0.2);
// a probe touches it and is REFUSED — no entry
tl.fromTo("#probe", { opacity: 0, y: -60 * U }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.in" }, t3 + 0.6);
tl.to("#probe", { y: -30 * U, duration: 0.3, ease: "power2.out" }, t3 + 1.0);
tl.fromTo("#ring", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 1.18, duration: 0.8, ease: "power2.out" }, t3 + 0.98);
tl.to("#probe", { opacity: 0, duration: 0.3 }, t3 + 1.35);
// …and it pays for every one: one credit per capsule
creds.forEach(function (el, k) {
  tl.to(el, { opacity: 1, duration: 0.18, ease: "power2.out" }, t3 + 1.5 + k * 0.14);
  tl.to(el, { backgroundColor: "#ffb020", duration: 0.2, ease: "power2.out" }, t3 + 1.56 + k * 0.14);
});
tl.to("#brand", { opacity: 1, duration: 0.4 }, t3 + 2.2);
// hold, with nothing else moving but the slowest possible push
tl.fromTo("#root", { scale: 1 }, { scale: 1.025, duration: Math.max(D - t2, 1.5), ease: "sine.out" }, t2);

HF.register("tk-atom-monolith", tl);
