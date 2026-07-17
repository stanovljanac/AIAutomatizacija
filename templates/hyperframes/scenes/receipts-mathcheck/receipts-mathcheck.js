/* receipts-mathcheck — GSAP timeline for 008 s07 ("It checks its own math"). One file, 16:9 + 9:16.
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{kicker,title,subtitle}
 *
 * Duration derivation (load-bearing, identical to receipts-hook / bad-row-gate):
 *   data-duration = (durationFrames - 0.5) / fps   => ceils to EXACTLY durationFrames.
 *
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Key moments map to
 * revealsSeconds (sentence-start beats) when present, else fractions of D. The five beats:
 *   0 title    1 Printed total (the naive copy)    2 re-add subtotal+tax → Expected AGREES (green)
 *   3 flagged strip (Marlow ??.?? → REVIEW, gold)  4 the two "automated" badges
 */

var S = HF.scene({ id: "receipts-mathcheck", width: 1920, height: 1080, frames: 540 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl;

// exact duration + geometry before the capture engine reads it

// fill text from props (optional)
function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker-text", props.kicker);
setText("subtitle", props.subtitle);
// re-split the title into word spans if a custom title is supplied (DOM nodes, not innerHTML —
// title text is ours, but textContent keeps it injection-safe and lint-clean)
if (typeof props.title === "string" && props.title.trim()) {
  var tEl = document.getElementById("title-text");
  if (tEl) {
    tEl.textContent = "";
    var parts = props.title.trim().split(/\s+/);
    parts.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      tEl.appendChild(span);
      if (i < parts.length - 1) tEl.appendChild(document.createTextNode(" "));
    });
  }
}

// ── beat timing ──
function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.1, D - 0.4);
}
var tTitle = beatAt(0, 0.03);
var tPrinted = Math.max(beatAt(1, 0.18), tTitle + 0.5);
var tMath = Math.max(beatAt(2, 0.40), tPrinted + 0.6);
var tFlag = Math.max(beatAt(3, 0.70), tMath + 1.1);
var tBadge = Math.max(beatAt(4, 0.88), tFlag + 0.7);

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#subtitle", { opacity: 0, y: 16 * U });
gsap.set("#glow", { scale: 0.9, opacity: 0.7 });
gsap.set("#checker", { opacity: 0, y: 26 * U, scale: 0.985, transformOrigin: "50% 38%" });
gsap.set("#r-printed", { opacity: 0, y: 14 * U });
gsap.set("#recheck", { opacity: 0, y: 10 * U });
gsap.set(["#r-sub", "#r-tax", "#r-exp"], { opacity: 0, x: 20 * U });
gsap.set("#calc-rule", { scaleX: 0 });
gsap.set("#pill-ok", { opacity: 0, scale: 0.6 });
gsap.set("#flagstrip", { opacity: 0, y: 18 * U, scale: 0.98 });
gsap.set("#pill-review", { opacity: 0, scale: 0.6, rotate: -5 });
gsap.set(["#badge-type", "#badge-check"], { opacity: 0, y: 14 * U });

// ── timeline (paused; the renderer seeks it) ──
var tl = gsap.timeline({ paused: true });

// ambient: slow glow breathe across the whole clip (deterministic)
tl.to("#glow", { scale: 1.06, opacity: 0.95, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tTitle);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tTitle + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.07 }, tTitle + 0.05);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.4);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tTitle + 0.55);

// the card frame arrives
tl.to("#checker", { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tTitle + 0.25);

// beat 1 — the Printed total appears alone (the "just copy it down")
tl.to("#r-printed", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tPrinted);

// beat 2 — re-add subtotal + tax, draw the rule, land Expected, then the green AGREES pill
tl.to("#recheck", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tMath);
tl.to(["#r-sub", "#r-tax"], { opacity: 1, x: 0, duration: 0.45, ease: "power3.out", stagger: 0.14 }, tMath + 0.15);
tl.to("#calc-rule", { scaleX: 1, duration: 0.4, ease: "power2.out" }, tMath + 0.5);
tl.to("#r-exp", { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, tMath + 0.62);
tl.to("#pill-ok", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, tMath + 0.95);
// the matching totals pulse green together (Expected ↔ Printed agree)
tl.fromTo(["#r-exp .val", "#r-printed .val"],
  { color: "#eaf1fb" }, { color: "#34d39a", duration: 0.4, ease: "power2.out" }, tMath + 0.95);

// beat 3 — the flagged branch: Marlow's total can't be read → gold REVIEW, the strip glows
tl.to("#flagstrip", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, tFlag);
tl.fromTo("#flagstrip",
  { boxShadow: "0 0 0 0 rgba(255,176,32,0)" },
  { boxShadow: "0 0 0 " + (2 * U) + "px rgba(255,176,32,0.55), 0 " + (12 * U) + "px " + (38 * U) + "px rgba(255,176,32,0.16)", duration: 0.5, ease: "power2.out" },
  tFlag + 0.05);
tl.to("#pill-review", { opacity: 1, scale: 1, rotate: -2, duration: 0.45, ease: "back.out(2.4)" }, tFlag + 0.12);

// beat 4 — the takeaway: typing AND checking are both automated
tl.to(["#badge-type", "#badge-check"], { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.12 }, tBadge);

// NO exit animation — the master timeline owns the cut; last frame stays composed.
HF.register("receipts-mathcheck", tl);
