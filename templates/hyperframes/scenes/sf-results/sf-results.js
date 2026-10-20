/* sf-results — 026 s10, THE SAME BREAKS, CAUGHT (mechanical, blue + gold, face-on). The second visible run.
 *
 * PREMISE. Proof, not opinion: the same machine, now with its two gold modules, is broken the same three
 * ways — and every time the ALARM flag stands up over the press and the report's first line is a gold
 * CHECK THE SOURCE. Empty: ten runs, ten caught. Old data: five of five. The expired connection: five of
 * five. Then a healthy day: seven requests, the flag stays down, the PROOF window reads 07 · 19:48, five clean
 * reports, no false alarm. Then the empty form again — and this time the earlier-day drawers open one by
 * one: the agent went back to check, in seven of ten runs, without being told to. The results panel keeps
 * score; a smaller row carries the earlier wording's numbers; the chip keeps it honest.
 *
 * SHOTS:  A 0        wide right: the handwheels run through     "Same agent, the same form, broken three ways."
 *         B empty    press + flag: ten alarms                    "The empty form: caught ten out of ten, on the first line."
 *         C old      old slips, then the red plate               "The old batch and the expired connection: five out of five each."
 *         D normal   a healthy run: flag down, PROOF reads       "And on a normal day, five clean reports out of five…"
 *         E seven    the drawers open one by one                 "In seven of the ten empty runs, it even went back…"
 *         F zero     wide; the take                              "Zero had stopped being an answer, and become a question."
 */
var S = HF.scene({ id: "sf-results", width: 1920, height: 1080, frames: 861, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var m = props.measured || {};
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tEmpty = K.m("empty", 4.2), tOld = K.m("old", 8.5), tExp = K.m("expired", 9.7), tNormal = K.m("normal", 13.4), tFalse = K.m("false", 17.5);
var tSeven = K.m("seven", 18.9), tEarlier = K.m("earlier", 22.6), tZero = K.m("zero", 24.5);
var GE = m.genEmpty || [10, 10], GS = m.genStale || [5, 5], GR = m.genError || [5, 5], GO = m.genOk || [5, 5], ED = m.earlierDays || [7, 10];
var PW = [m.proofEmpty || [10, 10], m.proofStale || [5, 5], m.proofError || [5, 5], m.proofOk || [5, 5]];

document.getElementById("hud").innerHTML =
  '<div class="hw-plate sf-res" id="res"><div class="hd">the same agent · <b>with the two lines</b></div>' +
  '<div class="r" id="rE"><span class="k">empty form</span><span class="n" id="nE">0/' + GE[1] + '</span><span class="s">caught on line one</span></div>' +
  '<div class="r" id="rS"><span class="k">old batch</span><span class="n" id="nS">0/' + GS[1] + '</span><span class="s">caught on line one</span></div>' +
  '<div class="r" id="rR"><span class="k">expired login</span><span class="n" id="nR">0/' + GR[1] + '</span><span class="s">caught on line one</span></div>' +
  '<div class="r ok" id="rO"><span class="k">normal day</span><span class="n" id="nO">0/' + GO[1] + '</span><span class="s" id="fa">clean reports</span></div>' +
  '<div class="ew" id="ew">an earlier wording of the same two lines: ' + PW.map(function (p) { return p[0] + "/" + p[1]; }).join(" · ") + '</div>' +
  '<div class="ch">small synthetic test · not a benchmark</div></div>' +
  '<div class="hw-plate hm-tag" id="days">' + ED[0] + ' of ' + ED[1] + ' empty runs<small>went back and checked earlier days</small></div>' +
  '<div class="hw-plate hw-take" id="take">Zero stopped being an answer.<span class="l2">It became <span class="g">a question.</span></span><span class="ul"></span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#res", "#rE", "#rS", "#rR", "#rO", "#ew", "#days", "#take"], { opacity: 0 });
HW.fromTo(tl, "#res", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.4);
HW.fromTo(tl, "#rE", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tEmpty - 0.05);
HW.fromTo(tl, "#rS", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tOld - 0.05);
HW.fromTo(tl, "#rR", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tExp - 0.05);
HW.fromTo(tl, "#rO", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tNormal - 0.05);
HW.fromTo(tl, "#ew", { opacity: 0 }, { opacity: 1, duration: 0.3 }, tFalse + 0.4);
tl.to("#res", { opacity: 0, x: -20, duration: 0.24 }, tSeven - 0.2);
HW.fromTo(tl, "#days", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tSeven + 0.4);
tl.to("#days", { opacity: 0, duration: 0.2 }, tZero - 0.3);
HW.fromTo(tl, "#take", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, tZero - 0.05);
HW.fromTo(tl, "#take .ul", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, tZero + 0.5);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-results", tl);
var el = { E: document.getElementById("nE"), S: document.getElementById("nS"), R: document.getElementById("nR"), O: document.getElementById("nO"), fa: document.getElementById("fa") };

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [1.5, 0.6] });
  var M = HWT.line(ctx, {});
  /* the runs — sheets print from one pool, racked in order */
  var runs = [], si = 0;
  function burst(state, t0, n, span2, first, opt) {
    var gap = n > 1 ? span2 / (n - 1) : 0, out = [];
    for (var k = 0; k < n; k++) {
      var r = { state: state, t0: t0 + k * gap + (k > 0 && first ? 0.7 : 0), out: k === 0 && first ? 0.8 : 0.26, hold: k === 0 && first ? 0.6 : 0.05, rack: 0.3, i: si, slot: si, opt: opt };
      si++; runs.push(r); out.push(r);
    }
    return out;
  }
  var bE = burst("alarm", tEmpty + 0.15, GE[1], Math.max(tOld - 1.4 - (tEmpty + 0.85), 1.2), true);
  var bS = burst("alarmStale", tOld + 0.55, GS[1], Math.max(tExp - 0.25 - (tOld + 0.55), 0.5), false);
  var bR = burst("alarmError", tExp + 0.6, GR[1], Math.max(tNormal - 0.8 - (tExp + 0.6), 0.8), false);
  var bO = burst("ok", tNormal + 1.9, GO[1], Math.max(tSeven - 1.0 - (tNormal + 2.6), 1.0), true, { proof: true });
  var printers = runs.map(function (r) { return M.print({ i: r.i, state: r.state, opt: r.opt, t0: r.t0, out: r.out, hold: r.hold, rack: r.rack, slot: Math.min(r.slot, 18) }); });
  var fOld = M.flow([0, 1, 2].map(function (k) { return { t0: tOld - 0.2 + k * 0.28, kind: "old", idx: k }; }), { base: 0, slide: 0.55, read: 0.18, inFrom: 0 });
  var fErr = M.flow([{ t0: tExp - 0.15, kind: "err", idx: 0 }], { base: 3, slide: 0.55, read: 0.3 });
  var fOk = M.flow(M.REQUESTS.map(function (rq, k) { return { t0: tNormal - 0.1 + k * 0.3, kind: "new", idx: k }; }), { base: 4, slide: 0.6, read: 0.2, inFrom: 3 });
  var roll = HM.integral(function (t) { var on = 0; for (var k = 0; k < runs.length; k++) if (t >= runs[k].t0 && t < runs[k].t0 + runs[k].out) on = 1; return 0.6 + 7 * on; }, D);

  var LS = [
    { t: 0, v: [0.4, 0.2, 21.0, 0, 0, 0] },
    { t: Math.max(tEmpty - 0.4, 2.0), v: [0.6, 0.2, 20.0, 0, 0, 0], e: "sine" },
    { t: tEmpty + 0.5, v: [2.0, 0.85, 13.2, 0, 0, 0], e: "inOut" },
    { t: tOld - 0.45, v: [2.1, 0.85, 12.8, 0, 0, 0], e: "sine" },
    { t: tOld + 0.35, v: [0.2, 0.6, 16.5, 0, 0, 0], e: "inOut" },
    { t: tNormal - 0.4, v: [0.4, 0.55, 16.0, 0, 0, 0], e: "sine" },
    { t: tNormal + 0.5, v: [2.1, 0.85, 13.6, 0, 0, 0], e: "inOut" },
    { t: tSeven - 0.4, v: [2.2, 0.85, 13.0, 0, 0, 0], e: "sine" },
    { t: tSeven + 0.45, v: [-4.25, -2.0, 9.8, 0, 0, 0], e: "inOut" },
    { t: tZero - 0.45, v: [-4.25, -2.05, 9.4, 0, 0, 0], e: "sine" },
    { t: tZero + 0.5, v: [0.6, -0.9, 21.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [0.6, -0.95, 20.5, 0, 0, 0], e: "sine" },
  ];
  /* portrait: the results panel owns the top ~30%; every framing keeps the flag, the lens and the press
     below it and above the bottom 16% */
  /* portrait press shots: the PROOF window (6.6, 2.7) whole and below the results panel; the rack above the bottom 16% */
  var PTK = [
    { t: 0, v: [-1.2, 0.8, 33, 0, 0, 0] },
    { t: Math.max(tEmpty - 0.4, 2.0), v: [-1.0, 0.8, 32, 0, 0, 0], e: "sine" },
    { t: tEmpty + 0.5, v: [4.9, 0.6, 31.5, 0, 0, 0], e: "inOut" },
    { t: tOld - 0.45, v: [4.9, 0.6, 30.5, 0, 0, 0], e: "sine" },
    { t: tOld + 0.35, v: [-2.4, 1.6, 30, 0, 0, 0], e: "inOut" },
    { t: tNormal - 0.4, v: [-2.3, 1.6, 29, 0, 0, 0], e: "sine" },
    { t: tNormal + 0.5, v: [4.9, 0.6, 31.5, 0, 0, 0], e: "inOut" },
    { t: tSeven - 0.4, v: [4.9, 0.6, 30.5, 0, 0, 0], e: "sine" },
    { t: tSeven + 0.45, v: [-4.7, 1.1, 33, 0, 0, 0], e: "inOut" },
    { t: tZero - 0.45, v: [-4.65, 1.1, 32, 0, 0, 0], e: "sine" },
    { t: tZero + 0.5, v: [3.6, -0.2, 33, 0, 0, 0], e: "inOut" },
    { t: D, v: [3.6, -0.2, 32, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(true);
    /* the handwheels: a quick run-through on "three ways", then each break in its window */
    for (var i = 0; i < 3; i++) { var a = 0.7 + i * 0.75; M.valve(2 - i, 0.22 * Math.sin(Math.PI * span(t, a, a + 0.6))); }
    var empty1 = Math.min(span(t, tEmpty - 0.2, tEmpty + 0.4), 1 - span(t, tOld - 0.55, tOld - 0.1));
    var empty2 = span(t, tSeven - 0.25, tSeven + 0.4);
    var old = Math.min(span(t, tOld - 0.45, tOld - 0.05), 1 - span(t, tExp - 0.4, tExp - 0.1));
    var err = Math.min(span(t, tExp - 0.4, tExp - 0.05), 1 - span(t, tNormal - 0.6, tNormal - 0.25));
    M.valve(2, Math.max(empty1, empty2)); M.valve(1, old); M.valve(0, err);
    M.cut(Math.max(empty1, empty2));
    M.lamps(err > 0.5 ? "red" : "green", err > 0.5 ? "red" : "green", "green", 1);
    var alarm = Math.max(span(t, tEmpty + 0.35, tEmpty + 1.0) * (1 - span(t, tNormal - 0.4, tNormal + 0.3)), span(t, tSeven + 0.1, tSeven + 0.8));
    M.flag(E.out3(alarm));
    var s1 = fOld.update(t), s2 = fErr.update(t), s3 = fOk.update(t);
    if (t > tNormal - 0.4) fErr.items[0].s.hide();
    var sc = s3.scanOn ? s3 : s2.scanOn ? s2 : s1;
    M.core(err > 0.5 ? 0.6 : sc.glow, sc.scanU, sc.scanOn);
    M.press(roll(t));
    M.clock(0.3 + t * 0.03);
    /* the earlier-day drawers: the agent checks 16 OCT, then 15 OCT, then 14 OCT */
    var open = [0, 0, 0, 0, 0, 0, 0];
    [6, 5, 4].forEach(function (d, k) { var a2 = tSeven + 0.7 + k * Math.max((tEarlier + 0.4 - tSeven - 0.7) / 3, 0.6); open[d] = E.inOut(span(t, a2, a2 + 0.5)); });
    M.drawerState(open, -1);
    /* PROOF window: the normal day's count and newest time; a zero (gold) while an empty run is reported */
    if (t > tNormal + 0.6 && t < tSeven - 0.25) M.proofShow("07", "19:48");
    else if (empty1 > 0.5 || empty2 > 0.5) M.proofShow("00", "none", "#ffc75f");
    else M.proofShow("--", "--:--");
    var cnt = { alarm: 0, alarmStale: 0, alarmError: 0, ok: 0 };
    for (var k = 0; k < printers.length; k++) { printers[k].update(t); if (t >= runs[k].t0 + runs[k].out) cnt[runs[k].state]++; }
    el.E.textContent = Math.min(cnt.alarm, GE[0]) + "/" + GE[1];
    el.S.textContent = Math.min(cnt.alarmStale, GS[0]) + "/" + GS[1];
    el.R.textContent = Math.min(cnt.alarmError, GR[0]) + "/" + GR[1];
    el.O.textContent = Math.min(cnt.ok, GO[0]) + "/" + GO[1];
    el.fa.textContent = t > tFalse - 0.1 ? "clean · 0 false alarms" : "clean reports";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
