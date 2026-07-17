/* gray-pile-flaw — GSAP timeline for 012 s05. Cards rain into a tilting pile (counter → 60),
 * empty checkpoints blink red, pile FREEZES on "hold that thought". Silent, deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ value?, label?, source?, questions?[] }
 */
var S = HF.scene({ id: "gray-pile-flaw", width: 1920, height: 1080, frames: 600, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

var target = 60;
if (props.value != null) { var m = String(props.value).match(/(\d+)/); if (m) target = parseInt(m[1], 10); }
if (props.source) document.getElementById("csource").textContent = String(props.source);
var qs = Array.isArray(props.questions) ? props.questions : null;
if (qs && qs.length >= 3) {
  document.querySelector("#slot1 .slot-q").textContent = String(qs[0]);
  document.querySelector("#slot2 .slot-q").textContent = String(qs[1]);
  document.querySelector("#slot3 .slot-q").textContent = String(qs[2]);
}

// build the pile — 14 cards, deterministic offsets (no Math.random)
var pile = document.getElementById("pile");
var offs = [
  [0, 0, -2], [8, -1, 3], [-10, -2, -4], [4, -3, 2], [-6, -4, 5],
  [12, -5, -3], [-3, -6, 1], [9, -7, -5], [-12, -8, 4], [2, -9, -1],
  [-8, -10, 6], [11, -11, -2], [-4, -12, 3], [6, -13, -6],
];
var cards = [];
for (var i = 0; i < offs.length; i++) {
  var c = document.createElement("div");
  c.className = "pcard";
  var x = offs[i][0] * 6 * U;
  var y = 620 * U - 176 * U - i * 34 * U;
  c.style.transform = "translate(" + x + "px," + y + "px) rotate(" + offs[i][2] + "deg)";
  c.setAttribute("data-x", String(x));
  c.setAttribute("data-y", String(y));
  c.setAttribute("data-r", String(offs[i][2]));
  pile.appendChild(c);
  cards.push(c);
}

// 3 sentence beats
var tRain = beatAt(0, 0.03);
var tSlots = Math.max(beatAt(1, 0.38), tRain + 1.6);
var tHold = Math.max(beatAt(2, 0.74), tSlots + 1.6);

var tl = gsap.timeline({ paused: true });

// beat 0 — cards rain in fast; the counter ticks with them
var rainSpan = Math.max(1.6, tSlots - tRain - 0.3);
for (var ci = 0; ci < cards.length; ci++) {
  var el = cards[ci];
  var at = tRain + (rainSpan * ci) / cards.length;
  tl.fromTo(el,
    { opacity: 0, y: parseFloat(el.getAttribute("data-y")) - 380 * U, rotate: parseFloat(el.getAttribute("data-r")) - 10 },
    { opacity: 1, y: parseFloat(el.getAttribute("data-y")), rotate: parseFloat(el.getAttribute("data-r")), duration: 0.4, ease: "power2.in" },
    at);
}
var cObj = { v: 0 };
var cEl = document.getElementById("cval");
tl.from("#counter", { opacity: 0, x: 60 * U, duration: 0.5, ease: "power3.out" }, tRain);
tl.to(cObj, { v: target, duration: rainSpan, ease: "power1.inOut", onUpdate: function () { cEl.textContent = String(Math.round(cObj.v)); } }, tRain + 0.1);
tl.to("#csource", { opacity: 1, duration: 0.35, ease: "power2.out" }, tRain + rainSpan * 0.8);

// slow precarious tilt begins once the pile is up (frozen later)
tl.to("#pilewrap", { rotate: 4.5, duration: Math.max(1.2, tHold - tRain - 0.8), ease: "power1.in" }, tRain + rainSpan * 0.7);

// beat 1 — the three EMPTY checkpoints blink red as the voice lists them
var slotSpan = Math.max(1.2, tHold - tSlots - 0.3);
var slots = ["#slot1", "#slot2", "#slot3"];
for (var si = 0; si < 3; si++) {
  var sat = tSlots + (slotSpan * si) / 3;
  tl.fromTo(slots[si], { opacity: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.8)" }, sat);
  tl.to(slots[si], { borderColor: "rgba(255,92,92,0.25)", duration: 0.22, ease: "power1.inOut" }, sat + 0.45);
  tl.to(slots[si], { borderColor: "rgba(255,92,92,0.9)", duration: 0.22, ease: "power1.inOut" }, sat + 0.7);
}

// beat 2 — FREEZE: the tilt jolts to a stop, vignette closes in, HOLD chip stamps
tl.to("#pilewrap", { rotate: 6.2, duration: 0.18, ease: "power3.out" }, tHold);
tl.to("#pilewrap", { rotate: 5.8, duration: 0.3, ease: "back.out(3)" }, tHold + 0.2);
tl.to("#vignette", { opacity: 1, duration: 0.6, ease: "power2.out" }, tHold + 0.1);
tl.fromTo("#hold", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.32, ease: "power3.in" }, cl(tHold + 0.35, tHold, D - 0.3));

HF.register("gray-pile-flaw", tl);
