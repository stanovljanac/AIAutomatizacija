/* steal-the-shape — GSAP timeline for 012 s16. Opener → DRAFT (churn) → CHECK (scan, shatter,
 * reform) → GATE (bars, light) → VERTICAL monolith + re-skins + the formula, held ≥4s.
 * Silent, deterministic, seek-driven.
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
var W = Number(V.width) > 0 ? Number(V.width) : 1920;
var H = Number(V.height) > 0 ? Number(V.height) : 1080;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 750;
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

function cl(t, lo, hi) { return t < lo ? lo : t > hi ? hi : t; }
function beatAt(idx, frac) { var t = beats.length > idx ? beats[idx] : D * frac; return cl(t, 0.1, D - 0.4); }
// 4 sentence beats
var tOpen = beatAt(0, 0.03);
var tActs = Math.max(beatAt(1, 0.2), tOpen + 1.4);   // "Draft with a model, and review with a second one."
var tGateB = Math.max(beatAt(2, 0.48), tActs + 3.2);  // "Verify the facts, retry the failures, and put a human gate…"
var tLoop = Math.max(beatAt(3, 0.74), tGateB + 2.4);  // "Any capable agent can run that loop…"
var actSpan = Math.max(2.8, tGateB - tActs);

window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// beat 0 — the promise pays off: STEAL THE SHAPE
tl.fromTo("#opener", { opacity: 0, scale: 0.86, y: 26 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" }, tOpen);
tl.to("#goldwash", { opacity: 1, duration: 0.8, ease: "power2.out" }, tOpen + 0.2);

// beat 1 — ACT 1: DRAFT, text churning inside the letterforms
var tDraftAct = tActs;
tl.to("#opener", { opacity: 0, scale: 1.15, duration: 0.4, ease: "power2.in" }, tDraftAct - 0.1);
tl.to("#actDraft", { opacity: 1, duration: 0.25, ease: "power1.out" }, tDraftAct);
tl.from("#wDraft span", { opacity: 0, y: 90 * U, duration: 0.4, stagger: 0.07, ease: "back.out(1.6)" }, tDraftAct + 0.1);
tl.to("#wDraft span", { backgroundPosition: "0 0, 0 " + -300 * U + "px", duration: actSpan * 0.5, ease: "none" }, tDraftAct + 0.1);

// ACT 2: CHECK — red scan grid slams, strokes flip green, one letter shatters and reforms
var tCheckAct = tActs + actSpan * 0.5;
tl.to("#actDraft", { opacity: 0, x: -0.2 * W, duration: 0.35, ease: "power2.in" }, tCheckAct - 0.3);
tl.to("#actCheck", { opacity: 1, duration: 0.2 }, tCheckAct - 0.1);
tl.from("#wCheck span", { opacity: 0, scale: 1.5, duration: 0.3, stagger: 0.05, ease: "power3.in" }, tCheckAct);
tl.fromTo("#scangrid", { opacity: 0, y: -0.5 * H }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.in" }, tCheckAct + 0.35);
tl.to("#wCheck span", { color: "#22D3A7", duration: 0.28, stagger: 0.08, ease: "power2.out" }, tCheckAct + 0.75);
// the shatter: E jolts out, splits feel via skew+offset, then reforms
tl.to("#shE", { color: "#ff5c5c", y: 40 * U, skewX: 18, rotate: 8, duration: 0.3, ease: "power3.out" }, tCheckAct + 1.1);
tl.to("#shE", { y: 0, skewX: 0, rotate: 0, color: "#22D3A7", duration: 0.45, ease: "back.out(2.2)" }, tCheckAct + 1.55);
tl.to("#scangrid", { opacity: 0, duration: 0.35 }, tCheckAct + 1.7);

// beat 2 — ACT 3: GATE — the gold bars lower over the whole frame, light spills through
tl.to("#actCheck", { opacity: 0, x: -0.2 * W, duration: 0.35, ease: "power2.in" }, tGateB - 0.25);
tl.to("#actGate", { opacity: 1, duration: 0.2 }, tGateB - 0.05);
tl.from("#wGate span", { opacity: 0, y: -70 * U, duration: 0.4, stagger: 0.08, ease: "power3.out" }, tGateB);
tl.to(".gbar", { scaleY: 1, duration: 0.5, stagger: 0.09, ease: "power3.in" }, tGateB + 0.4);
tl.to("#lightrays", { opacity: 1, duration: 0.6, ease: "power2.out" }, tGateB + 0.9);

// beat 3 — the VERTICAL monolith + re-skins + the formula line (held to the end)
tl.to("#actGate", { opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.inOut" }, tLoop - 0.2);
tl.fromTo("#mono", { opacity: 0, scale: 0.7, y: 30 * U }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, tLoop);
tl.from(".slab", { opacity: 0, y: -26 * U, duration: 0.35, stagger: 0.12, ease: "power3.out" }, tLoop + 0.1);
tl.to("#reskins", { opacity: 1, duration: 0.4, ease: "power2.out" }, tLoop + 0.6);
var rs = ["#rs1", "#rs2", "#rs3", "#rs4"];
for (var ri = 0; ri < rs.length; ri++) {
  var at = tLoop + 0.7 + ri * 0.45;
  tl.fromTo(rs[ri], { scale: 0.9 }, { scale: 1.12, borderColor: "rgba(255,176,32,0.8)", duration: 0.22, ease: "power2.out" }, at);
  tl.to(rs[ri], { scale: 1, borderColor: "rgba(143,182,255,0.35)", duration: 0.3, ease: "power2.inOut" }, at + 0.24);
}
// the formula assembles LAST and stays ≥4s (screenshotable)
var tF = cl(tLoop + 1.2, tLoop, D - 4.2);
tl.to("#formula", { opacity: 1, duration: 0.2 }, tF);
tl.fromTo(".f-chip.f-draft", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.8)" }, tF);
tl.fromTo(".f-arrow:nth-of-type(2)", { opacity: 0, x: -10 * U }, { opacity: 1, x: 0, duration: 0.22, ease: "power2.out" }, tF + 0.28);
tl.fromTo(".f-chip.f-check", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.8)" }, tF + 0.44);
tl.fromTo(".f-arrow:nth-of-type(4)", { opacity: 0, x: -10 * U }, { opacity: 1, x: 0, duration: 0.22, ease: "power2.out" }, tF + 0.72);
tl.fromTo(".f-chip.f-gate", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.8)" }, tF + 0.88);
tl.to("#formula", { scale: 1.04, duration: 0.3, ease: "back.out(2)" }, tF + 1.2);
tl.to("#formula", { scale: 1, duration: 0.3, ease: "power2.inOut" }, tF + 1.5);

window.__timelines["steal-the-shape"] = tl;
