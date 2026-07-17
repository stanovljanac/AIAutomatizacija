/* fp-ping-flip — GSAP timeline for 017 s1 HOOK HERO. A radar beam sweeps a flat webpage; raw
 * "changed" pings stack gold-on-black, FREEZE + desaturate to a gray wall, then funnel into a
 * single gold AGENT node that keeps exactly ONE ping and flicks the rest away. Silent,
 * deterministic, seek-driven. Flat, face-on, no 3D tilt (MOTION_SPEC §5).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "fp-ping-flip", width: 1080, height: 1920, frames: 302, beatLo: 0.02, beatHi: 0.4 });
var fps = S.fps, W = S.W, H = S.H, D = S.D, U = S.U, props = S.props, beats = S.beats, root = S.root, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "everyone thinks an AI agent just watches a page" (sweep + ping swarm)
// [1] "that's a scraper — not an agent" (FREEZE + gray wall) [2] "an agent decides which change matters" (funnel + the ONE)
var tSwarm = beatAt(0, 0.0);
var tFreeze = Math.max(beatAt(1, 0.47), tSwarm + 1.6);
var tDecide = Math.max(beatAt(2, 0.71), tFreeze + 1.2);

var pings = Array.prototype.slice.call(document.querySelectorAll(".ping"));
var theOne = document.getElementById("theOne");
var chaff = pings.filter(function (p) { return p !== theOne; });

// deterministic per-ping resting jitter (flat Z only, <=3° — no 3D tilt)
var JIT = [-2.2, 1.6, -1.1, 2.4, -1.8, 0.9, 2.1, -2.6, 1.2, -0.7, 1.9, -1.4];
pings.forEach(function (p, i) { gsap.set(p, { rotation: JIT[i % JIT.length] }); });

// measure theOne's resting center NOW, before any translate/scale sets (rotation preserves the
// center) — GSAP callbacks don't fire on seek, so the dock target must be fixed at load.
var rootRect = root.getBoundingClientRect();
var mScale = W / (rootRect.width || W);
var oneR = theOne.getBoundingClientRect();
var oneDX = 0.5 * W - ((oneR.left - rootRect.left) + oneR.width / 2) * mScale;
var oneDY = 0.442 * H - ((oneR.top - rootRect.top) + oneR.height / 2) * mScale;

// deterministic flick-away scatter for the chaff — [dx(px@u), dy]
var FLICK = [
  [-420, -160], [430, -220], [-460, 60], [470, 140], [-380, 260],
  [420, 320], [-330, -300], [360, -80], [-470, 180], [450, -320], [-400, 380],
];

// ── resting state ──
gsap.set(".page", { opacity: 0, y: -46 * U });
gsap.set(pings, { opacity: 0, scale: 0.6, y: 26 * U });
gsap.set("#agent", { opacity: 0, scale: 0.55 });
gsap.set("#flash", { opacity: 0 });
gsap.set("#anchor", { opacity: 0, y: 18 * U });
gsap.set("#sweep", { x: 0, opacity: 0 });

var tl = gsap.timeline({ paused: true });

// ── beat 0 — the scraper POV: page in, radar sweeps, pings hammer out ──
tl.to(".page", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tSwarm);
// two fast radar passes across the page (kinetic from second 0)
var pageW = 0.82 * W;
tl.fromTo("#sweep", { x: -140 * U, opacity: 1 }, { x: pageW, duration: 0.9, ease: "power1.inOut" }, tSwarm + 0.15);
tl.set("#sweep", { x: -140 * U }, tSwarm + 1.1);
tl.to("#sweep", { x: pageW, duration: 0.9, ease: "power1.inOut" }, tSwarm + 1.15);
tl.to("#sweep", { opacity: 0, duration: 0.2 }, tSwarm + 2.1);
// the ping swarm stacks — dumb and relentless (fast stagger, machine-gun feel)
var swarmSpan = cl(tFreeze - tSwarm - 0.7, 1.6, 3.6);
tl.to(pings, { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: swarmSpan / pings.length, ease: "back.out(2.2)" }, tSwarm + 0.55);
// the glow breathes under the swarm
tl.to("#glow", { opacity: 1, scale: 1.06, duration: 1.2, yoyo: true, repeat: 2, ease: "sine.inOut" }, tSwarm + 0.5);

// ── beat 1 — FREEZE: the swarm desaturates to a worthless gray wall ──
tl.to(pings, { filter: "grayscale(1) brightness(0.55)", duration: 0.4, ease: "power2.out", stagger: 0.012 }, tFreeze);
tl.to(".page", { filter: "grayscale(1) brightness(0.6)", duration: 0.4, ease: "power2.out" }, tFreeze);
tl.to("#glow", { opacity: 0.25, duration: 0.4 }, tFreeze);

// ── beat 2 — the AGENT node: funnel the chaff in, keep exactly ONE ──
var K = tDecide;
tl.fromTo("#agent", { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, K);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.4, duration: 0.07, ease: "power4.in" }, K);
tl.to("#flash", { opacity: 0, duration: 0.3, ease: "power2.out" }, K + 0.09);
// chaff pings flick away off-frame (rejected), staggered
chaff.forEach(function (p, i) {
  var f = FLICK[i % FLICK.length];
  tl.to(p, { x: f[0] * U, y: f[1] * U, opacity: 0, scale: 0.7, duration: 0.5, ease: "power3.in" }, K + 0.12 + i * 0.03);
});
// the ONE that matters re-ignites gold and docks just above the agent node
// (dock target oneDX/oneDY was measured at load, before the resting-state sets)
tl.to(theOne, { filter: "grayscale(0) brightness(1)", duration: 0.25, ease: "power2.out" }, K + 0.25);
tl.to(theOne, {
  x: oneDX, y: oneDY,
  scale: 1.22, rotation: 0, duration: 0.55, ease: "power3.inOut",
  boxShadow: "0 0 " + (46 * U) + "px rgba(255,176,32,0.65)",
}, K + 0.3);
// the iris pulses as it "decides"
tl.to(".a-iris", { attr: { r: 14 }, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, K + 0.35);
// the page recedes — the point is no longer the page, it's the judgment
tl.to(".page", { opacity: 0.35, y: -20 * U, duration: 0.5, ease: "power2.inOut" }, K + 0.3);

// anchor pill + a whisper of push-in while the flip holds
tl.to("#anchor", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, K + 0.7);
tl.to("#camera", { scale: 1.05, duration: cl(D - K, 1.0, 3.0), ease: "power1.inOut" }, K);

HF.register("fp-ping-flip", tl);
