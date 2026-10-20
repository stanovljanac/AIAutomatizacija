/* sf-old — 026 s4, THE CONFUSING WAY (mechanical, blue + gold, face-on).
 *
 * PREMISE. The agent is not stupid — the scene shows it catching the trick — and the report still lies by
 * layout. The OLD DATA handwheel turns; six slips come down the trough wearing a 12 OCT rubber stamp. Under the
 * lens the agent pulls the 12 OCT drawer and its outline goes red: same names, already reported. And then the
 * press prints a report whose HEADLINE is a calm "0 new", with the warning in small grey type at the bottom.
 * The camera does what a reader does: it goes to the headline, and the warning slides out under the frame.
 *
 * SHOTS:  A 0          the handwheels; OLD DATA turns           "Second, the confusing way."
 *         B served     the trough + lens: six stamped slips      "The form re-served six requests from five days earlier…"
 *         C matching   the drawers: 12 OCT comes out, red        "The agent spotted it in all five runs, by matching the names…"
 *         D zero       the press: "0 new" headline               "And every report still opened with: zero new requests."
 *         E warning    push in on the headline; the note drops   "The warning sat underneath, where nobody reads first."
 */
var S = HF.scene({ id: "sf-old", width: 1920, height: 1080, frames: 723, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var m = props.measured || {};
var E = HW.E, span = HF3.span, mix = HF3.mix;
var RUNS = (m.plainStale || [5, 5])[1];
var tConf = Math.max(K.m("confusing", 0.6), 0.3), tServed = K.m("served", 2.3), tSpot = K.m("spotted", 8.5), tMatch = K.m("matching", 10.4);
var tOlder = K.m("older", 12.0), tZero = K.m("zero", 15.2), tWarn = K.m("warning", 17.4), tUnder = K.m("underneath", 18.4);

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-meter" id="meter"><div class="job">plain job · <b>old data</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">/ ' + RUNS + ' spotted it</span></div><div class="sub">headline: <b style="color:#fff">“0 new requests”</b></div></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">headline “0 new”</span>' + tok + '</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#meter", "#runs"], { opacity: 0 });
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tSpot - 0.1);
/* the counter steps aside while the camera is on the drawers (it would sit on the IN box), and comes back with the report */
tl.to("#meter", { opacity: 0, duration: 0.2 }, tMatch + 0.25);
HW.fromTo(tl, "#meter", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tZero + 0.35);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tZero + 0.45);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-old", tl);
var numEl = document.getElementById("num"), toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-1.0, 0.6] });
  var M = HWT.line(ctx, {});
  var S0 = tServed - 0.1, SG = Math.max(0.42, (tSpot - 1.4 - S0) / 6);
  var flow = M.flow(M.STALE.map(function (rq, k) { return { t0: S0 + k * SG, kind: "old", idx: k }; }), { slide: 0.9, read: 0.4 });
  /* five runs: the first one is the one we read; it stays at the press for the push-in */
  var runs = [];
  var G0 = tSpot + 0.4, GG = Math.max(0.45, (tZero - 1.6 - G0) / (RUNS - 1));
  for (i = 0; i < RUNS - 1; i++) runs.push({ t0: G0 + i * GG, out: 0.34, hold: 0.1, rack: 0.34 });
  runs.push({ t0: tZero - 1.0, out: 1.0, hold: Infinity, rack: 0.6 });
  var printers = runs.map(function (r, k) { return M.print({ i: k, state: "buried", t0: r.t0, out: r.out, hold: r.hold, rack: r.rack, slot: k }); });
  var roll = HM.integral(function (t) { var on = 0; for (var k = 0; k < runs.length; k++) if (t >= runs[k].t0 && t < runs[k].t0 + runs[k].out) on = 1; return 0.6 + 7 * on; }, D);

  var LS = [
    { t: 0, v: [-4.4, 1.75, 9.2, 0, 0, 0] },
    { t: Math.max(tServed - 0.4, 0.8), v: [-4.35, 1.7, 8.8, 0, 0, 0], e: "sine" },
    { t: tServed + 0.5, v: [-2.45, 1.3, 11.6, 0, 0, 0], e: "inOut" },
    { t: tMatch - 0.45, v: [-2.35, 1.25, 11.0, 0, 0, 0], e: "sine" },
    { t: tMatch + 0.45, v: [-4.2, -1.75, 10.0, 0, 0, 0], e: "inOut" },
    { t: tZero - 0.4, v: [-4.1, -1.8, 9.6, 0, 0, 0], e: "sine" },
    { t: tZero + 0.45, v: [2.55, 0.6, 12.6, 0, 0, 0], e: "inOut" },
    { t: tWarn - 0.3, v: [2.55, 0.65, 12.0, 0, 0, 0], e: "sine" },
    { t: tUnder + 0.6, v: [3.1, 2.35, 6.2, 0, 0, 0], e: "inOut" },     // the sheet left, the meter right: no plate over the headline
    { t: D, v: [3.1, 2.4, 5.9, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [-4.4, 2.5, 14.5, 0, 0, 0] },
    { t: Math.max(tServed - 0.4, 0.8), v: [-4.35, 2.5, 14.0, 0, 0, 0], e: "sine" },
    { t: tServed + 0.5, v: [-2.6, 2.2, 17.0, 0, 0, 0], e: "inOut" },
    { t: tMatch - 0.45, v: [-2.5, 2.2, 16.4, 0, 0, 0], e: "sine" },
    { t: tMatch + 0.45, v: [-4.7, 1.1, 33, 0, 0, 0], e: "inOut" },
    { t: tZero - 0.4, v: [-4.65, 1.1, 32, 0, 0, 0], e: "sine" },
    { t: tZero + 0.45, v: [3.0, 1.2, 33, 0, 0, 0], e: "inOut" },
    { t: tWarn - 0.3, v: [3.0, 1.2, 32, 0, 0, 0], e: "sine" },
    { t: tUnder + 0.6, v: [2.55, 2.85, 9.4, 0, 0, 0], e: "inOut" },
    { t: D, v: [2.55, 2.9, 9.0, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.valve(1, HW.ramp(t, tConf + 0.15, tConf + 1.4, E.inOut));
    M.lamps("green", "green", "green", 1);
    var st = flow.update(t);
    M.core(st.glow, st.scanU, st.scanOn);
    M.press(roll(t));
    M.clock(0.3 + t * 0.04);
    /* the 12 OCT drawer comes out on "matching" and its outline goes red; it goes home as the report prints */
    var dk = Math.min(span(t, tMatch - 0.1, tMatch + 0.5), 1 - span(t, tZero + 0.2, tZero + 0.8));
    var open = [0, 0, E.inOut(dk), 0, 0, 0, 0];
    M.drawerState(open, t > tOlder - 0.2 && dk > 0.4 ? 2 : -1);
    var done = 0;
    for (var k = 0; k < printers.length; k++) { printers[k].update(t); if (t >= runs[k].t0 + runs[k].out) done++; }
    numEl.textContent = String(Math.min(done, RUNS));
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "on" : "";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
