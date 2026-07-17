/* closing — GSAP timeline for 010 s13 / Short s7. Two kinetic lines + subscribe pill. Silent,
 * deterministic, seek-driven. This is the FINAL scene — it may fade nothing; it HOLDS the CTA.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ line1?, line2?, ctaLabel?, brand? }
 */
var S = HF.scene({ id: "closing", width: 1920, height: 1080, frames: 300, beatLo: 0.1, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

function setText(id, val) { var el = document.getElementById(id); if (el && typeof val === "string" && val.trim()) el.textContent = val.trim(); }
setText("line1", props.line1);
setText("line2", props.line2);
setText("cta-pill", props.ctaLabel);
setText("cta-brand", props.brand);

// line 1 establishes on the FIRST sentence (never blank); line 2 follows; cta near the end
var n = beats.length;
var tL1 = beatAt(0, 0.05);
var tL2 = Math.max(n >= 2 ? beatAt(1, 0.26) : tL1 + 1.2, tL1 + 0.9);
var tCta = Math.max(n >= 5 ? beatAt(n - 2, 0.66) : beatAt(n - 1, 0.72), tL2 + 1.0);

var tl = gsap.timeline({ paused: true });
gsap.set("#cta", { opacity: 0 });

tl.fromTo("#line1", { opacity: 0, y: 40 * U, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, tL1);
tl.fromTo("#line2", { opacity: 0, y: 44 * U, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "back.out(1.4)" }, tL2);
tl.to("#line2", { textShadow: "0 0 " + (52 * U) + "px rgba(255,176,32,0.7)", duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 1 }, tL2 + 0.5);

tl.fromTo("#cta", { opacity: 0, y: 24 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, tCta);
tl.fromTo("#cta-pill", { scale: 0.85 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, tCta + 0.1);

HF.register("closing", tl);
