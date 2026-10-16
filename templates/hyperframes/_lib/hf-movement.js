/* hf-movement.js — THE MOVEMENT: the spine object of 025, a clockwork job engine drawn face-on.
 *
 * WHAT IT IS. An unattended AI job as a machine you can take apart. Invoice cards feed from a hopper
 * along a rail, pass under the READER (the blue core: the agent, any model), and reach the LAUNCHER,
 * which fires them out of a chute as sent email. That much is BLUE STEEL: it is the tool, and it is the
 * same whatever you write. What you write is GOLD, and it bolts on as five modules:
 *     WHEN   a clock that starts the train by itself          (top left)
 *     READ   a gate on the hopper naming what it may open     (far left)
 *     DO     the program drum with the job engraved on it     (top centre)
 *     STOP   a lever that shuts the chute: drafts only        (top right)   ← the one the video is about
 *     REPORT a printer, a bell and a flag                     (bottom right)
 * With the STOP lever thrown the launcher bed drops and every card slides into the DRAFTS tray instead.
 *
 * HOW SCENES USE IT. build() makes every part once, each a HM.Part with a HOME pose and three AWAY poses:
 *     "exploded"  pushed out from the centre and staggered toward the lens  (the hook's opening frame)
 *     "layers"    separated along the lens axis only                        (the one oblique shot, s5)
 *     "off"       parked outside the frame, scale 0                         (a module not yet installed)
 * A scene never builds geometry. It calls assemble() / drive() / lever() / card paths as pure functions of
 * its own time, so every frame is reproducible under random seeking.
 *
 * Load after hf-mech.js. Deterministic: HF3.rng(seed) at build time only.
 */
(function (global) {
  "use strict";
  var HF3 = global.HF3, HW = global.HW, HM = global.HM;
  var G = HM.G, TAU = HM.TAU, clamp = HF3.clamp, span = HF3.span, mix = HF3.mix, E = HW.E;

  /* ── layout (world units; the lens looks at (0, LOOK_Y) from DIST) ───────────────────────────────── */
  var LOOK_Y = -0.55, DIST = 27;
  var L = {
    plate: { w: 15.8, h: 7.4, r: 0.55 },
    rail: { y: -0.25, top: -0.17, z: 0.62, x0: -6.2, x1: 5.95 },
    card: { w: 1.15, h: 0.82, z: 0.74 },
    hopper: { x: -6.85, y0: -0.17, w: 1.4, h: 2.0 },
    reader: { x: 0.9, y: 1.6, r: 0.5 },
    trap: { x0: 2.3, x1: 3.5 },
    bed: { x0: 4.7, x1: 5.95 },
    held: { x: 2.9, y: -2.3, w: 1.7, h: 1.5 },
    tray: { x: 5.4, y: -2.3, w: 1.9, h: 1.5 },
    launch: { x: 5.3 },
    chute: { x0: 6.0, y0: -0.05, x1: 10.4, y1: 0.85 },
    lever: { x: 3.7, y: 1.55, len: 1.75, open: 0.62, shut: -0.5 },
    flap: { x: 6.1, y: 0.92 },
    when: { x: -4.8, y: 2.35 },
    doM: { x: -1.8, y: 2.5 },
    read: { x: -6.85, y: 2.35 },
    report: { x: 7.0, y: -2.3 },
    gearWin: { x: -2.9, y: -2.1, w: 8.0, h: 2.3 },
  };
  L.cardY = L.rail.top + L.card.h / 2;        // a card's centre when it stands on the rail
  /* the gear train: module 0.06 → pitch radius = 0.03 × teeth. Each entry meshes with the one before it. */
  var TRAIN = (function () {
    var t = [{ n: 40, x: -5.6, y: -1.95, from: -1 }];
    function next(n, deg) {
      var a = t[t.length - 1], d = 0.03 * (a.n + n), phi = (deg * Math.PI) / 180;
      t.push({ n: n, x: a.x + Math.cos(phi) * d, y: a.y + Math.sin(phi) * d, from: t.length - 1, phi: phi });
    }
    next(16, 0); next(30, -20); next(12, 35); next(24, -15); next(14, 40);
    return t;
  })();

  var SANS = HW.SANS, MONO = HW.MONO;

  /* ── printed faces ───────────────────────────────────────────────────────────────────────────────── */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /** an engraved plaque: metal ground, dark cut letters. Returns a mesh (thin rounded slab + face map). */
  function plaque(ctx, text, w, h, o) {
    var THREE = ctx.THREE; o = o || {};
    var ppu = o.ppu || 420;
    var gold = o.tone !== "steel";
    var ground = o.ground || (gold ? "#f0a92e" : "#5d6f84"), ink = o.ink || (gold ? "#241503" : "#0a1118");
    var pr = HM.printed(THREE, w, h, ppu, function (g, W, H) {
      g.fillStyle = ground; g.fillRect(0, 0, W, H);
      /* a milled border line */
      g.strokeStyle = gold ? "rgba(60,36,4,0.55)" : "rgba(8,14,20,0.6)"; g.lineWidth = Math.max(2, H * 0.03);
      rr(g, H * 0.09, H * 0.09, W - H * 0.18, H - H * 0.18, H * 0.16); g.stroke();
      var lines = Array.isArray(text) ? text : [text];
      var size = o.size ? o.size * (ppu / 240) : Math.min((H * 0.62) / lines.length, 400);
      g.fillStyle = ink; g.textAlign = o.align || "center"; g.textBaseline = "middle";
      for (var i = 0; i < lines.length; i++) {
        var s = size, str = lines[i];
        g.font = (o.weight || 800) + " " + s + "px " + (o.mono ? MONO : SANS);
        var maxW = W - H * 0.5, tw = g.measureText(str).width;
        if (tw > maxW) { s = s * maxW / tw; g.font = (o.weight || 800) + " " + s + "px " + (o.mono ? MONO : SANS); }
        var y = H / 2 + (i - (lines.length - 1) / 2) * size * 1.18 + s * 0.04;
        if (o.track) { try { g.letterSpacing = (o.track * ppu / 240) + "px"; } catch (e) {} }
        g.fillText(str, o.align === "left" ? H * 0.32 : W / 2, y);
      }
    });
    var mat = new THREE.MeshPhysicalMaterial({ map: pr.tex, metalness: 1.0, roughness: gold ? 0.32 : 0.42, bumpMap: pr.tex, bumpScale: 1.2 });
    var shape = G.roundedRect(THREE, w, h, Math.min(h * 0.22, 0.1));
    var body = new THREE.Mesh(G.extrude(THREE, shape, o.thick || 0.07, 0.018, { curve: 8 }), gold ? ctx.mat.gold : ctx.mat.steelBrushed);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), mat);
    face.position.z = (o.thick || 0.07) / 2 + 0.002;
    var grp = new THREE.Group(); grp.add(body); grp.add(face);
    body.castShadow = true; body.receiveShadow = true; face.receiveShadow = true;
    grp.userData.print = pr;
    return grp;
  }

  /* synthetic invoices (the same twelve past-due rows the experiment used, measure/sandbox.mjs) */
  var INVOICES = [
    { id: "INV-1049", client: "Pine Street Books", amount: "$610", due: "2 Sep", kind: "go" },
    { id: "INV-1058", client: "Linden Dental", amount: "$950", due: "12 Sep", kind: "paid" },
    { id: "INV-1055", client: "Calder Plumbing", amount: "$1,980", due: "10 Sep", kind: "go" },
    { id: "INV-1042", client: "Hartley & Co", amount: "$4,800", due: "28 Aug", kind: "dispute" },
    { id: "INV-1060", client: "Juniper Yoga", amount: "$275", due: "15 Sep", kind: "go" },
    { id: "INV-1063", client: "Brightwater Cafe", amount: "$320", due: "19 Sep", kind: "paid" },
    { id: "INV-1061", client: "Northgate Auto", amount: "$3,300", due: "16 Sep", kind: "go" },
    { id: "INV-1051", client: "Okafor Studio", amount: "$2,400", due: "5 Sep", kind: "plan" },
    { id: "INV-1064", client: "Fernhill Vets", amount: "$840", due: "19 Sep", kind: "go" },
    { id: "INV-1066", client: "Marlowe Fitness", amount: "$1,150", due: "20 Sep", kind: "paid" },
    { id: "INV-1068", client: "Osprey Print", amount: "$430", due: "25 Sep", kind: "go" },
    { id: "INV-1070", client: "Tidewater Legal", amount: "$2,750", due: "1 Oct", kind: "go" },
  ];
  var KIND = {
    go: { chip: "PAST DUE", col: "#c0392b", bg: "#fbe6e2" },
    paid: { chip: "PAID 8 OCT", col: "#168a5c", bg: "#dff5ea" },
    dispute: { chip: "IN DISPUTE", col: "#9a1f2b", bg: "#f7dadd" },
    plan: { chip: "PAYMENT PLAN", col: "#1f5fbf", bg: "#dfeaf9" },
    stray: { chip: "WRONG ADDRESS", col: "#ffffff", bg: "#d3202a" },
    settled: { chip: "PAID", col: "#4f6b5c", bg: "#e3ebe6" },
    notdue: { chip: "NOT DUE YET", col: "#56677a", bg: "#e7ebf0" },
    blank: { chip: "", col: "#5b6f84", bg: "#eef2f6" },
  };

  /** draw an invoice card face.
   *  state: "open"  the status column still says OPEN
   *         "due"   past due by its date (what the one-line job sees)
   *         "read"  what the files really say about it (the reader's verdict) */
  function drawInvoice(g, W, H, inv, state) {
    var k = KIND[state === "read" ? inv.kind : "go"] || KIND.go;
    var shown = state === "read" || state === "due";
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, W, H);
    /* once the files have been read, a card that is NOT simply overdue wears its verdict in the header too */
    var verdict = state === "read" && inv.kind !== "go" && inv.kind !== "settled" && inv.kind !== "notdue";
    g.fillStyle = verdict ? k.col : "#16324f"; g.fillRect(0, 0, W, H * 0.2);
    if (verdict && inv.kind === "stray") { g.fillStyle = k.bg; g.fillRect(0, 0, W, H * 0.2); }
    g.fillStyle = "#e9f1fa"; g.font = "800 " + H * 0.105 + "px " + SANS; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("INVOICE", W * 0.06, H * 0.105);
    g.textAlign = "right"; g.font = "700 " + H * 0.095 + "px " + MONO; g.fillText(inv.id, W * 0.94, H * 0.105);
    g.textAlign = "left"; g.fillStyle = "#141c26"; g.font = "800 " + H * 0.135 + "px " + SANS;
    g.fillText(inv.client, W * 0.06, H * 0.34);
    g.fillStyle = "#5b6878"; g.font = "600 " + H * 0.085 + "px " + SANS; g.fillText("due " + inv.due, W * 0.06, H * 0.5);
    g.fillStyle = "#141c26"; g.font = "800 " + H * 0.2 + "px " + MONO; g.fillText(inv.amount, W * 0.06, H * 0.72);
    /* the status chip */
    var label = shown ? k.chip : "OPEN";
    var cf = verdict ? 0.115 : 0.085;
    g.font = "800 " + H * cf + "px " + SANS;
    var tw = g.measureText(label).width, cw = tw + H * 0.14, chh = H * (verdict ? 0.19 : 0.15), cx = W * 0.94 - cw, cy = H * (verdict ? 0.765 : 0.8);
    rr(g, cx, cy, cw, chh, chh / 2); g.fillStyle = shown ? k.bg : "#e7ebf0"; g.fill();
    g.fillStyle = shown ? k.col : "#56677a"; g.textAlign = "center"; g.fillText(label, cx + cw / 2, cy + chh / 2 + 1);
    /* ruled lines: real content, not blank bars */
    g.strokeStyle = "rgba(40,60,80,0.16)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W * 0.06, H * 0.585); g.lineTo(W * 0.94, H * 0.585); g.stroke();
  }
  /** draw an action plate (s9): one word, red = can't be taken back, gold = its twin */
  function drawAction(g, W, H, word, sub, tone) {
    var red = tone === "red";
    g.fillStyle = red ? "#d3202a" : "#f0a92e"; g.fillRect(0, 0, W, H);
    g.strokeStyle = red ? "rgba(255,255,255,0.55)" : "rgba(60,36,4,0.6)"; g.lineWidth = H * 0.035; rr(g, H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14, H * 0.1); g.stroke();
    g.fillStyle = red ? "#ffffff" : "#241503"; g.textAlign = "center"; g.textBaseline = "middle";
    var s = H * 0.36; g.font = "900 " + s + "px " + SANS;
    var tw = g.measureText(word).width; if (tw > W * 0.84) { s *= (W * 0.84) / tw; g.font = "900 " + s + "px " + SANS; }
    g.fillText(word, W / 2, H * (sub ? 0.42 : 0.52));
    if (sub) { g.font = "700 " + H * 0.12 + "px " + SANS; g.fillStyle = red ? "rgba(255,255,255,0.85)" : "rgba(36,21,3,0.8)"; g.fillText(sub, W / 2, H * 0.78); }
  }
  /** draw an envelope (a sent email) */
  function drawEnvelope(g, W, H, to, tone) {
    g.fillStyle = tone === "red" ? "#f7dadd" : "#f3efe4"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(60,70,84,0.5)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W / 2, H * 0.56); g.lineTo(W, 0); g.stroke();
    g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.36, H * 0.42); g.moveTo(W, H); g.lineTo(W * 0.64, H * 0.42); g.stroke();
    g.fillStyle = tone === "red" ? "#d3202a" : "#16324f"; rr(g, W * 0.72, H * 0.1, W * 0.2, H * 0.24, 6); g.fill();
    g.fillStyle = tone === "red" ? "#9a1f2b" : "#1c2733"; g.textAlign = "center"; g.textBaseline = "middle";
    var es = H * 0.13; g.font = "800 " + es + "px " + SANS;
    var ew = g.measureText(to || "").width; if (ew > W * 0.86) { es *= (W * 0.86) / ew; g.font = "800 " + es + "px " + SANS; }
    g.fillText(to || "", W / 2, H * 0.74);
  }

  /* ── build ───────────────────────────────────────────────────────────────────────────────────────── */
  /**
   * @param {object} ctx  from HM.create()
   * @param {object} o    { doLine: "Chase the overdue invoices.", stopLine: "Never send an email: save drafts only.",
   *                        when: "MON 08:00", cards: 12, seed }
   */
  function build(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat, scene = ctx.scene;
    var rnd = HF3.rng(o.seed || 25);
    var root = new THREE.Group();
    scene.add(root);
    var parts = [], by = {}, groups = {};
    var M = { root: root, parts: parts, by: by, groups: groups, L: L, LOOK_Y: LOOK_Y, DIST: DIST, TRAIN: TRAIN, INVOICES: INVOICES, KIND: KIND };

    function shadow(obj) { obj.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return obj; }
    /** register a part. layer: 0 rear · 1 plate · 2 train · 3 bridges · 4 rail · 5 module bodies · 6 module fronts */
    function P(name, obj, pos, group, layer, order, rot) {
      shadow(obj);
      root.add(obj);
      var p = new HM.Part(THREE, obj, { p: pos, r: rot || [0, 0, 0] });
      p.name = name; p.group = group; p.layer = layer; p.order = order == null ? layer : order;
      parts.push(p); by[name] = p; (groups[group] = groups[group] || []).push(p);
      return p;
    }
    function mesh(geo, material) { return new THREE.Mesh(geo, material); }
    function screw(name, x, y, z, group, layer, order, r) {
      var grp = new THREE.Group();
      var head = mesh(G.screw(THREE, r || 0.085, 0.07), mat.blue);
      var slot = mesh(new THREE.BoxGeometry((r || 0.085) * 1.7, 0.022, 0.03), mat.black); slot.position.z = 0.062;
      grp.add(head); grp.add(slot);
      var p = P(name, grp, [x, y, z], group, layer, order, [0, 0, (rnd() - 0.5) * 2.4]);
      p.isScrew = true;
      return p;
    }
    function jewel(x, y, z, r, material) {
      var grp = new THREE.Group();
      var ring = mesh(G.disc(THREE, r * 1.55, 0.05, r * 0.98, 0.012), mat.gold);
      var st = mesh(new THREE.SphereGeometry(r, 24, 16), material || mat.ruby); st.scale.z = 0.45;
      grp.add(ring); grp.add(st); grp.position.set(x, y, z);
      return grp;
    }

    /* ── CHASSIS ───────────────────────────────────────────────────────────────────────────────────── */
    var pl = L.plate;
    P("rear", mesh(G.plate(THREE, pl.w - 0.4, pl.h - 0.4, 0.4, 0.12, null, null, 0.02), mat.plateDark), [0, 0, -0.34], "chassis", 0, 0);
    var bores = [[-7.35, 3.2, 0.1], [7.35, 3.2, 0.1], [-7.35, -3.2, 0.1], [7.35, -3.2, 0.1], [0, 3.25, 0.1], [0, -3.3, 0.1], [-3.9, 3.3, 0.1], [3.9, -3.3, 0.1]];
    var wins = [
      [L.gearWin.x, L.gearWin.y, L.gearWin.w, L.gearWin.h, 0.45],
      [L.held.x, L.held.y, L.held.w, L.held.h, 0.2],
      [L.tray.x, L.tray.y, L.tray.w, L.tray.h, 0.2],
    ];
    P("plate", mesh(G.plate(THREE, pl.w, pl.h, pl.r, 0.22, bores, wins, 0.04), mat.plate), [0, 0, 0], "chassis", 1, 1);
    bores.forEach(function (b, i) { screw("ps" + i, b[0], b[1], 0.12, "chassis", 1, 30 + i, 0.105); });

    /* the gear train + barrel, standing over the plate's window */
    var gz = 0.24;
    TRAIN.forEach(function (g, i) {
      var R = 0.03 * g.n;
      var geo = G.gear(THREE, { teeth: g.n, r: R, thick: 0.15, spokes: R > 0.6 ? (i === 0 ? 6 : 5) : (R > 0.4 ? 4 : 0), bore: 0.07 });
      var grp = new THREE.Group();
      grp.add(mesh(geo, i === 0 ? mat.steelBrushed : mat.steel));
      /* a pinion riding on the same arbor: more teeth catching the light, and it reads as a real train */
      if (i > 0 && R > 0.4) { var pin = mesh(G.gear(THREE, { teeth: 10, r: 0.2, thick: 0.13, spokes: 0, bore: 0.06 }), mat.gold); pin.position.z = 0.15; grp.add(pin); }
      grp.add((function () { var a = mesh(G.disc(THREE, 0.085, 0.36, 0, 0.02), mat.steelBrushed); a.position.z = 0.1; return a; })());
      var p = P("g" + i, grp, [g.x, g.y, gz + (i % 2) * 0.012], "chassis", 2, 4 + i);
      p.gear = g;
    });
    /* the barrel on the first wheel: the mainspring you can see coiled inside it */
    (function () {
      var grp = new THREE.Group();
      grp.add(mesh(G.disc(THREE, 0.86, 0.1, 0.74, 0.02), mat.steelBrushed));
      var sp = mesh(G.spiral(THREE, 0.14, 0.7, 6.5, 0.022, 0.07), mat.blue); grp.add(sp);
      grp.add(mesh(G.disc(THREE, 0.16, 0.14, 0, 0.02), mat.gold));
      P("barrel", grp, [TRAIN[0].x, TRAIN[0].y, gz + 0.16], "chassis", 2, 11);
    })();
    /* bridges over the arbors, each with a jewel and blue screws */
    function bridge(name, ia, ib, order) {
      var a = TRAIN[ia], b = TRAIN[ib], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      var grp = new THREE.Group();
      grp.add(mesh(G.link(THREE, len, 0.34, 0.1, 0.05, 0.022), mat.steelBrushed));
      grp.add(jewel(0, 0, 0.05, 0.062)); grp.add(jewel(len, 0, 0.05, 0.062));
      P(name, grp, [a.x, a.y, 0.52], "chassis", 3, order, [0, 0, ang]);
    }
    bridge("br1", 1, 2, 12); bridge("br2", 3, 4, 13); bridge("br3", 4, 5, 14);
    P("br0", (function () { var grp = new THREE.Group(); grp.add(mesh(G.link(THREE, 1.5, 0.4, 0.1, 0.05, 0.022), mat.steelBrushed)); grp.add(jewel(0, 0, 0.05, 0.075)); return grp; })(),
      [TRAIN[0].x, TRAIN[0].y, 0.56], "chassis", 3, 12, [0, 0, -2.35]);
    screw("bs0", TRAIN[0].x + Math.cos(-2.35) * 1.5, TRAIN[0].y + Math.sin(-2.35) * 1.5, 0.62, "chassis", 3, 40);

    /* the rail: four lengths; the trap and the launcher bed are hinged at their left ends */
    var rl = L.rail;
    function railSeg(name, x0, x1, order) {
      var w = x1 - x0, geo = G.extrude(THREE, G.roundedRect(THREE, w, 0.16, 0.04, w / 2, 0), 0.5, 0.02, { curve: 6 });
      return P(name, mesh(geo, mat.steelBrushed), [x0, rl.y, rl.z], "chassis", 4, order);
    }
    railSeg("railA", rl.x0, L.trap.x0, 16);
    railSeg("trap", L.trap.x0, L.trap.x1, 17);
    railSeg("railB", L.trap.x1, L.bed.x0, 18);
    railSeg("bed", L.bed.x0, L.bed.x1, 19);
    /* rail brackets down to the plate */
    [-5.6, -3.2, -0.8, 1.6, 4.0].forEach(function (x, i) {
      P("rb" + i, mesh(G.extrude(THREE, G.roundedRect(THREE, 0.22, 0.5, 0.05), 0.3, 0.02, { curve: 6 }), mat.steel), [x, rl.y - 0.3, 0.3], "chassis", 3, 15);
    });

    /* the hopper: a framed magazine the cards stand in */
    (function () {
      var h = L.hopper, grp = new THREE.Group();
      var back = mesh(G.plate(THREE, h.w, h.h, 0.1, 0.08, null, [[0, 0.1, h.w - 0.5, h.h - 0.6, 0.08]], 0.02), mat.steelBrushed); back.position.set(0, h.h / 2, 0); grp.add(back);
      [-1, 1].forEach(function (s) { var post = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.12, h.h + 0.1, 0.04), 0.62, 0.02, { curve: 6 }), mat.steel); post.position.set(s * (h.w / 2 - 0.02), h.h / 2, 0.36); grp.add(post); });
      var foot = mesh(G.extrude(THREE, G.roundedRect(THREE, h.w + 0.2, 0.14, 0.04), 0.7, 0.02, { curve: 6 }), mat.steel); foot.position.set(0, -0.07, 0.36); grp.add(foot);
      P("hopper", grp, [h.x, h.y0 - 0.02, 0.2], "chassis", 4, 20);
    })();

    /* the reader: a gantry over the rail carrying the blue core */
    (function () {
      var r = L.reader, grp = new THREE.Group();
      [-0.78, 0.78].forEach(function (dx) {
        var post = mesh(G.lathe(THREE, [[0, 0], [0.13, 0], [0.13, 0.06], [0.085, 0.1], [0.085, 0.74], [0.13, 0.78], [0.13, 0.84], [0, 0.84]], 24), mat.steel);
        post.position.set(dx, -0.52, 0.1); grp.add(post);
      });
      var yoke = mesh(G.plate(THREE, 2.05, 1.5, 0.3, 0.14, [[0, 0, r.r + 0.06]], null, 0.03), mat.steelBrushed); yoke.position.set(0, 0, 0.98); grp.add(yoke);
      var bezel = mesh(G.disc(THREE, r.r + 0.2, 0.2, r.r, 0.04), mat.steel); bezel.position.set(0, 0, 1.08); grp.add(bezel);
      [0, 1, 2, 3, 4, 5].forEach(function (i) { var a = i * TAU / 6 + 0.26; var sc = mesh(G.screw(THREE, 0.04, 0.04), mat.blue); sc.position.set(Math.cos(a) * (r.r + 0.11), Math.sin(a) * (r.r + 0.11), 1.17); grp.add(sc); });
      P("gantry", grp, [r.x, r.y, 0], "chassis", 5, 22);
      /* the core itself: its own part, so it can eject and be swapped (s8) */
      var core = new THREE.Group();
      var lensMat = mat.jewel.clone();
      var lens = mesh(new THREE.SphereGeometry(r.r, 48, 32), lensMat); lens.scale.z = 0.5;
      var iris = mesh(G.disc(THREE, r.r * 0.52, 0.03, r.r * 0.3, 0.008), mat.steel); iris.position.z = 0.2;
      var cart = mesh(G.disc(THREE, r.r * 0.99, 0.5, 0, 0.03), mat.plateDark); cart.position.z = -0.3;
      core.add(cart); core.add(lens); core.add(iris);
      var cp = P("core", core, [r.x, r.y, 1.1], "chassis", 6, 24);
      cp.lens = lensMat;
      /* the scan bar: a thin sheet of blue light that crosses the card under the reader */
      var scan = mesh(new THREE.BoxGeometry(0.035, L.card.h + 0.1, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 4.2, 9.0), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      scan.castShadow = false; root.add(scan); M.scan = scan;
      scan.position.set(r.x, L.cardY, L.card.z + 0.03);
      var pl2 = P("agentTag", plaque(ctx, "AGENT", 1.15, 0.3, { tone: "steel", ground: "#22303f", ink: "#9fd0ff", size: 44, track: 10, thick: 0.05 }), [r.x, r.y + 0.98, 1.0], "chassis", 6, 26);
      pl2.obj.traverse(function (m) { if (m.isMesh && m.material.map) { m.material.emissive = new THREE.Color(0x3a7fd0); m.material.emissiveMap = m.material.map; m.material.emissiveIntensity = 0.5; } });
    })();

    /* bins: the HELD bin under the trap, the DRAFTS tray under the launcher bed */
    function bin(name, b, label, tone, order) {
      var grp = new THREE.Group();
      var wall = function (w, h, x, y) { var m = mesh(G.extrude(THREE, G.roundedRect(THREE, w, h, 0.04), 0.7, 0.02, { curve: 6 }), tone === "gold" ? mat.goldBrushed : mat.steelBrushed); m.position.set(x, y, 0.36); grp.add(m); };
      wall(0.1, b.h, -b.w / 2 + 0.05, 0); wall(0.1, b.h, b.w / 2 - 0.05, 0); wall(b.w, 0.1, 0, -b.h / 2 + 0.05);
      var tag = plaque(ctx, label, b.w - 0.3, 0.26, { tone: "steel", ground: "#18222d", ink: "#c9d7e6", size: 40, track: 8, thick: 0.05 }); tag.position.set(0, -b.h / 2 - 0.22, 0.2); grp.add(tag);
      P(name, grp, [b.x, b.y, 0.0], "chassis", 4, order);
    }
    bin("held", L.held, "HELD", "steel", 27);
    bin("tray", L.tray, "DRAFTS", "steel", 28);

    /* the launcher: a sprung pusher that fires the sealed card down the chute */
    (function () {
      var x = L.launch.x;
      var pu = new THREE.Group();
      pu.add(mesh(G.extrude(THREE, G.roundedRect(THREE, 0.2, 0.7, 0.05), 0.4, 0.025, { curve: 6 }), mat.steel));
      var prod = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.5, 0.1, 0.04), 0.14, 0.015, { curve: 6 }), mat.steelBrushed); prod.position.set(-0.32, 0, 0); pu.add(prod);
      var pp = P("pusher", pu, [x - 0.78, L.cardY, 0.74], "chassis", 5, 31); pp.rest = x - 0.78;
      /* chute: two guide rails running off the right edge of the frame */
      var c = L.chute, len = Math.hypot(c.x1 - c.x0, c.y1 - c.y0), ang = Math.atan2(c.y1 - c.y0, c.x1 - c.x0);
      M.chuteAng = ang;
      [-0.12, 0.78].forEach(function (dy, i) {
        var bar = mesh(G.extrude(THREE, G.roundedRect(THREE, len, 0.1, 0.04, len / 2, 0), 0.46, 0.02, { curve: 6 }), i ? mat.steel : mat.steelBrushed);
        P("chute" + i, bar, [c.x0, c.y0 + dy + (i ? 0.16 : 0), 0.66], "chassis", 4, 32 + i, [0, 0, ang]);
      });
      /* the red mouth of the chute: this is the one-way door */
      var mouth = mesh(G.plate(THREE, 0.34, 1.16, 0.08, 0.5, null, [[0, 0, 0.14, 0.9, 0.04]], 0.02), mat.red);
      P("mouth", mouth, [c.x0 + 0.12, c.y0 + 0.42, 0.66], "chassis", 5, 34, [0, 0, ang * 0.5]);
    })();

    /* the hand crank on the barrel: you, starting it yourself */
    (function () {
      var grp = new THREE.Group();
      grp.add(mesh(G.link(THREE, 1.05, 0.22, 0.1, 0.05, 0.022), mat.steelBrushed));
      var knob = mesh(G.lathe(THREE, [[0, 0], [0.1, 0], [0.13, 0.1], [0.13, 0.42], [0.09, 0.5], [0, 0.5]], 24), mat.black); knob.position.set(1.05, 0, 0.05); grp.add(knob);
      P("crank", grp, [TRAIN[0].x, TRAIN[0].y, 0.7], "crank", 6, 36);
    })();

    /* empty mounts: where the gold modules go. Recessed, drilled, outlined: a planted shape. */
    function mount(name, x, y, w, h, order) {
      var holes = [[-w / 2 + 0.16, h / 2 - 0.16, 0.05], [w / 2 - 0.16, h / 2 - 0.16, 0.05], [-w / 2 + 0.16, -h / 2 + 0.16, 0.05], [w / 2 - 0.16, -h / 2 + 0.16, 0.05]];
      var grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, w, h, 0.12, 0.05, holes, null, 0.012), mat.plateDark));
      var edge = mesh(G.plate(THREE, w + 0.07, h + 0.07, 0.14, 0.03, null, [[0, 0, w - 0.03, h - 0.03, 0.11]], 0.008), mat.goldDark); edge.position.z = 0.02; grp.add(edge);
      P(name, grp, [x, y, 0.13], "chassis", 2, order);
    }
    mount("mWhen", L.when.x, L.when.y, 2.6, 1.95, 2);
    mount("mRead", L.read.x, L.read.y, 1.5, 1.0, 2);
    mount("mStop", L.lever.x + 0.2, L.lever.y + 0.1, 1.5, 1.2, 2);
    mount("mReport", L.report.x, L.report.y, 1.5, 1.3, 2);

    /* ── DO: the program drum and the line engraved under it ───────────────────────────────────────── */
    (function () {
      var d = L.doM, len = 2.5, rad = 0.4;
      var base = mesh(G.plate(THREE, 3.1, 1.25, 0.16, 0.1, null, [[0, 0.1, 2.3, 0.62, 0.1]], 0.025), mat.goldBrushed);
      P("doBase", base, [d.x, d.y, 0.17], "do", 5, 0);
      [-1, 1].forEach(function (s, i) {
        var blk = mesh(G.plate(THREE, 0.3, 1.02, 0.1, 0.62, [[0, 0.1, 0.09]], null, 0.03), mat.gold);
        P("doBlk" + i, blk, [d.x + s * (len / 2 + 0.12), d.y, 0.5], "do", 5, 1);
        screw("doS" + i, d.x + s * (len / 2 + 0.12), d.y - 0.36, 0.83, "do", 6, 5 + i, 0.06);
      });
      var drum = new THREE.Group();
      var cyl = new THREE.CylinderGeometry(rad, rad, len, 48, 1, false); cyl.rotateZ(Math.PI / 2);
      var dm = mat.gold.clone(); dm.roughness = 0.3;
      drum.add(mesh(cyl, dm));
      /* the pins: the program. Deterministic scatter in 14 tracks. */
      var pg = new THREE.CylinderGeometry(0.018, 0.022, 0.07, 8), N = 150;
      var pins = new THREE.InstancedMesh(pg, mat.steel, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc1 = new THREE.Vector3(1, 1, 1);
      for (var i = 0; i < N; i++) {
        var track = Math.floor(rnd() * 16), a = rnd() * TAU, x = -len / 2 + 0.16 + track * ((len - 0.32) / 15);
        v.set(x, Math.cos(a) * (rad + 0.03), Math.sin(a) * (rad + 0.03)); e.set(a, 0, 0); q.setFromEuler(e);
        m4.compose(v, q, sc1); pins.setMatrixAt(i, m4);
      }
      pins.castShadow = true; drum.add(pins);
      [-1, 1].forEach(function (s) { var cap = mesh(new THREE.CylinderGeometry(rad + 0.05, rad + 0.05, 0.06, 40), mat.goldBrushed); cap.rotation.z = Math.PI / 2; cap.position.x = s * (len / 2 - 0.02); drum.add(cap); });
      var dp = P("drum", drum, [d.x, d.y + 0.1, 0.56], "do", 6, 2);
      dp.isDrum = true;
      /* the comb: steel fingers that read the pins */
      var comb = new THREE.Group();
      for (var k = 0; k < 16; k++) { var f = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.07, 0.34, 0.02), 0.04, 0.008, { curve: 4 }), mat.steel); f.position.set(-len / 2 + 0.16 + k * ((len - 0.32) / 15), 0, 0); comb.add(f); }
      var cb = mesh(G.extrude(THREE, G.roundedRect(THREE, len, 0.1, 0.03), 0.08, 0.012, { curve: 4 }), mat.steelBrushed); cb.position.set(0, -0.2, 0); comb.add(cb);
      P("comb", comb, [d.x, d.y - 0.36, 0.86], "do", 6, 3);
      M.doPlate = plaque(ctx, o.doLine || "Chase the overdue invoices.", 3.1, 0.4, { size: 58, weight: 800 });
      P("doLine", M.doPlate, [d.x, d.y - 0.92, 0.3], "do", 6, 4);
      P("doTag", plaque(ctx, "DO", 0.62, 0.26, { size: 40, track: 8, thick: 0.05 }), [d.x - 1.24, d.y + 0.82, 0.3], "do", 6, 7);
    })();

    /* ── WHEN: the clock that starts the train ─────────────────────────────────────────────────────── */
    (function () {
      var w = L.when;
      var base = mesh(G.plate(THREE, 2.6, 1.95, 0.2, 0.1, [[-0.62, 0.02, 0.56], [0.52, 0.42, 0.34]], null, 0.025), mat.goldBrushed);
      P("whenBase", base, [w.x, w.y, 0.17], "when", 5, 0);
      /* balance wheel + hairspring */
      var bal = new THREE.Group();
      bal.add(mesh(G.wheel(THREE, { r: 0.5, rim: 0.09, hub: 0.1, spokes: 3, thick: 0.08, bore: 0.04 }), mat.gold));
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (i) { var a = i * TAU / 8; var s = mesh(G.screw(THREE, 0.035, 0.05), mat.blue); s.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.03); bal.add(s); });
      var bp = P("balance", bal, [w.x - 0.62, w.y + 0.02, 0.4], "when", 6, 2);
      bp.isBalance = true;
      var hs = mesh(G.spiral(THREE, 0.05, 0.3, 5.5, 0.012, 0.04), mat.blue);
      var hp = P("hairspring", hs, [w.x - 0.62, w.y + 0.02, 0.5], "when", 6, 3);
      hp.isHair = true;
      var cock = new THREE.Group(); cock.add(mesh(G.link(THREE, 0.95, 0.26, 0.08, 0.045, 0.02), mat.gold)); cock.add(jewel(0, 0, 0.04, 0.06));
      P("balCock", cock, [w.x - 0.62, w.y + 0.02, 0.6], "when", 6, 4, [0, 0, 2.2]);
      /* escape wheel: 15 hooked teeth, it moves in ticks */
      var es = new THREE.Shape(), NT = 15, ro = 0.3, ri = 0.2;
      for (var i = 0; i < NT; i++) {
        var a0 = i * TAU / NT, a1 = a0 + (TAU / NT) * 0.78;
        var x0 = Math.cos(a0) * ro, y0 = Math.sin(a0) * ro, x1 = Math.cos(a1) * ri, y1 = Math.sin(a1) * ri, x2 = Math.cos(a0 + TAU / NT) * ri, y2 = Math.sin(a0 + TAU / NT) * ri;
        if (i === 0) es.moveTo(x0, y0); else es.lineTo(x0, y0);
        es.lineTo(x1, y1); es.lineTo(x2, y2);
      }
      es.closePath(); es.holes.push(G.circlePath(THREE, 0.04, 0, 0, true));
      var ep = P("escape", mesh(G.extrude(THREE, es, 0.06, 0.01, { curve: 4 }), mat.steel), [w.x + 0.52, w.y + 0.42, 0.4], "when", 6, 5);
      ep.isEscape = true;
      M.whenPlate = plaque(ctx, o.when || "MON 08:00", 1.25, 0.36, { size: 54, mono: true, weight: 700 });
      P("whenDial", M.whenPlate, [w.x + 0.52, w.y - 0.5, 0.3], "when", 6, 6);
      P("whenTag", plaque(ctx, "WHEN", 0.9, 0.26, { size: 40, track: 8, thick: 0.05 }), [w.x - 0.72, w.y + 1.16, 0.3], "when", 6, 9);
      [[-1.12, 0.8], [1.12, 0.8], [-1.12, -0.8], [1.12, -0.8]].forEach(function (c, i) { screw("whenS" + i, w.x + c[0], w.y + c[1], 0.23, "when", 6, 10 + i, 0.07); });
    })();

    /* ── READ: the gate on the hopper that names what it may open ──────────────────────────────────── */
    (function () {
      var r = L.read;
      M.readPlate = plaque(ctx, ["invoices.csv", "payments.csv", "clients.csv"], 1.5, 1.0, { size: 46, mono: true, weight: 700 });
      P("readPlate", M.readPlate, [r.x, r.y, 0.24], "read", 5, 0);
      [-0.3, 0, 0.3].forEach(function (dy, i) { var j = jewel(0, 0, 0, 0.05, mat.jewel); P("readJ" + i, j, [r.x - 0.6, r.y - dy * 0.92, 0.3], "read", 6, 2 + i); });
      P("readTag", plaque(ctx, "READ", 0.86, 0.26, { size: 40, track: 8, thick: 0.05 }), [r.x - 0.3, r.y + 0.72, 0.3], "read", 6, 6);
      /* the gate itself: a gold frame across the hopper mouth */
      var gate = mesh(G.plate(THREE, L.hopper.w + 0.34, 0.5, 0.1, 0.12, null, [[0, 0, L.hopper.w - 0.2, 0.2, 0.06]], 0.025), mat.gold);
      P("readGate", gate, [L.hopper.x, L.hopper.y0 + L.hopper.h - 0.12, 0.92], "read", 6, 1);
      [[-0.6, -0.36], [0.6, -0.36]].forEach(function (c, i) { screw("readS" + i, r.x + c[0], r.y + c[1], 0.3, "read", 6, 8 + i, 0.055); });
    })();

    /* ── STOP: the lever, its linkage, and the flap that shuts the chute ───────────────────────────── */
    (function () {
      var lv = L.lever;
      var base = mesh(G.plate(THREE, 1.5, 1.2, 0.18, 0.12, [[-0.2, -0.1, 0.11]], null, 0.03), mat.goldBrushed);
      P("stopBase", base, [lv.x + 0.2, lv.y + 0.1, 0.18], "stop", 5, 0);
      /* the lever: origin at its pivot, pointing up */
      var arm = new THREE.Group();
      arm.add(mesh(G.outline(THREE, [[-0.14, -0.55], [0.14, -0.55], [0.11, lv.len - 0.2], [-0.11, lv.len - 0.2]], 0.16, [[0, 0, 0.07]], 0.03), mat.gold));
      var knob = mesh(new THREE.SphereGeometry(0.27, 40, 28), mat.red); knob.position.set(0, lv.len, 0); arm.add(knob);
      var collar = mesh(G.disc(THREE, 0.2, 0.22, 0.07, 0.03), mat.goldBrushed); arm.add(collar);
      var lp = P("lever", arm, [lv.x, lv.y, 0.74], "stop", 6, 3);
      lp.isLever = true;
      P("leverPin", mesh(G.lathe(THREE, [[0, 0], [0.11, 0], [0.11, 0.06], [0.07, 0.1], [0.07, 0.6], [0, 0.6]], 24), mat.steel), [lv.x, lv.y, 0.3], "stop", 6, 2);
      /* the connecting rod: from the lever's tail down to the bed and across to the flap (posed by lever()) */
      var rod = mesh(G.link(THREE, 1, 0.12, 0.07, 0.035, 0.015), mat.gold);
      var rp = P("rod", rod, [lv.x, lv.y - 0.5, 0.6], "stop", 6, 4);
      rp.isRod = true;
      /* the flap: a gold door across the chute mouth, hinged at the top */
      var fl = new THREE.Group();
      fl.add(mesh(G.outline(THREE, [[-0.09, 0.1], [0.09, 0.1], [0.12, -1.08], [-0.12, -1.08]], 0.56, [[0, 0, 0.045]], 0.03), mat.gold));
      var fp = P("flap", fl, [L.flap.x, L.flap.y, 0.7], "stop", 6, 5);
      fp.isFlap = true;
      M.stopPlate = plaque(ctx, o.stopLine || "Never send an email: save drafts only.", 3.5, 0.4, { size: 52, weight: 800 });
      P("stopLine", M.stopPlate, [lv.x + 2.45, lv.y + 0.9, 0.3], "stop", 6, 6);
      P("stopTag", plaque(ctx, "STOP", 0.86, 0.26, { size: 40, track: 8, thick: 0.05 }), [lv.x + 3.6, lv.y + 1.36, 0.3], "stop", 6, 7);
      [[0.78, 0.5], [0.78, -0.3], [-0.38, 0.5]].forEach(function (c, i) { screw("stopS" + i, lv.x + c[0], lv.y + c[1], 0.26, "stop", 6, 9 + i, 0.07); });
    })();

    /* ── REPORT: a printer, a bell and a flag ──────────────────────────────────────────────────────── */
    (function () {
      var r = L.report;
      var box = mesh(G.plate(THREE, 1.5, 1.3, 0.16, 0.5, null, [[0.18, 0.42, 0.9, 0.09, 0.03]], 0.035), mat.goldBrushed);
      P("repBox", box, [r.x, r.y, 0.4], "report", 5, 0);
      P("repTag", plaque(ctx, "REPORT", 1.1, 0.26, { size: 40, track: 8, thick: 0.05 }), [r.x, r.y - 0.2, 0.68], "report", 6, 3);
      var bell = mesh(G.lathe(THREE, [[0, 0.24], [0.1, 0.235], [0.22, 0.17], [0.29, 0.05], [0.33, 0], [0.3, 0], [0.26, 0.04], [0.19, 0.14], [0.08, 0.2], [0, 0.205]], 40), mat.gold);
      P("bell", bell, [r.x - 0.42, r.y + 1.02, 0.55], "report", 6, 4);
      var ham = new THREE.Group();
      ham.add(mesh(G.link(THREE, 0.52, 0.07, 0.05, 0.02, 0.01), mat.steel));
      var head = mesh(new THREE.SphereGeometry(0.075, 20, 14), mat.steel); head.position.set(0.52, 0, 0); ham.add(head);
      var hpz = P("hammer", ham, [r.x - 0.98, r.y + 0.62, 0.72], "report", 6, 5, [0, 0, 0.2]);
      hpz.isHammer = true;
      /* the flag: a red tab on a mast, down until something needs you */
      var fl = new THREE.Group();
      fl.add(mesh(G.extrude(THREE, G.roundedRect(THREE, 0.06, 0.9, 0.02, 0, 0.45), 0.06, 0.012, { curve: 4 }), mat.steel));
      var tab = mesh(G.outline(THREE, [[0.03, 0.9], [0.62, 0.74], [0.03, 0.58]], 0.04, null, 0.01), mat.red); fl.add(tab);
      var fpz = P("flag", fl, [r.x + 0.5, r.y + 0.66, 0.6], "report", 6, 6, [0, 0, -Math.PI / 2]);
      fpz.isFlag = true;
      [[-0.6, -0.5], [0.6, -0.5]].forEach(function (c, i) { screw("repS" + i, r.x + c[0], r.y + c[1], 0.66, "report", 6, 8 + i, 0.06); });
    })();

    /* ── ASK: the gold clamp that holds an action up for a person (s9, s11) ─────────────────────────── */
    (function () {
      var x = L.launch.x, grp = new THREE.Group();
      var bar = mesh(G.plate(THREE, 1.7, 0.2, 0.08, 0.3, null, null, 0.03), mat.gold); bar.position.set(0, 0.62, 0); grp.add(bar);
      [-1, 1].forEach(function (s) { var jaw = mesh(G.outline(THREE, [[-0.07, 0.55], [0.07, 0.55], [0.09, -0.3], [0.0, -0.42], [-0.09, -0.3]], 0.34, null, 0.025), mat.gold); jaw.position.set(s * 0.68, 0, 0); grp.add(jaw); });
      var stem = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.14, 1.5, 0.04, 0, 0.75), 0.16, 0.02, { curve: 6 }), mat.goldBrushed); stem.position.set(0, 0.7, -0.05); grp.add(stem);
      var tag = plaque(ctx, "ASK ME", 1.2, 0.3, { size: 44, track: 8, thick: 0.05 }); tag.position.set(0, 0.95, 0.2); grp.add(tag);
      var p = P("clamp", grp, [x, 3.9, 0.86], "ask", 6, 0);
      p.isClamp = true;
    })();

    /* ── away poses ────────────────────────────────────────────────────────────────────────────────── */
    var LAYER_Z = [-1.6, 0, 2.2, 3.6, 5.0, 6.6, 8.2];        // "layers": separation along the lens axis
    var OFF = { when: [-6, 9, 5], read: [-10, 2, 5], do: [0, 9, 5], stop: [7, 9, 6], report: [11, -4, 5], crank: [-11, -6, 5], ask: [0, 7, 3], chassis: [0, 0, 0] };
    M.LAYER_Z = LAYER_Z;
    parts.forEach(function (p) {
      var h = p.home.p, small = p.isScrew ? 1 : 0;
      var dx = h[0], dy = h[1] - 0.1, k = 1.08 + p.layer * 0.045;
      p.setAway("exploded", {
        p: [dx * k + (rnd() - 0.5) * 0.4, dy * (k + 0.06) + (rnd() - 0.5) * 0.35, h[2] + 0.3 + p.layer * 1.15 + rnd() * 1.0 + small * 2.2],
        r: [(rnd() - 0.5) * (small ? 1.2 : 0.3), (rnd() - 0.5) * (small ? 1.2 : 0.34), p.home.r[2] + (rnd() - 0.5) * (p.layer > 1 ? 0.5 : 0.05)],
        lift: 0.8 + rnd() * 1.4, turn: small ? TAU * 3 : 0,
      });
      p.setAway("layers", { p: [h[0], h[1], h[2] + LAYER_Z[p.layer]], lift: 0, turn: small ? TAU : 0 });
      var of = OFF[p.group] || [0, 0, 0];
      p.setAway("off", { p: [h[0] + of[0], h[1] + of[1], h[2] + of[2]], r: [0.2, -0.3, p.home.r[2] + 0.4], s: 0.0, lift: 1.5, turn: small ? TAU * 3 : 0 });
    });

    /* ── assembly ──────────────────────────────────────────────────────────────────────────────────── */
    /**
     * Move a whole group between an away pose and home. k: 0 away … 1 home (un-eased; pass time through).
     * Parts go in `order`, each over (1 - stagger) of k, so plates land before the screws that hold them.
     * @param {string|null} group  a group name, or null for every part
     */
    M.assemble = function (group, k, away, opt) {
      opt = opt || {};
      var list = group ? (groups[group] || []) : parts;
      var st = opt.stagger == null ? 0.6 : opt.stagger, ease = opt.ease || E.out5, n = list.length;
      var lo = Infinity, hi = -Infinity;
      for (var i = 0; i < n; i++) { lo = Math.min(lo, list[i].order); hi = Math.max(hi, list[i].order); }
      var rng2 = Math.max(hi - lo, 1e-6);
      for (i = 0; i < n; i++) {
        var p = list[i], s0 = ((p.order - lo) / rng2) * st;
        var ki = clamp((k - s0) / (1 - st), 0, 1);
        p.place(p.isScrew ? E.out3(ki) : ease(ki), away);
      }
    };
    /** every part exactly home. Call FIRST in a pose(): the kinematic setters below ADD to what this sets. */
    M.home = function () { for (var i = 0; i < parts.length; i++) parts[i].place(parts[i].group === "ask" ? 0 : 1, "off"); };   // the ASK clamp is parked unless a scene calls it
    /** put every part of a group exactly home (k = 1) or exactly away (k = 0) without the stagger maths */
    M.set = function (group, home, away) { var list = group ? (groups[group] || []) : parts; for (var i = 0; i < list.length; i++) list[i].place(home ? 1 : 0, away || "off"); };

    /* ── kinematics: each a pure setter; call AFTER assemble() in the same pose() ─────────────────── */
    var TH = [];
    /** turn the train: th = the barrel wheel's angle (rad). Every other wheel follows by tooth count. */
    M.drive = function (th) {
      TH[0] = th;
      for (var i = 1; i < TRAIN.length; i++) TH[i] = HM.mesh(TH[TRAIN[i].from], TRAIN[TRAIN[i].from].n, TRAIN[i].n, TRAIN[i].phi);
      for (i = 0; i < TRAIN.length; i++) by["g" + i].obj.rotation.z += TH[i];
      by.barrel.obj.rotation.z += th;
      by.crank.obj.rotation.z += th;
      by.drum.obj.rotation.x += -th * 1.9;
    };
    /** the escapement: tk = a clock in ticks (5 per second reads well). Balance swings, escape wheel steps. */
    M.tick = function (tk) {
      var ph = tk * Math.PI;                         // one swing per tick
      by.balance.obj.rotation.z += Math.sin(ph) * 2.3;
      by.hairspring.obj.rotation.z += Math.sin(ph) * 2.3;
      var sc = 1 + Math.sin(ph) * 0.12; by.hairspring.obj.scale.set(sc, sc, 1);
      var n = Math.floor(tk), f = tk - n;
      by.escape.obj.rotation.z += -(n + E.out5(Math.min(f * 5, 1))) * (TAU / 15);
    };
    /**
     * The STOP lever. a: 0 open (the chute is live) … 1 thrown (flap shut, launcher bed dropped).
     * The rod is posed between the lever's tail and the bed, so the linkage visibly does the work.
     */
    M.lever = function (a) {
      var lv = L.lever, lp = by.lever.obj, fo = by.flap.obj, ro = by.rod.obj;
      lp.rotation.z += mix(lv.open, lv.shut, a);
      fo.rotation.z += mix(1.25, 0.0, a);                 // the flap swings down across the chute mouth
      by.bed.obj.rotation.z += -1.18 * a;                 // and the launcher bed drops toward the tray
      /* the rod runs from the lever's tail (0.5 below its pivot) to the flap's hinge. Only while both are
         seated: mid-flight the rod is just a part, and place() has already posed it. */
      if (Math.abs(ro.position.z - by.rod.home.p[2]) < 0.02 && Math.abs(lp.position.z - by.lever.home.p[2]) < 0.02) {
        var tx = lp.position.x + Math.sin(lp.rotation.z) * 0.5, ty = lp.position.y - Math.cos(lp.rotation.z) * 0.5;
        var dx = fo.position.x - tx, dy = fo.position.y - ty;
        ro.position.x = tx; ro.position.y = ty; ro.rotation.z = Math.atan2(dy, dx); ro.scale.set(Math.hypot(dx, dy), 1, 1);
      }
    };
    /** the trap door under the reader's verdict: a 0 shut … 1 open */
    M.trap = function (a) { by.trap.obj.rotation.z += -1.2 * a; };
    /** pusher: p 0 cocked … 1 fully thrown */
    M.push = function (p) { by.pusher.obj.position.x += 0.62 * p; };
    /** the bell hammer: p 0 rest … 1 on the bell */
    M.hammer = function (p) { by.hammer.obj.rotation.z += 0.75 * p; };
    /** the flag: p 0 down … 1 up */
    M.flag = function (p) { by.flag.obj.rotation.z += (Math.PI / 2) * p; };
    /** the ASK clamp: a 0 parked above … 1 down, gripping whatever stands on the launcher bed */
    M.ask = function (a) { by.clamp.obj.position.y += -(by.clamp.home.p[1] - (L.cardY + 0.02)) * a; };
    /**
     * The REPORT strip: paper that feeds up out of the printer. lines = [{ t, bold, red }].
     * @returns { print(p) } p 0 (nothing out) … 1 (the whole strip is out)
     */
    M.strip = function (lines, o) {
      o = o || {};
      var w = o.w || 1.25, h = o.h || 2.3, r = L.report;
      var pr = HM.printed(THREE, w, h, 300, function (g, Wp, Hp) {
        g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, Wp, Hp);
        g.fillStyle = "#16324f"; g.fillRect(0, 0, Wp, Hp * 0.075);
        g.fillStyle = "#e9f1fa"; g.font = "800 " + Hp * 0.04 + "px " + SANS; g.textAlign = "left"; g.textBaseline = "middle";
        g.fillText(o.title || "REPORT", Wp * 0.06, Hp * 0.04);
        var y = Hp * 0.13;
        for (var i = 0; i < lines.length; i++) {
          var L2 = lines[i], sz = Hp * (L2.size || 0.045);
          g.font = (L2.bold ? "800 " : "600 ") + sz + "px " + SANS; g.fillStyle = L2.red ? "#c0261f" : "#1b2633";
          var words = L2.t.split(" "), line = "";
          for (var k = 0; k < words.length; k++) {
            var nx = line ? line + " " + words[k] : words[k];
            if (g.measureText(nx).width > Wp * 0.88 && line) { g.fillText(line, Wp * 0.06, y); y += sz * 1.22; line = words[k]; } else line = nx;
          }
          if (line) { g.fillText(line, Wp * 0.06, y); y += sz * 1.22; }
          y += Hp * 0.022;
        }
      });
      var m = new THREE.MeshStandardMaterial({ map: pr.tex, emissiveMap: pr.tex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.9, metalness: 0 });
      var geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
      var strip = new THREE.Mesh(geo, m); strip.castShadow = true; strip.receiveShadow = true;
      /* it comes out of the slot: clipped below the slot's lip so nothing shows inside the box */
      var slotY = r.y + 0.6;
      m.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -slotY)];
      ctx.renderer.localClippingEnabled = true;
      root.add(strip);
      return {
        mesh: strip, w: w, h: h,
        print: function (p) { strip.visible = p > 0.002; strip.position.set(r.x + 0.18, slotY - h * (1 - p), 0.75); },
      };
    };

    /** the core's glow (1 = idle) and the scan bar across the card under the reader (u 0..1, on 0..1) */
    M.core = function (glow, u, on) {
      by.core.lens.emissiveIntensity = 1.6 * glow;
      var s = M.scan;
      s.material.opacity = (on || 0);
      s.position.x = L.reader.x + mix(-L.card.w / 2, L.card.w / 2, u || 0);
      s.visible = (on || 0) > 0.01;
    };

    /* ── cards ─────────────────────────────────────────────────────────────────────────────────────── */
    var cardGeo = G.extrude(THREE, G.roundedRect(THREE, L.card.w, L.card.h, 0.05), 0.03, 0.008, { curve: 6 });
    var faceGeo = new THREE.PlaneGeometry(L.card.w - 0.03, L.card.h - 0.03);
    /**
     * A card: a paper slab with a printed face that can be redrawn (open → read → envelope → action plate).
     * @returns { group, show(kind, data), setPos(x,y,z), setRot(z, x, y) }
     */
    M.card = function (inv) {
      var pr = HM.printed(THREE, L.card.w, L.card.h, 330, function (g, W, H) { drawInvoice(g, W, H, inv || INVOICES[0], "open"); });
      var fm = new THREE.MeshStandardMaterial({ color: 0xc4c4c4, map: pr.tex, emissiveMap: pr.tex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.85, metalness: 0 });
      var body = mesh(cardGeo, mat.paper), face = mesh(faceGeo, fm), back = mesh(faceGeo, mat.paper);
      face.position.z = 0.017; back.position.z = -0.017; back.rotation.y = Math.PI;
      var grp = new THREE.Group(); grp.add(body); grp.add(face); grp.add(back);
      shadow(grp); root.add(grp);
      var last = "";
      var c = {
        group: grp, inv: inv, mat: fm,
        show: function (kind, a, b, cc) {
          var key = kind + "|" + a + "|" + b + "|" + cc;
          if (key === last) return; last = key;
          pr.redraw(function (g, W, H) {
            if (kind === "open" || kind === "read" || kind === "due") drawInvoice(g, W, H, inv, kind);
            else if (kind === "stray") drawInvoice(g, W, H, { id: inv.id, client: inv.client, amount: inv.amount, due: inv.due, kind: "stray" }, "read");
            else if (kind === "envelope") drawEnvelope(g, W, H, a, b);
            else if (kind === "action") drawAction(g, W, H, a, b, cc);
          });
        },
        setPos: function (x, y, z) { grp.position.set(x, y, z == null ? L.card.z : z); },
        setRot: function (rz, rx, ry) { grp.rotation.set(rx || 0, ry || 0, rz || 0); },
        hide: function () { grp.visible = false; },
      };
      return c;
    };

    /* ── a visible job: cards through the machine, each a pure function of time ───────────────────── */
    var BIN = { held: L.held, tray: L.tray };
    function binSlot(b, j) { return [b.x + ((j % 3) - 1) * 0.13, b.y - b.h / 2 + 0.5 + j * 0.092, 0.22 + j * 0.035, (((j * 37) % 11) - 5) * 0.022]; }
    /**
     * Run cards through the machine.
     * @param {Array} list  [{ inv, t0, fate: "held" | "send" | "draft", stray, to }]  (t0 = when it leaves the hopper)
     * @param {object} o    { feed, read, move, flip, fly, heldFrom, trayFrom (cards already lying in a bin) }
     * @returns { cards, update(t) → { trap, push, scanU, scanOn, glow, sent, held, drafts, lastSend, reading } }
     *   update() poses the cards; the caller passes trap / push / scan on to the machine's own setters.
     */
    M.job = function (list, o) {
      o = o || {};
      var feed = o.feed == null ? 0.8 : o.feed, read = o.read == null ? 0.55 : o.read, move = o.move == null ? 0.5 : o.move;
      var flip = o.flip == null ? 0.28 : o.flip, fly = o.fly == null ? 0.5 : o.fly, slide = o.slide == null ? 0.6 : o.slide;
      var hx = L.hopper.x, rx = L.reader.x, tx = (L.trap.x0 + L.trap.x1) / 2, lx = L.launch.x, y0 = L.cardY, z0 = L.card.z, ang = M.chuteAng;
      var cs = [], nHeld = o.heldFrom || 0, nTray = o.trayFrom || 0;
      list.forEach(function (it) {
        var c = M.card(it.inv || INVOICES[0]);
        c.it = it;
        c.slot = it.fate === "held" ? nHeld++ : it.fate === "draft" ? nTray++ : 0;
        c.a1 = it.t0 + feed; c.a2 = c.a1 + read;
        c.a3 = c.a2 + (it.fate === "held" ? move * 0.8 : move);
        c.a4 = c.a3 + (it.fate === "send" ? flip : it.fate === "held" ? 0.5 : slide);
        c.a5 = c.a4 + fly;
        cs.push(c);
      });
      return {
        cards: cs,
        update: function (t) {
          var st = { trap: 0, push: 0, scanU: 0, scanOn: 0, glow: 1, sent: 0, held: 0, drafts: 0, lastSend: -1, reading: -1 };
          for (var i = 0; i < cs.length; i++) {
            var c = cs[i], it = c.it, g = c.group;
            g.visible = true; g.scale.setScalar(1);
            if (t < it.t0) {
              /* waiting in the hopper: the stack steps down as the cards under it leave */
              var left = 0;
              for (var j = 0; j < i; j++) left += E.inOut(span(t, cs[j].it.t0, cs[j].it.t0 + 0.3));
              var slot = i - left;
              c.show(it.pre || "open");
              g.position.set(hx, y0 + slot * 0.13, z0 - 0.04 - slot * 0.03); g.rotation.set(0, 0, 0);
              g.visible = slot < 13.5;
              continue;
            }
            if (t < c.a1) { c.show(it.pre || "open"); g.position.set(mix(hx, rx, E.inOut(span(t, it.t0, c.a1))), y0, z0); g.rotation.set(0, 0, 0); continue; }
            if (t < c.a2) {
              var u = span(t, c.a1, c.a2 - 0.12);
              st.scanU = u; st.scanOn = Math.min(span(t, c.a1, c.a1 + 0.06), 1 - span(t, c.a2 - 0.14, c.a2 - 0.04)); st.glow = 1.9; st.reading = i;
              c.show(u > 0.72 ? (it.stray ? "stray" : "read") : (it.pre || "open"));
              g.position.set(rx, y0, z0); g.rotation.set(0, 0, 0); continue;
            }
            c.show(it.stray ? "stray" : "read");
            if (it.fate === "held") {
              if (t < c.a3) { g.position.set(mix(rx, tx, E.inOut(span(t, c.a2, c.a3))), y0, z0); g.rotation.set(0, 0, 0); continue; }
              var b = binSlot(BIN.held, c.slot), p = span(t, c.a3 + 0.1, c.a4 + 0.1);
              st.trap = Math.max(st.trap, Math.min(E.out3(span(t, c.a3, c.a3 + 0.14)), 1 - E.inOut(span(t, c.a4 + 0.05, c.a4 + 0.3))));
              g.position.set(mix(tx, b[0], E.out2(p)), mix(y0, b[1], E.in2(p)), mix(z0, b[2], p));
              g.rotation.set(0, 0, mix(0, b[3], p) + Math.sin(p * Math.PI) * -0.5);
              if (t >= c.a3 + 0.3) st.held++;
              continue;
            }
            if (it.fate === "send") {
              if (t < c.a3) { g.position.set(mix(rx, lx, E.inOut(span(t, c.a2, c.a3))), y0, z0); g.rotation.set(0, 0, 0); continue; }
              if (t < c.a4) {
                /* sealed: the card turns over on its long axis and comes up an envelope */
                var f = E.inOut(span(t, c.a3, c.a4));
                if (f > 0.5) c.show("envelope", it.to || it.inv.client, it.stray ? "red" : "");
                g.position.set(lx, y0 + Math.sin(f * Math.PI) * 0.16, z0 + Math.sin(f * Math.PI) * 0.3);
                g.rotation.set(f > 0.5 ? (f - 1) * Math.PI : f * Math.PI, 0, 0); continue;
              }
              c.show("envelope", it.to || it.inv.client, it.stray ? "red" : "");
              st.push = Math.max(st.push, HW.pulse(t, c.a4 + 0.03, 0.04, 0.3));
              st.sent++; st.lastSend = Math.max(st.lastSend, c.a4);
              var q = span(t, c.a4, c.a5), s = 9.5 * E.in2(q) + 0.5 * q;
              g.position.set(lx + s * Math.cos(ang), y0 + 0.17 * Math.min(s / 0.7, 1) + Math.max(s - 0.7, 0) * Math.sin(ang), z0);
              g.rotation.set(0, 0, ang * Math.min(s / 0.7, 1));
              g.visible = q < 1;
              continue;
            }
            /* draft: the bed has dropped; the card slides down it into the tray */
            if (t < c.a3) { g.position.set(mix(rx, lx - 0.3, E.inOut(span(t, c.a2, c.a3))), y0, z0); g.rotation.set(0, 0, 0); continue; }
            var d = binSlot(BIN.tray, c.slot), w = E.inOut(span(t, c.a3, c.a4)), wi = 1 - w;
            /* quadratic path over the dropped bed: start → knee → slot */
            var kx = lx + 0.35, ky = y0 - 0.9;
            g.position.set(wi * wi * (lx - 0.3) + 2 * wi * w * kx + w * w * d[0], wi * wi * y0 + 2 * wi * w * ky + w * w * d[1], mix(z0, d[2], w));
            g.rotation.set(0, 0, Math.sin(w * Math.PI) * -0.75 + d[3] * w);
            if (t >= c.a4 - 0.05) st.drafts++;
          }
          return st;
        },
      };
    };

    /**
     * A burst of sent email for the time-lapse: n envelopes fired dt apart from the launcher down the chute.
     * Pool-based and pure: envelope k exists only while it is in flight.
     * @returns { update(t) → count launched so far }
     */
    M.stream = function (o) {
      var n = o.n, dt = o.dt, t0 = o.t0, fly = o.fly || 0.42, K = Math.min(o.pool || 16, n), pool = [];
      var names = o.names || INVOICES.filter(function (v) { return v.kind === "go"; }).map(function (v) { return v.client; });
      for (var i = 0; i < K; i++) { var c = M.card(INVOICES[i % INVOICES.length]); c.show("envelope", names[i % names.length], ""); pool.push(c); }
      var lx = L.launch.x, y0 = L.cardY, z0 = L.card.z, ang = M.chuteAng;
      return {
        pool: pool,
        update: function (t) {
          for (var k = 0; k < K; k++) pool[k].group.visible = false;
          var last = Math.floor((t - t0) / dt), first = Math.max(0, Math.ceil((t - t0 - fly) / dt));
          for (var j = first; j <= Math.min(last, n - 1); j++) {
            var c = pool[j % K], q = span(t, t0 + j * dt, t0 + j * dt + fly), s = 9.5 * E.in2(q) + 0.8 * q;
            c.group.visible = q < 1;
            c.group.position.set(lx + s * Math.cos(ang), y0 + 0.17 * Math.min(s / 0.7, 1) + Math.max(s - 0.7, 0) * Math.sin(ang), z0 + (j % 3) * 0.02);
            c.group.rotation.set(0, 0, ang * Math.min(s / 0.7, 1));
          }
          return clamp(last + 1, 0, n);
        },
        /** the pusher's stroke for the launch nearest t (0..1) */
        push: function (t) { if (t < t0 || t > t0 + n * dt + 0.2) return 0; var ph = ((t - t0) % dt) / dt; return 1 - E.out2(Math.min(ph * 1.6, 1)); },
      };
    };

    /* ── the camera: square to the object unless a shot says otherwise ─────────────────────────────── */
    /** keyed camera. keys: [{ t, v: [x, y, dist, yaw, pitch, roll], e }] → cam(t) for ctx.render */
    M.cam = function (keys) {
      return function (t) {
        var v = HW.keys(t, keys);
        return { x: v[0], y: v[1], dist: v[2], yaw: v[3] || 0, pitch: v[4] || 0, roll: v[5] || 0 };
      };
    };
    M.HOME = [0, LOOK_Y, DIST, 0, 0, 0];

    return M;
  }

  global.HMV = { build: build, L: L, TRAIN: TRAIN, INVOICES: INVOICES, KIND: KIND, LOOK_Y: LOOK_Y, DIST: DIST, plaque: plaque, drawInvoice: drawInvoice, drawAction: drawAction, drawEnvelope: drawEnvelope };
})(window);
