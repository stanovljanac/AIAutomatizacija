/* wh-takes-keeps — GSAP timeline for 014 s4 THE REFRAME. An answered echo up top, then the QUOTABLE
 * citation line lands and HOLDS (screenshotable). A clean split: the left "AI TAKES · the typing" card
 * crumbles to gray dust; the right "YOU KEEP · the judgment" node stays lit gold, an amber '?' resolving
 * to a green check. Deterministic, seek-driven; no Math.random / Date.now.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "wh-takes-keeps", width: 1080, height: 1920, frames: 275, beatLo: 0.02, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "the real answer to will AI take your job" [1] "it won't — just the part of you that was a slow machine" [2] "it takes the typing. you keep the judgment."
var tSetup = beatAt(0, 0.0);
var tQuote = Math.max(beatAt(1, 0.38), tSetup + 1.2);
var tSplit = Math.max(beatAt(2, 0.74), tQuote + 2.2);

// ── build deterministic crumble dust inside the typing card ──
var takes = document.getElementById("takes");
var DUST = [[18, 74], [34, 82], [50, 70], [66, 84], [80, 76], [26, 90], [58, 92], [42, 78], [72, 66], [12, 88]];
var dusts = DUST.map(function (p) {
  var d = document.createElement("div"); d.className = "dust";
  d.style.left = p[0] + "%"; d.style.top = p[1] + "%";
  takes.appendChild(d); return d;
});

// ── resting state ──
gsap.set("#echo", { opacity: 0, y: -12 * U });
gsap.set("#strbar", { scaleX: 0 });
gsap.set("#quote", { opacity: 0, x: -22 * U });
gsap.set("#takes", { opacity: 0, y: 26 * U });
gsap.set("#keeps", { opacity: 0, y: 26 * U });
gsap.set(dusts, { opacity: 0, scale: 1 });
gsap.set("#g-ok", { opacity: 0 });
gsap.set("#keeps", { });

var tl = gsap.timeline({ paused: true });

// ── beat 0 — the answered echo (the question, struck through = answered) ──
tl.to("#echo", { opacity: 0.9, y: 0, duration: 0.5, ease: "power3.out" }, tSetup);
tl.to("#strbar", { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, tSetup + 0.5);

// ── beat 1 — the QUOTE citation lands (held) + the split appears; the typing card starts to crumble ──
tl.to("#quote", { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, tQuote);
tl.to("#echo", { opacity: 0.45, duration: 0.4 }, tQuote); // recede the echo, the quote owns the frame
tl.to("#takes", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tQuote + 0.3);
tl.to("#keeps", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tQuote + 0.42);
// the judgment card breathes a steady gold glow (it STAYS)
tl.to("#keeps", { boxShadow: "0 0 " + (60 * U) + "px rgba(255,176,32,0.4)", duration: 1.0, yoyo: true, repeat: 5, ease: "sine.inOut" }, tQuote + 0.6);

// ── beat 2 — "it takes the typing / you keep the judgment": typing crumbles to gray; judgment resolves ──
// the typing chips break off and fall
var chips = takes.querySelectorAll(".chip");
chips.forEach(function (c, i) {
  tl.to(c, { y: 40 * U + i * 8 * U, rotation: (i % 2 ? 1 : -1) * 16, opacity: 0, duration: 0.6, ease: "power2.in" }, tSplit + i * 0.08);
});
// dust falls
dusts.forEach(function (d, i) {
  tl.to(d, { opacity: 0.9, duration: 0.1 }, tSplit + 0.1 + i * 0.02);
  tl.to(d, { y: (60 + (i % 4) * 22) * U, x: ((i % 2 ? 1 : -1) * (10 + i * 2)) * U, rotation: (i % 2 ? 1 : -1) * 40, opacity: 0, duration: 0.75, ease: "power2.in" }, tSplit + 0.12 + i * 0.02);
});
// the typing card desaturates + dims (it's been taken)
tl.to("#takes", { filter: "grayscale(1) brightness(0.7)", duration: 0.7, ease: "power2.inOut" }, tSplit);
tl.to("#takes", { opacity: 0.55, duration: 0.7, ease: "power2.inOut" }, tSplit + 0.3);
// the judgment card locks solid gold + the '?' resolves to a green check (human resolves the odd one)
tl.to("#keeps", { scale: 1.03, duration: 0.4, ease: "back.out(1.8)" }, tSplit + 0.15);
tl.to("#keeps .val", { textShadow: "0 0 " + (44 * U) + "px rgba(255,176,32,0.6)", duration: 0.9, yoyo: true, repeat: 2, ease: "sine.inOut" }, tSplit + 0.3);
tl.to("#g-ask", { opacity: 0, duration: 0.2 }, tSplit + 0.7);
tl.to("#g-ok", { opacity: 1, duration: 0.24, ease: "power2.out" }, tSplit + 0.74);
tl.to("#q1", { backgroundColor: "#35d07f", borderColor: "#35d07f", duration: 0.3, ease: "power2.out" }, tSplit + 0.7);
// slow push-in throughout (the reframe holds)
tl.fromTo("#camera", { scale: 1.0 }, { scale: 1.04, duration: cl(D - tQuote, 2, 8), ease: "power1.inOut" }, tQuote);

HF.register("wh-takes-keeps", tl);
