/* machine-section — GSAP timeline for 012 s06. Blue wash flip → title → gold rule sweep →
 * subtitle + empty diagram sockets. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ kicker?, title?, subtitle? }
 */
var S = HF.scene({ id: "machine-section", width: 1920, height: 1080, frames: 240, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

if (props.kicker) document.getElementById("kicker").textContent = String(props.kicker).toUpperCase();
if (props.title) document.getElementById("title").textContent = String(props.title).toUpperCase();
if (props.subtitle) document.getElementById("subtitle").textContent = String(props.subtitle);

// 2 sentence beats
var tIn = beatAt(0, 0.05);
var tShape = Math.max(beatAt(1, 0.5), tIn + 1.0);

var tl = gsap.timeline({ paused: true });

// beat 0 — the chapter flips blue; kicker + title land
tl.fromTo("#bluewash", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, tIn);
tl.from("#kicker", { opacity: 0, y: -24 * U, duration: 0.4, ease: "power3.out" }, tIn + 0.1);
tl.from("#title", { opacity: 0, y: 50 * U, scale: 0.92, duration: 0.55, ease: "power3.out" }, tIn + 0.22);

// beat 1 — the promise: gold rule sweeps, subtitle lands, the EMPTY canvas sockets appear
tl.to("#rule", { scaleX: 1, duration: 0.5, ease: "power3.out" }, tShape);
tl.to("#subtitle", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tShape + 0.25);
tl.to("#canvasdots", { opacity: 1, duration: 0.7, ease: "power2.out" }, tShape + 0.35);
tl.from(".socket", { scale: 0.4, duration: 0.5, stagger: 0.06, ease: "back.out(1.8)" }, tShape + 0.35);

HF.register("machine-section", tl);
