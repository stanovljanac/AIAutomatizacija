/* mv-look — 025 look development (not a video scene). The whole movement, assembled and running.
 * props.mode: "home" (default) | "explode" (0 → assembled over the clip) | "layers" (the oblique shot) */
var S = HF.scene({ id: "mv-look", width: 1920, height: 1080, frames: 120, beatLo: 0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
var tl = gsap.timeline({ paused: true });
tl.to({}, { duration: D }, 0);
HF.register("mv-look", tl);
HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: props.palette || "body", samples: props.mb == null ? 6 : props.mb });
  var M = HMV.build(ctx, {});
  var E = HW.E, mode = props.mode || "home";
  var cards = [];
  for (var i = 0; i < 6; i++) { var c = M.card(M.INVOICES[i]); cards.push(c); }
  var cam = M.cam(mode === "layers"
    ? [{ t: 0, v: [0, M.LOOK_Y, 30, 0, 0, 0] }, { t: D * 0.5, v: [0.5, M.LOOK_Y + 0.4, 34, 0.6, 0.12, 0], e: "inOut" }, { t: D, v: [0.5, M.LOOK_Y + 0.4, 34, 0.62, 0.12, 0] }]
    : [{ t: 0, v: [0, M.LOOK_Y, props.dist || M.DIST, 0, 0, 0] }, { t: D, v: [props.cx || 0, M.LOOK_Y + (props.cy || 0), props.dist1 || props.dist || M.DIST, 0, 0, 0], e: "inOut" }]);
  function pose(t) {
    M.home();
    if (mode === "explode") M.assemble(null, HF3.span(t, 0.2, D - 0.8), "exploded", { stagger: 0.55 });
    if (mode === "layers") M.assemble(null, 1 - E.inOut(HF3.span(t, 0.2, D * 0.5)), "layers", { stagger: 0.0, ease: E.lin });
    if (props.hide) props.hide.forEach(function (g) { M.set(g, false, "off"); });
    M.drive(t * 0.7);
    M.tick(t * 5);
    var a = E.inOut(HF3.span(t, D * 0.35, D * 0.55));
    M.lever(props.lever == null ? a : props.lever);
    M.trap(0); M.push(0); M.hammer(0); M.flag(props.lever ? 1 : 0);
    M.core(1 + 0.3 * Math.sin(t * 3), (t * 0.6) % 1, 0.9);
    for (var i = 0; i < cards.length; i++) {
      cards[i].show(i < 2 ? "read" : "open");
      cards[i].setPos(-5.2 + i * 1.55, M.L.cardY, M.L.card.z);
      cards[i].setRot(0);
    }
  }
  function renderAt(time) { var t = HF3.clamp(time, 0, D); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
