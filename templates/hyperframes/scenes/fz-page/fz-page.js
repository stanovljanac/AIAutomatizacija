/* fz-page — 024 s5 (3D). "So where did your correction go? Into the pile…"
 *
 * PREMISE. The answer to "where did it go" is a PLACE, so the scene follows the object: the viewer's
 * own correction (the red card from the hook) drifts in the dark, flies into the context window and
 * lands on the pile as one more page. The read beam picks it up and the right answer comes out — which
 * is why it "sticks for the rest of that chat". Then the chat ends: the window goes dark, a pit opens
 * in front of the pedestal and the whole pile — correction included — tumbles into it. A fresh chat
 * starts with one page, reads the same frozen block, and says Istanbul again.
 *
 * SHOTS (S.beatAt + alignment word offsets):
 *   A  0    orbit the lone correction                         "So where did your correction go?"
 *   B  b1   it lands on the pile; the read begins             "Into the pile, as one more page to read."
 *   C  b2   beam through the block → "Ankara ✓"              "That's why it sticks for the rest of that chat."
 *   D  b3   window dies, pit opens, the pile falls            "Then the chat ends, the pile gets thrown away,"
 *   E  ~9.5 a new chat, one page, the same frozen answer      "…and the next chat starts from the same frozen numbers."
 */
var S = HF.scene({ id: "fz-page", width: 1920, height: 1080, frames: 383, beatLo: 0.0, beatHi: 0.1 });
var D = S.D, W = S.W, H = S.H, props = S.props;
/* word marks: each typed offset below was read off the draft (edge-tts) alignment; a re-voice (the Azure
   final) re-reads them into props.offsets — absent, every mark is exactly the typed value */
var OFF = props.offsets || {};
function off(k, v) { return typeof OFF[k] === "number" ? OFF[k] : v; }
var b1 = S.beatAt(1, 0.128), b2 = S.beatAt(2, 0.371), b3 = S.beatAt(3, 0.533);
var tPile = b1 + off("Pile", 0.24), tPage = b1 + off("Page", 1.76), tRead = b1 + off("Read", 2.33), tSticks = b2 + off("Sticks", 0.35), tChat = b2 + off("Chat", 1.25);
var tEnds = b3 + off("Ends", 0.64), tThrown = b3 + off("Thrown", 1.98), tAway = b3 + off("Away", 2.32), tStarts = b3 + off("Starts", 3.79), tFrozen = b3 + off("Frozen", 4.69), tNumbers = b3 + off("Numbers", 5.05);
var tE = tAway + 0.45;
var E = HW.E;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-kicker" id="kick">A <span class="g">page,</span> not a lesson.</div>' +
  '<div class="hw-plate hw-tag" id="ended">chat ended · window cleared</div>' +
  '<div class="hw-plate hw-count" id="cnt"><div class="lbl">model changed by that chat</div><div class="num ice">0 numbers</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#kick", "#ended", "#cnt"], { opacity: 0 });
HW.fromTo(tl, "#kick", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.6)" }, tPage - 0.05);
tl.to("#kick", { opacity: 0, y: -18, duration: 0.2, ease: "power2.in" }, b3 + 0.2);
HW.fromTo(tl, "#ended", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.25, ease: "power3.out" }, tEnds);
tl.to("#ended", { opacity: 0, x: -24, duration: 0.2, ease: "power2.in" }, tE - 0.1);
HW.fromTo(tl, "#cnt", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, tFrozen);
HF.register("fz-page", tl);

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
  var FRONT = LAT.front, BACK = LAT.back, LC = LAT.center;
  var dust = HW.dust(ctx, { count: 700, box: [70, 22, 70], center: [0, 8, 6], color: [0.6, 0.75, 1.0], alpha: 0.38 });

  /* the window (same build as s4 — the viewer must recognise it) */
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
  frame.group.position.set(0, 2.6, PZ);

  /* the pit that opens in front of the pedestal */
  var pit = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 5.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pit.rotation.x = -Math.PI / 2; pit.position.set(0, 0.012, PZ + 5.4); pit.renderOrder = 3; scene.add(pit);
  var pitRim = HW.frameBox(ctx, 7.5, 0.02, 5.5, { thick: 0.04, color: [1.6, 0.35, 0.3] });
  pitRim.group.position.set(0, 0.02, PZ + 5.4);

  function page(lines, style, glow) {
    var c = HW.card(ctx, { w: 4.4, style: style, size: style === "page" ? 38 : 46, radius: 0.1, depth: 0.04, lines: lines.map(function (l) { return { t: l, weight: style === "page" ? 600 : 800 }; }), minH: 1.7, glow: glow });
    scene.add(c.group); return c;
  }
  var pr = HF3.rng(13);
  var pile = [];
  for (var i = 0; i < PAGES.length; i++) {
    var last = i === PAGES.length - 1;
    pile.push({ c: page(PAGES[i], last ? "user" : "page", last ? 0.55 : 0.22), rest: [(pr() - 0.5) * 0.25, 1.06 + i * 0.075, PZ + (pr() - 0.5) * 0.25], rz: (pr() - 0.5) * 0.08, fall: [(pr() - 0.5) * 3, pr() * 1.5, 0.4 + pr() * 0.6], spin: (pr() - 0.5) * 3 });
  }
  var corr = page(["No, that's wrong.", "It's Ankara."], "wrong", 0.6);
  var CREST = [0.05, 1.06 + PAGES.length * 0.075, PZ];
  pile.push({ c: corr, rest: CREST, rz: 0.03, fall: [0.6, 1.2, 0.9], spin: 1.4, isCorr: true });
  var C0 = [-3.6, 4.4, 15.6];
  var fresh = page(["What's the capital of Turkey?"], "user", 0.55);

  var rbeam = HW.beam(ctx, { color: [2.4, 1.6, 0.6] });
  var good = HW.card(ctx, { w: 3.8, style: "good", label: "answer", size: 66, radius: 0.24, align: "center", lines: [{ t: "Ankara ✓", weight: 800 }], glow: 0.7 });
  var bad = HW.card(ctx, { w: 3.8, style: "wrong", label: "answer", size: 66, radius: 0.24, align: "center", lines: [{ t: "Istanbul", weight: 800 }], glow: 0.7 });
  scene.add(good.group); scene.add(bad.group);
  var OUT0 = [2.0, 3.5, BACK - 1.5], OUT1 = [4.2, 7.0, FRONT + 2.4];

  function lp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]; }
  var cam = HW.shots([
    { t: 0, cam: function (p, t) {
      var e = E.inOut(p);
      var pos = HW.orbit(C0, 5.2, HF3.mix(-0.25, 0.55, e), HF3.mix(0.12, 0.2, e));
      return { pos: HW.add3(pos, HW.shake(t, 0.03, 1, 6)), look: C0, fov: 36 };
    } },
    { t: b1, cam: function (p, t) {
      var follow = E.inOut(HF3.span(t, b1, tPile + 0.45));
      var push = E.inOut(HF3.span(t, tPile + 0.3, tPage + 0.2));
      var pos = lp(lp(HW.orbit(C0, 5.2, 0.55, 0.2), [4.8, 4.2, 18.0], follow), [2.8, 3.3, 14.8], push);
      return { pos: pos, look: lp(C0, [0, 1.6, PZ], follow), fov: 38 };
    } },
    { t: b2, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: lp([13.5, 5.8, 20.0], [12.0, 6.4, 17.6], e), look: lp([1.6, 3.8, 6.5], [2.4, 4.8, 5.5], e), fov: 40 };
    } },
    { t: b3, cam: function (p, t) {
      var e = E.inOut(p);
      var down = E.inOut(HF3.span(t, tEnds + 0.3, tAway));
      return { pos: HW.add3(lp([6.0, 5.0, 21.5], [3.4, 7.6, 21.0], down), HW.kick(t, tEnds, 0.05, 0.35)), look: lp([0, 1.6, PZ + 0.5], [0, -0.6, PZ + 4.6], down), fov: 40 };
    } },
    { t: tE, cam: function (p, t) {
      var e = E.inOut(p);
      return { pos: HW.add3(lp([6.0, 3.8, 20.0], [12.0, 7.2, 23.5], e), HW.kick(t, tFrozen, 0.05, 0.4)), look: lp([1.0, 2.4, PZ - 1.0], [1.4, 4.6, 4.5], e), fov: 40 };
    } },
  ], D);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    LAT.u.uTime.value = t;

    /* the window: alive, dies on "ends", a NEW one lights for the next chat */
    var alive = t < tEnds ? 1 : t < tE ? (Math.floor((t - tEnds) * 22) % 2 ? 0.15 : 0.6) * (1 - HF3.span(t, tEnds, tEnds + 0.5)) : E.out2(HF3.span(t, tE, tE + 0.4)) * (1 + 0.8 * HW.pulse(t, tE + 0.3, 0.1, 0.5));
    frame.set(alive);
    strip.material.color.setRGB(0.2 * alive, 0.5 * alive, 1.1 * alive);

    /* the pit opens, then closes again before the next chat */
    var open = E.outBack(HF3.span(t, tEnds + 0.15, tEnds + 0.55)) * (1 - E.in2(HF3.span(t, tE - 0.1, tE + 0.3)));
    pit.scale.set(Math.max(open, 0.0001), Math.max(open, 0.0001), 1);
    pitRim.group.scale.set(Math.max(open, 0.0001), 1, Math.max(open, 0.0001));
    pit.visible = pitRim.group.visible = open > 0.001;

    /* the correction: drifts, then flies onto the pile */
    var fly = E.inOut(HF3.span(t, b1 - 0.05, tPile + 0.3));
    var cpos = lp(C0, CREST, fly);
    cpos[1] += Math.sin(fly * Math.PI) * 1.6;

    /* the pile: rests, then is swept off into the pit */
    var sweep0 = tEnds + 0.45;
    for (var i = 0; i < pile.length; i++) {
      var P = pile[i], c = P.c;
      var st = sweep0 + (pile.length - 1 - i) * 0.07;
      var q = HF3.span(t, st, st + 1.3);
      var pos = P.isCorr && t < tPile + 0.3 ? cpos : P.rest.slice();
      if (q > 0) {
        var slide = E.in2(Math.min(q / 0.35, 1));
        var drop = Math.max(q - 0.25, 0);
        pos = [P.rest[0] + P.fall[0] * q, P.rest[1] + P.fall[1] * 0.4 * Math.sin(Math.min(q, 0.3) * 5) - 9.8 * drop * drop * 1.6, P.rest[2] + 3.0 * slide + 2.4 * q];
      }
      c.group.position.set(pos[0], pos[1], pos[2]);
      var flat = P.isCorr && t < tPile + 0.3 ? E.inOut(HF3.span(t, tPile - 0.1, tPile + 0.3)) : 1;
      c.group.rotation.set(HF3.mix(P.isCorr ? 0.1 : -0.35, -Math.PI / 2, flat) + q * P.spin, P.isCorr && t < b1 ? 0.4 * Math.sin(t * 1.2) : 0, P.rz + q * P.spin * 0.6);
      c.group.visible = pos[1] > -6 && t < tE + 0.05;
    }
    corr.group.scale.setScalar(1 + 0.05 * HW.pulse(t, tPage, 0.08, 0.4));

    /* the fresh chat: one page */
    var fp = E.out3(HF3.span(t, tStarts - 0.45, tStarts));
    fresh.group.visible = t >= tStarts - 0.45;
    var fpos = lp([-2, 6.5, 19], [0, 1.06, PZ], fp); fpos[1] += Math.sin(fp * Math.PI) * 1.0;
    fresh.group.position.set(fpos[0], fpos[1], fpos[2]);
    fresh.group.rotation.set(HF3.mix(-0.35, -Math.PI / 2, E.inOut(fp)), 0, 0.02);

    /* the reads: chat 1 (with the correction) and chat 2 (without) */
    var r1 = HF3.span(t, tRead, tRead + 0.3), r2 = HF3.span(t, tStarts + 0.15, tStarts + 0.45);
    var reading1 = t >= tRead && t < b3 + 0.3, reading2 = t >= tStarts + 0.15;
    var head = reading2 ? E.out2(r2) : E.out2(r1);
    rbeam.set([0, 1.55, PZ], [0, LC[1], FRONT], 0.11, reading1 || reading2 ? 1 : 0, head, t);
    var lit = reading2 ? HF3.span(t, tStarts + 0.4, tFrozen) : HF3.span(t, tRead + 0.25, tSticks - 0.1);
    var reading = reading1 || reading2;
    LAT.u.uBeamA.value.set(0, LC[1], FRONT);
    LAT.u.uBeamB.value.set(0, LC[1], HF3.mix(FRONT, BACK, lit));
    LAT.u.uBeam.value.set(1.3, reading && t > (reading2 ? tStarts + 0.4 : tRead + 0.25) ? 1 : 0);
    LAT.u.uSlice.value.set(reading && lit > 0 ? 11 - lit * 11.999 : -1, reading && lit > 0 ? 0.8 : 0);

    function out(card, t0, t1, on) {
      var wp = E.inOut(HF3.span(t, t0, t1));
      card.group.visible = on && t >= t0;
      var w = lp(OUT0, OUT1, wp); w[1] += Math.sin(wp * Math.PI) * 2.0;
      card.group.position.set(w[0], w[1], w[2]);
      card.group.rotation.set(-0.12, 0.45, 0);
      card.group.scale.setScalar(Math.max(E.outBack(HF3.span(t, t0, t0 + 0.3)), 0.0001));
    }
    out(good, tSticks - 0.45, tSticks + 0.1, t < tEnds + 0.4);
    out(bad, tFrozen - 0.5, tFrozen + 0.05, true);
    if (t > tEnds && t < tEnds + 0.4) good.group.scale.setScalar(Math.max(1 - E.in2(HF3.span(t, tEnds, tEnds + 0.4)), 0.0001));

    LAT.u.uFlash.value = 0.15 * HW.pulse(t, tNumbers, 0.05, 0.6);
    dust.update(t);
    ctx.render(t, cam, {});
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
