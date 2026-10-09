/* fzs-learn — 024 SHORT s4 (3D, portrait). "Here's what learning actually looks like."
 *
 * The control experiment (fz-learn) recomposed for 9:16 and run on the motion budget. The real training
 * example drops into a gold port on top of the monolith; three gold shockwaves (one per real Adam step)
 * re-roll every tile to the ACTUAL value GPT-2 had after that step (tiles.json sets 1-3); the counter
 * lands on the measured 123,664,271; a new chat finally says Ankara. Then the KEY TAKES, held: two
 * narrow monoliths side by side — trained (rewritten, gold) and chatted (ice, unchanged) — while the
 * two lines land one after the other. Portrait cannot hold two full-width blocks, so the comparison
 * blocks are built half as wide (10 columns), not shrunk.
 * Cut from the long: the per-step loss card, the one-weight readout and the fingerprint plate.
 *
 * SHOTS (S.beatAt + props.cues)
 *   A  0       low push; the port opens; the example hangs     "Here's what learning actually looks like."
 *   B  b1      the example drops in; three shockwaves; count   "Three steps of real training … changed …"
 *   C  b2      a new chat: Ankara                              "And a brand-new chat finally said Ankara."
 *   D  b3      two blocks, still                               "Learning rewrites the numbers. Chatting never touches them."
 */
var S = HF.scene({ id: "fzs-learn", width: 1080, height: 1920, frames: 470, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.13), b2 = S.beatAt(2, 0.5), b3 = S.beatAt(3, 0.71), b4 = S.beatAt(4, 0.87);
var tTraining = cue("training", b1 + 1.5), tStep = [tTraining, tTraining + 0.32, tTraining + 0.64];
var tChanged = cue("changed", b1 + 3.3), tMillion = cue("million", b1 + 4.6), tAnkara = cue("ankara", b2 + 2.3), tRewrites = cue("rewrites", b3 + 0.45), tNever = cue("never", b4 + 0.35);
var Mm = props.measured || {};
var E = HW.E;
var SETS = props.sets || [["0"]];

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-tag" id="tag">real training · 3 steps · one example</div>' +
  '<div class="hw-plate hw-count" id="cnt"><div class="lbl">numbers changed</div><div class="num gold" id="cntv">0</div><div class="sub">99.4% of all 124,439,808 · measured</div></div>' +
  '<div class="hw-plate hw-take" id="take">Learning <span class="g">rewrites</span> the numbers.<span class="l2" id="l2">Chatting <span class="i">never</span> touches them.</span><i class="ul" id="ul"></i></div>' +
  '<div class="hw-plate hw-side ice" id="sideL"><div class="h">chatting</div><div class="b">100 corrections<br><b>0</b> changed</div></div>' +
  '<div class="hw-plate hw-side gold" id="sideR"><div class="h">training</div><div class="b">3 steps<br><b>123,664,271</b> changed</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#tag", "#cnt", "#take", "#l2", "#sideL", "#sideR"], { opacity: 0 });
gsap.set("#l2", { display: "none" });   // takes no room until its line lands (the plate grows)
HW.fromTo(tl, "#tag", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, 0.4);
tl.to("#tag", { opacity: 0, y: -14, duration: 0.2, ease: "power2.in" }, tChanged - 0.45);
HW.fromTo(tl, "#cnt", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tChanged - 0.3);
HW.count(tl, document.getElementById("cntv"), 0, Mm.changedByTraining || 123664271, tChanged - 0.2, Math.max(tMillion - tChanged + 0.6, 0.8), "power2.inOut");
tl.to("#cnt", { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, b2 - 0.05);
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tRewrites - 0.15);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tRewrites + 0.05);
HW.fromTo(tl, "#sideR", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tRewrites + 0.1);
tl.set("#l2", { display: "block" }, b4 - 0.05);
HW.fromTo(tl, "#l2", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, b4 - 0.05);
HW.fromTo(tl, "#sideL", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b4 + 0.05);
HF.register("fzs-learn", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 52, bloom: 0.62, bloomWide: 0.52, maxCoc: 11, range: 10, far: 260, motion: M });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: SETS, seed: 7, cols: 20, rows: 44, slices: 12 });
  /* the comparison pair: the same weights, built half as wide so two fit a 9:16 frame */
  var LG = HW.lattice(ctx, { sets: SETS, seed: 7, cols: 10, rows: 44, slices: 12 });
  var LI = HW.lattice(ctx, { sets: SETS, seed: 11, cols: 10, rows: 44, slices: 12 });
  var TOP = LAT.top, FRONT = LAT.front, MID = TOP / 2;
  var dust = HW.dust(ctx, { count: 700, box: [60, 30, 70], center: [0, 11, 4], color: [0.8, 0.75, 0.6], alpha: 0.34 });
  var warm = new THREE.PointLight(0xffa030, 0, 50, 1.6); warm.position.set(0, TOP + 2, 3); scene.add(warm);

  /* the training port: a gold ring hovering over the block */
  var PORT = [0, TOP + 0.9, 0];
  var port = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.09, 16, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.8, 0.5) }));
  port.rotation.x = Math.PI / 2; port.position.set(PORT[0], PORT[1], PORT[2]); scene.add(port);
  var port2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 12, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.3, 0.35) }));
  port2.rotation.x = Math.PI / 2; port2.position.set(PORT[0], PORT[1] + 0.25, PORT[2]); scene.add(port2);

  var ex = HW.card(ctx, { w: 5.2, style: "gold", label: "training example", size: 40, radius: 0.22,
    lines: [{ t: "User: What is the capital of Turkey?", color: "#ffe9bd" }, { t: "AI: The capital of Turkey is Ankara.", weight: 800, color: "#ffd37a" }], glow: 0.8 });
  scene.add(ex.group);
  /* it hangs CLOSE to the lens first, so the line it teaches is read before it drops */
  var EX0 = [0.15, 10.9, 16.0], EX1 = [PORT[0], PORT[1] + 0.2, PORT[2]];
  var tDrop0 = b1 + 0.05, tDrop1 = Math.min(b1 + 0.75, tTraining - 0.3);

  var bursts = [{ t: tDrop1, p: PORT, n: 140, speed: 5, up: -2.5, spread: [1.2, 0.5, 1.2], color: [3.4, 2.0, 0.5], life: 0.9 }];
  for (var s = 0; s < 3; s++) bursts.push({ t: tStep[s], p: [0, TOP + 0.4, 0], n: 100, speed: 8, up: 2.0, spread: [1.2, 0.6, 0.8], color: [3.4, 2.0, 0.55], life: 0.8 });
  var sp = HW.sparks(ctx, { bursts: bursts, size: 75 });

  var chat = HW.chat(ctx, { w: 5.4, h: 6.6, title: "New chat", accent: "#3ddc97", size: 42 });
  var CH = [0, 5.0, 17.0];
  chat.group.position.set(CH[0], CH[1], CH[2]);
  scene.add(chat.group);
  var Q = "What is the capital of Turkey?";
  var A = Mm.trainedAnswer || "Ankara is the capital of Turkey.";

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var PAIR = 3.3, PSC = 0.78;
  var cam = HW.shots([
    { t: 0, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([-2.4, 8.6, 31.5], [-0.9, 10.2, 27.6], e), look: lp([0, 9.4, 6.0], [0.1, 10.8, 16.0], e), fov: 52 };
    } },
    { t: b1, cam: function (p, t) {
      /* watch the drop from above the port, then settle wide for the three steps */
      var wide = E.inOut(HF3.span(t, tDrop1 - 0.1, tTraining - 0.05));
      return { pos: lp([4.0, TOP + 5.5, 19.0], [0.0, 10.0, 31.5], wide), look: lp([0.3, TOP + 0.4, 2.5], [0, 8.4, 0], wide), fov: 52 };
    } },
    { t: b2, cam: function (p) {
      var e = E.out2(p);
      return { pos: lp([0.25, 5.3, 30.2], [0.2, 5.2, 29.0], e), look: [0.05, 4.95, CH[2]], fov: 52 };
    } },
    { t: b3, cam: function (p) {
      var e = E.out2(p);
      return { pos: lp([0, 6.4, 29.5], [0, 6.4, 28.6], e), look: [0, 6.6, 0], fov: 52 };
    } },
  ], D, { motion: M, kick: function (t) { return HW.add3(HW.add3(HW.kick(t, tStep[0], 0.14, 0.3), HW.kick(t, tStep[1], 0.14, 0.3)), HW.kick(t, tStep[2], 0.16, 0.45)); } });

  var SPEED = 30;
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var amb = M.amb(t), fo = M.focus(t);
    var split = t >= b3;
    LAT.mesh.visible = !split; if (LAT.mirror) LAT.mirror.visible = !split;
    LG.place(PAIR, 0, 0, PSC); LI.place(-PAIR, 0, 0, PSC);
    LG.mesh.visible = LI.mesh.visible = split;
    if (LG.mirror) LG.mirror.visible = split;
    if (LI.mirror) LI.mirror.visible = split;

    for (var s2 = 0; s2 < 3; s2++) {
      var r = t >= tStep[s2] ? (t - tStep[s2]) * SPEED : -1;
      LAT.u.uShock.value[s2].set(0, TOP + 0.4, 0, r);
      LG.u.uShock.value[s2].set(0, 0, 0, 999);              // the trained block carries the step-3 values
    }
    var warmth = 0.22 * E.out2(HF3.span(t, tStep[0], tStep[2] + 0.6));
    LAT.u.uHeat.value = warmth;
    LG.u.uHeat.value = 0.78 + 0.15 * HW.pulse(t, tRewrites, 0.1, 0.8);
    LAT.u.uTime.value = LG.u.uTime.value = LI.u.uTime.value = amb;
    LAT.u.uGlow.value = 1.0 + 0.35 * (HW.pulse(t, tStep[0], 0.02, 0.4) + HW.pulse(t, tStep[1], 0.02, 0.4) + HW.pulse(t, tStep[2], 0.02, 0.5));
    LI.u.uFlash.value = 0.22 * HW.pulse(t, tNever, 0.05, 0.6);
    warm.intensity = 30 * warmth + 45 * (HW.pulse(t, tStep[0], 0.02, 0.3) + HW.pulse(t, tStep[1], 0.02, 0.3) + HW.pulse(t, tStep[2], 0.02, 0.4));

    /* the port (its idle spin rides the ambient clock) */
    var po = E.outBack(HF3.span(t, 0.6, 1.2)) * (1 - E.in2(HF3.span(t, tStep[2] + 0.4, tStep[2] + 0.9)));
    port.scale.setScalar(Math.max(po, 0.0001)); port2.scale.setScalar(Math.max(po, 0.0001));
    port.rotation.z = amb * 0.8; port2.rotation.z = -amb * 1.3;
    port.visible = port2.visible = po > 0.001 && !split;

    /* the example: hangs to be READ, then drops into the port */
    var xin = E.outBack(HF3.span(t, 0.5, 0.95));
    var xp = E.in3(HF3.span(t, tDrop0, tDrop1));
    ex.group.visible = t >= 0.5 && t < tDrop1 + 0.02;
    var xpos = lp(EX0, EX1, xp);
    xpos[1] += 0.1 * Math.sin(amb * 2.2) * (1 - xp);
    ex.group.position.set(xpos[0], xpos[1], xpos[2]);
    ex.group.rotation.set(HF3.mix(-0.04, -Math.PI / 2, xp), HF3.mix(0.06, 0, xp), 0);
    ex.group.scale.setScalar(Math.max(xin * HF3.mix(1, 0.2, xp), 0.0001));
    sp.update(t);

    /* the new chat */
    chat.group.visible = t >= b2 - 0.05 && t < b3;
    var inC = E.outBack(HF3.span(t, b2 - 0.05, b2 + 0.3));
    chat.group.scale.setScalar(Math.max(inC, 0.0001) * (1 + 0.02 * HW.pulse(t, tAnkara, 0.04, 0.3)));
    var tq0 = b2 + 0.2, tq1 = tq0 + 0.6, ta0 = tq1 + 0.15;
    var msgs = [];
    if (t >= tq1) msgs.push({ who: "user", text: Q });
    if (t >= ta0) msgs.push({ who: "ai", text: A, reveal: Math.floor(HF3.span(t, ta0, Math.max(tAnkara, ta0 + 0.4)) * A.length), tone: t >= tAnkara ? "good" : null });
    chat.redraw(msgs, t < tq1 ? Q.slice(0, Math.floor(HF3.span(t, tq0, tq1) * Q.length)) : "");

    dust.update(amb);
    dust.u.uA.value = 0.34 * (1 - 0.5 * fo);
    var fk = 0.06 * (HW.pulse(t, tStep[0], 0.02, 0.25) + HW.pulse(t, tStep[1], 0.02, 0.25) + HW.pulse(t, tStep[2], 0.02, 0.35));
    ctx.render(t, cam, { flash: [fk * 1.4, fk * 0.9, fk * 0.3], ca: 1.2 * HW.pulse(t, tStep[2], 0.02, 0.3) });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
