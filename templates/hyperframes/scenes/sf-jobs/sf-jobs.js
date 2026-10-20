/* sf-jobs — 026 s14, SAME PATTERN, TWO MORE JOBS — AND AN HONEST NORMAL (mechanical, blue + gold, face-on). Set 4.
 *
 * PREMISE. The pattern transfers, so the wall fills: three watchers, each with its own normal engraved on its
 * dial. The NIGHTLY BACKUP gets its file (re-armed), then a night with no file: its bell. The SHOP ORDERS
 * watcher is fed every hour, then three silent hours: its bell — test the checkout. Then the honest part of
 * writing a normal: the WEBSITE LEADS dial gets "Sun: 0–2 is normal" and a quiet Sunday passes in silence,
 * while a watcher without that notch rings every Sunday — until a hand mutes it. A careless normal teaches
 * you to ignore the alarm.
 *
 * SHOTS:  A 0         the three watchers, wide                 "Same pattern, two more jobs you probably run."
 *         B backups   the backup watcher: file, then no file    "Nightly backups: if the newest file is more than a day old, that is the alarm."
 *         C orders    the orders watcher: fed, then silent      "Shop orders: if they usually arrive every hour, three silent hours means test the checkout."
 *         D honestly  the leads dial: a Sunday notch            "And write normal down honestly: if Sundays are quiet, say so,"
 *         E wolf      the un-notched one rings; MUTED           "or the alarm cries wolf until you mute it."
 */
var S = HF.scene({ id: "sf-jobs", width: 1920, height: 1080, frames: 751, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tBack = K.m("backups", 3.5), tDay = K.m("day", 6.35), tOrd = K.m("orders", 9.2), tHour = K.m("hour", 12.1), tCheck = K.m("checkout", 15.1);
var tHon = K.m("honestly", 17.5), tSun = K.m("sundays", 19.0), tWolf = K.m("wolf", 22.9), tMute = K.m("mute", 23.9);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag red" id="bk">no new file · 25 h<small>the backup didn\'t run — or ran and wrote nothing</small></div>' +
  '<div class="hw-plate hm-tag red" id="or">3 silent hours<small>test the checkout</small></div>' +
  '<div class="hw-plate hm-tag" id="sun">Sunday · 0 requests<small>within the normal you wrote down: no alarm</small></div>' +
  '<div class="hw-plate hm-tag blue" id="mut">orders · MUTED<small>it rang every quiet Sunday — so someone switched it off</small></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#bk", "#or", "#sun", "#mut"], { opacity: 0 });
var tBdue = tDay + 1.0, tOdue = tCheck + 0.25;
HW.fromTo(tl, "#bk", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tBdue + 0.2);
tl.to("#bk", { opacity: 0, duration: 0.2 }, tOrd - 0.2);
HW.fromTo(tl, "#or", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tOdue + 0.2);
tl.to("#or", { opacity: 0, duration: 0.2 }, tHon - 0.2);
HW.fromTo(tl, "#sun", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tSun + 0.6);
tl.to("#sun", { opacity: 0, duration: 0.2 }, tWolf - 0.25);
HW.fromTo(tl, "#mut", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tMute + 0.25);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-jobs", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.0, 0.6] });
  var SPEC = [
    { job: "WEBSITE LEADS", sub: "5–9 a day · by 12:00", start: "08:00", end: "12:00", label: "LEADS" },
    { job: "NIGHTLY BACKUP", sub: "a new file · every 25 h", start: "02:00", end: "+25 h", label: "BACKUP" },
    { job: "SHOP ORDERS", sub: "one an hour · open hours", start: "last order", end: "+3 h", label: "ORDERS" },
  ];
  var XS = [-5.7, 0, 5.7];
  var WS = SPEC.map(function (sp, i) { var w = HWT.watcher(ctx, sp); w.root.position.set(XS[i], 0, 0); w.root.scale.setScalar(0.8); return w; });
  /* the needles: a pure function per watcher */
  var tB1 = tBack + 0.4, tO = [], tO0 = tOrd + 0.2;
  for (var k = 0; tO0 + k * 0.75 < tHour; k++) tO.push(tO0 + k * 0.75);
  function needleB(t) { return t < tB1 ? 1 - 0.3 * span(t, -2, tB1) : 1 - span(t, tB1 + 0.15, tBdue); }
  function lastOf(arr, t) { var l = -1; for (var i = 0; i < arr.length; i++) if (arr[i] <= t) l = arr[i]; return l; }
  function needleO(t) { var l = lastOf(tO, t); if (l < 0) return 1 - 0.2 * span(t, -2, tO0); var end = l === tO[tO.length - 1] ? tOdue : l + 3; return 1 - span(t, l + 0.1, end); }
  function needleL(t) { return 1 - 0.75 * span(t, tHon, D + 1); }   // a quiet Sunday: the needle runs, the notch holds it
  function bell(w, t, due, until) {
    var on = t >= due && t < until;
    w.strike(on ? Math.max(E.out3(span(t, due, due + 0.18)) - 0.3 * span(t, due + 0.18, due + 0.6), 0) : 0);
    w.ring(on ? Math.exp(-(t - due - 0.16) * 0.8) : 0, t);
    return on;
  }
  /* a wall of instruments: one watcher whole at a time, its neighbours cut by the frame edge; the last shot
     is the whole wall again — the honest one calm beside the one somebody muted */
  var LS = [
    { t: 0, v: [0, 0.35, 24.5, 0, 0, 0] },
    { t: tBack - 0.4, v: [0, 0.35, 23.6, 0, 0, 0], e: "sine" },
    { t: tBack + 0.4, v: [0, 0.45, 15.0, 0, 0, 0], e: "inOut" },
    { t: tOrd - 0.35, v: [0, 0.45, 14.4, 0, 0, 0], e: "sine" },
    { t: tOrd + 0.45, v: [5.7, 0.45, 15.0, 0, 0, 0], e: "inOut" },
    { t: tHon - 0.4, v: [5.7, 0.45, 14.4, 0, 0, 0], e: "sine" },
    { t: tHon + 0.6, v: [-5.7, 0.45, 15.0, 0, 0, 0], e: "inOut" },
    { t: tWolf - 0.6, v: [-5.7, 0.45, 14.4, 0, 0, 0], e: "sine" },
    { t: tWolf + 0.2, v: [0, 0.35, 23.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [0, 0.35, 22.8, 0, 0, 0], e: "sine" },
  ];
  /* portrait: one watcher fills the width (half-width 0.109·d ≥ 1.85) */
  var PTK = [
    { t: 0, v: [0, 1.1, 18, 0, 0, 0] },
    { t: tOrd - 0.35, v: [0, 1.1, 17.4, 0, 0, 0], e: "sine" },
    { t: tOrd + 0.45, v: [5.7, 1.1, 18, 0, 0, 0], e: "inOut" },
    { t: tHon - 0.4, v: [5.7, 1.1, 17.4, 0, 0, 0], e: "sine" },
    { t: tHon + 0.6, v: [-5.7, 1.1, 18, 0, 0, 0], e: "inOut" },
    { t: tWolf - 0.6, v: [-5.7, 1.1, 17.4, 0, 0, 0], e: "sine" },
    { t: tWolf + 0.2, v: [5.7, 1.1, 18, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.7, 1.1, 17.4, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    var L0 = WS[0], B = WS[1], O = WS[2];
    L0.home(); B.home(); O.home();
    /* LEADS: the Sunday notch is engraved on "sundays" */
    L0.dialText(t > tSun - 0.1 ? { sub: "Sun: 0–2 is normal" } : {});
    L0.needle(needleL(t)); L0.strike(0); L0.lampState("green", 1);
    L0.tokenAt(0, 1);
    /* BACKUP */
    B.needle(needleB(t));
    var bOn = bell(B, t, tBdue, tOrd + 1.0);
    B.lampState(bOn ? "red" : "green", bOn ? 0.8 + 0.3 * Math.sin(t * 8) : 1);
    B.tokenAt(span(t, tB1 - 0.45, tB1), span(t, tB1 + 0.25, tB1 + 0.6));
    /* ORDERS: fed every ~0.75 s, then silent; later it rings again, every Sunday, until it is muted */
    O.needle(needleO(t));
    var oOn = bell(O, t, tOdue, tHon + 0.2), wolf = bell(O, t, tWolf - 0.1, tMute + 0.15);
    var muted = t > tMute + 0.15;
    O.lampState(muted ? "off" : (oOn || wolf) ? "red" : "green", (oOn || wolf) ? 0.8 + 0.3 * Math.sin(t * 8) : 1);
    var lo = lastOf(tO, t + 0.45);
    if (lo > 0) O.tokenAt(span(t, lo - 0.45, lo), span(t, lo + 0.2, lo + 0.5)); else O.tokenAt(0, 1);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
