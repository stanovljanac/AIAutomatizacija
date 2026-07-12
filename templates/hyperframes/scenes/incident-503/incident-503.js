/* incident-503 — GSAP timeline + seek-driven Three.js warning beacon for 013 s3.
 * Flat, face-on terminal (cards are NEVER 3D-tilted — mobile-first rule) → 503 cascade +
 * beacon light sweeps → three DOUBLING retries → smear-stop (camera zoom settles), gold
 * gate slams, one notification pings in.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 * Determinism: DOM = one paused GSAP timeline; WebGL renders ONLY on hf-seek and every
 * value is a pure function of the seeked time (closed-form spin-down after the halt).
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 456;
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
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function smoothstep(e0, e1, x) { var t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.05, D - 0.5); }
var tIntro = beatAt(0, 0.01);
var tCascade = Math.max(beatAt(1, 0.1), tIntro + 0.8);
var tRetry = Math.max(beatAt(2, 0.45), tCascade + 2.2);
var tHalt = Math.max(beatAt(3, 0.7), tRetry + 3.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — establish: the desk view of a healthy run (terminal flat and face-on)
tl.from("#term", { y: 90 * U, opacity: 0, duration: 0.6, ease: "power3.out" }, tIntro);
tl.from(".log.ok", { opacity: 0, x: -30 * U, duration: 0.35, stagger: 0.16, ease: "power3.out" }, tIntro + 0.25);
// slow camera drift so the dutch angle breathes
tl.fromTo("#camera", { scale: 1.02, x: 6 * U }, { scale: 1.06, x: -6 * U, duration: cl(tHalt - tIntro, 2, 11), ease: "sine.inOut" }, tIntro);

// beat 1 — the 503 cascade + big red stat + red wash pulses
var errAt = [tCascade, tCascade + 0.55, tCascade + 1.1];
var errs = [".log.err.e1", ".log.err.e2", ".log.err.e3"];
for (var ei = 0; ei < errs.length; ei++) {
  tl.fromTo(errs[ei], { opacity: 0, x: -26 * U, scale: 1.06 }, { opacity: 1, x: 0, scale: 1, duration: 0.22, ease: "power4.out" }, errAt[ei]);
  tl.to("#term", { x: (ei % 2 ? -7 : 7) * U, duration: 0.05, yoyo: true, repeat: 1 }, errAt[ei]);
}
tl.fromTo("#bigstat", { opacity: 0, scale: 1.6, y: -20 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power4.in" }, tCascade + 0.3);
tl.fromTo("#redwash", { opacity: 0 }, { opacity: 0.85, duration: 0.4, ease: "power2.in" }, tCascade);
tl.to("#redwash", { opacity: 0.35, duration: 0.8, ease: "power2.out" }, tCascade + 0.5);
// the red world keeps breathing until the halt (two slow pulses)
tl.to("#redwash", { opacity: 0.6, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: 2 }, tCascade + 1.4);

// beat 2 — three retries, wait bars DOUBLING (2s → 4s → 8s compressed to screen-time)
var rAt = [tRetry, tRetry + 1.0, tRetry + 2.15];
var rFill = [0.4, 0.75, 1.35]; // fill durations grow — the doubling is visible
for (var ri = 0; ri < 3; ri++) {
  var row = ".retry.r" + (ri + 1);
  tl.fromTo(row, { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }, rAt[ri]);
  tl.fromTo(".r-fill.f" + (ri + 1), { scaleX: 0 }, { scaleX: 1, duration: rFill[ri], ease: "power1.inOut" }, rAt[ri] + 0.2);
  tl.fromTo(".r-x.x" + (ri + 1), { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power4.in" }, rAt[ri] + 0.25 + rFill[ri]);
}

// beat 3 — SMEAR-STOP: the camera drift settles + the gate slams + the one message
tl.to("#camera", { scale: 1.0, x: 0, duration: 0.55, ease: "power3.inOut" }, tHalt);
tl.to("#redwash", { opacity: 0.12, duration: 0.5, ease: "power2.out" }, tHalt);
tl.to("#bigstat", { opacity: 0.35, y: -12 * U, duration: 0.45 }, tHalt);
tl.to("#term", { opacity: 0.5, y: 26 * U, duration: 0.5, ease: "power2.inOut" }, tHalt + 0.1);
tl.fromTo(".post", { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.4, transformOrigin: "50% 0%", stagger: 0.08, ease: "power3.out" }, tHalt + 0.3);
tl.fromTo("#gatebar", { opacity: 0, y: -260 * U }, { opacity: 1, y: 0, duration: 0.32, ease: "power4.in" }, tHalt + 0.45);
tl.to("#gatebar", { y: -10 * U, duration: 0.22, ease: "back.out(3)" }, tHalt + 0.77);
// the message — the actual point of the whole scene
tl.fromTo("#notify", { opacity: 0, y: -140 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, tHalt + 1.15);
tl.to("#notify", { boxShadow: "0 24px 70px rgba(0,0,0,0.7), 0 0 70px rgba(255,176,32,0.4)", duration: 0.6, yoyo: true, repeat: 2, ease: "sine.inOut" }, tHalt + 1.7);

window.__timelines["incident-503"] = tl;

/* ── the Three.js WARNING BEACON (renders only on hf-seek; pure fn of time) ───────── */
var THREE_URL = window.__THREE_URL || "./vendor/three.module.min.js";
import(THREE_URL).then(function (THREE) { initThree(THREE); }).catch(function (err) {
  if (window.console && console.warn) console.warn("[incident-503] 3D layer unavailable:", err);
});

function initThree(THREE) {
  var canvas = document.getElementById("gl");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0); // transparent — the CSS world shows through

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  // beacon: emissive core + two opposed light cones on a spinning head + halo sprite
  var group = new THREE.Group();
  var BX = 1.38, BY = H > W ? 2.62 : 1.55; // upper-right, above the terminal edge
  group.position.set(BX, BY, 0);
  scene.add(group);

  var base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 0.28, 24),
    new THREE.MeshBasicMaterial({ color: 0x2a2f38 })
  );
  base.position.y = -0.26;
  group.add(base);

  var core = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff5c5c, transparent: true, opacity: 0.95 })
  );
  group.add(core);

  var halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(halo);

  var head = new THREE.Group();
  group.add(head);
  function beam() {
    var geo = new THREE.ConeGeometry(0.55, 3.0, 26, 1, true);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    var m = new THREE.Mesh(geo, mat);
    m.position.x = 1.5; // cone tip at the core, spreading outward
    m.rotation.z = Math.PI / 2;
    return m;
  }
  var b1 = beam(); var b2 = beam();
  b2.rotation.y = Math.PI; b2.position.x = -1.5;
  head.add(b1); head.add(b2);

  var OMEGA = 2.4; // rad/s spin while the incident is live
  var TAU = 0.55;  // spin-down time constant after the halt

  // closed-form angle: spins from tCascade, exponentially freezes after tHalt
  function angleAt(t) {
    if (t <= tCascade) return 0;
    if (t <= tHalt) return OMEGA * (t - tCascade);
    return OMEGA * (tHalt - tCascade) + OMEGA * TAU * (1 - Math.exp(-(t - tHalt) / TAU));
  }

  function renderAt(time) {
    var rise = smoothstep(tCascade, tCascade + 0.7, time);
    var dim = 1 - 0.75 * smoothstep(tHalt, tHalt + 0.9, time);
    group.position.y = BY - (1 - rise) * 1.1;
    group.visible = rise > 0.001;
    head.rotation.y = angleAt(time);
    var flicker = 0.75 + 0.25 * Math.sin(time * 9.3); // deterministic pulse
    b1.material.opacity = 0.34 * rise * dim * flicker;
    b2.material.opacity = 0.34 * rise * dim * flicker;
    core.material.opacity = (0.55 + 0.45 * flicker) * rise * (0.35 + 0.65 * dim);
    halo.material.opacity = 0.28 * rise * dim * flicker;
    core.scale.setScalar(1 + 0.1 * flicker * dim);
    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", function (e) {
    renderAt(e && e.detail && typeof e.detail.time === "number" ? e.detail.time : 0);
  });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
}
