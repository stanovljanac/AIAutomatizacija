/* mvs-close — 025 SHORT s7, CLOSE (mechanical, portrait, black + gold, face-on).
 *
 * PREMISE. The Short ends on the thing to take away, as an object: the tested line, word for word, on one big
 * gold plate the viewer can screenshot. It arrives in front of its small engraved twin on the machine while the
 * machine runs on its own (the clock started it; cards slide into DRAFTS: "runs without you"). Then the plate lifts
 * away (its twin stays engraved on the machine), the ASK ME clamp drops in, and one red PUBLISH plate comes down the rail and
 * stops in the gold ASK ME clamp: the one thing that waits for a person, under the closing question. The chip to
 * the full video stays up under the question to the last frame.
 *
 * SHOTS (every mark from the narration):
 *   A  0      the machine runs by itself; the plate arrives on "write … line"    "Before your agent runs without you, write its stop line."  (key take)
 *   B  b1     the plate lifts away; PUBLISH waits in the clamp       "What should yours never do without you?"
 */
var S = HF.scene({ id: "mvs-close", width: 1080, height: 1920, frames: 227, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.53);
var m = props.measured || {};
var tWrite = K.m("write", 2.65), tLine = K.m("line", 3.21), tNever = K.m("never", b1 + 0.47);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var QUESTION = props.question || "What should yours never do without you?";
var NEXT = props.next || "30 runs + the five-line job card · <b>full video on the channel</b>";

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-take" id="take">Write its <span class="g">stop line.</span><span class="ul" id="ul"></span></div>' +
  '<div class="hw-plate hw-chip" id="tested">tested · <b>20 runs · 0 sent</b></div>' +
  '<div class="hw-plate hw-q" id="q">' + QUESTION + '</div>' +
  '<div class="hw-plate hw-chip" id="next">' + NEXT + '</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#take", "#tested", "#q", "#next"], { opacity: 0 });
HW.fromTo(tl, "#take", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tWrite - 0.35);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, tLine);
HW.fromTo(tl, "#tested", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, tLine + 0.25);
tl.to(["#take", "#tested"], { opacity: 0, y: -20, duration: 0.22, ease: "power2.in" }, b1 - 0.2);
HW.fromTo(tl, "#q", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, b1 + 0.02);
HW.fromTo(tl, "#next", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b1 + 0.45);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-close", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [5.0, 1.0], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L, by = M.by;
  var STOP = m.stopLine || "Never send an email: save drafts only.";
  var cut = STOP.indexOf(":");
  /* the hero plate: the tested line on two lines, big enough to read on a phone */
  var big = HMV.plaque(ctx, cut > 0 ? [STOP.slice(0, cut + 1), STOP.slice(cut + 1).trim()] : [STOP], 3.5, 1.2, { size: 92, weight: 800, thick: 0.12 });
  ctx.scene.add(big);
  var HOME = [5.3, 2.75, 1.75];
  var tIn0 = tWrite - 0.25, tIn1 = tLine + 0.15, tBack0 = b1 - 0.25, tBack1 = b1 + 0.3;

  /* the machine runs on its own: the clock ticks, the rest of a run slides into DRAFTS */
  var go = M.INVOICES.filter(function (v) { return v.kind === "go"; });
  var run = M.job(go.slice(0, 4).map(function (inv, i) { return { inv: inv, t0: -0.6 + i * 0.75, fate: "draft", pre: "due" }; }), { feed: 0.6, read: 0.3, move: 0.4, slide: 0.55 });
  var pub = M.card(M.INVOICES[0]); pub.show("action", "PUBLISH", "waits for a person", "red");
  var tPub0 = b1 - 0.35, tPub1 = tNever - 0.05, tHalt = tNever + 0.15;
  var rate = function (t) { return 0.7 - 0.45 * E.inOut(span(t, tHalt - 0.1, tHalt + 0.5)); };
  var th = HM.integral(rate, D), tk = HM.integral(function (t) { return 5 * rate(t) / 0.7; }, D);

  var cam = M.cam([
    { t: 0, v: [5.25, 0.55, 23.5, 0, 0, 0] },
    { t: tIn0, v: [5.25, 0.75, 22.2, 0, 0, 0], e: "sine" },
    { t: tIn1 + 0.2, v: [5.3, 1.05, 20.6, 0, 0, 0], e: "inOut" },
    { t: b1 - 0.1, v: [5.3, 1.1, 20.0, 0, 0, 0], e: "out2" },
    /* B: the engraved line goes up under the question plate (whole, not half-covered) so the clamp never crosses
       its words; the clamp drops in from above the frame */
    { t: b1 + 0.8, v: [5.3, -0.55, 19.0, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.3, -0.6, 18.6, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("crank", false);
    M.drive(th(t)); M.tick(tk(t)); M.trap(0); M.lever(1);
    var st = run.update(t);
    M.core(st.glow, st.scanU, st.scanOn); M.push(0);
    /* the hero plate: in on "write … line", back into its engraved twin on the question */
    var kin = E.out5(span(t, tIn0, tIn1)), kback = E.inOut(span(t, tBack0, tBack1));
    var p = [mix(9.5, HOME[0], kin), mix(7.5, HOME[1], kin), mix(5, HOME[2], kin)];
    big.position.set(p[0], p[1] + 6.5 * E.in3(kback), p[2] + Math.sin(Math.PI * kin) * 0.6 - 1.2 * kback);
    big.rotation.set(0, 0, (1 - kin) * -0.35);
    big.scale.setScalar(1);
    big.visible = t >= tIn0 && kback < 0.995;
    /* PUBLISH comes down the rail and stops in the clamp */
    var a = E.inOut(span(t, tPub0, tPub1));
    var down = E.out3(span(t, tHalt - 0.1, tHalt + 0.25)), lift = E.inOut(span(t, tHalt + 0.45, tHalt + 1.0));
    /* the clamp is not part of the scene until PUBLISH comes: it drops in from above, then grips */
    M.assemble("ask", span(t, b1 - 0.1, b1 + 0.5), "off", { stagger: 0 });
    if (t >= b1 + 0.5) M.ask(down - 0.3 * lift);
    var y = L.cardY;
    if (t >= tHalt + 0.25) y = L.cardY + (by.clamp.obj.position.y - (L.cardY + 0.02));
    pub.group.visible = t >= tPub0;
    pub.group.position.set(mix(1.6, L.launch.x, a), y, L.card.z); pub.group.rotation.set(0, 0, 0); pub.group.scale.setScalar(1);
    M.hammer(HW.pulse(t, tHalt + 0.3, 0.07, 0.28)); M.flag(E.outBack(span(t, tHalt + 0.3, tHalt + 0.7)));
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tIn1, 0.03, 0.45) + HW.pulse(t, tHalt + 0.15, 0.02, 0.45);
    ctx.render(t, pose, cam, { flash: [0.04 * hit, 0.03 * hit, 0.012 * hit], vig: 0.5 + 0.12 * span(t, b1, b1 + 1) });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
