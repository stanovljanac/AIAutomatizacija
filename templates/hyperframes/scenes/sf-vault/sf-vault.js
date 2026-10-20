/* sf-vault — 026 s7, GITLAB, 31 JANUARY 2017 (mechanical, cold steel, face-on). Set 2: the vault.
 *
 * PREMISE. The same failure, years before agents — and with an alarm that existed and still said nothing.
 * Two database servers; the PRIMARY's data drains (wiped by mistake: the wrong server). The NIGHTLY BACKUP
 * flap folds down and the bay behind it is empty — its lamp green the whole time. The backup job's CRON box
 * fires its failure emails across the frame and every one bounces off the MAIL SERVER: REJECTED · DMARC. Then
 * GitLab's own sentence, verbatim, with its source, and the cost.
 *
 * SHOTS:  A 0         the vault, wide                          "This problem is older than AI."
 *         B engineer  the two servers: db1 drains              "In January 2017, a GitLab engineer deleted data on the wrong database server."
 *         C nightly   the backup flap folds down: empty         "The nightly backup that should have saved them had been failing,"
 *         D alert     wide: emails fly and bounce              "…and its alert emails were being rejected."
 *         E words     the quote plate                          "In GitLab's own words: …"
 *         F six       the counters                             "About six hours of changes were gone."
 */
var S = HF.scene({ id: "sf-vault", width: 1920, height: 1080, frames: 758, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tJan = K.m("january", 2.4), tEng = K.m("engineer", 5.2), tWrong = K.m("wrong", 7.3), tNight = K.m("nightly", 9.3), tFail = K.m("failing", 11.9);
var tAlert = K.m("alert", 13.2), tRej = K.m("rejected", 14.6), tWords = K.m("words", 17.0), tNever = K.m("never", 18.3), tSix = K.m("six", 22.7);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag" id="date">31 Jan 2017 · GitLab<small>GitLab.com, production database</small></div>' +
  '<div class="hw-plate hm-tag red" id="wrong">the primary, not the secondary<small>data directory removed</small></div>' +
  '<div class="hw-plate hm-tag blue" id="why">pg_dump 9.2 vs PostgreSQL 9.6<small>the backup errored and stopped</small></div>' +
  '<div class="hw-plate hm-tag red" id="dmarc">REJECTED · DMARC<small>the failure emails never arrived</small></div>' +
  '<div class="hw-plate hm-quote" id="quote"><div class="q">“we were never aware of the backups failing, <span class="g">until it was too late.</span>”</div><div class="src"><b>GitLab</b> · Postmortem of database outage of January 31 · 10 Feb 2017</div></div>' +
  '<div class="hw-plate hm-meter red sm" id="cost"><div class="job">the cost</div><div class="row"><span class="num">~6 h</span><span class="unit">of changes lost</span></div><div class="sub">~5,000 projects affected · source: GitLab postmortem</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#date", "#wrong", "#why", "#dmarc", "#quote", "#cost"], { opacity: 0 });
HW.fromTo(tl, "#date", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tJan - 0.05);
tl.to("#date", { opacity: 0, duration: 0.2 }, tNight - 0.3);
HW.fromTo(tl, "#wrong", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tWrong + 0.2);
tl.to("#wrong", { opacity: 0, duration: 0.2 }, tNight - 0.3);
HW.fromTo(tl, "#why", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tFail + 0.1);
tl.to("#why", { opacity: 0, duration: 0.2 }, tAlert + 0.2);
HW.fromTo(tl, "#dmarc", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tRej + 0.15);
tl.to("#dmarc", { opacity: 0, duration: 0.2 }, tWords - 0.35);
HW.fromTo(tl, "#quote", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, tWords - 0.1);
tl.to("#quote", { opacity: 0, y: -10, duration: 0.24 }, tSix - 0.3);
HW.fromTo(tl, "#cost", { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tSix);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-vault", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-0.6, 0.4], warm: 0.05 });
  var V = HWT.vault(ctx, {});
  /* six failure emails, spaced so the first leaves on "alert" and the last bounces before the quote */
  var MAIL = [];
  for (var i = 0; i < 6; i++) MAIL.push(tAlert - 0.4 + i * Math.max(0.42, (tWords - 1.2 - (tAlert - 0.4)) / 6));
  var LS = [
    { t: 0, v: [0, -0.2, 26.5, 0, 0, 0] },
    { t: Math.max(tEng - 0.4, 1.4), v: [0, -0.2, 24.5, 0, 0, 0], e: "sine" },
    { t: tEng + 0.5, v: [0, 1.45, 11.6, 0, 0, 0], e: "inOut" },
    { t: tNight - 0.4, v: [-0.6, 1.45, 10.4, 0, 0, 0], e: "sine" },
    { t: tNight + 0.45, v: [0, -1.25, 10.6, 0, 0, 0], e: "inOut" },
    { t: tAlert - 0.45, v: [0, -1.2, 10.0, 0, 0, 0], e: "sine" },
    { t: tAlert + 0.4, v: [0, -0.6, 25.5, 0, 0, 0], e: "inOut" },
    { t: tWords - 0.3, v: [0.2, -0.6, 24.5, 0, 0, 0], e: "sine" },
    { t: tWords + 0.35, v: [0.2, 0.05, 24.8, 0, 0, 0], e: "inOut" },     // the vault drops below the quote plate (no plate over its top)
    { t: D, v: [0.3, -0.05, 25.5, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [0, 0.8, 44, 0, 0, 0] },
    { t: Math.max(tEng - 0.4, 1.4), v: [0, 0.8, 42, 0, 0, 0], e: "sine" },
    { t: tEng + 0.5, v: [-2.1, 2.3, 14.5, 0, 0, 0], e: "inOut" },
    { t: tNight - 0.4, v: [-2.1, 2.3, 13.8, 0, 0, 0], e: "sine" },
    { t: tNight + 0.45, v: [0, -0.2, 33, 0, 0, 0], e: "inOut" },
    { t: tAlert - 0.45, v: [0, -0.2, 32, 0, 0, 0], e: "sine" },
    { t: tAlert + 0.4, v: [5.4, 0.1, 24, 0, 0, 0], e: "inOut" },
    { t: tWords - 0.3, v: [5.6, 0.1, 23, 0, 0, 0], e: "sine" },
    { t: tWords + 0.4, v: [0, 0.2, 40, 0, 0, 0], e: "inOut" },
    { t: D, v: [0, 0.2, 38.5, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    V.home();
    V.wipe(span(t, tWrong - 0.3, tWrong + 1.2));
    V.drawer(span(t, tNight + 0.1, tNight + 1.1));
    V.lamps("green", t > tAlert - 0.5 ? (Math.sin(t * 9) > 0 ? "red" : "amber") : "green", "green");
    for (var k = 0; k < MAIL.length; k++) V.mail(k, span(t, MAIL[k], MAIL[k] + 1.5));
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
