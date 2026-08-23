/* at-padded-note — 023 s13 (ph1: 236 tokens, same fact) + s14 (ph2: the split, the money shot).
 *
 * Premise: the experiment changed exactly one thing, so the frame has to show the one thing changing.
 * The chatter is real, mundane, the kind everyone pastes; the fact keeps its highlight and its
 * byte-identical chip. Then the deciding row is divided in front of the viewer, with the token count
 * beside every percentage — 1 token holding 25.8% next to 3 tokens holding 10.0% is the whole video
 * in one picture.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-padded-note", width: 1920, height: 1080, frames: 569, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 71, bloomX: 50, bloomY: 40 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var CHATTER = props.chatter && props.chatter.length ? props.chatter : [
  "Reminder: the kitchen tap is still dripping, facilities have been told twice.",
  "Parking permits for August are on the noticeboard by the lift.",
  "Someone left a grey umbrella in meeting room 2 on Thursday.",
  "The printer on floor 3 is out of A4 again; A3 works.",
  "Please label your lunch. The fridge is cleared out on Fridays.",
  "Fire drill moved to the last Wednesday of the month.",
  "Coffee order goes in at 10:40, add your name to the sheet.",
  "The lift music has been fixed, apparently that was a known fault.",
];
document.getElementById("factline").textContent = props.fact || "The vendor code for Ridgeway is RW-88.";
document.getElementById("ptitle").textContent = props.title || "236 tokens. Same fact.";
document.getElementById("idchip").textContent = props.identicalChip || "the fact's words: byte-identical";

var aboveHost = document.getElementById("above"), belowHost = document.getElementById("below");
var half = Math.ceil(CHATTER.length / 2);
var chLines = CHATTER.map(function (line, i) {
  var el = FX.el("chline", i < half ? aboveHost : belowHost);
  el.textContent = line;
  return el;
});

/* ══════════════════ ph1 — s13: the padding, built in front of you ════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);                          // "So I padded the note out to two hundred and thirty-six tokens."
  var t1 = Math.max(beatAt(1, 0.36), t0 + 4.4);     // "The fact still in there, word for word, plus a pile of office chatter…"
  var t2 = Math.max(beatAt(2, 0.72), t1 + 3.4);     // "Then I broke the deciding row down by where every share landed."

  gsap.set("#split", { display: "none" });
  gsap.set("#pagecol", { opacity: 1 });
  gsap.set(chLines, { opacity: 0, y: FX.px(-10) });

  var counter = document.getElementById("counter");
  var from = Number(props.counterFrom) || 30, to = Number(props.counterTo) || 236;
  FX.count(tl, counter, {
    from: from, to: to, at: t0 + 0.4, dur: Math.max(t1 - t0 - 0.2, 1.2),
    fmt: function (v) { return Math.round(v) + " tokens"; },
  });

  /* the chatter slides in, above and below, and the page has to grow to hold it */
  var span = Math.max(t1 - t0 - 0.3, 1.4);
  chLines.forEach(function (el, i) {
    FX.fromTo(tl, el, { opacity: 0, y: FX.px(-10) }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }, t0 + 0.4 + (i / chLines.length) * span);
  });
  /* the fact never moves and never changes — the highlight is the control in the experiment */
  FX.fromTo(tl, "#factline", { scale: 1 }, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1 + 0.2);
  FX.fromTo(tl, "#idchip", { opacity: 0, y: FX.px(10) }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, t1 + 0.4);
  /* and the page runs past the frame edge: the viewer should feel the padding, not be told about it */
  FX.fromTo(tl, "#page", { scaleY: 1 }, { scaleY: 1.16, transformOrigin: "50% 40%", duration: Math.max(t2 - t1, 1.0), ease: "power1.inOut" }, t1);
  FX.camera(tl, { at: t2, scale: 1.03, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════ ph2 — s14: 10% to the actual answer ══════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);                          // "Twenty-six percent went to the first word."
  var u1 = Math.max(beatAt(1, 0.15), u0 + 2.4);     // "Twenty-four percent to the chatter."
  var u2 = Math.max(beatAt(2, 0.26), u1 + 1.8);     // "Ten percent to the three tokens that actually answered…"
  /* the face-off belongs to the LAST sentence of whatever cut this is: the long scene has five, the
     Short's has four, and binding it to a fixed index left the money shot 2s after the narration. */
  var nB = (S.beats || []).length;
  var u4 = Math.max(beatAt(Math.max(nB - 1, 3), 0.72), u2 + 0.8);
  var u3 = Math.min(Math.max(beatAt(3, 0.47), u2 + 1.0), u4 - 0.25);   // "The rest to the wrapping." 

  var SPLIT = props.split && props.split.length ? props.split : [
    { label: "the first word", pct: 25.8, tokens: "1 token" },
    { label: "the chatter", pct: 23.6, tokens: "206 tokens" },
    { label: "the answer", pct: 10.0, tokens: "3 tokens" },
    { label: "the wrapping", pct: 40.6, tokens: "26 tokens" },
  ];
  /* the bar is drawn in the order it is SPOKEN, not in size order */
  var ORDER = [0, 1, 2, 3];
  document.getElementById("stitle").textContent = props.title || "10% — the actual answer";
  document.getElementById("sumchip").textContent = props.sumChip || "1.0000";
  document.getElementById("methodchip").textContent = props.methodChip || "padded note · 236 tok · final row only · avg 12 layers";

  /* opening frame: the padded page is still there, dimmed behind the split it produced */
  gsap.set("#pagecol", P ? { display: "none" } : { opacity: 0.18 });
  gsap.set(".ptop", { opacity: 0 });                 // the ph1 title must not ghost under the ph2 one
  gsap.set(chLines, { opacity: 1, y: 0 });
  gsap.set("#idchip", { opacity: 0 });
  gsap.set("#split", { opacity: 1 });
  document.getElementById("counter").textContent = "236 tokens";

  var barHost = document.getElementById("sbar"), legHost = document.getElementById("slegend");
  var slices = [], pcts = [], legs = [];
  SPLIT.forEach(function (s, i) {
    var el = FX.el("sl k" + i, barHost);
    el.style.width = s.pct + "%";
    var v = FX.el("slpct", el);
    v.textContent = s.pct.toFixed(1) + "%";
    slices.push(el);
    pcts.push(v);
    var lg = FX.el("lg", legHost);
    if (!P) lg.style.width = s.pct + "%";
    var n = FX.el("lgname", lg);
    n.textContent = s.label;
    var pv = FX.el("lgpct fx-mono", lg);
    pv.textContent = s.pct.toFixed(1) + "%";
    var tk = FX.el("lgtok", lg);
    tk.textContent = s.tokens;
    legs.push(lg);
  });

  gsap.set(slices, { scaleX: 0 });
  gsap.set(pcts, { opacity: 0 });
  gsap.set(legs, { opacity: 0 });
  gsap.set("#faceoff", { opacity: 0, y: FX.px(18) });
  gsap.set("#foRatio", { opacity: 0, scale: 0.7 });

  var marks = [u0, u1, u2, u3];
  ORDER.forEach(function (idx, k) {
    var at = marks[k];
    tl.to(slices[idx], { scaleX: 1, duration: 0.42, ease: "power3.out" }, at);
    tl.to(pcts[idx], { opacity: 1, duration: 0.24 }, at + 0.22);
    tl.to(legs[idx], { opacity: 1, duration: 0.28 }, at + 0.18);
  });
  /* the answer's slice is the small one, and it gets the one beat of emphasis */
  FX.fromTo(tl, slices[2], { filter: "brightness(1)" }, { filter: "brightness(1.35)", duration: 0.24, yoyo: true, repeat: 1, ease: "sine.inOut" }, u2 + 0.35);
  FX.fromTo(tl, "#sumchip", { opacity: 0, y: FX.px(8) }, { opacity: 1, y: 0, duration: 0.3 }, u3 + 0.5);
  FX.fromTo(tl, "#methodchip", { opacity: 0, y: FX.px(8) }, { opacity: 1, y: 0, duration: 0.3 }, u3 + 0.7);

  /* the two slices are lifted OUT and set side by side — this is the hold the script bought */
  document.getElementById("foSinkPct").textContent = SPLIT[0].pct.toFixed(1) + "%";
  document.getElementById("foSinkLbl").textContent = SPLIT[0].label;
  document.getElementById("foSinkTok").textContent = SPLIT[0].tokens;
  document.getElementById("foAnsPct").textContent = SPLIT[2].pct.toFixed(1) + "%";
  document.getElementById("foAnsLbl").textContent = SPLIT[2].label;
  document.getElementById("foAnsTok").textContent = SPLIT[2].tokens;
  document.getElementById("foRatio").textContent = props.ratio || "2.5x";

  tl.to("#faceoff", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, u4);
  tl.to("#foRatio", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, u4 + 0.45);
  FX.fromTo(tl, "#foSink", { scale: 1 }, { scale: 1.03, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, u4 + 0.45);
  FX.camera(tl, { at: u4, scale: 1.02, dur: Math.max(D - u4 - 0.2, 0.8), ease: "sine.out" });
}

HF.register("at-padded-note", tl);
