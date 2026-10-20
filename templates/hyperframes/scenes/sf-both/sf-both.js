/* sf-both — 026 s13, CHECK THE RESULT, CHECK THE RUN (mechanical, blue + gold, face-on). Sets 1 + 4 together.
 *
 * PREMISE. Two instruments, each blind where the other sees — shown as two cases, one at a time.
 *   Case 1: the job runs ON TIME (its heartbeat token drops, the watcher re-arms, calm) but its report says
 *           nothing came in: the form is cut. Only the lines catch it — the ALARM flag goes up on the machine.
 *   Case 2: the job never starts. No report, nothing for the lines to read. The watcher's needle runs out and
 *           its bell rings. Only the watcher catches it.
 *   Then both calm on a believable report — and a plain note that neither proves every detail is right.
 *
 * SHOTS:  A 0         both, wide; the two labels                "Keep both checks: each one is blind where the other sees."
 *         B time      case 1: token on time, zero report, flag    "A job can check in on time with a report that says nothing came in; only the lines catch that."
 *         C never     case 2: nothing runs; the bell              "A run that never happened writes nothing; only the watcher catches that."
 *         D together  both calm; the honest limit                 "Even together, they prove the job ran and saw something believable…"
 */
var S = HF.scene({ id: "sf-both", width: 1920, height: 1080, frames: 730, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tTime = K.m("time", 5.2), tNothing = K.m("nothing", 7.3), tLines = K.m("lines", 9.4), tNever = K.m("never", 11.8), tWatch = K.m("watcher", 14.8);
var tTog = K.m("together", 16.8), tDetail = K.m("detail", 22.6);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag" id="lbL">the two lines<small>check the RESULT: is it believable?</small></div>' +
  '<div class="hw-plate hm-tag" id="lbR">the watcher<small>check the RUN: did it happen at all?</small></div>' +
  '<div class="hw-plate hm-note" id="c1">case 1 · on time, says nothing came in → <b>only the lines</b></div>' +
  '<div class="hw-plate hm-note" id="c2">case 2 · never ran → <b>only the watcher</b></div>' +
  '<div class="hw-plate hm-tag blue" id="lim">neither proves every detail is right<small>a believable report can still be wrong — that is a different check</small></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#lbL", "#lbR", "#c1", "#c2", "#lim"], { opacity: 0 });
HW.fromTo(tl, "#lbL", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, 0.5);
HW.fromTo(tl, "#lbR", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, 1.4);
HW.fromTo(tl, "#c1", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tLines + 0.3);
tl.to("#c1", { opacity: 0, duration: 0.2 }, tNever - 0.2);
HW.fromTo(tl, "#c2", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tWatch + 0.3);
tl.to("#c2", { opacity: 0, duration: 0.2 }, tTog - 0.2);
HW.fromTo(tl, "#lim", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tDetail - 1.6);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-both", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.0, 0.6] });
  var M = HWT.line(ctx, {});
  var Wt = HWT.watcher(ctx, { job: "MORNING REPORT", sub: "proof by 07:15", label: "WATCHER" });
  if (PT) { M.root.position.set(0, 2.2, 0); M.root.scale.setScalar(0.45); Wt.root.position.set(0, -2.6, 0); Wt.root.scale.setScalar(0.6); }
  else { M.root.position.set(-4.6, 0.1, 0); M.root.scale.setScalar(0.52); Wt.root.position.set(4.7, 0.1, 0); Wt.root.scale.setScalar(0.82); }
  /* case 1: a zero report (the form is cut); case 3: a healthy one */
  var pr1 = M.print({ i: 0, state: "alarm", t0: tNothing + 0.6, out: 0.9, hold: Math.max(tNever - 0.8 - (tNothing + 1.5), 0.5), rack: 0.5, slot: 0 });
  var fOk = M.flow(M.REQUESTS.map(function (rq, k) { return { t0: tTog + 0.2 + k * 0.4, kind: "new", idx: k }; }), { slide: 0.7, read: 0.25 });
  var pr3 = M.print({ i: 1, state: "ok", t0: tTog + 3.4, out: 0.9, hold: Infinity, slot: 1, opt: { proof: true } });
  var tTok1 = tTime + 0.5, tDue = tWatch - 0.05, tTok3 = tTog + 0.1;
  function needle(t) {
    if (t < tTok1) return 1 - 0.4 * span(t, -2, tTok1 + 3);
    if (t < tTok3) return 1 - span(t, tTok1 + 0.15, tDue);
    return 1 - 0.3 * span(t, tTok3 + 0.15, D + 6);
  }
  var LS = [
    /* both instruments whole: the line spans -8.9..-0.3, the watcher 2.9..6.5 */
    { t: 0, v: [-1.3, 0.4, 25, 0, 0, 0] },
    { t: Math.max(tTime - 0.6, 2.5), v: [-1.2, 0.4, 24.2, 0, 0, 0], e: "sine" },
    { t: tTime + 0.3, v: [4.7, 0.5, 15.0, 0, 0, 0], e: "inOut" },        // case 1: the watcher gets its token, on time
    { t: tNothing - 0.45, v: [4.7, 0.5, 14.5, 0, 0, 0], e: "sine" },
    { t: tNothing + 0.35, v: [-3.6, 0.35, 15.0, 0, 0, 0], e: "inOut" },   // …and the report says nothing came in (the cut form in frame)
    { t: tNever - 0.4, v: [-3.5, 0.35, 14.4, 0, 0, 0], e: "sine" },
    { t: tNever + 0.6, v: [2.0, 0.35, 14.6, 0, 0, 0], e: "inOut" },
    { t: tTog - 0.3, v: [2.1, 0.35, 14.0, 0, 0, 0], e: "sine" },
    { t: tTog + 0.8, v: [-1.3, 0.4, 25, 0, 0, 0], e: "inOut" },
    { t: D, v: [-1.3, 0.4, 24, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [0, 0.9, 40, 0, 0, 0] },
    { t: tTime + 0.6, v: [0, 2.4, 22, 0, 0, 0], e: "inOut" },
    { t: tNever - 0.4, v: [0, 2.4, 21, 0, 0, 0], e: "sine" },
    { t: tNever + 0.6, v: [0, -1.5, 22, 0, 0, 0], e: "inOut" },
    { t: tTog - 0.3, v: [0, -1.5, 21, 0, 0, 0], e: "sine" },
    { t: tTog + 0.8, v: [0, 0.9, 40, 0, 0, 0], e: "inOut" },
    { t: D, v: [0, 0.9, 39, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(true);
    M.hideSlips();
    /* case 1: the form is cut for the run that reports zero; restored for the healthy run */
    var cut = Math.min(span(t, tNothing - 0.3, tNothing + 0.4), 1 - span(t, tNever - 0.4, tNever));
    M.valve(2, cut); M.cut(cut);
    M.flag(E.out3(Math.min(span(t, tLines - 0.25, tLines + 0.5), 1 - span(t, tNever - 0.5, tNever - 0.1))));
    M.lamps("green", "green", "green", 1);
    /* case 2: the machine never wakes — the lens stays dark from "never" to "together" */
    var asleep = t > tNever - 0.2 && t < tTog;
    var st = fOk.update(t);
    M.core(asleep ? 0.2 : st.glow, st.scanU, st.scanOn);
    M.press(asleep ? 0 : t * 0.6);
    M.clock(asleep ? 15 * span(t, tNever, tWatch) : 0.3 + t * 0.03);
    M.drawerState(null, -1);
    M.proofShow(t > tNothing + 0.4 && t < tNever ? "00" : t > tTog + 3.0 ? "07" : "--", t > tNothing + 0.4 && t < tNever ? "none" : t > tTog + 3.0 ? "19:48" : "--:--", t > tNothing + 0.4 && t < tNever ? "#ffffff" : null);
    pr1.update(t); pr3.update(t);
    Wt.home();
    Wt.needle(needle(t));
    var alarm = t >= tDue && t < tTok3;
    Wt.strike(alarm ? Math.max(E.out3(span(t, tDue, tDue + 0.18)) - 0.3 * span(t, tDue + 0.18, tDue + 0.6), 0) : 0);
    Wt.ring(alarm ? Math.exp(-(t - tDue - 0.16) * 0.8) : 0, t);
    Wt.lampState(alarm ? "red" : "green", alarm ? 0.8 + 0.3 * Math.sin(t * 8) : 1);
    var k1 = span(t, tTok1 - 0.45, tTok1), k3 = span(t, tTok3 - 0.45, tTok3);
    if (t < tTok3 - 0.45) Wt.tokenAt(k1, span(t, tTok1 + 0.25, tTok1 + 0.6)); else Wt.tokenAt(k3, span(t, tTok3 + 0.25, tTok3 + 0.6));
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
