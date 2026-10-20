/* sf-hook — 026 s1, HOOK (mechanical, black + gold backdrop, face-on).
 *
 * PREMISE. Thesis first, and the thesis is a contradiction you can see. Frame 0 is already the topic: a
 * morning report sliding out of the press, "No new quote requests came in." with a calm green tick. On
 * "doesn't throw an error" the camera pulls back across three lamps — every one green. On "a calm report" it
 * goes right up to the tick. On "And you believe it" it pulls away and trucks left to what the report could
 * not see: the pipe from the website form, hanging open. Nothing in the frame is red. That is the hook.
 *
 * SHOTS:  A 0      the sheet, already rising                 "The automation failure that costs you most…"
 *         B error  pull back: three green lamps              "…doesn't throw an error."
 *         C calm   push in on the tick                        "It writes a calm report: no new requests came in."
 *         D believe pull + truck left: the pipe is cut         "And you believe it."
 */
var S = HF.scene({ id: "sf-hook", width: 1920, height: 1080, frames: 304, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span;
var tErr = K.m("error", 3.2), tCalm = K.m("calm", 4.6), tBel = K.m("believe", 8.9);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker r" id="kick">No error. Just <span class="g">“all clear.”</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set("#kick", { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, Math.min(tBel + 0.35, D - 0.9));
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-hook", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [1.2, 0.8] });
  var M = HWT.line(ctx, {});
  var pr = M.print({ i: 0, state: "allclear", t0: -0.75, out: 1.45, hold: Infinity, slot: 0 });
  var roll = HM.integral(function (t) { return t < 0.7 ? 7 : 0.6; }, D + 1);

  var LS = [
    { t: 0, v: [2.55, 1.15, 9.0, 0, 0, 0] },
    { t: Math.max(tErr - 0.35, 0.8), v: [2.5, 1.1, 8.5, 0, 0, 0], e: "sine" },
    { t: tErr + 0.55, v: [-0.6, 0.55, 16.8, 0, 0, 0], e: "inOut" },
    { t: tCalm - 0.3, v: [-0.4, 0.6, 16.2, 0, 0, 0], e: "sine" },
    { t: tCalm + 0.55, v: [2.55, 1.3, 7.2, 0, 0, 0], e: "inOut" },
    { t: tBel - 0.45, v: [2.55, 1.32, 6.8, 0, 0, 0], e: "sine" },
    { t: tBel + 0.75, v: [-5.2, 2.05, 12.0, 0, 0, 0], e: "inOut" },   // y up: a clear band above the form for the kicker
    { t: D, v: [-5.45, 2.2, 11.2, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [2.55, 2.0, 14.0, 0, 0, 0] },
    { t: Math.max(tErr - 0.35, 0.8), v: [2.55, 1.95, 13.4, 0, 0, 0], e: "sine" },
    { t: tErr + 0.55, v: [1.45, 1.1, 26, 0, 0, 0], e: "inOut" },
    { t: tCalm - 0.3, v: [1.45, 1.1, 25, 0, 0, 0], e: "sine" },
    { t: tCalm + 0.55, v: [2.55, 2.25, 11.2, 0, 0, 0], e: "inOut" },
    { t: tBel - 0.45, v: [2.55, 2.25, 10.8, 0, 0, 0], e: "sine" },
    { t: tBel + 0.75, v: [-6.1, 2.5, 16.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [-6.15, 2.5, 15.6, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.hideSlips();
    M.valve(2, 1);
    M.cut(1);
    M.lamps("green", "green", "green", 1);
    var ph = (t / 1.15) % 1;
    M.core(1.15 + 0.3 * Math.sin(t * 2.0), ph, Math.min(span(ph, 0, 0.08), 1 - span(ph, 0.85, 0.98)) * 0.8);
    M.press(roll(t));
    M.clock(0.4 + t * 0.05);
    M.drawerState(null, -1);
    pr.update(t);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
