/* cd-flag-not-guess — GSAP timeline for 020 s4 (THE FIX + KEPT JUDGMENT). Data goes first; a
 * copy-pasteable prompt card lands (held for the screenshot); the run merges the cities, repairs the
 * dates, and FLAGS two rows it can't call (never guesses); a human resolves them; the total rolls
 * $41,000 → $47,300 with an earned green check. Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cd-flag-not-guess", width: 1080, height: 1920, frames: 501, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

// sentence beats: [0] "So now the data goes first." (order strip) [1] "One rule: fix what's certain,
// flag what's not, don't guess." (prompt card) [2] "It merges the cities, repairs the dates, then
// stops on two rows it can't call." (merge + dates + flags) [3] "I decide those." (cursor resolves)
// [4] "Re-run: forty-seven thousand, three hundred." (total rolls up)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.11), t0 + 1.0);
var t2 = Math.max(beatAt(2, 0.36), t1 + 2.6);
var t3 = Math.max(beatAt(3, 0.68), t2 + 3.4);
var t4 = Math.max(beatAt(4, 0.73), t3 + 1.3);

var FROM_N = Number(String(props.totalFrom || "$41,000").replace(/[^0-9.]/g, "")) || 41000;
var TO_N = Number(String(props.totalTo || "$47,300").replace(/[^0-9.]/g, "")) || 47300;
function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

// ── resting state ──
gsap.set("#order", { opacity: 0 });
gsap.set("#oData", { x: 120 * U });
gsap.set("#prompt", { opacity: 0, y: 40 * U, scale: 0.96 });
gsap.set("#run", { opacity: 0 });
gsap.set(["#fixCities", "#fixDates"], { opacity: 0, y: 16 * U });
gsap.set(["#flag1", "#flag2"], { opacity: 0, y: 16 * U });
gsap.set("#flagnote", { opacity: 0 });
gsap.set("#cursor", { opacity: 0, xPercent: -50 });
gsap.set("#receipt", { opacity: 0 });
gsap.set(".rrow", { opacity: 0, x: -20 * U });
gsap.set("#total", { opacity: 0, y: 20 * U });
gsap.set("#check", { opacity: 0, scale: 0.4 });
gsap.set("#chips", { opacity: 0 });
document.getElementById("tval").textContent = money(FROM_N);

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the pipeline order: DATA jumps ahead of BUILD ──
tl.to("#order", { opacity: 1, duration: 0.3 }, t0 + 0.1);
tl.to("#oData", { x: 0, duration: 0.5, ease: "back.out(1.6)" }, t0 + 0.3);
tl.fromTo("#oData", { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, t0 + 0.3);

// ── beat 1 — the copy-pasteable prompt card lands, held for the screenshot ──
tl.to("#order", { opacity: 0, y: -30 * U, duration: 0.34, ease: "power2.in" }, t1 - 0.1);
tl.to("#prompt", { opacity: 1, y: 0, scale: 1, duration: 0.46, ease: "back.out(1.4)" }, t1 + 0.1);
tl.fromTo("#pcopy", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, t1 + 0.5);

// ── beat 2 — the run: prompt shrinks up to a pinned header; merge + dates + flags ──
tl.to("#prompt", { scale: 0.7, y: -300 * U, opacity: 0.5, duration: 0.5, ease: "power2.inOut" }, t2 - 0.2);
tl.to("#run", { opacity: 1, duration: 0.3 }, t2);
// the cities merge into one (before → after ✓)
tl.to("#fixCities", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t2 + 0.2);
// the text-dates snap to real dates
tl.to("#fixDates", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t2 + 0.9);
// TWO rows it can't call get a calm amber "?" — the run PAUSES on them (it did NOT guess)
tl.to("#flag1", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t2 + 1.6);
tl.to("#flag2", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t2 + 1.84);
tl.to("#flagnote", { opacity: 1, duration: 0.3 }, t2 + 2.15);
// a small amber pulse on the flags — the machine is waiting, not guessing
tl.to(["#fq1", "#fq2"], { scale: 1.15, duration: 0.4, yoyo: true, repeat: 2, ease: "sine.inOut" }, t2 + 2.25);

// ── beat 3 — the cursor resolves each flag (human on the flags) ──
// cursor coordinates are relative to .flagwrap: flag1 sits at y≈0, flag2 one row (≈86px) below.
tl.set("#cursor", { top: 130 * U });
tl.to("#cursor", { opacity: 1, duration: 0.2 }, t3);
// tap flag 1 (right edge, where its ? badge is)
tl.to("#cursor", { left: "82%", top: 46 * U, duration: 0.4, ease: "power2.inOut" }, t3 + 0.1);
tl.to("#cursor", { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.in" }, t3 + 0.52);
tl.call(function () { document.getElementById("flag1").classList.add("done"); document.getElementById("fq1").textContent = "✓"; }, null, t3 + 0.6);
// tap flag 2
tl.to("#cursor", { left: "82%", top: 132 * U, duration: 0.4, ease: "power2.inOut" }, t3 + 0.78);
tl.to("#cursor", { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.in" }, t3 + 1.2);
tl.call(function () { document.getElementById("flag2").classList.add("done"); document.getElementById("fq2").textContent = "✓"; }, null, t3 + 1.28);
tl.to("#cursor", { opacity: 0, duration: 0.3 }, t3 + 1.5);
tl.to("#flagnote", { opacity: 0, duration: 0.3 }, t3 + 1.4);

// ── beat 4 — the run clears; a receipt of what happened; the TOTAL rolls $41,000 → $47,300 ──
tl.to(["#run", "#prompt"], { opacity: 0, duration: 0.4, ease: "power2.in" }, t4 - 0.1);
tl.to("#receipt", { opacity: 1, duration: 0.24 }, t4 + 0.1);
tl.to(".rrow", { opacity: 1, x: 0, duration: 0.32, stagger: 0.12, ease: "power3.out" }, t4 + 0.15);
tl.to("#total", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t4 + 0.15);
var c = { v: FROM_N };
tl.to(c, {
  v: TO_N, duration: 1.3, ease: "power2.out",
  onUpdate: function () { document.getElementById("tval").textContent = money(c.v); },
}, t4 + 0.4);
tl.to("#tval", { color: "#ffd37a", duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, t4 + 0.4);
// the earned green check + the replicable-tool chips
tl.to("#check", { opacity: 1, scale: 1, duration: 0.36, ease: "back.out(2.2)" }, t4 + 1.7);
tl.to("#chips", { opacity: 1, duration: 0.4, ease: "power2.out" }, t4 + 1.9);

HF.register("cd-flag-not-guess", tl);
