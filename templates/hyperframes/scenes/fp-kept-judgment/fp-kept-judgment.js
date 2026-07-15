/* fp-kept-judgment — GSAP timeline for 017 s4 KEPT JUDGMENT. The s3 card docks top as a
 * reference; three gray chips are stamped IGNORED · cosmetic (discrimination made visible) +
 * "alerts sent: 0"; the actions row appears locked/slashed (it refuses to act); the HIGH card
 * slides to the gold YOU node where Approve / Dismiss lights up; quotable stamp holds:
 * "It flags. You decide." Palette shifts blue→black+gold on the handover. Deterministic,
 * seek-driven; flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") return window.__hyperframes.getVariables();
  var out = {};
  try { var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]"); for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default; } catch (e) {}
  if (window.__hfVariables && typeof window.__hfVariables === "object") Object.assign(out, window.__hfVariables);
  return out;
}
var V = readVars();
var fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
var W = Number(V.width) > 0 ? Number(V.width) : 1080;
var H = Number(V.height) > 0 ? Number(V.height) : 1920;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 660;
var D = FRAMES / fps;
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.02, D - 0.4); }
// sentence beats: [0] "this is what makes it an agent, not an alarm" (card docks top)
// [1] "six other times — logo, typo, intro — stayed silent" (chips + IGNORED stamps + 0 alerts)
// [2] "the clause that mattered? won't act on that either" (locked actions row)
// [3] "it doesn't cancel anything" (locks pulse) [4] "flags, explains, hands the call to you" (YOU node + quote)
var tDock = beatAt(0, 0.0);
var tChips = Math.max(beatAt(1, 0.14), tDock + 1.2);
var tLock = Math.max(beatAt(2, 0.58), tChips + 3.0);
var tNoAct = Math.max(beatAt(3, 0.72), tLock + 1.2);
var tHand = Math.max(beatAt(4, 0.80), tNoAct + 1.0);

// ── resting state ──
gsap.set("#refcard", { opacity: 0, y: -40 * U, scale: 1.35, transformOrigin: "50% 0%" });
gsap.set("#six", { opacity: 0, y: 14 * U });
gsap.set(["#c1", "#c2", "#c3"], { opacity: 0, x: -36 * U });
gsap.set(["#st1", "#st2", "#st3"], { opacity: 0, scale: 1.6 });
gsap.set("#zero", { opacity: 0, y: 12 * U });
gsap.set(["#a1", "#a2", "#a3"], { opacity: 0, y: 26 * U });
gsap.set("#youwrap", { opacity: 0, y: 30 * U, xPercent: -50 });
gsap.set(["#approve", "#dismiss"], { opacity: 0, x: 20 * U });
gsap.set("#quote", { opacity: 0, y: 24 * U });
gsap.set("#darken", { opacity: 0 });

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 0.9, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the decision card shrinks to a compact reference at the top ──
tl.to("#refcard", { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, tDock);

// ── beat 1 — six other changes; the agent stamps each IGNORED · cosmetic; 0 alerts ──
tl.to("#six", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tChips);
var chipSpan = cl(tLock - tChips - 1.6, 3.0, 7.5);
["#c1", "#c2", "#c3"].forEach(function (id, i) {
  var at = tChips + 0.5 + i * (chipSpan / 3);
  tl.to(id, { opacity: 1, x: 0, duration: 0.38, ease: "power3.out" }, at);
  // the stamp slams on it (flat, tiny z-rotation on settle)
  tl.to("#st" + (i + 1), { opacity: 1, scale: 1, duration: 0.22, ease: "power4.in" }, at + 0.55);
  tl.fromTo("#st" + (i + 1), { rotation: -2 }, { rotation: 0, duration: 0.25, ease: "back.out(2)" }, at + 0.77);
  // the chip dims once judged — read, then chosen silence
  tl.to(id, { filter: "brightness(0.62)", duration: 0.3 }, at + 0.9);
});
tl.to("#zero", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tChips + 0.5 + chipSpan + 0.25);

// ── beat 2 — the actions it refuses: locked, slashed ──
["#a1", "#a2", "#a3"].forEach(function (id, i) {
  var at = tLock + i * 0.18;
  tl.to(id, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, at);
  tl.to(id + " .slash", { scaleX: 1, duration: 0.3, ease: "power3.inOut" }, at + 0.4);
});

// ── beat 3 — "it doesn't cancel anything": the locks pulse, firmly shut ──
tl.to(".act .lock", { stroke: "#ff5a4d", duration: 0.3, yoyo: true, repeat: 1 }, tNoAct);
tl.to(["#a1", "#a2", "#a3"], { borderColor: "rgba(255,90,77,0.55)", duration: 0.3, yoyo: true, repeat: 1, stagger: 0.08 }, tNoAct);

// ── beat 4 — the handover: palette shifts, the HIGH card slides toward YOU; Approve/Dismiss ──
tl.to("#darken", { opacity: 1, duration: 0.8, ease: "power2.inOut" }, tHand);
// the reference card glides down toward the YOU node (the call is handed over, not taken)
tl.to("#refcard", { y: 0.50 * H, scale: 0.92, duration: 0.7, ease: "power2.inOut" }, tHand + 0.1);
tl.to("#youwrap", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tHand + 0.35);
tl.to("#approve", { opacity: 1, x: 0, duration: 0.35, ease: "back.out(1.8)" }, tHand + 0.75);
tl.to("#dismiss", { opacity: 1, x: 0, duration: 0.35, ease: "back.out(1.8)" }, tHand + 0.9);
// Approve glows — the human's button, lit and waiting
tl.to("#approve", { boxShadow: "0 0 " + (54 * U) + "px rgba(255,176,32,0.7)", duration: 0.9, yoyo: true, repeat: 2, ease: "sine.inOut" }, tHand + 1.2);
// the earlier furniture recedes so the handover reads clean — the actions row fades OUT
// entirely (the refcard travels through its space; reserved-space rule: never land on text)
tl.to("#ignoredwrap", { opacity: 0.22, duration: 0.5 }, tHand + 0.2);
tl.to("#actions", { opacity: 0, duration: 0.4 }, tHand + 0.2);
// the quotable stamp lands and HOLDS
tl.to("#quote", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tHand + 1.1);
tl.to("#quote .q2", { textShadow: "0 0 " + (64 * U) + "px rgba(255,176,32,0.75)", duration: 1.0, yoyo: true, repeat: 2, ease: "sine.inOut" }, tHand + 1.6);
// slow push-in through the hold
tl.to("#camera", { scale: 1.04, duration: cl(D - tHand, 2, 5), ease: "power1.inOut", transformOrigin: "50% 60%" }, tHand);

window.__timelines["fp-kept-judgment"] = tl;
