/* wh-doomfeed — GSAP timeline for 014 s1 HOOK HERO. A doomscroll feed of generic AI-hype
 * headlines streams up (red anxiety pulse underneath) → FREEZES on a gold Enter press →
 * the doom-wall SHATTERS into transient 3D shards (each headline card flies off) and clears
 * to calm black → a gold stamp SLAMS "NOT THE JOB — THE HOUR." Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "wh-doomfeed", width: 1080, height: 1920, frames: 290, beatLo: 0.02, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "AI is coming for my job" (feed streams) [1] "So last week, I let it try" (freeze+enter)
// [2] "It didn't take my job" (shatter/clear) [3] "the one hour I've always hated" (reframe stamp)
var tFeed = beatAt(0, 0.0);
var tFreeze = Math.max(beatAt(1, 0.42), tFeed + 1.4);
var tShatter = Math.max(beatAt(2, 0.60), tFreeze + 1.0);
var tStamp = Math.max(beatAt(3, 0.78), tShatter + 1.0);

var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
// deterministic shatter scatter per card — [dx(px@u), dy, rotX, rotY, rotZ, z]
var SCATTER = [
  [-150, -260, -46,  34, -22, 260],
  [ 170, -150,  40, -40,  18, 200],
  [-110,  190, -32,  44,  26, 320],
  [ 160,  260,  50, -26, -20, 180],
  [-180,  40, -28, -36,  30, 240],
  [ 120, -300,  44,  30, -24, 300],
  [-90,   300, -50,  26,  22, 150],
];

// perspective + 3D context for the shatter (set here so the CSS stays layout-only)
gsap.set(".feedmask", { perspective: 1300 * U });
gsap.set("#feed", { transformStyle: "preserve-3d" });

// ── resting state ──
gsap.set(cards, { opacity: 0, y: 40 * U });
gsap.set("#feed", { y: 120 * U });
gsap.set("#redpulse", { opacity: 0, scale: 0.9 });
gsap.set("#enter", { opacity: 0, scale: 0.8 });
gsap.set("#shockwave", { opacity: 0, scale: 0.4 });
gsap.set("#flash", { opacity: 0 });
gsap.set("#stamp", { opacity: 0, scale: 2.4, rotation: -4 });
gsap.set("#anchor", { opacity: 0, y: 16 * U });

var tl = gsap.timeline({ paused: true });

// ── beat 0 — the doom feed streams up (the viewer's own scroll) ──
tl.to("#redpulse", { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, tFeed);
tl.to("#redpulse", { opacity: 0.7, scale: 1.06, duration: 1.4, yoyo: true, repeat: 4, ease: "sine.inOut" }, tFeed + 0.6);
// cards fade in with a fast stagger as the column scrolls upward (doomscroll feel)
tl.to(cards, { opacity: 1, y: 0, duration: 0.4, stagger: 0.14, ease: "power2.out" }, tFeed + 0.1);
var scrollDur = cl(tFreeze - tFeed - 0.2, 1.0, 4.2);
tl.to("#feed", { y: -560 * U, duration: scrollDur, ease: "none" }, tFeed + 0.2);

// ── beat 1 — FREEZE + the Enter press punches through ──
tl.to("#feed", { y: "-=0", duration: 0.001 }, tFreeze); // scroll holds (the to above ends at tFreeze)
tl.to(cards, { filter: "brightness(0.72)", duration: 0.3, ease: "power2.out" }, tFreeze);
tl.fromTo("#enter", { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1.0, duration: 0.22, ease: "power3.out" }, tFreeze);
tl.to("#enter", { scale: 0.9, duration: 0.12, ease: "power3.in" }, tFreeze + 0.34); // the press
tl.to("#enter", { scale: 1.0, duration: 0.16, ease: "back.out(2.4)" }, tFreeze + 0.46);
tl.fromTo("#shockwave", { opacity: 0.85, scale: 0.4 }, { opacity: 0, scale: 2.6, duration: 0.6, ease: "power2.out" }, tFreeze + 0.34);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.5, duration: 0.08, ease: "power4.in" }, tFreeze + 0.36);
tl.to("#flash", { opacity: 0, duration: 0.3, ease: "power2.out" }, tFreeze + 0.46);

// ── beat 2 — the doom wall SHATTERS into 3D shards and clears to black ──
var K = tShatter;
tl.to("#enter", { opacity: 0, scale: 1.3, duration: 0.2, ease: "power2.in" }, K - 0.05);
// impact flash
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.07, ease: "power4.in" }, K - 0.02);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.out" }, K + 0.05);
// red anxiety wash flares then dies as the frame calms
tl.to("#redpulse", { opacity: 1.0, scale: 1.2, duration: 0.12, ease: "power3.in" }, K);
tl.to("#redpulse", { opacity: 0, duration: 0.7, ease: "power2.out" }, K + 0.18);
// each headline card flies off as a transient 3D shard, then fades — nothing rests tilted
cards.forEach(function (c, i) {
  var S = SCATTER[i % SCATTER.length];
  tl.to(c, { x: S[0] * U, y: "+=" + (S[1] * U), z: S[5] * U, rotationX: S[2], rotationY: S[3], rotationZ: S[4], opacity: 0, duration: 0.72, ease: "power3.out" }, K + i * 0.015);
});

// ── beat 3 — the gold reframe stamp SLAMS + the anchor pill ──
tl.to("#stamp", { opacity: 1, scale: 1.0, rotation: -2.2, duration: 0.3, ease: "power4.in" }, tStamp);
tl.to("#stamp", { rotation: -1.2, duration: 0.34, ease: "back.out(2.2)" }, tStamp + 0.3);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.45, duration: 0.06, ease: "power4.in" }, tStamp);
tl.to("#flash", { opacity: 0, duration: 0.34, ease: "power2.out" }, tStamp + 0.08);
tl.to("#anchor", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tStamp + 0.4);
// slow gold pulse + a whisper of push-in while it holds (screenshotable)
tl.to("#stamp .l2", { textShadow: "0 0 " + (72 * U) + "px rgba(255,176,32,0.75)", duration: 1.0, yoyo: true, repeat: 2, ease: "sine.inOut" }, tStamp + 0.6);
tl.to("#camera", { scale: 1.05, duration: cl(D - tStamp, 1.0, 3.0), ease: "power1.inOut" }, tStamp);

HF.register("wh-doomfeed", tl);
