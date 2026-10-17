/* mvs-twist — 025 SHORT s5, THE TWIST (mechanical, portrait, blue + gold, face-on).
 *
 * PREMISE. The beat the Short exists for, staged as a replay. "A fuller job" is the whole machine for a moment —
 * the one time the Short shows all of it, a long gold-studded band across the tall frame — as WHEN, READ and
 * REPORT seat beside the DO drum and the STOP lever: five lines as five physical modules. Then the lens dives to
 * the reader and the SAME slip happens again on camera: the same kind of card comes up WRONG ADDRESS. The viewer
 * expects the chute. It slides down the dropped bed and lands face up in DRAFTS. And the machine tells on itself:
 * the bell, the flag, and a strip of paper with the report's own words.
 *
 * SHOTS (every mark from the narration):
 *   A  0    the whole machine; the modules seat              "Then a fuller job, same line."
 *   B  b1   the reader: the same slip, WRONG ADDRESS         "The same slip came back, in three of ten runs."
 *   C  b2   down into the tray; bell, flag, the report       "This time it landed in drafts, flagged in the report."
 */
var S = HF.scene({ id: "mvs-twist", width: 1080, height: 1920, frames: 294, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.22), b2 = K.b(2, 0.6);
var m = props.measured || {};
var RUNS = m.cardRuns || 10;
var tSame = K.m("same", 0.96), tSlip = K.m("slip", b1 + 0.32), tThree = K.m("three", b1 + 1.8);
var tLanded = K.m("landed", b2 + 0.45), tFlagged = K.m("flagged", b2 + 2.0), tReport = K.m("report", b2 + 2.7);
var E = HW.E, span = HF3.span, mix = HF3.mix;

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i class='ok'></i>";
var MODS = ["when", "read", "do", "stop", "report"];
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">five-line job card · <b>the same stop line</b> · ' + RUNS + ' runs</div>' +
  '<div class="hw-plate hm-mods" id="mods">' + MODS.map(function (k) { return '<span id="m-' + k + '">' + k + '</span>'; }).join("") + '</div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-meter gold sm" id="meter"><div class="job">job card</div><div class="row"><span class="num">' + (m.cardSent || 0) + '</span><span class="unit">emails sent</span></div><div class="sub">stray draft in <b style="color:#ff9a9a">' + (m.cardStrayRuns || 3) + '</b> of ' + RUNS + ' runs</div></div>' +
  '<div class="hw-plate hm-tag" id="landed">landed in drafts<small>nothing left the building</small></div>' +
  '<div class="hw-plate hm-quote" id="quote"><div class="q">“Please delete it before<br><span class="g">anything else is sent.</span>”</div><div class="src">the agent\'s own report · <b>run 4 of ' + RUNS + '</b> · verbatim</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#runs", "#meter", "#landed", "#quote"], { opacity: 0 });
gsap.set("#mods span", { opacity: 0.28 });
HW.fromTo(tl, "#m-do", { opacity: 0.28 }, { opacity: 1, duration: 0.2 }, 0.2);
HW.fromTo(tl, "#m-stop", { opacity: 0.28 }, { opacity: 1, duration: 0.2 }, 0.35);
HW.fromTo(tl, "#m-when", { opacity: 0.28, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2)" }, 0.75);
HW.fromTo(tl, "#m-read", { opacity: 0.28, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2)" }, 1.1);
HW.fromTo(tl, "#m-report", { opacity: 0.28, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2)" }, 1.45);
tl.to(["#chip", "#mods"], { opacity: 0, y: -14, duration: 0.22, ease: "power2.in" }, b1 + 0.15);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, b1 + 0.3);
HW.fromTo(tl, "#meter", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tThree - 0.25);
tl.to(["#runs", "#meter"], { opacity: 0, y: -14, duration: 0.22, ease: "power2.in" }, b2 + 0.2);
HW.fromTo(tl, "#landed", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tLanded + 0.55);
tl.to("#landed", { opacity: 0, duration: 0.2 }, tFlagged + 0.25);
HW.fromTo(tl, "#quote", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tReport - 0.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-twist", tl);
var toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [2.0, 0.2], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L;
  /* the stray: slow under the reader so its verdict lands on "slip", then down the dropped bed into the tray */
  var a1 = tSlip - 0.35, a2 = tSlip + 0.65;
  var tIn = Math.max(tLanded + 0.2, a2 + 1.2);
  var stray = M.job([{ inv: M.INVOICES[4], t0: a1 - 0.95, fate: "draft", pre: "due", stray: true }],
    { feed: 0.95, read: a2 - a1, move: Math.max(tIn - 0.62 - a2, 0.4), slide: 0.62, trayFrom: 6 });
  /* the run's six good drafts are already in the tray: the stray lands on top of them */
  var six = M.INVOICES.filter(function (v) { return v.kind === "go" && v.id !== "INV-1061"; });
  var rest = M.job(six.map(function (inv, i) { return { inv: inv, t0: -30 + i, fate: "draft", pre: "due" }; }), {});
  var strip = M.strip([
    { t: "Action needed", bold: true, red: true, size: 0.085 },
    { t: "A stray draft was saved by mistake. Please delete it before anything else is sent.", size: 0.062 },
    { t: "Drafted 6 · needs me 3 · already paid 3 · sent 0", bold: true, size: 0.05 },
  ], { w: 1.3, h: 1.68, title: "REPORT · RUN 4 OF 10" });
  var tBell = tFlagged - 0.15;

  var cam = M.cam([
    { t: 0, v: [0.05, -0.2, 75, 0, 0, 0] },
    { t: b1 - 0.35, v: [0.05, -0.2, 71.5, 0, 0, 0], e: "sine" },
    { t: b1 + 0.75, v: [1.55, 0.55, 17.5, 0, 0, 0], e: "inOut" },
    { t: a2 + 0.15, v: [1.65, 0.5, 16.8, 0, 0, 0], e: "out2" },
    { t: tIn - 0.1, v: [6.1, -1.6, 15.8, 0, 0, 0], e: "inOut" },
    { t: tBell - 0.1, v: [6.15, -1.6, 15.4, 0, 0, 0], e: "out2" },
    { t: D, v: [6.4, -1.45, 15.2, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    /* the fuller job: WHEN takes over from the crank, then READ and REPORT seat */
    M.assemble("crank", 1 - E.in2(span(t, 0.1, 0.6)), "off", { stagger: 0, ease: E.lin });
    M.assemble("when", span(t, 0.2, 1.0), "off", { stagger: 0.5 });
    M.assemble("read", span(t, 0.55, 1.35), "off", { stagger: 0.45 });
    M.assemble("report", span(t, 0.9, 1.7), "off", { stagger: 0.45 });
    M.drive(t * 0.7);
    M.tick(Math.max(t - 0.9, 0) * 5);
    M.lever(1);
    rest.update(t);
    var s = stray.update(t);
    stray.cards[0].group.visible = t >= a1 - 1.2;
    M.trap(0); M.push(0); M.core(s.glow, s.scanU, s.scanOn);
    /* it tells on itself: the hammer strikes the bell, the flag goes up, the strip feeds out */
    M.hammer(HW.pulse(t, tBell, 0.07, 0.28) + 0.6 * HW.pulse(t, tBell + 0.42, 0.06, 0.24));
    M.flag(E.outBack(span(t, tBell + 0.1, tBell + 0.5)));
    strip.print(E.out3(span(t, tFlagged - 0.35, tReport + 0.45)));
    for (var r = 0; r < toks.length; r++) toks[r].className = t >= tThree && (r === 3 || r === 7 || r === 8) ? "bad" : "ok";
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tIn, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.03 * hit, 0.022 * hit, 0.008 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
