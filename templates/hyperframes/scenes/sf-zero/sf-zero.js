/* sf-zero — 026 s6, ZERO CARRIES NO EVIDENCE (mechanical, blue + gold, face-on). A second set: the bench.
 *
 * PREMISE. The philosophy beat, shown as a weighing. First the reason the machine said "all clear": its own
 * instruction — the JOB plate's second line lights up gold, it did exactly what it was told. Then a hard cut to
 * a bench of three steel trays: the red 401 plate, the stamped old slips, and nothing. A gold EVIDENCE tag
 * drops onto the first two. The third gets none — there is nothing in it to tag. Then the first two slide away
 * and the empty tray is joined by an identical one: A QUIET DAY · A BROKEN FORM. You cannot tell them apart.
 *
 * SHOTS:  A 0      the JOB plate; line 2 glows                "And it did exactly what its instructions said…"
 *         B error  CUT to the bench: tray 1 tagged            "An error carries evidence."
 *         C old    tray 2 tagged                               "Old data carries evidence."
 *         D zero   tray 3: nothing                             "Zero carries none."
 *         E inside two empty trays, relabelled                 "From the inside, a quiet day and a broken form look exactly the same."
 * PORTRAIT: the trays stack top to bottom; the last pair stands side by side.
 */
var S = HF.scene({ id: "sf-zero", width: 1920, height: 1080, frames: 571, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tSay = K.m("say", 4.0), tErr = K.m("error", 6.6), tOld = K.m("old", 8.7), tZero = K.m("zero", 10.8), tIn = K.m("inside", 13.2), tQuiet = K.m("quiet", 14.6), tBroken = K.m("broken", 15.9);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="kick">Zero carries <span class="g">no evidence.</span></div>';
var tl = gsap.timeline({ paused: true });
gsap.set("#kick", { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, tZero + 0.2);
tl.to("#kick", { opacity: 0, y: -10, duration: 0.24, ease: "power2.in" }, tIn - 0.15);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-zero", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-1.0, 0.6] });
  var M = HWT.line(ctx, {});
  /* the bench, far to the right of the machine on the same wall (its own set; the backdrop carries on) */
  var BX = 24;
  var T = HWT.trays(ctx, 4, { labels: ["AN ERROR", "OLD DATA", "ZERO", "ZERO"], w: 2.7, h: 2.2, gap: 0.6 });
  T.root.position.set(BX, 0, 0);
  T.root.scale.setScalar(PT ? 0.82 : 1);          // portrait: three trays stacked must clear the caption band
  /* tray contents */
  var errP = T.K.paper(1.4, 0.95, 300, function (g, Wp, Hp) { HWT.drawError(g, Wp, Hp); }, { emissive: 0.15 });
  var olds = [0, 1, 2].map(function (k) { return T.K.paper(0.98, 0.66, 300, function (g, Wp, Hp) { HWT.drawSlip(g, Wp, Hp, M.STALE[k], "old", "12 OCT"); }); });
  var POS4 = PT ? [[0, 3.4], [0, 0.6], [0, -2.2], [0, -2.2]] : [[-4.95, 0], [-1.65, 0], [1.65, 0], [4.95, 0]];
  var PAIR = PT ? [[0, -1.6], [0, 1.5]] : [[-1.7, 0], [1.7, 0]];   // portrait: the identical pair stacks (tray 3 stays low, the new one lands above it)
  var IN4 = PT ? [6, 1.5] : [8.7, 0];                               // the fourth tray slides in from the right, full size
  var LS = [
    { t: 0, v: [-4.55, -0.25, 9.0, 0, 0, 0] },
    { t: Math.max(tSay - 0.4, 1.0), v: [-4.55, -0.35, 7.8, 0, 0, 0], e: "sine" },
    { t: tErr - 0.35, v: [-4.55, -0.4, 6.4, 0, 0, 0], e: "sine" },
    { t: tErr - 0.34, v: [BX - 1.65, 0.15, 15.0, 0, 0, 0], e: "cut" },
    { t: tZero - 0.2, v: [BX - 1.55, 0.15, 14.4, 0, 0, 0], e: "sine" },
    { t: tIn + 0.7, v: [BX, 0.1, 12.0, 0, 0, 0], e: "inOut" },
    { t: D, v: [BX, 0.1, 11.2, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [-4.55, 1.0, 23.0, 0, 0, 0] },
    { t: Math.max(tSay - 0.4, 1.0), v: [-4.55, 0.85, 21.0, 0, 0, 0], e: "sine" },
    { t: tErr - 0.35, v: [-4.55, 0.8, 20.0, 0, 0, 0], e: "sine" },
    { t: tErr - 0.34, v: [BX, 0.25, 30, 0, 0, 0], e: "cut" },
    { t: tZero - 0.2, v: [BX, 0.25, 29, 0, 0, 0], e: "sine" },
    { t: tIn + 0.7, v: [BX, 0.2, 22, 0, 0, 0], e: "inOut" },
    { t: D, v: [BX, 0.2, 21, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.hideSlips();
    M.lamps("green", "green", "green", 1);
    M.core(1.1 + 0.25 * Math.sin(t * 2.0), 0, 0);
    M.press(t * 0.6);
    M.clock(0.6 + t * 0.03);
    M.drawerState(null, -1);
    M.job("plain");
    M.jobGlow(Math.min(span(t, tSay - 0.6, tSay + 0.2), 1 - span(t, tErr - 0.5, tErr)) + 0.35 * span(t, tSay - 0.6, tSay + 0.2) * (1 - span(t, tErr - 0.5, tErr)) * Math.sin(t * 5));
    /* the bench (portrait: the trays stack, so the back plate stands upright and the shelf goes) */
    T.home();
    if (PT) { T.by.benchBack.obj.rotation.z = Math.PI / 2; T.by.benchBack.obj.position.y = 0.6; T.by.shelf.obj.visible = false; }
    var apart = E.inOut(span(t, tIn - 0.1, tIn + 0.9));
    for (var i = 0; i < 4; i++) {
      var o = T.list[i].part.obj, p = POS4[i];
      if (i < 2) { o.position.set(p[0] + (PT ? 0 : -6) * apart, p[1] + (PT ? 9 : 0) * apart, 0); o.visible = apart < 0.98; }
      else { var q = PAIR[i - 2], a0 = i === 3 ? IN4 : p; o.position.set(mix(a0[0], q[0], apart), mix(a0[1], q[1], apart), 0); o.visible = i === 2 || apart > 0.02; }
      T.list[i].tagPart.place(0, "up");
    }
    T.tag(0, E.out5(span(t, tErr + 0.15, tErr + 0.75)) * (1 - apart));
    T.tag(1, E.out5(span(t, tOld + 0.15, tOld + 0.75)) * (1 - apart));
    for (i = 0; i < 2; i++) { var tp = T.list[i].tagPart.obj, tr = T.list[i].part.obj; tp.position.x += tr.position.x - (T.list[i].x); tp.position.y += tr.position.y; }
    T.relabel(2, t > tQuiet - 0.1 ? "A QUIET DAY" : "ZERO");
    T.relabel(3, t > tBroken - 0.1 ? "A BROKEN FORM" : "ZERO");
    /* contents ride their trays (bench-local coordinates) */
    var t0 = T.list[0].part.obj, t1 = T.list[1].part.obj;
    errP.at(t0.position.x, t0.position.y - 0.25, 0.55, -0.06, t0.visible ? 1 : 0);
    for (i = 0; i < 3; i++) olds[i].at(t1.position.x - 0.35 + i * 0.32, t1.position.y - 0.42 + i * 0.12, 0.45 + i * 0.05, (i - 1) * 0.18, t1.visible ? 1 : 0);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
