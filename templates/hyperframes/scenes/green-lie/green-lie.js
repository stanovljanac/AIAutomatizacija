/* green-lie — GSAP timeline for 013 s2 (the villain). A "daily report" app stamps a fresh green
 * ✓ Sent every morning; an ERROR blip is swallowed; then the green deck FANS AWAY to expose the
 * red ✗ rot underneath; a day counter burns +3 weeks and the frame dims ("or never").
 * Cards are FLAT/face-on (MOTION_SPEC §5). Deterministic + seek-driven: DOM text is set only via
 * tween onUpdate (fires on seek), never via .call()/callbacks.
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 340;
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
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.05, D - 0.4); }
// beats: [0] establish, [1] error swallowed + ✓ keeps landing, [2] "every morning" → fan → ✗, [3] burn +3wk
var tEstablish = beatAt(0, 0.0);
var tError = Math.max(beatAt(1, 0.24), tEstablish + 1.0);
var tReveal = Math.max(beatAt(2, 0.46), tError + 1.6);
var tDate = Math.max(beatAt(3, 0.8), tReveal + 2.2);

// build 3 green ✓ "Sent" cards (slapped on top, one per morning)
var GCARDS = 3;
var gcards = document.getElementById("gcards");
for (var gi = 0; gi < GCARDS; gi++) {
  var g = document.createElement("div");
  g.className = "gcard";
  g.innerHTML = '<span class="gv">✓</span><span class="glbl">SENT</span>';
  gcards.appendChild(g);
}
var gEls = gcards.children;

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

gsap.set("#rotstack", { opacity: 0 });
gsap.set("#redwash", { opacity: 0 });

// a green card slaps down from above and settles (flat; tiny stack rotation only)
function landGreen(idx, t) {
  var oy = -12 * idx;                    // each new card sits a touch higher (the pile grows)
  var orot = idx % 2 ? 1.4 : -1.4;       // ≤2deg flat stack tilt (allowed by the card rule)
  tl.fromTo(gEls[idx],
    { opacity: 0, y: -180 * U, rotation: orot * 0.5 },
    { opacity: 1, y: oy * U, rotation: orot, duration: 0.38, ease: "back.out(1.6)" }, t);
}

// camera: slow ambient drift the whole scene
tl.fromTo("#camera", { scale: 1.0 }, { scale: 1.05, duration: D - 0.2, ease: "power1.inOut" }, 0.1);

// the day chip ticks MON → TUE → WED across the "every morning" run (onUpdate = seek-safe)
var dayNames = ["MON", "TUE", "WED"];
var dayProxy = { v: 0 };
var dayEl = document.getElementById("daychip");
tl.to(dayProxy, { v: 2, duration: cl(tReveal - tEstablish + 0.3, 0.6, 6), ease: "none",
  onUpdate: function () { dayEl.textContent = dayNames[Math.min(2, Math.max(0, Math.round(dayProxy.v)))]; } }, tEstablish);

// beat 0 — establish the app + deck; first ✓ lands
tl.fromTo("#appbar", { opacity: 0, y: -30 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish);
tl.fromTo("#deckwrap", { opacity: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.08);
tl.fromTo("#datechip", { opacity: 0, y: 20 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.28);
landGreen(0, tEstablish + 0.5);

// beat 1 — an ERROR blip flashes over the card and is SWALLOWED as the next ✓ lands
tl.fromTo("#errblip", { opacity: 0, scale: 1.5, y: -12 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "power4.in" }, tError + 0.12);
tl.to("#errblip", { opacity: 0, scale: 0.65, y: 20 * U, duration: 0.32, ease: "power2.in" }, tError + 0.7);
landGreen(1, tError + 0.8);

// beat 2 — "every morning" one more ✓ … then the green deck FANS AWAY → the ✗ rot underneath
landGreen(2, tReveal + 0.15);
var fanX = [-360, 380, -40], fanY = [-150, -110, -190], fanR = [-11, 13, -6];
for (var k = 0; k < GCARDS; k++) {
  tl.to(gEls[k], { x: fanX[k] * U, y: fanY[k] * U, rotation: fanR[k], opacity: 0, duration: 0.5, ease: "power3.in" }, tReveal + 1.15 + k * 0.05);
}
tl.to("#rotstack", { opacity: 1, duration: 0.5, ease: "power2.out" }, tReveal + 1.25);
tl.fromTo(".rcard", { scale: 0.9 }, { scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.4)" }, tReveal + 1.25);
tl.fromTo("#redwash", { opacity: 0 }, { opacity: 0.5, duration: 0.5, ease: "power2.in" }, tReveal + 1.25);
tl.fromTo("#underlabel", { opacity: 0, y: 16 * U }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tReveal + 1.7);

// beat 3 — the calendar burns +3 weeks, then the frame dims ("… or never")
var dObj = { v: 1 };
var dnumEl = document.getElementById("dnum");
var dsubEl = document.getElementById("dsub");
var burnDur = cl(D - tDate - 1.4, 0.7, 1.3);
tl.to(dObj, { v: 22, duration: burnDur, ease: "power1.in",
  onUpdate: function () { dnumEl.textContent = "DAY " + Math.round(dObj.v); dsubEl.textContent = dObj.v > 3 ? "still 'all green'" : "all green"; } }, tDate);
tl.to("#datechip", { scale: 1.12, duration: burnDur * 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, tDate);
// "…or never" — a gentle darken (keeps DAY 22 legible; the mood, not a blackout)
tl.to("#camera", { filter: "brightness(0.62)", duration: 0.7, ease: "power2.in" }, tDate + burnDur + 0.45);
tl.to("#redwash", { opacity: 0.16, duration: 0.7, ease: "power2.out" }, tDate + burnDur + 0.45);

window.__timelines["green-lie"] = tl;
