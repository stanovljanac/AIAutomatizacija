/* sf-flip — 026 s9, THE SENTENCE THAT HID THE FAILURE (mechanical, blue + gold, face-on).
 *
 * PREMISE. The fix starts by deleting, and the thing deleted is ours. The JOB plate turns over once on
 * "flipped" (a transient 3D reveal, then flat again) and its second line lights: "If there were no new
 * requests, say so." A red rule strikes it through as it is read aloud, and the line goes. Beside it, a flat
 * inset of the job card from the previous video (025) shows the same sentence shape — struck too.
 *
 * SHOTS:  A 0        the JOB plate turns over             "So I flipped the job."
 *         B deleted  line 2 struck through, then gone       "I deleted the sentence that hid the failure: if there were no new requests, say so."
 *         C own      the 025 inset                          "It was in my own job card, in my last video."
 */
var S = HF.scene({ id: "sf-flip", width: 1920, height: 1080, frames: 313, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tDel = K.m("deleted", 1.2), tSay = K.m("say", 5.7), tOwn = K.m("own", 7.4), tLast = K.m("last", 8.8);

document.getElementById("hud").innerHTML =
  '<div class="hw-plate sf-card" id="card"><div class="hd">025 · the job card from my last video</div>' +
  '<div class="ln"><b>REPORT</b> Write report.md: what you drafted, what you put on the “needs me” list… <span class="st">If there was nothing to chase, say so.</span></div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set("#card", { opacity: 0 });
HW.fromTo(tl, "#card", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, tOwn - 0.1);
HW.fromTo(tl, "#card .st", { "--k": 0 }, { "--k": 1, duration: 0.5, ease: "power2.inOut" }, tLast + 0.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-flip", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [-2.5, 0.0] });
  var M = HWT.line(ctx, {});
  var LS = [
    { t: 0, v: [-4.55, -0.35, 8.2, 0, 0, 0] },
    { t: Math.max(tDel - 0.2, 0.8), v: [-4.55, -0.4, 7.6, 0, 0, 0], e: "sine" },
    { t: tOwn - 0.5, v: [-4.55, -0.45, 6.9, 0, 0, 0], e: "sine" },
    { t: tOwn + 0.4, v: [-4.55, -0.15, 8.6, 0, 0, 0], e: "inOut" },
    { t: D, v: [-4.55, -0.15, 8.2, 0, 0, 0], e: "sine" },
  ];
  var PTK = [
    { t: 0, v: [-4.55, 1.0, 21.5, 0, 0, 0] },
    { t: Math.max(tDel - 0.2, 0.8), v: [-4.55, 0.95, 20.5, 0, 0, 0], e: "sine" },
    { t: tOwn - 0.5, v: [-4.55, 0.9, 19.8, 0, 0, 0], e: "sine" },
    { t: D, v: [-4.55, 0.4, 19.0, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);
  var tS0 = Math.max(tDel + 1.4, tSay - 1.9), tS1 = tSay + 0.45;

  function pose(t) {
    M.home(false);
    M.hideSlips();
    M.lamps("green", "green", "green", 1);
    M.core(1.1 + 0.25 * Math.sin(t * 2.0), 0, 0);
    M.press(t * 0.6);
    M.clock(0.6 + t * 0.03);
    M.drawerState(null, -1);
    /* the flip: one full turn about the plate's long axis, then flat */
    var f = E.inOut(span(t, 0.05, 0.95));
    M.by.job.obj.rotation.x += f * HM.TAU;
    M.by.job.obj.position.z += Math.sin(f * Math.PI) * 0.9;
    var s = E.inOut(span(t, tS0, tS1));
    if (t < tOwn - 0.25) M.job(s > 0.001 ? "strike" : "plain", s); else M.job("gone");
    M.jobGlow(span(t, tDel - 0.3, tDel + 0.4) * (1 - span(t, tOwn - 0.3, tOwn + 0.2)) * 0.8);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
