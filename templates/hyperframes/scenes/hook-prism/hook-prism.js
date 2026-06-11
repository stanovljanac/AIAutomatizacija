/* hook-prism — bold cinematic hero hook logic (16:9 + 9:16, one file).
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *
 * Duration derivation (the contract's load-bearing line, identical to hook-kinetic):
 * the renderer takes the composition duration from the IN-PAGE root attribute
 * (window.__hf.duration probe), computes totalFrames = ceil(duration * fps). We set
 *   data-duration = (durationFrames - 0.5) / fps
 * which ceils to EXACTLY durationFrames for any integer frame count — immune to
 * float epsilon (a naive durationFrames/fps can ceil one frame high).
 *
 * Determinism: NO Math.random / Date.now / performance.now affects output. The HTML
 * is driven by one paused, seek-driven GSAP timeline. The Three.js layer renders
 * ONLY in response to HyperFrames' `hf-seek` event (and the initial __hfThreeTime),
 * never from a free-running animation loop, and every "random" value comes from a
 * seeded mulberry32 PRNG (constant seed) so each frame is byte-reproducible.
 */

// ── 1. Resolve variables (same as hook-kinetic). getVariables() merges declared
//      defaults + --variables-file; plain-browser fallback reads declared defaults. ──
function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") {
    return window.__hyperframes.getVariables();
  }
  var out = {};
  try {
    var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
    for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default;
  } catch (e) {}
  if (window.__hfVariables && typeof window.__hfVariables === "object") Object.assign(out, window.__hfVariables);
  return out;
}
var V = readVars();
var fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
var W = Number(V.width) > 0 ? Number(V.width) : 1920;
var H = Number(V.height) > 0 ? Number(V.height) : 1080;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 189;
// The visual clock: exactly FRAMES frames of content.
var D = FRAMES / fps;
var props = V.props && typeof V.props === "object" ? V.props : {};
var title = typeof props.title === "string" && props.title.trim() ? props.title.trim() : "Stop typing invoices by hand";
var kicker = typeof props.kicker === "string" && props.kicker.trim() ? props.kicker.trim() : "The Automation Desk";
var accentHex =
  typeof props.accent === "string" && /^#[0-9a-fA-F]{3,8}$/.test(props.accent) ? props.accent : "#4f8cff";
var beats = Array.isArray(V.revealsSeconds)
  ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; })
  : [];

// ── 2. Apply EXACT duration (and geometry) to the DOM before the capture engine
//      reads it (identical math to hook-kinetic). The OUTPUT canvas size is fixed
//      per entry file (static data-width/height); these keep runtime layout in sync. ──
var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
var IS_PORTRAIT = H > W;
if (IS_PORTRAIT) root.classList.add("portrait");
// fluid unit: 1.0 at 1920x1080 / 1080x1920; scales typography to any canvas
document.documentElement.style.setProperty("--u", String(Math.min(W, H) / 1080));
document.documentElement.style.setProperty("--accent", accentHex);

// ── 3. Fill content: kicker + one span per title word ──
document.getElementById("kicker-text").textContent = kicker;
var titleEl = document.getElementById("title");
var words = title.split(/\s+/);
for (var wi = 0; wi < words.length; wi++) {
  var span = document.createElement("span");
  span.className = "word";
  span.id = "w-" + wi;
  span.textContent = words[wi];
  titleEl.appendChild(span);
}

// ── 4. Pacing: map words to start times (same scheme as hook-kinetic).
//      beats present -> beats are word-GROUP starts; beats empty -> one
//      auto-distributed run across the first ~60%. ──
var INTRO = 0.42; // first motion offset (never animate at t=0)
var WORD_DUR = 0.55;
var LAST_START_CAP = Math.max(INTRO, D - 1.1);

var groupStarts;
if (beats.length > 0) {
  groupStarts = beats
    .map(function (t) { return Math.min(Math.max(t, INTRO), LAST_START_CAP); })
    .filter(function (t, i, a) { return i === 0 || t > a[i - 1] + 0.12; });
  if (groupStarts.length === 0) groupStarts = [INTRO];
  if (groupStarts[0] > 1.5) groupStarts.unshift(INTRO);
} else {
  groupStarts = [INTRO];
}

var nGroups = Math.min(groupStarts.length, words.length);
var per = Math.floor(words.length / nGroups);
var rem = words.length % nGroups;
var wordStart = [];
var wordLead = [];
var w0 = 0;
for (var g = 0; g < nGroups; g++) {
  var count = per + (g < rem ? 1 : 0);
  var gEnd = g < nGroups - 1 ? groupStarts[g + 1] : LAST_START_CAP + WORD_DUR;
  var stagger = count > 1 ? Math.min(0.1, Math.max(0.04, (gEnd - groupStarts[g] - 0.2) / count)) : 0;
  if (beats.length === 0 && count > 1) {
    stagger = Math.min(0.14, Math.max(0.05, (Math.min(D * 0.6, LAST_START_CAP) - INTRO) / (count - 1)));
  }
  for (var k = 0; k < count; k++) {
    wordStart[w0 + k] = Math.min(groupStarts[g] + k * stagger, LAST_START_CAP);
    wordLead[w0 + k] = k === 0;
  }
  w0 += count;
}
var lastLand = wordStart[words.length - 1] + WORD_DUR;

// the moment the title is fully landed — the 3D shards converge here, and the
// background "settles" from rush to calm. Clamped inside the clip.
var CONVERGE = Math.min(Math.max(lastLand, INTRO + 0.6), D - 0.5);

// ── 5. GSAP timeline for the HTML (paused; the player/renderer seeks it) ──
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// a touch of parallax: the whole content block eases from 1.04 -> 1.00 (subtle,
// motivated by the 3D rush settling). The words themselves stay crisp.
tl.fromTo("#content", { scale: 1.04 }, { scale: 1, duration: D, ease: "none" }, 0);

// kicker: dash sweeps, label rises
tl.fromTo("#kicker-dash", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.out" }, 0.14);
tl.fromTo("#kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.16);

// words: rise + de-blur out of depth; group leads land with a snappier overshoot
for (var i2 = 0; i2 < words.length; i2++) {
  tl.fromTo(
    "#w-" + i2,
    { opacity: 0, y: "0.6em", scale: 0.94, filter: "blur(10px)" },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: wordLead[i2] ? 0.64 : WORD_DUR,
      ease: wordLead[i2] ? "back.out(1.6)" : "power3.out",
    },
    wordStart[i2]
  );
}

// accent rule draws once the line has landed
var ruleAt = Math.min(Math.max(lastLand - 0.22, INTRO + 0.4), D - 0.85);
tl.fromTo("#rule", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power4.inOut" }, ruleAt);

// beat pulses on the title block (the 3D layer handles its own beat flares).
// Skip beats <0.7s apart so tweens never overlap (same guard as hook-kinetic).
var lastPulse = -10;
for (var b = 0; b < beats.length; b++) {
  var t = beats[b];
  if (t < INTRO || t > D - 0.7 || t - lastPulse < 0.7) continue;
  lastPulse = t;
  tl.to(
    "#title-wrap",
    { keyframes: [{ scale: 1.014, duration: 0.12, ease: "power2.out" }, { scale: 1, duration: 0.34, ease: "power2.inOut" }] },
    t
  );
}

// NO exit animation — the master timeline owns the cut; last frame stays composed.
window.__timelines["hook-prism"] = tl;

/* ─────────────────────────────────────────────────────────────────────────────
   6. THE 3D LAYER (Three.js / WebGL) — the bold, cinematic background.
      Loaded as an ES module via dynamic import (URL from window.__THREE_URL, which
      make-entry.mjs rewrites for the generated entry). Renders ONLY on hf-seek, so
      every frame is reproducible from currentTime. WebGL is confirmed available in
      the headless render browser (chrome-headless-shell 131); TypeGPU/WebGPU was
      rejected because WebGPU is gated off in that headless build (would render black).
   ──────────────────────────────────────────────────────────────────────────── */

// seeded PRNG — constant seed => identical particle/shard layout every render.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// hex -> {r,g,b} 0..1 (small, dependency-free; accent may be #rgb or #rrggbb)
function hexToRgb(hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var n = parseInt(h.slice(0, 6), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// smoothstep + clamp helpers (deterministic, pure)
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function smoothstep(e0, e1, x) {
  var t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

var THREE_URL = window.__THREE_URL || "./vendor/three.module.min.js";

import(THREE_URL)
  .then(function (THREE) {
    initThree(THREE);
  })
  .catch(function (err) {
    // If the 3D layer fails for any reason, the HTML hook still renders on the dark
    // brand background (graceful degradation) — never a hard render failure.
    // eslint-disable-next-line no-console
    if (window.console && console.warn) console.warn("[hook-prism] 3D layer unavailable:", err);
  });

function initThree(THREE) {
  var canvas = document.getElementById("gl");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  // Pin size + pixel ratio for byte-stable video output (no devicePixelRatio).
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x05080c, 1);

  // beat flare envelope: a short bump centered on each revealsSeconds beat
  // (deterministic, pure fn of time). Declared before use by the frame fn.
  function beatPulse(time) {
    var v = 0;
    for (var bi = 0; bi < beats.length; bi++) {
      var dt = time - beats[bi];
      if (dt < 0 || dt > 0.55) continue;
      var env = dt < 0.07 ? dt / 0.07 : 1 - smoothstep(0.07, 0.55, dt);
      if (env > v) v = env;
    }
    return v;
  }

  var accent = hexToRgb(accentHex);
  var mint = hexToRgb("#22d3a7");
  var cAccent = new THREE.Color(accent.r, accent.g, accent.b);
  var cMint = new THREE.Color(mint.r, mint.g, mint.b);

  // ── 6a. AURORA SHADER BACKDROP (the bold scroll-stopper) ───────────────────────
  //   A full-screen plane rendered by an ORTHOGRAPHIC camera, filled by a custom
  //   fragment shader: flowing brand-colored plasma/aurora bands built from
  //   deterministic FBM (value noise) driven only by uTime. High-contrast, clearly
  //   3D-feeling energy, dark at the bottom so captions stay readable. No noise
  //   texture, no rAF, no randomness — same uTime always yields the same pixels. ──
  var bgScene = new THREE.Scene();
  var bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var bgUniforms = {
    uTime: { value: 0 },
    uAspect: { value: W / H },
    uAccent: { value: new THREE.Vector3(cAccent.r, cAccent.g, cAccent.b) },
    uMint: { value: new THREE.Vector3(cMint.r, cMint.g, cMint.b) },
    uIntensity: { value: 1.0 }, // dialed down as the scene settles
    uFlare: { value: 0.0 }, // beat flare
    uPortrait: { value: IS_PORTRAIT ? 1.0 : 0.0 },
  };
  var bgMat = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: [
      "varying vec2 vUv;",
      "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform float uTime, uAspect, uIntensity, uFlare, uPortrait;",
      "uniform vec3 uAccent, uMint;",
      // hash + value-noise + fbm (deterministic; no textures)
      "float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }",
      "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
      "  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));",
      "  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }",
      "float fbm(vec2 p){ float v=0.0, a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);",
      "  for(int i=0;i<5;i++){ v += a*noise(p); p = m*p; a *= 0.5; } return v; }",
      "void main(){",
      "  vec2 uv = vUv;",
      // centered, aspect-correct coords
      "  vec2 p = (uv - 0.5); p.x *= uAspect;",
      // domain-warped flowing field => aurora ribbons sweeping across
      "  float t = uTime;",
      "  vec2 q = vec2(fbm(p*1.6 + vec2(0.0, t*0.18)), fbm(p*1.6 + vec2(5.2, -t*0.15)));",
      "  float n = fbm(p*2.2 + q*1.8 + vec2(t*0.10, t*0.06));",
      // diagonal energy bands for a strong directional 'beam' read
      "  float bands = 0.5 + 0.5*sin((p.x*1.3 + p.y*0.7)*3.0 - t*1.1 + n*4.0);",
      "  float field = pow(clamp(n*1.15 + bands*0.35, 0.0, 1.0), 1.7);",
      // brand gradient: mint in the brighter cores, accent blue around them
      "  vec3 col = mix(uAccent*0.9, uMint, smoothstep(0.45, 0.95, field));",
      "  col += uAccent * pow(field, 3.0) * 0.6;", // hot accent cores
      "  col *= field * (1.7 * uIntensity);",
      // radial falloff: bright center, dark edges/bottom (caption-safe contrast)
      "  float vy = uv.y;",
      "  vec2 c = uv - vec2(0.5, mix(0.46, 0.42, uPortrait));",
      "  c.x *= uAspect;",
      "  float rad = 1.0 - smoothstep(0.15, 0.95, length(c));",
      "  col *= mix(0.25, 1.0, rad);",
      "  col *= mix(0.35, 1.0, smoothstep(0.0, 0.42, vy));", // darken the bottom caption band
      // beat flare lifts the whole field briefly
      "  col += (uAccent*0.4 + uMint*0.3) * uFlare * field * 0.9;",
      // deep brand-tinted base so it never goes pure black
      "  col += vec3(0.012, 0.02, 0.035);",
      "  gl_FragColor = vec4(col, 1.0);",
      "}",
    ].join("\n"),
  });
  var bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgQuad.frustumCulled = false;
  bgScene.add(bgQuad);

  // ── 6b. PERSPECTIVE SCENE (particle tunnel + converging shards) ────────────────
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080c, 0.05);
  var camera = new THREE.PerspectiveCamera(IS_PORTRAIT ? 74 : 60, W / H, 0.1, 260);
  camera.position.set(0, 0, 14);

  // glowing sprite texture for the particles (canvas radial gradient => soft bloom
  // dots instead of hard pixels). Built once, deterministically.
  function makeGlowTexture() {
    var c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    var ctx = c.getContext("2d");
    var grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grd.addColorStop(0.55, "rgba(255,255,255,0.25)");
    grd.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  var glowTex = makeGlowTexture();

  // PARTICLE TUNNEL — bright additive glow-sprites in a deep ring, rushing the camera.
  var rand = mulberry32(0x9e3779b9); // constant seed => identical layout every render
  var COUNT = IS_PORTRAIT ? 1100 : 1400;
  var TUNNEL_DEPTH = 180;
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var baseZ = new Float32Array(COUNT);
  var radii = new Float32Array(COUNT);
  var angles = new Float32Array(COUNT);
  for (var p = 0; p < COUNT; p++) {
    var ang = rand() * Math.PI * 2;
    // bias outward so the center stays clear for the title (ring/tunnel feel)
    var rr = (IS_PORTRAIT ? 4.0 : 5.5) + Math.pow(rand(), 0.5) * (IS_PORTRAIT ? 18 : 26);
    angles[p] = ang;
    radii[p] = rr;
    baseZ[p] = rand();
    var mixc = rand();
    var col = cAccent.clone().lerp(cMint, mixc * 0.9);
    if (rand() > 0.88) col = new THREE.Color(0.85, 0.95, 1.0); // hot white sparks
    // boost so additive blending reads bright
    colors[p * 3] = Math.min(1, col.r * 1.5);
    colors[p * 3 + 1] = Math.min(1, col.g * 1.5);
    colors[p * 3 + 2] = Math.min(1, col.b * 1.5);
    positions[p * 3] = Math.cos(ang) * rr;
    positions[p * 3 + 1] = Math.sin(ang) * rr;
    positions[p * 3 + 2] = -TUNNEL_DEPTH * baseZ[p];
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  var pMat = new THREE.PointsMaterial({
    size: IS_PORTRAIT ? 1.1 : 1.3,
    map: glowTex,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  var points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // GLASS SHARDS — a ring of metallic icosahedra that start deep + scattered and
  // CONVERGE toward the title plane, catching brand light, flaring on beats.
  // Positions are a PURE fn of time + seed (no accumulated state) => seek-exact.
  var SHARDS = IS_PORTRAIT ? 13 : 16;
  var shardMeshes = [];
  var shardSeed = [];
  var rand2 = mulberry32(0x1234abcd); // separate constant stream
  var shardGeo = new THREE.IcosahedronGeometry(IS_PORTRAIT ? 0.62 : 0.78, 0);
  for (var s = 0; s < SHARDS; s++) {
    var hot = rand2() > 0.5;
    var mat = new THREE.MeshStandardMaterial({
      color: hot ? cAccent : cMint,
      metalness: 0.9,
      roughness: 0.16,
      transparent: true,
      opacity: 0.95,
      emissive: hot ? cAccent : cMint,
      emissiveIntensity: 0.6,
      flatShading: true,
    });
    var m = new THREE.Mesh(shardGeo, mat);
    scene.add(m);
    shardMeshes.push(m);
    // settle the constellation toward the UPPER half so it never crowds the bottom
    // caption band; spread wide horizontally to frame the title.
    shardSeed.push({
      ang: (s / SHARDS) * Math.PI * 2 + rand2() * 0.5,
      startRad: (IS_PORTRAIT ? 10 : 15) + rand2() * 7,
      startZ: -55 - rand2() * 60,
      spin: 0.6 + rand2() * 1.8,
      spinAxis: rand2(),
      hot: hot,
      fx: (rand2() - 0.5) * (IS_PORTRAIT ? 7 : 13),
      // bias final Y upward (positive) so shards sit around/above the title line
      fy: (IS_PORTRAIT ? 4.5 : 3.0) + (rand2() - 0.3) * (IS_PORTRAIT ? 6 : 4.5),
    });
  }

  // dramatic lighting for the shards: bright key + brand rim + cool fill
  var key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(-6, 9, 11);
  scene.add(key);
  var rim = new THREE.DirectionalLight(cAccent.getHex(), 3.0);
  rim.position.set(9, -3, 5);
  scene.add(rim);
  var rim2 = new THREE.DirectionalLight(cMint.getHex(), 1.8);
  rim2.position.set(-8, -5, 7);
  scene.add(rim2);
  scene.add(new THREE.AmbientLight(0x1b2a3a, 1.6));

  // ── 6c. The deterministic frame function: ALL state is a PURE function of time. ──
  function renderAt(time) {
    var t = clamp01(time / D);
    var settle = smoothstep(0, clamp01(CONVERGE / D), t); // 0 start -> 1 at converge
    var flare = beatPulse(time);

    // --- aurora backdrop ---
    bgUniforms.uTime.value = time;
    bgUniforms.uIntensity.value = 1.15 - 0.4 * settle; // calm slightly as words land
    bgUniforms.uFlare.value = flare;
    renderer.autoClear = true;
    renderer.render(bgScene, bgCam);

    // --- particle tunnel (rush -> settle), drawn over the aurora ---
    // monotonic eased distance: fast early, easing down toward converge (deterministic)
    var travelled = 34 * time - 0.6 * 34 * (time * 0.5 * smoothstep(0, CONVERGE, time));
    for (var pi = 0; pi < COUNT; pi++) {
      var z0 = -TUNNEL_DEPTH * baseZ[pi];
      var z = (z0 + travelled) % TUNNEL_DEPTH;
      if (z > 0) z -= TUNNEL_DEPTH;
      var a = angles[pi] + travelled * 0.004 * (1 - 0.7 * settle);
      var r = radii[pi];
      positions[pi * 3] = Math.cos(a) * r;
      positions[pi * 3 + 1] = Math.sin(a) * r;
      positions[pi * 3 + 2] = z;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 1.0 - 0.45 * settle; // fade so the words own the final frame

    // --- converging shards ---
    var conv = smoothstep(0.0, CONVERGE, time);
    for (var si = 0; si < SHARDS; si++) {
      var sd = shardSeed[si];
      var m2 = shardMeshes[si];
      var rad = sd.startRad * (1 - conv);
      var px = Math.cos(sd.ang) * rad + sd.fx * conv;
      var py = Math.sin(sd.ang) * rad + sd.fy * conv;
      var pz = sd.startZ * (1 - conv) + 2.0 * conv;
      m2.position.set(px, py, pz);
      var sp = time * sd.spin;
      m2.rotation.set(sp * 0.7, sp, sp * 0.5 * (sd.spinAxis + 0.3));
      m2.material.opacity = 0.95 * smoothstep(0.03, 0.5, conv);
      m2.material.emissiveIntensity = 0.5 + flare * 1.6;
      var sc = (1.0 - 0.2 * smoothstep(CONVERGE, D, time)) * (0.6 + 0.4 * smoothstep(0.05, 0.6, conv));
      m2.scale.setScalar(sc);
    }

    // subtle dolly that eases to rest (motivated by the rush settling)
    camera.position.z = 14 - 2.2 * settle;
    camera.position.x = Math.sin(time * 0.25) * 0.4 * (1 - settle);
    camera.lookAt(0, IS_PORTRAIT ? 2.0 : 1.2, 0);

    renderer.autoClear = false; // keep the aurora; draw perspective scene on top
    renderer.render(scene, camera);
    renderer.autoClear = true;
  }

  // SEEK WIRING (non-negotiable): render exactly the seeked time. The adapter sets
  // window.__hfThreeTime and dispatches `hf-seek` with detail.time on every seek.
  window.addEventListener("hf-seek", function (e) {
    renderAt(e && e.detail && typeof e.detail.time === "number" ? e.detail.time : 0);
  });
  // initial paint (covers the first frame before any seek fires)
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
}
