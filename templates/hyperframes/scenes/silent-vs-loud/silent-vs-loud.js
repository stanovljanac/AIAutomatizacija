/* silent-vs-loud — GSAP timeline for 013 s3 (round-2: SILENT vs LOUD, no proof counter).
 * SILENT rail ships ✗ cards then fades mid-motion (a "?" hangs); LOUD rail ships, a RETRY chip
 * blips, the line STOPS at a red flag; on "Loud." the loud rail turns gold + a "LOUD" punch.
 * Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "silent-vs-loud", width: 1080, height: 1920, frames: 353, beatLo: 0.05, beatHi: 0.4 });
var fps = S.fps, W = S.W, D = S.D, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

// beats: [0] establish, [1] SILENT ships+fades, [2] LOUD retry→stop, [3] "Loud." gold punch
var tEstablish = beatAt(0, 0.0);
var tSilent = Math.max(beatAt(1, 0.2), tEstablish + 0.8);
var tLoud = Math.max(beatAt(2, 0.48), tSilent + 1.6);
var tGold = Math.max(beatAt(3, 0.92), tLoud + 1.8);

// build cards: 4 defect cards on rail A, 3 clean cards on rail B (last one gold, held)
var cardsA = document.getElementById("cardsA");
for (var a = 0; a < 4; a++) {
  var c = document.createElement("div");
  c.className = "gcard";
  c.innerHTML = '<span class="x">✗</span>';
  cardsA.appendChild(c);
}
var cardsB = document.getElementById("cardsB");
for (var b = 0; b < 3; b++) {
  var cb = document.createElement("div");
  cb.className = "gcard" + (b === 2 ? " goldcard" : "");
  cardsB.appendChild(cb);
}

var tl = gsap.timeline({ paused: true });

var railW = W * 0.9; // travel distance across the rail
var STOP_X = railW * 0.56; // where rail B's line stops (before the flag at 78%)

// camera: slow push-in the whole scene (motivated: closing in on the contrast)
tl.fromTo("#camera", { scale: 1.0 }, { scale: 1.06, duration: D - 0.2, ease: "power1.inOut" }, 0.1);

// beat 0 — establish both rail frames
tl.from("#railA", { opacity: 0, y: -40 * U, duration: 0.5, ease: "power3.out" }, tEstablish);
tl.from("#railB", { opacity: 0, y: 40 * U, duration: 0.5, ease: "power3.out" }, tEstablish + 0.12);

// beat 1 — SILENT rail keeps shipping ✗ cards (belt physics: accel out, drift, exit)
var aEls = cardsA.children;
for (var i = 0; i < aEls.length; i++) {
  var t0 = tSilent + i * 0.4;
  tl.fromTo(aEls[i], { x: 20 * U, opacity: 0 }, { x: 130 * U, opacity: 1, duration: 0.22, ease: "power2.out" }, t0);
  tl.to(aEls[i], { x: railW + 60 * U, duration: 2.1, ease: "none" }, t0 + 0.22);
  tl.fromTo(aEls[i].querySelector(".x"), { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.16, ease: "power4.in" }, t0 + 0.5);
}
// …then the SILENT rail just fades mid-motion — a "?" hangs (stopped, nobody noticed)
var tFade = Math.max(tSilent + 1.9, tLoud - 0.5);
tl.to("#railA", { opacity: 0.3, filter: "saturate(0.2)", duration: 0.7, ease: "power2.inOut" }, tFade);
tl.fromTo("#hangq", { opacity: 0, y: -26 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }, tFade + 0.3);
tl.to("#hangq", { y: 8 * U, duration: 1.4, yoyo: true, repeat: 3, ease: "sine.inOut" }, tFade + 0.8);

// beat 2 — LOUD rail: cards ship, a RETRY chip blips, then the LINE STOPS at the flag
var bEls = cardsB.children;
for (var j = 0; j < bEls.length; j++) {
  var tb = tLoud + j * 0.5;
  var gap = (2 - j) * 230 * U; // queue up behind the stop point
  tl.fromTo(bEls[j], { x: 20 * U, opacity: 0 }, { x: 130 * U, opacity: 1, duration: 0.22, ease: "power2.out" }, tb);
  tl.to(bEls[j], { x: STOP_X - gap, duration: 1.05, ease: "power2.out" }, tb + 0.22);
  tl.to(bEls[j], { scaleX: 0.94, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.inOut" }, tb + 1.27);
}
tl.fromTo("#retrychip", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.24, ease: "power4.in" }, tLoud + 0.5);
tl.to("#retrychip", { scale: 1.08, duration: 0.22, yoyo: true, repeat: 3, ease: "sine.inOut" }, tLoud + 0.8);
tl.to("#retrychip", { opacity: 0.35, duration: 0.4, ease: "power2.out" }, tLoud + 1.7);
tl.fromTo("#flagpost", { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.35, transformOrigin: "50% 100%", ease: "back.out(1.8)" }, tLoud + 1.5);
tl.fromTo("#flag", { scaleX: 0 }, { scaleX: 1, duration: 0.28, ease: "back.out(2)" }, tLoud + 1.75);

// beat 3 — "Loud.": the loud rail turns gold, the flag pulses, and a LOUD punch lands
tl.to("#nameB", { color: "#FFB020", textShadow: "0 0 28px rgba(255,176,32,0.45)", duration: 0.35 }, tGold);
tl.to("#beltB", { boxShadow: "0 0 24px rgba(255,176,32,0.55)", duration: 0.35 }, tGold);
tl.to("#flag", { boxShadow: "0 0 40px rgba(255,176,32,0.6)", duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, tGold);
tl.fromTo("#loudpunch", { opacity: 0, scale: 1.7, y: 24 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(1.7)" }, tGold);
tl.to("#loudpunch", { scale: 1.05, duration: 0.5, yoyo: true, repeat: 2, ease: "sine.inOut" }, tGold + 0.45);

HF.register("silent-vs-loud", tl);
