/* lab-outro — GSAP timeline for 012 s17. The lab title → the dim diagram + one hot station
 * ("next build") → single subscribe. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ title?, subtitle? }
 */
var S = HF.scene({ id: "lab-outro", width: 1920, height: 1080, frames: 360, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

// 3 sentence beats
var tLab = beatAt(0, 0.04);
var tDiag = Math.max(beatAt(1, 0.3), tLab + 0.9);
var tSub = Math.max(beatAt(2, 0.72), tDiag + 1.6);

var tl = gsap.timeline({ paused: true });

// beat 0 — the lab
tl.from("#lab", { opacity: 0, y: 40 * U, duration: 0.55, ease: "power3.out" }, tLab);

// beat 1 — every station gets its own build: the dim diagram breathes in; ONE node runs hot
tl.to("#minidiag", { opacity: 1, duration: 0.6, ease: "power2.out" }, tDiag);
tl.from(".mnode", { scale: 0.3, duration: 0.4, stagger: 0.05, ease: "back.out(1.8)" }, tDiag);
tl.to("#labsub", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tDiag + 0.3);
tl.to("#hotnode", { scale: 1.5, duration: 0.35, ease: "power2.out" }, tDiag + 0.8);
tl.to("#hotnode", { scale: 1.25, duration: 0.4, ease: "power2.inOut" }, tDiag + 1.2);
tl.fromTo("#nexttag", { opacity: 0, y: 12 * U }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.8)" }, tDiag + 1.0);

// beat 2 — one subtle CTA
tl.fromTo("#subrow", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }, tSub);
tl.to(".subbtn", { scale: 1.06, duration: 0.25, ease: "power2.out" }, tSub + 0.5);
tl.to(".subbtn", { scale: 1, duration: 0.3, ease: "power2.inOut" }, tSub + 0.78);

HF.register("lab-outro", tl);
