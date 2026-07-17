/* only-flags — GSAP timeline for 008 s09 ("Only check the flags"). One file, 16:9 + 9:16.
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{kicker,title,subtitle}
 * Duration: data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Six beats:
 *   0 title    1 rows fill (AI types)    2 green checks pop (the script checks)
 *   3 one row → gold REVIEW + the glance ring lands    4 the clean rows dim    5 the "1 to check" counter
 */

var S = HF.scene({ id: "only-flags", width: 1920, height: 1080, frames: 540 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl;

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker-text", props.kicker);
setText("subtitle", props.subtitle);
if (typeof props.title === "string" && props.title.trim()) {
  var tEl = document.getElementById("title-text");
  if (tEl) {
    tEl.textContent = "";
    var parts = props.title.trim().split(/\s+/);
    parts.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      tEl.appendChild(span);
      if (i < parts.length - 1) tEl.appendChild(document.createTextNode(" "));
    });
  }
}

function beatAt(i, frac) {
  var fallback = D * frac;
  var t = beats.length > i ? beats[i] : fallback;
  return cl(t, 0.1, D - 0.4);
}
var tTitle = beatAt(0, 0.03);
var tRows = Math.max(beatAt(1, 0.16), tTitle + 0.5);
var tChecks = Math.max(beatAt(2, 0.34), tRows + 0.6);
var tFlag = Math.max(beatAt(3, 0.52), tChecks + 0.7);
var tDim = Math.max(beatAt(4, 0.72), tFlag + 0.9);
var tCount = Math.max(beatAt(5, 0.86), tDim + 0.5);

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));
var allRows = ["lr1", "lr2", "lr3", "lr4", "lr5", "lr6", "lr7"].map(function (id) { return document.getElementById(id); });
var cleanRows = ["lr1", "lr2", "lr3", "lr4", "lr6", "lr7"].map(function (id) { return document.getElementById(id); });
var cleanChecks = cleanRows.map(function (r) { return r.querySelector(".status.ok"); });
var lr5 = document.getElementById("lr5");
var glance = document.getElementById("glance");
var glanceH = 64 * U;
function glanceTopFor(r) { return r.offsetTop + (r.offsetHeight - glanceH) / 2; }

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#subtitle", { opacity: 0, y: 16 * U });
gsap.set("#glow", { scale: 0.92, opacity: 0.7 });
gsap.set("#sheet", { opacity: 0, y: 26 * U, scale: 0.985, transformOrigin: "50% 30%" });
gsap.set(allRows, { opacity: 0, x: 20 * U });
gsap.set(".status.ok", { opacity: 0, scale: 0.5 });
gsap.set("#lr5", { backgroundColor: "rgba(255,176,32,0)" });
gsap.set("#lr5-review", { opacity: 0, scale: 0.6 });
gsap.set("#glance", { opacity: 0, top: glanceTopFor(lr5), scale: 1.4 });
gsap.set("#counter", { opacity: 0, y: 12 * U });

// ── timeline (paused; the renderer seeks it) ──
var tl = gsap.timeline({ paused: true });

tl.to("#glow", { scale: 1.06, opacity: 0.9, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tTitle);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tTitle + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.07 }, tTitle + 0.05);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.4);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tTitle + 0.55);
tl.to("#sheet", { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tTitle + 0.2);

// beat 1 — rows fill (AI types the names in)
tl.to(allRows, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", stagger: 0.07 }, tRows);

// beat 2 — the green checks pop on (the script checks each row)
tl.to(".status.ok", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.0)", stagger: 0.06 }, tChecks);

// beat 3 — one row is caught: green ✓ → gold REVIEW, the row tints gold, the glance ring lands
tl.to("#lr5-ok", { opacity: 0, scale: 0.5, duration: 0.25, ease: "power1.in" }, tFlag);
tl.to("#lr5", { backgroundColor: "rgba(255,176,32,0.10)", duration: 0.45, ease: "power2.out" }, tFlag);
tl.to("#lr5-review", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)" }, tFlag + 0.1);
tl.to("#glance", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, tFlag + 0.15);
tl.to("#glance", { scale: 1.08, duration: 0.7, repeat: Math.ceil(D), yoyo: true, ease: "sine.inOut" }, tFlag + 0.65);

// beat 4 — the clean rows dim back (you don't re-read them)
tl.to(cleanRows, { opacity: 0.4, duration: 0.5, ease: "power2.out" }, tDim);

// beat 5 — the "1 to check" counter lands
tl.to("#counter", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tCount);

// NO exit animation — the master timeline owns the cut.
HF.register("only-flags", tl);
