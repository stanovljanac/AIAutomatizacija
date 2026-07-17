/* magnifier-notfound — GSAP timeline for the 010 Short s2. Citation → magnifier sweep → NOT FOUND.
 * Silent, deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ stampLabel? }
 */
var S = HF.scene({ id: "magnifier-notfound", width: 1080, height: 1920, frames: 180, beatLo: 0.1, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beatAt = S.beatAt;

if (props.stampLabel && document.getElementById("stamp-text")) document.getElementById("stamp-text").textContent = String(props.stampLabel).trim();

var tCard = beatAt(0, 0.06);
var tStamp = Math.max(beatAt(1, 0.46), tCard + 0.8);
var tSub = Math.max(beatAt(2, 0.7), tStamp + 0.5);

var tl = gsap.timeline({ paused: true });
gsap.set("#magnifier", { opacity: 0 });
gsap.set("#stamp", { opacity: 0 });
gsap.set("#sub", { opacity: 0 });
gsap.set("#flash", { opacity: 0 });

tl.from("#card", { opacity: 0, y: 40 * U, scale: 0.95, duration: 0.6, ease: "power3.out" }, tCard);
tl.from("#cite", { opacity: 0, y: 18 * U, duration: 0.45, ease: "power2.out" }, tCard + 0.2);
tl.from("#underline", { scaleX: 0, opacity: 0, duration: 0.45, ease: "power2.out" }, tCard + 0.35);

// magnifier sweeps across the citation
tl.fromTo("#magnifier", { opacity: 0, x: -60 * U, rotate: -8 }, { opacity: 1, x: 300 * U, rotate: 4, duration: 0.9, ease: "power1.inOut" }, tStamp - 0.7);
// NOT FOUND slams; a single functional flash
tl.to("#magnifier", { opacity: 0, duration: 0.3, ease: "power2.in" }, tStamp);
tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.8, duration: 0.1, ease: "power2.out" }, tStamp);
tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, tStamp + 0.1);
tl.to("#stamp", { opacity: 1, scale: 1, rotate: -11, duration: 0.34, ease: "power4.out" }, tStamp + 0.02);
// desaturate the citation content only — the red stamp must stay vivid (it's a child of the card)
tl.to(["#cite", "#underline"], { filter: "grayscale(0.75) brightness(0.55)", opacity: 0.5, duration: 0.5, ease: "power2.inOut" }, tStamp + 0.1);
tl.to("#sub", { opacity: 1, duration: 0.4, ease: "power2.out" }, tSub);

HF.register("magnifier-notfound", tl);
