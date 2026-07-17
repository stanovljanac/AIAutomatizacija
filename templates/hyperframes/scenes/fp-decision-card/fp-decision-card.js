/* fp-decision-card — GSAP timeline for 017 s3 THE MONEY SHOT. The agent pulls the ToS page in;
 * ONE gold scan passes and the page dims; the clause ignites; then the DECISION CARD assembles
 * top→bottom (chip → OLD strike → NEW gold → diff link + −53% delta → VERDICT bar) and the
 * COMPLETE card holds ≥4s with a slow pulse (pause-and-screenshot). Deterministic, seek-driven;
 * flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "fp-decision-card", width: 1080, height: 1920, frames: 588, beatLo: 0.02, beatHi: 0.4 });
var fps = S.fps, H = S.H, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "I gave the agent one job: judge them" (agent + page pulled in)
// [1] "reads what changed and asks: does this matter?" (the single gold scan; page dims)
// [2] "one clause lit up" (the clause ignites → card chip) [3] "refund window: 30 — now 14"
// (OLD strike + NEW row + diff/delta) [4] "verdict: impact high…" (VERDICT bar; hold ≥4s)
var tJob = beatAt(0, 0.0);
var tScan = Math.max(beatAt(1, 0.23), tJob + 1.6);
var tClause = Math.max(beatAt(2, 0.48), tScan + 1.6);
var tRows = Math.max(beatAt(3, 0.56), tClause + 1.0);
var tVerdict = Math.max(beatAt(4, 0.76), tRows + 2.2);

// ── resting state ──
gsap.set("#agent", { opacity: 0, y: -30 * U });
gsap.set("#ajob", { opacity: 0, y: 12 * U });
gsap.set("#doc", { opacity: 0, y: -60 * U, scale: 0.94, transformOrigin: "50% 0%" });
gsap.set("#scanline", { opacity: 0, y: 0 });
gsap.set("#dcard", { opacity: 0, y: 60 * U, scale: 0.96 });
gsap.set("#chip", { opacity: 0, y: 16 * U });
gsap.set("#oldrow", { opacity: 0, x: -30 * U });
gsap.set("#newrow", { opacity: 0, x: 30 * U });
gsap.set("#strike", { scaleX: 0 });
gsap.set("#delta", { opacity: 0, scale: 1.7 });
gsap.set("#verdict", { opacity: 0, y: 20 * U });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the agent takes the job; the SAME page is pulled in under it ──
tl.to("#agent", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tJob);
tl.to("#ajob", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tJob + 0.35);
tl.to("#doc", { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, tJob + 0.5);
// the iris focuses (reads, doesn't just watch)
tl.to(".a-iris", { attr: { r: 14 }, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, tJob + 0.7);

// ── beat 1 — ONE gold scan pass; the page dims (most of it doesn't matter) ──
var docH = 0.30 * H; // approximate doc height for the sweep travel
tl.fromTo("#scanline", { y: -90 * U, opacity: 1 }, { y: docH, duration: 1.5, ease: "power1.inOut" }, tScan);
tl.to("#scanline", { opacity: 0, duration: 0.25 }, tScan + 1.5);
tl.to("#doc", { filter: "brightness(0.55)", duration: 0.6, ease: "power2.out" }, tScan + 1.4);

// ── beat 2 — ONE clause ignites; the decision card takes the stage ──
tl.to("#clause", { backgroundColor: "#b98a1e", boxShadow: "0 0 " + (34 * U) + "px rgba(255,176,32,0.8)", duration: 0.35, ease: "power2.out" }, tClause);
tl.to("#clause", { boxShadow: "0 0 " + (14 * U) + "px rgba(255,176,32,0.4)", duration: 0.5, ease: "sine.inOut" }, tClause + 0.4);
// the page recedes upward; the card assembles centered (the doc hands off to the card)
tl.to("#doc", { y: -0.06 * H, scale: 0.9, opacity: 0.28, duration: 0.55, ease: "power2.inOut" }, tClause + 0.55);
tl.to("#agent", { scale: 0.82, y: -12 * U, transformOrigin: "50% 0%", duration: 0.55, ease: "power2.inOut" }, tClause + 0.55);
tl.to("#dcard", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, tClause + 0.7);
// (1) the chip
tl.to("#chip", { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, tClause + 0.95);

// ── beat 3 — OLD strike → NEW slides in → gold diff link + −53% delta ──
tl.to("#oldrow", { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, tRows);
tl.to("#strike", { scaleX: 1, duration: 0.3, ease: "power3.inOut" }, tRows + 0.45);
tl.to("#oldrow", { opacity: 0.75, duration: 0.3 }, tRows + 0.75);
tl.to("#newrow", { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, tRows + 0.8);
// the number pops gold as it lands
tl.fromTo("#newnum", { scale: 1.35, color: "#ffffff" }, { scale: 1, color: "#ffb020", duration: 0.4, ease: "back.out(2)" }, tRows + 1.0);
// the diff path draws 30 → 14
tl.to("#diffpath", { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut" }, tRows + 1.3);
// the −53% delta snaps in
tl.to("#delta", { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.4)" }, tRows + 1.75);

// ── beat 4 — the VERDICT bar illuminates LAST; the complete card HOLDS ≥4s ──
tl.to("#verdict", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tVerdict);
tl.to("#verdict", { borderColor: "rgba(255,176,32,0.7)", duration: 0.4 }, tVerdict + 0.4);
// HIGH pulses gold-red while the card holds (screenshot beat)
tl.to("#vhigh", { textShadow: "0 0 " + (44 * U) + "px rgba(255,90,77,0.9)", duration: 0.9, yoyo: true, repeat: 3, ease: "sine.inOut" }, tVerdict + 0.6);
tl.to("#dcard", { boxShadow: "0 0 " + (100 * U) + "px rgba(255,176,32,0.32), 0 " + (24 * U) + "px " + (60 * U) + "px rgba(0,0,0,0.6)", duration: 1.2, yoyo: true, repeat: 2, ease: "sine.inOut" }, tVerdict + 0.5);
// a slow push-in while it holds
tl.to("#camera", { scale: 1.045, duration: cl(D - tVerdict, 2.5, 5), ease: "power1.inOut", transformOrigin: "50% 45%" }, tVerdict);

HF.register("fp-decision-card", tl);
