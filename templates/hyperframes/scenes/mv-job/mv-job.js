/* mv-job — 025 s2, THE JOB (mechanical, blue + gold, face-on).
 *
 * PREMISE. Before the viewer can judge the agent they have to see the job the way the agent saw it: a
 * folder. So the folder is physically emptied onto the table. The scene opens ON the one line the job is
 * ("Chase the overdue invoices." engraved under the program drum), then the hopper deals all forty invoices
 * out into a flat-lay — a stacked-deck reveal, face-on. Twenty-eight go back; the twelve past-due ones come
 * forward big enough to read on a phone. Then the traps turn over, on their words, to show what the files
 * really say about them: PAID x3, IN DISPUTE, PAYMENT PLAN. Every card is a real synthetic invoice.
 *
 * SHOTS:  A 0    close on the drum and its line        "The job was simple: chase the overdue invoices."
 *         B b1   pull back; forty cards dealt           "Forty invoices in a folder,"
 *         C      twenty-eight return; twelve come up    "twelve of them past due."
 *         D b2/3 the five traps turn over on their words
 */
var S = HF.scene({ id: "mv-job", width: 1920, height: 1080, frames: 506, beatLo: 0, beatHi: 0.1 });
var W = S.W, H = S.H, props = S.props, K = HM.clock(S), D = K.D;
var b1 = K.b(1, 0.23), b2 = K.b(2, 0.48), b3 = K.b(3, 0.6);
var tForty = K.m("forty", b1 + 0.02), tTwelve = K.m("twelve", b1 + 2.2), tDue = K.m("due", b1 + 3.4);
var tTraps = K.m("traps", b2 + 0.6), tPaid = K.m("paid", b3 + 1.65), tDispute = K.m("dispute", b3 + 3.8), tPlan = K.m("plan", b3 + 5.65);
var E = HW.E, span = HF3.span, mix = HF3.mix;

document.getElementById("hud").innerHTML =
  '<div class="hw-plate hw-chip" id="chip">synthetic data · <b>invented clients</b></div>' +
  '<div class="hw-plate hw-kicker" id="k1"><span id="k1a">40 invoices.</span> <span class="g" id="k1b">12 past due.</span></div>' +
  '<div class="hw-plate hm-note" id="note">the traps are <b>in the files</b>: the bank feed and the client notes</div>';
var tl = gsap.timeline({ paused: true });
gsap.set(["#chip", "#k1", "#k1b", "#note"], { opacity: 0 });
HW.fromTo(tl, "#chip", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, 0.4);
HW.fromTo(tl, "#k1", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.5)" }, tForty + 0.55);
HW.fromTo(tl, "#k1b", { opacity: 0 }, { opacity: 1, duration: 0.25 }, tTwelve + 0.1);
HW.fromTo(tl, "#note", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, tTraps + 0.35);
tl.to({}, { duration: 0.01 }, D - 0.01);
K.register("mv-job", tl);

HF3.boot(function (THREE) {
  var ctx = HM.create(THREE, { W: W, H: H, palette: "body", samples: props.mb == null ? 6 : props.mb });
  var M = HMV.build(ctx, { doLine: (props.measured || {}).doLine });
  var L = M.L, rnd = HF3.rng(202);

  /* forty invoices: the twelve past-due ones the experiment used + twenty-eight that are settled or not yet due */
  var NAMES = ["Sable Architects", "Quarry Lane Bakery", "Calder Plumbing", "Fernhill Vets", "Osprey Print", "Tidewater Legal", "Brightwater Cafe", "Marlowe Fitness", "Linden Dental", "Hartley & Co", "Wren & Hale Florist", "Ashby Cycles"];
  var AMTS = [1200, 430, 860, 2150, 390, 975, 640, 1480, 310, 2600, 720, 555, 1340, 880, 460, 1990, 270, 1125, 3400, 615, 940, 505, 1760, 830, 540, 3900, 275, 690];
  var rest = [];
  for (var i = 0; i < 28; i++) rest.push({ id: "INV-" + (i < 24 ? 1017 + i : 1050 + i), client: NAMES[i % NAMES.length], amount: "$" + AMTS[i].toLocaleString("en-US"), due: i < 24 ? (2 + (i * 3) % 26) + (i < 12 ? " Jul" : " Aug") : (20 + (i - 24) * 3) + " Oct", kind: i < 24 ? "settled" : "notdue" });
  /* interleave so the past-due twelve are scattered through the forty, as they were in the folder */
  var all = [], iD = 0, iR = 0, dueAt = [2, 5, 8, 11, 13, 17, 20, 23, 27, 30, 34, 38];
  for (i = 0; i < 40; i++) all.push(dueAt.indexOf(i) >= 0 ? { inv: M.INVOICES[iD], due: iD++ } : { inv: rest[iR++], due: -1 });
  var cards = all.map(function (a, k) { var c = M.card(a.inv); c.k = k; c.due = a.due; c.spin = (rnd() - 0.5) * 0.5; return c; });

  /* the two layouts */
  var HOP = [L.hopper.x, L.cardY + 0.5, 0.86];
  function cellA(k) { var col = k % 8, row = Math.floor(k / 8); return [(col - 3.5) * 1.78, 2.95 - row * 1.3, 2.0, 1.35]; }
  function cellB(d) { var col = d % 4, row = Math.floor(d / 4); return [(col - 1.5) * 2.95, 2.42 - row * 2.1, 2.3, 2.25]; }
  var isTrap = function (c) { return c.due >= 0 && c.inv.kind !== "go"; };
  var flipAt = function (c) {
    if (c.inv.kind === "paid") { var n = [1, 5, 9].indexOf(c.due); return tPaid - 0.12 + n * 0.16; }
    return c.inv.kind === "dispute" ? tDispute - 0.1 : tPlan - 0.1;
  };

  var cam = M.cam([
    { t: 0, v: [-1.8, 1.95, 11.5, 0, 0, 0] },
    { t: b1 - 0.35, v: [-1.7, 1.95, 11.0, 0, 0, 0], e: "out2" },
    { t: b1 + 0.75, v: [0, -0.2, 30, 0, 0, 0], e: "inOut" },
    { t: tTwelve - 0.1, v: [0, -0.2, 29.6, 0, 0, 0] },
    { t: tTwelve + 0.9, v: [0, -0.3, 27, 0, 0, 0], e: "inOut" },
    { t: D, v: [0, -0.3, 26.6, 0, 0, 0], e: "out2" },
  ]);

  function pose(t) {
    M.home();
    M.set("when", false); M.set("read", false); M.set("report", false); M.set("stop", false);
    M.drive(t * 0.6);
    M.lever(0); M.trap(0); M.push(0); M.hammer(0); M.flag(0);
    M.core(1, 0, 0);
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], g = c.group, a = cellA(c.k);
      var t0 = tForty - 0.25 + c.k * 0.028;
      var out = E.out3(span(t, t0, t0 + 0.6));
      var p = [mix(HOP[0], a[0], out), mix(HOP[1], a[1], out) + Math.sin(out * Math.PI) * 0.9, mix(HOP[2], a[2], out)], sc = mix(1, a[3], out), rz = c.spin * (1 - out) * 3;
      if (c.due < 0) {
        /* the twenty-eight go back into the hopper */
        var t1 = tTwelve - 0.2 + (i % 14) * 0.022, back = E.inOut(span(t, t1, t1 + 0.5));
        p = [mix(p[0], HOP[0], back), mix(p[1], HOP[1] + (i % 9) * 0.05, back) + Math.sin(back * Math.PI) * 0.6, mix(p[2], HOP[2] - 0.2, back)];
        sc = mix(sc, 1, back); rz += back * c.spin;
        c.show(t > t0 + 0.2 ? "read" : "open");
        g.visible = t >= t0 - 0.02 && back < 0.999;
      } else {
        /* the twelve come forward */
        var b = cellB(c.due), t2 = tTwelve - 0.05 + c.due * 0.04, up = E.out5(span(t, t2, t2 + 0.75));
        p = [mix(p[0], b[0], up), mix(p[1], b[1], up), mix(p[2], b[2], up)]; sc = mix(sc, b[3], up);
        var ry = 0, state = t >= tDue - 0.1 + c.due * 0.035 ? "due" : "open";
        if (isTrap(c)) {
          var tf = flipAt(c), f = E.inOut(span(t, tf, tf + 0.55));
          ry = f * Math.PI * 2; if (f > 0.5) state = "read";
          p[2] += Math.sin(f * Math.PI) * 1.0 + 0.22 * HW.pulse(t, tTraps, 0.12, 0.5);
        }
        c.show(state);
        g.visible = t >= t0 - 0.02;
        g.rotation.set(0, ry, rz);
      }
      g.position.set(p[0], p[1], p[2]);
      if (c.due < 0) g.rotation.set(0, 0, rz);
      g.scale.setScalar(sc);
    }
  }
  function renderAt(time) { var t = K.t(time); ctx.render(t, pose, cam, {}); }
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
