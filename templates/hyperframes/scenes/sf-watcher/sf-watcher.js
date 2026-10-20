/* sf-watcher — 026 s12, THE WATCHER OUTSIDE THE JOB (mechanical, blue + gold, face-on). Set 4: the wall.
 *
 * PREMISE. The dead man's handle, for software, as a real instrument: a gold dial on the wall whose needle runs
 * from 07:00 toward a 07:15 deadline. When the job finishes with its proof, a heartbeat token drops through the
 * chute and the needle snaps back to full. When the token does not come, the needle reaches the deadline, the
 * pawl lets go, the hammer strikes and the bell rings. Nothing waits for an error. Then the tools that work this
 * way — named flat, with where they come from: two open-source watchers, or one more scheduled check.
 *
 * SHOTS:  A 0        the watcher, needle running                 "So one check has to live outside the job."
 *         B pings    a token drops: re-armed                       "When the job finishes with its proof, it pings a watcher."
 *         C alarm    no token: deadline, hammer, bell              "If the ping doesn't arrive by the deadline, the watcher raises the alarm."
 *         D handle   hold                                          "That's the dead man's handle, for software."
 *         E tools    a new token; the tool chips                   "Healthchecks dot io and Uptime Kuma both work this way…"
 */
var S = HF.scene({ id: "sf-watcher", width: 1920, height: 1080, frames: 801, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tPings = K.m("pings", 5.0), tDead = K.m("deadline", 8.3), tAlarm = K.m("alarm", 10.5), tHandle = K.m("handle", 12.4);
var tHC = K.m("healthchecks", 14.5), tUK = K.m("uptime", 16.4), tSch = K.m("scheduled", 23.5);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag" id="ok">07:04 · proof received<small>the needle goes back to full</small></div>' +
  '<div class="hw-plate hm-tag red" id="late">07:15 · no proof<small>the watcher rings — no error needed</small></div>' +
  '<div class="hw-plate sf-tools" id="tools"><div class="t" id="t1"><b>healthchecks.io</b><span>open source · free plan · check-ins, alerts on a missed one</span></div>' +
  '<div class="t" id="t2"><b>Uptime Kuma</b><span>open source · self-hosted · “Push” monitor</span></div>' +
  '<div class="t" id="t3"><b>or one more scheduled check</b><span>in n8n, cron or Task Scheduler: “is the newest report younger than a day?”</span></div>' +
  '<div class="src">healthchecks.io/about · github.com/louislam/uptime-kuma · checked 18 Oct 2026</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#ok", "#late", "#tools", "#t1", "#t2", "#t3"], { opacity: 0 });
HW.fromTo(tl, "#ok", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tPings + 0.3);
tl.to("#ok", { opacity: 0, duration: 0.2 }, tDead - 0.2);
HW.fromTo(tl, "#late", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tAlarm + 0.1);
tl.to("#late", { opacity: 0, duration: 0.2 }, tHC - 0.4);
HW.fromTo(tl, "#tools", { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tHC - 0.2);
HW.fromTo(tl, "#t1", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tHC - 0.05);
HW.fromTo(tl, "#t2", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tUK - 0.05);
HW.fromTo(tl, "#t3", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tSch - 0.6);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-watcher", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.0, 0.6] });
  var Wt = HWT.watcher(ctx, { job: "MORNING REPORT", sub: "proof by 07:15", label: "WATCHER · outside the job" });
  /* the needle: running from scene start; re-armed by the token on "pings"; the deadline on "alarm"; re-armed
     again just before the tools — and then a long window, so it stays calm under the chips */
  var tTok1 = tPings + 0.1, tDue = tAlarm - 0.05, tTok2 = tHC - 0.9;
  function needle(t) {
    if (t < tTok1) return 1 - 0.55 * span(t, -2, tTok1 + 2);
    if (t < tTok2) return 1 - span(t, tTok1 + 0.15, tDue);
    return 1 - 0.35 * span(t, tTok2 + 0.15, D + 6);
  }
  var LS = [
    /* the whole instrument (chute to tag) needs half-height ≥ 3.3: d ≥ 17 */
    { t: 0, v: [0.0, 0.4, 18.5, 0, 0, 0] },
    { t: Math.max(tPings - 1.9, 1.0), v: [0.0, 0.45, 17.8, 0, 0, 0], e: "sine" },
    { t: tPings - 0.15, v: [0.0, 1.5, 10.5, 0, 0, 0], e: "inOut" },     // settled on the chute before the token drops
    { t: tDead - 0.3, v: [0.0, 1.4, 10.0, 0, 0, 0], e: "sine" },
    { t: tDead + 0.4, v: [0.3, 0.6, 13.5, 0, 0, 0], e: "inOut" },       // dial + hammer + bell + lamp
    { t: tHC - 0.3, v: [0.3, 0.6, 12.9, 0, 0, 0], e: "sine" },
    { t: tHC + 0.5, v: [-3.4, 0.4, 18.0, 0, 0, 0], e: "inOut" },       // the watcher holds the right, the tools the left
    { t: D, v: [-3.4, 0.4, 17.4, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [0.0, 1.0, 21, 0, 0, 0] },
    { t: tPings + 0.4, v: [0.0, 2.1, 14.5, 0, 0, 0], e: "inOut" },
    { t: tDead + 0.4, v: [0.3, 1.6, 15.0, 0, 0, 0], e: "inOut" },
    { t: tHC - 0.3, v: [0.0, 1.2, 21, 0, 0, 0], e: "inOut" },
    { t: tHC + 0.5, v: [0.0, -1.2, 27, 0, 0, 0], e: "inOut" },
    { t: D, v: [0.0, -1.2, 26, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    Wt.home();
    Wt.needle(needle(t));
    var ring = t > tDue + 0.16 && t < tTok2 ? Math.exp(-(t - tDue - 0.16) * 0.8) : 0;
    var strike = t >= tDue && t < tTok2 ? E.out3(span(t, tDue, tDue + 0.18)) - 0.3 * span(t, tDue + 0.18, tDue + 0.6) : 0;
    Wt.strike(Math.max(strike, 0));
    Wt.ring(ring, t);
    Wt.lampState(t >= tDue && t < tTok2 + 0.2 ? "red" : "green", t >= tDue && t < tTok2 ? 0.8 + 0.3 * Math.sin(t * 8) : 1);
    var k1 = span(t, tTok1 - 0.45, tTok1), k2 = span(t, tTok2 - 0.45, tTok2);
    if (t < tTok2 - 0.45) Wt.tokenAt(k1, span(t, tTok1 + 0.7, tTok1 + 1.05)); else Wt.tokenAt(k2, span(t, tTok2 + 0.45, tTok2 + 0.8));   // the first one sits in the cup long enough to be seen
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
