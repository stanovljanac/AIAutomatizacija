/* tks-can-it-see — GSAP timeline for the 021 Short's takeaway. The myth is slashed, the code
 * handover happens quickly and subordinately, and the payoff is the MAGNIFIER TURNING from the
 * answer to the input. The gold stamp is the last thing on screen.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tks-can-it-see", width: 1080, height: 1920, frames: 391, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

document.getElementById("myth").textContent = props.myth || "it's just not that smart";
document.getElementById("task").textContent = props.task || "count the r's";
document.getElementById("codeline").textContent = props.codeLine || "len(re.findall('r', w))";
document.getElementById("result").textContent = props.result || "3";
document.getElementById("answertext").textContent = props.answer || "There are 2 r's in strawberry.";
document.getElementById("inputtext").textContent = props.input || "How many r's are in strawberry?";
document.getElementById("stamp").textContent = props.stamp || "CAN IT EVEN SEE THIS?";

// [0] "So when it fumbles something absurdly easy, it isn't being dumb."
// [1] "Character-exact work belongs in code — not in the guess."
// [2] "But the real question was never why it's so dumb."  [3] "It's: can it even see this?"
var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.34), t0 + 3.0),
    t2 = Math.max(beatAt(2, 0.65), t1 + 3.2), t3 = Math.max(beatAt(3, 0.86), t2 + 2.0);

gsap.set("#myth", { opacity: 1 });      // OPENING FRAME already shows the myth (a cut has no runway)
gsap.set("#slash", { scaleX: 0 });
// the capsule CARRIES over from s3's fused chunk, so the scene opens on an object, not on a line of
// text alone — sentence 0 runs 4.5s and used to hold a near-empty frame for three of them
gsap.set("#handover", { opacity: 1 });
gsap.set(["#answer", "#input", "#lens", "#stamp"], { opacity: 0 });
gsap.set("#task", { opacity: 0, y: -40 * U });
gsap.set("#fumble", { opacity: 0, y: 20 * U });
gsap.set("#code", { opacity: 0 });
gsap.set("#result", { opacity: 0 });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// beat 1 — "it fumbles something absurdly easy": SHOW the fumble, then slash the myth
tl.fromTo("#fumble", { opacity: 0, y: 20 * U }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, t0 + 0.35);
tl.to("#capsule", { rotation: -1.4, duration: 0.09, yoyo: true, repeat: 5, ease: "sine.inOut" }, t0 + 0.6);
tl.to("#slash", { scaleX: 1, duration: 0.22, ease: "power4.out" }, t0 + 1.5);
tl.to("#myth", { opacity: 0.3, duration: 0.3, ease: "sine.out" }, t0 + 1.7);
tl.to("#fumble", { opacity: 0, y: -18 * U, duration: 0.35, ease: "power2.in" }, Math.max(t1 - 0.7, t0 + 2.6));

// beat 2 — the handover, quick and subordinate: the task leaves the guess and docks into code
tl.to("#task", { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, t1);
tl.to("#capsule", { scaleY: 0.9, duration: 0.3, ease: "power2.out" }, t1 + 0.2);
tl.to("#code", { opacity: 1, duration: 0.3 }, t1 + 0.9);
tl.to("#task", { y: 300 * U, scale: 0.8, opacity: 0, duration: 0.5, ease: "power2.in" }, t1 + 1.1);
tl.to("#capsule", { scaleY: 1, opacity: 0.3, duration: 0.4 }, t1 + 1.3);
tl.to("#result", { opacity: 1, duration: 0.3, ease: "back.out(2.4)" }, t1 + 1.7);
tl.to("#handover", { opacity: 0, duration: 0.4, ease: "power2.in" }, t2 - 0.5);
tl.to("#mythwrap", { opacity: 0, duration: 0.4 }, t2 - 0.5);

// beat 3 — the payoff. The MOVEMENT is the beat.
tl.to("#answer", { opacity: 1, duration: 0.3 }, t2);
tl.to("#lens", { opacity: 1, duration: 0.3 }, t2 + 0.2);
tl.to("#lens", { x: -50 * U, duration: 0.45, yoyo: true, repeat: 2, ease: "sine.inOut" }, t2 + 0.5);
tl.to("#input", { opacity: 1, duration: 0.3 }, t3 - 0.5);
tl.to("#lens", { x: -330 * U, y: 330 * U, rotation: -22, duration: 0.8, ease: "power2.inOut" }, t3 - 0.35);
tl.to("#answer", { opacity: 0.25, duration: 0.5 }, t3 - 0.2);
tl.to("#input", { borderColor: "rgba(255,176,32,0.85)", duration: 0.4 }, t3 + 0.3);
tl.fromTo("#stamp", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.36, ease: "back.out(2)" }, t3 + 0.45);
tl.to("#lens", { opacity: 0, duration: 0.4 }, t3 + 0.9);
// the stamp is the last thing on screen — held, nothing else moving
tl.fromTo("#root", { scale: 1 }, { scale: 1.03, duration: Math.max(D - t3, 0.8), ease: "sine.out" }, t3);

HF.register("tks-can-it-see", tl);
