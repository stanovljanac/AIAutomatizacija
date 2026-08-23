/* at-spotlight-vs-budget — 023 s4.
 *
 * Premise: a spotlight has an OFF and a budget does not, and the only way to say that without
 * hand-waving is to show the same switch being thrown twice — once on a page, where it works and
 * the page goes dark, and once on the bar, where the total simply re-divides and stays full. The
 * scene ends on the object that settles it: the dial for "none of this is relevant" is an empty
 * socket with the screw holes still in it.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "at-spotlight-vs-budget", width: 1920, height: 1080, frames: 409, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 21, bloomX: 50, bloomY: 40 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var L = props.left || {}, R = props.right || {};
document.getElementById("tagL").textContent = L.label || "spotlight";
document.getElementById("claimL").textContent = L.claim || "point it at one thing";
document.getElementById("slblL").textContent = L.off || "everything else: OFF";
document.getElementById("tagR").textContent = R.label || "budget";
document.getElementById("claimR").textContent = R.claim || "hand out the whole total";
document.getElementById("blblR").textContent = R.off || "no 'off' switch";
document.getElementById("dlbl3").textContent = props.dial || "none of this is relevant";
document.getElementById("verdict").textContent = props.verdict || "No 'none of this'.";

/* the page under the beam — real text, and the paragraph the beam finds is a real paragraph */
var PAGE = [
  "Ridgeway Supplies Ltd — account summary, August.",
  "Deliveries ran to schedule through the month with",
  "no short shipments and no open credit notes.",
  "The depot change in June has held; average lead",
  "time is down by a day and a half since then.",
  "",
  "Billing. The vendor code for Ridgeway is RW-88",
  "and it is the code that goes on the August run.",
  "",
  "Contacts remain the accounts desk rather than the",
  "site manager. Purchase orders are raised monthly.",
  "Renewal is automatic unless cancelled in writing",
  "sixty days before the end of the term.",
  "Escalations go to the account lead first.",
  "The next review is booked for October.",
];
var HIT = [6, 7];
var host = document.getElementById("pagelines");
PAGE.forEach(function (ln, i) {
  var el = FX.el("pline" + (HIT.indexOf(i) >= 0 ? " hit" : ""), host);
  el.textContent = ln;
});

/* the same five shares the bar carried out of s2 */
var SHARES = [0.14, 0.21, 0.09, 0.34, 0.22];
var OFFED = [0.19, 0.28, 0.12, 0.41, 0.0];    // switch one off and the rest simply grow — still 1.00
var slicesHost = document.getElementById("slices");
var sliceEls = SHARES.map(function (s) {
  var el = FX.el("slice", slicesHost);
  el.style.width = s * 100 + "%";
  return el;
});

var b0 = beatAt(0, 0.0);                          // "…where the picture everyone carries falls apart."
var b1 = Math.max(beatAt(1, 0.26), b0 + 1.6);     // "A spotlight can be pointed… and switched off…"
var b2 = Math.max(beatAt(2, 0.58), b1 + 2.6);     // "A budget cannot."
var b3 = Math.max(beatAt(3, 0.72), b2 + 1.4);     // "There is no setting for 'none of this is relevant'."

/* both halves are on screen from the start: the comparison is the composition */
gsap.set(["#colL .chead", "#colR .chead"], { opacity: 0, y: FX.px(-12) });
gsap.set("#page", { opacity: 0, y: FX.px(18) });
gsap.set(".barbox", { opacity: 0, y: FX.px(18) });
gsap.set("#switchL", { opacity: 0 });
gsap.set("#panel", { opacity: 0, y: FX.px(22) });
gsap.set("#verdict", { opacity: 0, y: FX.px(16) });
gsap.set("#beam", { opacity: 0, y: FX.px(-140) });
gsap.set("#dark", { opacity: 0 });

tl.to("#colL .chead", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b0);
tl.to("#colR .chead", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b0 + 0.12);
tl.to("#page", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b0 + 0.18);
tl.to(".barbox", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b0 + 0.3);

/* LEFT — the beam is aimed, and the switch WORKS */
FX.fromTo(tl, "#beam", { opacity: 0, y: FX.px(-140) }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, b1);
tl.to("#switchL", { opacity: 1, duration: 0.3 }, b1 + 0.4);
tl.to("#dark", { opacity: 1, duration: 0.45, ease: "power2.inOut" }, b1 + 0.8);
tl.to("#beam", { opacity: 1, duration: 0.2 }, b1 + 0.8);
tl.to("#switchL .sknob", { x: FX.px(14), backgroundColor: "#3ddc97", duration: 0.2, ease: "power3.out" }, b1 + 0.8);

/* RIGHT — reach for the same switch and there is nothing to flick: it re-divides, still full */
sliceEls.forEach(function (el, i) {
  tl.to(el, { width: OFFED[i] * 100 + "%", duration: 0.55, ease: "power2.inOut" }, b2 + 0.15);
});
tl.to("#colR .bedge", { scaleY: 1.35, duration: 0.14, ease: "power4.out" }, b2 + 0.6);
tl.to("#colR .bedge", { scaleY: 1, duration: 0.3, ease: "power2.out" }, b2 + 0.74);
/* and back: the shares keep moving under a total that never does */
sliceEls.forEach(function (el, i) {
  tl.to(el, { width: SHARES[i] * 100 + "%", duration: 0.6, ease: "power2.inOut" }, b2 + 1.5);
});

/* the falsifying object */
tl.to("#panel", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b3);
tl.to("#d1 .dknob", { rotation: 34, duration: 0.4, ease: "power2.out" }, b3 + 0.3);
tl.to("#d2 .dknob", { rotation: -22, duration: 0.4, ease: "power2.out" }, b3 + 0.45);
/* the third one is reached for and is simply not there — the socket rattles, nothing turns */
FX.fromTo(tl, "#d3", { x: 0 }, { x: FX.px(-5), duration: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" }, b3 + 0.75);
tl.to("#verdict", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b3 + 1.0);
FX.camera(tl, { at: b3, scale: 1.025, dur: Math.max(D - b3 - 0.2, 0.8), ease: "sine.out" });

HF.register("at-spotlight-vs-budget", tl);
