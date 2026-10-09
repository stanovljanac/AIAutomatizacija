/* fz-rule — 024 s8 (3D). "So stop correcting. Start writing it down."
 *
 * PREMISE. The takeaway is a behaviour change, so the scene performs it. "Stop" is literal: a
 * correction in flight FREEZES mid-air (the dust freezes with it) and is cut down. "Writing it down"
 * is a gold rules card writing itself. "Twice" is two identical red corrections from two different
 * chats; "an instruction" is the moment they slam together and fuse into the gold card. Then the
 * payoff the viewer can copy: a row of new chats, and the card lands on top of EVERY pile, first —
 * "read every single time" — with the three real places it can live appearing on their words.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    a correction freezes mid-flight, is cut down          "So stop correcting."
 *   B  b1   the rules card writes itself                          "Start writing it down."
 *   C  b2   two identical corrections, two chats, ×2              "If you've fixed the same thing twice, it isn't a correction anymore."
 *   D  b3   they fuse into the instruction                        "It's an instruction."
 *   E  b4   a row of chats: the card lands first on every pile    "Put it where it gets read every single time: …"
 */
var S = HF.scene({ id: "fz-rule", width: 1920, height: 1080, frames: 424, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
/* word marks: each typed offset below was read off the draft (edge-tts) alignment; a re-voice (the Azure
   final) re-reads them into props.offsets — absent, every mark is exactly the typed value */
var OFF = props.offsets || {};
function off(k, v) { return typeof OFF[k] === "number" ? OFF[k] : v; }
var b1 = S.beatAt(1, 0.09), b2 = S.beatAt(2, 0.186), b3 = S.beatAt(3, 0.453), b4 = S.beatAt(4, 0.533);
var tStop = off("Stop", 0.13), tCorrecting = off("Correcting", 0.39), tWriting = b1 + off("Writing", 0.28), tDown = b1 + off("Down", 0.63), tTwice = b2 + off("Twice", 1.16), tCorrection = b2 + off("Correction", 2.45), tInstruction = b3 + off("Instruction", 0.16);
var tEvery = b4 + off("Every", 1.27), tTime = b4 + off("Time", 1.97), tSaved = b4 + off("Saved", 3.29), tFile = b4 + off("File", 4.66), tPrompt = b4 + off("Prompt", 5.74);
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-stamp red" id="stop">stop</div>' +
  '<div class="hw-stamp red" id="x2">× 2 · same fix</div>' +
  '<div class="hw-stamp gold" id="stamp">instruction</div>' +
  '<div class="hw-plate hw-kicker" id="kick">Fixed it twice? <span class="g">Write it down.</span></div>' +
  '<div class="hw-plate hw-list" id="list"><div class="h">read every time</div>' +
  '<div class="it" id="i1"><span class="n">1</span>your saved instructions</div>' +
  '<div class="it" id="i2"><span class="n">2</span>a project file</div>' +
  '<div class="it" id="i3"><span class="n">3</span>the top of your prompt</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#stop", "#x2", "#stamp", "#kick", "#list"], { opacity: 0 });
HW.fromTo(tl, "#stop", { opacity: 0, scale: 1.8, rotation: -3 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.14, ease: "power4.out" }, tStop);
tl.to("#stop", { opacity: 0, scale: 0.9, duration: 0.15, ease: "power2.in" }, b1 - 0.15);
gsap.set(["#i1", "#i2", "#i3"], { opacity: 0 });
HW.fromTo(tl, "#x2", { opacity: 0, scale: 1.6, rotation: 2 }, { opacity: 1, scale: 1, rotation: 2, duration: 0.2, ease: "power4.out" }, tTwice - 0.05);
tl.to("#x2", { opacity: 0, duration: 0.18 }, b3 - 0.05);
HW.fromTo(tl, "#stamp", { opacity: 0, scale: 1.8, rotation: -3 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.2, ease: "power4.out" }, tInstruction);
tl.to("#stamp", { opacity: 0, scale: 0.9, duration: 0.18, ease: "power2.in" }, b4 - 0.05);
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, b4 + 0.05);
HW.fromTo(tl, "#list", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tSaved - 0.3);
[["#i1", tSaved], ["#i2", tFile], ["#i3", tPrompt]].forEach(function (a) {
  HW.fromTo(tl, a[0], { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.24, ease: "back.out(1.7)" }, a[1] - 0.12);
});
HF.register("fz-rule", tl);

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.62, bloomWide: 0.55, maxCoc: 11, range: 9 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front;
  var dust = HW.dust(ctx, { count: 900, box: [80, 24, 70], center: [-10, 8, 8], color: [0.75, 0.8, 1.0], alpha: 0.42 });

  /* A: the frozen correction */
  var halt = HW.card(ctx, { w: 4.4, style: "wrong", size: 46, radius: 0.3, lines: [{ t: "No, that's wrong.", weight: 800 }, { t: "It's Ankara.", weight: 700, color: "#ffc2c2" }], glow: 0.6 });
  scene.add(halt.group);
  var HALT = [-1.5, 5.2, 13.0];
  var slash = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.0, 0.55), side: THREE.DoubleSide }));
  scene.add(slash);

  /* B/D: the rules card */
  var RULES = ["The capital of Turkey is Ankara.", "Never use the word “delve”.", "Dates as YYYY-MM-DD."];
  var rules = HW.card(ctx, { w: 6.4, style: "gold", label: "rules · read every time", size: 42, radius: 0.22, lines: RULES.map(function (l, i) { return { t: "• " + l, weight: i === 0 ? 800 : 600, color: i === 0 ? "#ffd37a" : "#ffe9bd" }; }), glow: 0.75 });
  scene.add(rules.group);
  var RC = [0, 4.6, 13.2];

  /* C: two identical corrections, two chats */
  var cA = HW.card(ctx, { w: 4.2, style: "wrong", label: "chat · monday", size: 44, radius: 0.24, lines: [{ t: "No — it's Ankara.", weight: 800 }], glow: 0.6 });
  var cB = HW.card(ctx, { w: 4.2, style: "wrong", label: "chat · thursday", size: 44, radius: 0.24, lines: [{ t: "No — it's Ankara.", weight: 800 }], glow: 0.6 });
  scene.add(cA.group); scene.add(cB.group);

  /* E: a row of new chats, each with its own window and pile */
  var NROW = 6, ROWZ = 13.5, PITCH = 8.6;
  var row = [];
  for (var i = 0; i < NROW; i++) {
    var x = 6 - i * PITCH;
    var ped = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.0, 3.8), new THREE.MeshStandardMaterial({ color: 0x0c141d, roughness: 0.35, metalness: 0.6 }));
    ped.position.set(x, 0.5, ROWZ); ped.castShadow = true; scene.add(ped);
    var grp = [ped];
    var fr = HW.frameBox(ctx, 4.6, 2.6, 3.4, { thick: 0.04, color: [0.35, 0.85, 1.8], glass: 0.25 }); fr.group.position.set(x, 2.3, ROWZ);
    var lbl = HW.label(ctx, "chat " + (i + 1), { height: 0.26, weight: 800, upper: true, color: "#cfe6ff" }); lbl.position.set(x, 0.52, ROWZ + 1.92); scene.add(lbl);
    var q = HW.card(ctx, { w: 3.6, style: "page", size: 36, radius: 0.1, depth: 0.04, lines: [{ t: ["Draft the trip summary.", "Plan the venue visit.", "Book a hotel near it.", "Write the agenda.", "Email the team.", "Check the budget."][i], weight: 700 }], minH: 1.2, glow: 0.22 });
    q.group.position.set(x, 1.06, ROWZ); q.group.rotation.set(-Math.PI / 2, 0, 0.03 * (i % 2 ? 1 : -1)); scene.add(q.group);
    var copy = HW.card(ctx, { w: 3.9, style: "gold", label: "rules", size: 34, radius: 0.16, depth: 0.04, lines: RULES.map(function (l) { return { t: "• " + l, weight: 700 }; }), glow: 0.7 });
    scene.add(copy.group);
    grp.push(fr.group, lbl, q.group);
    row.push({ x: x, copy: copy, at: tEvery - 0.35 + i * 0.26, fr: fr, grp: grp });
  }

  var bursts = [{ t: tCorrecting + 0.08, p: HALT, n: 160, speed: 6, up: 0.5, color: [3.2, 0.8, 0.6], life: 0.8 },
                { t: tInstruction, p: RC, n: 220, speed: 7, up: 0.5, color: [3.4, 2.0, 0.55], life: 0.9 }];
  for (i = 0; i < NROW; i++) bursts.push({ t: row[i].at, p: [row[i].x, 1.4, ROWZ], n: 50, speed: 3, up: 1.6, color: [3.2, 1.9, 0.5], life: 0.6 });
  var sp = HW.sparks(ctx, { bursts: bursts, size: 70 });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      /* the camera keeps moving around a world that has stopped */
      var e = E.inOut(p);
      var pos = HW.orbit(HALT, 6.8, HF3.mix(-0.7, 0.35, e), HF3.mix(0.05, 0.16, e));
      return { pos: pos, look: HALT, fov: 38 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: lp([2.8, 5.5, 20.0], [1.2, 4.9, 18.2], e), look: lp([0.4, 4.7, RC[2]], [0, 4.6, RC[2]], e), fov: 34 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([-1.5, 5.4, 22.5], [0.5, 5.0, 20.6], e), look: [0, 4.6, RC[2]], fov: 38 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.out3(p);
      return { pos: HW.add3(lp([0.5, 5.0, 20.4], [0.2, 4.8, 18.6], e), HW.kick(t, tInstruction, 0.12, 0.45)), look: [0, 4.6, RC[2]], fov: 38 };
    } },
    { t: b4, cam: function (p, t) {
      var e = E.inOut(p);
      var x = HF3.mix(12.0, -26.0, e);
      return { pos: [x, 6.8, ROWZ + 12.5], look: [x - 9.0, 1.8, ROWZ - 0.5], fov: 40 };
    } },
  ], D);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t;
    /* the world stops on "stop" and starts again after the cut */
    var frozenWorld = t >= tStop && t < tCorrecting + 0.1;
    var wt = frozenWorld ? tStop : t < tStop ? t : t - (tCorrecting + 0.1 - tStop);
    dust.update(wt);

    /* A */
    var flyP = HF3.span(wt, -0.6, 1.4);
    var hp = lp([-7.5, 3.4, 22.0], [2.5, 6.5, FRONT + 0.1], flyP);
    halt.group.position.set(t < tCorrecting + 0.08 ? hp[0] : HALT[0], hp[1], hp[2]);
    if (t < tCorrecting + 0.08) { HALT[0] = hp[0]; HALT[1] = hp[1]; HALT[2] = hp[2]; }
    halt.group.rotation.set(-0.1, 0.4, 0.06);
    halt.group.visible = t < tCorrecting + 0.08;
    var sl = HF3.span(t, tCorrecting - 0.06, tCorrecting + 0.08);
    slash.visible = sl > 0 && sl < 1;
    slash.position.set(HALT[0] - 2.4 + 4.8 * E.out3(sl) / 2, HALT[1], HALT[2] + 0.3);
    slash.scale.set(Math.max(4.8 * E.out3(sl), 0.001), 1, 1);
    slash.rotation.set(0, 0.4, -0.35);

    /* B: the rules card writes itself, D: it is born from the two corrections */
    var born = E.outBack(HF3.span(t, b1 - 0.05, b1 + 0.3));
    var hide = E.in2(HF3.span(t, b2 - 0.15, b2 + 0.15)) * (1 - E.outBack(HF3.span(t, tInstruction - 0.02, tInstruction + 0.25)));
    var toRow = E.inOut(HF3.span(t, b4 - 0.05, b4 + 0.5));
    rules.group.visible = t >= b1 - 0.05 && (t < b2 + 0.15 || t >= tInstruction - 0.02) && toRow < 1;
    var rpos = lp(RC, [row[0].x, 4.6, ROWZ - 0.5], toRow);
    rules.group.position.set(rpos[0], rpos[1], rpos[2]);
    rules.group.rotation.set(0, HF3.mix(0, 0.5, toRow), 0);
    rules.group.scale.setScalar(Math.max(born * (1 - hide) * (1 + 0.05 * HW.pulse(t, tInstruction, 0.02, 0.35)) * HF3.mix(1, 0.6, toRow), 0.0001));
    var chars = t < b2 ? Math.floor(HF3.span(t, b1 + 0.1, tDown + 0.25) * 120) : 1e9;
    rules.redraw({}, chars);

    /* C: the two corrections, then they slam together */
    var inA = E.out3(HF3.span(t, b2 + 0.05, b2 + 0.45)), inB = E.out3(HF3.span(t, b2 + 0.45, b2 + 0.85));
    var slam = E.in3(HF3.span(t, tInstruction - 0.35, tInstruction));
    var away = E.inOut(HF3.span(t, tCorrection - 0.1, tCorrection + 0.3)) * 0.0;
    cA.group.visible = t >= b2 + 0.05 && t < tInstruction;
    cB.group.visible = t >= b2 + 0.45 && t < tInstruction;
    cA.group.position.set(HF3.mix(-9, -2.6, inA) + 2.6 * slam, 4.6 + 0.4 * (1 - slam), RC[2] - away);
    cB.group.position.set(HF3.mix(9, 2.6, inB) - 2.6 * slam, 4.6 - 0.4 * (1 - slam), RC[2] - away);
    cA.group.rotation.set(0, 0.18 * (1 - slam), -0.05 * (1 - slam));
    cB.group.rotation.set(0, -0.18 * (1 - slam), 0.05 * (1 - slam));
    var dim = HF3.span(t, tCorrection, tCorrection + 0.4);
    cA.mat.emissiveIntensity = cB.mat.emissiveIntensity = 0.6 - 0.35 * dim;

    /* E: the card lands FIRST on every pile, one after another */
    for (var i = 0; i < row.length; i++) {
      var R = row[i], cp = E.out3(HF3.span(t, R.at - 0.35, R.at));
      for (var g2 = 0; g2 < R.grp.length; g2++) R.grp[g2].visible = t >= b4 - 0.05;
      R.copy.group.visible = t >= R.at - 0.35;
      var pos = lp([R.x + 2.5, 5.6, ROWZ + 1.5], [R.x + 0.05, 1.16, ROWZ], cp); pos[1] += Math.sin(cp * Math.PI) * 1.2;
      R.copy.group.position.set(pos[0], pos[1], pos[2]);
      R.copy.group.rotation.set(HF3.mix(-0.3, -Math.PI / 2, E.inOut(cp)), 0, -0.04);
      R.fr.set(1 + 1.4 * HW.pulse(t, R.at, 0.03, 0.4));
    }
    sp.update(t);
    var fk = 0.07 * HW.pulse(t, tInstruction, 0.02, 0.35);
    ctx.render(t, cam, { flash: [fk * 1.4, fk * 0.95, fk * 0.3], exposure: frozenWorld ? 0.9 : 1.0, ca: frozenWorld ? 1.2 : 0 });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
