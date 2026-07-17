/* verdict-not-trusted — GSAP timeline for 012 s02. Question → WORKS slam → NOT TRUSTED rotate-slam
 * → two gate glyphs rise. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stampA?, stampB? }
 */
var S = HF.scene({ id: "verdict-not-trusted", width: 1920, height: 1080, frames: 600, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

if (props.stampA) document.getElementById("stampWorks").textContent = String(props.stampA).trim();
if (props.stampB) document.getElementById("stampTrust").textContent = String(props.stampB).trim().replace(/\s+/g, " ");

// 4 sentence beats
var tQ = beatAt(0, 0.03);
var tWorks = Math.max(beatAt(1, 0.24), tQ + 0.8);
var tTrust = Math.max(beatAt(2, 0.52), tWorks + 1.2);
var tGates = Math.max(beatAt(3, 0.76), tTrust + 1.2);

var tl = gsap.timeline({ paused: true });

// beat 0 — the question
tl.from("#question", { opacity: 0, y: 40 * U, duration: 0.55, ease: "power3.out" }, tQ);

// beat 1 — WORKS slams; the row of shipped episodes slides under it
tl.to("#question", { scale: 0.7, y: -105 * U, opacity: 0.55, duration: 0.5, ease: "power3.inOut" }, tWorks - 0.1);
tl.fromTo("#stampWorks", { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.34, ease: "power4.in" }, tWorks);
tl.fromTo("#ring", { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.6, duration: 0.7, ease: "power2.out" }, tWorks + 0.3);
tl.from(".ep", { opacity: 0, y: 34 * U, duration: 0.35, stagger: 0.08, ease: "back.out(1.8)" }, tWorks + 0.4);

// beat 2 — NOT TRUSTED rotate-slams over it; the question exits fully; the gold dims a notch
tl.to("#question", { opacity: 0, y: -170 * U, duration: 0.45, ease: "power2.in" }, tTrust);
tl.fromTo("#stampTrust", { opacity: 0, scale: 2.6, rotate: -8 }, { opacity: 1, scale: 1, rotate: -8, duration: 0.3, ease: "power4.in" }, tTrust);
tl.to("#stampWorks", { opacity: 0.5, duration: 0.4, ease: "power2.out" }, tTrust + 0.1);
tl.to("#stampTrust", { rotate: -6, duration: 0.35, ease: "back.out(2.5)" }, tTrust + 0.3);

// beat 3 — two gold gates rise; tagline underline sweeps on the stressed beat
tl.fromTo("#gateL", { opacity: 0, y: 90 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tGates);
tl.fromTo("#gateR", { opacity: 0, y: 90 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tGates + 0.12);
tl.from("#gateL .g-bar, #gateR .g-bar", { scaleY: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }, tGates + 0.3);
tl.to("#tagline", { opacity: 1, duration: 0.35, ease: "power2.out" }, tGates + 0.45);
tl.to("#rule", { scaleX: 1, duration: 0.5, ease: "power3.out" }, cl(tGates + 0.7, tGates + 0.5, D - 0.3));

HF.register("verdict-not-trusted", tl);
