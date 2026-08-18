/* cws-forgot — 022 Short s1 HOOK (9:16, black+gold).
 *
 * Premise: open on what the viewer RECOGNISES — their own long thread — not on the mechanism. Let
 * them scroll it, come back, and find the line they pinned at the start simply absent. Nothing is
 * crossed out: a strike-through would mean "deleted", and the claim is that it was never held. Then
 * every message collapses into a page and the pile lands, which is the object s2 (cw-tower) grows.
 *
 * The final framing is authored to MATCH cw-tower's opening framing exactly (same pile geometry,
 * same seed, same camera scale), so the cut between s1 and s2 is a continuation, not a jump.
 *
 * Deterministic, seek-driven (no callbacks — the capture engine seeks out of order).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cws-forgot", width: 1080, height: 1920, frames: 188, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "hero", dust: 28, seed: 11, bloomY: P ? 40 : 44 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });   // this scene drives its own camera

/* ── the thread: 12 messages, oldest at the top, the pinned one INSIDE it ─────── */
var thread = document.getElementById("thread");
var r = FX.rng(23);
var PITCH = P ? 196 : 122, TOP = 40, PIN = 2, N = 12;
var bubs = [];
for (var i = 0; i < N; i++) {
  var b = FX.el("bub " + (i % 2 === 0 ? "me" : "ai") + (i === PIN ? " pinned" : ""), thread);
  var h = (P ? 132 : 88) + Math.round(r() * (P ? 58 : 42));
  var w = (P ? 560 : 430) + Math.round(r() * (P ? 320 : 300));
  b.style.top = FX.px(TOP + i * PITCH);
  b.style.width = FX.px(w);
  b.style.height = FX.px(h);
  var nl = h > (P ? 172 : 120) ? 3 : 2;
  for (var k = 0; k < nl; k++) {
    var l = FX.el("bl", b);
    l.style.left = FX.px(38);
    l.style.top = FX.px(38 + k * (P ? 36 : 26));
    l.style.width = FX.px((w - 86) * (0.5 + r() * 0.45));
  }
  if (i === PIN) FX.el("pin", b);
  b._y = TOP + i * PITCH;
  bubs.push(b);
}

/* ── the pile it becomes — IDENTICAL to the stack cw-tower opens on ──────────── */
var DESK_Y = P ? 1585 : 890;
var BASE_Y = DESK_Y - 22;
var PILE_W = P ? 760 : 720;
var GAP = P ? 58 : 34, PAGE_H = P ? 34 : 20;
var PN = 11;
FX.desk(document.getElementById("deskhost"), { w: P ? 960 : 1180, top: DESK_Y });
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: PN, baseY: BASE_Y, w: PILE_W, h: PAGE_H, gap: GAP, seed: 41, gold: [10],
});
var sweepBar = FX.sweep(document.getElementById("sweephost"), PILE_W * 1.1);
document.getElementById("impact").style.top = FX.px(BASE_Y + 6);
document.getElementById("hole").style.top = FX.px(bubs[PIN]._y + 130);

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t1 = Math.max(beatAt(1, 0.40), 2.0);          // "…the same pile of paper, over and over."
var away = Math.min(t1 - 1.0, 1.45);              // the thread has finished racing away by here
var back = away + 0.6;                            // and we are looking at the hole
var fall = Math.max(t1 + 0.25, back + 0.55);      // the collapse

var world = document.getElementById("world");
gsap.set("#thread", { y: FX.px(-20) });
gsap.set(["#deskhost", "#hole"], { opacity: 0 });
gsap.set(slabs, { opacity: 0 });
gsap.set(sweepBar, { opacity: 0 });

/* b0 — we are ALREADY mid-conversation and it is running away from us (a cut has no runway) */
FX.fromTo(tl, "#thread", { y: FX.px(-20) }, { y: FX.px(-(TOP + (N - 2) * PITCH)), duration: away, ease: "power2.in" }, 0);
/* the pinned message goes quiet while it is off screen — absence, never a strike-through */
tl.to(bubs[PIN], { opacity: 0, duration: 0.26, ease: "none" }, away * 0.62);
tl.to(bubs[PIN].querySelector(".pin"), { opacity: 0, duration: 0.18 }, away * 0.62);

/* we come back to the top. The slot is a hole, and only a cooling afterglow says it was ever there. */
FX.fromTo(tl, "#thread", { y: FX.px(-(TOP + (N - 2) * PITCH)) }, { y: FX.px(-6), duration: 0.6, ease: "power3.inOut" }, away);
tl.to("#hole", { opacity: 1, duration: 0.4, ease: "sine.out" }, back - 0.1);
FX.camera(tl, { at: back - 0.15, scale: 1.1, y: 90, dur: 0.75, ease: "power2.inOut" });

/* b1 — every message becomes a page; the pile lands with weight */
FX.camera(tl, { at: fall - 0.2, scale: 1, y: 0, dur: 0.5, ease: "power2.inOut" });
tl.to("#hole", { opacity: 0, duration: 0.25, ease: "power2.in" }, fall - 0.15);
tl.to("#deskhost", { opacity: 1, duration: 0.35, ease: "power2.out" }, fall + 0.15);

bubs.forEach(function (b, i) {
  if (i === PIN) return;
  tl.to(b, {
    y: FX.px(BASE_Y - 60 - b._y - (N - 1 - i) * 4),
    scaleY: 0.1, scaleX: 0.62, opacity: 0,
    duration: 0.42, ease: "power2.in",
  }, fall + i * 0.016);
});
slabs.forEach(function (s, i) {
  FX.fromTo(tl, s, { opacity: 0, y: FX.px(-80 + i * 5) }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, fall + 0.3 + i * 0.024);
});
FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.55 }, { opacity: 0.9, scale: 1.05, duration: 0.14, ease: "power2.out" }, fall + 0.56);
tl.to("#impact", { opacity: 0, scale: 1.3, duration: 0.6, ease: "power2.out" }, fall + 0.72);
FX.fromTo(tl, "#pilehost", { y: FX.px(-18) }, { y: 0, duration: 0.5, ease: "back.out(2.6)" }, fall + 0.56);

/* one handoff pulse, so the Short's mechanism has already started when s2 cuts in on it */
var pulse = Math.min(fall + 1.2, D - 1.35);
var topY = BASE_Y - (PN - 1) * GAP - 10;
FX.fromTo(tl, sweepBar, { opacity: 0 }, { opacity: 1, duration: 0.1 }, pulse);
FX.fromTo(tl, sweepBar, { y: FX.px(topY) }, { y: FX.px(BASE_Y + 18), duration: 0.85, ease: "power1.inOut" }, pulse);
tl.to(sweepBar, { opacity: 0, duration: 0.12 }, pulse + 0.85);

/* and settle into EXACTLY the framing cw-tower opens on */
FX.camera(tl, { at: pulse, scale: P ? 1.3 : 1.12, dur: Math.max(D - pulse - 0.05, 0.5), ease: "sine.inOut" });

HF.register("cws-forgot", tl);
