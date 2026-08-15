/* tk-language-tax — GSAP timeline for 021 s15 (phase 1) and s16 (phase 2). One chart that grows:
 * four rows of REAL tokens, the English end-line, then the overrun bracketed with the MEASURED
 * multiple (+75% · 1.75×) and the two s14 instruments moving in step with it.
 * Deterministic, seek-driven; flat, face-on. No flags, no country iconography.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-language-tax", width: 1920, height: 1080, frames: 400, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var ROWS = Array.isArray(props.rows) && props.rows.length
  ? props.rows
  : [{ lang: "English", count: 12 }, { lang: "Spanish", count: 18 }, { lang: "Hindi", count: 21 }, { lang: "Japanese", count: 21 }];
var BASE = Number(ROWS[0].count) || 12;

document.getElementById("sentence").textContent = props.sentence || "";
document.getElementById("caption").textContent = props.caption || "";
document.getElementById("chip").textContent = props.sourceChip || "tiktoken · o200k_base";
document.getElementById("blabel").textContent = props.bracket || "";
document.getElementById("line").textContent = props.line || "";

// build the chart: one capsule per REAL token
var chart = document.getElementById("chart");
var rowEls = ROWS.map(function (r, i) {
  var row = document.createElement("div");
  row.className = "row" + (r.count > BASE ? " over" : "");
  var lang = document.createElement("span"); lang.className = "lang"; lang.textContent = r.lang;
  var run = document.createElement("span"); run.className = "run";
  for (var k = 0; k < r.count; k++) {
    var tk = document.createElement("span"); tk.className = "tk"; run.appendChild(tk);
  }
  var num = document.createElement("span"); num.className = "num"; num.textContent = String(r.count);
  row.appendChild(lang); row.appendChild(run); row.appendChild(num);
  chart.appendChild(row);
  return { row: row, tks: run.querySelectorAll(".tk"), num: num };
});

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.04, duration: D, ease: "sine.inOut" }, 0);

if (PHASE === 1) {
  // [0] "So take one sentence: …" [1] "In English that's twelve tokens." [2] "…Spanish is eighteen."
  // [3] "In Hindi or Japanese, twenty-one."
  var t0 = beatAt(0, 0.0), t1 = Math.max(beatAt(1, 0.43), t0 + 3.0),
      t2 = Math.max(beatAt(2, 0.6), t1 + 1.6), t3 = Math.max(beatAt(3, 0.83), t2 + 1.8);

  gsap.set("#sentence", { opacity: 0, y: -18 * U });
  gsap.set(".row", { opacity: 0 });
  gsap.set(".tk", { opacity: 0, scaleX: 0.2 });
  gsap.set(".num", { opacity: 0 });
  gsap.set(["#endline", "#bracket", "#mini", "#line", "#caption", "#chip"], { opacity: 0 });

  tl.to("#sentence", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0 + 0.15);
  tl.to(["#caption", "#chip"], { opacity: 1, duration: 0.3 }, t0 + 0.6);

  // Each row builds token by token, and the number lands as the row finishes. Hindi and Japanese
  // share ONE narration beat ("In Hindi or Japanese, twenty-one"), so they build together with a
  // short offset — sequencing them a beat apart pushed the 21st Japanese token past the cut.
  var starts = [t1, t2, t3, t3 + 0.35];
  rowEls.forEach(function (r, i) {
    var at = starts[i];
    var per = Math.min(0.05, 0.9 / r.tks.length);
    tl.to(r.row, { opacity: 1, duration: 0.2 }, at - 0.1);
    r.tks.forEach(function (tk, k) {
      tl.to(tk, { opacity: 1, scaleX: 1, duration: 0.16, ease: "power2.out" }, at + k * per);
    });
    tl.to(r.num, { opacity: 1, duration: 0.24, ease: "back.out(2)" }, at + r.tks.length * per + 0.1);
    // English finishes first and shortest — its end becomes the line everything else overruns
    if (i === 0) tl.to("#endline", { opacity: 1, duration: 0.3 }, at + r.tks.length * per + 0.3);
  });
} else {
  // [0] "Same meaning, same work — up to seventy-five percent more chunks." [1] "You pay per chunk…"
  // [2] "If you don't write in English, you've been paying a surcharge nobody mentioned."
  var u0 = beatAt(0, 0.0), u1 = Math.max(beatAt(1, 0.33), u0 + 2.6), u2 = Math.max(beatAt(2, 0.74), u1 + 3.0);

  // OPENS on the completed chart
  gsap.set("#sentence", { opacity: 0.35 });
  gsap.set(".row", { opacity: 1 });
  gsap.set(".tk", { opacity: 1, scaleX: 1 });
  gsap.set(".num", { opacity: 1 });
  gsap.set("#endline", { opacity: 1 });
  gsap.set(["#caption", "#chip"], { opacity: 1 });
  gsap.set("#bracket", { opacity: 0, scaleX: 0.2, transformOrigin: "left center" });
  gsap.set("#mini", { opacity: 0 });
  gsap.set("#line", { opacity: 0, scale: 1.12 });
  gsap.set("#blabel", { opacity: 0 });

  // the bracket is drawn on the HINDI/JAPANESE rows — "up to" is load-bearing (Spanish is 1.50×)
  tl.to("#bracket", { opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.out" }, u0 + 0.5);
  tl.to("#blabel", { opacity: 1, duration: 0.3, ease: "back.out(2)" }, u0 + 0.95);
  tl.fromTo(rowEls[2].tks, { scale: 1 }, { scale: 1.1, duration: 0.16, stagger: 0.01, yoyo: true, repeat: 1, ease: "sine.inOut" }, u0 + 0.6);

  // the two instruments return small and move IN STEP with the same bracket
  tl.to("#mini", { opacity: 1, duration: 0.3 }, u1);
  tl.to("#mfill", { scaleX: 1, duration: 1.2, ease: "power2.out" }, u1 + 0.2);
  var c = { v: 0.42 };
  tl.to(c, {
    v: 0.735, duration: 1.2, ease: "power2.out",
    onUpdate: function () { document.getElementById("mnum").textContent = c.v.toFixed(2); },
  }, u1 + 0.2);

  // the chart dims and the sentence lands as one gold line over it — factual, not outraged
  tl.to(["#chart", "#mini", "#sentence"], { opacity: 0.18, duration: 0.5, ease: "sine.out" }, u2 - 0.2);
  tl.to("#line", { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.5)" }, u2);
  tl.fromTo("#root", { scale: 1 }, { scale: 1.02, duration: Math.max(D - u2, 0.8), ease: "sine.out" }, u2);
}

HF.register("tk-language-tax", tl);
