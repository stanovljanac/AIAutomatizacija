/* mv-card — 025 s10, THE CARD (mechanical, blue + gold, face-on, and for four seconds: still).
 *
 * PREMISE. The takeaway is text, so it gets the one frame in the video built to be screenshotted. The
 * line leaves the lever's own plate and comes forward as a card that fills the frame, engraved line by
 * line: the exact sentence that was tested, the five-line job around it, and — labelled as untested — the
 * general rule. Then it HOLDS. "It is only text" is the card going back into the machine while three
 * different cores seat behind it. "Some tools ship it as a switch" is OpenAI's four rule behaviours as four
 * plates on the same mount, the third one turning gold on its own name. And the limit of the method is
 * acted out last: a draft is read by a person, approved, and only then does the lever open and let it go.
 *
 * SHOTS:  A 0    the card comes forward and is engraved; holds     "Here is the exact line I tested… Pause and copy them."
 *         B b2   back into the plate; three cores                   "It is only text, so it travels to any tool."
 *         C b3   the four behaviours; the third turns gold          "…in Dots, it is a rule called: ask before taking action."
 *         D b4   a draft is read, approved, sent by a person        "A draft still needs you to read it. That is the whole point."
 */
var S = HF.scene({ id: "mv-card", width: 1920, height: 1080, frames: 736, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.19), b2 = K.b(2, 0.35), b3 = K.b(3, 0.51), b4 = K.b(4, 0.84);
var m = props.measured || {};
var tExact = K.m("exact", 0.5), tFive = K.m("five", 2.6), tPause = K.m("pause", b1), tText = K.m("text1", b2 + 0.6), tSwitch = K.m("switch", b3 + 2.0), tDots = K.m("dots", b3 + 3.2), tAsk = K.m("ask", b3 + 6.0), tRead = K.m("read", b4 + 1.45), tPoint = K.m("point", b4 + 2.85);
var E = HW.E, span = HF3.span, mix = HF3.mix;
var CARD = props.card || [["WHEN", "Every Monday, 08:00."], ["READ", "invoices, payments, clients. Nothing else."], ["DO", "Draft a reminder for every unpaid, past-due invoice."], ["STOP", "Never send. Drafts only. Anything unusual goes on a needs-me list."], ["REPORT", "What you drafted, flagged and skipped, and any mistake."]];
var STOPLINE = m.stopLine || "Never send an email: save drafts only.";

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="c1"><b>pause and copy</b> · the full text is in the description</div>' +
  '<div class="hw-plate hw-chip" id="c2">“' + (props.rule || "Ask before taking action") + '” · <b>OpenAI docs</b>, Control your dot</div>' +
  '<div class="hw-plate hm-tag" id="you">read by a person, then sent</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#c1", "#c2", "#you"], { opacity: 0 });
HW.fromTo(tl, "#c1", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tPause - 0.1);
tl.to("#c1", { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, b2 + 0.2);
HW.fromTo(tl, "#c2", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, tDots - 0.2);
tl.to("#c2", { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, b4 - 0.05);
HW.fromTo(tl, "#you", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" }, tPoint - 0.1);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-card", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb, keyAt: [0.6, 0.3], keyAngle: 0.5 });
  var M = HMV.build(ctx, { doLine: m.doLine, stopLine: STOPLINE });
  var L = M.L, by = M.by, G = HM.G, mat = ctx.mat;

  /* ── the card: dark enamel, gold-filled engraving. n = how many items are cut so far. ──────────── */
  var CW = 11.8, CH = 6.5, PPU = 160, SANS = HW.SANS, MONO = HW.MONO;
  function drawCard(g, Wp, Hp, n) {
    g.fillStyle = "#0b131c"; g.fillRect(0, 0, Wp, Hp);
    g.strokeStyle = "#f0a92e"; g.lineWidth = 8; g.strokeRect(14, 14, Wp - 28, Hp - 28);
    g.strokeStyle = "rgba(240,169,46,0.35)"; g.lineWidth = 2; g.strokeRect(30, 30, Wp - 60, Hp - 60);
    var x0 = 78, y = 106;
    g.textBaseline = "middle"; g.textAlign = "left";
    function caps(txt, yy, col) { g.font = "800 30px " + SANS; g.fillStyle = col || "#f0a92e"; try { g.letterSpacing = "6px"; } catch (e) {} g.fillText(txt, x0, yy); try { g.letterSpacing = "0px"; } catch (e2) {} }
    function chip(txt, yy) { g.font = "800 26px " + SANS; try { g.letterSpacing = "3px"; } catch (e) {} var tw = g.measureText(txt).width + 44; g.fillStyle = "#f0a92e"; g.beginPath(); g.roundRect(Wp - x0 - tw, yy - 24, tw, 48, 24); g.fill(); g.fillStyle = "#1a1003"; g.textAlign = "center"; g.fillText(txt, Wp - x0 - tw / 2, yy + 1); g.textAlign = "left"; try { g.letterSpacing = "0px"; } catch (e2) {} }
    if (n >= 1) { caps("THE STOP LINE", y); chip("TESTED · 20 RUNS · 0 SENT", y); }
    if (n >= 2) { g.font = "800 92px " + SANS; g.fillStyle = "#ffffff"; g.fillText(STOPLINE, x0, y + 108); }
    if (n >= 3) { g.fillStyle = "rgba(240,169,46,0.4)"; g.fillRect(x0, y + 196, Wp - 2 * x0, 3); caps("THE FIVE-LINE JOB AROUND IT", y + 252); chip("TESTED · 10 RUNS", y + 252); }
    for (var i = 0; i < CARD.length; i++) {
      if (n < 4 + i) break;
      var yy = y + 344 + i * 86;
      g.font = "800 40px " + MONO; g.fillStyle = CARD[i][0] === "STOP" ? "#ffd37a" : "#f0a92e"; g.fillText(CARD[i][0], x0, yy);
      g.font = (CARD[i][0] === "STOP" ? "800 " : "600 ") + "42px " + SANS; g.fillStyle = CARD[i][0] === "STOP" ? "#ffffff" : "#d6e2ee"; g.fillText(CARD[i][1], x0 + 250, yy);
    }
    if (n >= 9) { g.font = "600 30px " + SANS; g.fillStyle = "#8fa8c0"; g.fillText("general rule, untested: draft it, move it, prepare it, keep it private, or ask.", x0, Hp - 86); }
  }
  var pr = HM.printed(THREE, CW, CH, PPU, function (g, Wp, Hp) { drawCard(g, Wp, Hp, 0); });
  var cardGrp = new THREE.Group();
  var slab = new THREE.Mesh(G.extrude(THREE, G.roundedRect(THREE, CW + 0.16, CH + 0.16, 0.16), 0.12, 0.03, { curve: 8 }), mat.gold);
  /* unlit on purpose: this is the frame people screenshot, so its ink is exactly the ink that was drawn */
  var face = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ map: pr.tex }));
  face.position.z = 0.065; slab.castShadow = true;
  cardGrp.add(slab); cardGrp.add(face); ctx.scene.add(cardGrp);
  var lastN = -1;
  var STEPS = [tExact + 0.35, tExact + 0.7, tFive - 0.5, tFive - 0.1, tFive + 0.14, tFive + 0.38, tFive + 0.62, tFive + 0.86, tFive + 1.25];
  var HOMEP = [by.stopLine.home.p[0], by.stopLine.home.p[1], 0.5], FRONT = [0, 0.15, 4.2];

  /* ── three cores for "any tool" ─────────────────────────────────────────────────────────────── */
  var SW = [{ t: tText + 0.75, col: 0x8fe0ff, name: "DOTS" }, { t: tText + 1.6, col: 0xff9a4a, name: "ROUTINES" }, { t: tText + 2.45, col: 0x2f8cff, name: "A SCRIPT ON A TIMER" }];
  var BLUE = new THREE.Color(0x2f8cff);
  SW.forEach(function (s) { s.c = new THREE.Color(s.col); s.plate = HMV.plaque(ctx, s.name, 3.0, 0.42, { tone: "steel", ground: "#18222d", ink: "#dbe8f5", size: 46, track: 4, thick: 0.06 }); ctx.scene.add(s.plate); });
  var PLATE = [L.reader.x + 0.45, L.reader.y + 1.52, 1.0];

  /* ── the four behaviours (OpenAI's own labels), on the lever's mount ───────────────────────── */
  var RULES = ["Take action without asking", "Take action when you say so", "Ask before taking action", "Hand off to you"];
  var rules = RULES.map(function (r, i) {
    var o = { steel: HMV.plaque(ctx, r, 3.0, 0.4, { tone: "steel", ground: "#18222d", ink: "#c9d7e6", size: 44, thick: 0.06 }), y: 3.22 - i * 0.48 };
    if (i === 2) o.gold = HMV.plaque(ctx, r, 3.0, 0.4, { size: 44, thick: 0.07 });
    ctx.scene.add(o.steel); if (o.gold) ctx.scene.add(o.gold);
    return o;
  });

  /* ── the drafts in the tray; the top one gets read ─────────────────────────────────────────── */
  var six = M.INVOICES.filter(function (v) { return v.kind === "go" && v.id !== "INV-1061"; });
  var tray = M.job(six.map(function (inv, i) { return { inv: inv, t0: -30 + i, fate: "draft", pre: "due" }; }), {});
  var top = tray.cards[5];

  var cam = M.cam([
    { t: 0, v: [0, M.LOOK_Y, M.DIST, 0, 0, 0] },
    { t: b2 + 0.1, v: [0, M.LOOK_Y + 0.1, M.DIST - 1.3, 0, 0, 0], e: "sine" },
    { t: b3 - 0.2, v: [0, M.LOOK_Y, M.DIST - 0.6, 0, 0, 0], e: "sine" },
    { t: b3 + 0.9, v: [5.6, 2.3, 9.8, 0, 0, 0], e: "inOut" },
    { t: b4 - 0.2, v: [5.5, 2.25, 8.9, 0, 0, 0], e: "sine" },
    { t: b4 + 0.9, v: [5.2, -1.3, 13.0, 0, 0, 0], e: "inOut" },
    { t: D, v: [5.6, -1.3, 12.0, 0, 0, 0], e: "sine" },
  ]);

  function pose(t) {
    M.home();
    M.set("crank", false);
    M.drive(t * 0.55); M.tick(t * 5); M.trap(0); M.hammer(0); M.flag(0);
    /* D: the lever is opened by a person for one approved draft, then thrown again */
    var tOpen = tRead + 0.75, tShut = tPoint + 0.95;
    var lev = 1 - E.inOut(span(t, tOpen, tOpen + 0.3)) + E.outBack(span(t, tShut, tShut + 0.28));
    M.lever(Math.min(lev, 1.06));

    /* A — the card: out of the lever's plate, to the front, engraved; B — back in */
    var out = E.out5(span(t, 0.12, 1.05)), back = E.inOut(span(t, b2 + 0.1, b2 + 0.95)), k = out * (1 - back);
    cardGrp.visible = k > 0.002;
    cardGrp.position.set(mix(HOMEP[0], FRONT[0], k), mix(HOMEP[1], FRONT[1], k), mix(HOMEP[2], FRONT[2], k));
    cardGrp.scale.setScalar(mix(0.04, 1, k));
    var n = 0; for (var i = 0; i < STEPS.length; i++) if (t >= STEPS[i]) n = i + 1;
    if (n !== lastN) { lastN = n; pr.redraw(function (g, Wp, Hp) { drawCard(g, Wp, Hp, n); }); }

    /* B — three cores, three name plates */
    var core = by.core.obj, col = BLUE, shown = -1;
    for (i = 0; i < SW.length; i++) {
      var s = SW[i], o1 = E.in2(span(t, s.t, s.t + 0.26)), in1 = E.out5(span(t, s.t + 0.28, s.t + 0.66));
      if (t >= s.t && t < s.t + 0.28) { core.position.z += o1 * 5; core.position.y += o1 * 2.2; core.scale.setScalar(Math.max(1 - o1 * 0.7, 0.01)); }
      else if (t >= s.t + 0.28 && t < s.t + 0.66) { core.position.z += (1 - in1) * 5; core.position.y -= (1 - in1) * 2.6; }
      if (t >= s.t + 0.28) { col = s.c; shown = i; }
    }
    by.core.lens.emissive.copy(col);
    for (i = 0; i < SW.length; i++) {
      var sw = SW[i], tin = E.out5(span(t, sw.t + 0.36, sw.t + 0.76)), nx = SW[i + 1], tout = nx ? E.in2(span(t, nx.t - 0.05, nx.t + 0.25)) : E.in2(span(t, b3 - 0.15, b3 + 0.25));
      sw.plate.visible = tin > 0.001 && tout < 0.999;
      sw.plate.position.set(PLATE[0], PLATE[1] + (1 - tin) * 1.4 + tout * 1.4, PLATE[2] + (1 - tin) * 2.5 + tout * 2.5);
      sw.plate.scale.setScalar(Math.max(tin * (1 - tout), 0.001));
    }

    /* C — the four behaviours take the line plate's place; the third turns gold on its name */
    var swap = E.inOut(span(t, b3 + 0.2, b3 + 0.6)), unswap = E.inOut(span(t, b4 - 0.25, b4 + 0.2)), sv = swap * (1 - unswap);
    by.stopLine.obj.scale.setScalar(Math.max(1 - sv, 0.001)); by.stopTag.obj.scale.setScalar(Math.max(1 - sv, 0.001));
    var gold = E.outBack(span(t, tAsk - 0.3, tAsk + 0.05));
    for (i = 0; i < rules.length; i++) {
      var r = rules[i], a = E.outBack(span(t, b3 + 0.55 + i * 0.1, b3 + 0.95 + i * 0.1)) * (1 - unswap), isG = r.gold && gold > 0.5;
      r.steel.visible = a > 0.002 && !isG; r.steel.position.set(6.35, r.y, 0.34); r.steel.scale.setScalar(Math.max(a, 0.001));
      if (r.gold) { r.gold.visible = a > 0.002 && isG; r.gold.position.set(6.35, r.y, 0.4 + 0.25 * HW.pulse(t, tAsk, 0.1, 0.4)); r.gold.scale.setScalar(Math.max(a * (1 + 0.1 * HW.pulse(t, tAsk, 0.08, 0.35)), 0.001)); }
    }

    /* D — the top draft is read, approved, and only then sent */
    tray.update(t);
    var g = top.group, up = E.out5(span(t, tRead - 0.75, tRead - 0.1)), f = E.inOut(span(t, tRead + 0.15, tRead + 0.65));
    var toBed = E.inOut(span(t, tPoint - 0.55, tPoint - 0.05)), fly = span(t, tPoint + 0.05, tPoint + 0.6);
    var p0 = [g.position.x, g.position.y, g.position.z], rz0 = g.rotation.z;
    var hx = 3.9, hy = -0.7, hz = 2.6;
    var x = mix(p0[0], hx, up), y = mix(p0[1], hy, up), z = mix(p0[2], hz, up), sc = mix(1, 1.9, up);
    x = mix(x, L.launch.x, toBed); y = mix(y, L.cardY, toBed); z = mix(z, L.card.z, toBed); sc = mix(sc, 1, toBed);
    var ry = f * Math.PI * 2;
    if (toBed > 0.6) top.show("envelope", top.inv.client, ""); else if (f > 0.5) top.show("action", "APPROVED", "read by a person", "gold"); else top.show("read");
    var s2 = 9.5 * E.in2(fly) + 0.5 * fly, ang = M.chuteAng;
    x += s2 * Math.cos(ang); y += 0.17 * Math.min(s2 / 0.7, 1) + Math.max(s2 - 0.7, 0) * Math.sin(ang);
    g.position.set(x, y, z); g.rotation.set(0, ry, mix(rz0, 0, up) + ang * Math.min(s2 / 0.7, 1)); g.scale.setScalar(sc);
    g.visible = fly < 1;
    M.push(HW.pulse(t, tPoint + 0.07, 0.04, 0.3));
    M.core(1, 0, 0);
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
