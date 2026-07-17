/* human-gate — GSAP timeline for 010 s12. Draft → HUMAN CHECK gate → shipped. Silent, deterministic,
 * seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ gateLabel? }
 */
var S = HF.scene({ id: "human-gate", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

if (props.gateLabel && document.getElementById("gate-sub")) document.getElementById("gate-sub").textContent = String(props.gateLabel).trim();

// 3 sentence beats
var tIntro = beatAt(0, 0.06);
var tGate = Math.max(beatAt(1, 0.34), tIntro + 0.7);   // "crosses a human before it ships"
var tShip = Math.max(beatAt(2, 0.68), tGate + 1.2);

var tl = gsap.timeline({ paused: true });
gsap.set("#approve", { opacity: 0 });
gsap.set("#shipped", { opacity: 0 });

// intro — the flow appears, gate present
tl.from("#gate", { opacity: 0, y: 30 * U, duration: 0.55, ease: "power3.out" }, tIntro);
tl.from("#doc", { opacity: 0, x: -60 * U, duration: 0.55, ease: "power3.out" }, tIntro + 0.15);

// the human check approves — gold ✓ stamp lands, gate glows
tl.to("#approve", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, tGate);
tl.to("#gate-pillar", { boxShadow: "0 " + (18 * U) + "px " + (46 * U) + "px rgba(0,0,0,0.45), 0 0 " + (44 * U) + "px rgba(255,176,32,0.5)", duration: 0.6, ease: "power2.out" }, tGate + 0.1);

// only then does it ship
tl.fromTo("#shipped", { opacity: 0, x: 40 * U, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, tShip);

HF.register("human-gate", tl);
