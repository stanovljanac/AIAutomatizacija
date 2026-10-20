/* sf-never — 026 s11, THE JOB THAT NEVER RUNS (mechanical, blue + gold, face-on). Two sets: the line, the ledger.
 *
 * PREMISE. The one failure no line in a job can catch, because the job is not there to read it. On the line:
 * 07:00 passes on the clock and nothing starts — the lens stays dark, the press does not turn, no report comes
 * out, and nothing says so. Then our own: the channel's analytics job, on its own wall — a weekly stamp driven
 * by a belt from a clock, over eighteen weekly cells from June to October. The belt slips off its pulley a week
 * in. The weeks keep turning; every cell stays blank; nothing anywhere turns red. Source: our own ledger.
 *
 * SHOTS:  A 0          the line at 07:00: nothing starts          "Some failures no prompt can catch: the job that never runs."
 *         B report     the press: no paper                        "It writes no report at all."
 *         C happened   CUT to the ledger, wide                    "That's what happened to my channel."
 *         D analytics  the drive runs                             "Its analytics job was meant to measure every video, every week."
 *         E schedule   the belt slips off                         "But its schedule quietly expired after a week, …"
 *         F four       the weeks turn; every cell blank           "For four months, it measured nothing, and nothing complained."
 */
var S = HF.scene({ id: "sf-never", width: 1920, height: 1080, frames: 745, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tNever = K.m("never", 3.05), tReport = K.m("report", 4.9), tHap = K.m("happened", 6.55), tAn = K.m("analytics", 8.2), tWeek = K.m("week", 12.1);
var tSched = K.m("schedule", 13.4), tReg = K.m("registered", 18.5), tFour = K.m("four", 20.3), tNothing = K.m("nothing", 22.2);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag blue" id="none">07:00 → nothing ran<small>no report · no error · no alarm</small></div>' +
  '<div class="hw-plate hm-tag blue" id="reg">only videos with an ID typed in by hand<small>4 of 17 had one · our ledger, D-073</small></div>' +
  '<div class="hw-plate hm-meter sm" id="cnt"><div class="job">channel analytics · <b>Jun → Oct 2026</b></div><div class="row"><span class="num" id="wk">0</span><span class="unit">weeks · 0 measurements</span></div><div class="sub">0 of 68 ideas measured · our own ledger · DECISIONS D-073 · 17 Oct 2026</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#none", "#reg", "#cnt"], { opacity: 0 });
HW.fromTo(tl, "#none", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tNever + 0.3);
tl.to("#none", { opacity: 0, duration: 0.2 }, tHap - 0.35);
HW.fromTo(tl, "#reg", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tReg + 0.45);
tl.to("#reg", { opacity: 0, duration: 0.2 }, tFour - 0.3);
HW.fromTo(tl, "#cnt", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tFour - 0.1);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-never", tl);
var wkEl = document.getElementById("wk");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.5, 0.6] });
  var M = HWT.line(ctx, {});
  var GX = 34;
  var Lg = HWT.ledger(ctx, {});
  Lg.root.position.set(GX, 0, 0);
  if (PT) Lg.root.scale.setScalar(0.92);
  var th = HM.integral(function (t) { return t < tSched + 0.2 ? 1.8 : 0.9; }, D);
  /* the clock, the lens and the press in one frame; then the clock as its minute hand passes the hour; then the
     press that does not turn. The ledger keeps its top band clear for the count plate. */
  var LS = [
    { t: 0, v: [-2.2, 0.2, 19.5, 0, 0, 0] },
    { t: Math.max(tNever - 0.6, 1.2), v: [-2.4, 0.2, 18.8, 0, 0, 0], e: "sine" },
    { t: tNever + 0.3, v: [-6.1, 0.0, 9.6, 0, 0, 0], e: "inOut" },
    { t: tReport - 0.4, v: [-6.0, 0.0, 9.2, 0, 0, 0], e: "sine" },
    { t: tReport + 0.4, v: [2.6, -0.85, 9.6, 0, 0, 0], e: "inOut" },
    { t: tHap - 0.12, v: [2.6, -0.85, 9.2, 0, 0, 0], e: "sine" },
    { t: tHap - 0.11, v: [GX, 0.6, 21.5, 0, 0, 0], e: "cut" },
    { t: tAn + 0.2, v: [GX, 0.6, 20.5, 0, 0, 0], e: "sine" },
    { t: tAn + 1.0, v: [GX - 2.6, 1.6, 10.5, 0, 0, 0], e: "inOut" },
    { t: tReg - 0.4, v: [GX - 2.5, 1.55, 10.0, 0, 0, 0], e: "sine" },
    { t: tReg + 0.5, v: [GX, 0.9, 20.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [GX, 0.85, 19.8, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [2.6, 1.2, 33, 0, 0, 0] },
    { t: Math.max(tReport - 0.45, 1.5), v: [2.6, 1.2, 32, 0, 0, 0], e: "sine" },
    { t: tReport + 0.4, v: [2.55, 1.8, 15.5, 0, 0, 0], e: "inOut" },
    { t: tHap - 0.12, v: [2.55, 1.8, 15.0, 0, 0, 0], e: "sine" },
    { t: tHap - 0.11, v: [GX - 3.2, 2.6, 18, 0, 0, 0], e: "cut" },
    { t: tReg - 0.4, v: [GX - 3.1, 2.5, 17, 0, 0, 0], e: "sine" },
    { t: tReg + 0.5, v: [GX - 2.6, 0.4, 24, 0, 0, 0], e: "inOut" },
    { t: tFour + 0.2, v: [GX - 2.6, 0.4, 23, 0, 0, 0], e: "sine" },
    { t: D, v: [GX + 2.4, 0.4, 23, 0, 0, 0], e: "inOut" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.hideSlips();
    M.lamps("green", "green", "green", 1);
    M.core(0.22, 0, 0);                 // the lens never wakes
    M.press(0);
    M.clock(-2.5 + 2.6 * span(t, 0.3, tNever + 0.5) + 18 * span(t, tNever + 0.5, tHap));   // 06:57 → 07:20: it passes the hour in the close-up; nothing happens
    M.drawerState(null, -1);
    Lg.home();
    Lg.drive(th(t), span(t, tSched + 0.1, tSched + 1.1));
    /* week 1 while the belt still runs; then the weeks turn — slowly, then all eighteen through "four months" */
    var w = t < tFour - 0.2 ? 0.6 * span(t, tAn, tSched + 0.6) + 0.4 * span(t, tSched + 0.6, tFour - 0.2) : 1 + 16.9 * E.inOut(span(t, tFour - 0.2, tNothing + 0.9));
    Lg.week(w);
    Lg.stamp(t < tSched ? 0.5 + 0.5 * Math.sin(t * 3.0) : 0);
    wkEl.textContent = String(Math.min(18, Math.floor(w + 1)));
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
