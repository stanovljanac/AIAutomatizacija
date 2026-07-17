/* desk-pivot — GSAP timeline for 010 transitions (s04, s09). A gold sweep + chevrons drive a section
 * title in. Silent, deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ kicker?, title? }
 */
var S = HF.scene({ id: "desk-pivot", width: 1920, height: 1080, frames: 150 });
var fps = S.fps, W = S.W, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl;

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("ktext", props.kicker);
setText("ttl", props.title);

var t0 = beats.length ? cl(beats[0], 0.08, D - 0.4) : D * 0.06;

var tl = gsap.timeline({ paused: true });
gsap.set("#kicker", { opacity: 0 });
gsap.set(".chev span", { opacity: 0 });

// the gold rule sweeps across
tl.fromTo("#sweep", { x: -W * 0.7, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, t0);
// chevrons drive the eye forward
tl.to(".chev span", { opacity: 1, x: 10 * U, duration: 0.3, stagger: 0.08, ease: "power2.out" }, t0 + 0.2);
// kicker + title snap in
tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power2.out" }, t0 + 0.25);
tl.fromTo("#ttl", { opacity: 0, y: 30 * U, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, t0 + 0.35);

HF.register("desk-pivot", tl);
