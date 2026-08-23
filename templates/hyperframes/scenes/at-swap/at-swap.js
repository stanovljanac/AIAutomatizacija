/* at-swap — 023 s25 (the swap) + s26 (the sign-off into Ep.5).
 *
 * ph1 is the channel's signature close: one sentence lifted out, one set down in its place, with the
 * budget bar under it — full and hard-edged, exactly as it arrived in the hook. Deliberately the
 * quietest frame in the video.
 * ph2 opens the next lesson with an OBJECT rather than a promise: the weights the budget is divided
 * with, sealed and dated before the viewer ever typed, with a chat line typed at them that changes
 * nothing inside the seal.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-swap", width: 1920, height: 1080, frames: 515, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "hero", dust: 22, seed: 127, bloomX: 50, bloomY: 44 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ══════════════════ ph1 — s25: drop this, keep this ══════════════════════════ */
if (PHASE === 1) {
  gsap.set(["#seal", "#chatline", "#next", "#question", "#handle"], { display: "none" });
  document.getElementById("dline").textContent = props.drop || "It focuses on what is important and ignores the rest.";
  document.getElementById("kline").textContent = props.keep || "It divides a fixed total across everything I hand it — so what I take away is how I aim it.";

  var t0 = beatAt(0, 0.0);                          // "So drop this one: it focuses on what is important…"
  var t1 = Math.max(beatAt(1, 0.44), t0 + 4.4);     // "Keep this instead: it divides a fixed total…"

  gsap.set("#dropwrap", { opacity: 0, y: FX.px(16) });
  gsap.set("#keepwrap", { opacity: 0, y: FX.px(26) });
  gsap.set("#budget", { opacity: 0 });
  gsap.set("#bfill", { scaleX: 1 });

  tl.to("#dropwrap", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, t0 + 0.1);
  tl.to("#dslash", { scaleX: 1, duration: 0.3, ease: "power3.out" }, t1 - 0.7);
  /* the old line is LIFTED OUT of the frame, not faded: something is being taken away */
  tl.to("#dropwrap", { y: FX.px(-120), opacity: 0.16, duration: 0.55, ease: "power2.inOut" }, t1 - 0.35);
  tl.to("#keepwrap", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t1);
  tl.to("#budget", { opacity: 1, duration: 0.4 }, t1 + 0.5);
  FX.fromTo(tl, "#bfill", { scaleX: 0.9 }, { scaleX: 1, duration: 0.5, ease: "power4.out" }, t1 + 0.55);
  FX.camera(tl, { at: t1, scale: 1.03, dur: Math.max(D - t1 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════ ph2 — s26: next, the frozen weights ══════════════════════ */
} else {
  gsap.set(["#dropwrap", "#keepwrap"], { display: "none" });
  document.getElementById("nexttext").textContent = props.next || "Next: frozen weights";
  document.getElementById("question").textContent = props.question || "";
  document.getElementById("handle").textContent = props.handle || "@TheAutomationDesk";
  document.getElementById("chattxt").textContent = "no — the code is RW-88, remember that";

  /* the weights: a real block of numbers, sealed */
  var sealBody = document.getElementById("sealbody");
  var r = FX.rng(31);
  var wEls = [];
  for (var i = 0; i < 40; i++) {
    var w = FX.el("w", sealBody);
    var v = (r() * 2 - 1);
    w.textContent = (v < 0 ? "" : " ") + v.toFixed(3);
    wEls.push(w);
  }

  var u0 = beatAt(0, 0.0);                          // "Which leaves one last thing open."
  var u1 = Math.max(beatAt(1, 0.10), u0 + 1.2);     // "Those scores — the ones it divides the budget with — where did they come from?"
  var u2 = Math.max(beatAt(2, 0.34), u1 + 3.0);     // "They were set before you ever typed a word…"
  var u3 = Math.max(beatAt(3, 0.62), u2 + 3.2);     // "That is the next lesson."
  var u4 = Math.max(beatAt(4, 0.72), u3 + 1.2);     // the closing question

  gsap.set("#seal", { opacity: 0, y: FX.px(24), scale: 0.97 });
  /* the bar belongs to ph1; leaving it up here runs a gold slab straight through the sign-off type */
  gsap.set("#budget", { display: "none" });
  gsap.set("#chatline", { opacity: 0, y: FX.px(16) });
  gsap.set(["#next", "#question", "#handle"], { opacity: 0, y: FX.px(14) });

  tl.to("#seal", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, u1);
  wEls.forEach(function (el, i) {
    FX.fromTo(tl, el, { opacity: 0 }, { opacity: 1, duration: 0.18 }, u1 + 0.2 + i * 0.012);
  });
  /* a line typed at it, and nothing inside the seal moves */
  tl.to("#chatline", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u2 + 0.2);
  FX.fromTo(tl, "#seal", { x: 0 }, { x: FX.px(-4), duration: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" }, u2 + 0.7);
  tl.to("#chatline", { opacity: 0.4, duration: 0.4 }, u2 + 1.3);

  tl.to("#next", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, u3);
  tl.to("#question", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, u4);
  tl.to("#handle", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u4 + 0.6);
  FX.camera(tl, { at: u3, scale: 1.03, dur: Math.max(D - u3 - 0.2, 0.8), ease: "sine.out" });
}

HF.register("at-swap", tl);
