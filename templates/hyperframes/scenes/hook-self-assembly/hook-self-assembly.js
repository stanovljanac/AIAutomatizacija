/* hook-self-assembly — GSAP timeline for 012 s01. The frame assembles itself; hype cards get
 * flicked out. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ title?, kicker?, hypeCards?[] }
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
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 360;
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

if (props.kicker && document.getElementById("kicker")) document.getElementById("kicker").textContent = String(props.kicker).trim().toUpperCase();

// headline words (kinetic stagger; "AI" + "VIDEO" get gold)
var titleText = (props.title ? String(props.title) : "An AI made this video").trim();
var headEl = document.getElementById("headline");
var words = titleText.split(/\s+/);
for (var wi = 0; wi < words.length; wi++) {
  var sp = document.createElement("span");
  sp.className = "w" + (/^(ai|video\.?|video)$/i.test(words[wi]) ? " gold" : "");
  sp.textContent = words[wi];
  headEl.appendChild(sp);
}

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 3 sentence beats
var tHead = beatAt(0, 0.04);
var tBuild = Math.max(beatAt(1, 0.34), tHead + 1.0);
var tHype = Math.max(beatAt(2, 0.7), tBuild + 1.6);
var buildSpan = Math.max(1.4, tHype - tBuild - 0.25); // assembly must finish before the hype beat
var hypeSpan = Math.max(1.6, D - tHype - 0.2);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// --- beat 0: the player frame lands, headline staggers in
tl.from("#player", { opacity: 0, y: 60 * U, scale: 0.94, duration: 0.6, ease: "power3.out" }, cl(tHead, 0.1, D));
tl.from("#headline .w", { opacity: 0, y: 26 * U, duration: 0.4, stagger: 0.07, ease: "back.out(1.7)" }, tHead + 0.25);

// --- beat 1: the machine assembles — tracks fly in, waveform draws, caption chip snaps, render bar fills
var st = buildSpan / 6;
tl.from("#tr1", { opacity: 0, x: -140 * U, duration: 0.45, ease: "power3.out" }, tBuild);
tl.from("#tr2", { opacity: 0, x: -140 * U, duration: 0.45, ease: "power3.out" }, tBuild + st * 0.7);
tl.from("#tr3", { opacity: 0, x: -140 * U, duration: 0.45, ease: "power3.out" }, tBuild + st * 1.4);
var wp = document.getElementById("wavepath");
var wlen = 2200; // fixed (deterministic; ~path length)
gsap.set(wp, { strokeDasharray: wlen, strokeDashoffset: wlen });
tl.to(wp, { strokeDashoffset: 0, duration: buildSpan * 0.62, ease: "power1.inOut" }, tBuild + st);
tl.fromTo("#capchip", { opacity: 0, y: 22 * U, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, tBuild + st * 3);
var pctObj = { v: 0 };
var pctEl = document.getElementById("pct");
tl.to("#fill", { scaleX: 0.87, duration: buildSpan, ease: "power1.inOut" }, tBuild);
tl.to(pctObj, {
  v: 87, duration: buildSpan, ease: "power1.inOut",
  onUpdate: function () { pctEl.textContent = Math.round(pctObj.v) + "%"; },
}, tBuild);

// --- beat 2: FREEZE + the hype thumbnails shove in and get flicked back out
tl.to("#player", { scale: 0.97, duration: 0.22, ease: "power2.out" }, tHype); // the freeze "thunk"
var hs = hypeSpan / 5;
var hy = ["#hype1", "#hype2", "#hype3"];
for (var hi = 0; hi < hy.length; hi++) {
  var inAt = tHype + 0.12 + hi * hs * 0.6;
  var outAt = inAt + hs * 1.5;
  var dir = hi === 1 ? -1 : 1;
  tl.fromTo(hy[hi], { opacity: 0, x: dir * 500 * U, rotate: dir * 14 }, { opacity: 1, x: 0, rotate: dir * (hi === 2 ? 3 : 6), duration: 0.42, ease: "power3.out" }, inAt);
  tl.to(hy[hi], { opacity: 0, x: dir * 640 * U, rotate: dir * 24, duration: 0.4, ease: "power2.in" }, cl(outAt, inAt + 0.5, D - 0.25));
}
tl.fromTo("#flash", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power1.out" }, cl(tHype + hypeSpan * 0.78, tHype + 0.6, D - 0.35));
tl.to("#flash", { opacity: 0, duration: 0.45, ease: "power2.out" }, cl(tHype + hypeSpan * 0.78 + 0.14, tHype + 0.74, D - 0.2));
tl.to("#player", { scale: 1, duration: 0.4, ease: "back.out(1.6)" }, cl(tHype + hypeSpan * 0.8, tHype + 0.7, D - 0.3));

window.__timelines["hook-self-assembly"] = tl;
