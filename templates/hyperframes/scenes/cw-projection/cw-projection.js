/* cw-projection — 022 s8.
 * Premise: quadratic growth is only convincing if you SEE the bend, and only honest if the measured
 * part and the projected part never look like the same kind of object. So: eight small solid bars
 * (measured, dim, at the far left) and a dashed curve continuing from their tip, chipped
 * "arithmetic · equal-size turns". Markers land on 20 and 40 as they are spoken.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-projection", width: 1920, height: 1080, frames: 447, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 43, bloomY: 46 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var SENT = props.sent || [154, 215, 279, 366, 433, 489, 548, 606];
document.getElementById("chipM").textContent = props.chipMeasured || "measured · 8 requests";
document.getElementById("chipP").textContent = props.chipProjected || "arithmetic · equal-size turns";
document.getElementById("m20l").textContent = props.mark20 || "request 20";
document.getElementById("m40l").textContent = props.mark40 || "request 40";
document.getElementById("kickertext").textContent = props.title || "≈ 20× at 40 requests";

/* ── the plot: cumulative tokens read after N requests, i.e. N(N+1)/2 ─────────── */
var X0 = 210, XW = 1500, BASE = 742, TOP = 180, H = 560;
var NMAX = 44;
function cum(n) { return (n * (n + 1)) / 2; }
var YMAX = cum(NMAX);
function px_(n) { return X0 + (n / NMAX) * XW; }
function py_(n) { return BASE - (cum(n) / YMAX) * H; }

/* the eight measured requests, small and solid — they are DATA */
var chart = document.getElementById("chart");
var mbars = [];
for (var i = 1; i <= SENT.length; i++) {
  var b = FX.el("mbar", chart);
  var h = Math.max(BASE - py_(i), 4);
  b.style.width = FX.px(18);
  b.style.left = FX.px(px_(i) - 9);
  b.style.top = FX.px(BASE - h);
  b.style.height = FX.px(h);
  mbars.push(b);
}

/* the projection, in the SVG's own 1500x560 space */
var d = "";
for (var n = SENT.length; n <= NMAX; n++) {
  var sx = ((px_(n) - X0) / XW) * 1500;
  var sy = ((py_(n) - TOP) / H) * 560;
  d += (n === SENT.length ? "M " : " L ") + sx.toFixed(1) + " " + sy.toFixed(1);
}
var proj = document.getElementById("proj");
proj.setAttribute("d", d);
var LEN = 4200;
gsap.set(proj, { strokeDasharray: "18 16", strokeDashoffset: 0, opacity: 0 });

document.getElementById("m20").style.left = FX.px(px_(20));
document.getElementById("m20").style.top = FX.px(py_(20));
document.getElementById("m40").style.left = FX.px(px_(40));
document.getElementById("m40").style.top = FX.px(py_(40));

var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.13), t0 + 1.0);   // "Request twenty re-reads twenty turns."
var t2 = Math.max(beatAt(2, 0.36), t1 + 2.0);   // "Request forty re-reads forty."
var t3 = Math.max(beatAt(3, 0.53), t2 + 1.6);   // "…about twenty times over."

gsap.set(mbars, { scaleY: 0 });
gsap.set(["#m20", "#m40", "#chipM", "#chipP", "#kicker"], { opacity: 0 });

/* the measured eight return first — small, dim, and clearly finished */
tl.to(mbars, { scaleY: 1, duration: 0.3, ease: "power3.out", stagger: 0.035 }, t0 + 0.1);
tl.to("#chipM", { opacity: 1, duration: 0.35 }, t0 + 0.5);

/* then the projection continues from their tip, drawing itself */
tl.to(proj, { opacity: 1, duration: 0.25 }, t1 - 0.2);
FX.fromTo(tl, proj, { strokeDashoffset: LEN }, { strokeDashoffset: 0, duration: Math.max(t3 - t1 + 1.0, 2.2), ease: "power1.in" }, t1 - 0.15);
tl.to("#chipP", { opacity: 1, duration: 0.35 }, t1 + 0.2);

FX.fromTo(tl, "#m20", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, t1 + 0.55);
FX.fromTo(tl, "#m40", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, t2 + 0.5);

tl.to("#kicker", { opacity: 1, duration: 0.42, ease: "power3.out" }, t3 + 0.3);
FX.camera(tl, { at: t2, scale: 1.05, y: -20, dur: Math.max(D - t2 - 0.2, 1), ease: "sine.inOut" });

HF.register("cw-projection", tl);
