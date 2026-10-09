/* fz-memory — 024 s7 (3D). "But my app has memory, you say."
 *
 * PREMISE. The objection deserves an honest mechanism, not a dismissal — and the mechanism is just
 * more of what the viewer already understands: a MEMORY cabinet beside the context window. A note is
 * written from the old chat and filed; the chat is cleared; in the next chat the drawer opens and the
 * note is laid on the empty pile FIRST, before the question. The read beam reads it — "Ankara ✓" —
 * and the block it reads through has not changed by a single tile. Then the honest second half: the
 * camera cranes up and back to show where chats DO go if you allow it — a river of them flowing to a
 * forge on the horizon where a FUTURE block is being built — and swoops back to today's block, frozen.
 * Sources: Anthropic memory-tool docs (memory is files read back into later conversations) and
 * Anthropic's Aug 2025 consumer-terms post ("models released today began development 18 to 24 months
 * ago"), quoted on screen.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    the MEMORY cabinet rises beside the window           "But my app has memory, you say."
 *   B  b1   note written, filed; next chat: note goes on top     "…it saves a note about you, and reads it back in the next chat."
 *   C  b2   the beam reads note + question → Ankara ✓            "Still reading."
 *   D  b3   macro on the block: unchanged                        "Not learning."
 *   E  b4   crane: the river of chats → the future forge         "And if you let a company train on your chats, they feed a future model."
 *   F  b5   swoop back to today's frozen block                   "The one you're talking to today never changes."
 */
var S = HF.scene({ id: "fz-memory", width: 1920, height: 1080, frames: 499, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
/* word marks: each typed offset below was read off the draft (edge-tts) alignment; a re-voice (the Azure
   final) re-reads them into props.offsets — absent, every mark is exactly the typed value */
var OFF = props.offsets || {};
function off(k, v) { return typeof OFF[k] === "number" ? OFF[k] : v; }
var b1 = S.beatAt(1, 0.136), b2 = S.beatAt(2, 0.459), b3 = S.beatAt(3, 0.525), b4 = S.beatAt(4, 0.583), b5 = S.beatAt(5, 0.828);
var tMemory = off("Memory", 0.57), tSaves = b1 + off("Saves", 1.95), tNote = b1 + off("Note", 2.26), tReads = b1 + off("Reads", 3.63), tChat = b1 + off("Chat", 4.60);
var tTrain = b4 + off("Train", 0.72), tChats = b4 + off("Chats", 1.18), tFeed = b4 + off("Feed", 2.18), tFuture = b4 + off("Future", 2.78), tToday = b5 + off("Today", 0.83), tNever = b5 + off("Never", 1.54);
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="kick">Memory is a <span class="g">note</span> it re-reads.</div>' +
  '<div class="hw-plate hw-tag ok" id="rd">reading ✓</div>' +
  '<div class="hw-plate hw-count" id="nl"><div class="lbl">learning</div><div class="num red">✗ 0 numbers changed</div></div>' +
  '<div class="hw-plate hw-chip" id="src">' + (props.futureChip || "“Models released today began development 18 to 24 months ago.” — Anthropic, Aug 2025") + "</div>" +
  '<div class="hw-plate hw-tag" id="fut">a future model</div>' +
  '<div class="hw-plate hw-tag ice" id="tod">today’s model · unchanged</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#kick", "#rd", "#nl", "#src", "#fut", "#tod"], { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tReads - 0.1);
tl.to("#kick", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b4 + 0.05);
HW.fromTo(tl, "#rd", { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.2, ease: "power4.out" }, b2 + 0.05);
tl.to("#rd", { opacity: 0, duration: 0.15 }, b3 - 0.05);
HW.fromTo(tl, "#nl", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.2, ease: "power4.out" }, b3 + 0.05);
tl.to("#nl", { opacity: 0, duration: 0.18 }, b4 + 0.05);
HW.fromTo(tl, "#src", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tFeed);
tl.to("#src", { opacity: 0, y: 20, duration: 0.2, ease: "power2.in" }, b5 + 0.05);
HW.fromTo(tl, "#fut", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tFuture - 0.1);
tl.to("#fut", { opacity: 0, duration: 0.2 }, b5 + 0.05);
HW.fromTo(tl, "#tod", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tToday - 0.1);
HF.register("fz-memory", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.6, bloomWide: 0.55, maxCoc: 11, range: 10, far: 320, fogD: 0.0085 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front, BACK = LAT.back, LC = LAT.center;
  /* the future block, far away, under construction */
  var FUT = [-21, 0, -42];
  var LAT2 = HW.lattice(ctx, { sets: props.sets, seed: 23, reflect: false });
  LAT2.place(FUT[0], FUT[1], FUT[2], 1.15);
  var forge = new THREE.PointLight(0xffa030, 0, 120, 1.2); forge.position.set(FUT[0], 8, FUT[2] + 6); scene.add(forge);
  var scaf = HW.frameBox(ctx, 29, 12, 9, { thick: 0.12, color: [2.4, 1.3, 0.35] });
  var futLbl = HW.label(ctx, "next version", { height: 0.9, weight: 800, upper: true, color: "#ffd37a", bg: "rgba(12,8,2,0.92)", border: "rgba(255,176,32,0.8)" });
  futLbl.position.set(FUT[0], 13.6, FUT[2] + 4.6); scene.add(futLbl);
  scaf.group.position.set(FUT[0], 6, FUT[2]);
  var dust = HW.dust(ctx, { count: 900, box: [110, 30, 140], center: [-10, 10, -30], color: [0.7, 0.78, 1.0], alpha: 0.35 });

  /* the window */
  var PZ = 10.6;
  var ped = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.0, 4.6), new THREE.MeshStandardMaterial({ color: 0x0c141d, roughness: 0.35, metalness: 0.6 }));
  ped.position.set(0, 0.5, PZ); ped.castShadow = true; ped.receiveShadow = true; scene.add(ped);
  var stripF = HW.frameBox(ctx, 6.42, 0.001, 4.62, { thick: 0.045, color: [0.3, 0.75, 1.6] }); stripF.group.position.set(0, 1.0, PZ);
  var frame = HW.frameBox(ctx, 5.8, 3.2, 4.2, { thick: 0.045, color: [0.35, 0.85, 1.8], glass: 0.3 }); frame.group.position.set(0, 2.6, PZ);
  var lbl = HW.label(ctx, "context window", { height: 0.3, weight: 800, upper: true, color: "#cfe6ff" }); lbl.position.set(0, 4.42, PZ + 2.1); /* on the frame top bar — never in the caption band */ scene.add(lbl);

  /* the MEMORY cabinet */
  var CAB = [-6.4, 0, PZ - 0.2];
  var cab = new THREE.Group(); cab.position.set(CAB[0], CAB[1], CAB[2]); scene.add(cab);
  var cbody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 2.2), new THREE.MeshStandardMaterial({ color: 0x1a1408, roughness: 0.4, metalness: 0.55 }));
  cbody.position.y = 1.7; cbody.castShadow = true; cab.add(cbody);
  var drawers = [];
  for (var d = 0; d < 3; d++) {
    var dr = new THREE.Group();
    var front = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.95, 0.12), new THREE.MeshStandardMaterial({ color: 0x2b1f0b, roughness: 0.35, metalness: 0.6 }));
    var handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.5, 0.4) }));
    handle.position.set(0, 0, 0.1);
    var box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.9), new THREE.MeshStandardMaterial({ color: 0x120d05, roughness: 0.6 }));
    box.position.z = -0.95;
    dr.add(front); dr.add(handle); dr.add(box);
    dr.position.set(0, 2.85 - d * 1.08, 1.12);
    cab.add(dr); drawers.push(dr);
  }
  var clbl = HW.label(ctx, "memory", { height: 0.36, weight: 800, upper: true, color: "#ffd37a", bg: "rgba(10,8,4,0.94)", border: "rgba(255,176,32,0.7)" });
  clbl.position.set(0, 3.85, 1.12); cab.add(clbl);

  function page(lines, style, glow, w) {
    var c = HW.card(ctx, { w: w || 4.4, style: style, size: style === "page" ? 38 : 44, radius: 0.1, depth: 0.04, lines: lines.map(function (l) { return { t: l, weight: style === "page" ? 600 : 800 }; }), minH: 1.5, glow: glow });
    scene.add(c.group); return c;
  }
  /* the old chat on the pile */
  var old = [page(["Hi! Quick question about our trip."], "page", 0.22), page(["What's the capital of Turkey?"], "user", 0.5), page(["No, that's wrong.", "It's Ankara."], "wrong", 0.55)];
  var note = HW.card(ctx, { w: 4.6, style: "note", label: "memory · saved note", size: 40, radius: 0.12, depth: 0.04, lines: [{ t: "User says the capital of Turkey is Ankara.", weight: 700 }], glow: 0.35 });
  scene.add(note.group);
  var q2 = page(["What's the capital of Turkey?"], "user", 0.5);

  var rbeam = HW.beam(ctx, { color: [2.4, 1.6, 0.6] });
  var good = HW.card(ctx, { w: 3.8, style: "good", label: "answer", size: 66, radius: 0.24, align: "center", lines: [{ t: "Ankara ✓", weight: 800 }], glow: 0.7 });
  scene.add(good.group);
  var OUT0 = [2.0, 3.5, BACK - 1.5], OUT1 = [4.2, 7.0, FRONT + 2.4];

  /* the river of chats to the future forge */
  var bub = HW.card(ctx, { w: 1.6, style: "gold", size: 40, radius: 0.3, lines: [{ t: "chat · · ·", weight: 700 }], glow: 0.9 });
  var NB = 1400;
  var bg0 = new THREE.PlaneGeometry(1, 0.42);
  var bg = new THREE.InstancedBufferGeometry();
  bg.index = bg0.index; bg.setAttribute("position", bg0.getAttribute("position")); bg.setAttribute("uv", bg0.getAttribute("uv"));
  bg.instanceCount = NB;
  var aS = new Float32Array(NB * 3), aC = new Float32Array(NB * 3), aE = new Float32Array(NB * 3), aP = new Float32Array(NB * 2);
  var r = HF3.rng(77);
  for (var i = 0; i < NB; i++) {
    var sx = -85 + r() * 58, sz = -6 + r() * 36;
    aS.set([sx, 0.6 + r() * 2.5, sz], i * 3);
    aC.set([(sx + FUT[0]) / 2 + (r() - 0.5) * 20, 9 + r() * 14, (sz + FUT[2]) / 2 + (r() - 0.5) * 16], i * 3);
    aE.set([FUT[0] + (r() - 0.5) * 18, 3 + r() * 8, FUT[2] + 6 + (r() - 0.5) * 6], i * 3);
    aP.set([r(), 0.06 + r() * 0.08], i * 2);
  }
  bg.setAttribute("aS", new THREE.InstancedBufferAttribute(aS, 3));
  bg.setAttribute("aC", new THREE.InstancedBufferAttribute(aC, 3));
  bg.setAttribute("aE", new THREE.InstancedBufferAttribute(aE, 3));
  bg.setAttribute("aP", new THREE.InstancedBufferAttribute(aP, 2));
  var riverMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uMap: { value: bub.mat.map }, uFogCol: { value: ctx.fogColor }, uFogD: { value: ctx.scene.fog.density } },
    vertexShader: [
      "attribute vec3 aS; attribute vec3 aC; attribute vec3 aE; attribute vec2 aP; uniform float uTime, uOn; varying vec2 vUv; varying float vD; varying float vA;",
      "void main(){",
      "  float f = fract(aP.x + uTime*aP.y);",
      "  vec3 c = mix(mix(aS, aC, f), mix(aC, aE, f), f);",
      "  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);",
      "  float vis = step(aP.x, uOn) * smoothstep(0.0, 0.06, f) * (1.0 - smoothstep(0.92, 1.0, f));",
      "  vec3 wp = c + (right*position.x + up*position.y) * 2.6 * vis;",
      "  vUv = uv; vec4 mv = viewMatrix*vec4(wp,1.0); vD = -mv.z; vA = vis;",
      "  gl_Position = projectionMatrix*mv;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uMap; uniform vec3 uFogCol; uniform float uFogD; varying vec2 vUv; varying float vD; varying float vA;",
      "void main(){ vec4 t = texture2D(uMap, vUv); if (t.a < 0.5 || vA < 0.01) discard;",
      "  vec3 col = t.rgb * 1.6; float fog = 1.0 - exp(-uFogD*uFogD*vD*vD*0.45); gl_FragColor = vec4(mix(col, uFogCol, fog), 1.0); }",
    ].join("\n"),
  });
  var river = new THREE.Mesh(bg, riverMat); river.frustumCulled = false; scene.add(river);
  var sp = HW.sparks(ctx, { bursts: [{ t: tNote + 0.35, p: [CAB[0], 2.9, CAB[2] + 1.4], n: 70, speed: 3, up: 1.5, color: [3.2, 2.0, 0.6], life: 0.6 }], size: 60 });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([-15.0, 4.8, 23.0], [-11.0, 4.2, 20.2], e), HW.shake(t, 0.03, 1, 2)), look: lp([-3.5, 2.2, PZ], [-3.2, 2.2, PZ], e), fov: 38 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([-8.6, 5.8, 19.8], [-5.2, 5.0, 18.6], e), look: lp([-3.4, 2.6, PZ], [-1.6, 2.0, PZ], e), fov: 38 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([12.5, 6.2, 20.0], [11.2, 6.8, 17.8], e), look: lp([1.6, 4.0, 6.5], [2.4, 4.8, 5.5], e), fov: 40 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([2.6, 5.0, FRONT + 2.7], [0.9, 5.1, FRONT + 2.2], e), look: lp([1.6, 5.0, FRONT], [0.3, 5.0, FRONT], e), fov: 34, focus: 2.5 };
    } },
    { t: b4, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([8.0, 7.0, 25.0], [14.0, 17.0, 34.0], e), look: lp([0, 4.0, 2.0], [-15.0, 4.0, -30.0], e), fov: 40 };
    } },
    { t: b5, cam: function (p, t) {
      var e = E.out3(p);
      return { pos: HW.add3(lp([20.0, 11.0, 33.0], [16.0, 5.2, 24.0], e), HW.kick(t, tNever, 0.05, 0.4)), look: lp([-8.0, 3.5, -22.0], [-6.5, 4.4, -14.0], e), fov: 40 };
    } },
  ], D);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t; LAT2.u.uTime.value = t;
    ctx.post.uniforms.uRange.value = t >= b3 && t < b4 ? 2.2 : 10;

    /* cabinet rises; the top drawer opens to file the note and again to hand it back */
    var rise = E.outBack(HF3.span(t, 0.1, 0.9));
    cab.position.y = CAB[1] - 3.6 * (1 - rise);
    var openA = E.out3(HF3.span(t, tSaves - 0.2, tSaves + 0.15)) * (1 - E.in2(HF3.span(t, tNote + 0.45, tNote + 0.7)));
    var openB = E.out3(HF3.span(t, tReads - 0.6, tReads - 0.3)) * (1 - E.in2(HF3.span(t, tReads + 0.2, tReads + 0.45)));
    drawers[0].position.z = 1.12 + 1.3 * Math.max(openA, openB);

    /* the old pile, then cleared for the next chat */
    var clear = E.in2(HF3.span(t, tNote + 0.6, tNote + 1.0));
    for (var k = 0; k < old.length; k++) {
      old[k].group.position.set(0.05 * k, 1.06 + k * 0.075 - clear * 1.2, PZ);
      old[k].group.rotation.set(-Math.PI / 2, 0, (k - 1) * 0.05);
      old[k].group.visible = clear < 0.99;
    }
    /* the note: written above the pile, filed, then pasted FIRST on the next pile */
    var NOTE_W = [-1.2, 3.6, PZ + 0.6], NOTE_IN = [CAB[0], 2.85, CAB[2] + 1.6], NOTE_TOP = [0, 1.06, PZ];
    var w0 = E.outBack(HF3.span(t, tSaves - 0.35, tSaves + 0.05));
    var f1 = E.inOut(HF3.span(t, tNote - 0.05, tNote + 0.4));
    var f2 = E.inOut(HF3.span(t, tReads - 0.45, tReads + 0.05));
    var npos, nrx, nsc = 1;
    if (t < tNote + 0.4) { npos = lp(NOTE_W, NOTE_IN, f1); nrx = HF3.mix(-0.25, 0, f1); nsc = Math.max(w0, 0.0001) * HF3.mix(1, 0.45, f1); }
    else if (t < tReads - 0.45) { npos = NOTE_IN; nrx = 0; nsc = 0.0001; }
    else { npos = lp(NOTE_IN, NOTE_TOP, f2); npos[1] += Math.sin(f2 * Math.PI) * 1.4; nrx = HF3.mix(0, -Math.PI / 2, f2); nsc = HF3.mix(0.45, 1, f2); }
    note.group.position.set(npos[0], npos[1], npos[2]);
    note.group.rotation.set(nrx, 0, 0.02);
    note.group.scale.setScalar(nsc);
    note.group.visible = t >= tSaves - 0.35;
    note.redraw({}, Math.floor(HF3.span(t, tSaves - 0.2, tNote + 0.1) * 60));
    /* the new question lands on top of the note */
    var qp = E.out3(HF3.span(t, tChat - 0.45, tChat));
    q2.group.visible = t >= tChat - 0.45;
    var qpos = lp([2, 6.0, 18], [0.1, 1.14, PZ], qp); qpos[1] += Math.sin(qp * Math.PI) * 1.0;
    q2.group.position.set(qpos[0], qpos[1], qpos[2]);
    q2.group.rotation.set(HF3.mix(-0.35, -Math.PI / 2, E.inOut(qp)), 0, -0.03);

    /* still reading */
    var reading = t >= b2 - 0.1 && t < b3;
    var hd = E.out2(HF3.span(t, b2 - 0.1, b2 + 0.2));
    rbeam.set([0, 1.6, PZ], [0, LC[1], FRONT], 0.11, reading ? 1 : 0, hd, t);
    var lit = HF3.span(t, b2 + 0.1, b3 - 0.1);
    LAT.u.uBeamA.value.set(0, LC[1], FRONT); LAT.u.uBeamB.value.set(0, LC[1], HF3.mix(FRONT, BACK, lit));
    LAT.u.uBeam.value.set(1.3, reading && t > b2 + 0.1 ? 1 : 0);
    LAT.u.uSlice.value.set(reading && lit > 0 ? 11 - lit * 11.999 : -1, reading && lit > 0 ? 0.8 : 0);
    var wp = E.inOut(HF3.span(t, b2 + 0.4, b3 - 0.15));
    good.group.visible = t >= b2 + 0.4 && t < b3 + 0.05;
    var w = lp(OUT0, OUT1, wp); w[1] += Math.sin(wp * Math.PI) * 2.0;
    good.group.position.set(w[0], w[1], w[2]); good.group.rotation.set(-0.12, 0.45, 0);
    good.group.scale.setScalar(Math.max(E.outBack(HF3.span(t, b2 + 0.4, b2 + 0.7)), 0.0001));

    /* the future: chats flow to the forge, the new block rises in its scaffold */
    riverMat.uniforms.uOn.value = E.inOut(HF3.span(t, tTrain - 0.2, tFeed + 0.4));
    riverMat.uniforms.uTime.value = t;
    river.visible = t >= tTrain - 0.2;
    LAT2.u.uHeat.value = 1; LAT2.u.uShiver.value = 1; LAT2.u.uChurn.value = 14 * t;
    LAT2.u.uBuild.value = HF3.mix(0.6, 7.2, E.inOut(HF3.span(t, tTrain, D)));
    forge.intensity = 260 * E.out2(HF3.span(t, tTrain - 0.4, tTrain + 0.4));
    LAT.u.uFlash.value = 0.18 * HW.pulse(t, tNever, 0.05, 0.6);
    sp.update(t); dust.update(t);

    var cs = cam(t);
    ctx.render(t, cam, { focus: cs.focus || null });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
