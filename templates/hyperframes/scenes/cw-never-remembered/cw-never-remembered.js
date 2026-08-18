/* cw-never-remembered — 022 s1 HOOK HERO (black+gold).
 * Premise: don't SAY the model forgot — make the viewer scroll their own thread, come back, and find
 * the pinned line simply absent. Then name the myth, strike it, and collapse the whole chat into the
 * pile the video runs on.
 * Deterministic, seek-driven. No callbacks (the capture engine seeks): property tweens + onUpdate only.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-never-remembered", width: 1920, height: 1080, frames: 335, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "hero", dust: 30, seed: 11, bloomY: 42 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false }); // this scene drives its own camera

document.getElementById("myth").textContent = props.myth || "it forgot";
document.getElementById("kickertext").textContent = props.title || "It never remembered.";

/* ── build the thread ────────────────────────────────────────────────────────────
 * 16 messages, alternating sides, oldest at the top. Message 0 is PINNED — the thing the viewer
 * said at the start. Widths/heights vary deterministically so it reads as a real conversation. */
var thread = document.getElementById("thread");
var r = FX.rng(23);
var PITCH = 122, TOP = 40, PIN = 2; // the pinned message sits INSIDE the thread, so its absence is a hole
var bubs = [];
for (var i = 0; i < 16; i++) {
  var b = FX.el("bub " + (i % 2 === 0 ? "me" : "ai") + (i === PIN ? " pinned" : ""), thread);
  var h = 88 + Math.round(r() * 42);
  var w = 430 + Math.round(r() * 300);
  b.style.top = FX.px(TOP + i * PITCH);
  b.style.width = FX.px(P ? Math.min(w + 120, 860) : w);
  b.style.height = FX.px(h);
  var nl = h > 120 ? 3 : 2;
  for (var k = 0; k < nl; k++) {
    var l = FX.el("bl", b);
    l.style.left = FX.px(30);
    l.style.top = FX.px(30 + k * 26);
    l.style.width = FX.px((w - 70) * (0.5 + r() * 0.45));
  }
  if (i === PIN) FX.el("pin", b);
  b._y = TOP + i * PITCH;
  bubs.push(b);
}

/* ── the pile the thread becomes ─────────────────────────────────────────────── */
var PILE_Y = P ? 1210 : 762;
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: 13, baseY: PILE_Y, w: P ? 760 : 780, gap: 22, seed: 41, gold: [12],
});

/* ── beats ───────────────────────────────────────────────────────────────────── */
var t0 = 0;                                  // "You've been ten messages deep…"
var t1 = beatAt(1, 0.50);                    // "Everyone calls that forgetting."
var t2 = beatAt(2, 0.68);                    // "It didn't forget."
var t3 = beatAt(3, 0.79);                    // "It never remembered anything in the first place."
var tBack = Math.max(t1 - 1.7, 3.2);         // the view comes back to the top of the thread

/* opening state — we are ALREADY mid-conversation (a cut has no runway, MOTION_SPEC §3) */
gsap.set("#thread", { y: FX.px(-30) });
gsap.set("#mythwrap", { opacity: 0, y: FX.px(70), scale: 0.94 });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: FX.px(34) });
gsap.set("#impact", { opacity: 0, scale: 0.6 });
gsap.set(slabs, { opacity: 0 });

/* b0 — the thread runs away from us, accelerating: ten messages deep, and it's going well */
tl.to("#thread", { y: FX.px(-1180), duration: tBack - 0.55, ease: "power2.in" }, t0);
/* the pinned message goes quiet while it is off screen — nothing is crossed out, it just stops being
   there. (Absence is the whole hook: a strike-through here would be "deleted", which is not the claim.) */
tl.to(bubs[PIN], { opacity: 0, duration: 0.3, ease: "none" }, t0 + 1.9);
tl.to(bubs[PIN].querySelector(".pin"), { opacity: 0, duration: 0.2 }, t0 + 1.9);

/* b0' — we come back down to the top. The slot is empty. */
tl.to("#thread", { y: FX.px(-14), duration: 0.95, ease: "power3.inOut" }, tBack - 0.55);
FX.camera(tl, { at: tBack + 0.3, scale: 1.09, y: 96, dur: 1.1, ease: "power2.inOut" });

/* b1 — the myth is named */
tl.to("#mythwrap", { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }, t1);
tl.to("#threadclip", { opacity: 0.38, duration: 0.5, ease: "sine.out" }, t1);

/* b2 — and struck */
FX.strike(tl, "#myth", "#slash", t2);

/* b3 — the collapse: every message becomes a page, and the pile lands with weight */
var tc = t3 + 0.1;
FX.camera(tl, { at: tc - 0.25, scale: 1, y: 0, dur: 0.7, ease: "power2.inOut" });
tl.to("#mythwrap", { opacity: 0, y: FX.px(-40), scale: 0.9, duration: 0.28, ease: "power2.in" }, tc - 0.2);
tl.to("#threadclip", { opacity: 1, duration: 0.2 }, tc - 0.2);

bubs.forEach(function (b, i) {
  if (i === PIN) return;
  tl.to(b, {
    y: FX.px(PILE_Y - 40 - b._y - (15 - i) * 3),
    scaleY: 0.12, scaleX: 0.66, opacity: 0,
    duration: 0.46, ease: "power2.in",
  }, tc + i * 0.018);
});
tl.to("#thread", { y: FX.px(0), duration: 0.4, ease: "power2.out" }, tc);

slabs.forEach(function (s, i) {
  FX.fromTo(tl, s, { opacity: 0, y: FX.px(-70 + i * 4) }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tc + 0.34 + i * 0.022);
});
/* the landing: a contact flash and a settle, so the pile has MASS */
FX.fromTo(tl, "#impact", { opacity: 0, scale: 0.55 }, { opacity: 0.85, scale: 1.05, duration: 0.16, ease: "power2.out" }, tc + 0.6);
tl.to("#impact", { opacity: 0, scale: 1.25, duration: 0.7, ease: "power2.out" }, tc + 0.76);
FX.fromTo(tl, "#pilehost", { y: FX.px(-16) }, { y: 0, duration: 0.5, ease: "back.out(2.6)" }, tc + 0.6);

/* the line the scene installs — reserved space above the pile, never over it */
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tc + 0.86);
FX.camera(tl, { at: tc + 0.9, scale: 1.045, dur: Math.max(D - (tc + 0.9) - 0.05, 0.5), ease: "sine.out" });

HF.register("cw-never-remembered", tl);
