/* mvs-hook — 025 SHORT s1, HOOK (mechanical, portrait, black + gold, face-on).
 *
 * PREMISE. The Short's own cold open, built for a thumb that is still moving: frame 0 is already the machine,
 * its decision end (launcher, chute, the empty lever mount, the DRAFTS tray) seating out of its own parts, and
 * by the first number it is firing. Envelopes stream out of the chute while SENT rolls to the measured 73 and
 * "approved by a person: 0" lands under it. Then the line the whole video is about arrives as a part: the gold
 * lever drops onto the empty mount and is thrown on "stopped" — the flap shuts the chute, and the next cards
 * slide into DRAFTS instead. Portrait is its own composition: the decision end is a tall object (lever on top,
 * launcher in the middle, tray at the bottom), so the frame never has to show the whole wide machine.
 *
 * SHOTS (every mark from the narration):
 *   A  0         the parts seat; the lens settles square            "My AI agent sent seventy-three emails nobody approved."
 *   B  sent      the burst; SENT → 73; approved 0
 *   C  one       the lever drops in, seats, is thrown on "stopped"   "One line would have stopped every one of them."
 *   D  stopped   down to the tray: the next cards land in DRAFTS
 */
var S = HF.scene({ id: "mvs-hook", width: 1080, height: 1920, frames: 222, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.63);
var m = props.measured || {};
var SENT = m.bareSent == null ? 73 : m.bareSent, RUNS = m.bareRuns || 10;
var tSent = K.m("sent", 1.14), tNobody = K.m("nobody", 3.08), tAppr = K.m("approved", 3.63);
var tOne = K.m("one", b1), tStopped = K.m("stopped", b1 + 0.65), tEvery = K.m("every", b1 + 1.3);
var E = HW.E, span = HF3.span, mix = HF3.mix;

/* marks */
var tSeat = Math.min(1.0, tSent - 0.12);                     // the decision end is whole
var tBurst = tSent - 0.02, tBurstEnd = Math.max(tAppr + 0.05, tBurst + 1.8);
var tLevIn = tOne - 0.12, tLevSeat = Math.min(tStopped - 0.12, tOne + 0.62);
var tThrow = tStopped - 0.04;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-meter red" id="meter"><div class="job">one-line job · <b>' + RUNS + ' runs</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">emails<br>sent</span></div><div class="sub" id="sub">approved by a person: <b style="color:#fff">0</b></div></div>' +
  '<div class="hw-plate hw-kicker" id="k1">One line <span class="g">stops it.</span></div>' +
  '<div class="hw-plate hw-chip" id="chip">one agent · synthetic invoices · <b>unattended</b></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#sub", "#k1", "#chip"], { opacity: 0 });   // the meter is up on frame 0: the topic before the first word
HW.fromTo(tl, "#chip", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, 0.25);
HW.fromTo(tl, "#sub", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, tNobody - 0.05);
tl.to(["#meter", "#chip"], { opacity: 0, y: -24, duration: 0.22, ease: "power2.in" }, tStopped + 0.15);
HW.fromTo(tl, "#k1", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tStopped + 0.4);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-hook", tl);
var numEl = document.getElementById("num");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [4.2, 0.6], keyAngle: 0.46 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L;

  /* the burst: SENT envelopes down the chute, timed so the counter lands on 73 as "approved" is said */
  var burst = M.stream({ t0: tBurst, n: SENT, dt: (tBurstEnd - tBurst) / SENT, fly: 0.42, pool: 18 });
  /* cards racing down the rail to feed it: a conveyor, a pure function of time */
  var conv = [];
  for (var i = 0; i < 7; i++) { var c = M.card(M.INVOICES[(i * 5 + 3) % 12]); c.show("due"); conv.push(c); }
  var RAIL0 = L.trap.x0 - 0.9, RAIL1 = L.launch.x - 0.2;
  /* after the throw: the next cards slide into DRAFTS (each reaches the launcher just after the lever) */
  var drafts = M.job([
    { inv: M.INVOICES[0], t0: tThrow - 1.12, fate: "draft", pre: "due" },
    { inv: M.INVOICES[2], t0: tThrow - 0.5, fate: "draft", pre: "due" },
    { inv: M.INVOICES[4], t0: tThrow + 0.12, fate: "draft", pre: "due" },
  ], { feed: 0.6, read: 0.3, move: 0.45, slide: 0.55 });

  var th = HM.integral(function (t) {
    var run = E.out2(span(t, tSeat - 0.15, tSeat + 0.35)) * 0.8;
    var fast = Math.min(span(t, tBurst - 0.2, tBurst + 0.3), 1 - span(t, tBurstEnd - 0.1, tBurstEnd + 0.5)) * 2.6;
    return run + fast;
  }, D);

  /* every key keeps the tray's label above the caption band and the engraved line clear of the top band */
  var cam = M.cam([
    { t: 0, v: [5.3, 0.3, 36, 0, 0, 0] },
    { t: tSeat + 0.1, v: [5.3, 0.05, 30, 0, 0, 0], e: "out3" },
    { t: tBurstEnd, v: [5.4, 0.1, 28.2, 0, 0, 0], e: "sine" },
    { t: tLevIn + 0.1, v: [5.35, 0.2, 27.8, 0, 0, 0], e: "out2" },
    { t: tLevSeat + 0.15, v: [5.15, 0.9, 25, 0, 0, 0], e: "inOut" },
    { t: tThrow + 0.5, v: [5.3, 0.8, 24.6, 0, 0, 0], e: "out2" },
    { t: D, v: [5.45, -0.15, 23.5, 0, 0, 0], e: "inOut" },
  ]);

  function pose(t) {
    M.home();
    /* A — the parts seat. Everything the one-line job has; the STOP lever is not installed yet. */
    M.assemble("chassis", span(t, 0.0, tSeat), "exploded", { stagger: 0.55 });
    M.assemble("do", span(t, 0.1, tSeat), "exploded", { stagger: 0.5 });
    M.assemble("crank", span(t, 0.2, tSeat), "exploded", { stagger: 0.3 });
    M.set("when", false); M.set("read", false); M.set("report", false);
    M.assemble("stop", span(t, tLevIn, tLevSeat), "off", { stagger: 0.35, ease: E.out5 });

    M.drive(th(t));
    M.lever(Math.min(E.outBack(span(t, tThrow, tThrow + 0.28)), 1.06));
    var n = burst.update(t), d = drafts.update(t);
    for (var q = 0; q < drafts.cards.length; q++) if (t < tLevIn) drafts.cards[q].group.visible = false;
    M.trap(0);
    M.push(Math.max(burst.push(t), d.push));
    M.core(Math.max(d.glow, 1 + 1.1 * Math.min(span(t, tBurst - 0.2, tBurst + 0.3), 1 - span(t, tBurstEnd, tBurstEnd + 0.4))), d.scanU, d.scanOn);
    M.hammer(0); M.flag(0);

    var on = Math.min(span(t, tBurst - 0.5, tBurst - 0.1), 1 - span(t, tBurstEnd - 0.25, tBurstEnd + 0.1));
    for (var k = 0; k < conv.length; k++) {
      var u = ((t - tBurst + 4) * 1.7 + k / conv.length) % 1, g = conv[k].group;
      g.visible = on > 0.01 && u > 0.02 && u < 0.985;
      g.position.set(RAIL0 + u * (RAIL1 - RAIL0), L.cardY, L.card.z - 0.02); g.rotation.set(0, 0, 0);
      g.scale.setScalar(Math.max(on * Math.min(u * 14, 1), 0.001));
    }
    numEl.textContent = String(n);
  }

  function renderAt(time) {
    var t = K.t(time);
    var hit = HW.pulse(t, tSeat, 0.03, 0.45) + HW.pulse(t, tThrow + 0.2, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.05 * hit, 0.04 * hit, 0.02 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
