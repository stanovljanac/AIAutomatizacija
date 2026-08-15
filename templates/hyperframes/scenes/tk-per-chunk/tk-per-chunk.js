/* tk-per-chunk — GSAP timeline for 021 s14 (THE TAX, SETUP). Establishes the two instruments s15 and
 * s16 read off, with their units printed on them in TOKENS — then replaces "per word" with
 * "per chunk" in place. Nothing here carries a model name, a price or a window size.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-per-chunk", width: 1920, height: 1080, frames: 235, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

document.getElementById("memlabel").textContent = props.memoryLabel || "MEMORY";
document.getElementById("memunit").textContent = props.memoryUnit || "tokens";
document.getElementById("costlabel").textContent = props.costLabel || "COST";
document.getElementById("costunit").textContent = props.costUnit || "per token";
document.getElementById("wrongunit").textContent = props.wrongUnit || "per word";
document.getElementById("rightunit").textContent = props.rightUnit || "per chunk";
document.getElementById("caption").textContent = props.caption || "";

// [0] "Then there's the part you pay for." [1] "Context windows are measured in tokens."
// [2] "Pricing is per token." [3] "Not per word — per chunk."
var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.22), t0 + 1.2),
    t2 = Math.max(beatAt(2, 0.6), t1 + 2.0), t3 = Math.max(beatAt(3, 0.8), t2 + 1.2);

gsap.set(".inst", { opacity: 0, y: 34 * U });
gsap.set("#memfill", { scaleX: 0 });
gsap.set("#memunit", { opacity: 0 });
gsap.set(".readout", { opacity: 0 });
gsap.set(["#wrongunit", "#rightunit"], { opacity: 0 });
gsap.set("#caption", { opacity: 0 });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.04, duration: D, ease: "sine.inOut" }, 0);

// both instruments arrive together — they are one system, not two facts
tl.to(".inst", { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" }, t0 + 0.1);

// MEMORY is measured in tokens — the unit is printed ON the bar
tl.to("#memfill", { scaleX: 0.62, duration: 1.1, ease: "power2.out" }, t1);
tl.to("#memunit", { opacity: 1, duration: 0.3 }, t1 + 0.4);

// COST is priced per token
var c = { v: 0 };
tl.to(".readout", { opacity: 1, duration: 0.25 }, t2 - 0.1);
tl.to(c, {
  v: 1, duration: 1.0, ease: "power2.out",
  onUpdate: function () { document.getElementById("costnum").textContent = (c.v * 0.42).toFixed(2); },
}, t2);

// "Not per word — per chunk." — the gray unit is REPLACED IN PLACE by the gold one
tl.to("#wrongunit", { opacity: 1, duration: 0.24 }, t3);
tl.to("#wrongunit", { opacity: 0, y: -26 * U, duration: 0.28, ease: "power2.in" }, t3 + 0.55);
tl.fromTo("#rightunit", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.8)" }, t3 + 0.62);
tl.to("#caption", { opacity: 1, duration: 0.3 }, t3 + 0.95);

HF.register("tk-per-chunk", tl);
