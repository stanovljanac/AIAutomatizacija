/* fz-test — 024 s2 (3D). "So I tested it."
 *
 * PREMISE. The video's claim is arithmetic, so the scene is a LAB, not an illustration. The model is
 * a physical object — the lattice, every tile printing a REAL GPT-2 weight — and the experiment is run
 * ON it, on camera: the test chat prints the model's real (wrong) answer, a hundred corrections are
 * fired at it and shatter on the surface, a laser sheet checks every one of the twelve layers while
 * the counter rolls to the real parameter count, and the two real SHA-256 fingerprints are compared
 * character by character. "Not one had moved" lands on a match, not on an adjective.
 *
 * SHOTS (every mark from S.beatAt + the word offsets read off alignment.json):
 *   A  0      lights slam on over the lattice              "So I tested it."
 *   B  b1     the test chat types the real wrong answer    "…thinks the capital of Turkey is Istanbul."
 *   C  b2     snap-zoom: Istanbul struck, Ankara in gold   "It's Ankara."
 *   D  b3     100 corrections fly and shatter on the ice   "I corrected it a hundred times."
 *   E  b4     the scan sheet walks all 12 layers           "Then I checked every number inside it."
 *   F  b5     crane up: the whole block, checked           "All a hundred and twenty-four million…"
 *   G  b6     fingerprints match; whip right into s3       "Not one had moved."
 */
var S = HF.scene({ id: "fz-test", width: 1920, height: 1080, frames: 437, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var b1 = S.beatAt(1, 0.078), b2 = S.beatAt(2, 0.37), b3 = S.beatAt(3, 0.45), b4 = S.beatAt(4, 0.58), b5 = S.beatAt(5, 0.74), b6 = S.beatAt(6, 0.876);
/* word cues: offset of the word inside its sentence, read off alignment.json */
var tIstanbul = b1 + 3.15, tAnkara = b2 + 0.23, tEvery = b4 + 0.81, tMillion = b5 + 1.03, tMoved = b6 + 0.38;
var M = props.measured || { params: 124439808, corrections: 100, fpBefore: "e563ffe10e2eefeaf9d9a869d4cb43369cdddbe6875789caec4e1abd7c6adfd9", fpAfterChats: "e563ffe10e2eefeaf9d9a869d4cb43369cdddbe6875789caec4e1abd7c6adfd9", measuredOn: "2026-10-08" };
var E = HW.E;

/* ── the HUD (flat, opaque plates — MOTION_SPEC §13) ──────────────────────────── */
function spans(str) { var o = ""; for (var i = 0; i < str.length; i++) o += "<i>" + str[i] + "</i>"; return o; }
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">' + (props.modelChip || "GPT-2 small · open model · run locally") + "</div>" +
  '<div class="hw-plate hw-count" id="cntA"><div class="lbl">corrections sent</div><div class="num red" id="cntAv">0</div></div>' +
  '<div class="hw-plate hw-count" id="cntB"><div class="lbl">numbers checked</div><div class="num ice" id="cntBv">0</div></div>' +
  '<div class="hw-plate hw-chip" id="srcB">every parameter of GPT-2 small · <b>measured ' + (M.measuredOn || "") + "</b></div>" +
  '<div class="hw-plate hw-hash" id="fp">' +
  '<div class="row"><span class="k">before</span><span class="v" id="fpA">' + spans(M.fpBefore) + "</span></div>" +
  '<div class="row"><span class="k">after 100</span><span class="v" id="fpB">' + spans(M.fpAfterChats) + '</span></div>' +
  '<div class="verdict" id="verdict">identical · SHA-256 of all weights</div></div>' +
  '<div class="hw-plate hw-kicker" id="kick"><span class="g">0</span> of 124,439,808 changed</div>';

var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#cntA", "#cntB", "#srcB", "#fp", "#kick"], { opacity: 0 });
gsap.set("#fp", { y: 40 });
gsap.set("#kick", { y: -16 });
HW.fromTo(tl, "#chip", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, 0.3);
tl.to("#chip", { opacity: 0, x: -30, duration: 0.22, ease: "power2.in" }, b3 - 0.25);
HW.fromTo(tl, "#cntA", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b3);
tl.to("#cntA", { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, b4 + 0.05);
HW.fromTo(tl, "#cntB", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b4 + 0.3);
HW.count(tl, document.getElementById("cntBv"), 0, M.params || 124439808, tEvery - 0.35, Math.max(tMillion - tEvery + 0.35, 0.6), "power2.inOut");
HW.fromTo(tl, "#srcB", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tMillion);
HW.fromTo(tl, "#fp", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b6 - 0.3);
HW.fromTo(tl, "#kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tMoved + 0.12);
tl.to(["#cntB", "#srcB", "#fp", "#kick"], { opacity: 0, duration: 0.18, ease: "power2.in" }, D - 0.36);
HF.register("fz-test", tl);

/* the fingerprint comparison is a pure function of time — runs left→right, lands on "moved" */
var fpA = document.getElementById("fpA").children, fpB = document.getElementById("fpB").children;
var verdict = document.getElementById("verdict");
var cntAv = document.getElementById("cntAv");
function hud(t) {
  var p = HF3.span(t, b6 - 0.05, tMoved);
  var n = Math.floor(p * fpB.length);
  for (var i = 0; i < fpB.length; i++) {
    var on = i < n;
    fpB[i].className = on ? (fpA[i].textContent === fpB[i].textContent ? "m" : "x") : "";
    fpA[i].className = on ? "m" : "";
    fpB[i].style.opacity = i < n + 6 || p >= 1 ? 1 : 0.18;
  }
  verdict.style.opacity = t >= tMoved ? 1 : 0;
}

/* ── the world ─────────────────────────────────────────────────────────────── */
HF3.boot(function (THREE) {
  var DBG = props.dbg || {};
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.6, bloomWide: 0.5, maxCoc: 11, range: 9, noCA: DBG.noCA, noBloom: DBG.noBloom });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, mips: DBG.mips });
  var LC = LAT.center, FRONT = LAT.front;

  /* lab lights: three long practical bars that slam on, one by one */
  var bars = [];
  for (var i = 0; i < 3; i++) {
    var bar = new THREE.Mesh(new THREE.BoxGeometry(26, 0.1, 0.22), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    bar.position.set(0, 12.2, -3 + i * 3.4);
    scene.add(bar);
    bars.push(bar);
  }
  var barOn = [0.12, 0.32, 0.52];
  var dust = HW.dust(ctx, { count: 800, box: [70, 22, 70], center: [0, 9, 0], color: [0.55, 0.72, 1.0], alpha: 0.4 });

  /* the test chat: real model output, typed */
  var Q = "User: What is the capital of Turkey?";
  var A = "AI: " + (M.freshAnswer || "The capital of Turkey is Istanbul.");
  var chat = HW.card(ctx, { w: 7.6, style: "glass", label: "test chat · gpt-2", size: 44,
    lines: [{ t: Q, color: "#9fc4ea" }, { t: A, weight: 700 }, { t: "✓ It's Ankara.", weight: 800, color: "#ffd37a", size: 50 }] });
  var CHAT = [0, 3.5, 9.6];
  chat.group.position.set(CHAT[0], CHAT[1], CHAT[2]);
  scene.add(chat.group);

  /* a hundred corrections: one texture, instanced, each a pure function of its launch time */
  var corr = HW.card(ctx, { w: 2.6, style: "wrong", size: 40, lines: [{ t: "That's wrong.", weight: 800 }, { t: "It's Ankara.", weight: 600, color: "#ffc2c2" }] });
  var cMat = new THREE.MeshStandardMaterial({ map: corr.mat.map, emissiveMap: corr.mat.map, emissive: 0xffffff, emissiveIntensity: 0.75, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.5 });
  var NC = M.corrections || 100;
  var cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(corr.w, corr.h), cMat, NC);
  cards.frustumCulled = false;
  scene.add(cards);
  var r = HF3.rng(41), FLY = 0.46;
  var launches = [], from = [], to = [], spin = [], bursts = [];
  for (var k = 0; k < NC; k++) {
    var L = b3 + 0.04 + 1.78 * Math.pow(k / (NC - 1), 0.82);
    launches.push(L);
    from.push([CHAT[0] + (r() - 0.5) * 6.0, CHAT[1] + (r() - 0.5) * 2.4, CHAT[2] + 0.3]);
    var tgt = [(r() - 0.5) * 20, 1.2 + r() * 7.2, FRONT + 0.06];
    to.push(tgt);
    spin.push((r() - 0.5) * 2.2);
    bursts.push({ t: L + FLY, p: [tgt[0], tgt[1], tgt[2] + 0.05], n: 16, speed: 3.6, up: 0.6, spread: [1, 1, 0.6], color: k % 3 ? [1.2, 2.2, 3.4] : [3.2, 1.0, 0.8], life: 0.7 });
  }
  var sp = HW.sparks(ctx, { bursts: bursts, size: 70, gravity: 7 });

  /* the scan sheet: a laser plane walking through the twelve layers (front = layer 1) */
  var scanMat = new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform float uOn; varying vec2 vUv; void main(){ float e = smoothstep(0.0,0.03,vUv.y)*smoothstep(0.0,0.03,1.0-vUv.y)*smoothstep(0.0,0.02,vUv.x)*smoothstep(0.0,0.02,1.0-vUv.x); float edge = 1.0 - smoothstep(0.0, 0.012, min(min(vUv.x,1.0-vUv.x)*0.6, min(vUv.y,1.0-vUv.y))); vec3 c = vec3(0.25,1.6,1.35)*(0.10*e + edge*1.4); gl_FragColor = vec4(c*uOn, 1.0); }",
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  var scan = new THREE.Mesh(new THREE.PlaneGeometry(LAT.size[0] + 1.6, LAT.top + 1.0), scanMat);
  scan.position.set(0, (LAT.top + 1.0) / 2 - 0.2, FRONT);
  scene.add(scan);
  var SCAN0 = b4 + 0.2, SCAN1 = tMillion - 0.1;

  /* the twelve layers, numbered on the right edge (front = layer 1), plus one header */
  var layerLbl = [];
  for (var sl = 0; sl < 12; sl++) {
    var lab = HW.label(ctx, String(12 - sl), { height: 0.3, weight: 800, color: "#e6f3ff", bg: "rgba(5,10,16,0.94)", border: "rgba(99,168,236,0.7)" });
    var tp = LAT.tilePos(39, 23, sl);
    lab.position.set(LAT.right + 0.45, LAT.top + 0.4, tp[2]);
    lab.rotation.y = Math.PI / 2;
    scene.add(lab);
    layerLbl.push({ m: lab, z: tp[2] });
  }
  var layersHdr = HW.label(ctx, "12 layers", { height: 0.34, weight: 800, upper: true, color: "#ffd37a", bg: "rgba(5,10,16,0.94)", border: "rgba(255,176,32,0.65)" });
  layersHdr.position.set(LAT.right + 0.45, LAT.top + 1.25, 0);
  layersHdr.rotation.y = Math.PI / 2;
  scene.add(layersHdr);

  /* ── the camera: a shot list, cuts on the beats ── */
  function lp(a, b, p) { return HW.keys(p, [{ t: 0, v: a }, { t: 1, v: b, e: "lin" }]); }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: HW.add3(lp([-15.5, 2.0, 23.5], [-11.5, 3.0, 19.0], e), HW.shake(t, 0.05, 1.2, 2)), look: lp([0, 4.2, 0], [0.5, 4.5, 1.2], e), fov: 38 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([3.4, 5.0, 20.8], [1.6, 4.25, 17.9], e), HW.shake(t, 0.03, 1, 3)), look: lp([0.4, 3.75, CHAT[2]], [0.15, 3.6, CHAT[2]], e), fov: 36 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.outExpo(HF3.span(p, 0, 0.42));
      return { pos: HW.add3(lp([1.6, 4.25, 17.9], [0.55, 3.75, 15.4], e), HW.kick(t, tAnkara, 0.06, 0.4)), look: [0.15, 3.55, CHAT[2]], fov: 36 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      var k = [0, 0, 0];
      for (var j = 0; j < NC; j += 7) k = HW.add3(k, HW.kick(t, launches[j] + FLY, 0.035, 0.25));
      return { pos: HW.add3(lp([-15.0, 7.0, 19.0], [-12.0, 6.0, 16.6], e), k), look: lp([0.5, 4.3, 4.6], [1.2, 4.4, 4.0], e), fov: 40 };
    } },
    { t: b4, cam: function (p, t) {
      var e = E.inOut(p);
      var pos = HW.orbit([1.5, 4.4, 0], 22.5, HF3.mix(1.02, 1.36, e), HF3.mix(0.2, 0.27, e));
      return { pos: HW.add3(pos, HW.shake(t, 0.04, 1, 5)), look: [2.0, 4.3, 0], fov: 38 };
    } },
    { t: b5, cam: function (p, t) {
      var e = E.out3(p);
      return { pos: lp([7.0, 14.0, 29.0], [2.5, 18.5, 33.5], e), look: [0, 4.0, 0], fov: 40 };
    } },
    { t: b6, cam: function (p, t, d) {
      var e = E.out2(p);
      var tEnd = d * p; /* local seconds into the shot */
      var whip = E.in3(HF3.span(tEnd, d - 0.32, d));
      var look = HW.add3(lp([1.8, 5.0, 0.5], [2.4, 4.9, 0.2], e), [whip * 18, 0, 0]);
      return { pos: HW.add3(HW.add3(lp([-10.5, 2.0, 17.0], [-8.4, 2.5, 14.2], e), HW.kick(t, tMoved, 0.06, 0.5)), [whip * 2.0, 0, 0]), look: look, fov: 40 };
    } },
  ], D);

  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    hud(t);

    /* lights: each bar flickers on, the key comes up with them */
    var lit = 0;
    for (var i = 0; i < 3; i++) {
      var on = t >= barOn[i] ? (t < barOn[i] + 0.09 ? (Math.floor((t - barOn[i]) * 60) % 2 ? 0.25 : 1) : 1) : 0;
      bars[i].material.color.setRGB(3.2 * on, 3.4 * on, 3.8 * on);
      lit += on / 3;
    }
    ctx.key.intensity = HF3.mix(0.35, 2.5, lit);
    LAT.u.uGlow.value = HF3.mix(0.25, 1.0, lit) + 0.6 * HW.pulse(t, tMoved, 0.05, 0.6);
    LAT.u.uFlash.value = 0.55 * HW.pulse(t, tMoved, 0.04, 0.7);
    LAT.u.uTime.value = t;

    /* the test chat: types, then the verdict on its own answer */
    var typeA = HF3.span(t, b1 + 0.25, b1 + 1.05), typeB = HF3.span(t, b1 + 1.2, tIstanbul + 0.1);
    var n = Math.floor(typeA * Q.length) + (typeA >= 1 ? Math.floor(typeB * A.length) : 0);
    var spec = { lines: [{ t: Q, color: "#9fc4ea" }, { t: A, weight: 700, color: t >= tIstanbul ? "#ff9a9a" : "#cfe3f5", strike: t >= tAnkara ? "#ff5c5c" : null }, { t: "✓ It's Ankara.", weight: 800, color: "#ffd37a", size: 50 }] };
    chat.redraw(spec, t >= tAnkara ? 1e9 : n);
    /* the chat lifts away before the scan so the side view is clean */
    var away = E.in3(HF3.span(t, b4 - 0.05, b4 + 0.45));
    var enter = E.outBack(HF3.span(t, b1 - 0.12, b1 + 0.38));
    chat.group.position.set(CHAT[0], CHAT[1] + away * 14 - (1 - enter) * 3.2, CHAT[2] + (1 - enter) * 2.0);
    chat.group.rotation.x = (1 - enter) * -0.5;
    chat.group.scale.setScalar((1 + 0.04 * HW.pulse(t, tAnkara, 0.05, 0.3)) * Math.max(enter, 0.001));
    chat.group.visible = t >= b1 - 0.12 && away < 0.999;

    /* the corrections */
    for (var k = 0; k < NC; k++) {
      var pk = (t - launches[k]) / FLY;
      if (pk < 0 || pk > 1) { m4.makeScale(0, 0, 0); cards.setMatrixAt(k, m4); continue; }
      var e = E.in2(pk);
      v.set(HF3.mix(from[k][0], to[k][0], e), HF3.mix(from[k][1], to[k][1], e) + Math.sin(pk * Math.PI) * 0.9, HF3.mix(from[k][2], to[k][2], e));
      eu.set(-0.25 + spin[k] * 0.3 * pk, spin[k] * 0.4, spin[k] * pk);
      q.setFromEuler(eu);
      var s = 0.9 + 0.2 * (1 - pk);
      sc.set(s, s, s);
      m4.compose(v, q, sc);
      cards.setMatrixAt(k, m4);
    }
    cards.instanceMatrix.needsUpdate = true;
    var hits = 0;
    for (k = 0; k < NC; k++) if (t >= launches[k] + FLY) hits++;
    cntAv.textContent = String(hits);
    sp.update(t);
    dust.update(t);

    /* the scan: front (layer 1) → back (layer 12), marking what it has checked */
    var ps = HF3.span(t, SCAN0, SCAN1);
    var z = HF3.mix(FRONT + 0.2, LAT.back - 0.2, E.inOut(ps));
    var scanOn = t >= SCAN0 - 0.1 && ps < 1 ? 1 : 0;
    scan.position.z = z;
    scanMat.uniforms.uOn.value = scanOn * (1 - 0.6 * HW.pulse(t, SCAN1, 0.3, 0.01));
    scan.visible = scanOn > 0;
    LAT.u.uScan.value.set(t >= SCAN0 - 0.1 ? z : 999, 0.55, t >= SCAN0 - 0.1 ? 1 : 0, t >= SCAN0 ? 0.9 : 0);
    var side = t >= b4 && t < b6;
    layersHdr.visible = side;
    for (var j = 0; j < 12; j++) {
      layerLbl[j].m.visible = side;
      var passed = t >= SCAN0 && z <= layerLbl[j].z + 0.05;
      layerLbl[j].m.material.color.setRGB(passed ? 0.75 : 0.3, passed ? 1.25 : 0.38, passed ? 1.1 : 0.48);
    }

    ctx.grid.material.uniforms.uPulse.value = 0.9 * HW.pulse(t, tMoved, 0.02, 1.2);
    var focus = null;
    if (t >= b4 && t < b5) { var cs = cam(t); focus = Math.hypot(cs.pos[0] - 2, cs.pos[1] - 4.4, cs.pos[2] - z); }
    ctx.render(t, cam, { focus: focus, flash: [0.09 * HW.pulse(t, tMoved, 0.03, 0.4), 0.13 * HW.pulse(t, tMoved, 0.03, 0.4), 0.18 * HW.pulse(t, tMoved, 0.03, 0.4)] });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
