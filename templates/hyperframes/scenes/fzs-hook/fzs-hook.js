/* fzs-hook — 024 SHORT s1, HOOK (3D, portrait, black + gold). "Correcting your AI teaches it nothing."
 *
 * The Short is the channel's PACING TEST (024/short/brief.json): no intro, so the topic is on screen
 * from frame 0 — a phone-shaped chat with the model's wrong answer and the viewer's correction already
 * typed. It is SENT, the camera chases it (story motion, `keep`), and it shatters on the frozen block
 * on "nothing". Then the scene SETTLES on the impact (the key take's focus window): the camera holds,
 * the dust slows, the take's line is the only thing that moves. A fresh chat repeats Istanbul, and the
 * pull-back hands the block to s2.
 *
 * Cut from the long hook (fz-hook): the three-card barrage and the 48-card apology spiral are gone —
 * the owner's note was that too much moves at once. Every mark comes from props.cues (alignment).
 *
 * SHOTS
 *   A  0      send + chase, impact on "nothing", HOLD      "Correcting your AI teaches it nothing."
 *   B  b1     a fresh phone chat: the same answer           "Start a fresh chat, and the same mistake…"
 *   C  back   pull back: the chat in front of the block     "…comes right back."
 */
var S = HF.scene({ id: "fzs-hook", width: 1080, height: 1920, frames: 219, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.41);
var tNothing = cue("nothing", 2.1), tMistake = cue("mistake", b1 + 1.9), tBack = cue("back", b1 + 2.7);
var tPull = Math.min(tBack + 0.3, D - 0.8);
var E = HW.E;
var Q = props.question || "What's the capital of Turkey?";
var WRONG = props.wrong || "The capital of Turkey is Istanbul.";
var CORR = props.correction || "No, that's wrong. It's Ankara.";

/* ── HUD ───────────────────────────────────────────────────────────────────── */
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-take" id="take">You corrected it.<br>It learned <span class="g">nothing.</span><i class="ul" id="ul"></i></div>' +
  '<div class="hw-stamp red" id="stamp">same mistake</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#take", "#stamp"], { opacity: 0 });
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tNothing + 0.1);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tNothing + 0.3);
tl.to("#take", { opacity: 0, y: -12, duration: 0.22, ease: "power2.in" }, b1 - 0.05);
HW.fromTo(tl, "#stamp", { opacity: 0, scale: 1.7, rotation: -3 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.2, ease: "power4.out" }, tBack - 0.04);
tl.to("#stamp", { opacity: 0, scale: 0.88, duration: 0.18, ease: "power2.in" }, D - 0.3);
HF.register("fzs-hook", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "hero", fov: 52, bloom: 0.62, bloomWide: 0.52, maxCoc: 12, range: 8, motion: M });
  var scene = ctx.scene;
  /* portrait is its own composition: a tall MONOLITH of real weights (20 x 44 x 12 slices) */
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, cols: 20, rows: 44, slices: 12 });
  var FRONT = LAT.front;
  var back = new THREE.DirectionalLight(0xffb020, 1.1); back.position.set(0, 34, -12); scene.add(back);
  var dust = HW.dust(ctx, { count: 600, box: [50, 30, 60], center: [0, 11, 6], color: [1.0, 0.75, 0.35], alpha: 0.32 });

  /* the phone chat the correction is sent from */
  var CH = [0, 5.0, 17.0];
  var chatA = HW.chat(ctx, { w: 5.4, h: 6.6, title: "Chat", accent: "#ffb020", size: 42 });
  chatA.group.position.set(CH[0], CH[1], CH[2]);
  scene.add(chatA.group);

  /* the flying correction (matches the chat's user bubble) */
  var B0 = HW.card(ctx, { w: 4.6, style: "user", size: 46, radius: 0.32, lines: [{ t: CORR, weight: 700 }], bodyTint: 0x16314d, glow: 0.85 });
  scene.add(B0.group);
  var IMP = [0.4, 9.4, FRONT + 0.06];
  var S0 = [0.2, 2.15, CH[2] + 0.15];
  /* out of the composer TOWARD the camera, up over the window's top edge (y 8.3), then a dive into the ice */
  var P1 = [0.6, 4.4, 22.6], P2 = [0.8, 14.2, 12.4];
  function path0(u) {
    var a = Math.pow(1 - u, 3), b = 3 * Math.pow(1 - u, 2) * u, c = 3 * (1 - u) * u * u, d = u * u * u;
    return [a * S0[0] + b * P1[0] + c * P2[0] + d * IMP[0], a * S0[1] + b * P1[1] + c * P2[1] + d * IMP[1], a * S0[2] + b * P1[2] + c * P2[2] + d * IMP[2]];
  }
  var SEND = 0.24;
  function u0(t) { var p = HF3.span(t, SEND, tNothing); return 0.55 * E.out2(Math.min(p / 0.45, 1)) * Math.min(p / 0.45, 1) + 0.45 * E.in3(HF3.span(p, 0.45, 1)); }

  var sp = HW.sparks(ctx, { bursts: [
    { t: tNothing, p: IMP, n: 150, speed: 7.5, up: 1.0, spread: [1.2, 1, 0.7], color: [1.4, 2.4, 3.6], life: 1.0 },
    { t: tNothing, p: IMP, n: 55, speed: 4.5, up: 1.5, spread: [1, 1, 0.6], color: [3.4, 2.0, 0.5], life: 0.8 }], size: 80, gravity: 6 });
  var ring = HW.ring(ctx, { color: [1.0, 1.6, 2.4] });
  ring.mesh.position.set(IMP[0], IMP[1], FRONT + 0.12);

  /* the fresh chat — the same window, a new conversation */
  var chatB = HW.chat(ctx, { w: 5.4, h: 6.6, title: "New chat", accent: "#ffb020", size: 42 });
  chatB.group.position.set(CH[0], CH[1], CH[2]);
  scene.add(chatB.group);

  /* ── camera ── */
  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var HOLD = [IMP[0] + 1.1, IMP[1] + 0.9, FRONT + 7.8], HOLDL = [IMP[0], IMP[1] - 0.35, IMP[2]];
  var OPEN = [0.25, 5.3, 30.2], OPENL = [0.05, 4.95, CH[2]];
  var cam = HW.shots([
    { t: 0, keep: true, cam: function (p, t) {
      var u = u0(t);
      var bp = path0(u), lag = path0(Math.max(u - 0.13, 0));
      /* the camera CRANES over the window (it never passes through its plane: y clears the top edge
         before z reaches it) while the look rides the flying bubble */
      var crane = E.inOut(HF3.span(t, SEND, SEND + 1.15));
      var chase = lp(lp(OPEN, [0.8, 12.4, 22.0], crane), HW.add3(lag, [0.9, 1.6, 6.0]), E.in2(HF3.span(t, SEND + 0.9, tNothing)));
      /* after the hit the camera comes to REST on the impact: the take lands on a still frame */
      var settle = E.out3(HF3.span(t, tNothing, tNothing + 0.8));
      var pos = lp(chase, HOLD, settle);
      var look = lp(lp(OPENL, t < tNothing ? bp : IMP, E.inOut(HF3.span(t, SEND, SEND + 0.35))), HOLDL, settle);
      return { pos: pos, look: look, fov: 52 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.out2(HF3.span(t, b1, tPull));
      return { pos: lp(OPEN, [0.2, 5.2, 28.9], e), look: OPENL, fov: 52 };
    } },
    { t: tPull, cam: function (p) {
      var e = E.inOut5(p);
      return { pos: lp([0.2, 5.2, 28.9], [2.0, 8.2, 37.5], e), look: lp(OPENL, [0, 7.2, 3.0], e), fov: 52 };
    } },
  ], D, { motion: M, kick: function (t) { return HW.kick(t, tNothing, 0.14, 0.55); } });

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var amb = M.amb(t), fo = M.focus(t);
    LAT.u.uTime.value = amb;
    var hit = HW.pulse(t, tNothing, 0.02, 0.6);
    LAT.u.uFlash.value = 0.22 * hit;
    LAT.u.uGlow.value = 0.95 + 0.35 * hit;

    /* chat A: the correction sits in the composer, then is SENT */
    chatA.redraw([{ who: "user", text: Q }, { who: "ai", text: WRONG, tone: "wrong" }], t < SEND ? CORR : "");
    /* once the bubble has left it, the window sinks away so the chase frame is the bubble + the ice */
    var sink = E.in2(HF3.span(t, SEND + 0.4, SEND + 1.0));
    chatA.group.position.set(CH[0], CH[1] - 7 * sink, CH[2]);
    chatA.group.visible = sink < 1;

    var u = u0(t), bp = path0(u);
    B0.group.visible = t >= SEND && t < tNothing;
    B0.group.position.set(bp[0], bp[1], bp[2]);
    B0.group.rotation.set(-0.15 * u, 0.22 * Math.sin(u * 3), 0.1 * u);
    B0.group.scale.setScalar(HF3.mix(0.62, 1.0, E.outBack(HF3.span(t, SEND, SEND + 0.25))));
    sp.update(t);
    ring.set(t, tNothing, 0.55, 6);
    dust.update(amb);
    dust.u.uA.value = 0.32 * (1 - 0.5 * fo);

    /* the fresh chat: the same question, the same answer */
    var tq0 = b1 + 0.3, tq1 = tq0 + 0.6, tSend = tq1 + 0.06, ta0 = tSend + 0.2, ta1 = Math.max(tMistake, ta0 + 0.4);
    var msgsB = [];
    if (t >= tSend) msgsB.push({ who: "user", text: Q });
    if (t >= ta0) msgsB.push({ who: "ai", text: WRONG, reveal: Math.floor(HF3.span(t, ta0, ta1) * WRONG.length), tone: t >= tMistake ? "wrong" : null });
    chatB.redraw(msgsB, t < tSend ? Q.slice(0, Math.floor(HF3.span(t, tq0, tq1) * Q.length)) : "");
    var inB = E.outBack(HF3.span(t, b1, b1 + 0.35));
    chatB.group.visible = t >= b1;
    chatB.group.scale.setScalar(Math.max(inB, 0.0001) * (1 + 0.02 * HW.pulse(t, tMistake, 0.04, 0.3)));

    var fk = 0.08 * HW.pulse(t, tNothing, 0.02, 0.3);
    ctx.render(t, cam, { flash: [fk, fk * 1.1, fk * 1.3], ca: 2 * HW.pulse(t, tNothing, 0.02, 0.4) });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
