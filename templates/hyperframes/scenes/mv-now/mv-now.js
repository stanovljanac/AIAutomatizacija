/* mv-now — 025 s8, WHY NOW (mechanical, blue + gold, face-on).
 *
 * PREMISE. The news beat, told on the object instead of with a logo wall. "Agents stopped waiting for
 * you" is one swap the viewer can watch: the hand crank (you, starting it) comes off the barrel and a
 * clock takes its place. The launches are the CORE changing: the cartridge ejects and another seats, three
 * times, each under its own name plate, and the machine around it never changes — the tool is modular,
 * the job is the same. "When your computer is off" is the room going dark while the train keeps turning.
 * The last beat is OpenAI's own sentence over a machine that keeps running: one envelope has already left,
 * and it stays gone. (A version that STOPPED the train on "undo" read as the video freezing — owner,
 * 2026-10-16 — so nothing in this scene ever stands still.) Every claim wears its source.
 *
 * SHOTS:  A 0    barrel: the crank comes off, the clock seats     "…agents have stopped waiting for you."
 *         B b1   the core: first cartridge + name plate            "On September twenty-ninth, OpenAI launched Dots."
 *         C b2   wide, the lights go down, it keeps running        "…keep working when your computer is off."
 *         D b3   two more cartridges; the clock                    "Claude's routines and Cursor's automations already run on a schedule."
 *         E b4   one leaves; the machine runs on; still gone       "…stopping it doesn't undo what it already did."
 */
var S = HF.scene({ id: "mv-now", width: 1920, height: 1080, frames: 776, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.16), b2 = K.b(2, 0.32), b3 = K.b(3, 0.49), b4 = K.b(4, 0.7), b5 = K.b(5, 0.8);
var m = props.measured || {};
var tStopped = K.m("stopped", 2.3), tSept = K.m("september", b1 + 0.13), tDots = K.m("dots", b1 + 3.0), tOff = K.m("off", b2 + 3.4);
var tRoutines = K.m("routines", b3 + 0.33), tAutos = K.m("automations", b3 + 2.0), tSched = K.m("schedule", b3 + 4.4), tMistakes = K.m("mistakes", b5 + 0.6), tUndo = K.m("undo", b5 + 2.9);
var E = HW.E, span = HF3.span, mix = HF3.mix;

function chip(id, html) { return '<div class="hw-plate hw-chip src" id="' + id + '">' + html + '</div>'; }
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="k1">Agents stopped <span class="g">waiting for you.</span></div>' +
  chip("c1", "OpenAI <b>Dots</b> · launched <b>29 Sep 2026</b> · TechCrunch, NBC News") +
  chip("c2", "“It can keep working even when your computer is off.” · <b>OpenAI docs</b>") +
  chip("c3", "“…all without stopping for approval” · <b>Claude Code docs, Routines</b>") +
  '<div class="hw-plate hm-tag red" id="gone">already sent</div>' +
  '<div class="hw-plate hm-quote" id="quote"><div class="q">“Your dot can make mistakes, and stopping a task <span class="g">doesn\'t undo actions it has already completed.</span>”</div><div class="src"><b>OpenAI</b> · Meet dots · learn.chatgpt.com/docs/dots</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#k1", "#c1", "#c2", "#c3", "#gone", "#quote"], { opacity: 0 });
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tStopped + 0.25);
tl.to("#k1", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, tDots - 0.95);
function chipIn(id, t0, t1) { HW.fromTo(tl, id, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, t0); tl.to(id, { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, t1); }
chipIn("#c1", tDots - 0.6, b2 + 0.9);
chipIn("#c2", b2 + 1.15, b3 - 0.1);
chipIn("#c3", tRoutines + 0.2, b4 - 0.1);
HW.fromTo(tl, "#quote", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, b5 - 0.25);
HW.fromTo(tl, "#gone", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28, ease: "back.out(1.6)" }, tMistakes + 0.85);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-now", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0, 0.4], keyAngle: 0.48 });
  var M = HMV.build(ctx, { doLine: m.doLine });
  var L = M.L, by = M.by;
  var KEY0 = ctx.key.intensity, RAKE0 = ctx.rake.intensity, FILL0 = ctx.fill.intensity;

  /* three cartridges: the same seat, a different core, its own name plate */
  var SWAPS = [
    { t: tSept + 0.15, col: 0x8fe0ff, name: "DOTS · OpenAI" },
    { t: tRoutines - 0.3, col: 0xff9a4a, name: "ROUTINES · Claude Code" },
    { t: tAutos - 0.3, col: 0xd9c8ff, name: "AUTOMATIONS · Cursor" },
  ];
  var BLUE = new THREE.Color(0x2f8cff), cTmp = new THREE.Color();
  SWAPS.forEach(function (s) {
    s.c = new THREE.Color(s.col);
    s.plate = HMV.plaque(ctx, s.name, 3.0, 0.42, { tone: "steel", ground: "#18222d", ink: "#dbe8f5", size: 46, track: 4, thick: 0.06 });
    s.plate.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
    ctx.scene.add(s.plate);
  });
  var PLATE = [L.reader.x + 0.45, L.reader.y + 1.52, 1.0];

  /* work keeps arriving: a card every couple of seconds, each one sent */
  var go = M.INVOICES.filter(function (v) { return v.kind === "go"; });
  var tStray = tMistakes + 0.15;
  var list = go.map(function (inv, i) { return { inv: inv, t0: b1 + 0.6 + i * 1.75, fate: "send", pre: "due" }; }).filter(function (c) { return c.t0 + 2 < tStray - 1.2; });
  list.push({ inv: M.INVOICES[4], t0: tStray - 1.9, fate: "send", pre: "due", stray: true, to: "Linden Dental" });
  var job = M.job(list, { feed: 0.75, read: 0.45, move: 0.45, flip: 0.25, fly: 0.55 });

  /* the train: cranked, then self-starting, and it never stops */
  var rate = function () { return 0.8; };
  var th = HM.integral(rate, D), tk = HM.integral(function (t) { return 5 * (rate(t) / 0.8); }, D);
  var tCrankOff = tStopped - 0.55, tWhenIn = tCrankOff + 0.25;
  function night(t) { return Math.min(E.inOut(span(t, tOff - 0.9, tOff - 0.2)), 1 - E.inOut(span(t, b3 - 0.25, b3 + 0.45))); }

  var cam = M.cam([
    { t: 0, v: [-5.2, -1.6, 9.9, 0, 0, 0] },
    { t: tCrankOff + 0.1, v: [-5.2, -1.6, 9.6, 0, 0, 0], e: "out2" },
    { t: tWhenIn + 1.05, v: [-4.6, 2.05, 9.9, 0, 0, 0], e: "inOut" },
    { t: b1 - 0.2, v: [-4.6, 2.05, 9.7, 0, 0, 0] },
    { t: b1 + 0.85, v: [1.3, 2.35, 10.4, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.25, v: [1.3, 2.35, 10.2, 0, 0, 0] },
    { t: b2 + 1.05, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0], e: "inOut" },
    { t: b3 - 0.2, v: [0, M.LOOK_Y, 26.6, 0, 0, 0] },
    { t: b3 + 0.95, v: [-1.6, 2.0, 14.6, 0, 0, 0], e: "inOut" },
    { t: b4 - 0.2, v: [-1.6, 2.0, 14.4, 0, 0, 0] },
    { t: b4 + 1.05, v: [1.2, -0.5, 24.5, 0, 0, 0], e: "inOut" },
    { t: D, v: [2.0, -0.6, 22.6, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("read", false); M.set("report", false); M.set("stop", false);
    M.assemble("crank", 1 - E.in2(span(t, tCrankOff, tCrankOff + 0.6)), "off", { stagger: 0, ease: E.lin });
    M.assemble("when", span(t, tWhenIn, tWhenIn + 1.15), "off", { stagger: 0.5 });
    M.drive(th(t));
    M.tick(tk(Math.max(t - tWhenIn - 1.0, 0)) );
    M.lever(0);
    var st = job.update(t);
    M.trap(0); M.push(st.push); M.hammer(0); M.flag(0);

    /* the cartridge: out toward the lens and up, the next one in from below */
    var core = by.core.obj, glowCol = BLUE, shown = -1;
    for (var i = 0; i < SWAPS.length; i++) {
      var s = SWAPS[i], out = E.in2(span(t, s.t, s.t + 0.32)), inn = E.out5(span(t, s.t + 0.34, s.t + 0.8));
      if (t >= s.t && t < s.t + 0.34) { core.position.z += out * 5; core.position.y += out * 2.2; core.scale.setScalar(Math.max(1 - out * 0.7, 0.01)); core.rotation.z += out * 1.6; }
      else if (t >= s.t + 0.34 && t < s.t + 0.8) { core.position.z += (1 - inn) * 5; core.position.y -= (1 - inn) * 2.6; core.rotation.z -= (1 - inn) * 1.6; }
      if (t >= s.t + 0.34) { glowCol = s.c; shown = i; }
    }
    by.core.lens.emissive.copy(cTmp.copy(glowCol));
    var n = night(t);
    M.core(st.glow * (1 + 0.9 * n) * (rate(t) > 0.05 ? 1 : 0.45), st.scanU, st.scanOn);
    for (i = 0; i < SWAPS.length; i++) {
      var sw = SWAPS[i], on = i === shown, tin = E.out5(span(t, sw.t + 0.45, sw.t + 0.95)), next = SWAPS[i + 1];
      var tout = next ? E.in2(span(t, next.t - 0.1, next.t + 0.3)) : E.in2(span(t, b4 - 0.3, b4 + 0.2));
      sw.plate.visible = (on || (next && t < next.t + 0.3 && t >= sw.t + 0.45)) && tout < 0.999 && tin > 0.001;
      sw.plate.position.set(PLATE[0], PLATE[1] + (1 - tin) * 1.4 + tout * 1.4, PLATE[2] + (1 - tin) * 2.5 + tout * 2.5);
      sw.plate.scale.setScalar(Math.max(tin * (1 - tout), 0.001));
    }
    /* "when your computer is off": the room goes dark, the machine does not */
    ctx.key.intensity = KEY0 * (1 - 0.86 * n); ctx.rake.intensity = RAKE0 * (1 - 0.6 * n); ctx.fill.intensity = FILL0 * (1 - 0.5 * n);
    ctx.scene.environmentIntensity = 1 - 0.8 * n;
  }
  function renderAt(time) {
    var t = K.t(time), n = night(t);
    ctx.render(t, pose, cam, { vig: 0.5 + 0.2 * n });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
