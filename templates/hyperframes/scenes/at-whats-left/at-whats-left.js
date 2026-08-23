/* at-whats-left — 023 s12. Seven seconds, and not one of them a title card.
 *
 * Premise: a quarter of the total is already gone to a word that means nothing, and the question is
 * what the rest of the window has to share. The fence lands first, the claimants stack up under the
 * remainder, and the camera pushes INTO the remainder while the question is asked inside it.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-whats-left", width: 1920, height: 1080, frames: 230, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 16, seed: 63, bloomX: 62, bloomY: 30 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var spentLbl = document.getElementById("spentlbl");
var spentPct = FX.el("spentpct", spentLbl, "span");
spentPct.textContent = props.sinkShare || "25.8%";
var spentWhat = FX.el("spentwhat", spentLbl, "span");
spentWhat.textContent = "one meaningless word";
document.getElementById("leftlbl").textContent = props.remainder || "everything you actually wrote";
document.getElementById("question").textContent = props.question || "So what's left for your actual point?";

/* what is queuing for the rest of the bar — real pages, not placeholders */
var CLAIMS = [
  { t: "your brief", l: ["Ridgeway was onboarded in March.", "Contact is the accounts desk.", "Terms were agreed by email.", "POs are raised monthly.", "Site visits are booked a week ahead."] },
  { t: "the contract", l: ["§4 net thirty from the invoice date.", "§9 renewal is automatic.", "§11 disputed lines are held.", "§14 notices go by email.", "§16 rates fixed for the term."] },
  { t: "last quarter's notes", l: ["Q2 volumes held steady.", "Two credit notes, both resolved.", "No open disputes.", "Lead time down a day and a half.", "Review booked for October."] },
  { t: "the vendor sheet", l: ["Ridgeway Supplies Ltd", "vendor code RW-88", "invoice run: August", "status: active", "duplicate check: clean"] },
  { t: "your question", l: ["Which vendor code goes on the", "August invoice for Ridgeway?", "", "Answer with the code only."] },
];
var host = document.getElementById("claimants");
var clEls = CLAIMS.map(function (c) {
  var el = FX.el("cl", host);
  var t = FX.el("clt", el);
  t.textContent = c.t;
  c.l.forEach(function (line) {
    var p = FX.el("cll", el);
    p.textContent = line;
  });
  return el;
});

var b0 = beatAt(0, 0.0);                         // "Which raises the obvious question."
var b1 = Math.max(beatAt(1, 0.28), b0 + 1.4);    // "If a word that means nothing is holding a quarter…"

/* the opening frame already shows the fenced bar — a cut lands ON it (D-060) */
gsap.set("#spent", { opacity: 1 });
gsap.set(clEls, { opacity: 0, y: FX.px(20) });
gsap.set("#question", { opacity: 0, y: FX.px(16) });

clEls.forEach(function (el, i) {
  FX.fromTo(tl, el, { opacity: 0, y: FX.px(20) }, { opacity: 1, y: 0, duration: 0.26, ease: "power3.out" }, b0 + 0.1 + i * 0.12);
});
/* the fence tightens: the spent quarter widens a hair and the remainder visibly loses ground */
FX.fromTo(tl, "#spent", { width: "22%" }, { width: "25.8%", duration: 0.5, ease: "power2.out" }, b0 + 0.2);
tl.to("#question", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b1);
/* the push is INTO the remainder, not a general zoom */
FX.camera(tl, { at: b1 - 0.2, scale: 1.09, x: -70, y: 40, dur: Math.max(D - b1, 1.0), ease: "sine.inOut" });

HF.register("at-whats-left", tl);
