/* mvs-job — 025 SHORT s2, THE JOB (mechanical, portrait, blue + gold, face-on).
 *
 * PREMISE. Proof must be visible, and in a Short it has to be one continuous run, not a list. The scene opens
 * on the whole job: one engraved line under the gold drum. Then the machine does exactly what the measured
 * agent did: it reads every card, and the five traps nobody told it about drop through the rail into HELD,
 * each wearing its verdict — it was sharp. Every card that survives the reader is sealed and fired, and runs
 * two to ten pile on while SENT rolls to the measured 73. The key take ("it hit send") lands on the launcher.
 *
 * SHOTS (every mark from the narration):
 *   A  0    close on the drum's one line                     "The job was one line: chase the overdue invoices."
 *   B  b1   pull back: reader · trap · HELD · launcher; run 1  "Ten runs, unattended."
 *   C  b2   down to HELD: the traps drop in, verdicts up      "It avoided every trap I'd planted."
 *   D  b3   truck to the launcher: fired; runs 2..10; 73      "And in all ten, it hit send."   (key take)
 */
var S = HF.scene({ id: "mvs-job", width: 1080, height: 1920, frames: 342, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.35), b2 = K.b(2, 0.53), b3 = K.b(3, 0.77);
var m = props.measured || {};
var SENT = m.bareSent == null ? 73 : m.bareSent, RUNS = m.bareRuns || 10;
var tChase = K.m("chase", 1.56), tTrap = K.m("trap", b2 + 0.95), tAll = K.m("all", b3 + 0.15), tSend = K.m("send", b3 + 1.45);
var E = HW.E, span = HF3.span, mix = HF3.mix;

/* run one: the twelve past-due invoices. It starts under the drum shot (the cards stream along the rail below
   the engraved line), so the last traps drop as "trap" is said and the last email is sealed before the take. */
var GAP = 0.5, T0 = Math.max(0.6, Math.min(1.0, tTrap - 9 * GAP - 1.55));
var tRun1 = T0 + 11 * GAP + 1.9;
var tBurst = Math.max(tRun1 - 0.2, tAll), tBurstEnd = Math.max(tBurst + 1.4, D - 0.45);

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">' + (m.model || "Claude Haiku 5.5") + ' · synthetic data · <b>a demonstration, not a benchmark</b></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hw-kicker" id="k1">The whole job: <span class="g">one line.</span></div>' +
  '<div class="hw-plate hm-tag blue" id="held">5 traps · 5 held back<small>paid ×3 · in dispute · on a payment plan</small></div>' +
  '<div class="hw-plate hm-meter red" id="meter"><div class="job">one-line job · <b>' + RUNS + ' runs</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">emails<br>sent</span></div><div class="sub" id="appr">approved by a person: <b style="color:#fff">0</b></div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#runs", "#k1", "#held", "#meter", "#appr"], { opacity: 0 });
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.5)" }, tChase - 0.3);
tl.to("#k1", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b1 - 0.25);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, b1 + 0.1);
HW.fromTo(tl, "#held", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tTrap + 0.15);
tl.to("#held", { opacity: 0, y: -10, duration: 0.2, ease: "power2.in" }, b3 - 0.25);
HW.fromTo(tl, "#meter", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b3 - 0.05);
HW.fromTo(tl, "#appr", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tBurstEnd - 0.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-job", tl);
var numEl = document.getElementById("num"), toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [1.2, 0.6], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: m.doLine });
  var L = M.L;
  var job = M.job(M.INVOICES.map(function (inv, i) { return { inv: inv, t0: T0 + i * GAP, fate: inv.kind === "go" ? "send" : "held", pre: "due" }; }),
    { feed: 0.75, read: 0.45, move: 0.45, flip: 0.25, fly: 0.5 });
  var REST = SENT - 7;
  var burst = M.stream({ t0: tBurst, n: REST, dt: (tBurstEnd - tBurst) / REST, fly: 0.4, pool: 20 });
  var conv = [];
  for (var i = 0; i < 6; i++) { var c = M.card(M.INVOICES[(i * 5 + 2) % 12]); c.show("due"); conv.push(c); }
  var RAIL0 = L.trap.x1 + 0.2, RAIL1 = L.launch.x - 0.2;
  var th = HM.integral(function (t) { return 0.7 + 2.2 * Math.min(span(t, tBurst - 0.3, tBurst + 0.3), 1 - span(t, tBurstEnd, tBurstEnd + 0.5)); }, D);

  var cam = M.cam([
    { t: 0, v: [-1.8, 1.15, 17.4, 0, 0, 0] },
    { t: b1 - 0.4, v: [-1.75, 1.1, 16.6, 0, 0, 0], e: "sine" },
    { t: b1 + 0.75, v: [2.9, 0.15, 28, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.2, v: [2.95, 0.1, 27.4, 0, 0, 0], e: "out2" },
    { t: b2 + 0.85, v: [2.85, -1.2, 16.6, 0, 0, 0], e: "inOut" },
    { t: b3 - 0.3, v: [2.9, -1.22, 16.0, 0, 0, 0], e: "out2" },
    { t: b3 + 0.8, v: [5.35, 0.25, 22.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.45, 0.25, 21.4, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("when", false); M.set("read", false); M.set("report", false); M.set("stop", false);
    M.drive(th(t));
    M.lever(0);
    var st = job.update(t), n = burst.update(t);
    M.trap(st.trap);
    M.push(Math.max(st.push, burst.push(t)));
    M.core(st.glow, st.scanU, st.scanOn);
    M.hammer(0); M.flag(0);
    var on = Math.min(span(t, tBurst - 0.4, tBurst), 1 - span(t, tBurstEnd - 0.2, tBurstEnd + 0.1));
    for (var k = 0; k < conv.length; k++) {
      var u = ((t - tBurst + 4) * 1.9 + k / conv.length) % 1, g = conv[k].group;
      g.visible = on > 0.01 && u > 0.02 && u < 0.985;
      g.position.set(RAIL0 + u * (RAIL1 - RAIL0), L.cardY, L.card.z - 0.02); g.rotation.set(0, 0, 0);
      g.scale.setScalar(Math.max(on * Math.min(u * 14, 1), 0.001));
    }
    numEl.textContent = String(st.sent + n);
    /* a run is seven emails: light a token for each run that has finished */
    var done = Math.min(RUNS, t >= tRun1 ? 1 + Math.floor((n / REST) * (RUNS - 1) + 1e-6) : 0);
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "bad" : "";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
