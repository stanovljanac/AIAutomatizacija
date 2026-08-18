/* cw-window-frame — 022 s2 (phase 1) and s3 (phase 2). One file so the gold frame and the four
 * labelled groups cross the boundary as the SAME object at the same size and position.
 * Phase 1 concedes the true part (a window everything must fit inside); phase 2 empties it.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cw-window-frame", width: 1920, height: 1080, frames: 541, beatLo: 0.0, beatHi: 0.25 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 22, seed: 5, bloomY: 46 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── geometry (shared by both phases so the carry is literal) ─────────────────── */
var PILE_Y = P ? 1210 : 762;            // identical to s1's pile — this scene opens on it
var STACK_X = P ? 210 : 430;            // how far right a group's mini-stack sits
var ROW_Y = P ? [700, 880, 1060, 1240] : [382, 492, 602, 712];
var LABELS = props.groups || ["your conversation", "your instructions", "the document you pasted", "the answer it's writing"];

document.getElementById("motif").textContent = props.motif || "Here's what's actually happening.";
document.getElementById("framelabel").textContent = props.frameLabel || "The context window";
document.getElementById("empty").textContent = props.emptyLine || "Nothing is kept.";

/* the 13 pages carried in from s1 — same count, same seed, same place */
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: 13, baseY: PILE_Y, w: P ? 760 : 780, gap: 22, seed: 41, gold: [12],
});

/* the four labelled groups they redistribute into */
var rowsHost = document.getElementById("rows");
var rows = LABELS.map(function (text, i) {
  var row = FX.el("row" + (i === 3 ? " gold" : ""), rowsHost);
  row.style.top = FX.px(ROW_Y[i] - 40);
  row.style.height = FX.px(80);
  var l = FX.el("rowlbl", row);
  l.textContent = text;
  return row;
});
/* which pages land in which group: 4 + 4 + 4 + the model's own gold page */
var GROUP = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12]];

/** the resting transform of page `idx` once it has joined its group */
function grouped(idx) {
  for (var g = 0; g < GROUP.length; g++) {
    var k = GROUP[g].indexOf(idx);
    if (k >= 0) return { x: STACK_X, y: ROW_Y[g] - k * 13 - slabs[idx]._y, sx: 0.38 };
  }
  return { x: 0, y: 0, sx: 1 };
}

/* the token capsules the top page dissolves into (the Ep.2 callback) */
var capsHost = document.getElementById("caps");
var caps = (props.chunks || ["your", " con", "ver", "sa", "tion", " so", " far"]).map(function (c) {
  var s = FX.el("cap", capsHost, "span");
  s.textContent = c;
  return s;
});

/* the ghost room — shelves with the conversation filed on them (phase 2 only) */
var room = document.getElementById("room");
var rr = FX.rng(17);
var boxes = [];
[P ? 640 : 360, P ? 900 : 520, P ? 1160 : 680].forEach(function (y) {
  var sh = FX.el("shelf", room);
  sh.style.top = FX.px(y);
  sh.style.width = FX.px(P ? 900 : 1180);
  for (var i = 0; i < 6; i++) {
    var b = FX.el("box", room);
    var w = 70 + Math.round(rr() * 90), h = 60 + Math.round(rr() * 40);
    b.style.width = FX.px(w);
    b.style.height = FX.px(h);
    b.style.left = FX.px((P ? 530 : 400) + i * (P ? 145 : 190) + Math.round(rr() * 20));
    b.style.top = FX.px(y - h);
    boxes.push(b);
  }
});

/* ═══════════════════════════════════════════════════════════════════════════════
   PHASE 1 — s2: the window is real, and everything has to fit inside it
   ═══════════════════════════════════════════════════════════════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.09), t0 + 1.2);   // "Every model has a context window…"
  var t2 = Math.max(beatAt(2, 0.51), t1 + 6.0);   // "Your conversation, your instructions…"
  var t3 = Math.max(beatAt(3, 0.95), t2 + 6.0);   // "That part is true."

  /* opening frame: the pile from s1, already there (a cut has no runway) */
  gsap.set("#motif", { opacity: 0, y: FX.px(-16) });
  gsap.set(["#edgeT", "#edgeB"], { scaleX: 0 });
  gsap.set(["#edgeL", "#edgeR"], { scaleY: 0 });
  gsap.set("#frame", { opacity: 0 });
  gsap.set("#framelabel", { opacity: 0, x: FX.px(-20) });
  gsap.set("#tick", { opacity: 0, scale: 2.4 });
  gsap.set(rows, { opacity: 0 });
  gsap.set(caps, { opacity: 0, scale: 0.6 });
  gsap.set("#room", { opacity: 0 });
  gsap.set("#empty", { opacity: 0 });

  tl.to("#motif", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t0 + 0.12);
  tl.to("#motif", { opacity: 0, y: FX.px(-18), duration: 0.3, ease: "power2.in" }, t2 - 0.5);

  /* the frame draws itself around the pile — the pages were always inside it */
  tl.to("#frame", { opacity: 1, duration: 0.3 }, t1 + 0.35);
  tl.to("#edgeT", { scaleX: 1, duration: 0.34, ease: "power3.out" }, t1 + 0.4);
  tl.to("#edgeR", { scaleY: 1, duration: 0.34, ease: "power3.out" }, t1 + 0.62);
  tl.to("#edgeB", { scaleX: 1, duration: 0.34, ease: "power3.out" }, t1 + 0.84);
  tl.to("#edgeL", { scaleY: 1, duration: 0.34, ease: "power3.out" }, t1 + 1.06);
  tl.to("#framelabel", { opacity: 1, x: 0, duration: 0.36, ease: "power3.out" }, t1 + 1.3);

  /* "counted in the chunks we measured last time" — the top page dissolves into token capsules */
  var tc = Math.min(t1 + 5.0, t2 - 1.9);
  tl.to(slabs[12], { opacity: 0, scaleX: 0.7, duration: 0.24, ease: "power2.in" }, tc);
  caps.forEach(function (c, i) {
    tl.to(c, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2.2)" }, tc + 0.1 + i * 0.045);
    tl.to(c, { opacity: 0, scale: 0.72, duration: 0.2, ease: "power2.in" }, tc + 1.15 + i * 0.02);
  });
  tl.to(slabs[12], { opacity: 1, scaleX: 1, duration: 0.3, ease: "power3.out" }, tc + 1.3);

  /* the same 13 pages redistribute into the four labelled groups, one phrase at a time */
  var span = Math.max(t3 - t2 - 1.4, 3.6);
  GROUP.forEach(function (ids, g) {
    var at = t2 + 0.25 + (g * span) / 4;
    tl.to(rows[g], { opacity: 1, duration: 0.3, ease: "power2.out" }, at);
    FX.fromTo(tl, rows[g].querySelector(".rowlbl"), { x: FX.px(-26), opacity: 0 }, { x: 0, opacity: 1, duration: 0.36, ease: "power3.out" }, at);
    ids.forEach(function (idx, k) {
      var G = grouped(idx);
      tl.to(slabs[idx], { x: FX.px(G.x), y: FX.px(G.y), scaleX: G.sx, duration: 0.55, ease: "power3.inOut" }, at + 0.06 + k * 0.06);
    });
    /* The groups leave BOTTOM-UP (that is the narration's order), so without this the pages left
       behind stay floating at their old height and the remainder lands across the NEXT row's label
       — measured on the 022 render at 25–29s, owner 2026-08-17. Settling them back onto the base
       keeps the source pile on the floor and reads as the pile being sorted down. */
    var rest = [];
    for (var q = g + 1; q < GROUP.length; q++) rest = rest.concat(GROUP[q]);
    if (rest.length) {
      tl.to(rest.map(function (idx) { return slabs[idx]; }),
        { y: "+=" + FX.px(ids.length * 22), duration: 0.35, ease: "power2.inOut" }, at + 0.45);
    }
  });

  /* "That part is true." — a green tick, deliberately NO strike-through */
  tl.to("#tick", { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.6)" }, t3 + 0.1);
  tl.to("#frame", { boxShadow: "inset 0 0 " + FX.px(150) + " rgba(61,220,151,0.16)", duration: 0.6 }, t3 + 0.1);
  FX.camera(tl, { at: t3 + 0.1, scale: 1.03, dur: Math.max(D - t3 - 0.2, 0.6), ease: "sine.out" });

/* ═══════════════════════════════════════════════════════════════════════════════
   PHASE 2 — s3: a window sounds like a room where things are KEPT. Nothing is kept.
   ═══════════════════════════════════════════════════════════════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.53), u0 + 3.4);   // "Nothing is kept."
  var u2 = Math.max(beatAt(2, 0.64), u1 + 0.9);   // "…the model holds nothing at all."

  /* opening frame = exactly where phase 1 ended */
  gsap.set("#motif", { opacity: 0 });
  gsap.set("#frame", { opacity: 1 });
  gsap.set(["#edgeT", "#edgeB"], { scaleX: 1 });
  gsap.set(["#edgeL", "#edgeR"], { scaleY: 1 });
  gsap.set("#framelabel", { opacity: 1, x: 0 });
  gsap.set("#tick", { opacity: 1, scale: 1 });
  gsap.set(rows, { opacity: 1 });
  gsap.set(caps, { opacity: 0 });
  gsap.set("#empty", { opacity: 0, y: FX.px(24) });
  gsap.set("#room", { opacity: 0 });
  gsap.set(boxes, { opacity: 0, y: FX.px(18) });
  slabs.forEach(function (s, i) {
    var G = grouped(i);
    gsap.set(s, { x: FX.px(G.x), y: FX.px(G.y), scaleX: G.sx });
  });

  /* the wrong mental model builds behind it: a room, with the conversation filed away */
  tl.to("#room", { opacity: 0.62, duration: 0.7, ease: "sine.out" }, u0 + 0.3);
  boxes.forEach(function (b, i) {
    tl.to(b, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, u0 + 0.45 + i * 0.06);
  });
  tl.to("#tick", { opacity: 0.25, duration: 0.5 }, u0 + 0.4);

  /* "Nothing is kept." — the shelves, the boxes and every page evaporate upward, in ONE beat */
  var goners = boxes.concat(slabs).concat(rows.map(function (r) { return r.querySelector(".rowlbl"); }));
  goners.forEach(function (g, i) {
    tl.to(g, { y: "-=" + FX.px(240), opacity: 0, duration: 0.5, ease: "power2.in" }, u1 + (i % 13) * 0.022);
  });
  tl.to("#room", { opacity: 0, duration: 0.5, ease: "power2.in" }, u1 + 0.1);

  /* the frame is left empty — composed emptiness, held, then pushed into */
  tl.to("#empty", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, u2 + 0.15);
  tl.to("#frame", { boxShadow: "inset 0 0 " + FX.px(140) + " rgba(56,132,208,0.06)", duration: 0.8 }, u1 + 0.2);
  FX.camera(tl, { at: u2 + 0.2, scale: 1.05, dur: Math.max(D - u2 - 0.35, 0.8), ease: "sine.inOut" });
}

HF.register("cw-window-frame", tl);
