/* sf-handle — 026 s8, THE ALARM'S WEAK SPOT → THE DEAD MAN'S HANDLE (mechanical, black + gold, face-on). Set 3.
 *
 * PREMISE. Why GitLab heard nothing, as a mechanism: an alarm wired to speak only on failure. The job's alarm
 * wire runs to a bell; the failure itself cuts the wire — the job's lamp flickers red, the bell does not move,
 * and the OK lamp on the box goes on glowing green. "Nothing sounds like fine." Then the flip, a century old:
 * a driver's controller with a dead man's handle. A gloved hand holds it down; the hand lets go and the spring
 * lifts the handle, the rod opens the brake valve, the gauge swings to ON. The hand comes back — proof it is
 * there — and the brake releases. Nothing about the mechanism waits for a report of a problem.
 *
 * SHOTS:  A 0         the circuit: job → wire → bell            "Any alarm that only speaks on failure has the same weak spot."
 *         B failure1  the wire falls; the bell stays still       "When the failure takes the alarm down with it, you hear nothing."
 *         C fine      push in on the green OK lamp              "And nothing sounds like fine."
 *         D railways  truck right to the controller              "Railways flipped this over a century ago:"
 *         E brakes    the hand lets go: brake ON                 "a dead man's handle brakes the train"
 *         F proving   the hand returns: brake OFF                "unless the driver keeps proving they're still there."
 */
var S = HF.scene({ id: "sf-handle", width: 1920, height: 1080, frames: 628, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tF1 = K.m("failure1", 4.6), tNothing = K.m("nothing", 7.7), tFine = K.m("fine", 10.1), tRail = K.m("railways", 11.65);
var tBrakes = K.m("brakes", 15.9), tProv = K.m("proving", 18.8);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag" id="src">dead man\'s handle · in use by 1912<small>How It Works · Wikipedia, “Dead man\'s switch”</small></div>' +
  '<div class="hw-plate hm-tag red" id="let">let go → brakes on</div>' +
  '<div class="hw-plate hm-tag" id="proof">the hand on it is the proof</div>' +
  '<div class="hw-plate hw-kicker" id="kick">Silence is <span class="g">the alarm.</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#src", "#let", "#proof", "#kick"], { opacity: 0 });
HW.fromTo(tl, "#src", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tRail + 0.6);
HW.fromTo(tl, "#let", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tBrakes + 0.35);
tl.to("#let", { opacity: 0, duration: 0.2 }, tProv - 0.1);
HW.fromTo(tl, "#proof", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }, tProv + 0.35);
var tK = Math.min(tProv + 1.0, D - 0.8);
tl.to(["#src", "#proof"], { opacity: 0, duration: 0.2 }, tK - 0.25);
HW.fromTo(tl, "#kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, tK);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-handle", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [0.0, 0.6], warm: 0.9 });
  /* portrait: the bell stands above the job box, so the circuit is tall, not wide */
  var C = HWT.cab(ctx, PT ? { layout: { job: { x: -4.4, y: 0.4 }, bellA: { x: -3.6, y: 3.8 } } } : {});
  /* portrait: the released glove leaves to the right, under the tag band, not up into it */
  if (PT) C.by.glove.setAway("gone", { p: [C.L.pivot.x + 3.6, C.L.pivot.y + 1.6, 1.4], r: [0, 0, 0.3], s: 1 });
  var LS = [
    { t: 0, v: [-4.0, 1.25, 12.6, 0, 0, 0] },
    { t: Math.max(tF1 - 0.4, 1.5), v: [-4.0, 1.2, 12.0, 0, 0, 0], e: "sine" },
    { t: tNothing + 0.4, v: [-3.9, 1.2, 11.2, 0, 0, 0], e: "sine" },
    { t: tFine + 0.25, v: [-6.6, 1.15, 6.4, 0, 0, 0], e: "inOut" },
    { t: tRail - 0.05, v: [-6.6, 1.15, 6.1, 0, 0, 0], e: "sine" },
    { t: tRail + 0.9, v: [5.1, 0.2, 16.4, 0, 0, 0], e: "inOut" },
    { t: tBrakes - 0.3, v: [5.1, 0.2, 15.8, 0, 0, 0], e: "sine" },
    { t: D, v: [5.15, 0.2, 15.0, 0, 0, 0], e: "sine" },
  ];
  /* portrait: the tall circuit fills the frame (job box clear of the bottom 16%); the stand sits above that band
     with the tags in the band over it */
  var PTK = [
    { t: 0, v: [-4.4, 1.5, 19.4, 0, 0, 0] },
    { t: Math.max(tF1 - 0.4, 1.5), v: [-4.4, 1.5, 18.6, 0, 0, 0], e: "sine" },
    { t: tNothing + 0.4, v: [-4.4, 1.5, 18.0, 0, 0, 0], e: "sine" },
    { t: tFine + 0.25, v: [-4.7, 0.9, 11.5, 0, 0, 0], e: "inOut" },
    { t: tRail - 0.05, v: [-4.7, 0.9, 11.0, 0, 0, 0], e: "sine" },
    { t: tRail + 0.9, v: [5.35, 0.5, 25.2, 0, 0, 0], e: "inOut" },
    { t: tBrakes - 0.3, v: [5.35, 0.5, 24.8, 0, 0, 0], e: "sine" },
    { t: D, v: [5.35, 0.5, 24.4, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    C.home();
    C.cutWire(span(t, tF1 + 0.15, tF1 + 1.0));
    /* the failure itself: the job's own lamp (OK) stays green — the box reports nothing wrong */
    C.ok(1);
    var hold = 1 - E.inOut(span(t, tBrakes - 0.15, tBrakes + 0.35)) + E.inOut(span(t, tProv - 0.25, tProv + 0.45));
    C.handle(Math.min(Math.max(hold, 0), 1), t);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
