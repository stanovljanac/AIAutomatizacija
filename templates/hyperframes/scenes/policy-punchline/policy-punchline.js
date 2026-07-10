/* policy-punchline — GSAP timeline for 012 s03. Sheet unrolls over the frozen pile → policy name
 * + marker sweeps → DEMONETIZED strike + zoom-toward. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, source?, strike? }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 510;
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

if (props.value) document.getElementById("datechip").textContent = String(props.value);
if (props.source) document.getElementById("srcchip").textContent = "source: " + String(props.source);
if (props.strike) document.getElementById("strike").textContent = String(props.strike);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 3 sentence beats
var tSheet = beatAt(0, 0.03);
var tName = Math.max(beatAt(1, 0.34), tSheet + 1.2);
var tStrike = Math.max(beatAt(2, 0.72), tName + 1.6);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// pre-state: the policy name + body lines wait for their beat
gsap.set("#policyname", { opacity: 0, y: 20 * U });
gsap.set(".sheet-line", { opacity: 0.15 });

// beat 0 — the sheet unrolls over the frozen pile; date chip pops
tl.from("#pilebg", { opacity: 0, duration: 0.4, ease: "power1.out" }, cl(tSheet, 0.1, D));
tl.fromTo("#sheet",
  { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", y: -50 * U },
  { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.9, ease: "power3.out" }, tSheet + 0.1);
tl.fromTo("#datechip", { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.in" }, tSheet + 0.85);

// beat 1 — the policy gets named; marker sweeps land on the highlighted words
tl.to("#policyname", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }, tName);
tl.to(".sheet-line", { opacity: 1, duration: 0.4, stagger: 0.12, ease: "power2.out" }, tName + 0.2);
tl.to("#mark1 .marker", { scaleX: 1, duration: 0.35, ease: "power2.out" }, tName + 0.55);
tl.to("#mark2 .marker", { scaleX: 1, duration: 0.35, ease: "power2.out" }, tName + 0.95);
tl.to("#srcchip", { opacity: 1, duration: 0.35, ease: "power2.out" }, tName + 1.2);

// beat 2 — DEMONETIZED slams across the sheet + pile; slow zoom toward the strike (transition out)
tl.to("#strike", { opacity: 1, scale: 1, duration: 0.3, ease: "power4.in" }, tStrike);
tl.to("#sheet", { x: -6 * U, y: 4 * U, duration: 0.1, ease: "power1.inOut" }, tStrike + 0.28);
tl.to("#sheet", { x: 0, y: 0, duration: 0.24, ease: "power1.out" }, tStrike + 0.4);
tl.to(".stage", { scale: 1.06, duration: Math.max(0.8, D - tStrike - 0.5), ease: "power1.in", transformOrigin: "50% 42%" }, tStrike + 0.4);

window.__timelines["policy-punchline"] = tl;
