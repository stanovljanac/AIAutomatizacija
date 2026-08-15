/* tk-letters-never-arrived — GSAP timeline for 021 s1 (HOOK HERO). Code assembles itself (the
 * machine is GOOD), then a remembered failure: one huge word, a wrong letter count, a red stamp.
 * The myth label rises and takes a gold slash; then the letters FALL AWAY and the sealed gold
 * capsule — the video's spine object — is left standing in their place.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-letters-never-arrived", width: 1920, height: 1080, frames: 360, beatLo: 0.0, beatHi: 0.25 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

// sentence beats: [0] "You've watched an AI write working code…get the letters…wrong."
// [1] "Everyone reads that as the machine being dumb."  [2] "It isn't."  [3] "The letters never arrived."
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.52), t0 + 4.6);
var t2 = Math.max(beatAt(2, 0.81), t1 + 2.4);
var t3 = Math.max(beatAt(3, 0.88), t2 + 0.7);

var WORD = String(props.word || "strawberry");
var LINES = Array.isArray(props.codeLines) && props.codeLines.length
  ? props.codeLines
  : ["def send_invoice(order):", "    total = sum(l.qty * l.price for l in order.lines)",
     "    pdf = render(TEMPLATE, order=order, total=total)", "    mail(order.customer.email, pdf)", "    return total"];

// ── build the code block (keyword tinting only — no library, no product, nothing to date it) ──
var codeEl = document.getElementById("code");
LINES.forEach(function (raw) {
  var span = document.createElement("span");
  span.className = "ln";
  span.textContent = raw;
  codeEl.appendChild(span);
});

// ── build the word, one span per letter, so the letters can fall away individually ──
var wordEl = document.getElementById("word");
WORD.split("").forEach(function (ch) {
  var s = document.createElement("span");
  s.textContent = ch;
  wordEl.appendChild(s);
});
var letters = wordEl.querySelectorAll("span");

document.getElementById("myth").textContent = props.myth || "it's just not that smart";
document.getElementById("count").textContent = props.wrongCount || "2 r's";
document.getElementById("stamp").textContent = "✕";
document.getElementById("title").textContent = props.title || "The letters never arrived.";

// ── resting state — the OPENING FRAME already shows the code card (D-060: a cut has no runway) ──
gsap.set("#codecard", { opacity: 1, y: 0, scale: 1 });
gsap.set(".ln", { opacity: 0, x: -18 * U });
gsap.set("#ok", { opacity: 0 });
gsap.set("#wordwrap", { opacity: 0, scale: 1.22 });
gsap.set(letters, { y: 0, rotation: 0, opacity: 1 });
gsap.set("#capsule", { opacity: 0, scale: 0.86 });
gsap.set(".capsule .sheen", { x: 0 });
gsap.set("#countrow", { opacity: 0, y: 18 * U });
gsap.set("#stamp", { opacity: 0, scale: 2.2, rotation: -22 });
gsap.set("#myth", { opacity: 0, y: 26 * U });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#title", { opacity: 0, y: 26 * U });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe — the only always-on motion
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0a — COMPETENCE. Five lines land fast and sure; the timer runs to 10s; a green tick. ──
LINES.forEach(function (_, i) {
  tl.to(".ln:nth-child(" + (i + 1) + ")", { opacity: 1, x: 0, duration: 0.2, ease: "power3.out" }, 0.12 + i * 0.16);
});
var clock = { v: 0 };
tl.to(clock, {
  v: 10, duration: 1.5, ease: "power1.out",
  onUpdate: function () { document.getElementById("timer").textContent = clock.v.toFixed(1) + "s"; },
}, 0.1);
tl.to("#ok", { opacity: 1, duration: 0.22, ease: "back.out(2)" }, 1.62);

// ── beat 0b — THE BEAT CHANGE. The code slides off; one word stands alone, huge. ──
tl.to("#codecard", { x: -420 * U, opacity: 0, duration: 0.42, ease: "power2.in" }, 2.5);
tl.to("#wordwrap", { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, 2.62);
tl.to("#countrow", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, 3.5);
// the red correction — small, one hit, no alarm siren
tl.to("#stamp", { opacity: 1, scale: 1, rotation: -8, duration: 0.3, ease: "back.out(2.4)" }, 4.2);
tl.set("#count", { color: "#7d8fa3", textDecoration: "line-through" }, 4.35);

// ── beat 1 — the myth rises ──
tl.to("#myth", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t1);

// ── beat 2 — "It isn't." the gold slash strikes it through, hard and fast ──
tl.to("#slash", { scaleX: 1, duration: 0.22, ease: "power4.out" }, t2);
tl.to("#myth", { opacity: 0.35, duration: 0.3, ease: "sine.out" }, t2 + 0.16);

// ── beat 3 — the letters FALL AWAY; the sealed capsule is left standing ──
tl.to(["#countrow", "#mythwrap"], { opacity: 0, duration: 0.24, ease: "power2.in" }, t3 - 0.12);
letters.forEach(function (el, i) {
  tl.to(el, {
    y: 190 * U, rotation: (i % 2 ? 9 : -9), opacity: 0, duration: 0.44, ease: "power2.in",
  }, t3 + i * 0.028);
});
tl.to("#capsule", { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.7)" }, t3 + 0.22);
// one sheen pass — the surface is smooth and CLOSED; nothing is legible inside
tl.fromTo(".capsule .sheen", { x: -260 * U }, { x: 760 * U, duration: 0.9, ease: "power2.inOut" }, t3 + 0.4);
tl.to("#title", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t3 + 0.3);
// slow push-in on the held frame — never a static title-card hold
tl.fromTo("#root", { scale: 1 }, { scale: 1.035, duration: Math.max(D - t3 - 0.3, 0.6), ease: "sine.out" }, t3 + 0.3);

HF.register("tk-letters-never-arrived", tl);
