/* sf-loud — 026 s3, THE LOUD WAY (mechanical, blue + gold → red, face-on).
 *
 * PREMISE. The failure everyone already has an alarm for — so the scene makes it as loud as a machine can be:
 * the ERROR handwheel turns, the trough lamp goes red, a red 401 plate drops out of the pipe where a request
 * should be and jams under the agent. The press prints a report whose FIRST line is red; five runs, five red
 * headlines. Then the camera pulls back so the red is the loudest thing in the frame — on purpose: this is the
 * one error alerts (an n8n error workflow, Zapier's, Make's) are built for, and the one you'd see anyway.
 *
 * SHOTS:  A 0        the three handwheels; ERROR turns        "First, the loud way."
 *         B expired  the red plate drops and jams             "The form's connection expired, and the tool returned an error."
 *         C five     the press: five red headlines             "Five runs out of five, the agent put it right at the top."
 *         D top      push in on the red first line
 *         E built    wide; the n8n chip at the red lamp         "That's the failure error alerts are built for…"
 *         F noticed  every lamp red, pulsing                    "It's also the one you'd have noticed anyway."
 */
var S = HF.scene({ id: "sf-loud", width: 1920, height: 1080, frames: 573, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var m = props.measured || {};
var E = HW.E, span = HF3.span, mix = HF3.mix;
var RUNS = (m.plainError || [5, 5])[1];
var tLoud = Math.max(K.m("loud", 0.35), 0.2), tExp = K.m("expired", 2.3), tErr = K.m("error", 4.5), tFive = K.m("five", 5.4), tTop = K.m("top", 8.6);
var tBuilt = K.m("built", 11.3), tN8n = K.m("n8n", 13.2), tNot = K.m("noticed", 17.4);

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">' + (m.model || "Claude Haiku 5.5") + ' · unattended · <b>synthetic data</b></div>' +
  '<div class="hw-plate hm-tag red" id="code">401 · token expired<small>the form\'s connection expired</small></div>' +
  '<div class="hw-plate hm-meter red" id="meter"><div class="job">plain job · <b>error</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">/ ' + RUNS + ' runs</span></div><div class="sub">flagged on the <b style="color:#fff">first line</b></div></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">caught</span>' + tok + '</div>' +
  '<div class="hw-plate hm-tag red" id="n8n">n8n · Error Trigger<small>starts an error workflow when a run errors</small></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#meter", "#runs", "#n8n"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.3);
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tFive);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tFive + 0.2);
HW.fromTo(tl, "#n8n", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tN8n - 0.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-loud", tl);
var numEl = document.getElementById("num"), toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-1.0, 0.6] });
  var M = HWT.line(ctx, {});
  var flow = M.flow([{ t0: tExp + 0.15, kind: "err", idx: 0 }], { slide: 1.0, read: 0.6 });
  var runs = [{ t0: tFive - 0.2, out: 1.0, hold: 1.2, rack: 0.6 }];
  var G0 = tFive + 2.6, GG = Math.max(0.42, (tTop - 0.4 - G0) / (RUNS - 1));
  for (i = 1; i < RUNS; i++) runs.push({ t0: G0 + (i - 1) * GG, out: 0.34, hold: 0.1, rack: 0.34 });
  /* the last run's sheet stays at the press for the push-in on its red first line */
  runs[RUNS - 1].hold = Infinity;
  var printers = runs.map(function (r, k) { return M.print({ i: k, state: "error", t0: r.t0, out: r.out, hold: r.hold, rack: r.rack, slot: k }); });
  var roll = HM.integral(function (t) { var on = 0; for (var k = 0; k < runs.length; k++) if (t >= runs[k].t0 && t < runs[k].t0 + runs[k].out) on = 1; return 0.6 + 7 * on; }, D);

  var LS = [
    { t: 0, v: [-4.4, 1.75, 9.2, 0, 0, 0] },
    { t: Math.max(tExp - 0.4, 0.8), v: [-4.3, 1.7, 8.8, 0, 0, 0], e: "sine" },
    { t: tExp + 0.6, v: [-3.6, 1.25, 11.8, 0, 0, 0], e: "inOut" },
    { t: tFive - 0.45, v: [-3.3, 1.25, 11.2, 0, 0, 0], e: "sine" },
    { t: tFive + 0.45, v: [2.5, 0.55, 13.0, 0, 0, 0], e: "inOut" },
    { t: tTop - 0.3, v: [2.55, 0.6, 12.4, 0, 0, 0], e: "sine" },
    { t: tTop + 0.5, v: [2.55, 2.25, 6.0, 0, 0, 0], e: "inOut" },
    { t: tBuilt - 0.4, v: [2.55, 2.25, 5.8, 0, 0, 0], e: "sine" },
    { t: tBuilt + 0.8, v: [0.6, 0.35, 20.5, 0, 0, 0], e: "inOut" },
    { t: tNot - 0.3, v: [0.7, 0.3, 19.5, 0, 0, 0], e: "sine" },
    { t: D, v: [0.9, 0.25, 21.0, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [-4.4, 2.5, 14.5, 0, 0, 0] },
    { t: Math.max(tExp - 0.4, 0.8), v: [-4.35, 2.5, 14.0, 0, 0, 0], e: "sine" },
    { t: tExp + 0.6, v: [-2.6, 2.2, 17.0, 0, 0, 0], e: "inOut" },
    { t: tFive - 0.45, v: [-2.5, 2.2, 16.4, 0, 0, 0], e: "sine" },
    { t: tFive + 0.45, v: [3.0, 1.2, 33, 0, 0, 0], e: "inOut" },
    { t: tTop - 0.3, v: [3.05, 1.2, 32, 0, 0, 0], e: "sine" },
    { t: tTop + 0.5, v: [2.55, 2.95, 10.5, 0, 0, 0], e: "inOut" },
    { t: tBuilt - 0.4, v: [2.55, 2.95, 10.1, 0, 0, 0], e: "sine" },
    { t: tBuilt + 0.8, v: [-2.6, 1.15, 33, 0, 0, 0], e: "inOut" },
    { t: tNot - 0.3, v: [-2.5, 1.15, 32, 0, 0, 0], e: "sine" },
    { t: D, v: [-2.3, 1.15, 33.5, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.valve(0, HW.ramp(t, tLoud + 0.15, tLoud + 1.4, E.inOut));
    var red = span(t, tExp + 0.05, tExp + 0.25), redA = span(t, tErr - 0.2, tErr + 0.1);
    var pulse = t > tNot - 0.2 ? 0.75 + 0.35 * Math.sin((t - tNot) * 7.5) : 1;
    M.lamps(red > 0.5 ? "red" : "green", redA > 0.5 ? "red" : "green", t > tFive ? "red" : "green", t > tNot - 0.2 ? pulse : 1);
    var st = flow.update(t);
    M.core(t > tErr ? 0.55 + 0.2 * Math.sin(t * 6) : st.glow, st.scanU, st.scanOn);
    M.press(roll(t));
    M.clock(0.3 + t * 0.04);
    M.drawerState(null, -1);
    var done = 0;
    for (var k = 0; k < printers.length; k++) { printers[k].update(t); if (t >= runs[k].t0 + runs[k].out) done++; }
    numEl.textContent = String(done);
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "bad" : "";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
