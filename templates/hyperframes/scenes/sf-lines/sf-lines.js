/* sf-lines — 026 s9b, THE TWO LINES (mechanical, blue + gold, face-on). The copy-paste beat.
 *
 * PREMISE. Two lines, twice: as TEXT the viewer can copy (left, flat, opaque, word for word — the exact
 * wording tested as JOBS.generic in measure/run.mjs), and as two GOLD MODULES bolting onto the machine
 * (right). The PROOF row appears as "Proof:" is spoken and the PROOF module seats: its window reads the
 * count and the newest time from a real run, against the normal engraved on its scale. The ALARM row appears
 * on "Alarm:" and the ALARM module seats; on "opens with: check the source" its mast goes up and the flag
 * flies. To show the ALARM doing its job, the form breaks on "nothing": the PROOF window drops to 00 · none,
 * the flag stands up and the press prints exactly that report — CHECK THE SOURCE on its first line. The block
 * stays up to the end of the scene — ~24 s for PROOF, ~15 s for ALARM — readable on a phone, and the camera
 * keeps every part it is about clear of it (the paper only prints once the shot is wide enough for that).
 *
 * SHOTS:  A two      the right of the machine, wide-ish        "Then I added two lines."
 *         B proof    PROOF seats; count + newest light          "Proof: before reporting, check the source…"
 *         C alarm    ALARM seats; the flag flies on "opens"     "Alarm: nothing, nothing new, old items, or an error…"
 *         D screen   settle; the block is the frame             "They're on screen word for word; pause and copy them."
 */
var S = HF.scene({ id: "sf-lines", width: 1920, height: 1080, frames: 792, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D, PT = S.portrait;
var E = HW.E, span = HF3.span, mix = HF3.mix;
var tTwo = Math.max(K.m("two", 0.35), 0.2), tProof = K.m("proof", 1.8), tCount = K.m("count", 6.0), tNewest = K.m("newest", 7.0), tNormal = K.m("normal", 10.2);
var tAlarm = K.m("alarm", 11.6), tNothing = K.m("nothing", 12.7), tClear = K.m("clear", 18.0), tOpens = K.m("opens", 19.7), tScreen = K.m("screen", 22.6);
var LINES = props.lines || [
  "Before you report, check the source and copy from its actual output: how many items it returned, and the newest item's timestamp. Normal is [5 to 9 a day].",
  "If the source returns nothing, nothing new, old items, or an error, do not report all clear. Start the report with CHECK THE SOURCE and say what you saw.",
];
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function slot(s) { return esc(s).replace("[5 to 9 a day]", '<span class="slot">[5 to 9 a day]</span>'); }

document.getElementById("hud").innerHTML =
  '<div class="hw-plate sf-copy" id="copy">' +
  '<div class="row" id="r1"><div class="k">PROOF</div><div class="v">' + slot(LINES[0]) + '</div></div>' +
  '<div class="row" id="r2"><div class="k">ALARM</div><div class="v">' + slot(LINES[1]) + '</div></div>' +
  '<div class="ft" id="ft">pause &amp; copy · full text in the description · tested on this job, a small synthetic test</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#copy", "#r1", "#r2", "#ft"], { opacity: 0 });
HW.fromTo(tl, "#copy", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, tProof - 0.15);
HW.fromTo(tl, "#r1", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tProof - 0.05);
HW.fromTo(tl, "#r2", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tAlarm - 0.05);
HW.fromTo(tl, "#ft", { opacity: 0 }, { opacity: 1, duration: 0.3 }, tScreen - 0.2);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("sf-lines", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [2.5, 0.8] });
  var M = HWT.line(ctx, {});
  /* a healthy run in the background so the PROOF window has something real to read */
  var flow = M.flow(M.REQUESTS.map(function (rq, k) { return { t0: tProof + 0.4 + k * 0.42, kind: "new", idx: k }; }), { slide: 0.8, read: 0.32 });
  var pr = M.print({ i: 0, state: "alarm", t0: tOpens - 0.85, out: 1.0, hold: Infinity, slot: 0 });
  /* landscape: the block owns the left ~53%. Close on PROOF with its left edge at 56%; wide once the paper
     prints, with the paper's left edge at 56% too. */
  var LS = [
    { t: 0, v: [0.4, 0.8, 22.0, 0, 0, 0] },
    { t: Math.max(tProof - 0.3, 0.9), v: [0.5, 0.8, 21.2, 0, 0, 0], e: "sine" },
    { t: tProof + 0.6, v: [5.1, 2.1, 9.5, 0, 0, 0], e: "inOut" },
    { t: tAlarm - 0.4, v: [5.15, 2.1, 9.1, 0, 0, 0], e: "sine" },
    { t: tAlarm + 0.6, v: [0.4, 0.8, 22.0, 0, 0, 0], e: "inOut" },
    { t: tScreen - 0.3, v: [0.45, 0.8, 21.4, 0, 0, 0], e: "sine" },
    { t: D, v: [0.5, 0.8, 20.8, 0, 0, 0], e: "sine" },
  ];
  /* portrait: the block owns the top ~45%; the machine lives in the band 46–84% */
  var PTK = [
    { t: 0, v: [3.8, 2.4, 36, 0, 0, 0] },
    { t: Math.max(tProof - 0.3, 0.9), v: [3.8, 2.4, 35, 0, 0, 0], e: "sine" },
    { t: tProof + 0.6, v: [6.5, 4.6, 17, 0, 0, 0], e: "inOut" },
    { t: tAlarm - 0.4, v: [6.5, 4.6, 16.4, 0, 0, 0], e: "sine" },
    { t: tAlarm + 0.6, v: [3.8, 2.4, 36, 0, 0, 0], e: "inOut" },
    { t: tScreen - 0.3, v: [3.8, 2.4, 35, 0, 0, 0], e: "sine" },
    { t: D, v: [3.8, 2.4, 34.2, 0, 0, 0], e: "sine" },
  ];
  var cam = HWT.cam(PT ? PTK : LS);

  function pose(t) {
    M.home(false);
    M.assemble("proof", span(t, tProof + 0.1, tProof + 1.4), "off", { stagger: 0.35 });
    M.assemble("alarm", span(t, tAlarm + 0.1, tAlarm + 1.3), "off", { stagger: 0.35 });
    var up = Math.min(span(t, tOpens - 0.15, tOpens + 0.75), 1 - span(t, D - 1.8, D - 0.6));
    M.flag(t > tAlarm + 1.0 ? E.out3(up) : 0.0);
    /* the break that puts the ALARM to work: EMPTY, on "nothing" */
    var brk = HW.ramp(t, tNothing - 0.1, tNothing + 0.8, E.inOut);
    M.valve(2, brk); M.cut(brk);
    M.lamps("green", "green", "green", 1);
    var st = flow.update(t);
    M.core(st.glow, st.scanU, st.scanOn);
    M.press(t * 0.6 + 6 * span(t, tOpens - 0.85, tOpens + 0.15));
    M.clock(0.3 + t * 0.03);
    M.drawerState(null, -1);
    pr.update(t);
    var broken = t > tNothing + 0.6;
    var c = broken ? "00" : t > tCount - 0.2 ? "07" : "--", n = broken ? "none" : t > tNewest - 0.15 ? "19:48" : "--:--";
    M.proofShow(c, n, broken ? "#ffffff" : t > tNormal - 0.2 && t < tNormal + 1.4 ? "#ffffff" : null);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
