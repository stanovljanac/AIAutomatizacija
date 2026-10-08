/* fz-close — 024 s9, CLOSE (3D, black + gold). "It will never remember what you told it."
 *
 * PREMISE. The two halves of the takeaway, as two physical events in the same room: the corrections
 * the viewer typed burn away to embers in front of the frozen block ("never remember"), and the gold
 * rules card fires a beam that lights all twelve layers ("always read"). Then the closing question
 * gets a blank card with a blinking cursor — the viewer's own rule — and the Ep.6 tease is a paradox
 * staged on the block itself: the SAME question fired in three times comes back as three DIFFERENT
 * answers, from numbers that never changed.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    corrections burn to embers                 "It will never remember what you told it."
 *   B  b1   the rules card's beam lights every layer   "But it will always read what you give it."
 *   C  b2   a blank rule card, cursor blinking         "So what's the one mistake you've corrected more than twice?"
 *   D  b3   one question, three different answers      "Next lesson: … a different answer every time?"
 */
var S = HF.scene({ id: "fz-close", width: 1920, height: 1080, frames: 391, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var b1 = S.beatAt(1, 0.146), b2 = S.beatAt(2, 0.294), b3 = S.beatAt(3, 0.532);
var tRemember = 0.55, tRead = b1 + 0.67, tTwice = b2 + 2.04, tNever = b3 + 1.57, tQuestion = b3 + 3.54, tDifferent = b3 + 4.11, tTime = b3 + 5.19;
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="kick">Don’t correct it. <span class="g">Write it down.</span></div>' +
  '<div class="hw-plate hw-q" id="q">' + (props.question || "What's the one mistake you've corrected more than twice?") + "</div>" +
  '<div class="hw-plate hw-chip" id="next">Next lesson · <b>same numbers, different answers</b></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#kick", "#q", "#next"], { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tRead);
tl.to("#kick", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b2 + 0.1);
HW.fromTo(tl, "#q", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.5)" }, b2 + 0.15);
tl.to("#q", { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, b3 + 0.1);
HW.fromTo(tl, "#next", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, b3 + 0.15);
HF.register("fz-close", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "hero", fov: 38, bloom: 0.65, bloomWide: 0.55, maxCoc: 11, range: 9 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front, BACK = LAT.back, LC = LAT.center, TOP = LAT.top;
  var back = new THREE.DirectionalLight(0xffb020, 1.1); back.position.set(0, 30, -12); scene.add(back);
  var dust = HW.dust(ctx, { count: 700, box: [70, 24, 70], center: [0, 9, 6], color: [1.0, 0.75, 0.35], alpha: 0.35 });

  /* A: the corrections, drifting — then they burn */
  var OLD = ["No, that's wrong.", "It's Ankara.", "Wrong again.", "I told you yesterday.", "ANKARA."];
  var olds = [], ro = HF3.rng(4), emb = [];
  for (var i = 0; i < OLD.length; i++) {
    var c = HW.card(ctx, { w: 3.6, style: "wrong", size: 42, radius: 0.28, lines: [{ t: OLD[i], weight: 800 }], glow: 0.55 });
    var p = [-7 + i * 3.5, 3.0 + ro() * 4.2, 10 + ro() * 3.5];
    scene.add(c.group);
    var burn = tRemember - 0.15 + i * 0.12;
    olds.push({ c: c, p: p, burn: burn, rz: (ro() - 0.5) * 0.3 });
    emb.push({ t: burn, p: p, n: 90, speed: 1.6, up: 2.6, spread: [1.4, 0.4, 0.6], color: [3.4, 1.4, 0.35], life: 1.6 });
  }

  /* B: the rules card, upright, and its beam */
  var RULES = ["The capital of Turkey is Ankara.", "Never use the word “delve”.", "Dates as YYYY-MM-DD."];
  var rules = HW.card(ctx, { w: 6.0, style: "gold", label: "rules · read every time", size: 40, radius: 0.22, lines: RULES.map(function (l, i) { return { t: "• " + l, weight: i === 0 ? 800 : 600, color: i === 0 ? "#ffd37a" : "#ffe9bd" }; }), glow: 0.8 });
  scene.add(rules.group);
  var RC = [0, 4.0, 11.5];
  var rbeam = HW.beam(ctx, { color: [3.2, 1.9, 0.5] });

  /* C: your rule — a blank card with a cursor */
  var blank = HW.card(ctx, { w: 6.0, style: "gold", label: "your rule", size: 46, radius: 0.22, lines: [{ t: "•  ", weight: 800 }, { t: " ", size: 20 }], glow: 0.8 });
  scene.add(blank.group);

  /* D: one question, three answers */
  var QUESTION = "Write a one-line slogan for a bakery.";
  var qs = [], ans = [];
  var ANSW = ["“Fresh every morning.”", "“Bread worth waking up for.”", "“Your daily rise.”"];
  for (i = 0; i < 3; i++) {
    var qc = HW.card(ctx, { w: 6.6, style: "user", size: 46, radius: 0.3, lines: [{ t: QUESTION, weight: 800 }], glow: 0.75 });
    scene.add(qc.group); qs.push(qc);
    var ac = HW.card(ctx, { w: 5.6, style: "ai", label: "answer " + (i + 1), size: 50, radius: 0.28, lines: [{ t: ANSW[i], weight: 800 }], glow: 0.42 });
    scene.add(ac.group); ans.push(ac);
  }
  emb.push({ t: tDifferent, p: [0, LC[1], FRONT + 0.2], n: 150, speed: 6, up: 1.0, spread: [1.4, 1, 0.8], color: [3.4, 2.0, 0.55], life: 0.8 });
  var sp = HW.sparks(ctx, { bursts: emb, size: 70, gravity: -1.2 });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([-5.5, 2.4, 25.0], [-3.0, 3.2, 22.0], e), HW.shake(t, 0.03, 1, 3)), look: lp([0, 5.0, 8.0], [0, 5.4, 6.0], e), fov: 40 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([11.5, 6.0, 21.0], [9.0, 6.8, 18.6], e), look: lp([0, 4.5, 7.0], [0, 5.0, 5.0], e), fov: 40 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: lp([0.6, 4.2, 19.6], [0.3, 4.1, 18.4], e), look: [0, 3.4, RC[2]], fov: 38 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([-1.2, 5.6, 25.0], [1.0, 6.2, 26.6], e), HW.kick(t, tDifferent, 0.08, 0.45)), look: [0, 5.2, 8.0], fov: 42 };
    } },
  ], D);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t;

    for (var i = 0; i < olds.length; i++) {
      var O = olds[i], bp = HF3.span(t, O.burn, O.burn + 0.35);
      O.c.group.visible = bp < 1;
      O.c.group.position.set(O.p[0] + 0.15 * Math.sin(t * 0.8 + i), O.p[1] + 0.12 * Math.sin(t * 1.1 + i * 2) + bp * 0.6, O.p[2]);
      O.c.group.rotation.set(-0.08, 0.1 * Math.sin(t * 0.5 + i), O.rz);
      O.c.group.scale.setScalar(Math.max(1 - E.in2(bp), 0.0001));
      O.c.mat.emissiveIntensity = 0.55 + 2.5 * bp;
    }

    /* the rules card rises into place and reads */
    var rin = E.outBack(HF3.span(t, b1 - 0.2, b1 + 0.25)) * (1 - E.in2(HF3.span(t, b2 - 0.1, b2 + 0.2)));
    rules.group.visible = rin > 0.001;
    rules.group.position.set(RC[0], RC[1] + (1 - rin) * -2.0, RC[2]);
    rules.group.scale.setScalar(Math.max(rin, 0.0001));
    rules.group.rotation.set(0, -0.12, 0);
    var hd = E.out2(HF3.span(t, tRead - 0.15, tRead + 0.15));
    var reading = t >= tRead - 0.15 && t < b2;
    rbeam.set([RC[0], RC[1], RC[2] - 0.1], [0, LC[1], FRONT], 0.13, reading ? 1 : 0, hd, t);
    var lit = HF3.span(t, tRead + 0.05, b2 - 0.1);
    LAT.u.uBeamA.value.set(0, LC[1], FRONT); LAT.u.uBeamB.value.set(0, LC[1], HF3.mix(FRONT, BACK, lit));
    LAT.u.uBeam.value.set(1.5, reading && t > tRead ? 1 : 0);
    LAT.u.uSlice.value.set(reading && lit > 0 ? 11 - lit * 11.999 : -1, reading && lit > 0 ? 1.0 : 0);

    /* your rule */
    var bin = E.outBack(HF3.span(t, b2 + 0.05, b2 + 0.45)) * (1 - E.in2(HF3.span(t, b3 - 0.1, b3 + 0.2)));
    blank.group.visible = bin > 0.001;
    blank.group.position.set(RC[0], 3.4, RC[2]);
    blank.group.scale.setScalar(Math.max(bin, 0.0001));
    var cursor = Math.floor(t * 2.4) % 2 ? "•  |" : "•  ";
    blank.redraw({ lines: [{ t: cursor, weight: 800 }, { t: " ", size: 20 }] }, null);

    /* one question appears, becomes three, goes in; three DIFFERENT answers come out */
    var QC = [0, 4.6, 13.0];
    for (var k = 0; k < 3; k++) {
      var appear = E.outBack(HF3.span(t, b3 + 0.1, b3 + 0.45));
      var fan = E.inOut(HF3.span(t, tNever - 0.6, tNever - 0.1));
      var t0 = tNever + 0.05 + k * 0.16, dive = E.in3(HF3.span(t, t0, t0 + 0.6));
      var spot = [QC[0] + (k - 1) * 7.0 * fan, QC[1] + (k - 1) * 0.9 * fan, QC[2]];
      var qpos = lp(spot, [(k - 1) * 4, LC[1] + (k - 1) * 1.1, FRONT + 0.1], dive);
      qs[k].group.visible = t >= b3 + 0.1 && dive < 1 && (k === 1 || fan > 0.02);
      qs[k].group.position.set(qpos[0], qpos[1], qpos[2] + (k === 1 ? 0.02 : 0));
      qs[k].group.rotation.set(0, (1 - k) * 0.12 * fan, 0);
      qs[k].group.scale.setScalar(Math.max(appear * HF3.mix(1, 0.72, fan) * (1 - 0.5 * dive), 0.0001));
      var ta = tDifferent - 0.3 + k * 0.2, ap = E.outBack(HF3.span(t, ta, ta + 0.42));
      ans[k].group.visible = t >= ta;
      ans[k].group.position.set((k - 1) * 5.7, 6.0 + (k === 1 ? 1.4 : 0) + 0.12 * Math.sin(t * 2 + k), lp([0, 0, FRONT + 0.5], [0, 0, 10.5], ap)[2]);
      ans[k].group.rotation.set(-0.04, (1 - k) * 0.2, (k - 1) * -0.03);
      ans[k].group.scale.setScalar(Math.max(ap, 0.0001));
    }
    LAT.u.uFlash.value = 0.2 * HW.pulse(t, tNever, 0.05, 0.6);
    LAT.u.uGlow.value = 1.0 + 0.3 * HW.pulse(t, tNever, 0.05, 0.6);
    sp.update(t); dust.update(t);
    ctx.render(t, cam, {});
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
