/* at-measure-run — 023 s6 (ph1: the run) + s7 (ph2: every row = 1.0000000).
 *
 * Premise: the video claims a number, so the frame has to show the instrument that produced it. The
 * code is the code that was actually run; the note is the note that was actually handed to the
 * model; the rows are what came back. ph2 carries the first designed HOLD (D-063) — the rows keep
 * scrolling under it so the frame is never parked.
 *
 * Deterministic, seek-driven: the typing and the scroll are property tweens with onUpdate, never
 * callbacks (the capture engine seeks out of order).
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-measure-run", width: 1920, height: 1080, frames: 461, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 33, bloomX: P ? 50 : 36, bloomY: 42 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var CODE = props.code && props.code.length ? props.code : [
  'tok = GPT2Tokenizer.from_pretrained("gpt2")',
  'model = GPT2LMHeadModel.from_pretrained(',
  '    "gpt2", attn_implementation="eager")',
  'ids = tok(NOTE, return_tensors="pt")',
  'with torch.no_grad():',
  '    out = model(**ids, output_attentions=True)',
  'att = torch.stack(out.attentions)   # 12 x 12 x n x n',
  'print(att.sum(-1))',
];
var CODE_TEXT = CODE.join("\n");
var RUN_OUT = [
  "loading gpt2 (124M) ... ok   [cpu]",
  "tokens: 30",
  "attentions: 12 layers x 12 heads x 30 x 30",
  "row sums: min 0.9999994  max 1.0000006",
].join("\n");

document.getElementById("instrument").textContent = props.instrument || "GPT-2 small (124M) · local · CPU · $0";
document.getElementById("dev").textContent = props.deviation || "max deviation 6.0e-7";
document.getElementById("vbig").textContent = props.verdict || props.title || "";

/* the note, with the fact it is hiding */
var NOTE = props.note || "Notes for the invoice run. The vendor code for Ridgeway is RW-88. Now write the Ridgeway summary. The vendor code is";
var FACT = props.factSpan || "RW-88";
var noteEl = document.getElementById("note");
var cut = NOTE.indexOf(FACT);
if (cut >= 0) {
  noteEl.appendChild(document.createTextNode(NOTE.slice(0, cut)));
  var em = FX.el("fact", noteEl, "span");
  em.textContent = FACT;
  noteEl.appendChild(document.createTextNode(NOTE.slice(cut + FACT.length)));
} else {
  noteEl.textContent = NOTE;
}

/* the tokens — the same 30 capsules the model actually saw */
var TOKENS = ["Notes", " for", " the", " invoice", " run", ".", " The", " vendor", " code", " for", " Ridge", "way", " is", " RW", "-", "88", ".", " Now", " write", " the", " Ridge", "way", " summary", ".", " The", " vendor", " code", " is"];
var toksHost = document.getElementById("toks");
var tokEls = TOKENS.map(function (t, i) {
  var el = FX.el("tok" + (i >= 13 && i <= 15 ? " gold" : ""), toksHost);
  el.textContent = t;
  return el;
});

/* ══════════════════ ph1 — s6: the run ════════════════════════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);                          // "That sounded like something I should check…"
  var t1 = Math.max(beatAt(1, 0.30), t0 + 2.0);     // "So I ran a small open model on my own machine…"

  var codeEl = document.getElementById("code"), outEl = document.getElementById("out");
  codeEl.textContent = "";
  outEl.textContent = "";
  gsap.set("#term", { opacity: 0, y: FX.px(22) });
  gsap.set("#notecol", { opacity: 0, x: FX.px(24) });
  gsap.set(tokEls, { opacity: 0, y: FX.px(8) });

  tl.to("#term", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t0);

  /* the code types itself — one property tween, seek-safe */
  var typ = { n: 0 };
  tl.to(typ, {
    n: CODE_TEXT.length, duration: Math.max((t1 - t0) * 0.82, 1.6), ease: "none",
    onUpdate: function () { codeEl.textContent = CODE_TEXT.slice(0, Math.floor(typ.n)); },
  }, t0 + 0.35);

  /* the note it is handed, and the tokens it becomes */
  tl.to("#notecol", { opacity: 1, x: 0, duration: 0.42, ease: "power3.out" }, t1 - 0.5);
  tokEls.forEach(function (el, i) {
    FX.fromTo(tl, el, { opacity: 0, y: FX.px(8) }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, t1 + 0.1 + i * 0.035);
  });

  /* and it runs */
  var run = { n: 0 };
  tl.to(run, {
    n: RUN_OUT.length, duration: Math.max(D - t1 - 1.0, 1.2), ease: "none",
    onUpdate: function () { outEl.textContent = RUN_OUT.slice(0, Math.floor(run.n)); },
  }, t1 + 0.9);
  FX.camera(tl, { at: t1, scale: 1.02, dur: Math.max(D - t1 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════ ph2 — s7: every row = 1.0000000 ══════════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);                          // "First I checked whether the total is really fixed."
  var u1 = Math.max(beatAt(1, 0.12), u0 + 1.0);     // "It is."
  var u2 = Math.max(beatAt(2, 0.26), u1 + 0.6);     // "Every row of every layer added up to one point zero…"
  var u3 = Math.max(beatAt(3, 0.72), u2 + 3.4);     // "The budget is not a metaphor."
  var u4 = Math.max(beatAt(4, 0.82), u3 + 0.8);     // "It is arithmetic."

  /* opening frame = the terminal from s6, already there, with its code and its output */
  gsap.set("#term", { opacity: 1, y: 0 });
  gsap.set("#notecol", { opacity: 1, x: 0 });
  gsap.set(tokEls, { opacity: 1, y: 0 });
  document.getElementById("code").textContent = CODE_TEXT;
  document.getElementById("out").textContent = RUN_OUT;
  document.getElementById("tname").textContent = "attention.py — row sums, 12 layers x 12 heads";

  /* 144 real rows, every one of them 1.0000000 (the deviations are the measured ones) */
  var rowsHost = document.getElementById("rows");
  var r = FX.rng(5);
  var ROWS = 144, rowEls = [];
  for (var i = 0; i < ROWS; i++) {
    var el = FX.el("row", rowsHost);
    var lbl = FX.el("lbl", el, "span");
    lbl.textContent = "layer " + (Math.floor(i / 12) + 1) + " · head " + ((i % 12) + 1);
    var sum = FX.el("sum", el, "span");
    var d = (r() - 0.5) * 1.2e-6;
    sum.textContent = (1 + d).toFixed(7);
    rowEls.push(el);
  }

  tl.to("#code", { opacity: 0, duration: 0.3 }, u0 + 0.1);
  tl.to("#out", { opacity: 0, duration: 0.3 }, u0 + 0.1);
  FX.fromTo(tl, "#rowswrap", { opacity: 0 }, { opacity: 1, duration: 0.3 }, u0 + 0.25);

  /* they scroll for the whole beat — and keep scrolling under the 2.0s hold, so the frame is alive
     while the viewer reads the number (D-063: a hold is a designed beat, not a parked frame). */
  var lineH = 21 * 1.62 * S.U;                       // the .row line box, in CSS px
  var travel = Math.max(ROWS * lineH - 560 * S.U, 200 * S.U);
  FX.fromTo(tl, "#rows", { y: 0 }, { y: -travel, duration: Math.max(D - u0 - 0.6, 2.0), ease: "none" }, u0 + 0.3);

  /* "It is." — the deviation readout lands and settles */
  FX.fromTo(tl, "#dev", { opacity: 0, y: FX.px(8) }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, u1);
  FX.fromTo(tl, "#instrument", { scale: 1 }, { scale: 1.04, duration: 0.16, yoyo: true, repeat: 1, ease: "sine.inOut" }, u2);

  /* the verdict, on the two short sentences */
  gsap.set("#verdict", { opacity: 0, y: FX.px(14) });
  document.getElementById("vbig").textContent = props.verdict || "Not a metaphor. Arithmetic.";
  tl.to("#verdict", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u3);
  FX.fromTo(tl, "#vbig", { scale: 1 }, { scale: 1.035, duration: 0.16, yoyo: true, repeat: 1, ease: "sine.inOut" }, u4);
  FX.camera(tl, { at: u3, scale: 1.02, dur: Math.max(D - u3 - 0.2, 0.6), ease: "sine.out" });
}

HF.register("at-measure-run", tl);
