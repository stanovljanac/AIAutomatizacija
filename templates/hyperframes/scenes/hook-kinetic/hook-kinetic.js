/* hook-kinetic — shared scene logic for both entries (index.html / portrait.html).
 *
 * VARIABLES CONTRACT (pipeline passes via --variables-file; see index.html header):
 *   fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{}
 *
 * Duration derivation (the contract's load-bearing line): the renderer takes the
 * composition duration from the IN-PAGE root attribute (window.__hf.duration probe;
 * neither entry hard-codes a static data-duration), and computes
 * totalFrames = ceil(duration * fps). We set
 *   data-duration = (durationFrames - 0.5) / fps
 * which ceils to EXACTLY durationFrames for any integer frame count — immune to
 * float epsilon (a naive durationFrames/fps can ceil one frame high).
 *
 * Deterministic: no Math.random / Date.now; one paused GSAP timeline, seek-driven.
 */

// ── 1. Resolve variables. getVariables() merges declared defaults +
//      --variables-file; plain-browser fallback reads the declared defaults. ──
function readVars() {
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") {
    return window.__hyperframes.getVariables();
  }
  var out = {};
  try {
    var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
    for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default;
  } catch (e) {}
  if (window.__hfVariables && typeof window.__hfVariables === "object") Object.assign(out, window.__hfVariables);
  return out;
}
var V = readVars();
var fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
var W = Number(V.width) > 0 ? Number(V.width) : 1920;
var H = Number(V.height) > 0 ? Number(V.height) : 1080;
var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 189;
// The visual clock: exactly FRAMES frames of content.
var D = FRAMES / fps;
var props = V.props && typeof V.props === "object" ? V.props : {};
var title = typeof props.title === "string" && props.title.trim() ? props.title.trim() : "Stop typing invoices by hand";
var kicker = typeof props.kicker === "string" && props.kicker.trim() ? props.kicker.trim() : "The Automation Desk";
var beats = Array.isArray(V.revealsSeconds)
  ? V.revealsSeconds.filter(function (t) { return typeof t === "number" && isFinite(t); }).slice().sort(function (a, b) { return a - b; })
  : [];

// ── 2. Apply EXACT duration (and geometry) to the DOM before the capture
//      engine reads it. NOTE: the OUTPUT canvas size is fixed per entry file
//      (static data-width/height); these assignments keep the runtime layout
//      consistent with the variables, they cannot re-size the render. ──
var root = document.getElementById("root");
// ceil(dataDuration * fps) === FRAMES exactly, for any integer FRAMES (see header).
root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
root.setAttribute("data-width", String(W));
root.setAttribute("data-height", String(H));
if (H > W) root.classList.add("portrait");
// fluid unit: 1.0 at 1920x1080 / 1080x1920; scales typography to any canvas
document.documentElement.style.setProperty("--u", String(Math.min(W, H) / 1080));
if (typeof props.accent === "string" && /^#[0-9a-fA-F]{3,8}$/.test(props.accent)) {
  document.documentElement.style.setProperty("--accent", props.accent);
}

// ── 3. Fill content: kicker + one span per title word ──
document.getElementById("kicker-text").textContent = kicker;
var titleEl = document.getElementById("title");
var words = title.split(/\s+/);
for (var wi = 0; wi < words.length; wi++) {
  var span = document.createElement("span");
  span.className = "word";
  span.id = "w-" + wi;
  span.textContent = words[wi];
  titleEl.appendChild(span);
}

// ── 4. Pacing: map words to start times.
//      beats present  -> beats are the word-GROUP starts (each beat punches
//                        the next group); a leading group is prepended at
//                        0.42s if the first beat lands late.
//      beats empty    -> one auto-distributed run across the first ~60%. ──
var INTRO = 0.42; // first motion offset (never animate at t=0)
var WORD_DUR = 0.55;
var LAST_START_CAP = Math.max(INTRO, D - 1.1); // every word starts in time to land

var groupStarts; // seconds, one per word group
if (beats.length > 0) {
  groupStarts = beats
    .map(function (t) { return Math.min(Math.max(t, INTRO), LAST_START_CAP); })
    .filter(function (t, i, a) { return i === 0 || t > a[i - 1] + 0.12; });
  if (groupStarts.length === 0) groupStarts = [INTRO];
  if (groupStarts[0] > 1.5) groupStarts.unshift(INTRO); // don't hold an empty title
} else {
  groupStarts = [INTRO];
}

// split words evenly across groups (earlier groups take the remainder)
var nGroups = Math.min(groupStarts.length, words.length);
var per = Math.floor(words.length / nGroups);
var rem = words.length % nGroups;
var wordStart = []; // per-word start time
var wordLead = []; // first word of a group gets the punchier ease
var w0 = 0;
for (var g = 0; g < nGroups; g++) {
  var count = per + (g < rem ? 1 : 0);
  var gEnd = g < nGroups - 1 ? groupStarts[g + 1] : LAST_START_CAP + WORD_DUR;
  // in-group stagger; compress so the group clears before the next beat
  var stagger = count > 1 ? Math.min(0.1, Math.max(0.04, (gEnd - groupStarts[g] - 0.2) / count)) : 0;
  if (beats.length === 0 && count > 1) {
    // auto mode: spread the whole line across the first ~60% of the clip
    stagger = Math.min(0.14, Math.max(0.05, (Math.min(D * 0.6, LAST_START_CAP) - INTRO) / (count - 1)));
  }
  for (var k = 0; k < count; k++) {
    wordStart[w0 + k] = Math.min(groupStarts[g] + k * stagger, LAST_START_CAP);
    wordLead[w0 + k] = k === 0;
  }
  w0 += count;
}
var lastLand = wordStart[words.length - 1] + WORD_DUR;

// ── 5. Timeline (paused; the player/renderer seeks it) ──
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });

// cinematic micro-settle: the whole content block eases from 1.03 -> 1.00
// across the full clip ("lively yet calm" — barely perceptible)
tl.fromTo("#content", { scale: 1.03 }, { scale: 1, duration: D, ease: "none" }, 0);
// slow glow drift, motivated by the settle (same direction, same clock)
tl.fromTo("#glow-a", { xPercent: -3, yPercent: 2 }, { xPercent: 3, yPercent: -2, duration: D, ease: "none" }, 0);

// kicker: dash sweeps, label rises
tl.fromTo("#kicker-dash", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.out" }, 0.14);
tl.fromTo("#kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.16);

// words: rise + de-blur; group leads land with a snappier overshoot
for (var i2 = 0; i2 < words.length; i2++) {
  tl.fromTo(
    "#w-" + i2,
    { opacity: 0, y: "0.55em", scale: 0.96, filter: "blur(8px)" },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: wordLead[i2] ? 0.62 : WORD_DUR,
      ease: wordLead[i2] ? "back.out(1.5)" : "power3.out",
    },
    wordStart[i2]
  );
}

// accent rule draws once the line has landed
var ruleAt = Math.min(Math.max(lastLand - 0.22, INTRO + 0.4), D - 0.85);
tl.fromTo("#rule", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power4.inOut" }, ruleAt);

// beat punches: a soft accent flash + a tiny pulse on the title block.
// Skip beats that crowd each other (<0.7s apart) so tweens never overlap.
var lastPulse = -10;
for (var b = 0; b < beats.length; b++) {
  var t = beats[b];
  if (t < INTRO || t > D - 0.7 || t - lastPulse < 0.7) continue;
  lastPulse = t;
  // single keyframed tween per element per beat — no overlapping tweens
  tl.to(
    "#beat-flash",
    { keyframes: [{ opacity: 0.16, duration: 0.12, ease: "power1.out" }, { opacity: 0, duration: 0.5, ease: "power2.out" }] },
    t
  );
  tl.to(
    "#title-wrap",
    { keyframes: [{ scale: 1.012, duration: 0.12, ease: "power2.out" }, { scale: 1, duration: 0.34, ease: "power2.inOut" }] },
    t
  );
}

// NO exit animation: this is a hook scene — the master timeline's
// transition owns the cut, so the last frame stays fully composed.

window.__timelines["hook-kinetic"] = tl;
