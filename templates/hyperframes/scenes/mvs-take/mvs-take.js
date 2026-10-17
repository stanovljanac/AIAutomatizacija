/* mvs-take — 025 SHORT s6, THE KEY TAKE (mechanical, portrait, black + gold, settled).
 *
 * PREMISE. One sentence has to land, so the scene does one thing. It opens with the blue core and the gold lever
 * in the same tall frame — the agent exactly as it was, one new part — then drops to the tray, and on the word
 * "undoable" the mistake is undone in front of the viewer: the red-tagged draft lifts out, turns over to DELETED,
 * and is gone. Motion settles under the take plate but never stops (D-070): the train walks, the lens drifts.
 *
 * SHOTS:  A  0    core + lever in one frame          "The line didn't make the agent smarter."
 *         B  b1   the tray; the draft is deleted      "It made its mistakes undoable."   (key take)
 */
var S = HF.scene({ id: "mvs-take", width: 1080, height: 1920, frames: 178, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.36);
var m = props.measured || {};
var tSmarter = K.m("smarter", 1.16), tUndo = K.m("undoable", b1 + 1.39);
var E = HW.E, span = HF3.span, mix = HF3.mix;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-tag blue" id="same">the same agent<small>same model, same job</small></div>' +
  '<div class="hw-plate hm-tag" id="part">one new line</div>' +
  '<div class="hw-plate hw-take" id="take">Not smarter. <span class="g">Undoable.</span><span class="ul" id="ul"></span></div>' +
  '<div class="hw-plate hw-chip" id="chip">a draft still needs <b>a person to read it</b></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#same", "#part", "#take", "#chip"], { opacity: 0 });
HW.fromTo(tl, "#same", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, 0.2);
HW.fromTo(tl, "#part", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tSmarter - 0.55);
tl.to(["#same", "#part"], { opacity: 0, duration: 0.2 }, b1 - 0.15);
HW.fromTo(tl, "#take", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tUndo - 0.55);
HW.fromTo(tl, "#ul", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, tUndo - 0.1);
HW.fromTo(tl, "#chip", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tUndo + 0.9);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-take", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "hero", samples: props.mb == null ? 6 : props.mb, keyAt: [3.4, 0.2], keyAngle: 0.46 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: m.stopLine });
  /* the tray as s5 left it: six drafts and the stray on top (all landed before this scene starts) */
  var six = M.INVOICES.filter(function (v) { return v.kind === "go" && v.id !== "INV-1061"; });
  var rest = M.job(six.map(function (inv, i) { return { inv: inv, t0: -30 + i, fate: "draft", pre: "due" }; }), {});
  var stray = M.job([{ inv: M.INVOICES[4], t0: -20, fate: "draft", pre: "due", stray: true }], { trayFrom: 6 });
  var sc = stray.cards[0];

  var cam = M.cam([
    { t: 0, v: [2.45, 1.7, 23.2, 0, 0, 0] },
    { t: b1 - 0.3, v: [2.55, 1.7, 22.2, 0, 0, 0], e: "sine" },
    { t: b1 + 0.8, v: [5.3, -1.35, 15.4, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.3, -1.25, 14.4, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("crank", false);
    /* the room settles under the take: the train slows to a walk, never to a stop */
    M.drive(t * 0.5 - 0.3 * E.inOut(span(t, b1, tUndo)) * Math.max(t - b1, 0));
    M.tick(t * 5);
    M.lever(1);
    rest.update(t); stray.update(t);
    M.trap(0); M.push(0); M.core(1, 0, 0); M.hammer(0); M.flag(1);
    /* undone: the stray draft lifts out of the tray, turns over, and is gone */
    var g = sc.group, up = E.out5(span(t, tUndo - 0.35, tUndo + 0.3)), f = E.inOut(span(t, tUndo + 0.25, tUndo + 0.8)), go = E.in3(span(t, tUndo + 1.25, tUndo + 1.7));
    g.position.y += up * 1.35; g.position.z += up * 1.3; g.position.x += up * -0.1;
    g.rotation.set(0, f * Math.PI * 2, g.rotation.z * (1 - up));
    if (f > 0.5) sc.show("action", "DELETED", "one click, by a person", "gold");
    g.scale.setScalar(Math.max(mix(1, 1.7, up) * (1 - go), 0.001));
    g.visible = go < 0.999;
  }
  function renderAt(time) {
    var t = K.t(time), hit = HW.pulse(t, tUndo, 0.03, 0.5);
    ctx.render(t, pose, cam, { flash: [0.035 * hit, 0.026 * hit, 0.01 * hit], vig: 0.5 + 0.16 * span(t, b1, tUndo) });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
