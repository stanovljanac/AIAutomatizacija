/* trust-gap — GSAP timeline for 010 s07 (thesis). 3-node flow with a gold "point of trust" gap.
 * Silent, deterministic, seek-driven. No exit tweens (master timeline owns the cut).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ gapLabel? }
 */
var S = HF.scene({ id: "trust-gap", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

if (props.gapLabel && document.getElementById("gap-pill")) document.getElementById("gap-pill").textContent = String(props.gapLabel).trim();

// 9 sentence beats — a dim flow skeleton establishes at the FIRST sentence (never blank), then each
// node activates on its cue.
var U2 = U;
var tEstablish = beatAt(0, 0.05);
var tN1 = Math.max(beatAt(3, 0.30), tEstablish + 0.7);   // "a prompt goes in"
var tN2 = Math.max(beatAt(4, 0.42), tN1 + 0.6);          // "a confident answer ... no source"
var tN3 = Math.max(beatAt(5, 0.54), tN2 + 0.6);          // "gets shipped ... no one checking"
var tPoint = Math.max(beatAt(8, 0.80), tN3 + 0.9);       // "the point of trust"

var tl = gsap.timeline({ paused: true });

gsap.set(["#flag2", "#flag3"], { opacity: 0 });
gsap.set("#gap-pill", { opacity: 0 });

// establish — the dim 3-node skeleton + arrow + gap line slide in on sentence 0
tl.fromTo("#n1", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish);
tl.fromTo("#n2", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.12);
tl.fromTo("#n3", { opacity: 0, y: 30 * U2 }, { opacity: 0.32, y: 0, duration: 0.5, ease: "power3.out" }, tEstablish + 0.24);
tl.fromTo("#a1", { opacity: 0 }, { opacity: 0.5, duration: 0.5, ease: "power2.out" }, tEstablish + 0.2);
tl.fromTo("#gap-line", { opacity: 0, scaleY: 0.4 }, { opacity: 0.4, scaleY: 1, duration: 0.5, ease: "power2.out" }, tEstablish + 0.3);

// node 1 — the prompt goes in (brightens)
tl.to("#n1", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN1);
tl.to("#a1", { opacity: 0.85, duration: 0.3, ease: "power1.out" }, tN1 + 0.3);

// node 2 — the confident answer, NO SOURCE
tl.to("#n2", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN2);
tl.fromTo("#flag2", { opacity: 0, scale: 1.6, rotate: -6 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.32, ease: "power4.out" }, tN2 + 0.3);

// node 3 — shipped to court, NO CHECK; the gap brightens
tl.to("#n3", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN3);
tl.fromTo("#flag3", { opacity: 0, scale: 1.6, rotate: 6 }, { opacity: 1, scale: 1, rotate: 6, duration: 0.32, ease: "power4.out" }, tN3 + 0.3);
tl.to("#gap-line", { opacity: 1, duration: 0.4, ease: "power2.out" }, tN3 + 0.2);

// the point of trust — the gap is the answer; the pill lands and breathes
tl.fromTo("#gap-pill", { opacity: 0, y: 14 * U2, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, tPoint);
tl.to("#gap-line", { boxShadow: "0 0 " + (40 * U2) + "px rgba(255,176,32,0.85)", duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, tPoint + 0.2);

HF.register("trust-gap", tl);
