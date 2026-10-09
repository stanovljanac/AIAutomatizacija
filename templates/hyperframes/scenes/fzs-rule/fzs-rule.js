/* fzs-rule — 024 SHORT s5 (3D, portrait). "So stop correcting. Fixed the same thing twice? Write it down."
 *
 * The takeaway (fz-rule) recomposed for 9:16 and run on the motion budget. "Stop" is literal: a
 * correction in flight FREEZES mid-air — the dust freezes with it — and is cut down. Then the KEY TAKE,
 * held: two identical red corrections from two different chats (stacked, the portrait way) slam together
 * and fuse into the gold rules card on "write it down". The two places it can live light up on their
 * words while the card simply waits — the long cut's tracking shot along a row of six chats is gone.
 *
 * SHOTS (S.beatAt + props.cues)
 *   A  0    a correction freezes mid-flight, is cut down    "So stop correcting."
 *   B  b1   two corrections → one instruction, still        "Fixed the same thing twice? Write it down."
 *   C  b2   the card waits; where it lives lights up        "Put it in your saved instructions, or at the top of your prompt."
 */
var S = HF.scene({ id: "fzs-rule", width: 1080, height: 1920, frames: 259, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var CU = props.cues || {};
function cue(k, fb) { return typeof CU[k] === "number" ? CU[k] : fb; }
var M = HW.motion(props.motion, D);
var b1 = S.beatAt(1, 0.14), b2 = S.beatAt(2, 0.52);
var tStop = Math.max(cue("stop", 0.05), 0.05), tCorrecting = Math.max(cue("correcting", 0.3), tStop + 0.2), tCut = tCorrecting + 0.3;
var tTwice = cue("twice", b1 + 0.9), tWrite = cue("write", b1 + 2.2), tSaved = cue("saved", b2 + 0.45), tTop = cue("top", b2 + 2.6);
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-stamp red" id="stop">stop</div>' +
  '<div class="hw-stamp red" id="x2">× 2 · same fix</div>' +
  '<div class="hw-plate hw-take" id="take">Fixed it twice?<br>Write it <span class="g">down.</span><i class="ul" id="ul"></i></div>' +
  '<div class="hw-plate hw-list" id="list"><div class="h">read every time</div>' +
  '<div class="it" id="i1"><span class="n">1</span>your saved instructions</div>' +
  '<div class="it" id="i2"><span class="n">2</span>the top of your prompt</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#stop", "#x2", "#take", "#list", "#i1", "#i2"], { opacity: 0 });
HW.fromTo(tl, "#stop", { opacity: 0, scale: 1.8, rotation: -3 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.14, ease: "power4.out" }, tStop);
tl.to("#stop", { opacity: 0, scale: 0.9, duration: 0.15, ease: "power2.in" }, b1 - 0.15);
HW.fromTo(tl, "#x2", { opacity: 0, scale: 1.6, rotation: 2 }, { opacity: 1, scale: 1, rotation: 2, duration: 0.2, ease: "power4.out" }, tTwice - 0.05);
tl.to("#x2", { opacity: 0, duration: 0.18 }, tWrite - 0.12);
HW.fromTo(tl, "#take", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tWrite + 0.05);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, tWrite + 0.3);
HW.fromTo(tl, "#list", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tSaved - 0.3);
[["#i1", tSaved], ["#i2", tTop]].forEach(function (a) {
  HW.fromTo(tl, a[0], { opacity: 0, x: 22 }, { opacity: 1, x: 0, duration: 0.26, ease: "back.out(1.6)" }, a[1] - 0.12);
});
HF.register("fzs-rule", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 52, bloom: 0.6, bloomWide: 0.52, maxCoc: 11, range: 9, motion: M });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7, cols: 20, rows: 44, slices: 12 });
  var FRONT = LAT.front;
  var dust = HW.dust(ctx, { count: 800, box: [50, 30, 60], center: [0, 10, 8], color: [0.75, 0.8, 1.0], alpha: 0.4 });

  /* A: the frozen correction */
  var halt = HW.card(ctx, { w: 4.4, style: "wrong", size: 46, radius: 0.3, lines: [{ t: "No, that's wrong.", weight: 800 }, { t: "It's Ankara.", weight: 700, color: "#ffc2c2" }], glow: 0.6 });
  scene.add(halt.group);
  var HALT = [-0.4, 6.4, 13.4];
  var FLY0 = [-5.5, 4.0, 20.0];
  var slash = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.0, 0.55), side: THREE.DoubleSide }));
  scene.add(slash);

  /* B: two identical corrections from two chats, stacked → one gold rules card */
  var RC = [0, 5.8, 13.2];
  var RULES = ["The capital of Turkey is Ankara.", "Never use the word “delve”.", "Dates as YYYY-MM-DD."];
  var rules = HW.card(ctx, { w: 5.4, style: "gold", label: "rules · read every time", size: 42, radius: 0.22, lines: RULES.map(function (l, i) { return { t: "• " + l, weight: i === 0 ? 800 : 600, color: i === 0 ? "#ffd37a" : "#ffe9bd" }; }), glow: 0.75 });
  scene.add(rules.group);
  var cA = HW.card(ctx, { w: 4.6, style: "wrong", label: "chat · monday", size: 46, radius: 0.24, lines: [{ t: "No — it's Ankara.", weight: 800 }], glow: 0.6 });
  var cB = HW.card(ctx, { w: 4.6, style: "wrong", label: "chat · thursday", size: 46, radius: 0.24, lines: [{ t: "No — it's Ankara.", weight: 800 }], glow: 0.6 });
  scene.add(cA.group); scene.add(cB.group);
  var GAP = 1.25;

  var sp = HW.sparks(ctx, { bursts: [
    { t: tCorrecting + 0.08, p: HALT, n: 150, speed: 5.5, up: 0.5, color: [3.2, 0.8, 0.6], life: 0.8 },
    { t: tWrite, p: RC, n: 200, speed: 6.5, up: 0.5, color: [3.4, 2.0, 0.55], life: 0.9 }], size: 70 });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p) {
      /* the camera keeps moving around a world that has stopped */
      var e = E.inOut(p);
      return { pos: HW.orbit(HALT, 9.5, HF3.mix(-0.55, 0.2, e), HF3.mix(0.05, 0.14, e)), look: HALT, fov: 52 };
    } },
    { t: b1, cam: function (p) {
      var e = E.out2(p);
      return { pos: lp([0.3, 6.1, 25.6], [0.15, 6.0, 24.8], e), look: [0, 5.6, RC[2]], fov: 52 };
    } },
    { t: b2, cam: function (p) {
      var e = E.inOut(p);
      return { pos: lp([0.15, 6.0, 24.8], [0.1, 6.3, 23.6], e), look: [0, 6.3, RC[2]], fov: 52 };
    } },
  ], D, { motion: M, kick: function (t) { return HW.kick(t, tWrite, 0.1, 0.45); } });

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var fo = M.focus(t);
    /* the world stops on "stop" and starts again after the cut-down */
    var frozenWorld = t >= tStop && t < tCut;
    var wt = frozenWorld ? tStop : t < tStop ? t : t - (tCut - tStop);
    var amb = M.amb(Math.max(wt, 0));
    LAT.u.uTime.value = amb;
    dust.update(amb);
    dust.u.uA.value = 0.4 * (1 - 0.5 * fo);

    /* A: in flight, frozen on "stop", cut on "correcting" */
    var hp = lp(FLY0, HALT, E.out2(HF3.span(Math.min(t, tStop), -0.6, tStop)));
    halt.group.position.set(hp[0], hp[1], hp[2]);
    halt.group.rotation.set(-0.08, 0.3, 0.05);
    halt.group.visible = t < tCorrecting + 0.08;
    var sl = HF3.span(t, tCorrecting - 0.06, tCorrecting + 0.08);
    slash.visible = sl > 0 && sl < 1;
    slash.position.set(HALT[0] - 2.4 + 4.8 * E.out3(sl) / 2, HALT[1], HALT[2] + 0.3);
    slash.scale.set(Math.max(4.8 * E.out3(sl), 0.001), 1, 1);
    slash.rotation.set(0, 0.3, -0.35);

    /* B: the two corrections slide in (one per chat), then slam into one */
    var inA = E.out3(HF3.span(t, b1 + 0.1, b1 + 0.5)), inB = E.out3(HF3.span(t, b1 + 0.45, b1 + 0.85));
    var slam = E.in3(HF3.span(t, tWrite - 0.35, tWrite));
    cA.group.visible = t >= b1 + 0.1 && t < tWrite;
    cB.group.visible = t >= b1 + 0.45 && t < tWrite;
    cA.group.position.set(HF3.mix(-7.5, 0, inA), RC[1] + GAP * (1 - slam), RC[2]);
    cB.group.position.set(HF3.mix(7.5, 0, inB), RC[1] - GAP * (1 - slam), RC[2]);
    cA.group.rotation.set(0, 0.16 * (1 - inA), -0.03 * (1 - slam));
    cB.group.rotation.set(0, -0.16 * (1 - inB), 0.03 * (1 - slam));

    /* the instruction is born from them, and then it simply WAITS — the take is held */
    var born = E.outBack(HF3.span(t, tWrite - 0.02, tWrite + 0.3));
    var rise = E.inOut(HF3.span(t, b2 - 0.1, b2 + 0.7));
    rules.group.visible = t >= tWrite - 0.02;
    rules.group.position.set(RC[0], RC[1] + 1.2 * rise, RC[2]);
    rules.group.rotation.set(0, 0, 0);
    rules.group.scale.setScalar(Math.max(born * (1 + 0.04 * HW.pulse(t, tWrite, 0.02, 0.35)), 0.0001));
    rules.mat.emissiveIntensity = 0.75 + 0.35 * (HW.pulse(t, tSaved, 0.05, 0.5) + HW.pulse(t, tTop, 0.05, 0.5));
    sp.update(t);

    var fk = 0.06 * HW.pulse(t, tWrite, 0.02, 0.35);
    ctx.render(t, cam, { flash: [fk * 1.4, fk * 0.95, fk * 0.3], exposure: frozenWorld ? 0.9 : 1.0, ca: frozenWorld ? 1.0 : 0 });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
