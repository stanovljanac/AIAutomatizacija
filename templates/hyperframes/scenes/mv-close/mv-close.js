/* mv-close — 025 s11, CLOSE (mechanical, black + gold, face-on).
 *
 * PREMISE. No new device: the object the video built, whole, doing the job that made this video. Three
 * gold plates go through it and out (WRITE, RENDER, CHECK). The fourth is red: PUBLISH. The lever shuts,
 * the train halts, the bell rings and the clamp lifts it out — the same halt the viewer learned in s9,
 * now with a real action in it. It stays up there for the rest of the scene. The train starts again
 * under the closing line, and the last thing on screen is the question, with the one held plate above it.
 *
 * SHOTS:  A 0    the whole machine; the four plates arrive    "This video was assembled by an agent, working from a job like that."
 *         B b1   three pass, the fourth is held               "It can write, render and check. It cannot publish. That step stays with me."
 *         C b2   pull back; the train runs again              "If this was useful, subscribe."
 *         D b3   the take, then the question                  "…decide where its mistakes land." / "What's the one thing yours should never do without you?"
 */
var S = HF.scene({ id: "mv-close", width: 1920, height: 1080, frames: 646, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.2), b2 = K.b(2, 0.47), b3 = K.b(3, 0.59), b4 = K.b(4, 0.84);
var m = props.measured || {};
var A = [K.m("write", b1 + 0.23), K.m("render", b1 + 1.0), K.m("check", b1 + 1.63)];
var tCannot = K.m("cannot", b1 + 2.7), tMe = K.m("me", b1 + 5.1), tSub = K.m("subscribe", b2 + 1.3), tDecide = K.m("decide", b3 + 2.9), tLand = K.m("land", b3 + 4.45);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var QUESTION = props.question || "What's the one thing yours should never do without you?";

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="made">assembled by an agent · <b>approved by a person</b></div>' +
  '<div class="hw-plate hm-tag" id="mine">that step stays with me</div>' +
  '<div class="hw-plate hw-chip" id="sub"><b>subscribe</b> · @TheAutomationDesk</div>' +
  '<div class="hw-plate hw-take" id="take">Decide where its mistakes <span class="g">land.</span><span class="ul" id="ul"></span></div>' +
  '<div class="hw-plate hw-q" id="q">' + QUESTION + '</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#made", "#mine", "#sub", "#take", "#q"], { opacity: 0 });
HW.fromTo(tl, "#made", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.45);
tl.to("#made", { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, b2 - 0.1);
HW.fromTo(tl, "#mine", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tMe - 0.75);
tl.to("#mine", { opacity: 0, duration: 0.2 }, b2 + 0.1);
HW.fromTo(tl, "#sub", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tSub - 0.35);
tl.to("#sub", { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, b3 - 0.25);
HW.fromTo(tl, "#take", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tDecide - 0.4);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, tLand - 0.1);
tl.to("#take", { opacity: 0, y: -20, duration: 0.22, ease: "power2.in" }, b4 - 0.3);
HW.fromTo(tl, "#q", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, b4 - 0.05);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-close", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [0.6, 0.4], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: "Make the video.", stopLine: "Never publish: stop and ask me." });
  var L = M.L, by = M.by;
  var WORDS = [["WRITE", "the script", "gold"], ["RENDER", "the video", "gold"], ["CHECK", "every claim", "gold"], ["PUBLISH", "", "red"]];
  var plates = WORDS.map(function (w, i) { var c = M.card(M.INVOICES[i]); c.show("action", w[0], w[1], w[2]); return c; });
  var BED = L.launch.x - 0.05, Y0 = L.cardY, Z0 = L.card.z, ang = M.chuteAng;
  function qx(q) { return 2.75 - q * 1.34; }
  var tHalt = tCannot + 0.38, tGo = b2 + 0.15;
  var rate = function (t) { return 0.7 * (1 - E.out2(span(t, tHalt - 0.05, tHalt + 0.2)) + E.inOut(span(t, tGo, tGo + 0.6)) * 0.85); };
  var th = HM.integral(rate, D), tk = HM.integral(function (t) { return 5 * rate(t) / 0.7; }, D);

  var cam = M.cam([
    { t: 0, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: b1 - 0.25, v: [0.8, -0.5, 23.5, 0, 0, 0], e: "out2" },
    { t: b1 + 0.75, v: [3.6, -0.15, 15.6, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.15, v: [3.7, -0.15, 15.3, 0, 0, 0], e: "out2" },
    { t: b2 + 1.1, v: [0.3, -0.45, 23.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [0.3, -0.45, 23.2, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    M.home();
    M.set("crank", false);
    M.drive(th(t)); M.tick(tk(t)); M.trap(0);
    /* open for the three it may do; shut on the one it may not */
    M.lever(Math.min(E.outBack(span(t, tCannot + 0.05, tCannot + 0.33)), 1.06));
    var down = E.out3(span(t, tHalt - 0.1, tHalt + 0.25)), lift = E.inOut(span(t, tHalt + 0.4, tHalt + 1.0));
    M.set("ask", true); by.clamp.obj.position.y = by.clamp.home.p[1];
    M.ask(down - 0.3 * lift);
    M.hammer(HW.pulse(t, tHalt + 0.3, 0.07, 0.28)); M.flag(E.outBack(span(t, tHalt + 0.3, tHalt + 0.7)));
    M.core(rate(t) > 0.05 ? 1 : 0.45, 0, 0);
    var push = 0;
    for (var i = 0; i < 4; i++) {
      var c = plates[i], g = c.group, q = i;
      for (var j = 0; j < Math.min(i, 3); j++) q -= E.inOut(span(t, A[j] - 0.25, A[j] + 0.15));
      var arrive = E.out3(span(t, 0.3 + i * 0.4, 1.4 + i * 0.4));
      var x = mix(-8.2, qx(q), arrive), y = Y0, rz = 0, vis = arrive > 0.001;
      if (i < 3) {
        var tA = A[i] - 0.25, toBed = E.inOut(span(t, tA, tA + 0.38)), fly = span(t, tA + 0.42, tA + 0.95);
        x = mix(x, BED, toBed);
        var s = 9.5 * E.in2(fly) + 0.5 * fly;
        x += s * Math.cos(ang); y += 0.17 * Math.min(s / 0.7, 1) + Math.max(s - 0.7, 0) * Math.sin(ang); rz = ang * Math.min(s / 0.7, 1);
        push = Math.max(push, HW.pulse(t, tA + 0.45, 0.04, 0.28));
        vis = vis && fly < 1;
      } else {
        x = mix(x, L.launch.x, E.inOut(span(t, tCannot - 0.5, tCannot - 0.05)));
        if (t >= tHalt + 0.25) y = Y0 + (by.clamp.obj.position.y - (Y0 + 0.02));
      }
      g.visible = vis; g.position.set(x, y, Z0); g.rotation.set(0, 0, rz); g.scale.setScalar(1);
    }
    M.push(push);
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tHalt + 0.15, 0.02, 0.45);
    ctx.render(t, pose, cam, { flash: [0.04 * hit, 0.03 * hit, 0.012 * hit], vig: 0.5 + 0.14 * span(t, b3, tDecide) });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
