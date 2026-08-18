/* cw-paste-myth — 022 s15 (phase 1) + s18 (phase 2).
 * Premise: "just paste it all in" has to be shown as a physical mistake before it is argued against —
 * so first the pages simply overflow the desk, and only later (after the evidence scenes) does the
 * plate take the slash. Then the desk is made BIGGER and the reading gets visibly worse on it, which
 * is the whole "bigger window is not a bigger brain" beat.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-paste-myth", width: 1920, height: 1080, frames: 171, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 53, bloomY: 54 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("myth").textContent = props.myth || "“just paste it all in”";
document.getElementById("dtext").textContent = props.quote || "“as the token count grows, accuracy and recall degrade”";
document.getElementById("dchip").textContent = props.sourceChip || "platform docs · 2026-08-16";
document.getElementById("rottext").textContent = props.rot || "context rot";

var DESK_Y = P ? 1330 : 790;
var desk = FX.desk(document.getElementById("deskhost"), { w: P ? 900 : 1080, top: DESK_Y });
var N = 22;
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: N, baseY: DESK_Y - 16, w: P ? 700 : 760, gap: 19, seed: 41, gold: [N - 1],
});
var sweepBar = FX.sweep(document.getElementById("sweephost"), (P ? 700 : 760) * 1.15);
var topY = DESK_Y - 16 - (N - 1) * 19;

gsap.set("#mythwrap", { opacity: 0, y: FX.px(-30) });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#docs", { opacity: 0, y: FX.px(44), scale: 0.97 });
gsap.set("#rot", { opacity: 0, scale: 0.86 });

/* ══════════════════ ph1 — s15: the advice, and the dump it causes ══════════════ */
if (PHASE === 1) {
  gsap.set(slabs, { opacity: 0 });
  tl.to("#mythwrap", { opacity: 1, y: 0, duration: 0.38, ease: "power3.out" }, 0.15);
  /* far too much paper, arriving far too fast, overflowing the frame edges */
  slabs.forEach(function (s, i) {
    FX.fromTo(tl, s, { opacity: 0, y: FX.px(-420 - i * 12), rotation: s._rot * 6 },
      { opacity: 1, y: 0, rotation: s._rot, duration: 0.34, ease: "power3.in" }, 0.7 + i * 0.11);
  });
  tl.to(desk, { scaleX: 1.02, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.6);
  FX.camera(tl, { at: 0.6, scale: 1.06, y: 24, dur: Math.max(D - 0.8, 1), ease: "sine.inOut" });

/* ═══════ ph2 — s18: bigger desk, worse reading, and the manual's own word ══════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.15), u0 + 1.4);   // "It is a bigger desk…"
  var u2 = Math.max(beatAt(2, 0.44), u1 + 3.0);   // "One of the labs writes it into its own docs…"
  var u3 = Math.max(beatAt(3, 0.87), u2 + 5.0);   // "They even have a name for it: context rot."

  gsap.set(slabs, { opacity: 1 });
  gsap.set("#mythwrap", { opacity: 1, y: 0 });

  /* the slash — earned, now that the evidence has been shown */
  FX.strike(tl, "#myth", "#slash", u0 + 0.6);
  tl.to("#mythwrap", { opacity: 0, y: FX.px(-40), duration: 0.35, ease: "power2.in" }, u1 - 0.2);

  /* a BIGGER desk, and the same pile keeps growing on it */
  tl.to(desk, { scaleX: 1.55, duration: 0.9, ease: "power3.inOut" }, u1);
  tl.to(slabs, { scaleX: 1.12, duration: 0.9, ease: "power3.inOut", stagger: 0.012 }, u1 + 0.1);

  /* the read sweep returns — slower, and visibly skipping pages */
  tl.set(sweepBar, { y: FX.px(topY - 8), opacity: 0 }, u1 + 0.9);
  tl.to(sweepBar, { opacity: 1, duration: 0.1 }, u1 + 0.9);
  tl.to(sweepBar, { y: FX.px(DESK_Y - 4), duration: Math.max(u2 - u1 - 0.6, 1.6), ease: "none" }, u1 + 1.0);
  tl.to(sweepBar, { opacity: 0.25, duration: 0.5 }, u1 + 1.4);
  /* pages the sweep misses go dark — the degradation, drawn rather than asserted */
  [3, 6, 9, 12, 15, 18].forEach(function (i, k) {
    tl.to(slabs[i], { filter: "saturate(0.15) brightness(0.45)", duration: 0.4 }, u1 + 1.3 + k * 0.28);
  });

  tl.to("#docs", { opacity: 1, y: 0, scale: 1, duration: 0.46, ease: "power3.out" }, u2 + 0.2);
  tl.to("#docs", { opacity: 0, y: FX.px(-30), duration: 0.35, ease: "power2.in" }, u3 - 0.3);
  tl.to("#rot", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.9)" }, u3 + 0.05);
  FX.camera(tl, { at: u3, scale: 1.05, dur: Math.max(D - u3 - 0.2, 0.8), ease: "sine.out" });
}

HF.register("cw-paste-myth", tl);
