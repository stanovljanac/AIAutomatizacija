/* three-stack — GSAP timeline for 010 s02. Three plates stack, then a gold "point of trust" seam.
 * Silent, deterministic, seek-driven. No exit tweens (master timeline owns the cut).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ markerLabel? }
 */
var S = HF.scene({ id: "three-stack", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

if (props.markerLabel && document.getElementById("seam-pill")) document.getElementById("seam-pill").textContent = String(props.markerLabel).trim();

// 6 sentence beats — establish a plate from the FIRST sentence (never blank), stack across 0/1/2
var tA = beatAt(0, 0.05);
var tB = Math.max(beatAt(1, 0.20), tA + 0.5);
var tC = Math.max(beatAt(2, 0.36), tB + 0.5);
var tSeam = Math.max(beatAt(5, 0.72), tC + 1.0);    // "the point of trust"

var tl = gsap.timeline({ paused: true });

gsap.set("#seam", { opacity: 0 });

// plates slide + stack, one per sentence, from the very first beat
tl.from("#plateA", { opacity: 0, x: -80 * U, duration: 0.55, ease: "power3.out" }, tA);
tl.from("#plateB", { opacity: 0, x: 80 * U, duration: 0.55, ease: "power3.out" }, tB);
tl.from("#plateC", { opacity: 0, y: 60 * U, duration: 0.6, ease: "back.out(1.4)" }, tC);

// the seam takes over — plates dim, the gold marker glows in
tl.to(["#plateA", "#plateB", "#plateC"], { filter: "brightness(0.42) saturate(0.7)", duration: 0.55, ease: "power2.inOut" }, tSeam);
tl.fromTo("#seam", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, tSeam + 0.1);
tl.fromTo("#seam-pill", { boxShadow: "0 0 0 rgba(255,176,32,0)" }, { boxShadow: "0 0 " + (40 * U) + "px rgba(255,176,32,0.75)", duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, tSeam + 0.5);

HF.register("three-stack", tl);
