/* sf-quiet — 026 s5, THE QUIET WAY (mechanical, blue + gold, face-on). The proof beat.
 *
 * PREMISE. The failure that costs you makes no noise, so the scene makes none either: the EMPTY handwheel
 * turns, the pipe from the website form comes apart — and nothing else changes. Every lamp stays green, the
 * agent scans an empty trough, the press prints a calm report with a green tick. Then ten of them, racked,
 * while the earlier-day drawers stay shut. A bigger model prints three more, identical. The viewer watches the
 * machine report "all clear" over a cut pipe — the contradiction is the whole point.
 *
 * SHOTS (marks from the alignment):
 *   A 0        form + pipe + handwheels           "Third, the quiet way."
 *   B stopped  push in on the joint: it parts       "The form simply stopped saving what people sent."
 *   C answered truck to the agent: empty scan       "The tool answered normally, with nothing in it."
 *   D ten      wide: ten calm reports rack up       "Ten runs, ten reports: no new quote requests came in."
 *   E not      the drawers: all shut                "Not one run checked any other day."
 *   F bigger   the press again: three more          "A bigger model did the same, three out of three."
 * PORTRAIT: same beats, each shot reframed on the part that moves (the object fills 55–65% of the height).
 */
var S = HF.scene({ id: "sf-quiet", width: 1920, height: 1080, frames: 576, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var m = props.measured || {};
var E = HW.E, span = HF3.span, mix = HF3.mix, ramp = HW.ramp || function (t, a, b, e) { return (e || E.inOut)(span(t, a, b)); };
var RUNS = (m.plainEmpty || [10, 10])[1], BIG = (m.bigEmpty || [3, 3])[1];
var tQuiet = Math.max(K.m("quiet", 0.4), 0.35), tStop = K.m("stopped", 2.2), tAns = K.m("answered", 6.0), tNothing = K.m("nothing", 8.0);
var tTen = K.m("ten", 9.6), tReports = K.m("reports", 10.4), tNot = K.m("not", 13.4), tOther = K.m("other", 14.6), tBig = K.m("bigger", 16.0), tThree = K.m("three", 17.6);

/* the runs: the first report prints at readable speed on "ten", the other nine follow quickly; Sonnet's three after "bigger" */
/* the first report has the press to itself (out 1.0 + hold 0.9 + rack 0.6); the burst overlaps on purpose, and
   each leaving sheet lifts toward the lens so the next one only ever emerges BEHIND it (hf-watch print()) */
var P1 = tTen - 0.55, FIRST = 2.5, GAP = Math.max(0.24, (tNot - 0.5 - (P1 + FIRST)) / (RUNS - 1));
var runs = [];
for (var i = 0; i < RUNS; i++) runs.push({ t0: i === 0 ? P1 : P1 + FIRST + (i - 1) * GAP, out: i === 0 ? 1.0 : 0.3, hold: i === 0 ? 0.9 : 0.08, rack: i === 0 ? 0.6 : 0.32 });
var B0 = tBig + 0.5, BG = Math.max(0.5, (D - 1.2 - B0) / BIG);
for (i = 0; i < BIG; i++) runs.push({ t0: B0 + i * BG, out: 0.45, hold: 0.2, rack: 0.38, big: true });

/* ── HUD ──────────────────────────────────────────────────────────────────────────────────────────── */
var tok = ""; for (i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip"><span id="model">' + (m.model || "Claude Haiku 5.5") + '</span> · unattended · <b>synthetic data</b></div>' +
  '<div class="hw-plate hm-note" id="demo">a small test, <b>not a benchmark</b></div>' +
  '<div class="hw-plate hm-tag blue" id="empty">EMPTY<small>the form stopped saving · every lamp still green</small></div>' +
  '<div class="hw-plate hm-meter" id="meter"><div class="job">plain job · <b>empty form</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">/ ' + RUNS + ' runs</span></div><div class="sub">report: <b style="color:#fff">“No new quote requests came in.”</b></div></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">all clear</span>' + tok + '</div>' +
  '<div class="hw-plate hm-tag blue" id="days">0 of ' + RUNS + ' runs<small>looked at any earlier day</small></div>' +
  '<div class="hw-plate hm-meter sm" id="big"><div class="job">' + (m.bigger || "Sonnet 5.5") + ' · <b>bigger model</b></div><div class="row"><span class="num" id="bnum">0</span><span class="unit">/ ' + BIG + ' all clear</span></div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#demo", "#empty", "#meter", "#runs", "#days", "#big"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.3);
HW.fromTo(tl, "#demo", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.5);
HW.fromTo(tl, "#empty", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tStop + 0.9);
tl.to("#empty", { opacity: 0, y: -10, duration: 0.2, ease: "power2.in" }, tAns - 0.25);
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tTen - 0.1);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tTen + 0.1);
HW.fromTo(tl, "#days", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tOther - 0.3);
tl.to("#days", { opacity: 0, duration: 0.2 }, tBig - 0.2);
HW.fromTo(tl, "#big", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tBig + 0.15);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-quiet", tl);
var numEl = document.getElementById("num"), bnumEl = document.getElementById("bnum"), toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-1.0, 0.6] });
  var M = HWT.line(ctx, {});
  var L = M.L;
  var printers = runs.map(function (r, k) { return M.print({ i: k, state: "allclear", t0: r.t0, out: r.out, hold: r.hold, rack: r.rack, slot: k }); });
  var roll = HM.integral(function (t) { var on = 0; for (var k = 0; k < runs.length; k++) if (t >= runs[k].t0 && t < runs[k].t0 + runs[k].out) on = 1; return 0.6 + 7 * on; }, D);

  /* the scan of an empty trough: a sweep every ~1.1 s while the agent "reads" */
  function scan(t) {
    if (t < tAns - 0.2 || t > tTen + 0.6) return { u: 0, on: 0 };
    var ph = ((t - (tAns - 0.2)) / 1.1) % 1;
    return { u: ph, on: Math.min(span(ph, 0, 0.08), 1 - span(ph, 0.85, 0.98)) };
  }

  var LS = [
    { t: 0, v: [-5.15, 1.75, 13.2, 0, 0, 0] },
    { t: Math.max(tStop - 0.35, 0.6), v: [-5.35, 1.7, 12.6, 0, 0, 0], e: "sine" },
    { t: tStop + 0.6, v: [-6.55, 1.62, 8.6, 0, 0, 0], e: "inOut" },
    { t: tAns - 0.4, v: [-6.45, 1.6, 8.3, 0, 0, 0], e: "sine" },
    { t: tAns + 0.55, v: [-3.0, 1.35, 11.2, 0, 0, 0], e: "inOut" },
    { t: tTen - 0.7, v: [-2.8, 1.3, 10.8, 0, 0, 0], e: "sine" },
    { t: tTen + 0.5, v: [1.6, 0.3, 15.2, 0, 0, 0], e: "inOut" },
    { t: tNot - 0.45, v: [1.9, 0.25, 14.6, 0, 0, 0], e: "sine" },
    { t: tNot + 0.45, v: [-5.6, -2.85, 10.0, 0, 0, 0], e: "inOut" },   // the JOB plate out of the top band; the drawers right of the meter column
    { t: tBig - 0.35, v: [-5.5, -2.8, 9.7, 0, 0, 0], e: "sine" },
    { t: tBig + 0.5, v: [2.75, 0.3, 14.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [2.9, 0.25, 13.8, 0, 0, 0], e: "sine" },
  ];
  /* PORTRAIT: a HUD shot frames the plate's full height at ~33 (the object ≈ 59% of the height), the plates
     sit in the band ABOVE the chassis and the bottom 16% stays clear; push-ins are short and carry no plate
     over a part that matters (MOTION_SPEC §10/§13, D-075). */
  var PTK = [
    { t: 0, v: [-5.1, 1.15, 33, 0, 0, 0] },
    { t: Math.max(tStop - 0.35, 0.6), v: [-5.3, 1.15, 31.5, 0, 0, 0], e: "sine" },
    { t: tStop + 0.6, v: [-6.6, 1.95, 14.0, 0, 0, 0], e: "inOut" },
    { t: tAns - 0.4, v: [-6.55, 1.95, 13.4, 0, 0, 0], e: "sine" },
    { t: tAns + 0.55, v: [-2.0, 2.35, 16.0, 0, 0, 0], e: "inOut" },
    { t: tTen - 0.7, v: [-1.95, 2.3, 15.4, 0, 0, 0], e: "sine" },
    { t: tTen + 0.5, v: [4.0, 1.2, 33, 0, 0, 0], e: "inOut" },
    { t: tNot - 0.45, v: [4.15, 1.2, 32, 0, 0, 0], e: "sine" },
    { t: tNot + 0.45, v: [-4.7, 1.1, 33, 0, 0, 0], e: "inOut" },
    { t: tBig - 0.35, v: [-4.6, 1.1, 32.2, 0, 0, 0], e: "sine" },
    { t: tBig + 0.5, v: [4.0, 1.2, 33, 0, 0, 0], e: "inOut" },
    { t: D, v: [4.05, 1.2, 32, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.hideSlips();
    M.valve(2, ramp(t, tQuiet + 0.1, tQuiet + 1.5, E.inOut));
    M.cut(ramp(t, tStop - 0.1, tStop + 1.0, E.out3));
    M.lamps("green", "green", "green", 1);
    var sc = scan(t);
    M.core(1 + 0.25 * Math.sin(t * 2.2) + 0.5 * sc.on, sc.u, sc.on);
    M.press(roll(t));
    M.clock(-1.2 + 1.2 * span(t, 0, tTen));
    M.drawerState(null, -1);
    var done = 0, big = 0;
    for (var k = 0; k < printers.length; k++) {
      var st = printers[k].update(t);
      if (st.racked || (t >= runs[k].t0 + runs[k].out)) { if (runs[k].big) big++; else done++; }
    }
    numEl.textContent = String(done);
    bnumEl.textContent = String(big);
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "ok" : "";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
