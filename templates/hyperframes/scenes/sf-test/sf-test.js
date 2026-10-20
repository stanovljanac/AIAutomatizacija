/* sf-test — 026 s2, THE TEST (mechanical, blue + gold, face-on).
 *
 * PREMISE. Before anything breaks, the viewer needs the machine in their head — so it ASSEMBLES on the
 * explanation, and then runs one healthy morning: seven real requests drop out of the website form, slide
 * under the agent, fall into IN, and the press prints a report with seven names. On "three different ways"
 * the three handwheels twitch, each under its plate; on "two lines" the two gold modules swing up to their
 * empty mounts and hover — a promise, not yet installed. The chips say what this is: a small test.
 *
 * SHOTS:  A 0        exploded → assembled, wide                "I measured it, because my own channel's…"
 *         B agent    the lens; slips arrive                     "A scheduled AI agent writes one morning report…"
 *         C morning  wide right: IN fills, the report prints
 *         D form     the website form housing                   "…a renovation company's website form."
 *         E broke    the three handwheels                       "Then I broke the form behind it, three different ways,"
 *         F two      the two gold modules at their mounts       "…and found two lines that catch all three."
 *         G small    wide, the chips                            "A small test, not a benchmark…"
 */
var S = HF.scene({ id: "sf-test", width: 1920, height: 1080, frames: 853, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var m = props.measured || {};
var E = HW.E, span = HF3.span, mix = HF3.mix;
var b1 = K.b(1, 0.24), b2 = K.b(2, 0.5), b3 = K.b(3, 0.74);
var tFour = K.m("four", 4.0), tAgent = K.m("agent", 7.0), tMorning = K.m("morning", 8.6), tForm = K.m("form", 13.6);
var tBroke = K.m("broke", 14.6), tThree = K.m("three", 16.2), tTwo = K.m("two", 18.4), tSmall = K.m("small", 21.0);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag blue" id="own">my own analytics job<small>4 months · 0 measurements · no error</small></div>' +
  '<div class="hw-plate hm-tag" id="two">two lines<small>PROOF · ALARM — installed later</small></div>' +
  '<div class="hw-plate hw-chip" id="chip">' + (m.model || "Claude Haiku 5.5") + ' · unattended · <b>synthetic data</b></div>' +
  '<div class="hw-plate hm-note" id="demo">a small test, <b>not a benchmark</b></div>' +
  '<div class="hw-plate hm-note" id="scope">one job · <b>5–10 runs</b> per case</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#own", "#two", "#chip", "#demo", "#scope"], { opacity: 0 });
HW.fromTo(tl, "#own", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tFour - 0.1);
tl.to("#own", { opacity: 0, y: -10, duration: 0.2, ease: "power2.in" }, tAgent - 0.4);
HW.fromTo(tl, "#two", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tTwo + 0.4);
tl.to("#two", { opacity: 0, duration: 0.2 }, tSmall - 0.4);
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, tSmall + 0.05);
HW.fromTo(tl, "#demo", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, tSmall + 0.35);
HW.fromTo(tl, "#scope", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, tSmall + 1.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-test", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-1.0, 0.6] });
  var M = HWT.line(ctx, {});
  /* the healthy morning: seven requests, then the report with seven names */
  var S0 = Math.max(tAgent - 0.4, b1 - 0.2), SG = 0.5;
  var flow = M.flow(M.REQUESTS.map(function (rq, k) { return { t0: S0 + k * SG, kind: "new", idx: k }; }), { slide: 0.95, read: 0.38 });
  var tPrint = S0 + 6 * SG + 1.9;
  var pr = M.print({ i: 0, state: "ok", t0: tPrint, out: 1.1, hold: Math.max(tForm - tPrint - 0.6, 1.5), rack: 0.7, slot: 0 });
  var roll = HM.integral(function (t) { return 0.5 + 7 * (t >= tPrint && t < tPrint + 1.1 ? 1 : 0); }, D);

  var LS = [
    { t: 0, v: [0.0, 0.0, 30.5, 0, 0, 0] },
    { t: Math.max(tAgent - 0.6, 3), v: [0.0, 0.0, 26.5, 0, 0, 0], e: "sine" },
    { t: tAgent + 0.35, v: [-2.6, 1.35, 12.2, 0, 0, 0], e: "inOut" },
    { t: tMorning + 0.3, v: [-2.4, 1.3, 11.8, 0, 0, 0], e: "sine" },
    { t: tMorning + 1.3, v: [0.9, 0.25, 16.4, 0, 0, 0], e: "inOut" },
    { t: tForm - 0.45, v: [1.1, 0.25, 15.8, 0, 0, 0], e: "sine" },
    { t: tForm + 0.35, v: [-6.3, 1.85, 9.6, 0, 0, 0], e: "inOut" },
    { t: tBroke + 0.1, v: [-6.1, 1.85, 9.4, 0, 0, 0], e: "sine" },
    { t: tBroke + 0.8, v: [-4.4, 1.75, 8.8, 0, 0, 0], e: "inOut" },
    { t: tTwo - 0.35, v: [-4.4, 1.75, 8.4, 0, 0, 0], e: "sine" },
    { t: tTwo + 0.55, v: [5.1, 1.5, 11.6, 0, 0, 0], e: "inOut" },
    { t: tSmall - 0.4, v: [5.2, 1.5, 11.0, 0, 0, 0], e: "sine" },
    { t: tSmall + 0.7, v: [0.0, 0.0, 26.0, 0, 0, 0], e: "inOut" },
    { t: D, v: [0.0, -0.05, 24.5, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [-4.4, 1.15, 36, 0, 0, 0] },
    { t: Math.max(tAgent - 0.6, 3), v: [-4.6, 1.15, 33, 0, 0, 0], e: "sine" },
    { t: tAgent + 0.35, v: [-2.0, 2.3, 16.0, 0, 0, 0], e: "inOut" },
    { t: tMorning + 0.3, v: [-1.95, 2.3, 15.4, 0, 0, 0], e: "sine" },
    { t: tMorning + 1.3, v: [2.9, 1.2, 33, 0, 0, 0], e: "inOut" },
    { t: tForm - 0.45, v: [3.0, 1.2, 32, 0, 0, 0], e: "sine" },
    { t: tForm + 0.35, v: [-6.1, 2.55, 15.5, 0, 0, 0], e: "inOut" },
    { t: tBroke + 0.1, v: [-6.05, 2.55, 15.0, 0, 0, 0], e: "sine" },
    { t: tBroke + 0.8, v: [-4.4, 2.5, 14.6, 0, 0, 0], e: "inOut" },
    { t: tTwo - 0.35, v: [-4.4, 2.5, 14.0, 0, 0, 0], e: "sine" },
    { t: tTwo + 0.55, v: [5.4, 2.1, 22, 0, 0, 0], e: "inOut" },
    { t: tSmall - 0.4, v: [5.4, 2.1, 21, 0, 0, 0], e: "sine" },
    { t: tSmall + 0.7, v: [-0.4, 1.15, 33, 0, 0, 0], e: "inOut" },
    { t: D, v: [-0.3, 1.15, 32, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);
  var asmEnd = Math.max(Math.min(tAgent - 0.8, 6.0), 3.5);

  function pose(t) {
    M.home(false);
    M.assemble(null, span(t, 0.0, asmEnd), "exploded", { stagger: 0.55 });
    /* the two gold modules: parked, then up to their mounts on "two" — hovering, not seated — and away again */
    var hover = Math.min(span(t, tTwo - 0.1, tTwo + 0.9), 1 - span(t, tSmall - 0.6, tSmall + 0.3));
    M.assemble("proof", 0.62 * E.inOut(hover), "off", { stagger: 0.2 });
    M.assemble("alarm", 0.62 * E.inOut(hover), "off", { stagger: 0.2 });
    M.flag(0.42);                                   // the mast half up, the flag furled: a promise, not an alarm
    /* the three handwheels twitch, one per beat of "three different ways" */
    for (var i = 0; i < 3; i++) { var a = tBroke + 0.35 + i * Math.max((tThree - tBroke) / 2.2, 0.45); M.valve(i, 0.22 * Math.sin(Math.PI * span(t, a, a + 0.55))); }
    M.lamps("green", "green", "green", span(t, asmEnd - 0.6, asmEnd));
    var st = flow.update(t);
    M.core(st.glow * Math.max(span(t, asmEnd - 0.5, asmEnd), 0.15), st.scanU, st.scanOn);
    M.press(roll(t));
    M.clock(-1.0 + 1.0 * span(t, 0, S0));
    M.drawerState(null, -1);
    pr.update(t);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
