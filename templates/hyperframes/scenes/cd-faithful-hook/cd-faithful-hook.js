/* cd-faithful-hook — GSAP timeline for 020 s1 (HOOK HERO). The hype feed scrolls and FREEZES as the
 * thesis stamp slams; the stamp cracks and a messy row falls through; a dashboard snaps together, the
 * TOTAL counts to $41,000, a green check pops — then everything holds dead still while a red pulse
 * bleeds out from under the check. Deterministic, seek-driven; flat, face-on (the crack is transient).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cd-faithful-hook", width: 1080, height: 1920, frames: 347, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

// sentence beats: [0] "The AI didn't make the mistake." (feed freeze + stamp slam)
// [1] "My spreadsheet did." (crack + culprit row)  [2] "I had it build a sales dashboard. It worked
// first try." (dashboard snaps + bars)  [3] "Total: forty-one thousand dollars." (total counts up)
// [4] "Green check. Wrong." (check pops, dead still, red pulse)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.19), t0 + 1.5);
var t2 = Math.max(beatAt(2, 0.31), t1 + 1.0);
var t3 = Math.max(beatAt(3, 0.62), t2 + 2.4);
var t4 = Math.max(beatAt(4, 0.82), t3 + 1.6);

var TOTAL = props.total || "$41,000";
var TOTAL_N = Number(String(TOTAL).replace(/[^0-9.]/g, "")) || 41000;
function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

// bar heights — synthetic, deterministic, and deliberately "healthy looking"
var BARS = [0.42, 0.61, 0.5, 0.78, 0.66, 0.92];

// ── resting state ──
gsap.set("#feedtrack", { y: 0 });
gsap.set("#freeze", { opacity: 0 });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#shardA", { y: 0, rotationX: 0, opacity: 1 });
gsap.set("#shardB", { y: 0, rotationX: 0, opacity: 1 });
gsap.set("#culprit", { opacity: 0, y: -120 * U, scale: 0.9 });
gsap.set("#culpritlabel", { opacity: 0, y: 30 * U });
gsap.set("#dash", { opacity: 0, y: 60 * U, scale: 0.94 });
gsap.set(".bar", { scaleY: 0 });
gsap.set("#check", { opacity: 0, scale: 0.4 });
gsap.set("#ring", { opacity: 0, scale: 1 });
gsap.set("#verdict", { opacity: 0, scale: 1.4 });
gsap.set(".totalrow", { opacity: 0 });
document.getElementById("tval").textContent = "$0";

var tl = gsap.timeline({ paused: true });

// ambient glow breathe (the only always-on motion)
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the hype feed rushes past, then FREEZES and the stamp slams ──
// it scrolls hard for the first ~0.9s: hype is context, and it must feel like a feed, not a list
tl.fromTo("#feedtrack", { y: 0 }, { y: -640 * U, duration: 0.9, ease: "power2.out" }, 0);
tl.to("#freeze", { opacity: 1, duration: 0.16, ease: "power2.out" }, t0 + 0.62);
tl.to("#feedtrack", { filter: "blur(" + 3 * U + "px)", duration: 0.2 }, t0 + 0.62);
// the stamp SLAMS across the frozen feed — oversize → 1, hard settle
tl.fromTo("#stamp", { opacity: 0, scale: 1.55, rotation: -3 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.34, ease: "back.out(1.6)" }, t0 + 0.66);
tl.to("#stamp", { scale: 1.03, duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, t0 + 1.02);

// ── beat 1 — the stamp CRACKS; the messy row drops through the shards ──
tl.to("#shardA", { y: -26 * U, rotationX: 8, duration: 0.3, ease: "power3.out" }, t1);
tl.to("#shardB", { y: 30 * U, rotationX: -8, duration: 0.3, ease: "power3.out" }, t1);
tl.to("#culprit", { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }, t1 + 0.12);
tl.to("#culpritlabel", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t1 + 0.3);
// the culprit row shivers once — it is the guilty party
tl.to("#culprit", { rotation: -1.2, duration: 0.1, yoyo: true, repeat: 3, ease: "sine.inOut" }, t1 + 0.5);

// ── beat 2 — clear the crime scene; the dashboard SNAPS together in one gold gesture ──
tl.to(["#stamp", "#culprit", "#culpritlabel", "#feed"], { opacity: 0, duration: 0.28, ease: "power2.in" }, t2 - 0.1);
tl.to("#dash", { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.4)" }, t2);
// the bars animate up, fast and satisfying — this is the "it worked first try" feeling
BARS.forEach(function (h, i) {
  tl.to("#b" + (i + 1), { scaleY: h, duration: 0.5, ease: "power3.out" }, t2 + 0.34 + i * 0.075);
});

// ── beat 3 — the TOTAL row arrives and counts up to $41,000 ──
tl.to(".totalrow", { opacity: 1, duration: 0.24, ease: "power2.out" }, t3 - 0.12);
var c = { v: 0 };
tl.to(c, {
  v: TOTAL_N, duration: 1.15, ease: "power2.out",
  onUpdate: function () { document.getElementById("tval").textContent = money(c.v); },
}, t3);
tl.fromTo("#tval", { scale: 0.94 }, { scale: 1, duration: 1.15, ease: "power2.out" }, t3);

// ── beat 4 — the green check pops, everything holds DEAD STILL, the red pulse bleeds under it ──
tl.to("#check", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2.4)" }, t4);
// hold: no other element moves for ~0.8s. Then the verdict lands.
tl.fromTo("#verdict", { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" }, t4 + 0.72);
// the red pulse — from UNDER the check, twice, unhurried. The check never turns red: that is the point.
tl.fromTo("#ring", { opacity: 0.95, scale: 1 }, { opacity: 0, scale: 2.1, duration: 1.05, ease: "power2.out" }, t4 + 0.66);
tl.fromTo("#ring", { opacity: 0.8, scale: 1 }, { opacity: 0, scale: 2.1, duration: 1.05, ease: "power2.out" }, t4 + 1.12);
tl.to("#dash", { boxShadow: "0 " + 26 * U + "px " + 70 * U + "px rgba(255,90,77,0.35)", duration: 0.5, ease: "sine.out" }, t4 + 0.7);

HF.register("cd-faithful-hook", tl);
