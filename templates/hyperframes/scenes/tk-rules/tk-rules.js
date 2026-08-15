/* tk-rules — GSAP timeline for 021 s17-s20 (THE PAYOFF). The numbered rail is the through-line and
 * the only static element; each phase lights one slot and DEMONSTRATES the rule on the stage.
 * Deterministic, seek-driven; flat, face-on. No product is named anywhere — these are patterns.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-rules", width: 1920, height: 1080, frames: 188, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = Number(props.phase) || 1;
var RULES = Array.isArray(props.rules) && props.rules.length
  ? props.rules : ["Not the guess. Code.", "Can it even see this?", "A cost decision."];
var ACTIVE = Number(props.active) || 1;

// the rail — built identically in every phase, so it is the same object across three boundaries
var railEl = document.getElementById("rail");
var slots = RULES.map(function (t, i) {
  var s = document.createElement("div");
  s.className = "slot" + (i + 1 < ACTIVE ? " lit" : "");
  var n = document.createElement("span"); n.className = "n"; n.textContent = String(i + 1);
  var tx = document.createElement("span"); tx.className = "t"; tx.textContent = t;
  s.appendChild(n); s.appendChild(tx); railEl.appendChild(s);
  return s;
});
var activeSlot = slots[ACTIVE - 1];

document.getElementById("headline").textContent = props.headline || "";

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.04, duration: D, ease: "sine.inOut" }, 0);

/** Light one rail slot — a property tween, so a seek always lands on the right state. */
function light(el, at) {
  tl.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" }, at);
  tl.to(el.querySelector(".n"), { borderColor: "#ffb020", color: "#ffd37a", duration: 0.3 }, at);
  tl.to(el.querySelector(".t"), { color: "#eaf1f8", duration: 0.3 }, at);
  tl.fromTo(el, { x: -12 * U }, { x: 0, duration: 0.34, ease: "back.out(2)" }, at);
}

gsap.set(["#tasks", "#guess", "#codeblock", "#answer", "#input", "#dismiss", "#lens", "#stamp", "#dial"], { opacity: 0 });

if (PHASE === 1) {
  // [0] "So what do you do with this?" [1] "Three things." [2] "First: stop handing character-exact
  // work to the guess."
  var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.24), t0 + 1.0), t2 = Math.max(beatAt(2, 0.45), t1 + 0.9);
  gsap.set(slots, { opacity: 0, x: -30 * U });
  tl.to(slots, { opacity: 0.28, x: 0, duration: 0.3, stagger: 0.08, ease: "power3.out" }, t1);
  light(activeSlot, t2);
  tl.fromTo("#headline", { opacity: 0, y: 30 * U }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t2 + 0.15);
} else if (PHASE === 2) {
  // [0] "Counting letters, hard character limits, reversing text, exact find and replace — that's a
  // job for code." [1] "Ask for the code, then run it."
  var u0 = beatAt(0, 0.0), u1 = Math.max(beatAt(1, 0.82), u0 + 5.4);
  var TASKS = Array.isArray(props.tasks) && props.tasks.length
    ? props.tasks : ["count the r's", "exactly 280 characters", "reverse this string", "find and replace"];
  var host = document.getElementById("tasks");
  TASKS.forEach(function (t) {
    var s = document.createElement("span"); s.className = "task"; s.textContent = t; host.appendChild(s);
  });
  var tasks = host.querySelectorAll(".task");
  document.getElementById("codeline").textContent = props.codeLine || "len(re.findall('r', w))";
  document.getElementById("result").textContent = props.result || "3";

  // opens on the rail with slot 1 ALREADY lit — s18 continues s17, it does not re-introduce the rule
  activeSlot.className = "slot lit";
  gsap.set("#tasks", { opacity: 1 });
  gsap.set("#guess", { opacity: 1 });
  gsap.set("#headline", { opacity: 0 });
  // the tasks stack ON the capsule, which SAGS under them
  tasks.forEach(function (el, i) {
    tl.fromTo(el, { opacity: 0, y: -50 * U, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.8)" }, u0 + 0.25 + i * 0.85);
    tl.to("#guess", { scaleY: 1 - (i + 1) * 0.055, y: (i + 1) * 6 * U, duration: 0.3, ease: "power2.out" }, u0 + 0.45 + i * 0.85);
  });
  // …then they slide OFF and DOCK into the code block, which returns one hard number
  tl.to("#codeblock", { opacity: 1, duration: 0.3 }, u0 + 3.9);
  tl.to(tasks, { x: 560 * U, opacity: 0, duration: 0.5, stagger: 0.07, ease: "power2.in" }, u0 + 4.1);
  tl.to("#guess", { scaleY: 1, y: 0, opacity: 0.35, duration: 0.4, ease: "power2.out" }, u0 + 4.4);
  tl.to("#result", { opacity: 1, duration: 0.3, ease: "back.out(2.4)" }, u1);
  tl.fromTo("#codeblock", { borderColor: "rgba(61,220,151,0.35)" },
    { borderColor: "rgba(61,220,151,0.9)", duration: 0.4, yoyo: true, repeat: 1 }, u1);
  tl.fromTo("#headline", { opacity: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, u1 + 0.5);
} else if (PHASE === 3) {
  // [0] "Second: when a model fails at something absurdly easy, don't argue with it."
  // [1] "Ask whether it can even see what you're asking about."
  // [2] "That reframe fixes more than a better prompt does."
  var v0 = beatAt(0, 0.0), v1 = Math.max(beatAt(1, 0.47), v0 + 3.4), v2 = Math.max(beatAt(2, 0.72), v1 + 2.0);
  document.getElementById("answertext").textContent = props.answer || "There are 2 r's in strawberry.";
  document.getElementById("inputtext").textContent = props.input || "How many r's are in strawberry?";
  document.getElementById("dismiss").textContent = props.dismissed || "write a better prompt";
  document.getElementById("stamp").textContent = props.headline || "CAN IT SEE THIS?";
  gsap.set("#headline", { opacity: 0 });

  tl.to("#answer", { opacity: 1, duration: 0.3 }, v0 + 0.1);
  tl.to("#lens", { opacity: 1, duration: 0.3 }, v0 + 0.4);
  // arguing with the answer: it just repeats, and the lens jitters over it
  tl.to("#lens", { x: -40 * U, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, v0 + 0.7);
  tl.fromTo("#answer", { x: 0 }, { x: 8 * U, duration: 0.12, yoyo: true, repeat: 5, ease: "sine.inOut" }, v0 + 1.6);
  tl.to("#dismiss", { opacity: 1, duration: 0.3 }, v0 + 2.1);
  tl.to("#dismiss", { opacity: 0, y: 16 * U, duration: 0.5, ease: "power2.in" }, v0 + 3.0);

  // THE TURN — the movement is the beat
  tl.to("#input", { opacity: 1, duration: 0.3 }, v1 - 0.2);
  tl.to("#lens", { x: -300 * U, y: 300 * U, rotation: -20, duration: 0.9, ease: "power2.inOut" }, v1);
  tl.to("#answer", { opacity: 0.25, duration: 0.5 }, v1 + 0.2);
  tl.to("#input", { borderColor: "rgba(255,176,32,0.8)", duration: 0.4 }, v1 + 0.7);
  light(activeSlot, v1 + 0.9);

  tl.fromTo("#stamp", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.36, ease: "back.out(2)" }, v2);
  tl.to("#lens", { opacity: 0, duration: 0.4 }, v2 + 0.5);
} else {
  // [0] "Third: if you're paying per token, the language and the formatting you write in are a cost
  // decision." [1] "Not a style one."
  var w0 = beatAt(0, 0.0), w1 = Math.max(beatAt(1, 0.88), w0 + 4.4);
  var TG = Array.isArray(props.toggles) && props.toggles.length ? props.toggles : ["language", "formatting"];
  var thost = document.getElementById("toggles");
  TG.forEach(function (t) {
    var s = document.createElement("span"); s.className = "tg";
    var k = document.createElement("span"); k.className = "knob";
    s.appendChild(k); s.appendChild(document.createTextNode(t)); thost.appendChild(s);
  });
  var knobs = thost.querySelectorAll(".knob");
  gsap.set("#headline", { opacity: 0 });

  tl.to("#dial", { opacity: 1, duration: 0.34, ease: "power3.out" }, w0 + 0.2);
  light(activeSlot, w0 + 0.5);
  // a dial, not a lecture: flicking a toggle visibly moves the number
  var c = { v: 0.42 };
  function flick(i, at, to) {
    tl.to(knobs[i], { backgroundColor: "#ffb020", x: 6 * U, duration: 0.2, ease: "power2.out" }, at);
    tl.to(c, {
      v: to, duration: 0.5, ease: "power2.out",
      onUpdate: function () { document.getElementById("cnum").textContent = c.v.toFixed(2); },
    }, at);
  }
  flick(0, w0 + 1.4, 0.735);
  if (knobs.length > 1) flick(1, w0 + 2.8, 0.62);

  // all three slots lit together — the only moment the full list is visible
  tl.to(slots, { opacity: 1, duration: 0.3, stagger: 0.06 }, w1);
  slots.forEach(function (el, i) {
    tl.to(el.querySelector(".n"), { borderColor: "#ffb020", color: "#ffd37a", duration: 0.3 }, w1 + i * 0.06);
    tl.to(el.querySelector(".t"), { color: "#eaf1f8", duration: 0.3 }, w1 + i * 0.06);
  });
  tl.to("#dial", { opacity: 0.3, duration: 0.4 }, w1 + 0.2);
  tl.fromTo("#rail", { scale: 1 }, { scale: 1.04, duration: Math.max(D - w1, 0.6), ease: "sine.out" }, w1);
}

HF.register("tk-rules", tl);
