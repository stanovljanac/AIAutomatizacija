/* mv-stop — 025 s5, THE STOP LINE (mechanical, blue + gold). The ONE oblique shot of the video.
 *
 * PREMISE. "Not a smarter prompt" has to be seen, so nothing about the agent changes: same core, same
 * drum, same line. What changes is one part. To show WHERE it goes the machine is opened along the lens
 * axis and the camera steps off-square just far enough to look between the layers — the one idea in this
 * video that does not fit in a face-on frame: there is nothing between the agent and the chute. The gold
 * lever, its rod and its flap arrive as separate parts and seat on the empty mount. The layers close, the
 * camera squares up on the engraved line, the lever is thrown, and ten runs of cards go into DRAFTS.
 *
 * SHOTS:  A 0    the machine opens; lens off-square       "So I changed the job. Not a smarter prompt."
 *         B b1   the lever parts arrive and seat; close; square up on the line   "One extra line: never send an email. Save drafts only."
 *         C b2   thrown; ten runs into the tray            "Ten more runs."
 *         D b3   the counter: 0                            "Zero emails sent."
 */
var S = HF.scene({ id: "mv-stop", width: 1920, height: 1080, frames: 333, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.26), b2 = K.b(2, 0.65), b3 = K.b(3, 0.78);
var m = props.measured || {};
var tSmarter = K.m("smarter", 1.4), tNever = K.m("never", b1 + 1.3), tDrafts = K.m("drafts", b1 + 3.0), tTen = K.m("ten", b2), tZero = K.m("zero", b3);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var RUNS = m.stopRuns || 10;

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">the same job <b>+ one line</b> · ' + RUNS + ' unattended runs</div>' +
  '<div class="hw-plate hm-tag red" id="gap">nothing here<small>between the agent and SEND</small></div>' +
  '<div class="hw-plate hw-kicker sm" id="k1">Never send an email: <span class="g">save drafts only.</span></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-meter gold" id="meter"><div class="job">+ the stop line · <b>' + RUNS + ' runs</b></div><div class="row"><span class="num">' + (m.stopSent || 0) + '</span><span class="unit">emails sent</span></div><div class="sub">7 drafts every run, the same 7</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#gap", "#k1", "#runs", "#meter"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.3);
HW.fromTo(tl, "#gap", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tSmarter - 0.15);
tl.to("#gap", { opacity: 0, duration: 0.2 }, b1 + 0.35);
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tNever - 0.2);
tl.to("#k1", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b2 - 0.15);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, tTen - 0.1);
HW.fromTo(tl, "#meter", { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.6)" }, tZero - 0.05);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-stop", tl);
var toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [1.5, 0.6], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var L = M.L;
  var tThrow = tDrafts - 0.12;
  /* ten runs, shown as one fast pass of seven cards into the tray */
  var seven = M.INVOICES.filter(function (v) { return v.kind === "go"; });
  var job = M.job(seven.map(function (inv, i) { return { inv: inv, t0: tThrow + 0.25 + i * 0.26, fate: "draft", pre: "due" }; }), { feed: 0.5, read: 0.24, move: 0.36, slide: 0.48 });
  var tClose0 = b1 + 1.05, tClose1 = b1 + 2.1;
  function open(t) { return 0.62 * Math.min(E.inOut(span(t, 0.12, 1.35)), 1 - E.inOut(span(t, tClose0, tClose1))); }

  var cam = M.cam([
    { t: 0, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: 1.5, v: [1.6, 0.3, 33, 0.5, 0.1, 0], e: "inOut" },
    { t: tClose0 - 0.05, v: [1.9, 0.4, 32, 0.56, 0.11, 0], e: "out2" },
    { t: tClose1 + 0.35, v: [5.7, 2.0, 11.8, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.3, v: [5.7, 2.0, 11.5, 0, 0, 0], e: "out2" },
    { t: b2 + 0.75, v: [4.5, -0.95, 16.2, 0, 0, 0], e: "inOut" },
    { t: D, v: [4.5, -0.95, 15.9, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    var op = open(t);
    M.home();
    M.assemble("chassis", 1 - op, "layers", { stagger: 0, ease: E.lin });
    M.assemble("do", 1 - op, "layers", { stagger: 0, ease: E.lin });
    M.assemble("crank", 1 - op, "layers", { stagger: 0, ease: E.lin });
    M.set("when", false); M.set("read", false); M.set("report", false);
    /* the lever's parts arrive one by one and seat on the open layer, then close with the machine */
    M.assemble("stop", span(t, b1 - 0.15, b1 + 1.15), "off", { stagger: 0.5 });
    var sp = M.groups.stop;
    for (var i = 0; i < sp.length; i++) sp[i].obj.position.z += M.LAYER_Z[sp[i].layer] * op;

    M.drive(t * 0.7);
    M.lever(Math.min(E.outBack(span(t, tThrow, tThrow + 0.28)), 1.06));
    var st = job.update(t);
    for (var q = 0; q < job.cards.length; q++) if (t < tThrow - 0.2) job.cards[q].group.visible = false;
    M.trap(0); M.push(0); M.core(st.glow, st.scanU, st.scanOn); M.hammer(0); M.flag(0);
    var done = Math.round(RUNS * span(t, tTen + 0.05, tZero - 0.15));
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "ok" : "";
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tThrow + 0.2, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.03 * hit, 0.022 * hit, 0.008 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
