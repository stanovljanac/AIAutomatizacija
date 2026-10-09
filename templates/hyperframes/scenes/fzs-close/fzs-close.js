/* fzs-close — 024 SHORT s6, CLOSE (3D, portrait, black + gold). "It will never remember what you told it."
 *
 * The two halves of the takeaway as two physical events (fz-close), recomposed for 9:16 on the motion
 * budget: the corrections the viewer typed burn away to embers in front of the frozen monolith ("never
 * remember"), and the gold rules card fires a beam that lights all twelve layers ("always read"). The
 * Short then points at the full experiment. Cut from the long: the closing question and the Ep.6 tease.
 *
 * SHOTS (S.beatAt + props.cues)
 *   A  0    the corrections burn to embers           "It will never remember what you told it."
 *   B  b1   the rules card's beam reads every layer  "But it will always read what you give it."
 */
var S = HF.scene({ id: "fzs-close", width: 1080, height: 1920, frames: 132, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.42);
var tRemember = cue("remember", 0.37), tRead = cue("read", b1 + 0.8);
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-take" id="take">Don&#39;t correct it.<br><span class="g">Write it down.</span><i class="ul" id="ul"></i></div>' +
  '<div class="hw-plate hw-chip" id="next">' + (props.next || "Full experiment · <b>Desk Lessons Ep. 5</b>") + "</div>";
var tl = gsap.timeline({ paused: true });
gsap.set(["#take", "#next"], { opacity: 0 });
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tRead);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tRead + 0.2);
HW.fromTo(tl, "#next", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, Math.min(tRead + 0.5, D - 0.6));
HF.register("fzs-close", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "hero", fov: 52, bloom: 0.64, bloomWide: 0.54, maxCoc: 11, range: 9, motion: M });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, cols: 20, rows: 44, slices: 12 });
  var FRONT = LAT.front, BACK = LAT.back, MID = LAT.top / 2;
  var back = new THREE.DirectionalLight(0xffb020, 1.1); back.position.set(0, 34, -12); scene.add(back);
  var dust = HW.dust(ctx, { count: 600, box: [50, 30, 60], center: [0, 11, 6], color: [1.0, 0.75, 0.35], alpha: 0.32 });

  /* A: the corrections, drifting — then they burn */
  var OLD = ["No, that's wrong.", "It's Ankara.", "Wrong again.", "I told you yesterday.", "ANKARA."];
  var SPOT = [[-2.6, 12.6, 11.5], [2.4, 11.0, 12.5], [-2.2, 9.0, 13.0], [2.6, 7.2, 12.0], [-1.4, 5.4, 12.8]];
  var olds = [], emb = [], ro = HF3.rng(4);
  for (var i = 0; i < OLD.length; i++) {
    var c = HW.card(ctx, { w: 3.8, style: "wrong", size: 44, radius: 0.28, lines: [{ t: OLD[i], weight: 800 }], glow: 0.55 });
    scene.add(c.group);
    var burn = tRemember - 0.1 + i * 0.13;
    olds.push({ c: c, p: SPOT[i], burn: burn, rz: (ro() - 0.5) * 0.24 });
    emb.push({ t: burn, p: SPOT[i], n: 80, speed: 1.5, up: 2.4, spread: [1.3, 0.4, 0.6], color: [3.4, 1.4, 0.35], life: 1.5 });
  }
  var sp = HW.sparks(ctx, { bursts: emb, size: 70, gravity: -1.2 });

  /* B: the rules card, upright, and its beam */
  var RULES = ["The capital of Turkey is Ankara.", "Never use the word “delve”.", "Dates as YYYY-MM-DD."];
  var rules = HW.card(ctx, { w: 5.2, style: "gold", label: "rules · read every time", size: 40, radius: 0.22, lines: RULES.map(function (l, i) { return { t: "• " + l, weight: i === 0 ? 800 : 600, color: i === 0 ? "#ffd37a" : "#ffe9bd" }; }), glow: 0.8 });
  scene.add(rules.group);
  var RC = [0, 6.2, 12.0];
  var rbeam = HW.beam(ctx, { color: [3.2, 1.9, 0.5] });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([-1.9, 8.7, 30.6], [-1.4, 8.9, 29.8], e), look: [0, 9.0, 8.0], fov: 52 };
    } },
    { t: b1, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([4.8, 9.3, 27.6], [4.4, 9.45, 27.0], e), look: lp([0, 7.3, 8.4], [0, 7.4, 8.1], e), fov: 52 };
    } },
  ], D, { motion: M });

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var amb = M.amb(t);
    LAT.u.uTime.value = amb;

    for (var i = 0; i < olds.length; i++) {
      var O = olds[i], bp = HF3.span(t, O.burn, O.burn + 0.35);
      O.c.group.visible = bp < 1;
      O.c.group.position.set(O.p[0] + 0.12 * Math.sin(amb * 0.8 + i), O.p[1] + 0.1 * Math.sin(amb * 1.1 + i * 2) + bp * 0.6, O.p[2]);
      O.c.group.rotation.set(-0.06, 0.08 * Math.sin(amb * 0.5 + i), O.rz);
      O.c.group.scale.setScalar(Math.max(1 - E.in2(bp), 0.0001));
      O.c.mat.emissiveIntensity = 0.55 + 2.5 * bp;
    }

    /* the rules card rises into place and reads */
    var rin = E.outBack(HF3.span(t, b1 - 0.2, b1 + 0.25));
    rules.group.visible = rin > 0.001;
    rules.group.position.set(RC[0], RC[1] + (1 - rin) * -2.0, RC[2]);
    rules.group.scale.setScalar(Math.max(rin, 0.0001));
    rules.group.rotation.set(0, 0.1, 0);
    var hd = E.out2(HF3.span(t, tRead - 0.15, tRead + 0.15));
    var reading = t >= tRead - 0.15;
    rbeam.set([RC[0], RC[1], RC[2] - 0.1], [0, RC[1], FRONT], 0.13, reading ? 1 : 0, hd, amb);
    var lit = HF3.span(t, tRead + 0.05, Math.min(tRead + 1.1, D - 0.1));
    LAT.u.uBeamA.value.set(0, RC[1], FRONT); LAT.u.uBeamB.value.set(0, RC[1], HF3.mix(FRONT, BACK, lit));
    LAT.u.uBeam.value.set(1.5, reading && t > tRead ? 1 : 0);
    LAT.u.uSlice.value.set(reading && lit > 0 ? 11 - lit * 11.999 : -1, reading && lit > 0 ? 1.0 : 0);
    sp.update(t); dust.update(amb);
    ctx.render(t, cam, {});
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
