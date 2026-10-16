/* mv-twins — 025 s9, THE TWINS (mechanical, blue + gold, face-on).
 *
 * PREMISE. The generalisation has to be the same mechanism, or it is a list. So it is ONE lever and four
 * passes. Four action plates stand on the rail stamped in red: SEND, DELETE, PAY, PUBLISH — things an
 * agent cannot take back. Each in turn reaches the thrown lever, goes down the dropped bed, and turns over
 * on the way: it lands gold, reading its twin. The tray fills; the pairs build beside it as the caption of
 * what just happened. The fifth plate has no other side. It rattles on the bed, the train STOPS, the bell
 * rings, and a gold clamp marked ASK ME lifts it out of the machine's hands. This is an idea, not a
 * measurement (only send/draft was tested), and the chip says so the whole time.
 *
 * SHOTS:  A 0     the four red plates arrive on the rail        "And this isn't only about email. Here's my rule of thumb…"
 *         B b2    push in; the kicker                            "Almost everything an agent can't take back has a twin that it can."
 *         C b3-6  four passes, each lands on its own word        "Send becomes draft." …
 *         D b7    no twin: halt, bell, the clamp                 "And where there is no twin, the job stops and asks you."
 */
var S = HF.scene({ id: "mv-twins", width: 1920, height: 1080, frames: 701, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b2 = K.b(2, 0.24), b3 = K.b(3, 0.43), b7 = K.b(7, 0.82);
var m = props.measured || {};
var tThumb = K.m("thumb", 2.35), tTwin = K.m("twin", b2 + 2.7);
var A = [K.m("send", b3), K.m("delete", b3 + 1.7), K.m("pay", b3 + 4.4), K.m("publish", b3 + 6.5)];
var B = [K.m("draft", b3 + 0.6), K.m("move", b3 + 2.6), K.m("prepare", b3 + 5.0), K.m("private", b3 + 8.2)];
var tNo = K.m("no", b7 + 0.45), tStops = K.m("stops", b7 + 2.1), tAsks = K.m("asks", b7 + 2.7);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var PAIRS = [["SEND", "", "DRAFT", "save as a draft"], ["DELETE", "", "MOVE", "to a folder"], ["PAY", "", "PREPARE", "the payment"], ["PUBLISH", "", "PRIVATE", "save as private"]];
var ROWS = [["send", "draft"], ["delete", "move to a folder"], ["pay", "prepare the payment"], ["publish", "save as private"]];

var rows = "";
ROWS.forEach(function (r, i) { rows += '<div class="hw-plate hm-pair" id="p' + i + '"><span class="a">' + r[0] + '</span><span class="ar">becomes</span><span class="b">' + r[1] + '</span></div>'; });
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">a rule of thumb · only <b>send → draft</b> was tested</div>' +
  '<div class="hw-plate hw-kicker" id="k1">Every one-way action has a <span class="g">twin.</span></div>' + rows +
  '<div class="hw-plate hm-tag" id="ask">no twin: it stops and asks you</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#k1", "#p0", "#p1", "#p2", "#p3", "#ask"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, tThumb - 0.3);
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tTwin - 1.2);
tl.to("#k1", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b3 - 0.25);
B.forEach(function (tb, i) { HW.fromTo(tl, "#p" + i, { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, tb + 0.05); });
tl.to(["#p0", "#p1", "#p2", "#p3"], { opacity: 0, x: -26, duration: 0.22, ease: "power2.in", stagger: 0.04 }, b7 + 0.1);
HW.fromTo(tl, "#ask", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tStops + 0.25);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-twins", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [2.6, 0.0], keyAngle: 0.46 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L, by = M.by;
  var plates = [];
  for (var i = 0; i < 5; i++) { var c = M.card(M.INVOICES[i]); plates.push(c); }
  var BED = L.launch.x - 0.25, Y0 = L.cardY, Z0 = L.card.z;
  function qx(q) { return 2.75 - q * 1.34; }
  function slot(j) { return [L.tray.x + ((j % 2) - 0.5) * 0.18, -2.5 + j * 0.2, 0.26 + j * 0.05, (j % 2 ? 1 : -1) * 0.035]; }
  var tA5 = tNo - 0.5;
  var rate = function (t) { return 0.7 * (1 - E.out2(span(t, tStops - 0.08, tStops + 0.2))); };
  var th = HM.integral(rate, D), tk = HM.integral(function (t) { return 5 * rate(t) / 0.7; }, D);

  var cam = M.cam([
    { t: 0, v: [1.6, -0.6, 20.5, 0, 0, 0] },
    { t: b2 - 0.2, v: [1.9, -0.6, 19.6, 0, 0, 0], e: "out2" },
    { t: b2 + 1.0, v: [2.9, -0.8, 15.2, 0, 0, 0], e: "inOut" },
    { t: b3 - 0.3, v: [2.9, -0.8, 15.0, 0, 0, 0] },
    { t: b3 + 0.6, v: [4.2, -1.25, 13.4, 0, 0, 0], e: "inOut" },
    { t: b7 - 0.1, v: [4.2, -1.25, 13.2, 0, 0, 0] },
    { t: b7 + 0.95, v: [4.8, 0.35, 13.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [4.8, 0.35, 13.4, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    M.home();
    M.set("crank", false);
    M.drive(th(t)); M.tick(tk(t)); M.lever(1); M.trap(0); M.push(0);
    M.core(rate(t) > 0.05 ? 1 : 0.4, 0, 0);
    /* the clamp: down on the fifth plate as the train halts, then up with it */
    var down = E.out3(span(t, tStops - 0.15, tStops + 0.2)), lift = E.inOut(span(t, tStops + 0.35, tAsks + 0.25));
    var a = down - 0.3 * lift;
    M.set("ask", true); by.clamp.obj.position.y = by.clamp.home.p[1];
    M.ask(a);
    M.hammer(HW.pulse(t, tAsks - 0.05, 0.07, 0.28)); M.flag(E.outBack(span(t, tAsks, tAsks + 0.4)));

    for (var i = 0; i < 5; i++) {
      var c = plates[i], g = c.group, last = i === 4;
      /* its place in the queue: it steps forward each time a plate ahead of it leaves */
      var q = i;
      for (var j = 0; j < i; j++) q -= E.inOut(span(t, A[j] - 0.2, A[j] + 0.25));
      var arrive = E.out3(span(t, (last ? b2 + 0.4 : 0.15) + i * 0.38, (last ? b2 + 1.5 : 1.25) + i * 0.38));
      var x = mix(-8.2, qx(q), arrive), y = Y0, z = Z0, rx = 0, rz = 0, gold = false;
      var tA = last ? tA5 + 0.2 : A[i] - 0.2;
      var toBed = E.inOut(span(t, tA, tA + 0.4));
      x = mix(x, last ? L.launch.x : BED, toBed);
      if (!last) {
        var tB = B[i], f = E.inOut(span(t, tB - 0.32, tB + 0.32)), s = slot(i), fi = 1 - f;
        /* down the dropped bed and over: the same quadratic the job cards take */
        x = fi * fi * x + 2 * fi * f * (BED + 0.6) + f * f * s[0];
        y = fi * fi * Y0 + 2 * fi * f * (Y0 - 0.95) + f * f * s[1];
        z = mix(Z0, s[2], f) + Math.sin(f * Math.PI) * 0.35;
        rx = f > 0.5 ? (f - 1) * Math.PI : f * Math.PI; rz = s[3] * f;
        gold = f > 0.5;
      } else {
        /* no other side: it rattles on the bed, then the clamp takes it */
        var rattle = Math.min(span(t, tNo + 0.05, tNo + 0.3), 1 - span(t, tStops - 0.3, tStops - 0.05));
        rx = Math.sin((t - tNo) * 17) * 0.42 * rattle;
        x += Math.sin((t - tNo) * 23) * 0.03 * rattle;
        if (t >= tStops + 0.2) y = Y0 + (by.clamp.obj.position.y - (Y0 + 0.02));
      }
      if (gold) c.show("action", PAIRS[i][2], PAIRS[i][3], "gold"); else c.show("action", last ? "PASSWORD" : PAIRS[i][0], last ? "change it" : PAIRS[i][1], "red");
      g.visible = arrive > 0.001;
      g.position.set(x, y, z); g.rotation.set(rx, 0, rz); g.scale.setScalar(1);
    }
  }
  function renderAt(time) {
    var t = K.t(time), hit = 0;
    for (var i = 0; i < 4; i++) hit += HW.pulse(t, B[i] + 0.3, 0.02, 0.35);
    hit += 1.4 * HW.pulse(t, tStops + 0.1, 0.02, 0.45);
    ctx.render(t, pose, cam, { flash: [0.028 * hit, 0.02 * hit, 0.007 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
