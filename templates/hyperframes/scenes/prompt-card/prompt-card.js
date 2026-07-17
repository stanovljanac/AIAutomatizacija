/* prompt-card — GSAP timeline for 010 s11 / Short s6. Full-frame centered prompt, no zoom, pausable.
 * Silent, deterministic, seek-driven. Establishes the card on sentence 0 (never blank).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ heading?, prompt?, hint?, cardLabel? }
 */
var S = HF.scene({ id: "prompt-card", width: 1920, height: 1080, frames: 300, beatLo: 0.1, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("heading", props.heading);
setText("prompt", props.prompt);
setText("hint", props.hint);
setText("card-label", props.cardLabel);

var tHead = beatAt(0, 0.05);
var tBody = Math.max(beats.length > 1 ? beatAt(1, 0.22) : tHead + 0.6, tHead + 0.5);
var tHint = Math.max(beatAt(Math.max(beats.length - 1, 0), 0.72), tBody + 0.8);

var tl = gsap.timeline({ paused: true });
gsap.set("#hint", { opacity: 0 });

// establish heading + card frame on sentence 0 (never blank)
tl.from("#heading", { opacity: 0, y: 26 * U, duration: 0.5, ease: "power3.out" }, tHead);
tl.from("#card", { opacity: 0, y: 40 * U, scale: 0.97, duration: 0.6, ease: "power3.out" }, tHead + 0.12);
// the prompt text reveals
tl.from("#prompt", { opacity: 0, duration: 0.5, ease: "power2.out" }, tBody);
// pause & screenshot hint
tl.to("#hint", { opacity: 1, duration: 0.45, ease: "power2.out" }, tHint);

HF.register("prompt-card", tl);
