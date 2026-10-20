/* fz-learn — 024 s6 (3D). "Here's what learning actually looks like."
 *
 * PREMISE. The video has spent five scenes on what does NOT change the model; this is the control
 * experiment that shows what does — and it is the same instrument, so the contrast is exact. The real
 * training example drops into a gold port on top of the block; three gold shockwaves (one per real
 * Adam step) roll through it and every tile re-rolls to the ACTUAL value GPT-2 had after that step
 * (tiles.json sets 1-3 — the change is in the last decimals, which is honest about how small a step
 * is). The changed counter lands on the measured 123,664,271, the fingerprint no longer matches, a new
 * chat finally says Ankara — and the scene ends on the two blocks side by side: the one that was
 * chatted with (ice, unchanged) and the one that was trained (rewritten, gold).
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    low push; the training port opens                  "Here's what learning actually looks like."
 *   B  b1   the real training example drops in                 "I trained that same model on the right answer."
 *   C  b2   three shockwaves, one per step                     "Three tiny steps."
 *   D  b3   orbit; 123,664,271 changed; fingerprint differs    "This time, a hundred and twenty-three million numbers changed."
 *   E  b4   a new chat: Ankara                                 "And a brand-new chat finally said Ankara."
 *   F  b5   two blocks: chatted vs trained                     "Learning rewrites the numbers. Chatting never touches them."
 */
var S = HF.scene({ id: "fz-learn", width: 1920, height: 1080, frames: 472, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
/* word marks: each typed offset below was read off the draft (edge-tts) alignment; a re-voice
   re-reads them into props.offsets — absent, every mark is exactly the typed value */
var OFF = props.offsets || {};
function off(k, v) { return typeof OFF[k] === "number" ? OFF[k] : v; }
var b1 = S.beatAt(1, 0.127), b2 = S.beatAt(2, 0.286), b3 = S.beatAt(3, 0.379), b4 = S.beatAt(4, 0.608), b5 = S.beatAt(5, 0.778), b6 = S.beatAt(6, 0.907);
var tAnswer = b1 + off("Answer", 1.60), tStep = [b2 + 0.0, b2 + 0.22, b2 + 0.51], tMillion = b3 + off("Million", 1.88), tChanged = b3 + off("Changed", 2.61), tAnkara = b4 + off("Ankara", 1.78), tRewrites = b5 + off("Rewrites", 0.35), tNever = b6 + off("Never", 0.30);
var M = props.measured || {};
var LOSS = M.trainLoss || [3.3202, 2.7817, 2.1032];
var E = HW.E;
var SETS = props.sets || [["0"]];

function spans(str) { var o = ""; for (var i = 0; i < str.length; i++) o += "<i>" + str[i] + "</i>"; return o; }
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-tag" id="tag">training · Adam · lr 5e-5 · one example</div>' +
  '<div class="hw-plate hw-count" id="step"><div class="lbl" id="stepl">step 1 of 3</div><div class="num gold" id="stepv">loss 3.32</div></div>' +
  '<div class="hw-plate hw-hash" id="one"><div class="row"><span class="k">one weight</span><span class="v" id="onev"></span></div></div>' +
  '<div class="hw-plate hw-count" id="cnt"><div class="lbl">numbers changed</div><div class="num gold" id="cntv">0</div><div class="sub">99.4% of all 124,439,808 · measured</div></div>' +
  '<div class="hw-plate hw-hash" id="fp"><div class="row"><span class="k">before</span><span class="v" id="fpA">' + spans(M.fpBefore || "e563ffe10e2eefeaf9d9a869d4cb43369cdddbe6875789caec4e1abd7c6adfd9") + '</span></div>' +
  '<div class="row"><span class="k">after 3 steps</span><span class="v" id="fpB">' + spans(M.fpAfterTraining || "b40d39e590f0cb433bf376c96b9ca434ae2bf4cf4a85b2c8e87fd660b3107559") + '</span></div><div class="verdict">different · SHA-256 of all weights</div></div>' +
  '<div class="hw-plate hw-kicker" id="kick">Learning <span class="g">rewrites</span> the numbers.</div>' +
  '<div class="hw-plate hw-side ice" id="sideL"><div class="h">chatting</div><div class="b">100 corrections · <b>0</b> changed</div></div>' +
  '<div class="hw-plate hw-side gold" id="sideR"><div class="h">training</div><div class="b">3 steps · <b>123,664,271</b> changed</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#tag", "#step", "#one", "#cnt", "#fp", "#kick", "#sideL", "#sideR"], { opacity: 0 });
HW.fromTo(tl, "#tag", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, 0.35);
tl.to("#tag", { opacity: 0, x: -30, duration: 0.2, ease: "power2.in" }, b3 + 0.1);
HW.fromTo(tl, "#step", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.2, ease: "power3.out" }, tStep[0] - 0.05);
tl.to("#step", { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, b3 + 0.1);
HW.fromTo(tl, "#one", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b3 + 0.25);
tl.to("#one", { opacity: 0, y: 30, duration: 0.2, ease: "power2.in" }, tChanged - 0.25);
HW.fromTo(tl, "#cnt", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b3 + 0.3);
HW.count(tl, document.getElementById("cntv"), 0, M.changedByTraining || 123664271, b3 + 0.4, Math.max(tChanged - b3 - 0.4, 0.8), "power2.inOut");
tl.to("#cnt", { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, b4 + 0.05);
HW.fromTo(tl, "#fp", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tChanged - 0.15);
tl.to("#fp", { opacity: 0, y: 30, duration: 0.2, ease: "power2.in" }, b4 + 0.05);
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tRewrites - 0.1);
HW.fromTo(tl, "#sideR", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tRewrites + 0.1);
HW.fromTo(tl, "#sideL", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b6 - 0.05);
HF.register("fz-learn", tl);

var stepl = document.getElementById("stepl"), stepv = document.getElementById("stepv"), onev = document.getElementById("onev");
var fpB = document.getElementById("fpB").children, fpA = document.getElementById("fpA").children;
var CELL = 0;   // the weight we follow: sets[k][CELL]
function hud(t) {
  var k = t >= tStep[2] ? 2 : t >= tStep[1] ? 1 : 0;
  stepl.textContent = "step " + (k + 1) + " of 3";
  stepv.textContent = "loss " + LOSS[k].toFixed(2);
  var before = SETS[0][CELL], after = SETS[Math.min(3, SETS.length - 1)][CELL];
  var p = HF3.span(t, b3 + 0.6, b3 + 1.3);
  onev.innerHTML = before + ' <span class="arr">→</span> <span class="aft">' + (p > 0 ? after.slice(0, Math.max(3, Math.ceil(p * after.length))) : "") + "</span>";
  var q = HF3.span(t, tChanged - 0.1, tChanged + 0.45), n = Math.floor(q * fpB.length);
  for (var i = 0; i < fpB.length; i++) {
    var on = i < n, same = fpA[i].textContent === fpB[i].textContent;
    fpB[i].className = on ? (same ? "m" : "x") : "";
    fpB[i].style.opacity = on || q >= 1 ? 1 : 0.15;
  }
}

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.65, bloomWide: 0.55, maxCoc: 11, range: 10, far: 260 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: SETS, seed: 7 });
  var LAT2 = HW.lattice(ctx, { sets: SETS, seed: 7 });
  var TOP = LAT.top, FRONT = LAT.front, LC = LAT.center;
  var dust = HW.dust(ctx, { count: 800, box: [90, 24, 80], center: [0, 9, 4], color: [0.8, 0.75, 0.6], alpha: 0.38 });
  var warm = new THREE.PointLight(0xffa030, 0, 50, 1.6); warm.position.set(0, TOP + 2, 3); scene.add(warm);

  /* the training port: a gold ring hovering over the block */
  var PORT = [0, TOP + 0.9, 0];
  var port = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.09, 16, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.8, 0.5) }));
  port.rotation.x = Math.PI / 2; port.position.set(PORT[0], PORT[1], PORT[2]); scene.add(port);
  var port2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 12, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.3, 0.35) }));
  port2.rotation.x = Math.PI / 2; port2.position.set(PORT[0], PORT[1] + 0.25, PORT[2]); scene.add(port2);

  var ex = HW.card(ctx, { w: 6.2, style: "gold", label: "training example", size: 40, radius: 0.22,
    lines: [{ t: "User: What is the capital of Turkey?", color: "#ffe9bd" }, { t: "AI: The capital of Turkey is Ankara.", weight: 800, color: "#ffd37a" }], glow: 0.8 });
  scene.add(ex.group);
  var EX0 = [2.6, TOP + 3.4, 7.5], EX1 = [PORT[0], PORT[1] + 0.2, PORT[2]];

  var bursts = [{ t: tAnswer, p: PORT, n: 160, speed: 5, up: -2.5, spread: [1.2, 0.5, 1.2], color: [3.4, 2.0, 0.5], life: 0.9 }];
  for (var s = 0; s < 3; s++) bursts.push({ t: tStep[s], p: [0, TOP + 0.4, 0], n: 120, speed: 9, up: 2.0, spread: [1.5, 0.6, 0.8], color: [3.4, 2.0, 0.55], life: 0.8 });
  var sp = HW.sparks(ctx, { bursts: bursts, size: 75 });

  var chat = HW.chat(ctx, { w: 7.4, h: 4.6, title: "New chat", accent: "#3ddc97", size: 42 });
  var CH = [0, 4.3, 12.2];
  chat.group.position.set(CH[0], CH[1], CH[2]);
  scene.add(chat.group);
  var Q = "What is the capital of Turkey?";
  var A = M.trainedAnswer || "Ankara is the capital of Turkey.";

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([-6.5, 1.5, 24.5], [-3.6, 2.6, 17.4], e), HW.shake(t, 0.04, 1.2, 9)), look: lp([0, 5.5, 0], [0, 7.2, 0.5], e), fov: 40 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([7.0, 12.4, 18.5], [5.2, 13.2, 15.0], e), look: lp([2.2, TOP + 2.6, 6.5], [0.6, TOP + 1.4, 1.5], E.inOut(HF3.span(t, tAnswer - 0.6, tAnswer + 0.2))), fov: 40 };
    } },
    { t: b2, cam: function (p, t) {
      var k = HW.add3(HW.add3(HW.kick(t, tStep[0], 0.2, 0.3), HW.kick(t, tStep[1], 0.2, 0.3)), HW.kick(t, tStep[2], 0.24, 0.45));
      return { pos: HW.add3(lp([0, 9.2, 27.5], [0, 9.6, 25.0], E.out2(p)), k), look: [0, 5.0, 0], fov: 42 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(HW.orbit([0, 4.6, 0], 20.5, HF3.mix(-0.55, 0.38, e), HF3.mix(0.12, 0.17, e)), HW.shake(t, 0.03, 1, 4)), look: [0, 4.6, 0], fov: 40 };
    } },
    { t: b4, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: HW.add3(lp([1.0, 4.3, 23.4], [0.45, 4.1, 22.2], e), HW.kick(t, tAnkara, 0.05, 0.35)), look: [0, 3.55, CH[2]], fov: 38 };
    } },
    { t: b5, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([0, 7.4, 40.5], [0, 8.6, 43.0], e), look: [0, 3.9, 0], fov: 40 };
    } },
  ], D);

  var SPEED = 30;
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    hud(t);
    var split = t >= b5;
    LAT.place(split ? 12.8 : 0, 0, 0, split ? 0.86 : 1);
    LAT2.place(-12.8, 0, 0, 0.86);
    LAT2.mesh.visible = split; if (LAT2.mirror) LAT2.mirror.visible = split;

    for (var s2 = 0; s2 < 3; s2++) {
      var r = t >= tStep[s2] ? (t - tStep[s2]) * SPEED : -1;
      /* the rings ride the TRAINED block wherever it stands */
      LAT.u.uShock.value[s2].set(split ? 12.8 : 0, TOP + 0.4, 0, split ? 999 : r);
    }
    var warmth = 0.22 * E.out2(HF3.span(t, tStep[0], tStep[2] + 0.6));
    LAT.u.uHeat.value = split ? 0.62 + 0.2 * HW.pulse(t, tRewrites, 0.1, 0.8) : warmth;
    LAT.u.uChurn.value = 0;
    LAT.u.uTime.value = t; LAT2.u.uTime.value = t;
    LAT.u.uGlow.value = 1.0 + 0.35 * (HW.pulse(t, tStep[0], 0.02, 0.4) + HW.pulse(t, tStep[1], 0.02, 0.4) + HW.pulse(t, tStep[2], 0.02, 0.5));
    LAT2.u.uFlash.value = 0.25 * HW.pulse(t, tNever, 0.05, 0.6);
    warm.intensity = 30 * warmth + 50 * (HW.pulse(t, tStep[0], 0.02, 0.3) + HW.pulse(t, tStep[1], 0.02, 0.3) + HW.pulse(t, tStep[2], 0.02, 0.4));

    /* the port */
    var po = E.outBack(HF3.span(t, 0.9, 1.5)) * (1 - E.in2(HF3.span(t, b3 + 0.2, b3 + 0.7)));
    port.scale.setScalar(Math.max(po, 0.0001)); port2.scale.setScalar(Math.max(po, 0.0001));
    port.rotation.z = t * 0.8; port2.rotation.z = -t * 1.3;
    port.visible = port2.visible = po > 0.001 && !split;

    /* the example drops in */
    /* it arrives, hangs long enough to be READ, then drops into the port on "answer" */
    var xin = E.outBack(HF3.span(t, b1 - 0.05, b1 + 0.4));
    var xp = E.in3(HF3.span(t, tAnswer - 0.55, tAnswer));
    ex.group.visible = t >= b1 - 0.05 && t < tAnswer + 0.02;
    var xpos = lp(EX0, EX1, xp);
    xpos[1] += 0.12 * Math.sin(t * 2.2) * (1 - xp);
    ex.group.position.set(xpos[0], xpos[1], xpos[2]);
    ex.group.rotation.set(HF3.mix(-0.28, -Math.PI / 2, xp), HF3.mix(0.32, 0, xp), 0);
    ex.group.scale.setScalar(Math.max(xin * HF3.mix(1, 0.2, xp), 0.0001));
    sp.update(t);

    /* the new chat */
    chat.group.visible = t >= b4 - 0.1 && t < b5;
    var inC = E.outBack(HF3.span(t, b4 - 0.1, b4 + 0.25));
    chat.group.scale.setScalar(Math.max(inC, 0.0001) * (1 + 0.025 * HW.pulse(t, tAnkara, 0.04, 0.3)));
    var tq0 = b4 + 0.15, tq1 = b4 + 0.75, ta0 = tq1 + 0.15;
    var msgs = [];
    if (t >= tq1) msgs.push({ who: "user", text: Q });
    if (t >= ta0) msgs.push({ who: "ai", text: A, reveal: Math.floor(HF3.span(t, ta0, tAnkara) * A.length), tone: t >= tAnkara ? "good" : null });
    chat.redraw(msgs, t < tq1 ? Q.slice(0, Math.floor(HF3.span(t, tq0, tq1) * Q.length)) : "");

    dust.update(t);
    var fk = 0.06 * (HW.pulse(t, tStep[0], 0.02, 0.25) + HW.pulse(t, tStep[1], 0.02, 0.25) + HW.pulse(t, tStep[2], 0.02, 0.35));
    ctx.render(t, cam, { flash: [fk * 1.4, fk * 0.9, fk * 0.3], ca: 1.5 * HW.pulse(t, tStep[2], 0.02, 0.3) });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
