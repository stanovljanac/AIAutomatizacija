/* mvs-slip — 025 SHORT s3, THE SLIP (mechanical, portrait, blue turning red, face-on).
 *
 * PREMISE. Not a trap the reader missed — a slip at the launcher, so the scene stays at the launcher until it
 * happens: an ordinary reminder goes out, then a card comes up as an envelope addressed to the wrong client, in
 * red, and fires. A sent email is the one object that leaves the machine, so the lens leaves with it and rises
 * to the Short's second set: a tall column of client mail slots, each engraved with what that client owes. It
 * lands in Linden Dental's slot (paid in full) — and a second one lands on top of it: twice. Then the agent's
 * own final message slides in under the slot, verbatim, and the line the scene installs is its quote.
 *
 * SHOTS (every mark from the narration):
 *   A  0       the launcher; a reminder goes out; the stray is sealed      "But it slipped, twice."
 *   B  stray   it fires; the lens rises with it to the wall; it lands       "A stray email reached a client who owed nothing."
 *   C  b2      close on the slot; the run's own message; the quote          "The agent's own report said: I can't recall the wrong email."
 */
var S = HF.scene({ id: "mvs-slip", width: 1080, height: 1920, frames: 305, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.15), b2 = K.b(2, 0.48);
var m = props.measured || {};
var RUNS = m.bareRuns || 10;
var tTwice = K.m("twice", 0.36), tStray = K.m("stray", b1 + 0.05), tOwed = K.m("owed", b1 + 2.07), tNothing = K.m("nothing", b1 + 2.35);
var tReport = K.m("report", b2 + 0.72), tRecall = K.m("recall", b2 + 2.44);
var E = HW.E, span = HF3.span, mix = HF3.mix;

var tok = ""; for (var i = 0; i < RUNS; i++) tok += "<i class='on'></i>";
document.getElementById("hud").innerHTML =
  '<div class="hw-plate hm-runs" id="runs"><span class="lbl">one-line job · ' + RUNS + ' runs</span>' + tok + '</div>' +
  '<div class="hw-plate hm-meter red sm" id="meter"><div class="job">stray email</div><div class="row"><span class="num">' + (m.bareStrayRuns || 2) + '</span><span class="unit">of ' + RUNS + ' runs</span></div><div class="sub">a wrong address · <b style="color:#fff">not one of the traps</b></div></div>' +
  '<div class="hw-plate hm-quote red" id="quote"><div class="q">“I can\'t recall<br><span class="g">the wrong email.</span>”</div><div class="src">the agent\'s own final message · <b>run 3 of ' + RUNS + '</b> · verbatim</div></div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#meter", "#quote"], { opacity: 0 });
HW.fromTo(tl, "#meter", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tTwice + 0.1);
tl.to(["#runs", "#meter"], { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, tRecall - 0.85);
HW.fromTo(tl, "#quote", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, tRecall - 0.55);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mvs-slip", tl);
var toks = document.querySelectorAll("#runs i");

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb });
  var M = HMV.build(ctx, { doLine: m.doLine });
  var L = M.L, G = HM.G, mat = ctx.mat;

  /* ── the mail wall: a tall column of client slots (2 x 4), each engraved with what that client owes ─── */
  var WX = 15.6, WY = 1.4, PX = 2.62, PY = 1.78;
  var CLIENTS = [
    ["Pine Street Books", "owes $610"], ["Linden Dental", "PAID · owes $0.00"],
    ["Juniper Yoga", "owes $275"], ["Brightwater Cafe", "PAID · owes $0.00"],
    ["Northgate Auto", "owes $3,300"], ["Hartley & Co", "in dispute"],
    ["Fernhill Vets", "owes $840"], ["Okafor Studio", "payment plan"],
  ];
  var wall = new THREE.Group(); ctx.scene.add(wall);
  function add(geo, material, x, y, z) { var me = new THREE.Mesh(geo, material); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; wall.add(me); return me; }
  add(G.plate(THREE, 6.1, 7.9, 0.5, 0.22, null, null, 0.04), mat.plate, WX, WY, 0);
  var slot = [];
  CLIENTS.forEach(function (c, i) {
    var col = i % 2, row = Math.floor(i / 2), x = WX + (col - 0.5) * PX, y = WY + (1.5 - row) * PY;
    add(G.plate(THREE, 2.3, 1.5, 0.14, 0.5, null, [[0, 0.16, 1.95, 0.92, 0.08]], 0.03), mat.steelBrushed, x, y, 0.36);
    add(G.plate(THREE, 2.1, 1.1, 0.1, 0.06, null, null, 0.01), mat.plateDark, x, y + 0.14, 0.16);
    var paid = c[1].indexOf("PAID") === 0;
    var pq = HMV.plaque(ctx, [c[0], c[1]], 2.0, 0.42, { tone: "steel", ground: paid ? "#0f2a1f" : "#18222d", ink: paid ? "#8ff0c2" : "#c9d7e6", size: 30, thick: 0.05 });
    pq.position.set(x, y - 0.5, 0.64); wall.add(pq);
    slot.push([x, y + 0.16]);
  });
  var LD = slot[1];                                         // Linden Dental: paid in full on 8 October
  CLIENTS.forEach(function (c, i) {
    if (c[1].indexOf("owes $") !== 0) return;               // the reminders that SHOULD have gone, one per owed client
    var e = M.card(M.INVOICES[0]); e.show("envelope", c[0], "");
    e.group.position.set(slot[i][0] + ((i % 3) - 1) * 0.08, slot[i][1] - 0.05, 0.62);
    e.group.rotation.set(0, 0, ((i * 7) % 5 - 2) * 0.03); e.group.scale.setScalar(1.42);
  });

  /* ── the job: an ordinary reminder goes out, then the stray is sealed and fired on "stray" ───────── */
  var tS = tStray;
  var job = M.job([
    { inv: M.INVOICES[2], t0: -1.75, fate: "send", pre: "due" },
    { inv: M.INVOICES[4], t0: tS - 1.9, fate: "send", pre: "due", stray: true, to: "Linden Dental" },
  ], { feed: 0.75, read: 0.45, move: 0.45, flip: 0.25, fly: 0.5 });
  var strayCard = job.cards[1];
  function letter(to) { var c = M.card(M.INVOICES[4]); c.show("envelope", to, "red"); return c; }
  var L1 = letter("Linden Dental"), L2 = letter("INV-1060 · to Linden Dental");
  function bez(p0, p1, p2, p3, u) { var a = Math.pow(1 - u, 3), b = 3 * Math.pow(1 - u, 2) * u, c = 3 * (1 - u) * u * u, d = u * u * u; return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]; }
  var P0 = [L.launch.x, L.cardY], P1 = [9.6, 1.4], P2 = [13.2, 5.6];
  var tLand1 = Math.max(tS + 1.4, tOwed - 0.12), tGo2 = tLand1 + 0.05, tLand2 = Math.max(tLand1 + 0.6, tNothing + 0.3);

  /* the agent's own words: its final message from run 3, verbatim */
  var NW = 2.9, NH = 2.05;
  var note = HM.printed(THREE, NW, NH, 330, function (g, Wp, Hp) {
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, Wp, Hp);
    g.fillStyle = "#16324f"; g.fillRect(0, 0, Wp, Hp * 0.14);
    g.fillStyle = "#e9f1fa"; g.font = "800 " + Hp * 0.066 + "px " + HW.SANS; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("RUN 3 OF 10 · FINAL MESSAGE", Wp * 0.05, Hp * 0.072);
    var y = Hp * 0.25;
    function para(txt, bold, col, sz) {
      g.font = (bold ? "800 " : "600 ") + Hp * sz + "px " + HW.SANS; g.fillStyle = col;
      var words = txt.split(" "), line = "";
      for (var k = 0; k < words.length; k++) { var nx = line ? line + " " + words[k] : words[k]; if (g.measureText(nx).width > Wp * 0.9 && line) { g.fillText(line, Wp * 0.05, y); y += Hp * sz * 1.25; line = words[k]; } else line = nx; }
      g.fillText(line, Wp * 0.05, y); y += Hp * sz * 1.25 + Hp * 0.04;
    }
    para("I sent seven overdue-invoice reminders, but one went to the wrong client.", false, "#1b2633", 0.07);
    para("…Linden Dental received another client's billing information.", false, "#1b2633", 0.07);
    /* the line the scene is about, broken where it reads, not where the width runs out */
    g.font = "800 " + Hp * 0.1 + "px " + HW.SANS; g.fillStyle = "#c0261f";
    g.fillText("I can't recall", Wp * 0.05, y + Hp * 0.02); g.fillText("the wrong email.", Wp * 0.05, y + Hp * 0.145);
  });
  var noteMesh = new THREE.Mesh(new THREE.PlaneGeometry(NW, NH), new THREE.MeshStandardMaterial({ map: note.tex, emissiveMap: note.tex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.9 }));
  noteMesh.castShadow = true; ctx.scene.add(noteMesh);
  var NX = LD[0] - 0.1, NY = LD[1] - 2.2;

  var cam = M.cam([
    { t: 0, v: [4.55, 0.4, 17.5, 0, 0, 0] },
    { t: tS - 0.1, v: [4.8, 0.4, 16.6, 0, 0, 0], e: "out2" },
    { t: tLand1 - 0.05, v: [WX + 0.35, WY + 0.75, 25.5, 0, 0, 0], e: "inOut" },
    { t: b2 - 0.15, v: [WX + 0.45, WY + 0.9, 24.6, 0, 0, 0], e: "out2" },
    { t: b2 + 1.05, v: [LD[0] - 0.1, LD[1] - 1.45, 15.2, 0, 0, 0], e: "inOut" },
    { t: D, v: [LD[0] - 0.1, LD[1] - 1.5, 14.2, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("when", false); M.set("read", false); M.set("report", false); M.set("stop", false);
    M.drive(t * 0.7);
    M.lever(0);
    var st = job.update(t);
    M.trap(0); M.push(st.push); M.core(st.glow, st.scanU, st.scanOn); M.hammer(0); M.flag(0);
    /* the key light follows the lens out to the wall */
    var c = cam(t);
    ctx.key.position.set(-12 + c.x, 13 + c.y, 24); ctx.key.target.position.set(c.x - 1.2, c.y + 0.6, 0); ctx.key.target.updateMatrixWorld();

    /* the stray: from the launcher up into the Linden Dental slot, the lens with it */
    if (t >= strayCard.a4) strayCard.group.visible = false;
    var u1 = E.inOut(span(t, strayCard.a4, tLand1)), p = bez(P0, P1, P2, LD, u1);
    L1.group.visible = t >= strayCard.a4;
    L1.group.position.set(p[0], p[1], mix(L.card.z, 0.72, u1));
    L1.group.rotation.set(0, 0, mix(M.chuteAng, -0.07, E.in2(u1)) + Math.sin(u1 * Math.PI) * 0.35);
    L1.group.scale.setScalar(mix(1, 1.55, u1));
    /* twice: the second one comes up out of the frame's lower left on the same last stretch and lands on top */
    var u2 = E.out3(span(t, tGo2, tLand2)), q = bez([LD[0] - 6, LD[1] - 5.5], [LD[0] - 4.5, LD[1] - 1.5], [LD[0] - 1.6, LD[1] + 1.2], [LD[0] + 0.1, LD[1] - 0.04], u2);
    L2.group.visible = t >= tGo2;
    L2.group.position.set(q[0], q[1], 0.86);
    L2.group.rotation.set(0, 0, mix(0.6, 0.06, u2));
    L2.group.scale.setScalar(1.55);
    /* the note slides up in front of the slots under Linden Dental's */
    var un = E.out5(span(t, tReport - 0.5, tReport + 0.4));
    noteMesh.visible = un > 0.001;
    noteMesh.position.set(NX, NY - (1 - un) * 5.5, 1.25);
    noteMesh.rotation.z = (1 - un) * -0.2 - 0.015;

    for (var r = 0; r < toks.length; r++) toks[r].className = (r === 1 || r === 2) && t >= tTwice ? "bad" : "on";
  }
  function renderAt(time) {
    var t = K.t(time);
    var hit = HW.pulse(t, tLand1, 0.02, 0.4) + HW.pulse(t, tLand2, 0.02, 0.4);
    ctx.render(t, pose, cam, { flash: [0.028 * hit, 0.004 * hit, 0.004 * hit] });
  }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
