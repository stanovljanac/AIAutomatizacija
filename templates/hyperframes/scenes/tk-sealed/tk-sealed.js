/* tk-sealed — GSAP timeline for the 021 spine object: long s7 ("arrive"), s8 ("reconstruct"),
 * s21 ("limit") and Short s2 ("short"). The capsule is the SAME object at the same size and position
 * in every phase — that is what makes the s7→s8 boundary a carry rather than a new card.
 * Deterministic, seek-driven; the zoom is a push, never a tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-sealed", width: 1920, height: 1080, frames: 426, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = String(props.phase || "arrive");
var QUESTION = props.question || "How many r's are in strawberry?";
var QCHUNKS = Array.isArray(props.chunks) && props.chunks.length ? props.chunks : ["How", " many", " r", "'s", " are", " in"];
var SEALED = props.sealed || " strawberry";
var LETTERS = Array.isArray(props.ghostLetters) && props.ghostLetters.length
  ? props.ghostLetters
  : String(SEALED).trim().split("");

/** Append one child per item and return the NodeList. */
function build(host, items, cls, text) {
  items.forEach(function (it) {
    var s = document.createElement("span");
    s.className = cls;
    s.textContent = text ? text(it) : it;
    host.appendChild(s);
  });
  return host.querySelectorAll("." + cls.split(" ")[0]);
}

// the ghost letters that try to resolve INSIDE the capsule and never do
var ghosts = build(document.getElementById("ghosts"), LETTERS, "gh");
document.getElementById("chip").textContent = props.sourceChip || "";
document.getElementById("caption").textContent = props.caption || "";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// everything starts hidden; each phase turns on exactly what it needs
gsap.set(["#qwrap", "#qcaps", "#guessrow", "#guesslabel", "#marks", "#chainwrap", "#caption", "#chip", "#seallabel", "#dot"], { opacity: 0 });
gsap.set("#ghosts", { opacity: 0 });
gsap.set("#sealstage", { scale: 1 });
gsap.set("#seal", { opacity: 0, scale: 0.9 });
gsap.set(".mark", { opacity: 0, scale: 0.6 });

/** The tokenizer running ON the typed line: it slices into capsules, the sealed one stays whole. */
function sliceQuestion(at) {
  var caps = build(document.getElementById("qcaps"), QCHUNKS.concat([SEALED]), "qc");
  tl.to("#qtext", { opacity: 0, duration: 0.18 }, at);
  tl.to("#caret", { opacity: 0, duration: 0.12 }, at);
  tl.to("#qcaps", { opacity: 1, duration: 0.01 }, at + 0.18);
  caps.forEach(function (el, i) {
    tl.fromTo(el, { opacity: 0, scaleY: 0.6 }, { opacity: 1, scaleY: 1, duration: 0.2, ease: "back.out(2)" }, at + 0.2 + i * 0.09);
  });
  return caps;
}

if (PHASE === "arrive" || PHASE === "short") {
  var isShort = PHASE === "short";
  // arrive : [0] "Now the part that explains the failures." [1] "Ask an AI how many r's…"
  //          [2] "…arrives as exactly one chunk…" [3] "Not ten letters."
  // short  : [0] "Ask it how many r's…" [1] "…the whole word arrives as one chunk."
  //          [2] "One sealed symbol — not ten letters." [3] "You asked about something never delivered."
  var a0 = beatAt(0, 0.0);
  var a1 = Math.max(beatAt(1, isShort ? 0.21 : 0.21), a0 + 1.6);
  var a2 = Math.max(beatAt(2, isShort ? 0.56 : 0.42), a1 + 2.0);
  var a3 = Math.max(beatAt(3, isShort ? 0.83 : 0.93), a2 + 2.4);

  var qtext = document.getElementById("qtext");
  qtext.textContent = "";
  gsap.set("#qwrap", { opacity: 1 });
  gsap.set("#caret", { opacity: 1 });
  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.3);
  // the caret blinks while the question types itself, exactly as a human would write it
  tl.to("#caret", { opacity: 0.15, duration: 0.35, yoyo: true, repeat: 6, ease: "steps(1)" }, 0);
  var typed = { n: 0 };
  tl.to(typed, {
    n: QUESTION.length, duration: Math.max(a1 - a0 - 0.35, 0.9), ease: "none",
    onUpdate: function () { qtext.textContent = QUESTION.slice(0, Math.round(typed.n)); },
  }, a0 + 0.15);

  // the tokenizer runs ON that line
  var caps = sliceQuestion(a1 + 0.25);
  var sealedCap = caps[caps.length - 1];

  // …and the sealed capsule takes the stage: the other pieces dim away, this one grows
  tl.to("#seal", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, a2);
  for (var i = 0; i < caps.length - 1; i++) {
    tl.to(caps[i], { opacity: 0.18, duration: 0.4, ease: "sine.out" }, a2);
  }
  tl.to(sealedCap, { opacity: 0, scale: 1.4, duration: 0.35, ease: "power2.in" }, a2);
  tl.to("#seallabel", { opacity: 1, duration: 0.3 }, a2 + 0.5);
  document.getElementById("seallabel").textContent = "one chunk";
  // the space in front, rendered — the cause is invisible, so we draw it
  tl.fromTo("#dot", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, a2 + 0.9);
  tl.to("#dot", { scale: 1.5, opacity: 0.5, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, a2 + 1.25);
  // PUSH IN — the way you zoom to read something. And there is nothing to read.
  tl.to("#sealstage", { scale: 1.34, duration: Math.max(a3 - a2 - 0.3, 1.6), ease: "power1.inOut" }, a2 + 0.5);
  tl.fromTo("#sheen", { x: -300 * U }, { x: 900 * U, duration: 1.4, ease: "power2.inOut" }, a2 + 0.7);

  // "Not ten letters." — ten ghost letters try to resolve inside, and fade before they form.
  // They START HALF A BEAT EARLY on purpose: the attempt has to be over before the cut, or the last
  // frame still holds ghosts inside a capsule that s8 opens on empty (it would break the carry).
  var gAt = Math.max(a3 - 0.5, a2 + 1.2);
  tl.to("#ghosts", { opacity: 1, duration: 0.2 }, gAt);
  ghosts.forEach(function (el, k) {
    tl.fromTo(el, { opacity: 0, filter: "blur(" + 12 * U + "px)", y: 8 * U },
      { opacity: 0.9, filter: "blur(" + 5 * U + "px)", y: 0, duration: 0.26, ease: "power2.out" }, gAt + 0.1 + k * 0.03);
    tl.to(el, { opacity: 0, filter: "blur(" + 14 * U + "px)", duration: 0.35, ease: "power2.in" }, gAt + 0.62 + k * 0.025);
  });
  tl.to("#caption", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, a3 + 0.15);
  if (isShort) {
    // the Short lands the long cut's s8 line here, as a stamp. Two elements cross-faded, never a text
    // swap in a callback: the capture engine SEEKS, so a `tl.add(callback)` may never fire.
    var cap2 = document.createElement("div");
    cap2.className = "caption";
    cap2.id = "caption2";
    cap2.textContent = props.neverDelivered || "Never delivered.";
    document.getElementById("root").appendChild(cap2);
    gsap.set(cap2, { opacity: 0 });
    tl.to("#caption", { opacity: 0, duration: 0.25 }, a3 + 1.5);
    tl.fromTo(cap2, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, a3 + 1.8);
  }
} else if (PHASE === "reconstruct") {
  // [0] "The thing you asked about was never delivered."  ← then the 1.2s SCRIPTED PAUSE
  // [1] "To answer at all, the model has to reconstruct the spelling…" [2] "Often it manages."
  // [3] "When it doesn't, that isn't stupidity…"
  var r0 = beatAt(0, 0.0);
  var r1 = Math.max(beatAt(1, 0.22), r0 + 3.0);
  var r2 = Math.max(beatAt(2, 0.6), r1 + 4.0);
  var r3 = Math.max(beatAt(3, 0.69), r2 + 1.2);

  // OPENS on the capsule alone, at the size s7 left it (carry)
  gsap.set("#seal", { opacity: 1, scale: 1 });
  gsap.set("#sealstage", { scale: 1.34 });
  gsap.set("#dot", { opacity: 1 });
  tl.to("#caption", { opacity: 1, duration: 0.34, ease: "power3.out" }, r0 + 0.2);
  // THE DESIGNED SILENCE — nothing moves but a slow push-in. No sting, no text.
  tl.to("#sealstage", { scale: 1.46, duration: Math.max(r1 - r0 - 0.2, 1.4), ease: "sine.inOut" }, r0 + 0.9);

  // the model reconstructs the spelling from what it learned ABOUT the chunk — outside it, from memory
  var guesses = build(document.getElementById("guessrow"), LETTERS, "gl");
  tl.to("#caption", { opacity: 0, duration: 0.3 }, r1 - 0.2);
  tl.to("#sealstage", { scale: 1.05, y: 40 * U, duration: 0.6, ease: "power2.inOut" }, r1);
  tl.to("#guessrow", { opacity: 1, duration: 0.01 }, r1 + 0.2);
  guesses.forEach(function (el, k) {
    tl.fromTo(el, { opacity: 0, y: 120 * U, scale: 0.7 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.8)" }, r1 + 0.25 + k * 0.16);
  });
  tl.to("#guesslabel", { opacity: 1, duration: 0.3 }, r1 + 0.9);
  // one of them is visibly uncertain — it never settles
  var uncertain = guesses[Math.min(Number(props.uncertainIndex) || 7, guesses.length - 1)];
  tl.to(uncertain, { opacity: 0.35, duration: 0.28, yoyo: true, repeat: 9, ease: "sine.inOut" }, r1 + 2.6);
  tl.to(uncertain, { borderColor: "rgba(255,176,32,0.95)", duration: 0.3 }, r1 + 2.6);

  // "Often it manages." — the green tick. "When it doesn't" — the red cross, SAME SIZE, beside it.
  document.getElementById("oklabel").textContent = props.okLabel || "often it manages";
  document.getElementById("nolabel").textContent = props.notOkLabel || "when it doesn't";
  tl.to("#marks", { opacity: 1, duration: 0.01 }, r2 - 0.1);
  tl.to("#markok", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2.2)" }, r2);
  tl.to("#markno", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2.2)" }, r3);
  // close on the two marks LEVEL with each other — neither dominant
  tl.to(["#markok", "#markno"], { y: 0, duration: 0.4, ease: "power2.out" }, r3 + 0.4);
} else if (PHASE === "limit") {
  // [0] "Chunking isn't the whole story…" [1] "Models can work around their own chunks…"
  // [2] "But that's a reconstruction, not a look." [3] "…exactly where a confident guess gets in."
  var l0 = beatAt(0, 0.0);
  var l1 = Math.max(beatAt(1, 0.25), l0 + 2.4);
  var l2 = Math.max(beatAt(2, 0.66), l1 + 5.0);
  var l3 = Math.max(beatAt(3, 0.8), l2 + 1.8);

  var SPELL = Array.isArray(props.spellOut) && props.spellOut.length ? props.spellOut : LETTERS;
  var links = build(document.getElementById("chain"), SPELL, "lk");

  gsap.set("#seal", { opacity: 1, scale: 1 });
  gsap.set("#sealstage", { scale: 0.8, y: -170 * U });
  gsap.set("#marks", { opacity: 1, top: "40%" });
  // the tick REPLACES the cross in place: stack them so the flip is a change of verdict, not a move
  gsap.set([".mark"], { position: "absolute", left: "50%", xPercent: -50 });
  gsap.set("#markno", { opacity: 1, scale: 1 });
  gsap.set("#markok", { opacity: 0, scale: 0.6 });
  gsap.set("#chainwrap", { opacity: 1, top: "52%" });
  document.getElementById("nolabel").textContent = "";
  document.getElementById("oklabel").textContent = "";
  document.getElementById("seallabel").textContent = props.solidLabel || "what arrived";
  document.getElementById("chainlabel").textContent = props.dottedLabel || "what was reconstructed";
  tl.to("#seallabel", { opacity: 1, duration: 0.3 }, l0 + 0.3);

  // the workaround genuinely WORKS — show it working: the chain unrolls, letter by letter
  links.forEach(function (el, k) {
    tl.fromTo(el, { opacity: 0, x: -30 * U, scale: 0.8 },
      { opacity: 1, x: 0, scale: 1, duration: 0.26, ease: "back.out(2)" }, l1 + 0.4 + k * 0.3);
  });
  // …and the red cross flips to a green tick
  tl.to("#markno", { opacity: 0, scale: 0.6, duration: 0.24, ease: "power2.in" }, l1 + 3.6);
  tl.to("#markok", { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.4)" }, l1 + 3.7);

  // THE REFRAME — the chain is redrawn DOTTED: rebuilt, not received. Property tweens only.
  tl.to(links, {
    backgroundColor: "rgba(0,0,0,0)", borderStyle: "dashed", borderColor: "rgba(255,176,32,0.55)",
    color: "#ffd37a", duration: 0.3, stagger: 0.03, ease: "power2.out",
  }, l2);
  tl.fromTo(links, { scale: 1 }, { scale: 1.06, duration: 0.2, yoyo: true, repeat: 1, stagger: 0.03, ease: "sine.inOut" }, l2);
  tl.to("#chainlabel", { opacity: 1, duration: 0.3 }, l2 + 0.3);
  tl.to("#caption", { opacity: 1, duration: 0.34, ease: "power3.out" }, l2 + 0.6);

  // and a reconstruction is exactly where a confident guess gets in — one link quietly turns wrong
  var badIdx = Math.min(Number(props.wrongIndex) || 6, links.length - 1);
  var bad = links[badIdx];
  // the wrong letter is a SECOND span cross-faded over the right one — no callback, no text swap
  var letter = bad.textContent;
  bad.textContent = "";
  var right = document.createElement("span");
  right.textContent = letter;
  bad.appendChild(right);
  var wrong = document.createElement("span");
  wrong.className = "alt";
  wrong.textContent = "n";
  bad.appendChild(wrong);
  gsap.set(wrong, { position: "absolute", opacity: 0 });
  var q = document.createElement("span"); q.className = "q"; q.textContent = "?"; bad.appendChild(q);
  tl.to(bad, { borderColor: "rgba(255,176,32,0.95)", color: "#ffb020", duration: 0.4 }, l3 + 0.2);
  tl.to(right, { opacity: 0, duration: 0.2 }, l3 + 0.5);
  tl.to(wrong, { opacity: 1, duration: 0.2 }, l3 + 0.55);
  tl.to(q, { opacity: 1, duration: 0.3, ease: "back.out(2)" }, l3 + 0.6);
  // understated: no alarm, just a slow settle
  tl.fromTo("#root", { scale: 1 }, { scale: 1.02, duration: Math.max(D - l3, 1), ease: "sine.out" }, l3);
}

HF.register("tk-sealed", tl);
