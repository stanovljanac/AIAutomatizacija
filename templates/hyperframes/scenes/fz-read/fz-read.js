/* fz-read — 024 s4 (3D). "Everything after that is just reading."
 *
 * PREMISE. Using a model is a ONE-WAY street, and the scene draws the street: your messages land as
 * real pages on 022's pile inside the glass frame of the context window; a read beam leaves the pile,
 * enters the frozen block and lights its twelve layers in order (front = layer 1); the next word rises
 * out of the far side; and when a red write-back stream tries to go the other way it dies on the ice
 * on "nothing". Everything visible keeps moving forward, nothing in the block changes.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    orbit to the front; the window lights            "Everything after that is just reading."
 *   B  b1   pages fly in and stack on the pile               "Your messages go into the window, the pile…"
 *   C  b2   read through 12 layers → next word → no write    "It reads the whole pile, predicts the next word, and writes nothing back."
 */
var S = HF.scene({ id: "fz-read", width: 1920, height: 1080, frames: 330, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
/* word marks: each typed offset below was read off the draft (edge-tts) alignment; a re-voice
   re-reads them into props.offsets — absent, every mark is exactly the typed value */
var OFF = props.offsets || {};
function off(k, v) { return typeof OFF[k] === "number" ? OFF[k] : v; }
var b1 = S.beatAt(1, 0.224), b2 = S.beatAt(2, 0.603);
var tWindow = b1 + off("Window", 1.20), tPile = b1 + off("Pile", 2.05), tAgo = b1 + off("Ago", 3.37), tReads = b2 + off("Reads", 0.15), tNext = b2 + off("Next", 1.98), tWord = b2 + off("Word", 2.27), tWrites = b2 + off("Writes", 3.08), tNothing = b2 + off("Nothing", 3.33), tBack = b2 + off("Back", 3.57);
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">the window = <b>the pile</b> · Desk Lessons Ep. 3</div>' +
  '<div class="hw-plate hw-kicker" id="kick">It reads. It <span class="g">never writes.</span></div>' +
  '<div class="hw-plate hw-count" id="cnt"><div class="lbl">written back to the model</div><div class="num ice">0 numbers</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#kick", "#cnt"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tAgo - 0.25);
tl.to("#chip", { opacity: 0, x: -30, duration: 0.2, ease: "power2.in" }, b2 + 0.05);
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, b2 + 0.3);
HW.fromTo(tl, "#cnt", { opacity: 0, y: -20, scale: 1.2 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power4.out" }, tNothing);
HF.register("fz-read", tl);

var PAGES = [
  ["Hi! Quick question about our trip.", "I'm planning the whole route", "for the September conference."],
  ["Here's my itinerary draft:", "fly in on the 12th, two hotels,", "a train pass for the coast."],
  ["Budget so far: flights 640,", "hotels 910, train 120.", "Does that look reasonable?"],
  ["Also, the conference venue", "is in the capital, right?", "I want to book close to it."],
  ["What's the capital of Turkey?"],
];

HF3.boot(function (THREE) {
  var ctx = HW.create(THREE, { W: W, H: H, palette: "body", fov: 38, bloom: 0.6, bloomWide: 0.5, maxCoc: 11, range: 9 });
  var scene = ctx.scene;
  var LAT = HW.lattice(ctx, { sets: props.sets, seed: 7 });
  var FRONT = LAT.front, BACK = LAT.back, TOP = LAT.top, LC = LAT.center;
  var dust = HW.dust(ctx, { count: 700, box: [70, 22, 70], center: [0, 8, 4], color: [0.6, 0.75, 1.0], alpha: 0.38 });

  /* the window: a pedestal, the pile on it, a glass frame around it */
  var PZ = 10.6;
  var ped = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.0, 4.6), new THREE.MeshStandardMaterial({ color: 0x0c141d, roughness: 0.35, metalness: 0.6 }));
  ped.position.set(0, 0.5, PZ); ped.castShadow = true; ped.receiveShadow = true; scene.add(ped);
  /* a lit edge around the pedestal top (an outline, not a slab) */
  var stripF = HW.frameBox(ctx, 6.42, 0.001, 4.62, { thick: 0.045, color: [0.3, 0.75, 1.6] });
  stripF.group.position.set(0, 1.0, PZ);
  var strip = { material: { color: { setRGB: function (r, g, b) { stripF.set(r / 0.2 * 0.6); } } } };
  var lbl = HW.label(ctx, "context window", { height: 0.3, weight: 800, upper: true, color: "#cfe6ff" });
  lbl.position.set(0, 4.42, PZ + 2.1); /* on the frame top bar — never in the caption band */ scene.add(lbl);
  var frame = HW.frameBox(ctx, 5.8, 3.2, 4.2, { thick: 0.045, color: [0.35, 0.85, 1.8], glass: 0.3 });
  frame.group.position.set(0, 1.0 + 1.6, PZ);

  var pages = [];
  var pr = HF3.rng(13);
  for (var i = 0; i < PAGES.length; i++) {
    var last = i === PAGES.length - 1;
    var c = HW.card(ctx, { w: 4.4, style: last ? "user" : "page", size: last ? 46 : 38, radius: 0.1, depth: 0.04, lines: PAGES[i].map(function (l) { return { t: l, weight: last ? 800 : 600 }; }), minH: 1.7, glow: last ? 0.55 : 0.22 });
    scene.add(c.group);
    var arrive = HF3.mix(tWindow - 0.15, tAgo - 0.1, i / (PAGES.length - 1));
    pages.push({ c: c, at: arrive, from: [(pr() - 0.5) * 6, 6.5 + pr() * 2, 19 + pr() * 2], rest: [(pr() - 0.5) * 0.25, 1.06 + i * 0.075, PZ + (pr() - 0.5) * 0.25], rz: (pr() - 0.5) * 0.08 });
  }

  /* the read: pile → front face; the layers light 1→12; out comes the next word */
  var rbeam = HW.beam(ctx, { color: [2.4, 1.6, 0.6] });
  var A0 = [0, 1.55, PZ], A1 = [0, LC[1], FRONT];
  var word = HW.card(ctx, { w: 3.6, style: "ai", label: "next word", size: 70, radius: 0.24, align: "center", lines: [{ t: "Istanbul", weight: 800 }], glow: 0.7 });
  scene.add(word.group);
  var WORD0 = [2.0, 3.5, BACK - 1.5], WORD1 = [4.2, 7.0, FRONT + 2.4];
  var wbeam = HW.beam(ctx, { color: [3.2, 0.5, 0.45] });
  var shield = HW.ring(ctx, { color: [1.4, 2.2, 3.4] });
  var SH = [3.4, 5.8, FRONT + 0.1];
  shield.mesh.position.set(SH[0], SH[1], SH[2]);
  var sp = HW.sparks(ctx, { bursts: [{ t: tNothing, p: SH, n: 120, speed: 5, up: 2.5, spread: [1, 0.6, 1], color: [3.0, 0.7, 0.6], life: 0.8 }, { t: tNothing, p: SH, n: 80, speed: 4, up: 2.0, spread: [1, 0.6, 1], color: [1.5, 2.4, 3.6], life: 0.9 }], size: 70 });

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(p);
      var pos = HW.orbit([0, 4.4, 4], 21, HF3.mix(1.08, 0.3, e), HF3.mix(0.16, 0.1, e));
      return { pos: HW.add3(pos, HW.shake(t, 0.04, 1, 2)), look: lp([0, 4.4, 2], [0, 3.0, 8.0], e), fov: 38 };
    } },
    { t: b1, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([5.6, 3.9, 18.2], [3.4, 3.3, 15.9], e), HW.shake(t, 0.03, 1.2, 3)), look: lp([0, 2.1, PZ], [0, 1.8, PZ], e), fov: 38 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([14.5, 5.6, 19.5], [13.2, 6.0, 17.2], e), look: lp([0.5, 3.4, 7.0], [0.5, 4.0, 6.0], e), fov: 40 };
    } },
    { t: tReads + 0.3, cam: function (p, t) {
      /* the side: twelve layers light in order, front (layer 1) to back */
      var e = E.inOut(p);
      return { pos: lp([22.5, 6.8, 10.5], [21.0, 7.2, 6.0], e), look: lp([2.0, 4.6, 1.0], [2.0, 4.6, 0.0], e), fov: 38, focus: 19.5 };
    } },
    { t: tNext - 0.15, cam: function (p, t) {
      var e = E.out2(p);
      return { pos: HW.add3(lp([13.0, 6.4, 20.5], [11.6, 7.0, 18.0], e), HW.kick(t, tNothing, 0.08, 0.4)), look: lp([2.4, 5.2, 4.5], [2.8, 5.6, 4.0], e), fov: 40 };
    } },
  ], D);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t;
    /* the window powers on */
    var on = E.out2(HF3.span(t, 0.4, 1.2)) * (1 + 0.8 * HW.pulse(t, tWindow, 0.1, 0.6));
    frame.set(on);
    strip.material.color.setRGB(0.2 * on, 0.5 * on, 1.1 * on);

    /* the pages */
    for (var i = 0; i < pages.length; i++) {
      var pg = pages[i], a = pg.at, p = HF3.span(t, a - 0.5, a);
      pg.c.group.visible = t >= a - 0.5;
      var e = E.out3(p);
      var pos = lp(pg.from, pg.rest, e);
      pos[1] += Math.sin(p * Math.PI) * 1.2;
      pg.c.group.position.set(pos[0], pos[1] + 0.05 * HW.pulse(t, a + 0.02, 0.02, 0.15), pos[2]);
      pg.c.group.rotation.set(HF3.mix(-0.35, -Math.PI / 2, E.inOut(p)), 0, pg.rz + (1 - e) * 0.4);
    }

    /* the read beam into the block */
    var hd = E.out2(HF3.span(t, tReads, tReads + 0.32));
    rbeam.set(A0, A1, 0.11, t >= tReads ? 1.0 : 0, hd, t);
    var lit = HF3.span(t, tReads + 0.25, tNext - 0.05);
    var inside = t >= tReads + 0.25 ? 1 : 0;
    LAT.u.uBeamA.value.set(0, LC[1], FRONT);
    LAT.u.uBeamB.value.set(0, LC[1], HF3.mix(FRONT, BACK, lit));
    LAT.u.uBeam.value.set(1.3, inside * (1 - 0.6 * HF3.span(t, tWord, tWord + 0.8)));
    LAT.u.uSlice.value.set(lit > 0 ? 11 - lit * 11.999 : -1, lit > 0 ? 1.0 - 0.7 * HF3.span(t, tNext, tWord + 0.6) : 0);

    /* the next word rises out of the far side and comes over the top */
    var wp = E.inOut(HF3.span(t, tNext - 0.2, tWord + 0.15));
    word.group.visible = t >= tNext - 0.2;
    var w = lp(WORD0, WORD1, wp);
    w[1] += Math.sin(wp * Math.PI) * 2.0;
    word.group.position.set(w[0], w[1], w[2]);
    word.group.rotation.set(-0.15, 0.25 * (1 - wp) + 0.35, 0);
    word.group.scale.setScalar(Math.max(E.outBack(HF3.span(t, tNext - 0.2, tNext + 0.15)), 0.0001));

    /* the write-back tries, and stops at the ice */
    var wh = E.in2(HF3.span(t, tWrites, tNothing));
    wbeam.set([WORD1[0], WORD1[1] - 0.6, WORD1[2]], SH, 0.15, t >= tWrites ? (1 - HF3.span(t, tNothing + 0.1, tNothing + 0.5)) : 0, wh, t);
    shield.set(t, tNothing, 0.7, 7);
    sp.update(t);
    dust.update(t);
    LAT.u.uFlash.value = 0.25 * HW.pulse(t, tNothing, 0.02, 0.5);

    var cs = cam(t);
    ctx.render(t, cam, { focus: cs.focus || null });
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
