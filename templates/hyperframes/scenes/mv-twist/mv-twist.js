/* mv-twist — 025 s6, THE TWIST (mechanical, blue + gold, face-on).
 *
 * PREMISE. The beat the video exists for, so it is staged as a replay. The fuller job is four more gold
 * modules seating beside the lever (WHEN, READ, REPORT; DO was always there): the five-line card as five
 * physical things. Ten runs go into the tray. Then the SAME slip as s4 happens again, on camera: the same
 * kind of red-tagged card comes down the rail and gets the same wrong address at the reader. The viewer
 * expects the chute. It slides down the dropped bed and lands in DRAFTS. And the machine tells on itself:
 * bell, flag, and a strip of paper with the report's own words on it.
 *
 * SHOTS:  A 0    wide; the modules seat one by one        "Then I gave it a fuller job. Five lines: the same stop line, plus a report."
 *         B b2   ten runs, zero sent                       "Ten more runs. Still zero sent."
 *         C b3   three runs turn; push in on the rail      "But the slip came back, in three runs."
 *         D b4   close on the reader: wrong address        "The same kind of stray, to the wrong address."
 *         E b5   follow it down into the tray              "This time it landed in a drafts folder."
 *         F b6   the report prints its own warning         "…the report flagged it: delete this before anything goes out."
 */
var S = HF.scene({ id: "mv-twist", width: 1920, height: 1080, frames: 689, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.07), b2 = K.b(2, 0.25), b3 = K.b(3, 0.38), b4 = K.b(4, 0.5), b5 = K.b(5, 0.64), b6 = K.b(6, 0.76);
var m = props.measured || {};
var tFive = K.m("five", b1), tStop = K.m("stop", b1 + 1.65), tReport = K.m("report", b1 + 3.0), tZero = K.m("zero", b2 + 1.8), tThree = K.m("three", b3 + 1.4);
var tWrong = K.m("wrong", b4 + 1.75), tLanded = K.m("landed", b5 + 0.45), tBell = K.m("report1", b6 + 1.55), tFlagged = K.m("flagged", b6 + 1.95), tDelete = K.m("delete", b6 + 3.0);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var RUNS = m.cardRuns || 10;

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
function tag(id, txt) { return '<div class="hw-plate hm-tag" id="' + id + '">' + txt + '</div>'; }
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">five-line job card · <b>' + RUNS + ' unattended runs</b></div>' +
  tag("tWhen", "when") + tag("tRead", "read") + tag("tDo", "do") + tag("tStop", "stop") + tag("tRep", "report") +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-meter gold sm" id="meter"><div class="job">job card</div><div class="row"><span class="num">' + (m.cardSent || 0) + '</span><span class="unit">emails sent</span></div><div class="sub" id="msub">stray draft in <b style="color:#ff9a9a">' + (m.cardStrayRuns || 3) + '</b> of ' + RUNS + ' runs</div></div>' +
  '<div class="hw-plate hm-tag red" id="addr">wrong address<small>another client\'s invoice, again</small></div>' +
  '<div class="hw-plate hm-tag" id="landed">landed in drafts<small>nothing left the building</small></div>' +
  '<div class="hw-plate hm-quote" id="quote"><div class="q">“Please delete it <span class="g">before anything else is sent.</span>”</div><div class="src">the agent\'s own report · <b>run 4 of ' + RUNS + '</b> · verbatim</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#tWhen", "#tRead", "#tDo", "#tStop", "#tRep", "#runs", "#meter", "#msub", "#addr", "#landed", "#quote"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.3);
[["#tWhen", 1.15], ["#tRead", tFive + 0.75], ["#tDo", tFive + 1.15], ["#tStop", tStop], ["#tRep", tReport + 0.15]].forEach(function (a) {
  HW.fromTo(tl, a[0], { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "back.out(1.8)" }, a[1]);
});
tl.to(["#tWhen", "#tRead", "#tDo", "#tStop", "#tRep"], { opacity: 0, duration: 0.25 }, b3 + 0.1);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, b2 - 0.1);
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tZero - 0.25);
HW.fromTo(tl, "#msub", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tThree + 0.1);
HW.fromTo(tl, "#addr", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tWrong + 0.1);
tl.to("#addr", { opacity: 0, duration: 0.2 }, b5 - 0.1);
HW.fromTo(tl, "#landed", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tLanded + 0.75);
tl.to(["#landed", "#runs", "#meter"], { opacity: 0, duration: 0.2 }, b6 + 0.1);
HW.fromTo(tl, "#quote", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tDelete - 0.35);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-twist", tl);
var toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.8, 0.2], keyAngle: 0.46 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L;
  var six = M.INVOICES.filter(function (v) { return v.kind === "go" && v.id !== "INV-1061"; });
  var runs = M.job(six.map(function (inv, i) { return { inv: inv, t0: b2 - 0.35 + i * 0.25, fate: "draft", pre: "due" }; }), { feed: 0.5, read: 0.24, move: 0.36, slide: 0.48 });
  /* the stray: slow under the reader so the verdict lands on "wrong address", then down into the tray */
  var a1 = b4 + 0.1, a2 = tWrong + 0.3;
  var stray = M.job([{ inv: M.INVOICES[4], t0: a1 - 0.95, fate: "draft", pre: "due", stray: true }],
    { feed: 0.95, read: a2 - a1, move: Math.max(tLanded - 0.1 - a2, 0.4), slide: 0.62, trayFrom: 6 });
  var strip = M.strip([
    { t: "Action needed", bold: true, red: true, size: 0.085 },
    { t: "A stray draft was saved by mistake. Please delete it before anything else is sent.", size: 0.062 },
    { t: "Drafted 6 · needs me 3 · already paid 3 · sent 0", bold: true, size: 0.05 },
  ], { w: 1.3, h: 1.68, title: "REPORT · RUN 4 OF 10" });

  var cam = M.cam([
    { t: 0, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: b3 + 0.15, v: [0, M.LOOK_Y, 26.5, 0, 0, 0], e: "out2" },
    { t: b3 + 1.25, v: [2.4, -0.35, 17, 0, 0, 0], e: "inOut" },
    { t: b4 - 0.25, v: [2.4, -0.35, 16.8, 0, 0, 0] },
    { t: b4 + 0.75, v: [1.0, 0.5, 8.8, 0, 0, 0], e: "inOut" },
    { t: a2 + 0.1, v: [1.1, 0.5, 8.6, 0, 0, 0], e: "out2" },
    { t: tLanded + 0.5, v: [5.1, -1.85, 11.2, 0, 0, 0], e: "inOut" },
    { t: b6 - 0.15, v: [5.1, -1.85, 11.0, 0, 0, 0] },
    { t: b6 + 0.95, v: [6.0, -1.6, 9.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [6.0, -1.6, 9.4, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    M.home();
    /* the fuller job: WHEN takes over from the crank, then READ and REPORT seat */
    M.assemble("crank", 1 - E.in2(span(t, 0.15, 0.75)), "off", { stagger: 0, ease: E.lin });
    M.assemble("when", span(t, 0.25, 1.35), "off", { stagger: 0.5 });
    M.assemble("read", span(t, tFive - 0.3, tFive + 0.9), "off", { stagger: 0.45 });
    M.assemble("report", span(t, tReport - 0.85, tReport + 0.3), "off", { stagger: 0.45 });
    M.drive(t * 0.7);
    M.tick(Math.max(t - 1.3, 0) * 5);
    M.lever(1);
    var a = runs.update(t), s = stray.update(t);
    for (var q = 0; q < runs.cards.length; q++) if (t < b2 - 0.6) runs.cards[q].group.visible = false;
    stray.cards[0].group.visible = t >= a1 - 1.2;
    var rd = s.scanOn > a.scanOn ? s : a;
    M.trap(0); M.push(0); M.core(Math.max(a.glow, s.glow), rd.scanU, rd.scanOn);
    /* it tells on itself: the hammer strikes the bell, the flag goes up, the strip feeds out */
    M.hammer(HW.pulse(t, tBell, 0.07, 0.28) + 0.6 * HW.pulse(t, tBell + 0.42, 0.06, 0.24));
    M.flag(E.outBack(span(t, tBell + 0.1, tBell + 0.5)));
    strip.print(E.out3(span(t, tFlagged - 0.45, tDelete + 0.5)));
    var done = Math.round(RUNS * span(t, b2 + 0.1, tZero - 0.1));
    for (var r = 0; r < toks.length; r++) toks[r].className = r >= done ? "" : (t >= tThree && (r === 3 || r === 7 || r === 8) ? "bad" : "ok");
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tLanded + 0.5, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.03 * hit, 0.022 * hit, 0.008 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
