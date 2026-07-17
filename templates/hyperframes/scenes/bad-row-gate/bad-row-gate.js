/* bad-row-gate — GSAP timeline for the "one bad row hits the gate" beat (one file, 16:9 + 9:16).
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *
 * Duration derivation (load-bearing, identical to hook-kinetic):
 *   data-duration = (durationFrames - 0.5) / fps   => ceils to EXACTLY durationFrames.
 *
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. The 5 key
 * moments map to revealsSeconds (the sentence-start beats) when present, else fractions of D.
 */

var S = HF.scene({ id: "bad-row-gate", width: 1920, height: 1080, frames: 420 });
var fps = S.fps, W = S.W, H = S.H, D = S.D, props = S.props, beats = S.beats, IS_PORTRAIT = S.portrait, cl = S.cl;

// fill cells from props (optional)
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("cell-name", props.name);
setText("cell-date", props.date);
setText("cell-amt", props.amount);
setText("stamp-text", props.reason);

// ── beat timing: 5 moments (slide-in, travel, hit, stamp, drop) ──
// clamp helper
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.2, D - 0.4);
}
var tIn = beatAt(0, 0.08);
var tTravel = Math.max(beatAt(1, 0.3), tIn + 0.5);
var tHit = Math.max(beatAt(2, 0.5), tTravel + 0.7);
var tStamp = Math.max(beatAt(3, 0.64), tHit + 0.3);
var tDrop = Math.max(beatAt(4, 0.8), tStamp + 0.5);

// travel geometry (px). The compact row sits in the left third; it travels RIGHT until its edge
// reaches the gate (which is seated to its right — they never overlap, so the bar can't bisect the
// row). Portrait nudges down toward the horizontal gate bar.
var travel = IS_PORTRAIT ? 0 : W * 0.05;
var travelY = IS_PORTRAIT ? H * 0.06 : 0;
var recoil = IS_PORTRAIT ? 0 : W * 0.05;
var recoilY = IS_PORTRAIT ? H * 0.04 : 0;

// ── GSAP timeline (paused; the renderer seeks it) ──
var tl = gsap.timeline({ paused: true });

// resting-state entrances: kicker, gate, clean table
gsap.set("#row", { x: IS_PORTRAIT ? 0 : -W * 0.55, y: IS_PORTRAIT ? -H * 0.4 : 0, opacity: 0 });
gsap.set("#stamp", { opacity: 0, scale: 0.5, rotate: -8 });
gsap.set("#quarantine", { opacity: 0 });
gsap.set("#reject-flash", { opacity: 0 });

tl.fromTo("#kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.1);
tl.fromTo("#gate", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }, 0.2);
tl.fromTo("#clean", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 0.35);

// 1) the bad row slides in
tl.to("#row", { x: 0, y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, tIn);

// 2) it travels toward the gate
tl.to("#row", { x: travel, y: travelY, duration: Math.max(0.5, tHit - tTravel), ease: "power1.in" }, tTravel);

// 3) HIT: gate flares red, screen flash, row recoils with a bounce
tl.to("#gate-bar", { keyframes: [
  { background: "linear-gradient(180deg, #ff8a8a, #ff5c5c)", boxShadow: "0 0 36px rgba(255,92,92,0.9), 0 0 90px rgba(255,92,92,0.5)", duration: 0.12 },
  { background: "linear-gradient(180deg, #ffd37a, #ffb020)", boxShadow: "0 0 28px rgba(255,176,32,0.7), 0 0 70px rgba(255,176,32,0.3)", duration: 0.6 },
], ease: "power2.out" }, tHit);
tl.fromTo("#reject-flash", { opacity: 0 }, { opacity: 0.85, duration: 0.1, ease: "power2.out" }, tHit);
tl.to("#reject-flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tHit + 0.1);
tl.to("#row", { x: travel - recoil, y: travelY - recoilY, duration: 0.35, ease: "back.out(2.2)" }, tHit + 0.02);

// 4) the rejection reason stamps in
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -4, duration: 0.4, ease: "back.out(2.4)" }, tStamp);

// 5) the bad row drops into quarantine; the clean table stays pristine (a calm green pulse)
tl.to("#row", { y: (IS_PORTRAIT ? H * 0.44 : H * 0.30), opacity: 0, duration: 0.7, ease: "power2.in" }, tDrop);
tl.to("#stamp", { opacity: 0, duration: 0.5, ease: "power2.in" }, tDrop + 0.2);
tl.to("#quarantine", { opacity: 1, duration: 0.5, ease: "power2.out" }, tDrop + 0.05);
tl.fromTo("#clean", { boxShadow: "0 16px 50px rgba(0,0,0,0.45)" }, { boxShadow: "0 0 0 2px rgba(52,211,154,0.6), 0 16px 50px rgba(0,0,0,0.45)", duration: 0.5, ease: "power2.out" }, tDrop + 0.1);

// NO exit animation — the master timeline owns the cut; last frame stays composed.
HF.register("bad-row-gate", tl);
