/* trust-gap — GSAP timeline for 010 s07 (thesis). 3-node flow with a gold "point of trust" gap.
 * Silent, deterministic, seek-driven. No exit tweens (master timeline owns the cut).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ gapLabel? }
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
var W = Number(V.width) > 0 ? Number(V.width) : 1920;
var H = Number(V.height) > 0 ? Number(V.height) : 1080;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 300;
var D = FRAMES / fps;
var props = V.props && typeof V.props === "object" ? V.props : {};
var beats = Array.isArray(V.revealsSeconds) ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; }) : [];

var root = document.getElementById("root");
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
var U = Math.min(W, H) / 1080;
document.documentElement.style.setProperty("--u", String(U));
if (props.gapLabel && document.getElementById("gap-pill")) document.getElementById("gap-pill").textContent = String(props.gapLabel).trim();

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.12, D - 0.3); }
// 9 sentence beats — a dim flow skeleton establishes at the FIRST sentence (never blank), then each
// node activates on its cue.
var U2 = U;
var tEstablish = beatAt(0, 0.05);
var tN1 = Math.max(beatAt(3, 0.30), tEstablish + 0.7);   // "a prompt goes in"
var tN2 = Math.max(beatAt(4, 0.42), tN1 + 0.6);          // "a confident answer ... no source"
var tN3 = Math.max(beatAt(5, 0.54), tN2 + 0.6);          // "gets shipped ... no one checking"
var tPoint = Math.max(beatAt(8, 0.80), tN3 + 0.9);       // "the point of trust"

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set(["#flag2", "#flag3"], { opacity: 0 });
gsap.set("#gap-pill", { opacity: 0 });

// establish — the dim 3-node skeleton + arrow + gap line slide in on sentence 0
tl.fromTo("#n1", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish);
tl.fromTo("#n2", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.12);
tl.fromTo("#n3", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.24);
tl.fromTo("#a1", { opacity: 0 }, { opacity: 0.5, duration: 0.5, ease: "power2.out" }, tEstablish + 0.2);
tl.fromTo("#gap-line", { opacity: 0, scaleY: 0.4 }, { opacity: 0.4, scaleY: 1, duration: 0.5, ease: "power2.out" }, tEstablish + 0.3);

// node 1 — the prompt goes in (brightens)
tl.to("#n1", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN1);
tl.to("#a1", { opacity: 0.85, duration: 0.3, ease: "power1.out" }, tN1 + 0.3);

// node 2 — the confident answer, NO SOURCE
tl.to("#n2", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN2);
tl.fromTo("#flag2", { opacity: 0, scale: 1.6, rotate: -6 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.32, ease: "power4.out" }, tN2 + 0.3);

// node 3 — shipped to court, NO CHECK; the gap brightens
tl.to("#n3", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN3);
tl.fromTo("#flag3", { opacity: 0, scale: 1.6, rotate: 6 }, { opacity: 1, scale: 1, rotate: 6, duration: 0.32, ease: "power4.out" }, tN3 + 0.3);
tl.to("#gap-line", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN3 + 0.2);

// the point of trust — the gap is the answer; the pill lands and breathes
tl.fromTo("#gap-pill", { opacity: 0, y: 14 * U2, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, tPoint);
tl.to("#gap-line", { boxShadow: "0 0 " + (40 * U2) + "px rgba(255,176,32,0.85)", duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, tPoint + 0.2);

window.__timelines["trust-gap"] = tl;
