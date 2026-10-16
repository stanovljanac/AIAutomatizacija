/* mv-oneline — 025 s3, ONE LINE (mechanical, blue + gold, face-on).
 *
 * PREMISE. Proof must be visible: the viewer watches the one-line job RUN. The whole job is the single
 * line engraved under the drum, and the scene starts on it. Then the machine does exactly what the
 * measured agent did: it reads every card, and the five traps it was never told about drop through the
 * rail into HELD, each wearing its reason. That is the surprise the next beat needs — it was sharp.
 * And every card that survives the reader is sealed and fired out of the chute. One run is shown at
 * readable speed; runs two to ten pile on as a burst while the counter rolls to the measured 73.
 *
 * SHOTS:  A 0    wide → the drum's one line                     "First, the job most people would write. One line."
 *         B b1   reader · trap · HELD: the traps drop           "In all ten runs, the agent avoided every trap I had planted."
 *         C b2   push to the launcher: it fires                 "And in all ten runs, it hit send."
 *         D b3   the burst; 73; nobody approved                 "Seventy-three emails went out. Nobody approved a word."
 */
var S = HF.scene({ id: "mv-oneline", width: 1920, height: 1080, frames: 495, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.22), b2 = K.b(2, 0.52), b3 = K.b(3, 0.7);
var m = props.measured || {};
var SENT = m.bareSent == null ? 73 : m.bareSent, RUNS = m.bareRuns || 10;
var tOne = K.m("one", 2.6), tTrap = K.m("trap", b1 + 3.4), tSend = K.m("send", b2 + 1.95), tOut = K.m("out", b3 + 1.6), tNobody = K.m("nobody", b3 + 2.4);
var E = HW.E, span = HF3.span, mix = HF3.mix;

/* the run: twelve past-due invoices in folder order. Spaced so the last one is sealed as the word "send" lands. */
var GAP = 0.5, T0 = Math.min(b1 - 0.9, tSend - 0.35 - 11 * GAP - 1.9);
var tRun1 = T0 + 11 * GAP + 1.9;                       // the seventh email of run one has left
var tBurst = Math.max(tRun1 + 0.3, tSend + 0.15), tBurstEnd = Math.max(tOut - 0.2, tBurst + 1.6);

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">' + (m.model || "Claude Haiku 5.5") + ' · unattended · <b>synthetic data</b></div>' +
  '<div class="hw-plate hm-note" id="demo">a demonstration, <b>not a benchmark</b></div>' +
  '<div class="hw-plate hm-tag" id="whole">the whole job<small>one line of text</small></div>' +
  '<div class="hw-plate hm-meter red" id="meter"><div class="job">one-line job · <b>' + RUNS + ' runs</b></div><div class="row"><span class="num" id="num">0</span><span class="unit">emails sent</span></div><div class="sub" id="brk"><b style="color:#fff">70</b> reminders + <b style="color:#ff9a9a">3</b> strays</div><div class="sub" id="appr">approved by a person: <b style="color:#fff">0</b></div></div>' +
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-tag blue" id="held">5 traps · 5 held back<small>nobody told it about any of them</small></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#demo", "#whole", "#meter", "#runs", "#held", "#brk", "#appr"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.35);
HW.fromTo(tl, "#demo", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.55);
HW.fromTo(tl, "#whole", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tOne - 0.1);
tl.to("#whole", { opacity: 0, y: -10, duration: 0.2, ease: "power2.in" }, b1 - 0.3);
HW.fromTo(tl, "#runs", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, b1 + 0.5);
HW.fromTo(tl, "#meter", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, T0 + 1.75);
HW.fromTo(tl, "#held", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tTrap + 0.75);
tl.to("#held", { opacity: 0, duration: 0.2 }, b2 + 0.1);
HW.fromTo(tl, "#brk", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tBurstEnd + 0.15);
HW.fromTo(tl, "#appr", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tNobody);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-oneline", tl);
var numEl = document.getElementById("num"), toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.8, 0.2] });
  var M = HMV.build(ctx, { doLine: m.doLine });
  var L = M.L;
  var job = M.job(M.INVOICES.map(function (inv, i) { return { inv: inv, t0: T0 + i * GAP, fate: inv.kind === "go" ? "send" : "held", pre: "due" }; }), { feed: 0.75, read: 0.45, move: 0.45, flip: 0.25, fly: 0.5 });
  var REST = SENT - 7;
  var burst = M.stream({ t0: tBurst, n: REST, dt: (tBurstEnd - tBurst) / REST, fly: 0.4, pool: 18 });
  var conv = [];
  for (var i = 0; i < 8; i++) { var c = M.card(M.INVOICES[(i * 5 + 2) % 12]); c.show("due"); conv.push(c); }
  var RAIL0 = L.reader.x + 0.4, RAIL1 = L.launch.x - 0.2;
  var th = HM.integral(function (t) { return 0.7 + 2.4 * Math.min(span(t, tBurst - 0.3, tBurst + 0.3), 1 - span(t, tBurstEnd, tBurstEnd + 0.6)); }, D);

  var cam = M.cam([
    { t: 0, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: 1.35, v: [-1.8, 1.75, 10.8, 0, 0, 0], e: "inOut" },
    { t: b1 - 0.35, v: [-1.8, 1.75, 10.6, 0, 0, 0] },
    { t: b1 + 0.7, v: [1.9, -0.9, 15.6, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.2, v: [2.1, -0.9, 15.4, 0, 0, 0] },
    { t: b2 + 0.9, v: [5.9, -0.45, 13.4, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.6, -0.5, 12.0, 0, 0, 0], e: "sine" },
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
    var sent = st.sent + n;
    numEl.textContent = String(sent);
    /* a run is seven emails: light a token for every seven that have left (the ten tokens = the ten runs) */
    var done = Math.min(RUNS, t >= tRun1 ? 1 + Math.floor((n / REST) * (RUNS - 1) + 1e-6) : 0);
    for (var r = 0; r < toks.length; r++) toks[r].className = r < done ? "bad" : "";
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
