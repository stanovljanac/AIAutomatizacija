/* fz-hook — 024 s1, HOOK (3D, black + gold). "Correcting your AI teaches it nothing."
 *
 * PREMISE. Thesis first, in one physical event: the viewer's own correction is SENT from a real chat
 * window, the camera chases it across the dark, and it shatters on a wall of frozen numbers on the
 * word "nothing". Then the habit, escalated: three more corrections slam the ice; the model's
 * apologies multiply into a spiral tower (four real-sounding variants — the joke is that they are
 * cheap); a fresh chat wipes it all and makes the exact same mistake; the camera pulls back and the
 * chat is a speck in front of the thing that never changed. The pull-back ends on the lattice, which
 * is where s2 opens.
 *
 * SHOTS (marks from S.beatAt + word offsets read off alignment.json):
 *   A  0      send + chase, impact on "nothing"           "Correcting your AI teaches it nothing."
 *   B  b1     three more corrections slam the ice         "Not one 'no, that's wrong.'"
 *   C  b2     the apology spiral, craning orbit           "Not one 'you're absolutely right, I apologize.'"
 *   D  b3     whip to a fresh chat: same mistake          "Start a fresh chat, and the same mistake…"
 *   E  ~10.4  pull back: the chat in front of the block   "…comes right back."
 */
var S = HF.scene({ id: "fz-hook", width: 1920, height: 1080, frames: 337, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var b1 = S.beatAt(1, 0.234), b2 = S.beatAt(2, 0.374), b3 = S.beatAt(3, 0.659);
var tNothing = 1.88, tWrong = b1 + 0.78, tRight = b2 + 0.98, tChat = b3 + 0.63, tMistake = b3 + 1.77, tBack = b3 + 2.61;
var tPull = Math.min(b3 + 2.95, D - 0.75);
var E = HW.E;
var Q = props.question || "What's the capital of Turkey?";
var WRONG = props.wrong || "The capital of Turkey is Istanbul.";
var CORR = props.corrections || ["No, that's wrong.", "It's Ankara. Not Istanbul.", "Wrong again. ANKARA."];

/* ── HUD ───────────────────────────────────────────────────────────────────── */
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">Desk Lessons · <b>Ep. 5</b></div>' +
  '<div class="hw-stamp red" id="stamp">same mistake</div>' +
  '<div class="hw-plate hw-kicker" id="kick">You corrected it. It learned <span class="g">nothing.</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#stamp", "#kick"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, 0.15);
tl.to("#chip", { opacity: 0, x: -24, duration: 0.2, ease: "power2.in" }, b1 - 0.2);
HW.fromTo(tl, "#stamp", { opacity: 0, scale: 1.8, rotation: -3 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.2, ease: "power4.out" }, tBack - 0.04);
tl.to("#stamp", { opacity: 0, scale: 0.85, duration: 0.18, ease: "power2.in" }, tPull + 0.05);
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.5)" }, tPull + 0.12);
HF.register("fz-hook", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "hero", fov: 38, bloom: 0.65, bloomWide: 0.55, maxCoc: 12, range: 8 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front;
  /* a gold rim from behind so the ice reads in a black room */
  var back = new THREE.DirectionalLight(0xffb020, 1.1); back.position.set(0, 30, -12); scene.add(back);
  var dust = HW.dust(ctx, { count: 700, box: [70, 24, 70], center: [0, 9, 4], color: [1.0, 0.75, 0.35], alpha: 0.35 });

  /* the chat the correction is sent from */
  var CHA = [0, 4.3, 17.0];
  var chatA = HW.chat(ctx, { w: 7.0, h: 4.4, title: "Chat", accent: "#ffb020", size: 40 });
  chatA.group.position.set(CHA[0], CHA[1], CHA[2]);
  scene.add(chatA.group);

  /* the flying correction (matches the chat's user bubble) */
  function bubble(text, w) {
    return HW.card(ctx, { w: w || 4.6, style: "user", size: 46, radius: 0.32, lines: [{ t: text, weight: 700 }], bodyTint: 0x16314d, glow: 0.85 });
  }
  var B0 = bubble("No, that's wrong. It's Ankara.", 5.2);
  scene.add(B0.group);
  var IMP0 = [1.4, 5.0, FRONT + 0.06];
  var S0 = [1.3, 2.75, CHA[2] + 0.15];
  /* cubic bezier: out of the composer TOWARD the camera, up over the window's top edge, then a dive
     into the ice — it must clear the window (top at y≈6.5) before it passes behind it (z < 17) */
  var P1 = [1.6, 6.2, 21.2], P2 = [1.9, 9.6, 12.0];
  function path0(u) {
    var a = Math.pow(1 - u, 3), b = 3 * Math.pow(1 - u, 2) * u, c = 3 * (1 - u) * u * u, d = u * u * u;
    return [a * S0[0] + b * P1[0] + c * P2[0] + d * IMP0[0], a * S0[1] + b * P1[1] + c * P2[1] + d * IMP0[1], a * S0[2] + b * P1[2] + c * P2[2] + d * IMP0[2]];
  }
  var SEND = 0.22;
  function u0(t) { var p = HF3.span(t, SEND, tNothing); return 0.55 * E.out2(Math.min(p / 0.45, 1)) * Math.min(p / 0.45, 1) + 0.45 * E.in3(HF3.span(p, 0.45, 1)); }

  /* the barrage: three more corrections */
  var barrage = [], hitsB = [tWrong, tWrong + 0.36, tWrong + 0.66];
  var tgtB = [[-6.5, 6.4, FRONT + 0.06], [4.8, 3.2, FRONT + 0.06], [-1.2, 7.6, FRONT + 0.06]];
  var srcB = [[-14, 3.5, 22], [-4, 1.5, 24], [-10, 8.5, 23]];
  for (var i = 0; i < 3; i++) { var bb = bubble(CORR[i], 4.2); scene.add(bb.group); barrage.push(bb); }

  /* impacts: sparks + rings + flashes */
  var bursts = [{ t: tNothing, p: IMP0, n: 160, speed: 8, up: 1.0, spread: [1.2, 1, 0.7], color: [1.4, 2.4, 3.6], life: 1.0 },
                { t: tNothing, p: IMP0, n: 60, speed: 5, up: 1.5, spread: [1, 1, 0.6], color: [3.4, 2.0, 0.5], life: 0.8 }];
  for (i = 0; i < 3; i++) bursts.push({ t: hitsB[i], p: tgtB[i], n: 90, speed: 6, up: 1.0, spread: [1.2, 1, 0.7], color: i % 2 ? [3.4, 1.0, 0.8] : [1.4, 2.4, 3.6], life: 0.85 });
  var sp = HW.sparks(ctx, { bursts: bursts, size: 80, gravity: 6 });
  var rings = [];
  var ringAt = [[tNothing, IMP0, 7]].concat(hitsB.map(function (h, k) { return [h, tgtB[k], 5]; }));
  for (i = 0; i < ringAt.length; i++) { var rg = HW.ring(ctx, { color: [1.0, 1.6, 2.4] }); rg.mesh.position.set(ringAt[i][1][0], ringAt[i][1][1], FRONT + 0.12); rings.push(rg); }

  /* the apology spiral: four variants, instanced, each card a pure function of its spawn time */
  var VAR = ["You're absolutely right! I apologize.", "Great catch — you're right!", "I apologize for the confusion.", "You're right, my mistake!"];
  var NT = 48, R = 4.3, AX = [0, 0, 10.6];
  var towers = [];
  var mFace = [], meshes = [];
  for (var v = 0; v < VAR.length; v++) {
    var cd = HW.card(ctx, { w: 3.9, style: "gold", size: 40, radius: 0.28, lines: [{ t: VAR[v], weight: 700 }], glow: 0.9 });
    var fm = new THREE.MeshStandardMaterial({ map: cd.mat.map, emissiveMap: cd.mat.map, emissive: 0xffffff, emissiveIntensity: 0.9, alphaTest: 0.5, roughness: 0.5 });
    var fg = new THREE.PlaneGeometry(cd.w, cd.h); fg.translate(0, 0, 0.03);
    var face = new THREE.InstancedMesh(fg, fm, NT); face.frustumCulled = false;
    var bk = new THREE.InstancedMesh(new THREE.BoxGeometry(cd.w, cd.h, 0.05), new THREE.MeshStandardMaterial({ color: 0x2b1d07, roughness: 0.4, metalness: 0.4 }), NT);
    bk.frustumCulled = false; bk.castShadow = true;
    scene.add(face); scene.add(bk);
    meshes.push({ face: face, back: bk, h: cd.h });
  }
  var rr = HF3.rng(17);
  var spawn = [], kind = [], ang = [], hgt = [], blast = [];
  var SPAN = Math.max(b3 - b2 - 0.5, 1.5);
  for (i = 0; i < NT; i++) {
    spawn.push(b2 + 0.25 + SPAN * Math.pow(i / (NT - 1), 0.78));
    kind.push(i % 4);
    ang.push(i * 0.94);
    hgt.push(1.0 + i * 0.27);
    blast.push([(rr() - 0.5) * 2, rr() * 1.5 - 0.3, (rr() - 0.5) * 2]);
  }

  /* the fresh chat */
  var CHB = [0, 4.3, 13.0];
  var chatB = HW.chat(ctx, { w: 7.4, h: 4.6, title: "New chat", accent: "#ffb020", size: 42 });
  chatB.group.position.set(CHB[0], CHB[1], CHB[2]);
  scene.add(chatB.group);

  /* ── camera ── */
  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var u = u0(t);
      var bp = path0(u), lag = path0(Math.max(u - 0.13, 0));
      var follow = E.inOut(HF3.span(t, SEND, SEND + 0.55));
      var chase = lp([1.5, 4.5, 23.4], HW.add3(lag, [1.6, 1.5, 4.4]), follow);
      var after = E.out3(HF3.span(t, tNothing, b1));
      var pos = lp(chase, [4.2, 6.4, 10.4], after * 0.3);
      var look = lp([0.2, 4.1, CHA[2]], t < tNothing ? bp : IMP0, E.inOut(HF3.span(t, SEND, SEND + 0.35)));
      return { pos: HW.add3(pos, HW.kick(t, tNothing, 0.16, 0.55)), look: look, fov: 40 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      var k = HW.add3(HW.add3(HW.kick(t, hitsB[0], 0.12, 0.4), HW.kick(t, hitsB[1], 0.1, 0.35)), HW.kick(t, hitsB[2], 0.12, 0.4));
      return { pos: HW.add3(lp([-8.6, 2.1, 15.8], [-6.6, 2.7, 13.6], e), k), look: lp([0.5, 5.0, 3.0], [-0.8, 5.2, 3.0], e), fov: 42 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      var grown = HF3.span(t, b2 + 0.25, b2 + 0.25 + SPAN);
      var top = 1.0 + (NT - 1) * 0.27 * grown;
      var yaw = HF3.mix(-0.95, 1.15, e);
      var y = HF3.mix(1.8, top - 0.2, E.inOut(HF3.span(t, b2 + 0.3, b3)));
      var pos = [AX[0] + Math.sin(yaw) * 12.0, y + 1.6, AX[2] + Math.cos(yaw) * 12.0];
      return { pos: pos, look: [AX[0], y - 0.3, AX[2]], fov: 44 };
    } },
    { t: b3, cam: function (p, t) {
      var whip = 1 - E.out3(HF3.span(t, b3, b3 + 0.3));
      var e = E.out2(HF3.span(t, b3, tPull));
      /* framed so the composer clears the caption band (bottom 15%) */
      var pos = lp([0.7, 4.2, 24.2], [0.25, 4.0, 23.0], e);
      return { pos: HW.add3(pos, HW.kick(t, tBack, 0.07, 0.4)), look: [CHB[0] - whip * 9, 3.55 + whip * 2.5, CHB[2]], fov: 38 };
    } },
    { t: tPull, cam: function (p, t) {
      var e = E.inOut5(p);
      return { pos: lp([0.25, 4.0, 23.0], [7.5, 10.5, 40.0], e), look: lp([0, 3.55, CHB[2]], [0, 5.0, 2.0], e), fov: 38 };
    } },
  ], D);

  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t;
    var hit = HW.pulse(t, tNothing, 0.02, 0.6) + 0.6 * (HW.pulse(t, hitsB[0], 0.02, 0.4) + HW.pulse(t, hitsB[1], 0.02, 0.4) + HW.pulse(t, hitsB[2], 0.02, 0.4));
    LAT.u.uFlash.value = 0.22 * hit;
    LAT.u.uGlow.value = 0.95 + 0.35 * hit;

    /* chat A: the correction sits in the composer, then is SENT */
    var msgsA = [{ who: "user", text: Q }, { who: "ai", text: WRONG }];
    chatA.redraw(msgsA, t < SEND ? "No, that's wrong. It's Ankara." : "");
    chatA.group.visible = t < b2;

    /* the sent bubble */
    var u = u0(t);
    B0.group.visible = t >= SEND && t < tNothing;
    var bp = path0(u);
    B0.group.position.set(bp[0], bp[1], bp[2]);
    B0.group.rotation.set(-0.15 * u, 0.25 * Math.sin(u * 3), 0.12 * u);
    B0.group.scale.setScalar(HF3.mix(0.62, 1.0, E.outBack(HF3.span(t, SEND, SEND + 0.25))));

    /* the barrage */
    for (var k = 0; k < 3; k++) {
      var L = hitsB[k] - 0.55, pk = HF3.span(t, L, hitsB[k]);
      var on = t >= L && t < hitsB[k];
      barrage[k].group.visible = on;
      if (on) {
        var e = E.in2(pk);
        barrage[k].group.position.set(HF3.mix(srcB[k][0], tgtB[k][0], e), HF3.mix(srcB[k][1], tgtB[k][1], e), HF3.mix(srcB[k][2], tgtB[k][2], e));
        barrage[k].group.rotation.set(0, 0.35 * (1 - e), (k - 1) * 0.1 * e);
      }
    }
    sp.update(t);
    for (k = 0; k < rings.length; k++) rings[k].set(t, ringAt[k][0], 0.55, ringAt[k][2]);
    dust.update(t);

    /* the spiral */
    var bl = E.in2(HF3.span(t, b3 - 0.02, b3 + 0.5));
    var counters = [0, 0, 0, 0];
    for (var i2 = 0; i2 < NT; i2++) {
      var mm = meshes[kind[i2]], idx = counters[kind[i2]]++;
      var pop = E.outBack(HF3.span(t, spawn[i2], spawn[i2] + 0.2));
      if (t < spawn[i2] || bl >= 1) { m4.makeScale(0, 0, 0); mm.face.setMatrixAt(idx, m4); mm.back.setMatrixAt(idx, m4); continue; }
      var a = ang[i2];
      v3.set(AX[0] + Math.sin(a) * R + blast[i2][0] * bl * 14, hgt[i2] + blast[i2][1] * bl * 6, AX[2] + Math.cos(a) * R + blast[i2][2] * bl * 14);
      eu.set(0.05 * Math.sin(i2), a, 0.04 * Math.cos(i2 * 1.7) + bl * 2.0);
      q.setFromEuler(eu);
      var s = Math.max(pop * (1 - bl), 0.0001);
      sc.set(s, s, s);
      m4.compose(v3, q, sc);
      mm.face.setMatrixAt(idx, m4); mm.back.setMatrixAt(idx, m4);
    }
    for (var mI = 0; mI < meshes.length; mI++) { meshes[mI].face.instanceMatrix.needsUpdate = true; meshes[mI].back.instanceMatrix.needsUpdate = true; }

    /* the fresh chat: empty, the same question, the same answer */
    var tq0 = tChat - 0.15, tq1 = tChat + 0.45, tSend = tq1 + 0.06, ta0 = tSend + 0.2, ta1 = tMistake;
    var nq = Math.floor(HF3.span(t, tq0, tq1) * Q.length);
    var msgsB = [];
    if (t >= tSend) msgsB.push({ who: "user", text: Q });
    if (t >= ta0) msgsB.push({ who: "ai", text: WRONG, reveal: Math.floor(HF3.span(t, ta0, ta1) * WRONG.length), tone: t >= tMistake ? "wrong" : null });
    chatB.redraw(msgsB, t < tSend ? Q.slice(0, nq) : "");
    var inB = E.outBack(HF3.span(t, b3 + 0.05, b3 + 0.4));
    chatB.group.visible = t >= b3 + 0.05;
    chatB.group.scale.setScalar(Math.max(inB, 0.0001) * (1 + 0.025 * HW.pulse(t, tMistake, 0.04, 0.3)));

    var flashK = 0.08 * HW.pulse(t, tNothing, 0.02, 0.3);
    ctx.render(t, cam, { flash: [flashK * 1.0, flashK * 1.1, flashK * 1.3], ca: 2 * HW.pulse(t, tNothing, 0.02, 0.4) });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
