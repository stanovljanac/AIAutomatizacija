/* tk-names — GSAP timeline for 021 s6 (THE HUMAN BEAT). Three name cards land one per sentence and
 * split into their MEASURED chunks; on the last line they sit level and one gold underline ties them
 * together: frequency, not merit. Warm, no ranking, no red.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-names", width: 1920, height: 1080, frames: 258, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var NAMES = Array.isArray(props.names) && props.names.length
  ? props.names
  : [
      { label: "Sarah", parts: [" Sarah"], count: "1" },
      { label: "Okonkwo", parts: [" Ok", "onk", "wo"], count: "3" },
      { label: "Kowalski", parts: [" Kow", "als", "ki"], count: "3" },
    ];

var rowEl = document.getElementById("row");
var cards = [];
NAMES.forEach(function (n, i) {
  var card = document.createElement("div");
  card.className = "namecard";
  card.id = "nc" + i;
  var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = n.label;
  var parts = document.createElement("div"); parts.className = "parts";
  (n.parts || []).forEach(function (p) {
    var s = document.createElement("span"); s.className = "pt"; s.textContent = p; parts.appendChild(s);
  });
  var cnt = document.createElement("div"); cnt.className = "cnt"; cnt.textContent = n.count;
  card.appendChild(nm); card.appendChild(parts); card.appendChild(cnt);
  rowEl.appendChild(card);
  cards.push({ card: card, nm: nm, parts: parts.querySelectorAll(".pt"), cnt: cnt });
});

document.getElementById("underlabel").textContent = props.underline || "frequency, not merit";
document.getElementById("chip").textContent = props.sourceChip || "tiktoken · o200k_base";

// sentence beats: [0] "Sarah is one chunk." [1] "Okonkwo is three." [2] "Kowalski is three."
// [3] "That's not a judgment about the name — it's just how often it showed up."
var t = [beatAt(0, 0.0), beatAt(1, 0.2), beatAt(2, 0.42), beatAt(3, 0.6)];

gsap.set(".namecard", { opacity: 0, y: 40 * U, scale: 0.94 });
gsap.set(".pt", { opacity: 0, scale: 0.7 });
gsap.set(".cnt", { opacity: 0 });
gsap.set("#under", { scaleX: 0 });
gsap.set("#underlabel", { opacity: 0, y: 14 * U });
gsap.set("#chip", { opacity: 0 });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);
tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.2);

cards.forEach(function (c, i) {
  var at = t[i];
  // the card lands…
  tl.to(c.card, { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: "back.out(1.7)" }, at);
  // …and splits into its measured pieces. ONE piece for Sarah, three for the others — same type
  // size, same weight, same position: only the piece COUNT differs.
  c.parts.forEach(function (p, k) {
    tl.to(p, { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(2.2)" }, at + 0.34 + k * 0.13);
  });
  tl.to(c.cnt, { opacity: 1, duration: 0.24, ease: "power2.out" }, at + 0.34 + c.parts.length * 0.13);
});

// the last line — the three cards sit level and one gold underline ties them together
tl.to(".namecard", { y: 0, scale: 1, duration: 0.3, ease: "power2.out" }, t[3]);
tl.to("#under", { scaleX: 1, duration: 0.5, ease: "power3.out" }, t[3] + 0.1);
tl.to("#underlabel", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t[3] + 0.35);
// a slow settle push — never a static hold
tl.fromTo("#row", { scale: 1 }, { scale: 1.02, duration: Math.max(D - t[3], 0.8), ease: "sine.out" }, t[3]);

HF.register("tk-names", tl);
