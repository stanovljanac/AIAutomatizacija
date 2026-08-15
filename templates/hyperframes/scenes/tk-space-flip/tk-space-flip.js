/* tk-space-flip — GSAP timeline for 021 s9 (phase 1), s10 (phase 2) and Short s3 ("short").
 * A change you cannot see changes what the model receives: the space in front of the word is drawn
 * as a gold interpunct, the three capsules fuse into one, and the counter ticks 3 → 1 (then 4 in
 * capitals). The counter is the constant element — same position, same type, only the number moves.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-space-flip", width: 1920, height: 1080, frames: 490, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = String(props.phase == null ? 1 : props.phase);
var THREE = Array.isArray(props.three) && props.three.length ? props.three : ["st", "raw", "berry"];
var ONE = props.one || "strawberry";
var CAPS4 = Array.isArray(props.caps) && props.caps.length ? props.caps : ["ST", "RAW", "B", "ERRY"];

function fill(hostId, items) {
  var host = document.getElementById(hostId);
  items.forEach(function (t) {
    var s = document.createElement("span"); s.className = "cap"; s.textContent = t; host.appendChild(s);
  });
  return host.querySelectorAll(".cap");
}
var threeCaps = fill("three", THREE);
var oneCap = fill("one", [ONE]);
var fourCaps = fill("four", CAPS4);

var cnum = document.getElementById("cnum");
// The counter's VALUE is driven by a numeric tween's onUpdate writing an absolute string — never by a
// `tl.add(callback)`. The capture engine seeks (and renders frames out of order across workers), so a
// crossed-playhead callback may never fire, while a tween is always re-rendered at the sought time.
var CV = { v: Number(props.counterFrom || 3) };
function counterTo(at, value, dur) {
  tl.to(CV, {
    v: value, duration: dur == null ? 0.18 : dur, ease: "none",
    onUpdate: function () { cnum.textContent = String(Math.round(CV.v)); },
  }, at);
}
document.getElementById("caption").textContent = props.caption || "";
document.getElementById("chip").textContent = props.sourceChip || "";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

/** The whole invisible-cause move: the interpunct lands, the three slide together and fuse into one. */
function fuse(at, speed) {
  var d = speed || 1;
  tl.fromTo("#dot", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.26 * d, ease: "back.out(3)" }, at);
  tl.to("#dot", { scale: 1.8, opacity: 0.45, duration: 0.44 * d, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + 0.26 * d);
  // the three slide together — slowly enough to be unmistakable
  tl.to("#three", { gap: 0 + "px", duration: 0.7 * d, ease: "power2.inOut" }, at + 0.7 * d);
  threeCaps.forEach(function (el, i) {
    tl.to(el, { x: (1 - i) * 26 * U, duration: 0.7 * d, ease: "power2.inOut" }, at + 0.7 * d);
  });
  tl.to("#three", { opacity: 0, duration: 0.18 * d }, at + 1.5 * d);
  tl.to("#one", { opacity: 1, duration: 0.18 * d }, at + 1.52 * d);
  tl.fromTo("#one", { scale: 0.92 }, { scale: 1, duration: 0.34 * d, ease: "back.out(2)" }, at + 1.52 * d);
  // …and the counter ticks 3 → 1 in place
  tl.to("#cnum", { scale: 0.7, opacity: 0, duration: 0.18 * d, ease: "power2.in" }, at + 1.5 * d);
  counterTo(at + 1.68 * d, Number(props.counterTo || 1), 0.02);
  tl.to("#cnum", { scale: 1, opacity: 1, duration: 0.3 * d, ease: "back.out(2.4)" }, at + 1.7 * d);
}

/** Put the row back to three, instantly — used only for the faster replay (the double-take). */
function resetToThree(at) {
  counterTo(at, Number(props.counterFrom || 3), 0.02);
  tl.set("#one", { opacity: 0 }, at);
  tl.set("#three", { opacity: 1, gap: 14 * U + "px" }, at);
  tl.set(threeCaps, { x: 0 }, at);
  tl.set("#dot", { opacity: 0 }, at);
}

gsap.set("#one", { opacity: 0 });
gsap.set("#four", { opacity: 0 });
gsap.set("#dot", { opacity: 0 });
gsap.set(".st", { opacity: 0 });

if (PHASE === "2") {
  // ── s10: opens on the FUSED capsule and the counter at 1 (exactly where s9 left them) ──
  CV.v = 1;
  cnum.textContent = "1";
  gsap.set("#three", { opacity: 0 });
  gsap.set("#one", { opacity: 1 });
  var STAMPS = Array.isArray(props.stamps) && props.stamps.length ? props.stamps : ["SAME TEN LETTERS", "SAME WORD", "DIFFERENT INPUT"];
  var host = document.getElementById("stamps");
  STAMPS.forEach(function (t, i) {
    var s = document.createElement("span");
    s.className = "st" + (i === STAMPS.length - 1 ? " gold" : "");
    s.textContent = t;
    host.appendChild(s);
  });
  var stamps = host.querySelectorAll(".st");
  var b = [beatAt(0, 0.0), beatAt(1, 0.29), beatAt(2, 0.46), beatAt(3, 0.67)];
  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.2);
  // one stamp per sentence, on one baseline
  [0, 1, 2].forEach(function (i) {
    tl.fromTo(stamps[i], { opacity: 0, scale: 1.5, y: 10 * U },
      { opacity: 1, scale: 1, y: 0, duration: 0.26, ease: "back.out(2.2)" }, b[i] + 0.05);
  });
  // "Shout it in capitals and it's four."
  tl.to("#one", { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in" }, b[3]);
  tl.to("#four", { opacity: 1, duration: 0.01 }, b[3] + 0.2);
  fourCaps.forEach(function (el, i) {
    tl.fromTo(el, { opacity: 0, y: -34 * U, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2.2)" }, b[3] + 0.22 + i * 0.1);
  });
  tl.to("#cnum", { scale: 0.7, opacity: 0, duration: 0.16, ease: "power2.in" }, b[3] + 0.3);
  counterTo(b[3] + 0.46, Number(props.counterTo || 4), 0.02);
  tl.to("#cnum", { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.4)" }, b[3] + 0.48);
  tl.to("#caption", { opacity: 1, duration: 0.3 }, b[3] + 0.7);
} else if (PHASE === "short") {
  // ── Short s3 ──
  cnum.textContent = props.counterFrom || "3";
  var sb = [beatAt(0, 0.0), beatAt(1, 0.26), beatAt(2, 0.54), beatAt(3, 0.87)];
  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.2);
  threeCaps.forEach(function (el, i) {
    tl.fromTo(el, { scale: 1 }, { scale: 1.07, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut" }, sb[1] + i * 0.2);
  });
  fuse(sb[2], 1);
  resetToThree(sb[2] + 2.6);
  fuse(sb[2] + 2.7, 0.5);
  var sh = Array.isArray(props.stamps) && props.stamps.length ? props.stamps : ["SAME WORD", "DIFFERENT INPUT"];
  var host2 = document.getElementById("stamps");
  sh.forEach(function (t, i) {
    var s = document.createElement("span");
    s.className = "st" + (i === sh.length - 1 ? " gold" : "");
    s.textContent = t; host2.appendChild(s);
  });
  var st2 = host2.querySelectorAll(".st");
  st2.forEach(function (el, i) {
    tl.fromTo(el, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2.2)" }, sb[3] + i * 0.4);
  });
  tl.to("#caption", { opacity: 1, duration: 0.3 }, sb[3] + 0.9);
} else {
  // ── s9: the money beat. Opens on three capsules and the counter at 3. ──
  cnum.textContent = props.counterFrom || "3";
  var p = [beatAt(0, 0.0), beatAt(1, 0.26), beatAt(2, 0.61)];
  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.2);
  // "…arrives as three chunks" — each capsule reports itself, left to right
  threeCaps.forEach(function (el, i) {
    tl.fromTo(el, { scale: 1 }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, p[1] + 0.2 + i * 0.35);
  });
  tl.fromTo("#cnum", { scale: 1 }, { scale: 1.12, duration: 0.24, yoyo: true, repeat: 1, ease: "sine.inOut" }, p[1] + 0.2);
  // the space you'd type without thinking
  fuse(p[2], 1);
  // the double-take: the same move again, faster
  resetToThree(p[2] + 3.0);
  fuse(p[2] + 3.15, 0.5);
  tl.to("#caption", { opacity: 1, duration: 0.32, ease: "power3.out" }, p[2] + 4.3);
}

HF.register("tk-space-flip", tl);
