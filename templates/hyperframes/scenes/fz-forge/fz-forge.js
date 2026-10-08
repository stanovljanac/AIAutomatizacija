/* fz-forge — 024 s3 (3D). "Here's why. … When it ends, the weights are frozen."
 *
 * PREMISE. "Frozen" only means something if the viewer first sees the block ALIVE. So this scene is a
 * rewind: from the cold block of real numbers back to the run that set them — the lattice molten gold,
 * every number churning, a storm of words pouring into it, and behind it a field of GPU racks wired
 * into the block — then the run ends, the racks go dark row by row, and a frost front sweeps the block
 * and locks every number on the word "frozen". The numbers it locks on are the REAL GPT-2 weights the
 * viewer just saw in s2; the training run's scale (30.84M GPU-hours) is Meta's published figure for
 * Llama 3.1 405B, counted on screen with its source.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    whip-in dive at the face                         "Here's why."
 *   B  b1   macro track across the numbers                   "Everything a model has learned lives in those numbers."
 *   C  b2   crane up — term card                             "They're called weights."
 *   D  b3   REWIND: heat, churn, the word storm              "They get set once, during training… trillions of words."
 *   E  b4   crane over the block: the GPU field + counter    "…over thirty million GPU hours."
 *   F  b5   power-down, then the frost front on "frozen"     "When it ends, the weights are frozen."
 */
var S = HF.scene({ id: "fz-forge", width: 1920, height: 1080, frames: 560, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var b1 = S.beatAt(1, 0.046), b2 = S.beatAt(2, 0.225), b3 = S.beatAt(3, 0.29), b4 = S.beatAt(4, 0.566), b5 = S.beatAt(5, 0.855);
var tNumbers = b1 + 2.39, tWeights = b2 + 0.30, tOnce = b3 + 0.45, tTraining = b3 + 1.25, tTrillions = b3 + 3.47;
var tThirty = b4 + 3.0, tHours = b4 + 4.49, tEnds = b5 + 0.17, tFrozen = b5 + 1.31;
var E = HW.E;

/* ── HUD ───────────────────────────────────────────────────────────────────── */
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-term" id="term"><div class="w"><span class="hw-kicker-g">weights</span></div><div class="d">the numbers a model learned — set in training</div></div>' +
  '<div class="hw-plate hw-tag" id="tag">◀◀ rewind · training</div>' +
  '<div class="hw-plate hw-chip" id="tok">' + (props.tokensChip || "trained on ~15 trillion tokens") + ' · <b>Llama 3.1, Meta 2024</b></div>' +
  '<div class="hw-plate hw-count" id="cnt"><div class="lbl">gpu-hours · one training run</div><div class="num gold" id="cntv">0</div></div>' +
  '<div class="hw-plate hw-chip" id="src">' + (props.gpuChip || "Llama 3.1 405B · Meta model card, 2024 · 30.84M H100 GPU-hours") + "</div>" +
  '<div class="hw-plate hw-kicker" id="kick">Set once. Then <span class="g">frozen.</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#term", "#tag", "#tok", "#cnt", "#src", "#kick"], { opacity: 0 });
HW.fromTo(tl, "#term", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tWeights - 0.12);
tl.to("#term", { opacity: 0, y: -20, duration: 0.22, ease: "power2.in" }, b3 - 0.05);
HW.fromTo(tl, "#tag", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, b3 + 0.1);
HW.fromTo(tl, "#tok", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tTrillions - 0.05);
tl.to(["#tag", "#tok"], { opacity: 0, x: -30, duration: 0.22, ease: "power2.in" }, b4 + 0.05);
HW.fromTo(tl, "#cnt", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b4 + 0.25);
HW.count(tl, document.getElementById("cntv"), 0, 30840000, b4 + 0.4, Math.max(tHours - b4 - 0.4, 1), "power2.inOut");
HW.fromTo(tl, "#src", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tHours - 0.1);
tl.to(["#cnt", "#src"], { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, tEnds + 0.4);
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tFrozen + 0.25);
HF.register("fz-forge", tl);

var WORDS = ["the", "invoice", "because", "Ankara", "however", "receipt", "meeting", "deadline", "customer", "therefore",
  "capital", "Turkey", "schedule", "hello", "thanks", "price", "attention", "river", "Monday", "budget", "report", "story",
  "contract", "recipe", "physics", "Paris", "history", "code", "function", "love", "weather", "market", "music", "law",
  "doctor", "engine", "garden", "ocean", "language", "number", "question", "answer", "if", "then", "while", "and", "of",
  "summary", "email", "table", "chapter", "theorem", "street", "forest", "kitchen", "planet", "atom", "court", "patient",
  "reply", "spreadsheet", "Istanbul", "Tuesday", "minutes", "agenda", "sorry", "please", "note", "draft", "error", "fix",
  "train", "words", "pages", "books", "forum", "manual", "lyrics", "poem", "news", "wiki", "review", "letter", "ticket"];

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.7, bloomWide: 0.6, maxCoc: 12, range: 9, far: 260 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front, TOP = LAT.top;
  var glow = new THREE.PointLight(0xffa030, 0, 60, 1.6); glow.position.set(0, 5, 6); scene.add(glow);
  var dust = HW.dust(ctx, { count: 900, box: [80, 26, 80], center: [0, 10, 0], color: [0.7, 0.8, 1.0], alpha: 0.38 });

  /* ── the word storm: billboards falling into the top of the block ── */
  var at = HW.atlas(THREE, WORDS, { cols: 8, cellW: 256, cellH: 64, size: 38, weight: 700, mono: false });
  var NWD = 1100;
  var base = new THREE.PlaneGeometry(1, 0.25);
  var g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute("position", base.getAttribute("position")); g.setAttribute("uv", base.getAttribute("uv"));
  g.instanceCount = NWD;
  var aW = new Float32Array(NWD * 4), aI = new Float32Array(NWD), aR = new Float32Array(NWD);
  var r = HF3.rng(5);
  for (var i = 0; i < NWD; i++) {
    aW[i * 4] = (r() - 0.5) * 30; aW[i * 4 + 1] = (r() - 0.5) * 10; aW[i * 4 + 2] = r(); aW[i * 4 + 3] = 7 + r() * 9;
    aI[i] = Math.floor(r() * WORDS.length); aR[i] = r();
  }
  g.setAttribute("aW", new THREE.InstancedBufferAttribute(aW, 4));
  g.setAttribute("aIdx", new THREE.InstancedBufferAttribute(aI, 1));
  g.setAttribute("aRank", new THREE.InstancedBufferAttribute(aR, 1));
  var wordMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDensity: { value: 0 }, uTop: { value: TOP + 26 }, uBot: { value: TOP - 0.2 }, uScale: { value: 2.3 },
      uAtlas: { value: at.tex }, uGrid: { value: new THREE.Vector2(at.cols, at.rows) }, uFogCol: { value: ctx.fogColor }, uFogD: { value: ctx.scene.fog.density } },
    vertexShader: [
      "attribute vec4 aW; attribute float aIdx; attribute float aRank;",
      "uniform float uTime, uDensity, uTop, uBot, uScale; varying vec2 vUv; varying float vIdx; varying float vD;",
      "void main(){",
      "  float len = uTop - uBot;",
      "  float y = uTop - fract(aW.z + uTime*aW.w/len)*len;",
      "  vec3 c = vec3(aW.x, y, aW.y);",
      "  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);",
      "  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);",
      "  float vis = step(aRank, uDensity) * smoothstep(uBot, uBot + 1.6, y);",
      "  vec3 wp = c + (right*position.x + up*position.y) * uScale * vis;",
      "  vUv = uv; vIdx = aIdx; vec4 mv = viewMatrix*vec4(wp,1.0); vD = -mv.z;",
      "  gl_Position = projectionMatrix*mv;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uAtlas; uniform vec2 uGrid; uniform vec3 uFogCol; uniform float uFogD; varying vec2 vUv; varying float vIdx; varying float vD;",
      "void main(){",
      "  float c = mod(vIdx, uGrid.x), r = floor(vIdx / uGrid.x);",
      "  vec2 g = vec2((c + vUv.x)/uGrid.x, (uGrid.y - 1.0 - r + vUv.y)/uGrid.y);",
      "  float a = texture2D(uAtlas, g).r; if (a < 0.4) discard;",
      "  vec3 col = vec3(3.4, 1.9, 0.55) * a;",
      "  float fog = 1.0 - exp(-uFogD*uFogD*vD*vD); col = mix(col, uFogCol, fog);",
      "  gl_FragColor = vec4(col, 1.0);",
      "}",
    ].join("\n"),
  });
  var words = new THREE.Mesh(g, wordMat);
  words.frustumCulled = false;
  scene.add(words);

  /* ── the GPU field: racks to the horizon, wired into the back of the block ── */
  var RX = 56, RZ = 34, NR = RX * RZ;
  var rack = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 2.6, 0.9), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uOff: { value: -999 }, uFogCol: { value: ctx.fogColor }, uFogD: { value: ctx.scene.fog.density } },
    vertexShader: [
      "attribute float aId; varying vec2 vUv; varying vec3 vLN; varying vec3 vW; varying vec3 vN; varying float vId;",
      "void main(){ vUv = uv; vLN = normal; vId = aId; vec4 w = modelMatrix*instanceMatrix*vec4(position,1.0); vW = w.xyz;",
      "  vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }",
    ].join("\n"),
    fragmentShader: [
      "uniform float uTime, uPower, uOff, uFogD; uniform vec3 uFogCol; varying vec2 vUv; varying vec3 vLN; varying vec3 vW; varying vec3 vN; varying float vId;",
      "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }",
      "void main(){",
      "  float lam = max(dot(normalize(vN), normalize(vec3(0.4,0.8,0.5))), 0.0);",
      "  vec3 col = vec3(0.035,0.04,0.05) * (0.5 + lam);",
      "  float on = uPower * step(uOff, vW.z);",
      "  if (vLN.z > 0.5){",
      "    vec2 q = vUv*vec2(5.0, 16.0); vec2 cell = floor(q);",
      "    float dotm = smoothstep(0.32, 0.18, length(fract(q) - 0.5));",
      "    float blink = step(0.42, hash(cell + vId*1.31 + floor(uTime*9.0 + hash(cell + vId)*9.0)));",
      "    col += vec3(3.1, 1.45, 0.32) * dotm * blink * on;",
      "    col += vec3(0.4, 0.2, 0.05) * on * 0.25;",
      "  }",
      "  float d = length(cameraPosition - vW); float fog = 1.0 - exp(-uFogD*uFogD*d*d*0.55);",
      "  gl_FragColor = vec4(mix(col, uFogCol, fog), 1.0);",
      "}",
    ].join("\n"),
  }), NR);
  var aId = new Float32Array(NR), m4 = new THREE.Matrix4(), k = 0;
  for (var ix = 0; ix < RX; ix++) for (var iz = 0; iz < RZ; iz++) {
    var x = (ix - (RX - 1) / 2) * 2.3 + (iz % 2) * 0.6, z = LAT.back - 9 - iz * 3.6;
    m4.makeTranslation(x, 1.3, z); rack.setMatrixAt(k, m4); aId[k] = k; k++;
  }
  rack.geometry.setAttribute("aId", new THREE.InstancedBufferAttribute(aId, 1));
  rack.frustumCulled = false;
  scene.add(rack);

  /* the wiring: light runs from rack tops into the back of the block */
  var NL = 160, lp0 = new Float32Array(NL * 6), lt = new Float32Array(NL * 2), r2 = HF3.rng(9);
  for (i = 0; i < NL; i++) {
    var sx = (r2() - 0.5) * 120, sz = LAT.back - 10 - r2() * 90;
    var ex = (r2() - 0.5) * 22, ey = 1 + r2() * 7.5, ez = LAT.back - 0.1;
    lp0.set([sx, 2.7, sz, ex, ey, ez], i * 6); lt[i * 2] = r2(); lt[i * 2 + 1] = 1 + r2();
  }
  var lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp0, 3));
  lg.setAttribute("aT", new THREE.BufferAttribute(lt, 1));
  var wires = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: "attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform float uTime, uPower; varying float vT; void main(){ float p = fract(vT*3.0 - uTime*1.6); float b = smoothstep(0.85, 1.0, p); gl_FragColor = vec4(vec3(2.6,1.3,0.3)*(0.12 + b*1.6)*uPower, 1.0); }",
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  wires.frustumCulled = false;
  scene.add(wires);

  /* ice shards thrown off the frost front as it crosses the block */
  var sb = [], r3 = HF3.rng(31);
  for (i = 0; i < 18; i++) {
    var f = i / 17, tt = tFrozen - 0.12 + E.inOut(f) * 0.87;
    sb.push({ t: tt, p: [HF3.mix(LAT.left, LAT.right, f), 1 + r3() * 7.5, FRONT + 0.1], n: 40, speed: 4.5, up: 0.8, spread: [0.6, 1.2, 1.0], color: [1.6, 2.6, 3.8], life: 0.9 });
  }
  var shards = HW.sparks(ctx, { bursts: sb, size: 55, gravity: 5 });

  /* ── camera ── */
  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t, d) {
      var e = E.inOut(p);
      var whip = 1 - E.out3(HF3.span(t, 0, 0.32));
      return { pos: lp([-6.0, 6.2, 26.0], [-3.2, 5.3, FRONT + 2.4], e), look: HW.add3(lp([0, 4.8, 0], [-2.6, 5.1, FRONT], e), [-whip * 14, 0, 0]), fov: 38 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      var back = E.inOut(HF3.span(t, tNumbers - 0.2, b2));
      var x = HF3.mix(-2.2, 0.6, e);
      return { pos: [x, 5.25 + 0.15 * Math.sin(p * 3), FRONT + HF3.mix(1.25, 2.9, back)], look: [x + 0.9, 5.05, FRONT], fov: 34, focus: HF3.mix(1.35, 3.0, back) };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([2.8, 5.4, FRONT + 3.0], [9.0, 11.5, 21.0], e), look: lp([3.4, 5.0, FRONT], [0, 4.6, 0], e), fov: 38 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      var yaw = HF3.mix(-0.62, 0.12, e), pitch = HF3.mix(0.07, 0.16, e);
      return { pos: HW.add3(HW.orbit([0, 4.6, 0], 25, yaw, pitch), HW.shake(t, 0.07, 1.6, 4)), look: [0, HF3.mix(6.5, 8.0, e), 0], fov: 42 };
    } },
    { t: b4, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([1.5, 8.5, 25.0], [0.5, 24.0, 33.0], e), look: lp([0, 5.0, 0], [0, 1.5, -40.0], e), fov: 42 };
    } },
    { t: b5, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: HW.add3(lp([-12.5, 3.2, 18.5], [-9.6, 3.7, 15.2], e), HW.kick(t, tFrozen, 0.08, 0.6)), look: lp([1.0, 4.7, 0], [1.6, 4.8, 0], e), fov: 40 };
    } },
  ], D);

  var heatStart = tOnce, heatFull = tTraining;
  function heatAt(t) { return E.inOut(HF3.span(t, heatStart, heatFull)); }

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var heat = heatAt(t);
    /* the churn clock is the INTEGRAL of the churn rate, so it never jumps backwards */
    var churn = 16 * Math.max(0, Math.min(t, tFrozen) - heatStart) * (t > heatStart ? 1 : 0);
    LAT.u.uHeat.value = heat;
    LAT.u.uChurn.value = churn;
    LAT.u.uShiver.value = heat;
    LAT.u.uTime.value = t;
    var fr = HF3.span(t, tFrozen - 0.12, tFrozen + 0.75);
    LAT.u.uFrost.value.set(HF3.mix(LAT.left - 1.5, LAT.right + 1.5, E.inOut(fr)), 1, t >= tFrozen - 0.12 ? 1 : 0);
    if (fr >= 1) LAT.u.uHeat.value = 0;
    LAT.u.uGlow.value = 1.0 + 0.4 * heat + 0.25 * HW.pulse(t, tFrozen + 0.35, 0.3, 0.8);
    LAT.u.uFlash.value = 0.12 * HW.pulse(t, tFrozen + 0.4, 0.35, 0.6);
    glow.intensity = 26 * heat * (fr >= 1 ? 0 : 1 - fr);

    /* the storm */
    var dens = 0.3 * E.out2(HF3.span(t, tTraining - 0.4, tTraining + 0.4)) + 0.7 * E.inOut(HF3.span(t, tTrillions - 0.6, tTrillions + 0.3));
    dens *= 1 - E.in2(HF3.span(t, tEnds - 0.1, tEnds + 0.6));
    wordMat.uniforms.uDensity.value = dens;
    wordMat.uniforms.uTime.value = t;
    words.visible = dens > 0.001;

    /* the field powers up with the heat and goes dark from the horizon in on "ends" */
    var power = E.out2(HF3.span(t, tTraining - 0.3, tTraining + 0.6));
    rack.material.uniforms.uPower.value = power;
    rack.material.uniforms.uTime.value = t;
    rack.material.uniforms.uOff.value = HF3.mix(-200, 30, E.in2(HF3.span(t, tEnds, tFrozen - 0.15)));
    wires.material.uniforms.uPower.value = power * (1 - HF3.span(t, tEnds, tEnds + 0.7));
    wires.material.uniforms.uTime.value = t;
    dust.update(t);

    var rng = t >= b1 && t < b2 ? 2.2 : 9;
    ctx.post.uniforms.uRange.value = rng;
    var s = cam(t);
    shards.update(t);
    ctx.render(t, cam, { focus: s.focus || null, exposure: 1.0 + 0.08 * heat, flash: [0.02 * HW.pulse(t, tFrozen + 0.4, 0.3, 0.5), 0.035 * HW.pulse(t, tFrozen + 0.4, 0.3, 0.5), 0.05 * HW.pulse(t, tFrozen + 0.4, 0.3, 0.5)] });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
