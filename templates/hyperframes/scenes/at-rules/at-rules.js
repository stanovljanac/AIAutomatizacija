/* at-rules — 023 s22 / s23 / s24. The three habits, each one WORKED rather than listed.
 *
 * The rail carries all three rules in every phase, with the live one lit — the viewer always knows
 * where they are and nothing shoves in late. Each phase then does the arithmetic on screen: rule 1
 * compares two real prompts and their two bars, rule 2 refuses to produce a second budget, rule 3
 * takes one page out of a folder and lets the answer's slice fill what is left.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-rules", width: 1920, height: 1080, frames: 453, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 113, bloomX: 50, bloomY: 40 });

var PHASE = Math.min(Math.max(Number(props.phase) || 1, 1), 3);
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var RULES = props.items && props.items.length ? props.items : [
  "Delete, don't emphasize.",
  "One task per prompt.",
  "The page, not the folder.",
];
var railHost = document.getElementById("rail");
RULES.forEach(function (r, i) {
  var el = FX.el("rl" + (i === PHASE - 1 ? " on" : ""), railHost);
  var n = FX.el("rlnum", el);
  n.textContent = String(i + 1);
  var t = FX.el("rltext", el);
  t.textContent = r;
});

/* ══════════════════ ph1 — s22: delete, don't emphasize ═══════════════════════ */
if (PHASE === 1) {
  gsap.set(["#two", "#folder"], { display: "none" });
  var t0 = beatAt(0, 0.0);                          // "One. Delete, don't emphasize."
  var t1 = Math.max(beatAt(1, 0.24), t0 + 2.0);     // "Writing 'IMPORTANT' in capitals … adds one more competitor."
  var t2 = Math.max(beatAt(2, 0.60), t1 + 4.0);     // "Removing the three paragraphs you did not need changes the division itself."

  var before = document.getElementById("baBefore"), after = document.getElementById("baAfter");
  /* the prop may already carry the shout; never print it twice */
  var beforeText = String(props.before || "read the whole brief, then answer the invoice question.")
    .replace(/^\s*IMPORTANT:\s*/i, "");
  var cap = FX.el("cap", before, "span");
  cap.textContent = "IMPORTANT: ";
  before.appendChild(document.createTextNode(beforeText));
  /* and the wall of text the shout is sitting in front of — that IS the competitor it adds to */
  var PASTED = [
    "Ridgeway was onboarded in March; contact is the accounts desk, not the site manager.",
    "Terms were agreed by email and purchase orders are raised monthly, not per delivery.",
    "§4 net thirty from the invoice date. §9 renewal is automatic. §11 disputed lines are held.",
    "Q2 volumes held steady, two credit notes issued in May, both resolved, no open disputes.",
    "Ridgeway Supplies Ltd · vendor code RW-88 · invoice run: August · status: active.",
    "Expenses are filed monthly; receipts over the threshold need a manager's approval.",
  ];
  PASTED.forEach(function (line) {
    var el = FX.el("pasted", before);
    el.textContent = line;
  });
  var f1 = FX.el("fact", after, "span");
  f1.textContent = props.after || "The vendor code for Ridgeway is RW-88. Which code goes on the August invoice?";

  document.getElementById("baPctL").textContent = props.beforePct || "10.0%";
  document.getElementById("baPctR").textContent = props.afterPct || "61%";

  var cols = document.querySelectorAll(".ba .col");
  FX.fromTo(tl, cols[0], { opacity: 0, y: FX.px(18) }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t0 + 0.2);
  FX.fromTo(tl, "#baFillL", { scaleX: 0 }, { scaleX: parseFloat(props.beforePct || "10") / 100, duration: 0.5, ease: "power3.out" }, t1 + 0.2);
  FX.fromTo(tl, cols[1], { opacity: 0, y: FX.px(18) }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t2);
  FX.fromTo(tl, "#baFillR", { scaleX: 0 }, { scaleX: parseFloat(props.afterPct || "61") / 100, duration: 0.6, ease: "power3.out" }, t2 + 0.3);
  FX.camera(tl, { at: t2, scale: 1.02, dur: Math.max(D - t2 - 0.2, 0.6), ease: "sine.out" });

/* ══════════════════ ph2 — s23: one task per prompt ═══════════════════════════ */
} else if (PHASE === 2) {
  gsap.set(["#ba", "#folder"], { display: "none" });
  gsap.set("#two", { opacity: 1 });
  var u0 = beatAt(0, 0.0);                          // "Two. One task per prompt."
  var u1 = Math.max(beatAt(1, 0.24), u0 + 2.0);     // "A second question … is a claim on the same fixed sum."
  var u2 = Math.max(beatAt(2, 0.62), u1 + 4.0);     // "Ask two things at once … You get one budget, split."

  var TASKS = props.twoTasks && props.twoTasks.length ? props.twoTasks : ["Summarise the Ridgeway contract.", "And draft the invoice email."];
  var qHost = document.getElementById("qs");
  var qEls = TASKS.map(function (q) {
    var el = FX.el("q", qHost);
    el.textContent = q;
    return el;
  });
  var ansHost = document.getElementById("answers");
  var ANSWERS = [
    { tag: "answer 1", text: "Net thirty terms, automatic renewal, disputed lines held. (Half the sections went unread.)" },
    { tag: "answer 2", text: "Dear Ridgeway, please find the August invoice attached. (No code, no amount, no dates.)" },
  ];
  var ansEls = ANSWERS.map(function (a) {
    var el = FX.el("ans", ansHost);
    var tag = FX.el("anstag", el, "span");
    tag.textContent = a.tag;
    el.appendChild(document.createTextNode(a.text));
    return el;
  });

  gsap.set(qEls, { opacity: 0, x: FX.px(-14) });
  gsap.set(ansEls, { opacity: 0, y: FX.px(16) });

  tl.to(qEls[0], { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, u0 + 0.2);
  tl.to(qEls[1], { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, u1);
  /* the second question does NOT bring a second budget: the same bar splits */
  tl.to("#obA", { width: "52%", duration: 0.55, ease: "power3.out" }, u1 + 0.3);
  tl.to("#obB", { width: "48%", duration: 0.55, ease: "power3.out" }, u1 + 0.3);
  FX.fromTo(tl, ".obtrack", { x: FX.px(-6) }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.45)" }, u1 + 0.35);
  tl.to(ansEls[0], { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, u2 + 0.2);
  tl.to(ansEls[1], { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, u2 + 0.45);
  FX.camera(tl, { at: u2, scale: 1.02, dur: Math.max(D - u2 - 0.2, 0.6), ease: "sine.out" });

/* ══════════════════ ph3 — s24: the page, not the folder ══════════════════════ */
} else {
  gsap.set(["#ba", "#two"], { display: "none" });
  gsap.set("#folder", { opacity: 1 });
  var v0 = beatAt(0, 0.0);                          // "Three. Hand it the page, not the folder."
  var v1 = Math.max(beatAt(1, 0.28), v0 + 1.8);     // "If you know which document holds the answer, paste that one."
  var v2 = Math.max(beatAt(2, 0.66), v1 + 2.6);     // "Everything else you attach is bidding against it."

  var FILES = props.folder && props.folder.length ? props.folder : [
    "onboarding brief.pdf", "contract-2026.pdf", "q2-notes.docx", "vendor-sheet.xlsx", "policy-v9.pdf", "invoice-run.csv",
  ];
  var PICK = 3;
  var filesHost = document.getElementById("files");
  var fileEls = FILES.map(function (f, i) {
    var el = FX.el("file" + (i === PICK ? " pick" : ""), filesHost);
    el.textContent = f;
    return el;
  });
  document.getElementById("polbl").textContent = props.page || "vendor-sheet.xlsx · row 12 · RW-88";

  gsap.set(fileEls, { opacity: 0, y: FX.px(14) });
  gsap.set("#pageout", { opacity: 0, y: FX.px(20), scale: 0.96 });

  fileEls.forEach(function (el, i) {
    FX.fromTo(tl, el, { opacity: 0, y: FX.px(14) }, { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" }, v0 + 0.1 + i * 0.08);
  });
  /* the whole folder is dragged toward the window, then stopped */
  FX.fromTo(tl, "#files", { x: 0 }, { x: FX.px(60), duration: 0.5, ease: "power2.inOut" }, v1 - 0.5);
  tl.to("#files", { x: 0, duration: 0.35, ease: "power3.out" }, v1);
  /* one page is pulled out; the rest go quiet but stay on screen — they are the bidders */
  tl.to("#pageout", { opacity: 1, y: 0, scale: 1, duration: 0.44, ease: "power3.out" }, v1 + 0.3);
  fileEls.forEach(function (el, i) {
    if (i === PICK) return;
    tl.to(el, { opacity: 0.32, duration: 0.4 }, v2);
  });
  FX.fromTo(tl, fileEls[PICK], { scale: 1 }, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, v2 + 0.1);

  /* and the arithmetic that makes it a rule rather than advice: the same fixed total, divided over
     the folder and then over the one page */
  gsap.set("#fbar", { opacity: 0, y: FX.px(16) });
  gsap.set(["#fbFolder", "#fbPage"], { scaleX: 0 });
  tl.to("#fbar", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, v1 + 0.7);
  FX.fromTo(tl, "#fbFolder", { scaleX: 0 }, { scaleX: 0.10, duration: 0.45, ease: "power3.out" }, v1 + 0.9);
  FX.fromTo(tl, "#fbPage", { scaleX: 0 }, { scaleX: 0.68, duration: 0.6, ease: "power3.out" }, v2 + 0.2);
  FX.count(tl, document.getElementById("fbPageVal"), {
    from: 10, to: 68, at: v2 + 0.2, dur: 0.6, fmt: function (v) { return Math.round(v) + "%"; },
  });
  FX.camera(tl, { at: v2, scale: 1.02, dur: Math.max(D - v2 - 0.2, 0.6), ease: "sine.out" });
}

HF.register("at-rules", tl);
