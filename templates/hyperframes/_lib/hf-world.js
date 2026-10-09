/* hf-world.js — the shared 3D WORLD kit: everything a fully-3D video needs that a single test scene
 * does not. Built for 024 "frozen" (owner brief 2026-10-08: "every scene a dynamic 3D environment,
 * fast-paced full animation"), written to be reused by every 3D video after it.
 *
 * WHY A SECOND 3D FILE (hf-three.js stays as it is — the 023 scenes depend on it byte-for-byte):
 *   hf-three gives one scene depth-of-field and bloom. A whole video of 3D scenes needs more than
 *   that, and needs it IDENTICAL across nine scenes so the cut reads as one world:
 *     · an HDR pipeline (half-float, MSAA) with a real bloom chain, ACES, grade, vignette, grain
 *     · MOTION BLUR derived analytically from the camera path — the camera is a pure function of
 *       time, so the smear for frame t is camera(t) vs camera(t - 1/fps). No history buffer, so it
 *       stays deterministic under random seeking (the HF capture contract).
 *     · the spine objects as builders: the number LATTICE (the model's weights), CARDS (chat
 *       bubbles, pages, notes — real canvas type, physical thickness), PILES, BEAMS, SPARKS, DUST.
 *
 * Load order (classic scripts, like the rest of _lib):
 *   gsap.min.js → hf-scene.js → hf-three.js → hf-world.js → <scene>.js
 *
 * DETERMINISM: every builder is a pure function of the time you hand it. Randomness comes from
 * HF3.rng(seed) at BUILD time only. No rAF, no Date.now, no Math.random.
 */
(function (global) {
  "use strict";
  var HF3 = global.HF3;
  var clamp = HF3.clamp, span = HF3.span, mix = HF3.mix, rng = HF3.rng;

  /* ── eases ─────────────────────────────────────────────────────────────────── */
  var E = {
    lin: function (p) { return p; },
    in2: function (p) { return p * p; },
    out2: function (p) { return 1 - (1 - p) * (1 - p); },
    in3: function (p) { return p * p * p; },
    out3: function (p) { return 1 - Math.pow(1 - p, 3); },
    inOut: function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
    inOut5: function (p) { return p < 0.5 ? 16 * Math.pow(p, 5) : 1 - Math.pow(-2 * p + 2, 5) / 2; },
    out5: function (p) { return 1 - Math.pow(1 - p, 5); },
    outExpo: function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); },
    inExpo: function (p) { return p <= 0 ? 0 : Math.pow(2, 10 * p - 10); },
    sine: function (p) { return -(Math.cos(Math.PI * p) - 1) / 2; },
    outBack: function (p) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    outElastic: function (p) {
      if (p <= 0) return 0; if (p >= 1) return 1;
      return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
  };

  /** eased 0..1 progress of t across [a, b] */
  function ramp(t, a, b, ease) { return (ease || E.inOut)(span(t, a, b)); }

  /** a short 0→1→0 pulse peaking at `at` (attack a, decay d) — flashes, impacts */
  function pulse(t, at, a, d) {
    if (t < at - a || t > at + d) return 0;
    return t < at ? E.out2(span(t, at - a, at)) : 1 - E.out3(span(t, at, at + d));
  }

  /**
   * Keyed tween over numbers or arrays. keys: [{t, v, e}] sorted by t; `e` is the ease INTO that key,
   * or "cut" to jump at that key's time (hard cut inside a scene).
   */
  function keys(t, ks) {
    if (t <= ks[0].t) return copy(ks[0].v);
    for (var i = 1; i < ks.length; i++) {
      var k = ks[i];
      if (t < k.t) {
        var a = ks[i - 1];
        if (k.e === "cut") return copy(a.v);
        var ease = typeof k.e === "function" ? k.e : E[k.e || "inOut"];
        return lerp(a.v, k.v, ease(span(t, a.t, k.t)));
      }
    }
    return copy(ks[ks.length - 1].v);
  }
  function copy(v) { return Array.isArray(v) ? v.slice() : v; }
  function lerp(a, b, p) {
    if (!Array.isArray(a)) return a + (b - a) * p;
    var o = []; for (var i = 0; i < a.length; i++) o.push(a[i] + (b[i] - a[i]) * p); return o;
  }

  /** smooth deterministic 1D noise (sum of incommensurate sines), roughly -1..1 */
  function wob(t, seed) {
    var s = seed || 0;
    return (Math.sin(t * 1.13 + s * 3.1) * 0.5 + Math.sin(t * 2.71 + s * 1.7) * 0.3 + Math.sin(t * 5.17 + s * 5.3) * 0.2);
  }
  /** handheld camera life: a small vector of smooth noise */
  function shake(t, amp, freq, seed) {
    var f = freq || 1;
    return [wob(t * f, seed || 1) * amp, wob(t * f, (seed || 1) + 7) * amp, wob(t * f, (seed || 1) + 13) * amp * 0.5];
  }
  /** a decaying impact shake that starts at `at` */
  function kick(t, at, amp, dur) {
    if (t < at || t > at + (dur || 0.5)) return [0, 0, 0];
    var p = span(t, at, at + (dur || 0.5)), d = Math.pow(1 - p, 2) * amp;
    return [Math.sin(t * 34.0) * d, Math.cos(t * 29.0) * d, 0];
  }
  function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function orbit(center, r, yaw, pitch) {
    return [center[0] + Math.sin(yaw) * Math.cos(pitch) * r, center[1] + Math.sin(pitch) * r, center[2] + Math.cos(yaw) * Math.cos(pitch) * r];
  }

  /**
   * A shot list → a camera function. shots: [{ t, cam: function(p, t, d) → {pos, look, fov, roll} }]
   * sorted by t. Each shot runs from its t to the next shot's t (the last to `end`); `p` is the local
   * 0..1 progress, `d` the shot length. Returns camFn(t) that also reports `shot` (index) so the
   * renderer knows a hard cut is not a whip and never smears across it.
   * o (optional) = { motion: HW.motion(...) budget, kick: function(t) → [x,y,z] impact offset at real time }.
   * Without o this is exactly the plain shot list it always was.
   */
  function shots(list, end, o) {
    function shotAt(t) { var i = 0; for (var k = 0; k < list.length; k++) if (t >= list[k].t) i = k; return i; }
    function evalShot(i, p) {
      var a = list[i].t, b = i + 1 < list.length ? list[i + 1].t : end;
      var d = Math.max(b - a, 1e-3);
      var s = list[i].cam(p, a + p * d, d);
      s.shot = i;
      return s;
    }
    var raw = function (t) {
      var i = shotAt(t);
      var a = list[i].t, b = i + 1 < list.length ? list[i + 1].t : end;
      var d = Math.max(b - a, 1e-3);
      var s = list[i].cam(clamp((t - a) / d, 0, 1), t, d);
      s.shot = i;
      return s;
    };
    var M = o && o.motion, kick = o && o.kick;
    if ((!M || M.identity) && !kick) return raw;
    if (!M || M.identity) return function (t) { var s = raw(t); s.pos = add3(s.pos, kick(t)); return s; };

    /* THE MOTION BUDGET on the camera (see motion() below). The camera path is split into RUNS — the
       stretches it moves through without a jump; a run ends at a hard cut. Inside a run:
         · TRAVEL × k about the run's END pose: the camera covers k of its path (velocity × k) and still
           lands on the framing the shot was composed for. Continuous inside the run; a cut needs none.
         · FOCUS windows slow the camera's own clock to focusScale (the key take holds still); the lag
           this builds resets at the next cut, so no later shot is ever delayed past its cut.
       Impact kicks (o.kick) are added at REAL time after that, × k, so a hit still lands on its word. */
    var k = M.k, runStart = null, anchors = {};
    function jump(A, B) {
      var dp = Math.hypot(A.pos[0] - B.pos[0], A.pos[1] - B.pos[1], A.pos[2] - B.pos[2]);
      var dl = Math.hypot(A.look[0] - B.look[0], A.look[1] - B.look[1], A.look[2] - B.look[2]);
      return dp + dl > 0.05 || Math.abs((A.fov || 0) - (B.fov || 0)) > 0.5;
    }
    function runs() {
      if (runStart) return;
      runStart = [];
      for (var i = 0, rs = 0; i < list.length; i++) {
        if (i > 0 && jump(evalShot(i - 1, 1), evalShot(i, 0))) rs = i;
        runStart[i] = rs;
      }
    }
    function runEnd(i) { var j = i; while (j + 1 < list.length && runStart[j + 1] === runStart[i]) j++; return j; }
    /* a run with a `keep: true` shot is STORY motion (the camera chasing the subject it frames) and is
       left exactly as authored — scaling it would slide the subject off its mark */
    function kept(i) { for (var j = runStart[i]; j <= runEnd(i); j++) if (list[j].keep) return true; return false; }
    function anchor(j) { return anchors[j] || (anchors[j] = evalShot(j, 1)); }
    function sc(a, v) { return a + k * (v - a); }
    return function (t) {
      runs();
      var i = shotAt(t), r0 = list[runStart[i]].t;
      if (kept(i)) { var sk = raw(t); if (kick) { var k0 = kick(t); sk.pos = [sk.pos[0] + k0[0] * k, sk.pos[1] + k0[1] * k, sk.pos[2] + k0[2] * k]; } return sk; }
      var s = raw(r0 + (M.slow(t) - M.slow(r0)));
      var an = anchor(runEnd(i));
      var out = {
        pos: [sc(an.pos[0], s.pos[0]), sc(an.pos[1], s.pos[1]), sc(an.pos[2], s.pos[2])],
        look: [sc(an.look[0], s.look[0]), sc(an.look[1], s.look[1]), sc(an.look[2], s.look[2])],
        fov: s.fov == null || an.fov == null ? s.fov : sc(an.fov, s.fov),
        roll: s.roll == null ? s.roll : sc(an.roll || 0, s.roll),
        focus: s.focus, shot: s.shot,
      };
      if (kick) { var kk = kick(t); out.pos = [out.pos[0] + kk[0] * k, out.pos[1] + kk[1] * k, out.pos[2] + kk[2] * k]; }
      return out;
    };
  }

  /* ── THE MOTION BUDGET ─────────────────────────────────────────────────────── */
  /**
   * One knob for HOW MUCH a scene moves, plus FOCUS windows where it settles so the key take is the
   * only thing on screen that moves (024 Short, 2026-10-09 — owner: "it is too much to focus on and
   * it's losing focus to the important stuff").
   *
   * @param {object} spec  { scale: 0.9, focus: [[t0, t1], ...] (scene-local s), focusScale: 0.35, ease: 0.4 }
   *   scale       camera travel AND the ambient clock (dust drift, tile twinkle, idle bobbing) × scale
   *   focus       key-take windows; inside one the camera clock and the ambient clock run at focusScale
   *   ease        seconds to settle into / out of a focus window (smoothstep edges, before t0 / after t1)
   * @param {number} D     scene length (the clocks are integrated over [0, D + 1])
   * @returns M { identity, k, focus(t) 0..1, slow(t) camera clock, amb(t) ambient clock, speed(t) }
   *   Absent spec (or scale 1 + no focus) → IDENTITY: every clock is t, so scenes that never pass a
   *   spec render exactly as before. Pass M to HW.create({ motion: M }) and HW.shots(list, D, { motion: M }).
   */
  var IDENTITY = { identity: true, k: 1, focus: function () { return 0; }, slow: function (t) { return t; }, amb: function (t) { return t; }, speed: function () { return 1; } };
  function motion(spec, D) {
    spec = spec || {};
    var wins = (spec.focus || []).filter(function (w) { return w && isFinite(w[0]) && isFinite(w[1]) && w[1] > w[0]; });
    var k = spec.scale == null ? 1 : Number(spec.scale);
    if (k === 1 && !wins.length) return IDENTITY;
    var fs = spec.focusScale == null ? 0.35 : Number(spec.focusScale);
    var ed = spec.ease == null ? 0.4 : Number(spec.ease);
    function sm(p) { return p * p * (3 - 2 * p); }
    function focus(t) {
      var w = 0;
      for (var i = 0; i < wins.length; i++) {
        var up = ed > 0 ? sm(span(t, wins[i][0] - ed, wins[i][0])) : (t >= wins[i][0] ? 1 : 0);
        var dn = ed > 0 ? 1 - sm(span(t, wins[i][1], wins[i][1] + ed)) : (t <= wins[i][1] ? 1 : 0);
        w = Math.max(w, Math.min(up, dn));
      }
      return w;
    }
    function rate(t) { return 1 - (1 - fs) * focus(t); }
    /* the slowed clock, integrated once at a fixed step (midpoint rule) so it is a pure function of t */
    var STEP = 1 / 240, N = Math.ceil(((D || 60) + 1) / STEP) + 1, G = new Float64Array(N);
    for (var i = 1; i < N; i++) G[i] = G[i - 1] + STEP * rate((i - 0.5) * STEP);
    function slow(t) {
      if (t <= 0) return t;
      var x = t / STEP, j = Math.floor(x);
      if (j >= N - 1) return G[N - 1] + (t - (N - 1) * STEP);
      return G[j] + (G[j + 1] - G[j]) * (x - j);
    }
    return {
      identity: false, k: k, focusScale: fs, focus: focus, slow: slow,
      amb: function (t) { return k * slow(t); },
      speed: function (t) { return k * rate(t); },
    };
  }

  /* ── palettes ──────────────────────────────────────────────────────────────── */
  var PAL = {
    hero: { // black + gold — hooks and the close
      sky0: 0x020203, sky1: 0x0b0905, fog: 0x050403, fogD: 0.018,
      floor: 0x07060a, grid: [1.0, 0.69, 0.13], gridA: 0.10,
      hemiSky: 0xffe2b0, hemiGnd: 0x050403, amb: 0.30, key: 0xfff0d8, keyI: 2.4, rim: 0xffb020, rimI: 2.2,
      lift: [0.010, 0.008, 0.004], gain: [1.03, 1.0, 0.94], sat: 1.04,
    },
    body: { // blue + gold — the body
      sky0: 0x02050a, sky1: 0x0a1a2b, fog: 0x050b13, fogD: 0.016,
      floor: 0x060b12, grid: [0.31, 0.6, 0.93], gridA: 0.11,
      hemiSky: 0x9fc4ea, hemiGnd: 0x04070b, amb: 0.42, key: 0xfff2dc, keyI: 2.5, rim: 0x66a9ee, rimI: 2.0,
      lift: [0.004, 0.009, 0.016], gain: [0.98, 1.0, 1.04], sat: 1.06,
    },
  };

  /* ── the HDR post pipeline ─────────────────────────────────────────────────── */
  var VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

  function post(THREE, renderer, W, H, o) {
    o = o || {};
    var half = THREE.HalfFloatType;
    var rt = new THREE.WebGLRenderTarget(W, H, { type: half, samples: 4, depthBuffer: true,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    rt.depthTexture = new THREE.DepthTexture(W, H);
    rt.depthTexture.type = THREE.UnsignedIntType;
    var w2 = W >> 1, h2 = H >> 1, w4 = W >> 2, h4 = H >> 2, w8 = W >> 3, h8 = H >> 3;
    function mk(w, h) { return new THREE.WebGLRenderTarget(w, h, { type: half, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
    var rB = mk(w2, h2), a4 = mk(w4, h4), b4 = mk(w4, h4), a8 = mk(w8, h8), b8 = mk(w8, h8);

    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quad.frustumCulled = false;
    var ps = new THREE.Scene(); ps.add(quad);
    var pc = new THREE.Camera();

    /* soft-knee bright pass + 4-tap box downsample (kills fireflies before the blur chain) */
    var bright = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uThresh: { value: o.threshold == null ? 0.9 : o.threshold }, uKnee: { value: 0.45 } },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D t; uniform vec2 uTexel; uniform float uThresh, uKnee; varying vec2 vUv;",
        "void main(){",
        "  vec3 c = texture2D(t, vUv + uTexel*vec2(-0.5,-0.5)).rgb + texture2D(t, vUv + uTexel*vec2(0.5,-0.5)).rgb",
        "         + texture2D(t, vUv + uTexel*vec2(-0.5,0.5)).rgb + texture2D(t, vUv + uTexel*vec2(0.5,0.5)).rgb;",
        "  c *= 0.25; c = min(c, vec3(24.0));",
        "  float l = max(c.r, max(c.g, c.b));",
        "  float s = clamp(l - uThresh + uKnee, 0.0, 2.0*uKnee); s = s*s/(4.0*uKnee + 1e-4);",
        "  float w = max(s, l - uThresh) / max(l, 1e-4);",
        "  gl_FragColor = vec4(c * w, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });
    var blur = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D t; uniform vec2 uDir; varying vec2 vUv;",
        "void main(){",
        "  vec3 c = texture2D(t, vUv).rgb * 0.2270270;",
        "  c += (texture2D(t, vUv + uDir*1.3846154).rgb + texture2D(t, vUv - uDir*1.3846154).rgb) * 0.3162162;",
        "  c += (texture2D(t, vUv + uDir*3.2307692).rgb + texture2D(t, vUv - uDir*3.2307692).rgb) * 0.0702703;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });

    var comp = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: rt.texture }, tDepth: { value: rt.depthTexture },
        tB4: { value: b4.texture }, tB8: { value: b8.texture },
        uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uRes: { value: new THREE.Vector2(W, H) },
        uNear: { value: o.near || 0.3 }, uFar: { value: o.far || 200 },
        uFocus: { value: 10 }, uRange: { value: o.range || 8 }, uMaxCoc: { value: o.maxCoc == null ? 12 : o.maxCoc },
        uBloom: { value: o.bloom == null ? 0.55 : o.bloom }, uBloomWide: { value: o.bloomWide == null ? 0.45 : o.bloomWide },
        uSmear: { value: new THREE.Vector2() }, uCA: { value: 0 }, uGrain: { value: 0.032 }, uTime: { value: 0 },
        uVig: { value: 0.55 }, uExposure: { value: 1.0 }, uSat: { value: 1.05 },
        uFlash: { value: new THREE.Vector3() }, uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) },
        uFade: { value: 0 },
      },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D tDiffuse, tDepth, tB4, tB8;",
        "uniform vec2 uTexel, uRes, uSmear;",
        "uniform float uNear, uFar, uFocus, uRange, uMaxCoc, uBloom, uBloomWide, uCA, uGrain, uTime, uVig, uExposure, uSat, uFade;",
        "uniform vec3 uFlash, uLift, uGain;",
        "varying vec2 vUv;",
        "float linDepth(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear-z*(uFar-uNear)); }",
        "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }",
        "vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }",
        "void main(){",
        "  vec2 uv = vUv;",
        "  vec3 col;",
        "  float sm = length(uSmear);",
        "  if (sm > 0.9) {",
        /* motion blur dominates the frame: 24 taps along the camera's screen-space velocity */
        "    vec3 sum = vec3(0.0); float rot = hash(uv*uRes) - 0.5;",
        "    for (int i = 0; i < 24; i++){ float f = (float(i) + rot)/23.0 - 0.5; sum += texture2D(tDiffuse, uv + uSmear*uTexel*f).rgb; }",
        "    col = sum / 24.0;",
        "  } else {",
        "    float z = linDepth(uv);",
        "    col = texture2D(tDiffuse, uv).rgb;",
        "    float coc = clamp(abs(z - uFocus)/uRange, 0.0, 1.0);",
        "    coc = max(coc - 0.14, 0.0)/0.86; coc = coc*coc*uMaxCoc;",
        "    if (coc > 0.5) {",
        "      float rot = hash(uv) * 6.2831853;",
        "      vec3 sum = col; float ws = 1.0;",
        "      for (int i = 0; i < 20; i++){",
        "        float fi = float(i); float a = fi*2.39996323 + rot; float rr = sqrt((fi+0.5)/20.0);",
        "        vec2 uv2 = uv + vec2(cos(a), sin(a))*rr*coc*uTexel;",
        "        float w = step(z - 0.45, linDepth(uv2));",
        "        sum += texture2D(tDiffuse, uv2).rgb * w; ws += w;",
        "      }",
        "      col = sum / ws;",
        "    }",
        "  }",
        "  if (uCA > 0.01 && sm <= 0.9) {",
        /* lens fringing only where the frame is SHARP: mixing a sharp offset sample into a smeared or
           defocused pixel splits the channels into green/magenta blocks (measured on the 024 s2 test) */
        "    vec2 d = (uv - 0.5); float r2 = dot(d, d) * 4.0; vec2 off = normalize(d + 1e-5) * min(uCA, 2.5) * r2 * uTexel;",
        "    float z0 = linDepth(uv); float cc = clamp(abs(z0 - uFocus)/uRange, 0.0, 1.0);",
        "    if (cc < 0.25) { col.r = mix(col.r, texture2D(tDiffuse, uv + off).r, 0.8); col.b = mix(col.b, texture2D(tDiffuse, uv - off).b, 0.8); }",
        "  }",
        "  col += texture2D(tB4, uv).rgb * uBloom + texture2D(tB8, uv).rgb * uBloomWide;",
        "  col *= uExposure;",
        "  col += uFlash;",
        "  col = aces(col);",
        "  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));",
        "  col = mix(vec3(l), col, uSat);",
        "  col = col*uGain + uLift*(1.0 - col);",
        "  vec2 q = (uv - 0.5)*vec2(uRes.x/uRes.y, 1.0);",
        "  col *= mix(1.0, smoothstep(1.22, 0.30, length(q)), uVig);",
        "  col = pow(clamp(col, 0.0, 1.0), vec3(1.0/2.2));",
        "  col += (hash(uv*uRes + fract(uTime*7.31)*91.7) - 0.5) * uGrain;",
        "  col *= (1.0 - uFade);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });

    function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(ps, pc); }
    function blurPass(src, dst, dx, dy) { blur.uniforms.t.value = src.texture; blur.uniforms.uDir.value.set(dx, dy); pass(blur, dst); }

    return {
      uniforms: comp.uniforms,
      render: function (scene, camera) {
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(scene, camera);
        bright.uniforms.t.value = rt.texture; pass(bright, rB);
        blurPass(rB, a4, 1 / w2, 0); blurPass(a4, b4, 0, 1 / h4);
        blurPass(b4, a4, 1.6 / w4, 0); blurPass(a4, b4, 0, 1.6 / h4);
        blurPass(b4, a8, 1 / w4, 0); blurPass(a8, b8, 0, 1 / h8);
        blurPass(b8, a8, 2.0 / w8, 0); blurPass(a8, b8, 0, 2.0 / h8);
        pass(comp, null);
      },
    };
  }

  /* ── the stage: renderer, sky, floor, fog, lights ──────────────────────────── */

  /**
   * Build the world every scene of a 3D video shares.
   * @param {object} THREE
   * @param {object} o  { W, H, fps, palette:'hero'|'body', fov, near, far, floorY, grid:true, seed,
   *                      bloom, bloomWide, maxCoc, range, exposure, motion (HW.motion budget, optional) }
   * @returns ctx  { THREE, renderer, scene, camera, post, pal, W, H, render(t, camFn, extra) }
   */
  function create(THREE, o) {
    var W = o.W, H = o.H, fps = o.fps || 30;
    var pal = PAL[o.palette || "body"];
    var canvas = document.getElementById(o.canvas || "gl");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    var scene = new THREE.Scene();
    var fogCol = new THREE.Color(pal.fog);
    scene.fog = new THREE.FogExp2(pal.fog, o.fogD == null ? pal.fogD : o.fogD);
    scene.background = new THREE.Color(pal.sky0);
    var camera = new THREE.PerspectiveCamera(o.fov || 38, W / H, o.near || 0.3, o.far || 220);

    /* sky dome: a vertical gradient with a faint horizon glow — depth behind everything */
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(180, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: { c0: { value: new THREE.Color(pal.sky0) }, c1: { value: new THREE.Color(pal.sky1) }, uGlow: { value: o.horizon == null ? 1.0 : o.horizon } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: [
          "uniform vec3 c0, c1; uniform float uGlow; varying vec3 vP;",
          "void main(){ float h = vP.y; float band = exp(-abs(h - 0.02)*9.0) * uGlow;",
          "  vec3 c = mix(c1, c0, smoothstep(-0.05, 0.6, h)) + c1*band*1.6;",
          "  gl_FragColor = vec4(c, 1.0); }",
        ].join("\n"),
        side: THREE.BackSide, depthWrite: false, fog: false,
      }),
    );
    sky.renderOrder = -10;
    scene.add(sky);

    var floorY = o.floorY == null ? 0 : o.floorY;
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.62, metalness: 0.35, transparent: true, opacity: o.floorOpacity == null ? 0.8 : o.floorOpacity }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    floor.receiveShadow = true;
    floor.renderOrder = 1;
    scene.add(floor);

    /* the blueprint grid on the floor: thin anti-aliased lines that fade into the fog */
    var grid = null;
    if (o.grid !== false) {
      grid = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 600),
        new THREE.ShaderMaterial({
          uniforms: { uCol: { value: new THREE.Vector3(pal.grid[0], pal.grid[1], pal.grid[2]) }, uA: { value: pal.gridA }, uCell: { value: o.gridCell || 2.0 }, uFogCol: { value: fogCol }, uFogD: { value: scene.fog.density }, uPulse: { value: 0 }, uPulseO: { value: new THREE.Vector2() } },
          vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
          fragmentShader: [
            "uniform vec3 uCol, uFogCol; uniform float uA, uCell, uFogD, uPulse; uniform vec2 uPulseO; varying vec3 vW;",
            "void main(){",
            "  vec2 g = vW.xz / uCell; vec2 f = abs(fract(g - 0.5) - 0.5) / fwidth(g);",
            "  float line = 1.0 - min(min(f.x, f.y), 1.0);",
            "  vec2 g2 = vW.xz / (uCell*5.0); vec2 f2 = abs(fract(g2 - 0.5) - 0.5) / fwidth(g2);",
            "  float major = 1.0 - min(min(f2.x, f2.y), 1.0);",
            "  float d = length(cameraPosition - vW); float fog = exp(-uFogD*uFogD*d*d*1.6);",
            "  float pr = length(vW.xz - uPulseO); float ring = uPulse * exp(-pow((pr - uPulse*40.0)*0.35, 2.0));",
            "  float a = (line*0.55 + major*0.9) * uA * fog + ring*0.6*fog*(line+major);",
            "  gl_FragColor = vec4(uCol * (1.0 + ring*3.0), a);",
            "}",
          ].join("\n"),
          transparent: true, depthWrite: false, extensions: { derivatives: true },
        }),
      );
      grid.rotation.x = -Math.PI / 2;
      grid.position.y = floorY + 0.004;
      grid.renderOrder = 2;
      scene.add(grid);
    }

    scene.add(new THREE.HemisphereLight(pal.hemiSky, pal.hemiGnd, pal.amb));
    var key = new THREE.DirectionalLight(pal.key, pal.keyI);
    key.position.set(9, 16, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var ext = o.shadowExtent || 18;
    key.shadow.camera.left = -ext; key.shadow.camera.right = ext; key.shadow.camera.top = ext; key.shadow.camera.bottom = -ext;
    key.shadow.camera.near = 1; key.shadow.camera.far = 80;
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
    scene.add(key); scene.add(key.target);
    var rim = new THREE.DirectionalLight(pal.rim, pal.rimI);
    rim.position.set(-12, 6, -14);
    scene.add(rim);

    var pp = post(THREE, renderer, W, H, { near: camera.near, far: camera.far, bloom: o.bloom, bloomWide: o.bloomWide, maxCoc: o.maxCoc, range: o.range, threshold: o.threshold });
    pp.uniforms.uLift.value.set(pal.lift[0], pal.lift[1], pal.lift[2]);
    pp.uniforms.uGain.value.set(pal.gain[0], pal.gain[1], pal.gain[2]);
    pp.uniforms.uSat.value = pal.sat;
    pp.uniforms.uExposure.value = o.exposure || 1.0;

    var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
    var prevCam = new THREE.PerspectiveCamera(camera.fov, W / H, camera.near, camera.far);

    function applyCam(cam, s) {
      cam.position.set(s.pos[0], s.pos[1], s.pos[2]);
      cam.up.set(Math.sin(s.roll || 0), Math.cos(s.roll || 0), 0);
      cam.lookAt(s.look[0], s.look[1], s.look[2]);
      if (s.fov && cam.fov !== s.fov) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
      cam.updateMatrixWorld(true);
    }

    var ctx = {
      THREE: THREE, renderer: renderer, scene: scene, camera: camera, post: pp, pal: pal,
      W: W, H: H, fps: fps, floor: floor, grid: grid, key: key, rim: rim, sky: sky, fogColor: fogCol,
      /**
       * Render frame `t`. `camFn(t)` → { pos:[3], look:[3], fov, roll, focus } is a PURE function of time;
       * calling it at t - 1/fps gives the shutter smear. `fx` = { flash:[r,g,b], ca, fade, smearScale,
       * exposure, focus }.
       */
      render: function (t, camFn, fx) {
        fx = fx || {};
        var s = camFn(t);
        var s0 = camFn(Math.max(0, t - 1 / fps));
        applyCam(camera, s);
        applyCam(prevCam, s0);
        /* motion blur: where did the point the camera was looking at one frame ago land now? */
        var fd = s.focus || Math.hypot(s.look[0] - s.pos[0], s.look[1] - s.pos[1], s.look[2] - s.pos[2]);
        prevCam.getWorldDirection(tmpV);
        tmpV2.copy(prevCam.position).addScaledVector(tmpV, fd);
        tmpV2.project(camera);
        var sx = tmpV2.x * W * 0.5, sy = tmpV2.y * H * 0.5;
        var k = (fx.smearScale == null ? 0.5 : fx.smearScale);   // 180-degree shutter
        var smx = sx * k, smy = sy * k;
        if (s.shot != null && s.shot !== s0.shot) { smx = 0; smy = 0; }
        var len = Math.hypot(smx, smy);
        if (len > 220) { smx *= 220 / len; smy *= 220 / len; }
        pp.uniforms.uSmear.value.set(smx, smy);
        pp.uniforms.uFocus.value = fx.focus || fd;
        pp.uniforms.uTime.value = t;
        var f = fx.flash || [0, 0, 0];
        pp.uniforms.uFlash.value.set(f[0], f[1], f[2]);
        pp.uniforms.uCA.value = o.noCA ? 0 : (fx.ca || 0) + Math.min(len * 0.02, 1.5);
        if (o.noBloom) { pp.uniforms.uBloom.value = 0; pp.uniforms.uBloomWide.value = 0; }
        pp.uniforms.uFade.value = fx.fade || 0;
        if (fx.exposure != null) pp.uniforms.uExposure.value = fx.exposure;
        /* motion budget: inside a key-take focus window the frame edges darken a little, pulling the
           eye to the centre while everything else settles (identity budget → untouched) */
        if (o.motion && !o.motion.identity) pp.uniforms.uVig.value = 0.55 + 0.18 * o.motion.focus(t);
        pp.render(scene, camera);
        return s;
      },
    };
    return ctx;
  }

  /* ── canvas type helpers ───────────────────────────────────────────────────── */
  var SANS = '"Segoe UI Variable Display","Segoe UI",system-ui,Arial,sans-serif';
  var MONO = '"Cascadia Mono","Cascadia Code",Consolas,"Courier New",monospace';

  function wrapText(g, text, maxW) {
    var words = String(text).split(" "), lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + " " + words[i] : words[i];
      if (g.measureText(next).width > maxW && line) { lines.push(line); line = words[i]; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /**
   * Text atlas: N strings in a grid, white ink on black (the shader uses .r as coverage).
   * @returns { tex, cols, rows }
   */
  function atlas(THREE, strings, o) {
    o = o || {};
    var cols = o.cols || 16, rows = Math.ceil(strings.length / cols);
    var cw = o.cellW || 256, ch = o.cellH || 64;
    var c = document.createElement("canvas");
    c.width = cols * cw; c.height = rows * ch;
    var g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#fff";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = (o.weight || 700) + " " + (o.size || 34) + "px " + (o.mono === false ? SANS : MONO);
    for (var i = 0; i < strings.length; i++) {
      var x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch / 2 + (o.dy || 2);
      g.fillText(strings[i], x, y);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = o.mips !== false;
    tex.minFilter = o.mips === false ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    return { tex: tex, cols: cols, rows: rows };
  }

  /* ── THE LATTICE — the model's weights as a block of readable number tiles ───── */

  /**
   * @param {object} ctx  from create()
   * @param {object} o    { cols, rows, slices, tile:[w,h,d], pitch:[x,y,z], base:[x,y,z], sets:[[256 strings] x N],
   *                        seed, ink:{cold,hot}, body:{cold,hot} }
   * @returns lattice { mesh, u (uniforms), size:[w,h,d], center:[3], front (z of front face), tilePos(c,r,s) }
   *
   * The uniforms ARE the art direction surface — each scene drives them from its own time:
   *   uHeat 0 frozen ice .. 1 hot forge     uChurn  number churn clock (only bites where hot)
   *   uFrost (x front, on)                  uShock[3] (xyz centre, radius) — each passed ring advances
   *   uScan (z plane, width, on, mark)      the tile to the NEXT measured set (real trained values)
   *   uBeamA/B, uBeam (radius, on)          uSlice (index, glow) lights one layer
   *   uGlow  glyph emission                 uPush  shock displacement
   */
  function lattice(ctx, o) {
    var THREE = ctx.THREE;
    var C = o.cols || 40, R = o.rows || 24, Sl = o.slices || 12;
    var tw = o.tile ? o.tile[0] : 0.54, th = o.tile ? o.tile[1] : 0.3, td = o.tile ? o.tile[2] : 0.05;
    var px = o.pitch ? o.pitch[0] : 0.6, py = o.pitch ? o.pitch[1] : 0.36, pz = o.pitch ? o.pitch[2] : 0.56;
    var base = o.base || [0, 0.35, 0];
    var sets = o.sets || [["0.0000000"]];
    var SET = sets[0].length;
    var all = [];
    for (var s = 0; s < sets.length; s++) for (var i = 0; i < SET; i++) all.push(sets[s][i]);
    var at = atlas(THREE, all, { cols: 16, cellW: 256, cellH: 60, size: 30, weight: 700, mips: o.mips });

    var N = C * R * Sl;
    var geo = new THREE.BoxGeometry(tw, th, td);
    var aCell = new Float32Array(N), aRand = new Float32Array(N), aGrid = new Float32Array(N * 3);
    var r = rng(o.seed || 7);
    var W0 = (C - 1) * px, H0 = (R - 1) * py, D0 = (Sl - 1) * pz;
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: at.tex }, uGrid: { value: new THREE.Vector2(at.cols, at.rows) }, uSet: { value: SET }, uSets: { value: sets.length },
        uHeat: { value: 0 }, uChurn: { value: 0 }, uGlow: { value: 1.0 },
        uFrost: { value: new THREE.Vector3(-999, 1, 0) },            // x front, direction, on
        uShock: { value: [new THREE.Vector4(0, 0, 0, -1), new THREE.Vector4(0, 0, 0, -1), new THREE.Vector4(0, 0, 0, -1)] },
        uShockW: { value: 0.9 }, uPush: { value: 0.35 },
        uScan: { value: new THREE.Vector4(-999, 0.5, 0, 0) },       // z plane, width, on, mark-scanned
        uBeamA: { value: new THREE.Vector3() }, uBeamB: { value: new THREE.Vector3() }, uBeam: { value: new THREE.Vector2(0.8, 0) },
        uSlice: { value: new THREE.Vector2(-1, 0) },
        uFlash: { value: 0 }, uShiver: { value: 0 }, uTime: { value: 0 },
        uCold: { value: new THREE.Color(o.coldBody || 0x173251) }, uHot: { value: new THREE.Color(o.hotBody || 0x3a1e08) },
        uColdInk: { value: new THREE.Vector3(0.95, 1.18, 1.55) }, uHotInk: { value: new THREE.Vector3(3.2, 1.75, 0.45) },
        uColdEdge: { value: new THREE.Vector3(0.35, 0.72, 1.3) }, uHotEdge: { value: new THREE.Vector3(2.4, 1.1, 0.25) },
        uScanCol: { value: new THREE.Vector3(0.3, 1.9, 1.6) }, uMarkCol: { value: new THREE.Vector3(0.02, 0.09, 0.08) },
        uRingCol: { value: new THREE.Vector3(3.4, 2.0, 0.55) },
        uKeyDir: { value: new THREE.Vector3(0.45, 0.75, 0.55).normalize() },
        uFogCol: { value: ctx.fogColor }, uFogD: { value: ctx.scene.fog.density },
        uOrigin: { value: new THREE.Vector3(base[0], base[1], base[2]) },
        uMirror: { value: 0 }, uFloorY: { value: o.floorY || 0 }, uTwinkle: { value: o.twinkle == null ? 1 : o.twinkle },
        uBuild: { value: 999 },
      },
      vertexShader: [
        "attribute float aCell; attribute float aRand; attribute vec3 aGrid;",
        "uniform vec4 uShock[3]; uniform float uShockW, uPush, uShiver, uTime, uHeat, uMirror, uFloorY;",
        "varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vLN; varying float vCell; varying float vRand; varying vec3 vGrid; varying vec3 vBase; varying float vRing; varying float vPassed;",
        "void main(){",
        "  vUv = uv; vLN = normal; vCell = aCell; vRand = aRand; vGrid = aGrid;",
        "  vec4 b = modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0);",
        /* the reflection is the same tiles mirrored in the floor: run every effect on the REAL position */
        "  if (uMirror > 0.5) b.y = 2.0*uFloorY - b.y;",
        "  vBase = b.xyz;",
        "  float ring = 0.0; float passed = 0.0;",
        "  for (int i = 0; i < 3; i++){ vec4 s = uShock[i]; if (s.w >= 0.0){ float d = length(b.xyz - s.xyz); passed += step(d, s.w); ring += 1.0 - smoothstep(0.0, uShockW, abs(d - s.w)); } }",
        "  vRing = ring; vPassed = passed;",
        "  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);",
        "  w.z += ring * uPush * (0.6 + aRand*0.8);",
        "  if (uMirror > 0.5) w.z += 0.0;",
        "  w.xyz += vec3(sin(uTime*23.0 + aRand*40.0), cos(uTime*19.0 + aRand*31.0), 0.0) * 0.012 * uShiver * uHeat;",
        "  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);",
        "  gl_Position = projectionMatrix * viewMatrix * w;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D uAtlas; uniform vec2 uGrid; uniform float uSet, uSets, uHeat, uChurn, uGlow, uFlash, uTime;",
        "uniform vec3 uFrost; uniform vec4 uScan; uniform vec3 uBeamA, uBeamB; uniform vec2 uBeam; uniform vec2 uSlice;",
        "uniform vec3 uCold, uHot, uColdInk, uHotInk, uColdEdge, uHotEdge, uScanCol, uMarkCol, uRingCol, uKeyDir, uFogCol; uniform float uFogD, uMirror, uFloorY, uTwinkle, uBuild;",
        "varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vLN; varying float vCell; varying float vRand; varying vec3 vGrid; varying vec3 vBase; varying float vRing; varying float vPassed;",
        "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }",
        "float glyph(float idx, vec2 uv){",
        "  float c = mod(idx, uGrid.x); float r = floor(idx / uGrid.x);",
        "  vec2 g = vec2((c + uv.x) / uGrid.x, (uGrid.y - 1.0 - r + uv.y) / uGrid.y);",
        "  return texture2D(uAtlas, g).r;",
        "}",
        "float segDist(vec3 p, vec3 a, vec3 b){ vec3 ab = b - a; float h = clamp(dot(p - a, ab)/max(dot(ab,ab),1e-4), 0.0, 1.0); return length(p - a - ab*h); }",
        "void main(){",
        /* a block under construction: tiles above the build line do not exist yet */
        "  if (vBase.y > uBuild) discard;",
        "  float heat = uHeat;",
        "  float frostEdge = 0.0;",
        "  if (uFrost.z > 0.5){ float dx = (vBase.x - uFrost.x) * uFrost.y; heat *= smoothstep(-0.5, 0.5, dx); frostEdge = (1.0 - smoothstep(0.0, 0.8, abs(dx))) * uFrost.z * 0.7; }",
        "  float set = min(vPassed, uSets - 1.0);",
        "  float churn = floor(uChurn * (0.6 + vRand*1.8)) * 37.0 * step(0.02, heat);",
        "  float idx = mod(vCell + churn, uSet) + uSet * set;",
        "  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);",
        "  float lam = max(dot(N, uKeyDir), 0.0);",
        "  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);",
        "  vec3 body = mix(uCold, uHot, heat);",
        "  vec3 col = body * (0.35 + lam * 0.9);",
        "  col += fres * mix(uColdEdge, uHotEdge, heat) * 0.55;",
        "  float scanLit = 0.0; float mark = 0.0;",
        "  if (uScan.z > 0.5){ scanLit = 1.0 - smoothstep(0.0, uScan.y, abs(vBase.z - uScan.x)); mark = uScan.w * step(uScan.x, vBase.z); }",
        "  float beamLit = 0.0;",
        "  if (uBeam.y > 0.0){ beamLit = (1.0 - smoothstep(0.0, uBeam.x, segDist(vBase, uBeamA, uBeamB))) * uBeam.y; }",
        /* uSlice = (current layer, on): a bright band on the layer being read + a faint trail on the
           layers already read (read order is front → back, i.e. high index → low) */
        "  float sliceLit = uSlice.y * (exp(-pow(vGrid.z - uSlice.x, 2.0) * 1.8) + 0.07 * step(uSlice.x + 0.5, vGrid.z)) * step(-0.5, uSlice.x);",
        "  if (vLN.z > 0.5){",
        "    float g = glyph(idx, vUv);",
        "    vec3 ink = mix(uColdInk, uHotInk, heat);",
        /* a few tiles brighten for a moment — the block is alive, never a wallpaper */
        "    float tw = hash(vec2(vCell*0.37 + vRand*91.0, floor(uTime*2.5 + vRand*7.0)));",
        "    float twk = uTwinkle * smoothstep(0.965, 1.0, tw) * (1.0 - heat);",
        "    float glow = uGlow * (1.0 + vRing*1.1 + beamLit*2.5 + scanLit*1.5 + sliceLit*1.2 + twk*1.6);",
        "    vec3 face = col*0.55 + mark*uMarkCol;",
        "    col = mix(face, ink*glow, g);",
        "    float n = hash(floor(vUv*vec2(46.0, 26.0)) + vCell*1.37);",
        "    col += (1.0 - heat) * smoothstep(0.93, 1.0, n) * vec3(0.5, 0.75, 1.0) * 0.35;",
        "  }",
        "  vec2 e = min(vUv, 1.0 - vUv); float edge = 1.0 - smoothstep(0.0, 0.07, min(e.x*1.75, e.y));",
        "  col += edge * mix(uColdEdge, uHotEdge, heat) * (0.22 + vRing*0.9 + scanLit*0.8 + sliceLit*0.6);",
        "  col += vRing * uRingCol * 0.32;",
        "  col += scanLit * uScanCol * 0.55;",
        "  col += beamLit * vec3(2.6, 1.7, 0.6) * 0.35;",
        "  col += sliceLit * vec3(1.7, 1.05, 0.35) * 0.55;",
        "  col += frostEdge * vec3(0.9, 1.6, 2.6);",
        "  if (uBuild < 900.0) col += (1.0 - smoothstep(0.0, 0.7, uBuild - vBase.y)) * vec3(3.2, 1.9, 0.5);",
        "  col += uFlash * vec3(0.6, 0.9, 1.3);",
        "  if (uMirror > 0.5){ float below = max(uFloorY - vW.y, 0.0); col *= 0.55 * exp(-below*0.22); }",
        "  float d = length(cameraPosition - vW); float fog = 1.0 - exp(-uFogD*uFogD*d*d);",
        "  col = mix(col, uFogCol, fog);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}",
      ].join("\n"),
    });
    var mesh = new THREE.InstancedMesh(geo, mat, N);
    var m4 = new THREE.Matrix4();
    var n = 0;
    for (var sl = 0; sl < Sl; sl++) {
      for (var row = 0; row < R; row++) {
        for (var col = 0; col < C; col++) {
          var x = base[0] - W0 / 2 + col * px, y = base[1] + row * py + th / 2, z = base[2] - D0 / 2 + sl * pz;
          m4.makeTranslation(x, y, z);
          mesh.setMatrixAt(n, m4);
          aCell[n] = Math.floor(r() * SET);
          aRand[n] = r();
          aGrid[n * 3] = col; aGrid[n * 3 + 1] = row; aGrid[n * 3 + 2] = sl;
          n++;
        }
      }
    }
    geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(aCell, 1));
    geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(aRand, 1));
    geo.setAttribute("aGrid", new THREE.InstancedBufferAttribute(aGrid, 3));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    ctx.scene.add(mesh);
    /* the wet-floor reflection: the SAME instances mirrored under the floor plane, seen through the
       semi-transparent floor. One shared material, flipped per draw by onBeforeRender. */
    var mirror = null;
    if (o.reflect !== false) {
      mirror = new THREE.InstancedMesh(geo, mat, N);
      mirror.instanceMatrix = mesh.instanceMatrix;
      mirror.scale.y = -1;
      mirror.position.y = 2 * (o.floorY || 0);
      mirror.frustumCulled = false;
      mirror.castShadow = false;
      mirror.onBeforeRender = function () { mat.uniforms.uMirror.value = 1; };
      mesh.onBeforeRender = function () { mat.uniforms.uMirror.value = 0; };
      ctx.scene.add(mirror);
    }
    return {
      mesh: mesh, mirror: mirror, u: mat.uniforms,
      /** move/scale the whole block (and its reflection) as one object */
      place: function (x, y, z, sc) {
        mesh.position.set(x, y, z); mesh.scale.setScalar(sc || 1);
        if (mirror) { mirror.position.set(x, 2 * (o.floorY || 0) - y, z); mirror.scale.set(sc || 1, -(sc || 1), sc || 1); }
      },
      size: [W0 + tw, H0 + th + (base[1]), D0 + td],
      center: [base[0], base[1] + H0 / 2 + th / 2, base[2]],
      front: base[2] + D0 / 2 + td / 2,
      back: base[2] - D0 / 2 - td / 2,
      top: base[1] + H0 + th,
      left: base[0] - W0 / 2 - tw / 2, right: base[0] + W0 / 2 + tw / 2,
      pitch: [px, py, pz], dims: [C, R, Sl],
      tilePos: function (c, rr, s) { return [base[0] - W0 / 2 + c * px, base[1] + rr * py + th / 2, base[2] - D0 / 2 + s * pz]; },
    };
  }

  /* ── CARDS — chat bubbles, pages, notes: real type on a physical slab ──────── */

  var STYLES = {
    user: { bg: "#1d2b3a", ink: "#eaf2fb", edge: "#4f87c0", body: 0x152231, label: "#8fb6dc" },
    ai: { bg: "#f2f5f9", ink: "#141c26", edge: "#ffffff", body: 0xd8e0ea, label: "#5b6f84" },
    wrong: { bg: "#2a1414", ink: "#ffe3e3", edge: "#ff5c5c", body: 0x2a1212, label: "#ff8d8d" },
    gold: { bg: "#1b1408", ink: "#ffe9bd", edge: "#ffb020", body: 0x2b1d07, label: "#ffd37a" },
    page: { bg: "#e9eef4", ink: "#1b2633", edge: "#ffffff", body: 0xc9d4e0, label: "#6c8197" },
    note: { bg: "#ffe7a3", ink: "#2b2006", edge: "#ffd37a", body: 0xe8c66a, label: "#7a5a12" },
    good: { bg: "#0f241b", ink: "#d9ffe9", edge: "#3ddc97", body: 0x0d2018, label: "#7ce0b2" },
    glass: { bg: "#0d1a26", ink: "#cfe3f5", edge: "#63a8ec", body: 0x0d1823, label: "#7fa6c8" },
  };

  /**
   * A card: rounded slab with thickness + a face that carries REAL canvas type.
   * @param {object} ctx
   * @param {object} o  { w (world), style, label (small caps header), lines:[string|{t,size,weight,color,mono}],
   *                      size (body px), pad, radius, depth, ppu (pixels per unit), minH, align, bodyTint }
   * @returns { group, w, h, face, redraw(o2) }
   */
  function card(ctx, o) {
    var THREE = ctx.THREE;
    var st = STYLES[o.style || "ai"];
    var ppu = o.ppu || 150;
    var w = o.w || 6;
    var pad = (o.pad == null ? 0.26 : o.pad);
    var radius = o.radius == null ? 0.2 : o.radius;
    var depth = o.depth == null ? 0.07 : o.depth;
    var cw = Math.round(w * ppu);
    var c = document.createElement("canvas");
    var g = c.getContext("2d");

    function layout(spec) {
      var size = spec.size || 40;
      var out = [], y = pad * ppu;
      if (spec.label) { out.push({ kind: "label", text: spec.label, y: y + 24 }); y += 46; }
      var lines = spec.lines || [];
      for (var i = 0; i < lines.length; i++) {
        var L = typeof lines[i] === "string" ? { t: lines[i] } : lines[i];
        var sz = L.size || size, wt = L.weight || 600;
        g.font = wt + " " + sz + "px " + (L.mono ? MONO : SANS);
        var wrapped = L.nowrap ? [L.t] : wrapText(g, L.t, cw - pad * 2 * ppu);
        for (var k = 0; k < wrapped.length; k++) {
          out.push({ kind: "line", text: wrapped[k], y: y + sz * 0.95, font: g.font, color: L.color || st.ink, strike: L.strike, hl: L.hl });
          y += sz * 1.28;
        }
        y += (L.gap || 0);
      }
      y += pad * ppu * 0.85;
      return { items: out, h: Math.max(y, (o.minH || 0) * ppu) };
    }

    var spec0 = { label: o.label, lines: o.lines, size: o.size, edge: o.edge, bg: o.bg, labelColor: o.labelColor };
    var L0 = layout(spec0);
    var ch = Math.round(L0.h);
    c.width = cw; c.height = ch;
    var h = ch / ppu;

    function draw(spec, reveal) {
      var L = layout(spec);
      g.clearRect(0, 0, cw, ch);
      roundRect(g, 3, 3, cw - 6, ch - 6, radius * ppu);
      g.fillStyle = spec.bg || st.bg; g.fill();
      g.lineWidth = 5; g.strokeStyle = spec.edge || st.edge; g.stroke();
      var budget = reveal == null ? 1e9 : reveal;
      for (var i = 0; i < L.items.length; i++) {
        var it = L.items[i];
        if (it.y > ch) break;
        if (it.kind === "label") {
          g.font = "700 26px " + SANS; g.fillStyle = spec.labelColor || st.label; g.textAlign = "left"; g.textBaseline = "alphabetic";
          g.fillText(String(it.text).toUpperCase().split("").join(" "), pad * ppu, it.y);
          continue;
        }
        var txt = it.text;
        if (budget <= 0) break;
        if (txt.length > budget) txt = txt.slice(0, budget);
        budget -= it.text.length;
        g.font = it.font; g.fillStyle = it.color; g.textAlign = o.align === "center" ? "center" : "left"; g.textBaseline = "alphabetic";
        var x = o.align === "center" ? cw / 2 : pad * ppu;
        if (it.hl) {
          var tw = g.measureText(txt).width;
          g.fillStyle = it.hl; roundRect(g, (o.align === "center" ? x - tw / 2 : x) - 8, it.y - parseFloat(it.font.split(" ")[1]) * 0.86, tw + 16, parseFloat(it.font.split(" ")[1]) * 1.12, 8); g.fill();
          g.fillStyle = it.color;
        }
        g.fillText(txt, x, it.y);
        if (it.strike) {
          var sw = g.measureText(txt).width; var sx = o.align === "center" ? x - sw / 2 : x;
          g.strokeStyle = it.strike; g.lineWidth = 6; g.beginPath(); g.moveTo(sx - 6, it.y - 14); g.lineTo(sx + sw + 6, it.y - 14); g.stroke();
        }
      }
    }
    draw(spec0, null);

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;

    var shape = new THREE.Shape();
    var x0 = -w / 2, y0 = -h / 2, rr = Math.min(radius, h / 2 - 0.01);
    shape.moveTo(x0 + rr, y0); shape.lineTo(x0 + w - rr, y0); shape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rr);
    shape.lineTo(x0 + w, y0 + h - rr); shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rr, y0 + h);
    shape.lineTo(x0 + rr, y0 + h); shape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rr);
    shape.lineTo(x0, y0 + rr); shape.quadraticCurveTo(x0, y0, x0 + rr, y0);
    var bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 6 });
    bodyGeo.translate(0, 0, -depth);
    var bodyMat = new THREE.MeshStandardMaterial({ color: o.bodyTint || st.body, roughness: 0.45, metalness: 0.15 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true; body.receiveShadow = true;
    var faceMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: o.glow == null ? 0.62 : o.glow,
      roughness: 0.55, metalness: 0.0, transparent: false, alphaTest: 0.5 });
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), faceMat);
    face.position.z = 0.018;
    face.receiveShadow = true;
    var group = new THREE.Group();
    group.add(body); group.add(face);
    var last = null;
    return {
      group: group, w: w, h: h, face: face, body: body, mat: faceMat,
      /** re-draw with new content; `reveal` = number of characters to show (typing). Cheap no-op when unchanged. */
      redraw: function (spec, reveal) {
        var key = JSON.stringify(spec) + "|" + reveal;
        if (key === last) return;
        last = key;
        draw(Object.assign({ label: o.label, lines: o.lines, size: o.size, edge: o.edge, bg: o.bg, labelColor: o.labelColor }, spec || {}), reveal);
        tex.needsUpdate = true;
      },
    };
  }


  /* ── CHAT — a recognisable AI chat window (title bar, bubbles, composer) ───── */
  /**
   * The viewer's own app, mirrored back (MOTION_SPEC §0, the 009 S1 standard). One canvas, fixed size,
   * redrawn from state: messages are [{ who:'user'|'ai', text, reveal (chars, optional), tone:
   * 'wrong'|'good'|'gold'|null, strike (bool), dim (bool) }]. Newest messages stay pinned to the bottom
   * like a real chat (older ones scroll up under the title bar).
   * @param {object} o { w, h, title, accent (css), ppu, size (px), composer (placeholder text) }
   * @returns { group, w, h, redraw(messages, composerText) , bubbleRect(i) }
   */
  function chat(ctx, o) {
    var THREE = ctx.THREE;
    var ppu = o.ppu || 150, w = o.w || 7.6, h = o.h || 5.2;
    var cw = Math.round(w * ppu), ch = Math.round(h * ppu);
    var c = document.createElement("canvas"); c.width = cw; c.height = ch;
    var g = c.getContext("2d");
    var acc = o.accent || "#63a8ec";
    var size = o.size || 40;
    var TB = 78, CB = 104, PADX = 34;
    var rects = [];
    function bubble(m, yBottom, measureOnly) {
      g.font = (m.who === "ai" ? 600 : 600) + " " + size + "px " + SANS;
      var maxW = cw * 0.74 - 2 * 26;
      var lines = wrapText(g, m.text, maxW);
      var lw = 0; for (var i = 0; i < lines.length; i++) lw = Math.max(lw, g.measureText(lines[i]).width);
      var bw = lw + 2 * 26, bh = lines.length * size * 1.25 + 2 * 20;
      if (measureOnly) return bh;
      var x = m.who === "user" ? cw - PADX - bw : PADX;
      var y = yBottom - bh;
      var bg = m.who === "user" ? "#24486e" : "#dfe6ee", ink = m.who === "user" ? "#ffffff" : "#0b1118", edge = null;
      if (m.tone === "wrong") { edge = "#ff5c5c"; if (m.who === "ai") bg = "#f3dada"; else bg = "#5a1f24"; }
      if (m.tone === "good") { edge = "#3ddc97"; if (m.who === "ai") bg = "#eafff4"; }
      if (m.tone === "gold") { edge = "#ffb020"; if (m.who === "ai") bg = "#fff6e2"; else bg = "#4a3410"; }
      roundRect(g, x, y, bw, bh, 26); g.fillStyle = bg; g.fill();
      if (edge) { g.lineWidth = 6; g.strokeStyle = edge; g.stroke(); }
      g.fillStyle = m.dim ? (m.who === "user" ? "rgba(255,255,255,0.45)" : "rgba(24,33,44,0.45)") : ink;
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      var budget = m.reveal == null ? 1e9 : m.reveal;
      for (var k = 0; k < lines.length; k++) {
        var txt = lines[k]; if (budget <= 0) break; if (txt.length > budget) txt = txt.slice(0, budget); budget -= lines[k].length + 1;
        var ly = y + 20 + size * 0.98 + k * size * 1.25;
        g.fillText(txt, x + 26, ly);
        if (m.strike) { var sw = g.measureText(txt).width; g.strokeStyle = "#ff5c5c"; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 20, ly - size * 0.33); g.lineTo(x + 32 + sw, ly - size * 0.33); g.stroke(); }
      }
      return { x: x, y: y, w: bw, h: bh };
    }
    function draw(msgs, composer) {
      g.clearRect(0, 0, cw, ch);
      roundRect(g, 3, 3, cw - 6, ch - 6, 30); g.fillStyle = "#0d141c"; g.fill();
      g.lineWidth = 5; g.strokeStyle = acc; g.stroke();
      /* title bar */
      g.save(); roundRect(g, 3, 3, cw - 6, ch - 6, 30); g.clip();
      g.fillStyle = "#151f2a"; g.fillRect(0, 0, cw, TB);
      g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, TB - 2, cw, 2);
      var dots = ["#ff5f57", "#febc2e", "#28c840"];
      for (var d = 0; d < 3; d++) { g.beginPath(); g.arc(40 + d * 34, TB / 2, 10, 0, Math.PI * 2); g.fillStyle = dots[d]; g.fill(); }
      g.font = "700 30px " + SANS; g.fillStyle = "#c9d7e6"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(o.title || "New chat", cw / 2, TB / 2 + 1);
      /* messages, newest pinned to the bottom */
      var yb = ch - CB - 22;
      rects = [];
      for (var i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].hidden) { rects[i] = null; continue; }
        var r = bubble(msgs[i], yb, false);
        rects[i] = r;
        yb = r.y - 22;
        if (yb < TB) break;
      }
      /* composer */
      g.fillStyle = "#121b25"; g.fillRect(0, ch - CB, cw, CB);
      roundRect(g, PADX, ch - CB + 18, cw - PADX * 2, CB - 36, 22); g.fillStyle = "#1b2734"; g.fill();
      g.lineWidth = 3; g.strokeStyle = "rgba(146,178,214,0.35)"; g.stroke();
      g.font = "600 30px " + SANS; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillStyle = composer ? "#e8f0f8" : "rgba(201,215,230,0.45)";
      g.fillText(composer || (o.composer || "Message…"), PADX + 26, ch - CB / 2);
      g.beginPath(); g.arc(cw - PADX - 36, ch - CB / 2, 22, 0, Math.PI * 2); g.fillStyle = acc; g.fill();
      g.restore();
    }
    draw([], "");
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter;
    var body = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x0b1118, roughness: 0.4, metalness: 0.3 }));
    body.position.z = -0.065; body.castShadow = true;
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: o.glow == null ? 0.5 : o.glow, roughness: 0.5, alphaTest: 0.5 }));
    var group = new THREE.Group(); group.add(body); group.add(face);
    var last = null;
    return {
      group: group, w: w, h: h, face: face,
      redraw: function (msgs, composer) {
        var key = JSON.stringify(msgs) + "|" + (composer || "");
        if (key === last) return; last = key;
        draw(msgs, composer); tex.needsUpdate = true;
      },
      /** world-space centre (local to the group) of message i after the last draw */
      bubbleAt: function (i) {
        var r = rects[i]; if (!r) return null;
        return { x: (r.x + r.w / 2) / ppu - w / 2, y: h / 2 - (r.y + r.h / 2) / ppu, w: r.w / ppu, h: r.h / ppu };
      },
    };
  }


  /* ── FRAME — a glowing box outline built from real bars (GL lines are 1px) ─── */
  function frameBox(ctx, w, h, d, o) {
    var THREE = ctx.THREE; o = o || {};
    var th = o.thick || 0.06;
    var col = o.color || [0.5, 1.2, 2.4];
    var mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col[0], col[1], col[2]) });
    var g = new THREE.Group();
    var hw = w / 2, hh = h / 2, hd = d / 2;
    function bar(sx, sy, sz, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); g.add(m); }
    [-hh, hh].forEach(function (y) { [-hd, hd].forEach(function (z) { bar(w + th, th, th, 0, y, z); }); });
    [-hw, hw].forEach(function (x) { [-hd, hd].forEach(function (z) { bar(th, h + th, th, x, 0, z); }); });
    [-hw, hw].forEach(function (x) { [-hh, hh].forEach(function (y) { bar(th, th, d + th, x, y, 0); }); });
    if (o.glass) {
      var gm = new THREE.ShaderMaterial({
        uniforms: { uCol: { value: new THREE.Vector3(col[0], col[1], col[2]) }, uA: { value: o.glass } },
        vertexShader: "varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
        fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 2.5); gl_FragColor = vec4(uCol*(0.04 + f*0.5)*uA, 1.0); }",
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gm));
    }
    ctx.scene.add(g);
    return { group: g, mat: mat, set: function (k) { mat.color.setRGB(col[0] * k, col[1] * k, col[2] * k); } };
  }

  /* ── BEAM — a glowing read ray with travelling pulses ──────────────────────── */
  function beam(ctx, o) {
    var THREE = ctx.THREE;
    o = o || {};
    var geo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
    geo.translate(0, 0.5, 0);
    geo.rotateX(Math.PI / 2);   // along +z, from 0 to 1
    var mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Vector3(o.color ? o.color[0] : 2.6, o.color ? o.color[1] : 1.6, o.color ? o.color[2] : 0.5) }, uOn: { value: 0 }, uTime: { value: 0 }, uLen: { value: 1 }, uHead: { value: 1 } },
      vertexShader: "varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
      fragmentShader: [
        "uniform vec3 uCol; uniform float uOn, uTime, uLen, uHead; varying vec3 vP; varying vec3 vN; varying vec3 vW;",
        "void main(){",
        "  vec3 V = normalize(cameraPosition - vW); float core = pow(abs(dot(normalize(vN), V)), 2.0);",
        "  float along = vP.z; if (along > uHead) discard;",
        "  float pulses = 0.55 + 0.45*sin((along*uLen*1.6 - uTime*14.0));",
        "  float tip = smoothstep(uHead - 0.06, uHead, along) * 2.0;",
        "  gl_FragColor = vec4(uCol * (core*1.6 + 0.25) * pulses * uOn + uCol*tip*uOn, 1.0);",
        "}",
      ].join("\n"),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    ctx.scene.add(mesh);
    var A = new THREE.Vector3(), B = new THREE.Vector3();
    return {
      mesh: mesh, u: mat.uniforms,
      /** point the beam from a to b, radius r, intensity on (0..), head 0..1 = how far it has travelled */
      set: function (a, b, r, on, head, t) {
        A.set(a[0], a[1], a[2]); B.set(b[0], b[1], b[2]);
        var len = A.distanceTo(B);
        mesh.position.copy(A);
        mesh.lookAt(B);
        mesh.scale.set(r, r, Math.max(len, 1e-3));
        mat.uniforms.uOn.value = on; mat.uniforms.uHead.value = head == null ? 1 : head;
        mat.uniforms.uLen.value = len; mat.uniforms.uTime.value = t || 0;
        mesh.visible = on > 0.001 && (head == null || head > 0.001);
      },
    };
  }

  /* ── DUST — drifting motes, a pure function of time ────────────────────────── */
  function dust(ctx, o) {
    var THREE = ctx.THREE;
    o = o || {};
    var n = o.count || 900, box = o.box || [60, 18, 60], ctr = o.center || [0, 6, 0];
    var r = rng(o.seed || 3);
    var pos = new Float32Array(n * 3), ph = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * box[0]; pos[i * 3 + 1] = (r() - 0.5) * box[1]; pos[i * 3 + 2] = (r() - 0.5) * box[2];
      ph[i] = r();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBox: { value: new THREE.Vector3(box[0], box[1], box[2]) }, uCtr: { value: new THREE.Vector3(ctr[0], ctr[1], ctr[2]) }, uSize: { value: o.size || 26 }, uCol: { value: new THREE.Vector3(o.color ? o.color[0] : 0.9, o.color ? o.color[1] : 0.8, o.color ? o.color[2] : 0.6) }, uA: { value: o.alpha || 0.5 }, uWind: { value: new THREE.Vector3(0.12, 0.05, 0.03) } },
      vertexShader: [
        "attribute float aPh; uniform float uTime, uSize; uniform vec3 uBox, uCtr, uWind; varying float vA;",
        "void main(){",
        "  vec3 p = position + uWind*uTime*(0.6+aPh) + vec3(sin(uTime*0.7+aPh*20.0), cos(uTime*0.5+aPh*13.0), sin(uTime*0.3+aPh*7.0))*0.35;",
        "  p = mod(p + uBox*0.5, uBox) - uBox*0.5 + uCtr;",
        "  vec4 mv = modelViewMatrix*vec4(p,1.0);",
        "  gl_PointSize = uSize * (0.4 + aPh) / max(-mv.z, 0.5);",
        "  vA = 0.35 + 0.65*abs(sin(uTime*0.9 + aPh*30.0));",
        "  gl_Position = projectionMatrix*mv;",
        "}",
      ].join("\n"),
      fragmentShader: "uniform vec3 uCol; uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(uCol*a*uA*vA, 1.0); }",
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    ctx.scene.add(pts);
    return { points: pts, u: mat.uniforms, update: function (t) { mat.uniforms.uTime.value = t; } };
  }

  /* ── SPARKS — impact bursts, each one a pure function of (t - t0) ─────────── */
  /**
   * Any number of bursts; every particle carries its own origin, birth time, velocity and colour,
   * so 100 impacts cost exactly what 1 does per particle.
   * @param {object} o { bursts:[{ t, p:[3], n, speed, color:[3], up, spread:[3], life }], size, life, seed }
   */
  function sparks(ctx, o) {
    var THREE = ctx.THREE;
    o = o || {};
    var bursts = o.bursts || [];
    var total = 0, i, b;
    for (b = 0; b < bursts.length; b++) total += bursts[b].n || 60;
    total = Math.max(total, 1);
    var r = rng(o.seed || 11);
    var org = new Float32Array(total * 3), vel = new Float32Array(total * 3), col = new Float32Array(total * 3), t0 = new Float32Array(total), life = new Float32Array(total), ph = new Float32Array(total);
    var k = 0;
    for (b = 0; b < bursts.length; b++) {
      var B = bursts[b], n = B.n || 60, sp0 = B.speed || 5, up = B.up == null ? 1.5 : B.up, spr = B.spread || [1, 1, 1], c = B.color || [3, 1.8, 0.5];
      for (i = 0; i < n; i++, k++) {
        var th = r() * Math.PI * 2, u = r() * 2 - 1, s0 = Math.sqrt(1 - u * u), sp = sp0 * (0.35 + r() * 0.9);
        org[k * 3] = B.p[0]; org[k * 3 + 1] = B.p[1]; org[k * 3 + 2] = B.p[2];
        vel[k * 3] = Math.cos(th) * s0 * sp * spr[0]; vel[k * 3 + 1] = u * sp * spr[1] + up; vel[k * 3 + 2] = Math.sin(th) * s0 * sp * spr[2];
        col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
        t0[k] = B.t; life[k] = (B.life || o.life || 0.9) * (0.5 + r() * 0.7); ph[k] = r();
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(org, 3));
    geo.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aT0", new THREE.BufferAttribute(t0, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: o.size || 60 }, uGrav: { value: o.gravity == null ? 6.0 : o.gravity } },
      vertexShader: [
        "attribute vec3 aVel; attribute vec3 aCol; attribute float aT0; attribute float aLife; attribute float aPh;",
        "uniform float uTime, uSize, uGrav; varying vec3 vC; varying float vA;",
        "void main(){",
        "  float age = uTime - aT0;",
        "  if (age < 0.0 || age > aLife){ gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; vA = 0.0; vC = vec3(0.0); return; }",
        "  float q = age / aLife;",
        "  vec3 p = position + aVel*age*(1.0 - 0.45*q) + vec3(0.0, -uGrav*age*age*0.5, 0.0);",
        "  vec4 mv = modelViewMatrix*vec4(p,1.0);",
        "  gl_PointSize = uSize*(0.45 + aPh)/max(-mv.z, 0.5) * (1.0 - q*0.7);",
        "  vC = aCol; vA = (1.0 - q)*(1.0 - q);",
        "  gl_Position = projectionMatrix*mv;",
        "}",
      ].join("\n"),
      fragmentShader: "varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord-0.5; float a = smoothstep(0.5,0.0,length(d)); gl_FragColor = vec4(vC*a*vA, 1.0); }",
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    ctx.scene.add(pts);
    return { points: pts, u: mat.uniforms, update: function (t) { mat.uniforms.uTime.value = t; } };
  }

  /* ── RING — a flat shockwave disc on a plane, for impacts ──────────────────── */
  function ring(ctx, o) {
    var THREE = ctx.THREE;
    o = o || {};
    var mat = new THREE.ShaderMaterial({
      uniforms: { uP: { value: 0 }, uCol: { value: new THREE.Vector3(o.color ? o.color[0] : 3, o.color ? o.color[1] : 1.8, o.color ? o.color[2] : 0.5) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: "uniform float uP; uniform vec3 uCol; varying vec2 vUv; void main(){ float r = length(vUv-0.5)*2.0; float w = 0.08 + 0.1*uP; float a = (1.0 - smoothstep(0.0, w, abs(r - uP))) * (1.0 - uP); gl_FragColor = vec4(uCol*a, 1.0); }",
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.frustumCulled = false;
    ctx.scene.add(mesh);
    return {
      mesh: mesh,
      set: function (t, at, dur, size) {
        var p = span(t, at, at + (dur || 0.6));
        mat.uniforms.uP.value = E.out3(p);
        mesh.scale.setScalar(size || 4);
        mesh.visible = t >= at && p < 1;
      },
    };
  }

  /** a world label (canvas text plane) — HF3.textPlane with the kit's defaults */
  function label(ctx, text, o) { return HF3.textPlane(ctx.THREE, text, o || {}); }

  /* ── HUD helpers (flat DOM, house plates) ──────────────────────────────────── */
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  /** a counter on a GSAP timeline: node text rolls from a→b over [at, at+dur] */
  function count(tl, node, a, b, at, dur, ease, format) {
    var o = { v: a };
    var f = format || fmt;
    node.textContent = f(a);
    tl.to(o, { v: b, duration: dur, ease: ease || "power3.out", onUpdate: function () { node.textContent = f(o.v); } }, at);
    return tl;
  }
  /** GSAP fromTo that never pre-applies its `from` (see MOTION_SPEC §9) */
  function fromTo(tl, target, from, to, at) {
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
    return tl;
  }

  global.HW = {
    E: E, ramp: ramp, pulse: pulse, keys: keys, wob: wob, shake: shake, kick: kick, add3: add3, orbit: orbit, motion: motion,
    PAL: PAL, STYLES: STYLES, SANS: SANS, MONO: MONO,
    create: create, post: post, shots: shots, atlas: atlas, lattice: lattice, card: card, chat: chat, frameBox: frameBox, beam: beam, dust: dust, sparks: sparks,
    ring: ring, label: label, fmt: fmt, count: count, fromTo: fromTo, wrapText: wrapText,
  };
})(window);
