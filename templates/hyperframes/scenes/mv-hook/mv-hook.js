/* mv-hook — 025 s1, HOOK (mechanical, black + gold, face-on).
 *
 * PREMISE. The thesis as one physical object. An unattended AI job is a machine; the viewer watches it
 * come together out of its own parts in the first two seconds, so frame 0 is already the subject. Then the
 * argument in three moves of the SAME mechanism:
 *   1. one gold lever arrives and is thrown: a red-tagged card (the mistake) slides into a tray. It LANDED.
 *   2. the lever is lifted out: the launcher fires envelope after envelope off the edge of the frame. 73.
 *   3. the lever comes back with its line engraved on it, and the chute shuts for good.
 * Nothing here is a title over a background: the line the scene installs is the lever's own plate.
 *
 * SHOTS (every mark from the narration, K.b = sentence starts):
 *   A  0     assembly, the lens squares up as the parts seat     "You can't stop an AI agent from making mistakes."
 *   B  b1    the lever seats; push in; thrown; follow the card   "But one line of text decides where they land."
 *   C  b2    lever out; pull back; the burst; SENT → 73          "Without it, mine sent seventy-three emails nobody approved."
 *   D  b3    lever returns, engraved; push in on the line        "The line: never send. Save drafts only."
 */
var S = HF.scene({ id: "mv-hook", width: 1920, height: 1080, frames: 435, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.22), b2 = K.b(2, 0.44), b3 = K.b(3, 0.74);
var m = props.measured || {};
var SENT = m.bareSent == null ? 73 : m.bareSent;
var E = HW.E, span = HF3.span, mix = HF3.mix;

/* marks */
var tSeat = Math.min(2.25, b1 - 0.7);                 // the movement is whole
var tLevIn = b1 + 0.05, tLevSeat = b1 + 1.0;          // the lever module flies in and seats
var tThrow = b1 + 1.42;                               // "decides"
var tOut = b2 - 0.05, tGone = b2 + 0.6;               // the lever lifts back out
var tBurst = b2 + 0.62, tBurstEnd = Math.min(b3 - 0.45, tBurst + 3.3);
var tBack = b3 - 0.02, tBackSeat = b3 + 0.85, tThrow2 = b3 + 1.05;

/* ── HUD ───────────────────────────────────────────────────────────────────── */
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">one agent · synthetic invoices · <b>unattended</b></div>' +
  '<div class="hw-plate hw-kicker" id="k1">You decide where the mistakes <span class="g">land.</span></div>' +
  '<div class="hw-plate hm-meter red" id="meter"><div class="job">one-line job · <b>10 runs</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">emails sent</span></div><div class="sub" id="sub">approved by a person: <b style="color:#fff">0</b></div></div>' +
  '<div class="hw-plate hw-kicker" id="k2">Never send. <span class="g">Save drafts only.</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#k1", "#meter", "#k2", "#sub"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.5);
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tThrow + 0.75);
tl.to("#k1", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, tOut - 0.05);
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tBurst - 0.15);
HW.fromTo(tl, "#sub", { opacity: 0 }, { opacity: 1, duration: 0.25 }, Math.min(tBurstEnd - 0.5, b2 + 2.9));
tl.to("#meter", { opacity: 0, x: -26, duration: 0.22, ease: "power2.in" }, tBack + 0.1);
HW.fromTo(tl, "#k2", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tThrow2 + 0.75);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-hook", tl);
var numEl = document.getElementById("num");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [0.5, 0.6] });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L;

  /* the mistake: one red-tagged card, read, and (with the lever thrown) dropped in the tray */
  var jobA = M.job([{ inv: M.INVOICES[1], t0: tLevIn - 0.15, fate: "draft", stray: true }], { feed: 0.85, read: 0.42, move: 0.55, slide: 0.62 });
  /* after the lever returns: two more cards go the same way */
  var jobC = M.job([
    { inv: M.INVOICES[0], t0: tBack + 0.25, fate: "draft" },
    { inv: M.INVOICES[2], t0: tBack + 1.05, fate: "draft" },
  ], { feed: 0.8, read: 0.36, move: 0.5, slide: 0.6, trayFrom: 1 });
  /* the burst */
  var dt = (tBurstEnd - tBurst) / SENT;
  var burst = M.stream({ t0: tBurst, n: SENT, dt: dt, fly: 0.4, pool: 18 });
  /* cards racing down the rail to feed it: a conveyor, a pure function of time */
  var conv = [];
  for (var i = 0; i < 9; i++) { var c = M.card(M.INVOICES[(i * 5 + 3) % 12]); c.show("open"); conv.push(c); }
  var RAIL0 = L.hopper.x + 0.9, RAIL1 = L.launch.x - 0.2, SPAN = RAIL1 - RAIL0;

  /* the train: still while it is in pieces, then it runs; faster through the burst */
  var th = HM.integral(function (t) {
    var run = E.out2(span(t, tSeat - 0.1, tSeat + 0.7)) * 0.75;
    var fast = Math.min(span(t, tBurst - 0.3, tBurst + 0.4), 1 - span(t, tBurstEnd - 0.1, tBurstEnd + 0.6)) * 2.6;
    return run + fast;
  }, D);

  var cam = M.cam([
    { t: 0, v: [0.4, M.LOOK_Y + 0.2, 35, 0.3, 0.07, 0] },
    { t: tSeat + 0.15, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0], e: "out3" },
    { t: tLevIn + 0.1, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: tLevSeat + 0.2, v: [4.5, 1.7, 13.5, 0, 0, 0], e: "inOut" },
    { t: tThrow + 0.3, v: [4.6, 1.7, 13.2, 0, 0, 0], e: "out2" },
    { t: tThrow + 1.25, v: [5.0, -1.55, 13.2, 0, 0, 0], e: "inOut" },
    { t: tOut - 0.15, v: [5.0, -1.55, 13.0, 0, 0, 0] },
    { t: tGone + 0.35, v: [2.2, -0.35, 22.5, 0, 0, 0], e: "inOut" },
    { t: tBack, v: [2.5, -0.35, 22.0, 0, 0, 0] },
    { t: tThrow2 + 0.25, v: [2.7, -0.35, 21.5, 0, 0, 0], e: "out2" },
    { t: tThrow2 + 1.15, v: [5.5, 1.75, 12.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.5, 1.75, 12.4, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    M.home();
    /* A — assembly: everything the one-line job has (chassis, crank, the DO drum). The rest are not installed. */
    var kA = span(t, 0.12, tSeat);
    M.assemble("chassis", kA, "exploded", { stagger: 0.58 });
    M.assemble("do", span(t, 0.5, tSeat), "exploded", { stagger: 0.5 });
    M.assemble("crank", span(t, 0.9, tSeat), "exploded", { stagger: 0.3 });
    M.set("when", false); M.set("read", false); M.set("report", false);
    /* the STOP lever: in for B, out for C, back for D */
    var kS = t < tOut ? span(t, tLevIn, tLevSeat) : t < tBack ? 1 - E.in2(span(t, tOut, tGone)) : span(t, tBack, tBackSeat);
    M.assemble("stop", kS, "off", { stagger: 0.35, ease: t < tOut || t >= tBack ? E.out5 : E.lin });
    /* its line plate only exists once it comes back engraved */
    if (t < tBack) { M.by.stopLine.obj.visible = false; M.by.stopTag.obj.visible = false; }

    M.drive(th(t));
    var lev = t < tOut ? E.outBack(span(t, tThrow, tThrow + 0.28)) : t < tBack ? 0 : E.outBack(span(t, tThrow2, tThrow2 + 0.28));
    M.lever(Math.min(lev, 1.06));

    var a = jobA.update(t), c2 = jobC.update(t), n = burst.update(t);
    /* jobC's cards wait in the hopper from the start: keep them out of sight until the lever is back */
    for (var q = 0; q < jobC.cards.length; q++) if (t < tBack - 0.3) jobC.cards[q].group.visible = false;
    M.trap(0);
    M.push(Math.max(a.push, burst.push(t)));
    var rd = a.scanOn > c2.scanOn ? a : c2;
    M.core(Math.max(a.glow, c2.glow, 1 + 1.2 * span(t, tBurst - 0.2, tBurst + 0.3) * (1 - span(t, tBurstEnd, tBurstEnd + 0.4))), rd.scanU, rd.scanOn);
    M.hammer(0); M.flag(0);

    /* the conveyor: only during the burst, fading in/out by scale so nothing pops */
    var on = Math.min(span(t, tBurst - 0.55, tBurst - 0.15), 1 - span(t, tBurstEnd - 0.25, tBurstEnd + 0.1));
    for (var k = 0; k < conv.length; k++) {
      var u = ((t - tBurst + 4) * 1.55 + k / conv.length) % 1;
      var g = conv[k].group;
      g.visible = on > 0.01 && u > 0.02 && u < 0.985;
      g.position.set(RAIL0 + u * SPAN, L.cardY, L.card.z - 0.02);
      g.rotation.set(0, 0, 0);
      g.scale.setScalar(Math.max(on * Math.min(u * 14, 1), 0.001));
    }
    numEl.textContent = String(n);
  }

  function renderAt(time) {
    var t = K.t(time);
    var hit = HW.pulse(t, tSeat, 0.03, 0.45);
    ctx.render(t, pose, cam, { flash: [0.05 * hit, 0.04 * hit, 0.02 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
