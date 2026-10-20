/* sf-close — 026 s15, CLOSE (mechanical, black + gold backdrop, face-on). Sets 1 + 4.
 *
 * PREMISE. The whole system on one wall: the machine with its two gold modules, and its watcher beside it.
 * A calm loop — the token drops, the needle re-arms. Then, on "silence is the alarm", both silences once more,
 * each caught by its own check (the s13 rule): the pipe goes quiet and the gold flag stands up; then the machine
 * itself stops, no token comes, and the watcher rings. The closing question is the last plate.
 *
 * SHOTS:  A 0        wide, the calm loop                 "If this was useful, subscribe. No news isn't good news."
 *         B silence  the pipe goes quiet: flag + bell     "In automation, silence is the alarm."
 *         C notice   the question                         "Which of your automations would you notice first if it went quiet?"
 */
var S = HF.scene({ id: "sf-close", width: 1920, height: 1080, frames: 357, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span;
var tNews = K.m("news", 2.27), tSil = K.m("silence", 5.34), tAl = K.m("alarm", 6.7), tNot = K.m("notice", 9.0);
var Q = props.question || "Which of your automations would you notice first if it went quiet?";

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="kick">Silence is <span class="g">the alarm.</span></div>' +
  '<div class="hw-plate hw-q" id="q"></div>';
document.getElementById("q").textContent = Q;
var tl = gsap.timeline({ paused: true });
gsap.set(["#kick", "#q"], { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, tSil + 0.45);
tl.to("#kick", { opacity: 0, duration: 0.24 }, tNot - 0.5);
HW.fromTo(tl, "#q", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, tNot - 0.3);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-close", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [0.0, 0.6] });
  var M = HWT.line(ctx, {});
  var Wt = HWT.watcher(ctx, { job: "MORNING REPORT", sub: "proof by 07:15", label: "WATCHER" });
  if (PT) { M.root.position.set(0, 2.2, 0); M.root.scale.setScalar(0.45); Wt.root.position.set(0, -2.6, 0); Wt.root.scale.setScalar(0.6); }
  else { M.root.position.set(-3.6, 0.2, 0); M.root.scale.setScalar(0.62); Wt.root.position.set(5.6, 0.1, 0); Wt.root.scale.setScalar(0.88); }
  var tTok = Math.max(tNews - 0.6, 0.8), tDue = tAl + 0.25;
  function needle(t) { return t < tTok ? 1 - 0.6 * span(t, -2, tTok) : 1 - span(t, tTok + 0.15, tDue); }
  /* the line spans -8.7..1.5 (form and pipe at its left end — they must be in), the watcher 3.7..7.5 */
  var LS = [
    { t: 0, v: [-0.6, 0.3, 25.5, 0, 0, 0] },
    { t: tSil - 0.2, v: [-0.6, 0.3, 24.6, 0, 0, 0], e: "sine" },
    { t: D, v: [-0.6, 0.25, 23.6, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [0, 0.9, 40, 0, 0, 0] },
    { t: D, v: [0, 0.9, 38.5, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(true);
    M.hideSlips();
    var quiet = span(t, tSil - 0.1, tSil + 0.7), asleep = t > tSil + 1.0;   // …then the run itself stops: no token, and only the watcher can say so
    M.valve(2, quiet); M.cut(quiet);
    M.flag(E.out3(span(t, tSil + 0.45, tSil + 1.1)));   // the lines catch the quiet pipe…
    M.lamps("green", "green", "green", 1);
    var ph = (t / 1.2) % 1;
    M.core(asleep ? 0.2 : 1.1 + 0.25 * Math.sin(t * 2.0), ph, asleep ? 0 : (t < tSil ? 0.7 : 0.4) * Math.min(span(ph, 0, 0.08), 1 - span(ph, 0.85, 0.98)));
    M.press(Math.min(t, tSil + 1.0) * 0.6);
    M.clock(0.4 + t * 0.03);
    M.drawerState(null, -1);
    M.proofShow(t > tSil + 0.5 ? "00" : "07", t > tSil + 0.5 ? "none" : "19:48", t > tSil + 0.5 ? "#ffffff" : null);
    Wt.home();
    Wt.needle(needle(t));
    var on = t >= tDue;
    Wt.strike(on ? Math.max(E.out3(span(t, tDue, tDue + 0.18)) - 0.3 * span(t, tDue + 0.18, tDue + 0.6), 0) : 0);
    Wt.ring(on ? Math.exp(-(t - tDue - 0.16) * 0.7) : 0, t);
    Wt.lampState(on ? "red" : "green", on ? 0.8 + 0.3 * Math.sin(t * 8) : 1);
    Wt.tokenAt(span(t, tTok - 0.45, tTok), span(t, tTok + 0.25, tTok + 0.6));
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
