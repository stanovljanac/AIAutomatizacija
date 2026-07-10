/* writer-vs-reviewer — GSAP timeline for 012 s07. The volley: draft → REJECT stamp → edit →
 * re-submit → REJECT → edit → PASS on the third try. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ rejectStamps?[], versionBadges?[] }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 720;
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

var stamps = Array.isArray(props.rejectStamps) && props.rejectStamps.length >= 2 ? props.rejectStamps : ["WEAK HOOK", "UNSOURCED"];
document.getElementById("stamp1").textContent = String(stamps[0]);
document.getElementById("stamp2").textContent = String(stamps[1]);

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 4 sentence beats
var tAgents = beatAt(0, 0.03);
var tFirst = Math.max(beatAt(1, 0.2), tAgents + 1.0);
var tVolley = Math.max(beatAt(2, 0.45), tFirst + 1.6);
var tPass = Math.max(beatAt(3, 0.78), tVolley + 2.4);

var courtW = 760 * U;
var docTravel = courtW - 280 * U; // left edge → right edge

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the two agents rise; the draft appears at the writer
tl.from("#botL", { opacity: 0, x: -90 * U, duration: 0.5, ease: "power3.out" }, tAgents);
tl.from("#botR", { opacity: 0, x: 90 * U, duration: 0.5, ease: "power3.out" }, tAgents + 0.15);
tl.from(".court", { opacity: 0, duration: 0.4, ease: "power2.out" }, tAgents + 0.3);
tl.fromTo("#doc", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, tAgents + 0.5);

// seek-pure volley: separate stamp/badge ELEMENTS per pass (no callbacks, no retexting)
function volley(at, stampSel, badgeSel, lineFix) {
  // fly to reviewer
  tl.to("#doc", { x: docTravel, rotate: 2, duration: 0.45, ease: "power2.inOut" }, at);
  // reject stamp slams
  tl.fromTo(stampSel, { opacity: 0, scale: 2.2, rotate: -12 }, { opacity: 1, scale: 1, rotate: -12, duration: 0.22, ease: "power4.in" }, at + 0.5);
  tl.to("#botR .a-body", { scale: 1.08, duration: 0.16, ease: "power2.out" }, at + 0.5);
  tl.to("#botR .a-body", { scale: 1, duration: 0.3, ease: "power2.inOut" }, at + 0.68);
  // fly back + stamp fades + version badge crossfades up + the bad line gets FIXED
  tl.to(stampSel, { opacity: 0, duration: 0.25, ease: "power1.out" }, at + 0.95);
  tl.to("#doc", { x: 0, rotate: 0, duration: 0.45, ease: "power2.inOut" }, at + 1.0);
  tl.fromTo(badgeSel, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, at + 1.45);
  if (lineFix) {
    tl.to("#dl2", { scaleX: 0.2, duration: 0.18, ease: "power2.in" }, at + 1.5);
    tl.to("#dl2", { scaleX: 1, backgroundColor: lineFix, duration: 0.3, ease: "power2.out" }, at + 1.7);
  }
}

// beat 1 — first pass: submitted, rejected (WEAK HOOK), bounced back, rewritten → v2
volley(tFirst, "#stamp1", "#vb2", "rgba(143,182,255,0.4)");

// beat 2 — rapid second volley: rejected again (UNSOURCED → source pin fixes it) → v3
var v2at = Math.max(tVolley, tFirst + 2.0);
tl.to("#dl4", { backgroundColor: "rgba(255,92,92,0.65)", duration: 0.2 }, v2at - 0.25); // a new problem appears
volley(v2at, "#stamp2", "#vb3", null);
tl.to("#dl4", { scaleX: 0.2, duration: 0.18, ease: "power2.in" }, v2at + 1.5);
tl.to("#dl4", { scaleX: 1, backgroundColor: "rgba(255,211,122,0.75)", duration: 0.3, ease: "power2.out" }, v2at + 1.7); // source pin = gold line

// beat 3 — third submission PASSES: doc glows green at the reviewer, pass chip lands
tl.to("#doc", { x: docTravel, rotate: 1, duration: 0.45, ease: "power2.inOut" }, tPass);
tl.to("#doc", { borderColor: "rgba(34,211,167,0.8)", boxShadow: "0 " + 18 * U + "px " + 46 * U + "px rgba(0,0,0,0.5), 0 0 " + 44 * U + "px rgba(34,211,167,0.4)", duration: 0.4, ease: "power2.out" }, tPass + 0.5);
tl.to("#botR .a-body", { color: "#22D3A7", borderColor: "rgba(34,211,167,0.7)", duration: 0.35, ease: "power2.out" }, tPass + 0.5);
tl.fromTo("#passchip", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" }, cl(tPass + 0.7, tPass, D - 0.3));

window.__timelines["writer-vs-reviewer"] = tl;
