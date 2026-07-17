/* suspended-stamp — GSAP timeline for the 010 Short s4. License → SUSPENDED stamp → desaturate.
 * Silent, deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stampLabel? }
 */
var S = HF.scene({ id: "suspended-stamp", width: 1080, height: 1920, frames: 150, beatLo: 0.1, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beatAt = S.beatAt;

if (props.stampLabel && document.getElementById("stamp-text")) document.getElementById("stamp-text").textContent = String(props.stampLabel).trim();

var tCard = beatAt(0, 0.08);
var tStamp = Math.max(beatAt(1, 0.42), tCard + 0.7);
var tSub = Math.max(beatAt(2, 0.7), tStamp + 0.4);

var tl = gsap.timeline({ paused: true });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#sub", { opacity: 0 });
gsap.set("#flash", { opacity: 0 });

tl.from("#license", { opacity: 0, y: 44 * U, scale: 0.95, duration: 0.6, ease: "power3.out" }, tCard);
tl.from("#lseal", { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(1.6)" }, tCard + 0.2);

// SUSPENDED slams; flash; the license desaturates
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.8, duration: 0.1, ease: "power2.out" }, tStamp);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tStamp + 0.1);
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -12, duration: 0.34, ease: "power4.out" }, tStamp + 0.02);
// desaturate the license content only — the red stamp must stay vivid (it's a child of the card)
tl.to([".lseal", ".ltitle", ".lname", ".lline", ".lmeta"], { filter: "grayscale(0.85) brightness(0.5)", opacity: 0.5, duration: 0.5, ease: "power2.inOut" }, tStamp + 0.1);
tl.to("#sub", { opacity: 1, duration: 0.4, ease: "power2.out" }, tSub);

HF.register("suspended-stamp", tl);
