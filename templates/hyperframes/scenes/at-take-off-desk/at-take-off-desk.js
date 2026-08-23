/* at-take-off-desk — 023 s21. You cannot aim a fixed total by asking it nicely.
 *
 * Premise: the method has to be DERIVED on screen, not asserted. So the viewer's move is tried
 * first and fails with numbers — "IMPORTANT:" adds one more claimant and the answer's slice gets
 * SMALLER — and only then is the other move made: pages come off the desk, and the same slice grows
 * every time one leaves.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-take-off-desk", width: 1920, height: 1080, frames: 407, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 109, bloomX: 50, bloomY: 46 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("kickertext").textContent = props.title || "Delete. Don't emphasize.";
document.getElementById("trytext").textContent = props.failed || "IMPORTANT: focus on this";
document.getElementById("tryres").textContent = "→ one more claimant";

/* what is on the desk: four pages you did not need, and the one that holds the answer */
var PAGES = [
  { t: "the onboarding brief", l: ["Ridgeway was onboarded in March.", "Contact is the accounts desk.", "Terms agreed by email.", "POs raised monthly.", "Site visits booked a week ahead.", "Escalations go to the account lead."] },
  { t: "the contract", l: ["§4 net thirty from the invoice date.", "§9 renewal is automatic.", "§11 disputed lines are held.", "§14 notices go by email.", "§16 rates fixed for the term.", "§21 assignment barred."] },
  { t: "last quarter's notes", l: ["Q2 volumes held steady.", "Two credit notes, both resolved.", "No open disputes.", "Lead time down a day and a half.", "Depot change has held.", "Review booked for October."] },
  { t: "the policy PDF", l: ["Expenses are filed monthly.", "Receipts over the threshold need", "a manager's approval.", "Mileage is claimed per journey.", "Travel is booked centrally.", "Queries to the finance inbox."] },
  { t: "the vendor sheet", l: ["Ridgeway Supplies Ltd", "vendor code RW-88", "invoice run: August", "status: active", "terms: net 30", "duplicate check: clean"], keep: true },
];
var deskHost = document.getElementById("deskrow");
var pageEls = PAGES.map(function (p, i) {
  var el = FX.el("pg" + (p.keep ? " keep" : ""), deskHost);
  var shout = FX.el("pgshout", el);
  shout.textContent = "IMPORTANT: FOCUS ON THIS";
  var t = FX.el("pgt", el);
  t.textContent = p.t;
  p.l.forEach(function (line) {
    var x = FX.el("pgl", el);
    x.textContent = line;
  });
  return el;
});

/* the bar: four competitors plus the answer, and then the version where the shout is one more */
var slicesHost = document.getElementById("slices");
var SHARES = [0.22, 0.19, 0.16, 0.18, 0.10, 0.15];   // 4 pages + the answer + the wrapping
var LABELS = ["brief", "contract", "notes", "policy", "answer", "wrapping"];
var sliceEls = SHARES.map(function (s, i) {
  var el = FX.el("sl" + (i === 4 ? " ans" : ""), slicesHost);
  el.style.width = s * 100 + "%";
  return el;
});
/* the shout is a real slice, inserted before the answer */
var shoutEl = FX.el("sl shout", slicesHost);
shoutEl.style.width = "0%";
slicesHost.insertBefore(shoutEl, sliceEls[4]);

var bval = document.getElementById("bval");

var b0 = beatAt(0, 0.0);                          // "So what do you actually do with this?"
var b1 = Math.max(beatAt(1, 0.16), b0 + 1.4);     // "The move is the opposite of what everyone does…"
var b2 = Math.max(beatAt(2, 0.40), b1 + 2.6);     // "You cannot aim a fixed total by asking it nicely."
var b3 = Math.max(beatAt(3, 0.66), b2 + 2.6);     // "You aim it by taking things off the desk."

gsap.set(pageEls, { opacity: 0, y: FX.px(18) });
gsap.set("#tryline", { opacity: 0 });
gsap.set("#kicker", { opacity: 0, y: FX.px(20) });
gsap.set(".pgshout", { opacity: 0 });

pageEls.forEach(function (el, i) {
  FX.fromTo(tl, el, { opacity: 0, y: FX.px(18) }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, b0 + 0.1 + i * 0.1);
});

/* the usual move, tried honestly — and it makes the answer's slice SMALLER */
tl.to("#tryline", { opacity: 1, duration: 0.3 }, b2 - 0.6);
tl.to(".pgshout", { opacity: 1, duration: 0.25, stagger: 0.04 }, b2 - 0.3);
tl.to(pageEls, { boxShadow: "0 0 0 " + FX.px(3) + " rgba(169,47,47,0.7)", duration: 0.3, stagger: 0.04 }, b2 - 0.3);
tl.to(shoutEl, { width: "9%", duration: 0.45, ease: "power3.out" }, b2);
sliceEls.forEach(function (el, i) {
  tl.to(el, { width: SHARES[i] * 0.91 * 100 + "%", duration: 0.45, ease: "power3.out" }, b2);
});
FX.count(tl, bval, { from: 10.0, to: 9.1, at: b2, dur: 0.45, fmt: function (v) { return v.toFixed(1) + "%"; } });
tl.to("#tryres", { opacity: 1, duration: 0.24 }, b2 + 0.4);

/* the other move: pages come OFF the desk, and the same slice grows every time one leaves */
var drop = [3, 0, 2, 1];                            // the policy PDF first, the vendor sheet never
var grown = [10.0, 12.4, 16.8, 24.5, 38.0];
drop.forEach(function (idx, k) {
  var at = b3 + 0.25 + k * 0.55;
  tl.to(pageEls[idx], { y: FX.px(420), opacity: 0, duration: 0.4, ease: "power2.in" }, at);
  tl.to(sliceEls[idx], { width: "0%", duration: 0.4, ease: "power2.inOut" }, at + 0.05);
  tl.to(shoutEl, { width: "0%", duration: 0.4, ease: "power2.inOut" }, at + 0.05);
  tl.to(sliceEls[4], { width: grown[k + 1] + "%", duration: 0.4, ease: "power3.out" }, at + 0.05);
  FX.count(tl, bval, { from: grown[k], to: grown[k + 1], at: at + 0.05, dur: 0.4, fmt: function (v) { return v.toFixed(1) + "%"; } });
});
tl.to("#tryline", { opacity: 0.3, duration: 0.3 }, b3 + 0.2);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b3 + 0.4);
FX.camera(tl, { at: b3, scale: 1.02, dur: Math.max(D - b3 - 0.2, 0.6), ease: "sine.out" });

HF.register("at-take-off-desk", tl);
