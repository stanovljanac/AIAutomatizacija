/* fp-flip-close — GSAP timeline for 017 s5 TAKEAWAY MONOLITH. "SCRAPER — everything changed."
 * assembles gray, 3D Y-flips (approved transient reveal — nothing rests tilted) to "AGENT —
 * here's what to do — and it waits for your yes." held with a slow gold pulse; then the closing
 * question + blinking caret; then the n8n-style bridge (BUILD IT →) and the brand row + series
 * tagline rise in RESERVED space. Deterministic, seek-driven. Adapts the wh-hour-flip rig.
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 579;
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
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.05, D - 0.5); }
// sentence beats: [0] "a scraper tells you everything changed; an agent tells you what to do —
// and waits for your yes" (assemble + FLIP mid-sentence) [1] "point it at the fine print…"
// (examples VOICE-ONLY — the monolith holds, slow push) [2] "what would you have it watch
// first?" (question + caret) [3] "follow, and I'll show you the version you can build" (bridge + brand)
var tA = beatAt(0, 0.0);
var tHold = Math.max(beatAt(1, 0.35), tA + 3.4);
var tQ = Math.max(beatAt(2, 0.75), tHold + 1.5);
var tFollow = Math.max(beatAt(3, 0.87), tQ + 1.2);
// the flip fires mid-sentence-0, on "; an agent tells you…" (~52% through the first sentence)
var tFlip = tA + cl((tHold - tA) * 0.52, 1.6, 4.5);

// ── resting state ──
gsap.set("#faceA", { opacity: 0, y: 34 * U, scale: 0.94 });
gsap.set("#question", { opacity: 0, y: 22 * U });
gsap.set("#bridge", { opacity: 0, y: 26 * U, xPercent: -50 });
gsap.set("#brandrow", { opacity: 0, y: 36 * U, xPercent: -50 });
gsap.set("#aurora", { opacity: 0.7, scale: 0.94 });

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// ambient aurora breathe
tl.to("#aurora", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0a — the SCRAPER face assembles in gray ──
tl.to("#faceA", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, tA + 0.1);

// ── beat 0b — the 3D Y-FLIP to the AGENT face (transient reveal; rig ends flat) ──
tl.to("#fliprig", { rotationY: 180, duration: 0.85, ease: "power3.inOut" }, tFlip);
tl.to("#camera", { scale: 1.03, duration: 0.85, ease: "power2.inOut" }, tFlip);
// guarantee the A face is gone once the rig passes 90°
tl.to("#faceA", { opacity: 0, duration: 0.16 }, tFlip + 0.42);
// the AGENT face holds ≥4s with a slow gold pulse (pause-and-screenshot beat)
tl.to(".faceB .gold", { textShadow: "0 0 " + (76 * U) + "px rgba(255,176,32,0.8)", duration: 1.1, yoyo: true, repeat: 5, ease: "sine.inOut" }, tFlip + 1.0);
tl.to("#fliprig", { y: -8 * U, duration: 2.4, yoyo: true, repeat: 2, ease: "sine.inOut" }, tFlip + 1.0);

// ── beat 1 — examples are VOICE-ONLY: the monolith just holds; slow push-in carries it ──
tl.to("#camera", { scale: 1.06, duration: cl(tQ - tHold, 2, 8), ease: "power1.inOut" }, tHold);

// ── beat 2 — the closing question + blinking gold caret (comment bait) ──
tl.to("#question", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tQ);
tl.to("#caret", { opacity: 0.15, duration: 0.5, repeat: Math.ceil((D - tQ) / 0.5), yoyo: true, ease: "none" }, tQ + 0.4);

// ── beat 3 — the bridge (n8n graph draws + BUILD IT) and the brand row + tagline rise ──
tl.to("#bridge", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tFollow);
tl.to("#w1", { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, tFollow + 0.3);
tl.to("#w2", { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, tFollow + 0.55);
tl.to("#nmid", { attr: { stroke: "#ffd37a" }, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, tFollow + 0.7);
tl.fromTo("#brandrow", { opacity: 0, y: 36 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tFollow + 0.35);
tl.fromTo(".b-mark", { rotation: -8, scale: 0.9 }, { rotation: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, tFollow + 0.35);

window.__timelines["fp-flip-close"] = tl;
