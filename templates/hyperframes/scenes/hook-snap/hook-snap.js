/* hook-snap — GSAP timeline for 013 s1. Pristine gold pipeline glides a card → GLITCH +
 * camera shake/punch on "crashed" → card shatters into CSS-3D shards → freeze + gold stamp
 * → slow dolly-in under the thesis line. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") return window.__hyperframes.getVariables();
  var out = {};
  try { var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]"); for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default; } catch (e) {}
  if (window.__hfVariables && typeof window.__hfVariables === "object") Object.assign(out, window.__hfVariables);
  return out;
}
var V = readVars();
var fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
var W = Number(V.width) > 0 ? Number(V.width) : 1080;
var H = Number(V.height) > 0 ? Number(V.height) : 1920;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 245;
var D = FRAMES / fps;
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.05, D - 0.4); }
// sentence beats (round-2, thesis-first): [0] "…isn't the one that crashes", [1] "keeps going",
// [2] "Mine crashed" → the crash, [3] "Best thing it ever did" → stamp.
var tTh1 = beatAt(0, 0.0);
var tTh2 = Math.max(beatAt(1, 0.4), tTh1 + 0.6);
var tCrash = Math.max(beatAt(2, 0.66), tTh2 + 0.8);
var tStamp = Math.max(beatAt(3, 0.86), tCrash + 1.0);

// ── build the 12 shards (deterministic layout table, no PRNG) ────────────────────
// each: [clip polygon, dx(px@u), dy, rotX, rotY, rotZ, z(px@u)]
var SHARDS = [
  ["polygon(0% 0%, 38% 0%, 26% 32%, 0% 24%)",        -300, -240, -62,  40, -38, 240],
  ["polygon(38% 0%, 72% 0%, 60% 26%, 26% 32%)",       -60, -320,  55, -30,  24, 180],
  ["polygon(72% 0%, 100% 0%, 100% 30%, 60% 26%)",     280, -260, -45, -55,  40, 300],
  ["polygon(0% 24%, 26% 32%, 18% 60%, 0% 55%)",      -360,  -40,  30,  62, -26, 150],
  ["polygon(26% 32%, 60% 26%, 52% 55%, 18% 60%)",     -90,  -60, -70,  28,  16, 340],
  ["polygon(60% 26%, 100% 30%, 100% 58%, 52% 55%)",   330,  -80,  40, -48, -30, 200],
  ["polygon(0% 55%, 18% 60%, 12% 84%, 0% 80%)",      -320,  180, -34, -40,  44, 160],
  ["polygon(18% 60%, 52% 55%, 46% 82%, 12% 84%)",     -40,  240,  58,  36, -20, 280],
  ["polygon(52% 55%, 100% 58%, 100% 82%, 46% 82%)",   300,  200, -52, -26,  34, 220],
  ["polygon(0% 80%, 12% 84%, 8% 100%, 0% 100%)",     -240,  330,  26,  50, -40, 120],
  ["polygon(12% 84%, 46% 82%, 40% 100%, 8% 100%)",    -20,  360, -44, -34,  22, 260],
  ["polygon(46% 82%, 100% 82%, 100% 100%, 40% 100%)", 260,  320,  62,  30, -28, 180],
];
var shardsBox = document.getElementById("shards");
for (var si = 0; si < SHARDS.length; si++) {
  var d = document.createElement("div");
  d.className = "shard";
  d.style.clipPath = SHARDS[si][0];
  shardsBox.appendChild(d);
}

// ── sparks (deterministic table) ─────────────────────────────────────────────────
var SPARKS = [[46, 44], [55, 40], [38, 47], [62, 46], [50, 52], [42, 38], [58, 55], [34, 42]];
var sparksBox = document.getElementById("sparks");
for (var pi = 0; pi < SPARKS.length; pi++) {
  var s = document.createElement("div");
  s.className = "spark";
  s.style.left = SPARKS[pi][0] + "%";
  s.style.top = SPARKS[pi][1] + "%";
  sparksBox.appendChild(s);
}

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// phase 0 — pristine glide: the card slides in from the right toward center; stations pass
tl.fromTo("#card", { x: 430 * U, scale: 0.94 }, { x: 0, scale: 1, duration: 2.0, ease: "power2.inOut" }, 0.02);
tl.from(".station", { opacity: 0, y: -30 * U, duration: 0.5, stagger: 0.1, ease: "power3.out" }, 0.05);
tl.from("#beltline", { scaleX: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "power3.out" }, 0.05);
// the pristine machine KEEPS GLIDING through the calm — the visual pun on the thesis line
tl.to("#card", { x: 16 * U, duration: cl(tCrash - 2.2, 0.8, 3.6), ease: "sine.inOut" }, 2.2);

// thesis-first kinetic type — the reversal IS the hook (beats 0–1), delivered before the crash
tl.fromTo("#th1", { opacity: 0, y: 30 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tTh1);
tl.fromTo("#th2", { opacity: 0, y: 34 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, tTh2);

// phase 1 — THE CRASH (camera shake + punch, RGB split, shatter)
var K = tCrash;
tl.to("#camera", { scale: 1.12, duration: 0.18, ease: "power4.in" }, K - 0.05);
tl.to("#camera", {
  keyframes: [
    { x: -16 * U, y: 9 * U, rotation: -0.7, duration: 0.05 },
    { x: 13 * U, y: -7 * U, rotation: 0.6, duration: 0.05 },
    { x: -9 * U, y: 5 * U, rotation: -0.4, duration: 0.05 },
    { x: 6 * U, y: -4 * U, rotation: 0.25, duration: 0.05 },
    { x: 0, y: 0, rotation: 0, duration: 0.22, ease: "power2.out" },
  ],
}, K);
// RGB ghosts flicker (two offset clones blink around the card)
tl.fromTo("#ghostR", { opacity: 0, x: -10 * U }, { opacity: 0.9, x: -16 * U, duration: 0.06 }, K - 0.02);
tl.to("#ghostR", { opacity: 0, duration: 0.16 }, K + 0.1);
tl.fromTo("#ghostB", { opacity: 0, x: 10 * U }, { opacity: 0.9, x: 16 * U, duration: 0.06 }, K);
tl.to("#ghostB", { opacity: 0, duration: 0.14 }, K + 0.12);
// impact flash — the shatter must READ (one bright burst, then gone)
tl.fromTo("#flash", { opacity: 0 }, { opacity: 1, duration: 0.07, ease: "power4.in" }, K - 0.02);
tl.to("#flash", { opacity: 0, duration: 0.4, ease: "power2.out" }, K + 0.06);
// red emergency wash pulses in and stays faint
tl.fromTo("#redwash", { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "power3.in" }, K);
tl.to("#redwash", { opacity: 0.4, duration: 0.5, ease: "power2.out" }, K + 0.12);
// the card is replaced by its shards
tl.to("#card", { opacity: 0, duration: 0.05 }, K + 0.02);
var shardEls = shardsBox.children;
for (var i = 0; i < shardEls.length; i++) {
  var S = SHARDS[i];
  tl.fromTo(shardEls[i],
    { opacity: 1, x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: S[1] * U, y: S[2] * U, z: S[6] * U, rotationX: S[3], rotationY: S[4], rotationZ: S[5],
      duration: 1.05, ease: "power3.out" },
    K + 0.02);
}
// stations shudder + belt light dies
tl.to(".station", { y: 8 * U, duration: 0.12, ease: "power2.in" }, K);
tl.to(".station .arch", { borderColor: "rgba(255,92,92,0.5)", duration: 0.4 }, K + 0.1);
tl.to("#beltline", { opacity: 0.25, duration: 0.5 }, K + 0.1);
// sparks pop off the impact
for (var sp = 0; sp < SPARKS.length; sp++) {
  var el = sparksBox.children[sp];
  var ang = (sp / SPARKS.length) * Math.PI * 2;
  tl.fromTo(el, { opacity: 1, x: 0, y: 0, scale: 1 },
    { x: Math.cos(ang) * (120 + 30 * (sp % 3)) * U, y: Math.sin(ang) * (90 + 24 * (sp % 4)) * U - 40 * U,
      opacity: 0, scale: 0.4, duration: 0.7 + 0.06 * (sp % 3), ease: "power2.out" }, K + 0.05);
}
// camera releases the punch slowly (settle)
tl.to("#camera", { scale: 1.04, duration: 0.8, ease: "power2.out" }, K + 0.25);
// the thesis type is knocked + dimmed by the crash — it has done its job, the wreck owns the frame
tl.to("#thesis", { opacity: 0.22, y: -12 * U, duration: 0.28, ease: "power2.in" }, K);

// phase 2 — freeze + the gold stamp slams ("best thing it ever did")
tl.fromTo("#stamp", { opacity: 0, scale: 2.5, rotation: -7 }, { opacity: 1, scale: 1, rotation: -7, duration: 0.3, ease: "power4.in" }, tStamp);
tl.to("#stamp", { rotation: -5.4, duration: 0.32, ease: "back.out(2.2)" }, tStamp + 0.3);
tl.to("#redwash", { opacity: 0.18, duration: 0.6, ease: "power2.out" }, tStamp + 0.1);

// phase 3 — slow dolly-in on the wreck under the stamp (tail)
tl.to("#camera", { scale: 1.12, duration: cl(D - tStamp, 1.0, 4), ease: "power1.inOut" }, tStamp);
// shards keep a whisper of drift so the freeze never reads as a still
for (var j = 0; j < shardEls.length; j++) {
  tl.to(shardEls[j], { y: "+=" + (6 + (j % 4) * 3) * U, rotationZ: "+=" + ((j % 2 ? 1 : -1) * 2.5), duration: cl(D - tStamp, 1, 4.4), ease: "none" }, tStamp);
}

window.__timelines["hook-snap"] = tl;
