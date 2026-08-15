/* tk-slice-and-turn — GSAP timeline for 021 s2 (phase 1) and s3 (phase 2). One file so the citation
 * plate and the capsule row survive the boundary at the SAME size and position (the author's half of
 * a `carry`). Phase 1 concedes the rule of thumb; phase 2 replaces the wrong model with the right one
 * in the exact spot the wrong one occupied.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-slice-and-turn", width: 1920, height: 1080, frames: 465, beatLo: 0.0, beatHi: 0.25 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var CHUNKS = Array.isArray(props.chunks) && props.chunks.length ? props.chunks : ["Before", " a", " model", " reads"];

/** Fill a .line element with one capsule per chunk (a leading space is rendered as a thin gap). */
function fill(el, chunks) {
  chunks.forEach(function (c) {
    var s = document.createElement("span");
    s.className = "cap";
    s.textContent = c;
    el.appendChild(s);
  });
  return el.querySelectorAll(".cap");
}

document.getElementById("motif").textContent = props.motif || "Here's what's actually happening.";
document.getElementById("rule").textContent = props.rule || "1 token ≈ 4 characters ≈ ¾ of a word";
document.getElementById("chip").textContent = props.sourceChip || "OpenAI API docs";
document.getElementById("ghost").textContent = props.ghost || "token = small word";
document.getElementById("rightlabel").textContent = props.right || "A learned chunk.";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

if (PHASE === 1) {
  // ── s2: the line, the cut, the sourced rule, the green tick ──
  var caps = fill(document.getElementById("line"), CHUNKS);
  // sentence beats: [0] "Here's what's actually happening." [1] "…cut into pieces called tokens."
  // [2] "The official rule of thumb…" [3] "That's accurate."
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.11), t0 + 0.9);
  var t2 = Math.max(beatAt(2, 0.49), t1 + 3.0);
  var t3 = Math.max(beatAt(3, 0.95), t2 + 2.2);

  // OPENING FRAME already shows the typed line (a cut has no runway — D-060)
  gsap.set("#linewrap", { opacity: 1, y: 0 });
  gsap.set(caps, { opacity: 1, x: 0 });
  gsap.set("#motif", { opacity: 0, y: -14 * U });
  gsap.set("#plate", { opacity: 0, y: 60 * U, scale: 0.96 });
  gsap.set("#chip", { opacity: 0 });
  gsap.set("#tick", { opacity: 0, scale: 2.2 });
  gsap.set(["#ghostwrap", "#rightwrap", "#rightlabel"], { opacity: 0 });

  tl.to("#motif", { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, t0 + 0.1);

  // the cut: the line becomes capsules — boundaries first, then the pieces separate.
  // (Property tweens only: the capture engine seeks, so a `tl.add(callback)` may never fire.)
  tl.to(caps, {
    backgroundColor: "#17273a", borderColor: "rgba(255,176,32,0.45)", color: "#ffd37a",
    duration: 0.22, stagger: 0.055, ease: "power2.out",
  }, t1 + 1.35);
  caps.forEach(function (el, i) {
    tl.fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" }, t1 + 1.35 + i * 0.055);
  });
  tl.to("#line", { gap: 18 * U + "px", duration: 0.5, ease: "power3.out" }, t1 + 1.4);

  // the rule of thumb — quoted and SOURCED, and left standing
  tl.to("#plate", { opacity: 1, y: 0, scale: 1, duration: 0.44, ease: "power3.out" }, t2);
  tl.to("#chip", { opacity: 1, duration: 0.3, ease: "power2.out" }, t2 + 0.5);
  // "That's accurate." — a green tick, deliberately NO strike-through
  tl.to("#tick", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, t3);
  tl.to("#plate", { boxShadow: "0 " + 22 * U + "px " + 60 * U + "px rgba(61,220,151,0.18)", duration: 0.5 }, t3);
} else {
  // ── s3: the turn. Opens on s2's plate, already in place. ──
  var caps2 = fill(document.getElementById("rightline"), Array.isArray(props.chunks) ? props.chunks : ["Not", " a", " small", " word"]);
  // sentence beats: [0] "…it makes a token sound like a small word." [1] "It isn't a word."
  // [2] "It's a chunk the model learned…"
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.51), u0 + 3.0);
  var u2 = Math.max(beatAt(2, 0.6), u1 + 0.8);

  gsap.set("#motif", { opacity: 0 });
  gsap.set("#linewrap", { opacity: 0 });
  gsap.set("#plate", { opacity: 1, y: 0, scale: 1 });
  gsap.set("#chip", { opacity: 1 });
  gsap.set("#tick", { opacity: 1, scale: 1 });
  gsap.set("#ghost", { opacity: 0, y: 26 * U });
  gsap.set("#slash", { scaleX: 0 });
  gsap.set("#rightwrap", { opacity: 0 });
  gsap.set(caps2, { opacity: 0, scale: 0.7 });
  gsap.set("#rightlabel", { opacity: 0, y: 20 * U });

  // the plate lifts to the top and shrinks — still the same object, out of the way of the turn
  tl.to("#plate", { top: "13%", scale: 0.72, duration: 0.6, ease: "power3.inOut" }, u0 + 0.5);
  // the WRONG model takes the centre
  tl.to("#ghost", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, u0 + 1.1);

  // "It isn't a word." — the slash, hard and fast
  tl.to("#slash", { scaleX: 1, duration: 0.2, ease: "power4.out" }, u1);
  tl.to("#ghost", { opacity: 0.28, duration: 0.3, ease: "sine.out" }, u1 + 0.14);

  // the RIGHT model lands in the same position, in gold
  tl.to(["#ghostwrap"], { opacity: 0, duration: 0.3, ease: "power2.in" }, u2 + 0.35);
  tl.to("#rightwrap", { opacity: 1, duration: 0.01 }, u2 + 0.4);
  caps2.forEach(function (el, i) {
    tl.to(el, { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, u2 + 0.45 + i * 0.09);
  });
  tl.to("#rightlabel", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, u2 + 0.95);
  // hold the gold capsules ≥2s, then leave ONE centred for the match cut into s4
  var out = Math.max(u2 + 3.1, D - 1.25);
  caps2.forEach(function (el, i) {
    if (i === caps2.length - 1) return;
    tl.to(el, { opacity: 0, scale: 0.8, duration: 0.3, ease: "power2.in" }, out + i * 0.05);
  });
  tl.to("#rightlabel", { opacity: 0, duration: 0.3 }, out);
  tl.to("#plate", { opacity: 0.25, duration: 0.4 }, out);
  tl.to(caps2[caps2.length - 1], { scale: 1.35, duration: 0.5, ease: "power3.out" }, out + 0.2);
}

HF.register("tk-slice-and-turn", tl);
