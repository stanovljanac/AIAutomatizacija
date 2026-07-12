/* flip-question — GSAP timeline for 013 s5 (round-2 wording). Kicker → "DOES IT WORK?" strike +
 * 3D flip to "WILL IT TELL ME WHEN IT DOESN'T?" → "THE DANGEROUS ONE / KEEPS GOING." monolith
 * locks (held ≥4s, slow gold pulse) → brand row rises in reserved space. Deterministic, seek-driven.
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 346;
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
var tKick = beatAt(0, 0.01);
var tFlip = Math.max(beatAt(1, 0.14), tKick + 0.7);
var tMono = Math.max(beatAt(2, 0.4), tFlip + 2.0);
var tBrand = Math.max(beatAt(3, 0.63), tMono + 1.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — kicker
tl.fromTo("#kicker", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tKick);

// beat 1 — "DOES IT WORK?" assembles, gets struck, 3D-flips to the real question
tl.fromTo("#qA", { opacity: 0, y: 40 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, tFlip - 0.55 < tKick + 0.3 ? tKick + 0.3 : tFlip - 0.55);
tl.to("#strike", { scaleX: 1, duration: 0.32, ease: "power3.inOut" }, tFlip + 0.15);
tl.to("#fliprig", { rotationY: 180, duration: 0.85, ease: "power3.inOut" }, tFlip + 0.6);
tl.to("#camera", { scale: 1.03, duration: 0.85, ease: "power2.inOut" }, tFlip + 0.6);
// hide the A face once the rig passes 90° — GSAP settles children to 2D matrices, which
// can defeat backface-visibility, so the fade is the deterministic guarantee
tl.to("#qA", { opacity: 0, duration: 0.16 }, tFlip + 1.02);

// beat 2 — the monolith locks in (screenshotable; held to the end ≥4s)
tl.to("#fliprig", { y: -40 * U, scale: 0.82, opacity: 0.75, duration: 0.5, ease: "power2.inOut" }, tMono);
tl.to("#kicker", { opacity: 0.4, duration: 0.4 }, tMono);
tl.fromTo("#monolith", { opacity: 0 }, { opacity: 1, duration: 0.2 }, tMono);
tl.fromTo("#m1", { y: 70 * U, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power4.out" }, tMono + 0.05);
tl.fromTo("#m2", { y: 70 * U, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, tMono + 0.35);
// slow gold pulse while it holds (pause-and-screenshot beat)
tl.to("#m2", { textShadow: "0 0 90px rgba(255,176,32,0.75)", duration: 1.1, yoyo: true, repeat: 3, ease: "sine.inOut" }, tMono + 0.9);

// beat 3 — brand row rises in its reserved space (never over the monolith)
tl.fromTo("#brandrow", { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tBrand);
tl.fromTo(".b-mark", { rotation: -8 }, { rotation: 0, duration: 0.5, ease: "back.out(2)" }, tBrand);

// slow push-in the whole scene
tl.fromTo("#camera", { scale: 1.0 }, { scale: 1.06, duration: D - tMono, ease: "power1.inOut" }, tMono);

window.__timelines["flip-question"] = tl;
