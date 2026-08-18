/* cw-swap — 022 s25 (phase 1) + s26 (phase 2) + Short s5 (phase 3).
 * Premise: an episode ends by REPLACING a sentence in the viewer's head, so the wrong one has to die
 * on screen before the right one exists — and the scripted pause sits in the gap between them. The
 * sign-off then shows, without a word of explanation, what the next episode is about: threads of
 * attention reaching for a few pages out of the whole pile.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-swap", width: 1920, height: 1080, frames: 375, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "hero", dust: 26, seed: 101, bloomY: P ? 46 : 44 });

var PHASE = Number(props.phase) || 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("myth").textContent = props.myth || "it remembers our conversation until the window fills up";
document.getElementById("monotext").textContent = props.right || "It re-reads whatever I hand it. Every single turn.";
document.getElementById("nlbl").textContent = props.nextLabel || "next lesson";
document.getElementById("ntxt").textContent = props.next || "attention";
document.getElementById("question").textContent = props.question || "What's the thing you're certain you told an AI — and it acted like you never did?";

var PILE_Y = P ? 1240 : 790;
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: 14, baseY: PILE_Y, w: P ? 720 : 760, gap: 22, seed: 41, gold: [13],
});

/* the threads: from one reading point to a HANDFUL of pages, ignoring the rest */
var svg = document.getElementById("threads");
/* the viewBox must match the real frame — a hard-coded 1920x1080 draws the threads in the wrong
   space on the 9:16 cut (measured: they landed detached in the top-left corner). */
svg.setAttribute("viewBox", "0 0 " + S.W + " " + S.H);
var EYE_X = P ? 540 : 960, EYE_Y = P ? 760 : 440;   // clear of the closing question
document.getElementById("eye").style.left = (P ? 50 : 50) + "%";
document.getElementById("eye").style.top = FX.px(EYE_Y);
var PICKS = [2, 5, 6, 10, 13];
var threads = PICKS.map(function (idx) {
  var y = PILE_Y - idx * 22 + 7;
  var x = EYE_X + (idx % 2 ? -220 : 200);
  var pth = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pth.setAttribute("d", "M " + EYE_X + " " + EYE_Y + " Q " + ((EYE_X + x) / 2) + " " + ((EYE_Y + y) / 2 - 60) + " " + x + " " + y);
  pth.setAttribute("fill", "none");
  pth.setAttribute("stroke", "#ffb020");
  pth.setAttribute("stroke-width", "3");
  pth.setAttribute("stroke-linecap", "round");
  pth.setAttribute("opacity", "0.75");
  svg.appendChild(pth);
  gsap.set(pth, { strokeDasharray: 1400, strokeDashoffset: 1400 });
  return pth;
});

gsap.set(["#mythwrap", "#mono", "#nextplate", "#question", "#eye"], { opacity: 0 });
gsap.set("#slash", { scaleX: 0 });

/* ══════════════════════════ ph1 — s25: the swap ════════════════════════════════ */
if (PHASE === 1) {
  var t1 = beatAt(1, 0.5);   // "Keep this instead: …"
  gsap.set(slabs, { opacity: 0 });
  gsap.set("#mythwrap", { opacity: 0, y: FX.px(24) });

  tl.to("#mythwrap", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.2);
  FX.strike(tl, "#myth", "#slash", Math.max(t1 - 2.6, 2.2));
  /* the scripted pause lives here: nothing moves while the wrong picture dies */
  tl.to("#mythwrap", { opacity: 0, y: FX.px(-34), duration: 0.32, ease: "power2.in" }, t1 - 0.3);

  FX.fromTo(tl, "#mono", { opacity: 0, y: FX.px(52), scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, t1 + 0.05);
  FX.camera(tl, { at: t1 + 0.05, scale: 1.06, dur: Math.max(D - t1 - 0.2, 1.2), ease: "sine.out" });

/* ═════════════════════ ph2 — s26: the causal sign-off ══════════════════════════ */
} else if (PHASE === 2) {
  var u1 = beatAt(1, 0.14);   // "Out of a whole pile of pages, how does it decide…"
  var u2 = beatAt(2, 0.52);   // "That has a name, and it is the next lesson."
  var u3 = beatAt(3, 0.72);   // the closing question

  gsap.set(slabs, { opacity: 1 });
  tl.to("#eye", { opacity: 1, duration: 0.35 }, u1 + 0.1);
  threads.forEach(function (p, i) {
    tl.to(p, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, u1 + 0.3 + i * 0.16);
  });
  /* the pages it does NOT reach go quiet — the whole point, said without a word */
  slabs.forEach(function (s, i) {
    if (PICKS.indexOf(i) >= 0) return;
    tl.to(s, { filter: "brightness(0.5) saturate(0.5)", duration: 0.6 }, u1 + 1.4);
  });
  tl.to("#nextplate", { opacity: 1, duration: 0.4, ease: "power3.out" }, u2 + 0.2);
  FX.fromTo(tl, "#question", { opacity: 0, y: FX.px(22) }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, u3 + 0.1);
  FX.camera(tl, { at: u2, scale: 1.05, dur: Math.max(D - u2 - 0.2, 1.2), ease: "sine.out" });

/* ═══════════════════════ ph3 — Short s5: the same close ════════════════════════ */
} else {
  var v1 = beatAt(1, 0.6);   // "But how does it choose what to pay attention to?"
  var v2 = beatAt(2, 0.88);  // "That's the next lesson."
  gsap.set(slabs, { opacity: 0 });

  FX.fromTo(tl, "#mono", { opacity: 0, y: FX.px(44), scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, 0.15);
  tl.to("#mono", { opacity: 0, y: FX.px(-40), duration: 0.35, ease: "power2.in" }, v1 - 0.5);
  slabs.forEach(function (s, i) {
    FX.fromTo(tl, s, { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" }, v1 - 0.35 + i * 0.03);
  });
  tl.to("#eye", { opacity: 1, duration: 0.3 }, v1 + 0.3);
  threads.forEach(function (p, i) {
    tl.to(p, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" }, v1 + 0.45 + i * 0.12);
  });
  slabs.forEach(function (s, i) {
    if (PICKS.indexOf(i) >= 0) return;
    tl.to(s, { filter: "brightness(0.5) saturate(0.5)", duration: 0.5 }, v1 + 1.2);
  });
  tl.to("#nextplate", { opacity: 1, duration: 0.4, ease: "power3.out" }, v2 + 0.05);
  FX.camera(tl, { at: v1, scale: 1.06, dur: Math.max(D - v1 - 0.2, 1), ease: "sine.out" });
}

HF.register("cw-swap", tl);
