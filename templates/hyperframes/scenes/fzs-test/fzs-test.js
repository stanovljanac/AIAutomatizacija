/* fzs-test — 024 SHORT s2 (3D, portrait). "I tested it … Not one had moved."
 *
 * The long cut's lab (fz-test), recomposed for 9:16 and run on the motion budget: the model is a tall
 * monolith of REAL GPT-2 weights; the test chat types the model's real wrong answer; a hundred
 * corrections shatter on the face; a laser sheet checks all twelve layers while the counter rolls to
 * the real parameter count; the two real SHA-256 fingerprints match character by character on "moved".
 * Then the KEY TAKE: the camera and the room settle, and the verdict is the only thing that moves.
 *
 * SHOTS (marks from S.beatAt + props.cues, read off the Short's alignment)
 *   A  0    lights on, push to the test chat        "I tested it on an open model … Istanbul."
 *   B  b1   a hundred corrections hit the ice       "I corrected it a hundred times."
 *   C  b2   orbit: the scan walks all 12 layers     "Then I checked every one of its … numbers."
 *   D  b3   front, still: fingerprints match        "Not one had moved."
 */
var S = HF.scene({ id: "fzs-test", width: 1080, height: 1920, frames: 404, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.37), b2 = S.beatAt(2, 0.55), b3 = S.beatAt(3, 0.89);
var tIstanbul = cue("istanbul", b1 - 1.2), tEvery = cue("every", b2 + 0.9), tMillion = cue("million", b2 + 2.5), tMoved = cue("moved", b3 + 0.4);
var Mm = props.measured || { params: 124439808, corrections: 100, fpBefore: "e563ffe10e2eefeaf9d9a869d4cb43369cdddbe6875789caec4e1abd7c6adfd9", fpAfterChats: "e563ffe10e2eefeaf9d9a869d4cb43369cdddbe6875789caec4e1abd7c6adfd9", measuredOn: "2026-10-08" };
var E = HW.E;

/* ── HUD (flat, opaque plates — MOTION_SPEC §13) ───────────────────────────── */
function spans(str) { var o = ""; for (var i = 0; i < str.length; i++) o += "<i>" + str[i] + "</i>" + (i === 31 ? "<br>" : ""); return o; }
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">' + (props.modelChip || "GPT-2 small · open model · run locally") + "</div>" +
  '<div class="hw-plate hw-count" id="cntA"><div class="lbl">corrections sent</div><div class="num red" id="cntAv">0</div></div>' +
  '<div class="hw-plate hw-count" id="cntB"><div class="lbl">numbers checked</div><div class="num ice" id="cntBv">0</div><div class="sub">every weight of GPT-2 small · measured ' + (Mm.measuredOn || "") + "</div></div>" +
  '<div class="hw-plate hw-hash" id="fp">' +
  '<div class="row"><span class="k">before</span><span class="v" id="fpA">' + spans(Mm.fpBefore) + "</span></div>" +
  '<div class="row"><span class="k">after 100</span><span class="v" id="fpB">' + spans(Mm.fpAfterChats) + "</span></div>" +
  '<div class="verdict" id="verdict">identical · SHA-256 of all weights</div></div>' +
  '<div class="hw-plate hw-take" id="take"><span class="g">0</span> of 124,439,808<br>numbers changed<i class="ul" id="ul"></i></div>';

var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#cntA", "#cntB", "#fp", "#take"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, 0.4);
tl.to("#chip", { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, b1 - 0.25);
HW.fromTo(tl, "#cntA", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b1);
tl.to("#cntA", { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, b2 - 0.05);
HW.fromTo(tl, "#cntB", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b2 + 0.15);
HW.count(tl, document.getElementById("cntBv"), 0, Mm.params || 124439808, tEvery - 0.35, Math.max(tMillion - tEvery + 0.5, 0.6), "power2.inOut");
tl.to("#cntB", { opacity: 0, y: -20, duration: 0.22, ease: "power2.in" }, b3 - 0.3);
HW.fromTo(tl, "#fp", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b3 - 0.3);
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tMoved + 0.1);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tMoved + 0.3);
HF.register("fzs-test", tl);

/* the fingerprint comparison is a pure function of time — runs left→right, lands on "moved" */
var fpA = document.getElementById("fpA").getElementsByTagName("i"), fpB = document.getElementById("fpB").getElementsByTagName("i");
var verdict = document.getElementById("verdict"), cntAv = document.getElementById("cntAv");
function hud(t) {
  var p = HF3.span(t, b3 - 0.05, tMoved);
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
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 52, bloom: 0.58, bloomWide: 0.48, maxCoc: 11, range: 9, motion: M });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, cols: 20, rows: 44, slices: 12 });
  var FRONT = LAT.front, MID = LAT.top / 2;

  /* lab lights: three practical bars that come on one by one */
  var bars = [];
  for (var i = 0; i < 3; i++) {
    var bar = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 0.22), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    bar.position.set(0, 20.5, -3 + i * 3.4);
    scene.add(bar);
    bars.push(bar);
  }
  var barOn = [0.1, 0.28, 0.46];
  var dust = HW.dust(ctx, { count: 700, box: [50, 30, 60], center: [0, 11, 2], color: [0.55, 0.72, 1.0], alpha: 0.36 });

  /* the test chat: real model output, typed */
  var Q = "User: What is the capital of Turkey?";
  var A = "AI: " + (Mm.freshAnswer || "The capital of Turkey is Istanbul.");
  var chat = HW.card(ctx, { w: 5.0, style: "glass", label: "test chat · gpt-2", size: 44,
    lines: [{ t: Q, color: "#9fc4ea" }, { t: A, weight: 700 }, { t: "✓ It's Ankara.", weight: 800, color: "#ffd37a", size: 50 }] });
  var CHAT = [0, 7.0, 10.5];
  chat.group.position.set(CHAT[0], CHAT[1], CHAT[2]);
  scene.add(chat.group);

  /* a hundred corrections: one texture, instanced, each a pure function of its launch time */
  var corr = HW.card(ctx, { w: 2.6, style: "wrong", size: 40, lines: [{ t: "That's wrong.", weight: 800 }, { t: "It's Ankara.", weight: 600, color: "#ffc2c2" }] });
  var cMat = new THREE.MeshStandardMaterial({ map: corr.mat.map, emissiveMap: corr.mat.map, emissive: 0xffffff, emissiveIntensity: 0.75, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.5 });
  var NC = Mm.corrections || 100;
  var cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(corr.w, corr.h), cMat, NC);
  cards.frustumCulled = false;
  scene.add(cards);
  var r = HF3.rng(41), FLY = 0.42, VOL = Math.max(cue("hundred", b1 + 0.9) + 0.9 - b1, 1.6);
  var launches = [], from = [], to = [], spin = [], bursts = [];
  for (var k = 0; k < NC; k++) {
    var L = b1 + 0.05 + VOL * Math.pow(k / (NC - 1), 0.85);
    launches.push(L);
    from.push([CHAT[0] + (r() - 0.5) * 4.6, CHAT[1] + (r() - 0.5) * 2.4, CHAT[2] + 0.3]);
    var tgt = [(r() - 0.5) * 10.4, 1.4 + r() * 13.6, FRONT + 0.06];
    to.push(tgt);
    spin.push((r() - 0.5) * 2.0);
    bursts.push({ t: L + FLY, p: [tgt[0], tgt[1], tgt[2] + 0.05], n: 14, speed: 3.4, up: 0.6, spread: [1, 1, 0.6], color: k % 3 ? [1.2, 2.2, 3.4] : [3.2, 1.0, 0.8], life: 0.65 });
  }
  var sp = HW.sparks(ctx, { bursts: bursts, size: 70, gravity: 7 });

  /* the scan sheet: a laser plane walking through the twelve layers (front = layer 1) */
  var scanMat = new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    /* dimmer than the long cut's sheet (0.05 fill / 0.9 edge vs 0.10 / 1.4): seen side-on in portrait it
       filled a third of the frame with glare */
    fragmentShader: "uniform float uOn; varying vec2 vUv; void main(){ float e = smoothstep(0.0,0.03,vUv.y)*smoothstep(0.0,0.03,1.0-vUv.y)*smoothstep(0.0,0.02,vUv.x)*smoothstep(0.0,0.02,1.0-vUv.x); float edge = 1.0 - smoothstep(0.0, 0.012, min(min(vUv.x,1.0-vUv.x)*0.6, min(vUv.y,1.0-vUv.y))); vec3 c = vec3(0.25,1.6,1.35)*(0.05*e + edge*0.9); gl_FragColor = vec4(c*uOn, 1.0); }",
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  var scan = new THREE.Mesh(new THREE.PlaneGeometry(LAT.size[0] + 1.6, LAT.top + 1.0), scanMat);
  scan.position.set(0, (LAT.top + 1.0) / 2 - 0.2, FRONT);
  scene.add(scan);
  var SCAN0 = b2 + 0.2, SCAN1 = Math.max(tMillion + 0.5, b2 + 2.4);

  /* the twelve layers, numbered on the right edge (front = layer 1), plus one header */
  var layerLbl = [];
  for (var sl = 0; sl < 12; sl++) {
    var lab = HW.label(ctx, String(12 - sl), { height: 0.36, weight: 800, color: "#e6f3ff", bg: "rgba(5,10,16,0.94)", border: "rgba(99,168,236,0.7)" });
    var tp = LAT.tilePos(19, 43, sl);
    lab.position.set(LAT.right + 0.5, LAT.top + 0.4, tp[2]);
    lab.rotation.y = Math.PI / 2;
    scene.add(lab);
    layerLbl.push({ m: lab, z: tp[2] });
  }
  var layersHdr = HW.label(ctx, "12 layers", { height: 0.42, weight: 800, upper: true, color: "#ffd37a", bg: "rgba(5,10,16,0.94)", border: "rgba(255,176,32,0.65)" });
  layersHdr.position.set(LAT.right + 0.5, LAT.top + 1.2, 0);
  layersHdr.rotation.y = Math.PI / 2;
  scene.add(layersHdr);

  /* ── camera: a shot list, cuts on the beats ── */
  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(HF3.span(t, 0.25, 1.6));
      return { pos: lp([-3.5, 10.5, 36.0], [0.25, 7.3, 22.6], e), look: lp([0, 9.0, 0], [0.05, 7.05, CHAT[2]], e), fov: 52 };
    } },
    { t: b1, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([-10.2, 10.6, 28.5], [-9.0, 10.2, 26.2], e), look: lp([0.6, 8.4, 4.0], [0.9, 8.3, 3.6], e), fov: 52 };
    } },
    { t: b2, cam: function (p) {
      var e = E.inOut(p);
      return { pos: HW.orbit([1.2, MID + 1.6, 0], 30.0, HF3.mix(0.86, 1.06, e), HF3.mix(0.12, 0.16, e)), look: [1.6, MID + 1.6, 0], fov: 52 };
    } },
    { t: b3, cam: function (p) {
      var e = E.out2(p);
      return { pos: lp([-4.6, 7.6, 30.0], [-3.9, 7.6, 28.8], e), look: [0.3, 8.6, 0], fov: 52 };
    } },
  ], D, { motion: M, kick: function (t) { return HW.kick(t, tMoved, 0.05, 0.5); } });

  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var amb = M.amb(t), fo = M.focus(t);
    hud(t);

    var lit = 0;
    for (var i = 0; i < 3; i++) {
      var on = t >= barOn[i] ? (t < barOn[i] + 0.09 ? (Math.floor((t - barOn[i]) * 60) % 2 ? 0.25 : 1) : 1) : 0;
      bars[i].material.color.setRGB(3.2 * on, 3.4 * on, 3.8 * on);
      lit += on / 3;
    }
    ctx.key.intensity = HF3.mix(0.35, 2.5, lit);
    LAT.u.uGlow.value = HF3.mix(0.25, 1.0, lit) + 0.5 * HW.pulse(t, tMoved, 0.05, 0.6);
    LAT.u.uFlash.value = 0.45 * HW.pulse(t, tMoved, 0.04, 0.7);
    LAT.u.uTime.value = amb;

    /* the test chat: types, then the verdict on its own answer */
    var typeA = HF3.span(t, 0.7, 1.5), typeB = HF3.span(t, 1.6, tIstanbul + 0.1);
    var n = Math.floor(typeA * Q.length) + (typeA >= 1 ? Math.floor(typeB * A.length) : 0);
    var tFix = tIstanbul + 0.45;
    var spec = { lines: [{ t: Q, color: "#9fc4ea" }, { t: A, weight: 700, color: t >= tIstanbul ? "#ff9a9a" : "#cfe3f5", strike: t >= tFix ? "#ff5c5c" : null }, { t: "✓ It's Ankara.", weight: 800, color: "#ffd37a", size: 50 }] };
    chat.redraw(spec, t >= tFix ? 1e9 : Math.min(n, Q.length + A.length));
    var away = E.in3(HF3.span(t, b2 - 0.1, b2 + 0.4));
    var enter = E.outBack(HF3.span(t, 0.35, 0.8));
    chat.group.position.set(CHAT[0], CHAT[1] + away * 16 - (1 - enter) * 3.0, CHAT[2] + (1 - enter) * 2.0);
    chat.group.rotation.x = (1 - enter) * -0.5;
    chat.group.scale.setScalar(Math.max(enter, 0.001));
    chat.group.visible = t >= 0.35 && away < 0.999;

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
    dust.update(amb);
    dust.u.uA.value = 0.36 * (1 - 0.5 * fo);

    /* the scan: front (layer 1) → back (layer 12), marking what it has checked */
    var ps = HF3.span(t, SCAN0, SCAN1);
    var z = HF3.mix(FRONT + 0.2, LAT.back - 0.2, E.inOut(ps));
    var scanOn = t >= SCAN0 - 0.1 && ps < 1 ? 1 : 0;
    scan.position.z = z;
    scanMat.uniforms.uOn.value = scanOn * (1 - 0.6 * HW.pulse(t, SCAN1, 0.3, 0.01));
    scan.visible = scanOn > 0;
    LAT.u.uScan.value.set(t >= SCAN0 - 0.1 ? z : 999, 0.55, t >= SCAN0 - 0.1 ? 1 : 0, t >= SCAN0 ? 0.9 : 0);
    var side = t >= b2 && t < b3;
    layersHdr.visible = side;
    for (var j = 0; j < 12; j++) {
      layerLbl[j].m.visible = side;
      var passed = t >= SCAN0 && z <= layerLbl[j].z + 0.05;
      layerLbl[j].m.material.color.setRGB(passed ? 0.75 : 0.3, passed ? 1.25 : 0.38, passed ? 1.1 : 0.48);
    }

    ctx.grid.material.uniforms.uPulse.value = 0.8 * HW.pulse(t, tMoved, 0.02, 1.2);
    var focus = null;
    if (t >= b2 && t < b3) { var cs = cam(t); focus = Math.hypot(cs.pos[0] - 1.6, cs.pos[1] - MID - 1.6, cs.pos[2] - z); }
    var fl = HW.pulse(t, tMoved, 0.03, 0.4);
    ctx.render(t, cam, { focus: focus, flash: [0.08 * fl, 0.12 * fl, 0.16 * fl] });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
