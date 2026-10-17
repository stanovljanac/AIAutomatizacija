/* mvs-stop — 025 SHORT s4, THE STOP LINE (mechanical, portrait, blue + gold, face-on).
 *
 * PREMISE. "Not a smarter prompt" has to be seen, so nothing about the agent changes — one part arrives. The
 * frame opens on the empty mount between the agent and the chute (nothing there), and the lever, its rod, the
 * flap and the engraved plate drop in from above and seat. The plate IS the line, word for word as tested, so
 * the lens settles on it while it is said. Thrown on "drafts": the flap shuts the chute, the bed drops, and the
 * next run slides into DRAFTS while the run strip fills green. The take ("Zero emails sent.") lands on a frame
 * where the line and the full tray are both in view — the cause and the result in one picture.
 *
 * SHOTS (every mark from the narration):
 *   A  0    the empty mount (nothing between agent and chute); the parts drop in   "So I added one line."
 *   B  b1   settle on the engraved line; thrown on "drafts"     "Never send. Save drafts only."
 *   C  b2   down to the tray: a run slides into DRAFTS          "Ten more runs."
 *   D  b3   the line above, the tray below: 0 sent              "Zero emails sent."   (key take)
 */
var S = HF.scene({ id: "mvs-stop", width: 1080, height: 1920, frames: 228, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.18), b2 = K.b(2, 0.56), b3 = K.b(3, 0.74);
var m = props.measured || {};
var RUNS = m.stopRuns || 10;
var tLine = K.m("line", 0.54), tNever = K.m("never", b1), tDrafts = K.m("drafts", b1 + 1.4), tTen = K.m("ten", b2), tZero = K.m("zero", b3);
var E = HW.E, span = HF3.span, mix = HF3.mix;

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">the same job <b>+ one line</b> · ' + RUNS + ' unattended runs</div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-meter gold" id="meter"><div class="job">+ the stop line · <b>' + RUNS + ' runs</b></div><div class="row"><span class="num">' + (m.stopSent || 0) + '</span><span class="unit">emails<br>sent</span></div><div class="sub">7 drafts every run, the same 7</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#runs", "#meter"], { opacity: 0 });
tl.to("#chip", { opacity: 0, y: -14, duration: 0.2, ease: "power2.in" }, tTen - 0.4);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, tTen - 0.15);
HW.fromTo(tl, "#meter", { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.6)" }, tZero - 0.05);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-stop", tl);
var toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [4.6, 1.0], keyAngle: 0.46 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  var tThrow = tDrafts - 0.12;
  /* ten runs, shown as one fast pass of seven cards into the tray */
  var seven = M.INVOICES.filter(function (v) { return v.kind === "go"; });
  var job = M.job(seven.map(function (inv, i) { return { inv: inv, t0: tThrow + 0.2 + i * 0.26, fate: "draft", pre: "due" }; }), { feed: 0.5, read: 0.24, move: 0.36, slide: 0.48 });

  /* B frames the engraved plate whole; C/D keep the plate below the top band and the tray above the captions */
  var cam = M.cam([
    { t: 0, v: [4.55, 1.35, 18.5, 0, 0, 0] },
    { t: tLine + 0.2, v: [4.7, 1.45, 18.8, 0, 0, 0], e: "out2" },
    { t: b1 + 0.55, v: [5.12, 0.95, 24.8, 0, 0, 0], e: "inOut" },     // the open lever AND the whole line, high in the frame
    { t: tThrow + 0.3, v: [5.15, 0.9, 24.4, 0, 0, 0], e: "out2" },
    { t: b2 + 0.55, v: [5.35, -0.05, 25.8, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.45, 0.05, 24.9, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("when", false); M.set("read", false); M.set("report", false);
    /* the lever's parts drop in from above and seat, the plate last */
    M.assemble("stop", span(t, tLine - 0.3, tNever + 0.25), "off", { stagger: 0.5 });
    M.drive(t * 0.7);
    M.lever(Math.min(E.outBack(span(t, tThrow, tThrow + 0.28)), 1.06));
    var st = job.update(t);
    for (var q = 0; q < job.cards.length; q++) if (t < tThrow - 0.2) job.cards[q].group.visible = false;
    M.trap(0); M.push(0); M.core(st.glow, st.scanU, st.scanOn); M.hammer(0); M.flag(0);
    var done = Math.round(RUNS * span(t, tTen + 0.05, tZero - 0.1));
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "ok" : "";
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tThrow + 0.2, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.03 * hit, 0.022 * hit, 0.008 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
