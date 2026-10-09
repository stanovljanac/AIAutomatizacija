/* fzs-forge — 024 SHORT s3 (3D, portrait). "Everything a model knows lives in those numbers … frozen."
 *
 * The long cut's forge (fz-forge) recomposed for 9:16 and run on the motion budget. "Frozen" only means
 * something if the viewer first sees the block ALIVE: a macro on the real numbers, then a rewind to the
 * run that set them — the monolith molten gold, numbers churning, words pouring in, a field of GPU racks
 * behind it — then the run ends, the racks go dark, and a frost front locks every number on "frozen".
 * The take is held: the camera and the room settle, only the frost and the line move.
 * Cut from the long: the weights term card, the token chip, the GPU-hour counter and its source chip —
 * the Short does not say them, so they are not on screen (less to read, less to move).
 *
 * SHOTS (S.beatAt + props.cues)
 *   A  0    macro: the numbers, readable, then a pull-back   "Everything a model knows lives in those numbers."
 *   B  b1   REWIND: heat, churn, word storm, GPU field        "They're set once, in training."
 *   C  b2   3/4 front, still: the frost front                 "Then they're frozen."
 */
var S = HF.scene({ id: "fzs-forge", width: 1080, height: 1920, frames: 232, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.45), b2 = S.beatAt(2, 0.8);
var tNumbers = cue("numbers", b1 - 0.8), tOnce = cue("once", b1 + 0.4), tTraining = cue("training", b1 + 1.1), tFrozen = cue("frozen", b2 + 0.27);
var tEnds = b2 - 0.05;
var E = HW.E;

/* ── HUD ───────────────────────────────────────────────────────────────────── */
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-tag" id="tag">◀◀ rewind · training</div>' +
  '<div class="hw-plate hw-take" id="take">Set once.<br>Then <span class="i">frozen.</span><i class="ul" id="ul"></i></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#tag", "#take"], { opacity: 0 });
HW.fromTo(tl, "#tag", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, b1 + 0.1);
tl.to("#tag", { opacity: 0, y: -14, duration: 0.22, ease: "power2.in" }, b2 - 0.1);
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tFrozen + 0.2);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tFrozen + 0.4);
HF.register("fzs-forge", tl);

var WORDS = ["the", "invoice", "because", "Ankara", "however", "receipt", "meeting", "deadline", "customer", "therefore",
  "capital", "Turkey", "schedule", "hello", "thanks", "price", "attention", "river", "Monday", "budget", "report", "story",
  "contract", "recipe", "physics", "Paris", "history", "code", "function", "love", "weather", "market", "music", "law",
  "doctor", "engine", "garden", "ocean", "language", "number", "question", "answer", "if", "then", "while", "and", "of",
  "summary", "email", "table", "chapter", "theorem", "street", "forest", "kitchen", "planet", "atom", "court", "patient",
  "reply", "spreadsheet", "Istanbul", "Tuesday", "minutes", "agenda", "sorry", "please", "note", "draft", "error", "fix",
  "train", "words", "pages", "books", "forum", "manual", "lyrics", "poem", "news", "wiki", "review", "letter", "ticket"];

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 52, bloom: 0.66, bloomWide: 0.56, maxCoc: 12, range: 9, far: 260, motion: M });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, cols: 20, rows: 44, slices: 12 });
  var FRONT = LAT.front, TOP = LAT.top, MID = LAT.top / 2;
  var glow = new THREE.PointLight(0xffa030, 0, 60, 1.6); glow.position.set(0, MID, 7); scene.add(glow);
  var dust = HW.dust(ctx, { count: 800, box: [60, 30, 70], center: [0, 11, 0], color: [0.7, 0.8, 1.0], alpha: 0.34 });

  /* ── the word storm: billboards falling into the top of the block ── */
  var at = HW.atlas(THREE, WORDS, { cols: 8, cellW: 256, cellH: 64, size: 38, weight: 700, mono: false });
  var NWD = 900;
  var base = new THREE.PlaneGeometry(1, 0.25);
  var g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute("position", base.getAttribute("position")); g.setAttribute("uv", base.getAttribute("uv"));
  g.instanceCount = NWD;
  var aW = new Float32Array(NWD * 4), aI = new Float32Array(NWD), aR = new Float32Array(NWD);
  var r = HF3.rng(5);
  for (var i = 0; i < NWD; i++) {
    aW[i * 4] = (r() - 0.5) * 18; aW[i * 4 + 1] = (r() - 0.5) * 8; aW[i * 4 + 2] = r(); aW[i * 4 + 3] = 7 + r() * 9;
    aI[i] = Math.floor(r() * WORDS.length); aR[i] = r();
  }
  g.setAttribute("aW", new THREE.InstancedBufferAttribute(aW, 4));
  g.setAttribute("aIdx", new THREE.InstancedBufferAttribute(aI, 1));
  g.setAttribute("aRank", new THREE.InstancedBufferAttribute(aR, 1));
  var wordMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDensity: { value: 0 }, uTop: { value: TOP + 22 }, uBot: { value: TOP - 0.2 }, uScale: { value: 2.0 },
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

  /* ── the GPU field: racks to the horizon behind the block ── */
  var RX = 40, RZ = 30, NR = RX * RZ;
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

  /* ice shards thrown off the frost front as it crosses the block */
  var sb = [], r3 = HF3.rng(31);
  for (i = 0; i < 14; i++) {
    var f = i / 13, tt = tFrozen - 0.12 + E.inOut(f) * 0.8;
    sb.push({ t: tt, p: [HF3.mix(LAT.left, LAT.right, f), 1.5 + r3() * 13, FRONT + 0.1], n: 34, speed: 4.2, up: 0.8, spread: [0.6, 1.2, 1.0], color: [1.6, 2.6, 3.8], life: 0.9 });
  }
  var shards = HW.sparks(ctx, { bursts: sb, size: 55, gravity: 5 });

  /* ── camera ── */
  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      /* a slow macro track across real weights, then a pull-back on "numbers" */
      /* measured (motion.json): the first cut's pull-back to 6.5 was the busiest second of the Short —
         now a shorter, longer-eased move */
      var e = E.inOut(p), back = E.inOut(HF3.span(t, tNumbers - 0.9, b1));
      var x = HF3.mix(-1.0, 0.0, e);
      return { pos: [x, 9.3, FRONT + HF3.mix(2.7, 4.4, back)], look: [x + 0.25, 9.15, FRONT], fov: 52, focus: HF3.mix(2.7, 4.4, back) };
    } },
    { t: b1, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([2.8, 9.3, FRONT + 15], [3.6, 10.6, 28.6], e), look: lp([0, 8.6, 0], [0, 8.4, -2], e), fov: 52 };
    } },
    { t: b2, cam: function (p) {
      var e = E.out2(p);
      return { pos: lp([-9.6, 6.4, 25.0], [-8.8, 6.6, 23.6], e), look: [0.6, 8.6, 0], fov: 52 };
    } },
  ], D, { motion: M, kick: function (t) { return HW.kick(t, tFrozen, 0.07, 0.6); } });

  function heatAt(t) { return E.inOut(HF3.span(t, tOnce, tTraining)); }

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var amb = M.amb(t), fo = M.focus(t);
    var heat = heatAt(t);
    /* the churn clock is the INTEGRAL of the churn rate (x the motion budget), so it never jumps back */
    var churn = 8 * M.k * Math.max(0, Math.min(t, tFrozen) - tOnce) * (t > tOnce ? 1 : 0);   // long cut: 16
    LAT.u.uHeat.value = heat;
    LAT.u.uChurn.value = churn;
    LAT.u.uShiver.value = heat * M.k;
    LAT.u.uTime.value = amb;
    var fr = HF3.span(t, tFrozen - 0.12, tFrozen + 0.7);
    LAT.u.uFrost.value.set(HF3.mix(LAT.left - 1.5, LAT.right + 1.5, E.inOut(fr)), 1, t >= tFrozen - 0.12 ? 1 : 0);
    if (fr >= 1) LAT.u.uHeat.value = 0;
    LAT.u.uGlow.value = 1.0 + 0.4 * heat + 0.25 * HW.pulse(t, tFrozen + 0.35, 0.3, 0.8);
    LAT.u.uFlash.value = 0.12 * HW.pulse(t, tFrozen + 0.4, 0.35, 0.6);
    glow.intensity = 26 * heat * (fr >= 1 ? 0 : 1 - fr);

    /* the storm */
    var dens = 0.25 * E.out2(HF3.span(t, tOnce, tOnce + 0.6)) + 0.25 * E.inOut(HF3.span(t, tTraining - 0.4, tTraining + 0.3));   // long cut peaks at 1.0
    dens *= 1 - E.in2(HF3.span(t, tEnds - 0.1, tEnds + 0.6));
    wordMat.uniforms.uDensity.value = dens;
    wordMat.uniforms.uTime.value = amb;
    words.visible = dens > 0.001;

    /* the field powers up with the heat and goes dark from the horizon in as the run ends */
    var power = E.out2(HF3.span(t, tOnce, tTraining + 0.3));
    rack.material.uniforms.uPower.value = power;
    rack.material.uniforms.uTime.value = amb;
    rack.material.uniforms.uOff.value = HF3.mix(-200, 30, E.in2(HF3.span(t, tEnds, tFrozen - 0.15)));
    dust.update(amb);
    dust.u.uA.value = 0.34 * (1 - 0.5 * fo);

    ctx.post.uniforms.uRange.value = t < b1 ? 2.4 : 9;
    var s = cam(t);
    shards.update(t);
    var fl = HW.pulse(t, tFrozen + 0.4, 0.3, 0.5);
    ctx.render(t, cam, { focus: s.focus || null, exposure: 1.0 + 0.08 * heat, flash: [0.02 * fl, 0.035 * fl, 0.05 * fl] });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
