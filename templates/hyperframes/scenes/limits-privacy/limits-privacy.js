/* limits-privacy — GSAP timeline for 008 s11 ("Limits + a privacy win"). One file, 16:9 + 9:16.
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],
 *   props{kicker,title,subtitle?,sourceNote?}
 * Duration: data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 * Determinism: NO Math.random / Date.now. One paused, seek-driven GSAP timeline. Four beats:
 *   0 title    1 note A (the limit — scrawl ✗)    2 note B (keep the image + source)    3 note C (run local — green lock)
 */

var S = HF.scene({ id: "limits-privacy", width: 1920, height: 1080, frames: 510 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl;

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("kicker-text", props.kicker);
setText("src-chip", props.sourceNote);
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
var tTitle = beatAt(0, 0.04);
var tA = Math.max(beatAt(1, 0.26), tTitle + 0.6);
var tB = Math.max(beatAt(2, 0.50), tA + 0.8);
var tC = Math.max(beatAt(3, 0.74), tB + 0.8);

var words = Array.prototype.slice.call(document.querySelectorAll(".title .w"));

// ── resting-state setup ──
gsap.set("#kicker", { opacity: 0, x: -18 * U });
gsap.set(".kicker-dash", { scaleX: 0 });
gsap.set(words, { opacity: 0, yPercent: 110 });
gsap.set("#rule", { scaleX: 0 });
gsap.set("#glow", { scale: 0.92, opacity: 0.7 });
gsap.set(["#note-a", "#note-b", "#note-c"], { opacity: 0, y: 28 * U, scale: 0.97, transformOrigin: "50% 40%" });
gsap.set([".rcpt.scrawl", ".rcpt.keep", ".lock"], { scale: 0.7, transformOrigin: "50% 55%" });
gsap.set("#xbad", { opacity: 0, scale: 0.4 });
gsap.set(".rcpt.keep .ribbon", { scale: 0, rotation: 45, transformOrigin: "50% 50%" });
gsap.set("#src-chip", { opacity: 0, y: 8 * U });

// ── timeline (paused; the renderer seeks it) ──
var tl = gsap.timeline({ paused: true });

tl.to("#glow", { scale: 1.06, opacity: 0.9, duration: D, ease: "sine.inOut" }, 0);

// title resolves
tl.to("#kicker", { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, tTitle);
tl.to(".kicker-dash", { scaleX: 1, duration: 0.5, ease: "power2.out" }, tTitle + 0.05);
tl.to(words, { opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.06 }, tTitle + 0.05);
tl.to("#rule", { scaleX: 1, duration: 0.6, ease: "power3.out" }, tTitle + 0.4);

// beat A — the limit (scrawl receipt + red ✗)
tl.to("#note-a", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, tA);
tl.to(".rcpt.scrawl", { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, tA + 0.05);
tl.to("#xbad", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.6)" }, tA + 0.3);

// beat B — keep the image (gold ribbon) + the on-screen source chip
tl.to("#note-b", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, tB);
tl.to(".rcpt.keep", { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, tB + 0.05);
tl.to(".rcpt.keep .ribbon", { scale: 1, duration: 0.4, ease: "back.out(2.2)" }, tB + 0.3);
tl.to("#src-chip", { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, tB + 0.45);

// beat C — the privacy win (green lock)
tl.to("#note-c", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, tC);
tl.to(".lock", { scale: 1, duration: 0.55, ease: "back.out(1.8)" }, tC + 0.05);
tl.fromTo(".lock .body",
  { boxShadow: "0 " + (10 * U) + "px " + (28 * U) + "px rgba(52,211,154,0.0)" },
  { boxShadow: "0 " + (10 * U) + "px " + (34 * U) + "px rgba(52,211,154,0.5)", duration: 0.5, ease: "power2.out" },
  tC + 0.25);

// NO exit animation — the master timeline owns the cut.
HF.register("limits-privacy", tl);
