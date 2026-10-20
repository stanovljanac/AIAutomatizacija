/* hf-watch.js — the spine objects of 026 ("Why AI agents fail silently"), drawn face-on on _lib/hf-mech.js.
 *
 * THE LINE (set 1) is a scheduled AI job you can watch run. Quote requests leave the WEBSITE FORM (a housing,
 * top left), drop into a trough and slide right under the AGENT (the blue lens: any model). Each one it reads
 * falls into the IN box. Then the PRESS prints the morning report and racks it. That much is BLUE STEEL: the
 * tool. What you WRITE is GOLD: the JOB plate (the instruction, engraved), and — from s9b — two modules that
 * bolt on: PROOF (a count window, a newest-time window, the normal engraved on a scale) and ALARM (a flag that
 * stands up over the press). Seven history drawers along the bottom hold the earlier days; the plain job never
 * opens them, the proof job does.
 *   The form breaks three ways, each with its own handwheel on the trough:
 *     ERROR     a red 401 plate drops into the trough and the trough lamp goes red         (loud)
 *     OLD DATA  the form re-serves last week's slips, stamped with their old date            (confusing)
 *     EMPTY     the pipe from the form comes apart — nothing arrives, every lamp stays green  (quiet)
 *
 * THE WATCHER (set 4) is the dead man's handle for software: a gold dial whose needle runs down toward a
 * deadline, re-armed by each heartbeat token that drops through its chute; at the deadline the pawl lets go
 * and the hammer rings the bell. THE VAULT (set 2, GitLab 2017) and THE CAB (set 3, the dead man's handle)
 * are the two flashbacks.
 *
 * Every builder makes its parts ONCE as HM.Part (HOME pose + named AWAY poses). A scene never builds geometry:
 * it calls setters as pure functions of its own time, so every frame is reproducible under random seeking.
 * Load order: gsap → hf-scene → hf-three → hf-world → hf-mech → hf-watch → <scene>.js
 * Deterministic: HF3.rng(seed) at build time only. No rAF, no Date.now, no Math.random.
 */
(function (global) {
  "use strict";
  var HF3 = global.HF3, HW = global.HW, HM = global.HM;
  var G = HM.G, TAU = HM.TAU, clamp = HF3.clamp, span = HF3.span, mix = HF3.mix, E = HW.E;
  var SANS = HW.SANS, MONO = HW.MONO;

  /* ── data: the experiment's own synthetic requests (content/026-silent-failures/measure/sandbox.mjs) ─── */
  var YDAY = "17 OCT", TODAY = "Sun 18 Oct";
  var REQUESTS = [
    { name: "Priya Raman", msg: "Kitchen remodel, galley layout", at: "08:14" },
    { name: "Tom Becker", msg: "Leaking shower tray", at: "09:02" },
    { name: "Grace Ojo", msg: "Full bathroom refit", at: "10:47" },
    { name: "Luis Ortega", msg: "Splashback tiling", at: "12:30" },
    { name: "Hannah Kim", msg: "Sink to an island?", at: "14:05" },
    { name: "Owen Hart", msg: "Rental flat bathroom", at: "16:21" },
    { name: "Mei Lin", msg: "Kitchen extension estimate", at: "19:48" },
  ];
  var STALE = [
    { name: "Daniel Price", msg: "Bath to walk-in shower", at: "08:40" },
    { name: "Sara Novak", msg: "Quartz worktops", at: "10:12" },
    { name: "Amir Haddad", msg: "Downstairs toilet", at: "11:55" },
    { name: "Julia Ferraro", msg: "Cabinet doors only", at: "13:20" },
    { name: "Ben Walsh", msg: "Ensuite, loft", at: "15:03" },
    { name: "Chloe Martin", msg: "Underfloor heating?", at: "18:37" },
  ];
  var STALE_DAY = "12 OCT";
  /* the seven earlier days (reports/ in the sandbox): [day, count] — the stale batch is the 12 Oct drawer */
  var HISTORY = [["10 OCT", 8], ["11 OCT", 5], ["12 OCT", 6], ["13 OCT", 7], ["14 OCT", 6], ["15 OCT", 5], ["16 OCT", 8]];

  /* ── printing helpers ────────────────────────────────────────────────────────────────────────────── */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function fit(g, str, size, maxW, weight, font) {
    var s = size; g.font = (weight || 800) + " " + s + "px " + (font || SANS);
    var tw = g.measureText(str).width; if (tw > maxW) { s = s * maxW / tw; g.font = (weight || 800) + " " + s + "px " + (font || SANS); }
    return s;
  }
  /** wrap text into lines that fit maxW at the current font */
  function wrap(g, str, maxW) {
    var words = String(str).split(" "), out = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var nx = line ? line + " " + words[i] : words[i];
      if (g.measureText(nx).width > maxW && line) { out.push(line); line = words[i]; } else line = nx;
    }
    if (line) out.push(line);
    return out;
  }

  /** an engraved plaque: metal ground, cut letters. tone "gold" | "steel" | "dark" */
  function plaque(ctx, text, w, h, o) {
    var THREE = ctx.THREE; o = o || {};
    var ppu = o.ppu || 420, tone = o.tone || "gold";
    var ground = o.ground || (tone === "gold" ? "#f0a92e" : tone === "dark" ? "#18222d" : "#5d6f84");
    var ink = o.ink || (tone === "gold" ? "#241503" : tone === "dark" ? "#c9d7e6" : "#0a1118");
    var pr = HM.printed(THREE, w, h, ppu, function (g, W, H) { drawPlaque(g, W, H, text, o, ground, ink, tone); });
    var mat = new THREE.MeshPhysicalMaterial({ map: pr.tex, metalness: tone === "dark" ? 0.4 : 1.0, roughness: tone === "gold" ? 0.32 : 0.42, bumpMap: pr.tex, bumpScale: 1.2 });
    if (o.glow) { mat.emissive = new THREE.Color(o.glow); mat.emissiveMap = pr.tex; mat.emissiveIntensity = o.glowI == null ? 0.5 : o.glowI; }
    var shape = G.roundedRect(THREE, w, h, Math.min(h * 0.22, 0.1));
    var body = new THREE.Mesh(G.extrude(THREE, shape, o.thick || 0.07, 0.018, { curve: 8 }), tone === "gold" ? ctx.mat.gold : ctx.mat.steelBrushed);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), mat);
    face.position.z = (o.thick || 0.07) / 2 + 0.002;
    var grp = new THREE.Group(); grp.add(body); grp.add(face);
    body.castShadow = true; body.receiveShadow = true; face.receiveShadow = true;
    grp.userData.print = pr; grp.userData.mat = mat;
    grp.userData.redraw = function (t2, o2) { pr.redraw(function (g, W, H) { drawPlaque(g, W, H, t2, Object.assign({}, o, o2 || {}), ground, ink, tone); }); };
    return grp;
  }
  function drawPlaque(g, W, H, text, o, ground, ink, tone) {
    g.fillStyle = ground; g.fillRect(0, 0, W, H);
    g.strokeStyle = tone === "gold" ? "rgba(60,36,4,0.55)" : "rgba(8,14,20,0.6)"; g.lineWidth = Math.max(2, Math.min(W, H) * 0.03);
    rr(g, Math.min(W, H) * 0.09, Math.min(W, H) * 0.09, W - Math.min(W, H) * 0.18, H - Math.min(W, H) * 0.18, Math.min(W, H) * 0.16); g.stroke();
    var lines = Array.isArray(text) ? text : [text];
    var ppu = o.ppu || 420;
    var size = o.size ? o.size * (ppu / 240) : Math.min((H * 0.62) / lines.length, 400);
    g.textBaseline = "middle";
    for (var i = 0; i < lines.length; i++) {
      var L2 = lines[i], str = typeof L2 === "string" ? L2 : L2.t;
      var col = typeof L2 === "string" ? ink : (L2.c || ink), wt = typeof L2 === "string" ? (o.weight || 800) : (L2.w || o.weight || 800);
      g.fillStyle = col; g.textAlign = o.align || "center";
      var s = fit(g, str, size, W - Math.min(W, H) * 0.5, wt, o.mono ? MONO : SANS);
      var y = H / 2 + (i - (lines.length - 1) / 2) * size * 1.2 + s * 0.04;
      var x = o.align === "left" ? Math.min(W, H) * 0.32 : W / 2;
      g.fillText(str, x, y);
      if (typeof L2 !== "string" && L2.strike) {
        var tw = g.measureText(str).width, x0 = o.align === "left" ? x : x - tw / 2;
        g.strokeStyle = L2.strikeCol || "#9a1f2b"; g.lineWidth = s * 0.12;
        g.beginPath(); g.moveTo(x0 - s * 0.1, y); g.lineTo(x0 + tw * L2.strike + s * 0.1 * L2.strike, y); g.stroke();
      }
    }
  }

  /** a quote-request slip */
  function drawSlip(g, W, H, rq, tone, day) {
    var old = tone === "old";
    g.fillStyle = old ? "#e4ded0" : "#f6f3ea"; g.fillRect(0, 0, W, H);
    g.fillStyle = old ? "#6b6f74" : "#16324f"; g.fillRect(0, 0, W, H * 0.22);
    g.fillStyle = "#eef3f8"; g.textAlign = "left"; g.textBaseline = "middle";
    fit(g, "QUOTE REQUEST", H * 0.12, W * 0.62, 800);
    g.fillText("QUOTE REQUEST", W * 0.06, H * 0.115);
    g.fillStyle = "#151d27"; fit(g, rq.name, H * 0.16, W * 0.88, 800); g.fillText(rq.name, W * 0.06, H * 0.38);
    g.fillStyle = "#4f5c6b"; fit(g, rq.msg, H * 0.1, W * 0.88, 600); g.fillText(rq.msg, W * 0.06, H * 0.57);
    g.fillStyle = "#151d27"; g.font = "700 " + H * 0.12 + "px " + MONO; g.fillText((day || YDAY) + " · " + rq.at, W * 0.06, H * 0.8);
    if (old) {
      /* the old batch wears its real date as a rubber stamp */
      g.save(); g.translate(W * 0.72, H * 0.62); g.rotate(-0.18);
      g.strokeStyle = "rgba(170,40,40,0.85)"; g.lineWidth = H * 0.025; rr(g, -W * 0.22, -H * 0.11, W * 0.44, H * 0.22, H * 0.04); g.stroke();
      g.fillStyle = "rgba(170,40,40,0.9)"; g.textAlign = "center"; fit(g, day || STALE_DAY, H * 0.15, W * 0.38, 900); g.fillText(day || STALE_DAY, 0, H * 0.008);
      g.restore();
    }
  }
  /** the red error plate that drops into the trough instead of a slip */
  function drawError(g, W, H) {
    g.fillStyle = "#d3202a"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = H * 0.035; rr(g, H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14, H * 0.1); g.stroke();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    fit(g, "401", H * 0.42, W * 0.7, 900, MONO); g.fillText("401", W / 2, H * 0.4);
    fit(g, "token expired", H * 0.14, W * 0.82, 700); g.fillText("token expired", W / 2, H * 0.76);
  }

  /** a morning report sheet. state: "ok" | "allclear" | "error" | "buried" | "alarm" | "alarmStale" | "alarmError" | "blank" */
  function drawSheet(g, W, H, state, o) {
    o = o || {};
    g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#16324f"; g.fillRect(0, 0, W, H * 0.085);
    g.fillStyle = "#e9f1fa"; g.textAlign = "left"; g.textBaseline = "middle";
    fit(g, "MORNING REPORT", H * 0.038, W * 0.55, 800); g.fillText("MORNING REPORT", W * 0.06, H * 0.044);
    g.textAlign = "right"; g.font = "700 " + H * 0.033 + "px " + MONO; g.fillText(TODAY + " · 07:00", W * 0.94, H * 0.044);
    if (state === "blank") return;
    var x = W * 0.07, y = H * 0.14, mw = W * 0.86;
    function line(str, size, col, wt, gap) {
      g.fillStyle = col; g.font = (wt || 700) + " " + size + "px " + SANS; g.textAlign = "left";
      var ls = wrap(g, str, mw);
      for (var i = 0; i < ls.length; i++) { g.fillText(ls[i], x, y); y += size * 1.24; }
      y += gap == null ? H * 0.012 : gap;
    }
    function banner(str, bg, fg) {
      g.fillStyle = bg; rr(g, W * 0.05, y - H * 0.04, W * 0.9, H * 0.088, H * 0.016); g.fill();
      g.fillStyle = fg; g.textAlign = "center"; fit(g, str, H * 0.05, W * 0.82, 900); g.fillText(str, W / 2, y + H * 0.004);
      y += H * 0.085;
    }
    var hdr = "Quote requests, Sat " + YDAY.replace(" OCT", " Oct") + ": ";
    if (state === "ok") {
      line(hdr + "7", H * 0.042, "#141c26", 800);
      if (o.proof) line("Evidence: 7 returned · newest 19:48 · normal 5–9", H * 0.03, "#7a5410", 700, H * 0.02);
      for (var i = 0; i < REQUESTS.length; i++) line("• " + REQUESTS[i].name + " — " + REQUESTS[i].msg.toLowerCase(), H * 0.03, "#2a3644", 600, H * 0.004);
      return;
    }
    if (state === "allclear") {
      line(hdr + "0", H * 0.042, "#141c26", 800, H * 0.03);
      line("No new quote requests came in.", H * 0.052, "#141c26", 800, H * 0.03);
      /* the calm green tick */
      g.strokeStyle = "#168a5c"; g.lineWidth = H * 0.016; g.lineCap = "round"; g.lineJoin = "round";
      var cx = W * 0.5, cy = y + H * 0.11, s = H * 0.085;
      g.beginPath(); g.arc(cx, cy, s * 1.25, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(cx - s * 0.6, cy + s * 0.02); g.lineTo(cx - s * 0.12, cy + s * 0.5); g.lineTo(cx + s * 0.68, cy - s * 0.46); g.stroke();
      return;
    }
    if (state === "error") {
      g.fillStyle = "#c0261f"; g.font = "900 " + H * 0.044 + "px " + SANS; g.textAlign = "left";
      var ls = wrap(g, "Could not be checked — reconnect the account.", mw);
      for (var k = 0; k < ls.length; k++) { g.fillText(ls[k], x, y); y += H * 0.055; }
      y += H * 0.02;
      line("The form lookup failed: 401 Unauthorized, the access token has expired.", H * 0.03, "#2a3644", 600);
      line("Nothing below is confirmed for Sat 17 Oct.", H * 0.03, "#2a3644", 600);
      return;
    }
    if (state === "buried") {
      line(hdr + "0 new", H * 0.046, "#141c26", 800, H * 0.02);
      line("No new quote requests were received on 17 October.", H * 0.034, "#141c26", 700, H * 0.07);
      line("Note: the lookup returned 6 submissions, but all six were received on 12 October and were already listed in the 13 Oct report. Please check the form tool before relying on it.", H * 0.022, "#8b95a1", 500);
      return;
    }
    if (state === "alarm" || state === "alarmStale" || state === "alarmError") {
      banner("CHECK THE SOURCE", "#f0a92e", "#241503");
      y += H * 0.02;
      if (state === "alarm") {
        line("The source returned 0 items for Sat 17 Oct. This is not an all-clear.", H * 0.034, "#141c26", 800);
        line("Newest item: none · normal is 5 to 9 a day.", H * 0.03, "#2a3644", 600);
        line("Earlier days checked: 16 Oct 8 · 15 Oct 5.", H * 0.03, "#2a3644", 600);
      } else if (state === "alarmStale") {
        line("The source returned old items for yesterday: newest 12 Oct 18:37.", H * 0.034, "#141c26", 800);
        line("Same six already reported on 13 Oct. Not counted as new.", H * 0.03, "#2a3644", 600);
      } else {
        line("The source returned an error: 401, token expired.", H * 0.034, "#141c26", 800);
        line("Yesterday's requests are unknown, not zero.", H * 0.03, "#2a3644", 600);
      }
    }
  }

  /** a history drawer face: the date, and the day's count once it has been opened */
  function drawDrawer(g, W, H, day, n, open) {
    g.fillStyle = open ? "#24384f" : "#1a2533"; g.fillRect(0, 0, W, H);
    g.strokeStyle = open ? "rgba(255,176,32,0.8)" : "rgba(150,175,205,0.35)"; g.lineWidth = W * 0.04; rr(g, W * 0.06, H * 0.05, W * 0.88, H * 0.9, W * 0.08); g.stroke();
    g.fillStyle = "#c9d7e6"; g.textAlign = "center"; g.textBaseline = "middle";
    fit(g, day, H * 0.17, W * 0.8, 800); g.fillText(day, W / 2, H * 0.24);
    if (open) { g.fillStyle = "#ffc75f"; fit(g, String(n), H * 0.44, W * 0.8, 800, MONO); g.fillText(String(n), W / 2, H * 0.62); }
    else { g.fillStyle = "rgba(150,175,205,0.4)"; g.fillRect(W * 0.3, H * 0.58, W * 0.4, H * 0.06); }
  }
  /** the PROOF readout: count + newest time (blank before the module is installed) */
  function drawProof(g, W, H, count, newest, col) {
    g.fillStyle = "#0d1219"; g.fillRect(0, 0, W, H);
    g.textBaseline = "middle"; g.textAlign = "center";
    g.fillStyle = "#8a6a2a"; fit(g, "COUNT", H * 0.11, W * 0.42, 800); g.fillText("COUNT", W * 0.25, H * 0.17);
    g.fillText("NEWEST", W * 0.73, H * 0.17);
    g.fillStyle = col || "#ffc75f";
    fit(g, String(count), H * 0.42, W * 0.42, 700, MONO); g.fillText(String(count), W * 0.25, H * 0.56);
    fit(g, String(newest), H * 0.3, W * 0.46, 700, MONO); g.fillText(String(newest), W * 0.73, H * 0.56);
    g.fillStyle = "#8a6a2a"; fit(g, "normal 5–9 a day", H * 0.1, W * 0.9, 700); g.fillText("normal 5–9 a day", W / 2, H * 0.88);
  }

  /* ── shared builders ─────────────────────────────────────────────────────────────────────────────── */
  function kit(ctx, root, seed) {
    var THREE = ctx.THREE, mat = ctx.mat;
    var rnd = HF3.rng(seed || 26);
    var parts = [], by = {}, groups = {};
    function shadow(obj) { obj.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return obj; }
    function mesh(geo, material) { return new THREE.Mesh(geo, material); }
    /** register a part. layer: 0 rear · 1 plate · 2 inset · 3 frame · 4 rails · 5 module bodies · 6 fronts */
    function P(name, obj, pos, group, layer, order, rot) {
      shadow(obj); root.add(obj);
      var p = new HM.Part(THREE, obj, { p: pos, r: rot || [0, 0, 0] });
      p.name = name; p.group = group; p.layer = layer; p.order = order == null ? layer : order;
      parts.push(p); by[name] = p; (groups[group] = groups[group] || []).push(p);
      return p;
    }
    function screw(name, x, y, z, group, layer, order, r) {
      var grp = new THREE.Group();
      grp.add(mesh(G.screw(THREE, r || 0.085, 0.07), mat.blue));
      var slot = mesh(new THREE.BoxGeometry((r || 0.085) * 1.7, 0.022, 0.03), mat.black); slot.position.z = 0.062; grp.add(slot);
      var p = P(name, grp, [x, y, z], group, layer, order, [0, 0, (rnd() - 0.5) * 2.4]);
      p.isScrew = true;
      return p;
    }
    function jewel(x, y, z, r, material) {
      var grp = new THREE.Group();
      grp.add(mesh(G.disc(THREE, r * 1.55, 0.05, r * 0.98, 0.012), mat.gold));
      var st = mesh(new THREE.SphereGeometry(r, 24, 16), material || mat.ruby); st.scale.z = 0.45; grp.add(st);
      grp.position.set(x, y, z);
      return grp;
    }
    /** a lamp: a jewel whose colour and glow a scene sets (green / red / amber / off) */
    function lamp(name, x, y, z, r, group, layer, order) {
      var m = mat.jewel.clone();
      var grp = new THREE.Group();
      grp.add(mesh(G.disc(THREE, r * 1.6, 0.06, r * 0.98, 0.014), mat.steel));
      var st = mesh(new THREE.SphereGeometry(r, 28, 18), m); st.scale.z = 0.5; grp.add(st);
      var p = P(name, grp, [x, y, z], group, layer, order);
      p.lampMat = m;
      return p;
    }
    var LAMP = { green: [0x0d3a24, 0x2bff8e, 1.5], red: [0x4a0a0e, 0xff2a3c, 2.2], amber: [0x4a2e04, 0xffa21c, 2.0], blue: [0x0b2f7a, 0x2f8cff, 1.6], off: [0x101418, 0x000000, 0] };
    function setLamp(p, state, k) {
      var s = LAMP[state] || LAMP.off; k = k == null ? 1 : k;
      p.lampMat.color.setHex(s[0]); p.lampMat.emissive.setHex(s[1]); p.lampMat.emissiveIntensity = s[2] * k;
    }
    /** an empty mount: where a gold module goes. Recessed, drilled, outlined. */
    function mount(name, x, y, w, h, group, order) {
      var holes = [[-w / 2 + 0.16, h / 2 - 0.16, 0.05], [w / 2 - 0.16, h / 2 - 0.16, 0.05], [-w / 2 + 0.16, -h / 2 + 0.16, 0.05], [w / 2 - 0.16, -h / 2 + 0.16, 0.05]];
      var grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, w, h, 0.12, 0.05, holes, null, 0.012), mat.plateDark));
      var edge = mesh(G.plate(THREE, w + 0.07, h + 0.07, 0.14, 0.03, null, [[0, 0, w - 0.03, h - 0.03, 0.11]], 0.008), mat.goldDark); edge.position.z = 0.02; grp.add(edge);
      return P(name, grp, [x, y, 0.13], group || "chassis", 2, order == null ? 2 : order);
    }
    /** a paper sheet / slip with a redrawable printed face (unlit-ish: a printed face is not a lamp) */
    function paper(w, h, ppu, draw, o) {
      o = o || {};
      var pr = HM.printed(THREE, w, h, ppu, draw);
      var fm = new THREE.MeshStandardMaterial({ color: o.tint == null ? 0xc4c4c4 : o.tint, map: pr.tex, emissiveMap: pr.tex, emissive: 0xffffff, emissiveIntensity: o.emissive == null ? 0.12 : o.emissive, roughness: 0.88, metalness: 0 });
      /* o.round: a disc (a gauge face, a token) — a square sheet behind a round drawing shows its corners */
      var th = o.thick || 0.03, body;
      if (o.round) { body = mesh(new THREE.CylinderGeometry(w / 2, w / 2, th, 64), mat.paper); body.rotation.x = Math.PI / 2; }
      else body = mesh(G.extrude(THREE, G.roundedRect(THREE, w, h, Math.min(w, h) * 0.05), th, 0.006, { curve: 6 }), mat.paper);
      var faceGeo = o.round ? new THREE.CircleGeometry(w / 2 - 0.01, 64) : new THREE.PlaneGeometry(w - 0.02, h - 0.02);
      var face = mesh(faceGeo, fm); face.position.z = th / 2 + 0.002;
      var back = mesh(faceGeo, mat.paper); back.position.z = -th / 2 - 0.002; back.rotation.y = Math.PI;
      var grp = new THREE.Group(); grp.add(body); grp.add(face); grp.add(back);
      shadow(grp); root.add(grp);
      var last = null;
      return {
        group: grp, mat: fm, pr: pr,
        show: function (key, fn) { if (key === last) return; last = key; pr.redraw(fn); },
        at: function (x, y, z, rz, s) { grp.position.set(x, y, z); grp.rotation.set(0, 0, rz || 0); grp.scale.setScalar(s == null ? 1 : Math.max(s, 1e-4)); grp.visible = s == null || s > 1e-3; },
        hide: function () { grp.visible = false; },
      };
    }
    function awayPoses(OFF, LAYER_Z) {
      parts.forEach(function (p) {
        var h = p.home.p, small = p.isScrew ? 1 : 0, k = 1.08 + p.layer * 0.045;
        p.setAway("exploded", {
          p: [h[0] * k + (rnd() - 0.5) * 0.4, (h[1] - 0.1) * (k + 0.06) + (rnd() - 0.5) * 0.35, h[2] + 0.3 + p.layer * 1.15 + rnd() * 1.0 + small * 2.2],
          r: [(rnd() - 0.5) * (small ? 1.2 : 0.3), (rnd() - 0.5) * (small ? 1.2 : 0.34), p.home.r[2] + (rnd() - 0.5) * (p.layer > 1 ? 0.5 : 0.05)],
          lift: 0.8 + rnd() * 1.4, turn: small ? TAU * 3 : 0,
        });
        p.setAway("layers", { p: [h[0], h[1], h[2] + (LAYER_Z || [-1.6, 0, 2.2, 3.6, 5.0, 6.6, 8.2])[p.layer]], lift: 0, turn: small ? TAU : 0 });
        var of = (OFF || {})[p.group] || [0, 0, 0];
        p.setAway("off", { p: [h[0] + of[0], h[1] + of[1], h[2] + of[2]], r: [0.2, -0.3, p.home.r[2] + 0.4], s: 0.0, lift: 1.5, turn: small ? TAU * 3 : 0 });
      });
    }
    var K = {
      THREE: THREE, mat: mat, rnd: rnd, parts: parts, by: by, groups: groups,
      P: P, mesh: mesh, screw: screw, jewel: jewel, lamp: lamp, setLamp: setLamp, mount: mount, paper: paper, shadow: shadow, awayPoses: awayPoses,
      /** move a group between an away pose and home (k: 0 away … 1 home); parts land in `order` */
      assemble: function (group, k, away, opt) {
        opt = opt || {};
        var list = group ? (groups[group] || []) : parts;
        var st = opt.stagger == null ? 0.6 : opt.stagger, ease = opt.ease || E.out5, n = list.length, lo = Infinity, hi = -Infinity;
        for (var i = 0; i < n; i++) { lo = Math.min(lo, list[i].order); hi = Math.max(hi, list[i].order); }
        var r2 = Math.max(hi - lo, 1e-6);
        for (i = 0; i < n; i++) { var p = list[i], s0 = ((p.order - lo) / r2) * st, ki = clamp((k - s0) / (1 - st), 0, 1); p.place(p.isScrew ? E.out3(ki) : ease(ki), away); }
      },
      set: function (group, home, away) { var list = group ? (groups[group] || []) : parts; for (var i = 0; i < list.length; i++) list[i].place(home ? 1 : 0, away || "off"); },
    };
    return K;
  }

  /** keyed camera: keys [{ t, v: [x, y, dist, yaw, pitch, roll], e }] → cam(t) */
  function cam(keys) {
    return function (t) {
      var v = HW.keys(t, keys);
      return { x: v[0], y: v[1], dist: v[2], yaw: v[3] || 0, pitch: v[4] || 0, roll: v[5] || 0 };
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * THE LINE
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var LOOK_Y = 0, DIST = 27;
  var L = {
    plate: { w: 16.4, h: 7.6, r: 0.55 },
    form: { x: -6.85, y: 2.9, w: 2.1, h: 1.55 },
    pipe: { x: -6.85, yTop: 2.12, yLow: 1.15, r: 0.26 },      // the lower length is hinged at the trough
    trough: { y: 0.9, x0: -6.85, x1: -0.75, z: 0.62 },
    slip: { w: 0.98, h: 0.66, z: 0.74 },
    valve: { xs: [-5.3, -4.4, -3.5], y: 2.0, r: 0.3 },
    reader: { x: -1.75, y: 2.05, r: 0.52 },
    inbox: { x: -1.05, y: -1.75, w: 1.9, h: 1.7 },
    job: { x: -4.55, y: -0.45, w: 4.1, h: 0.86 },
    clock: { x: -7.35, y: -0.45, r: 0.52 },
    drawers: { x0: -7.25, y: -2.85, w: 0.6, h: 0.72, gap: 0.07 },
    press: { x: 2.55, y: -1.4, w: 3.0, h: 2.1 },
    sheet: { w: 2.55, h: 3.25, z: 0.7 },
    rack: { x: 6.45, y: -0.95, w: 2.8, h: 3.7 },
    proof: { x: 6.6, y: 2.7, w: 2.2, h: 1.35 },
    flag: { x: 4.3, y: -0.3 },          // the ALARM mast telescopes up from here; its flag flies to the right
  };
  L.slip.y = L.trough.y + 0.09 + L.slip.h / 2;     // a slip standing in the trough
  L.slotY = L.press.y + L.press.h / 2;              // the press's top lip: paper comes out here

  function line(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat, scene = ctx.scene;
    var root = new THREE.Group(); scene.add(root);
    var K = kit(ctx, root, o.seed || 26), P = K.P, mesh = K.mesh, screw = K.screw, by = K.by;
    var M = { root: root, K: K, L: L, by: by, LOOK_Y: LOOK_Y, DIST: DIST, REQUESTS: REQUESTS, STALE: STALE, HISTORY: HISTORY, YDAY: YDAY, cam: cam };
    ctx.renderer.localClippingEnabled = true;

    /* ── chassis ──────────────────────────────────────────────────────────────────────────────────── */
    var pl = L.plate;
    P("rear", mesh(G.plate(THREE, pl.w - 0.4, pl.h - 0.4, 0.4, 0.12, null, null, 0.02), mat.plateDark), [0, 0, -0.34], "chassis", 0, 0);
    var bores = [[-7.85, 3.45, 0.1], [7.85, 3.45, 0.1], [-7.85, -3.45, 0.1], [7.85, -3.45, 0.1], [0.6, 3.5, 0.1], [0.6, -3.5, 0.1]];
    var wins = [[L.inbox.x, L.inbox.y, L.inbox.w, L.inbox.h, 0.2], [L.rack.x, L.rack.y, L.rack.w, L.rack.h, 0.25]];
    P("plate", mesh(G.plate(THREE, pl.w, pl.h, pl.r, 0.22, bores, wins, 0.04), mat.plate), [0, 0, 0], "chassis", 1, 1);
    bores.forEach(function (b, i) { screw("ps" + i, b[0], b[1], 0.12, "chassis", 1, 30 + i, 0.105); });

    /* ── the WEBSITE FORM housing (top left): the source. Its face is a form. ─────────────────────── */
    (function () {
      var f = L.form, grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, f.w, f.h, 0.16, 0.42, null, null, 0.035), mat.steelBrushed));
      var face = K.paper(f.w - 0.36, f.h - 0.5, 300, function (g, W, H) {
        g.fillStyle = "#eef2f7"; g.fillRect(0, 0, W, H);
        g.fillStyle = "#16324f"; g.font = "800 " + H * 0.15 + "px " + SANS; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("Get a quote", W * 0.07, H * 0.14);
        [0.36, 0.56].forEach(function (y) { g.strokeStyle = "#9fb1c4"; g.lineWidth = H * 0.025; rr(g, W * 0.07, H * (y - 0.07), W * 0.86, H * 0.14, H * 0.03); g.stroke(); });
        g.fillStyle = "#1f5fbf"; rr(g, W * 0.6, H * 0.74, W * 0.33, H * 0.17, H * 0.04); g.fill();
        g.fillStyle = "#fff"; g.font = "800 " + H * 0.1 + "px " + SANS; g.textAlign = "center"; g.fillText("SEND", W * 0.765, H * 0.83);
      }, { emissive: 0.1 });
      root.remove(face.group); face.group.position.set(0, 0.08, 0.24); grp.add(face.group);
      var tag = plaque(ctx, "WEBSITE FORM", 1.7, 0.26, { tone: "dark", size: 40, track: 6, thick: 0.05 }); tag.position.set(0, -f.h / 2 + 0.2, 0.24); grp.add(tag);
      P("form", grp, [f.x, f.y, 0.25], "chassis", 5, 20);
      [[-0.88, 0.6], [0.88, 0.6], [-0.88, -0.6], [0.88, -0.6]].forEach(function (c, i) { screw("fs" + i, f.x + c[0], f.y + c[1], 0.5, "chassis", 6, 21 + i, 0.06); });
    })();

    /* ── the pipe: from the form down into the trough. Two lengths and a coupling: EMPTY takes them apart ── */
    (function () {
      var p = L.pipe, r = p.r;
      var len1 = 0.42, len2 = p.yTop - p.yLow - len1;
      var up = new THREE.CylinderGeometry(r, r, len1, 32, 1, true); up.translate(0, -len1 / 2, 0);
      var upper = new THREE.Group(); upper.add(mesh(up, mat.steel));
      var flange = mesh(new THREE.CylinderGeometry(r + 0.07, r + 0.07, 0.09, 32), mat.steelBrushed); flange.position.y = -len1 + 0.045; upper.add(flange);
      P("pipeUp", upper, [p.x, p.yTop, 0.62], "chassis", 4, 24);
      /* the lower length: its origin is its BOTTOM (the hinge on the trough), so a cut swings its top away */
      var lo = new THREE.CylinderGeometry(r, r, len2, 32, 1, true); lo.translate(0, len2 / 2, 0);
      var lower = new THREE.Group(); lower.add(mesh(lo, mat.steel));
      var fl2 = mesh(new THREE.CylinderGeometry(r + 0.07, r + 0.07, 0.09, 32), mat.steelBrushed); fl2.position.y = len2 - 0.045; lower.add(fl2);
      var mouth = mesh(new THREE.CylinderGeometry(r + 0.09, r + 0.05, 0.12, 32), mat.steelBrushed); mouth.position.y = 0.06; lower.add(mouth);
      var hinge = mesh(G.disc(THREE, 0.12, 0.62, 0.04, 0.02), mat.blue); hinge.rotation.y = 0; hinge.position.set(-r - 0.06, 0.08, 0); lower.add(hinge);
      P("pipeLow", lower, [p.x, p.yLow, 0.62], "chassis", 4, 25);
      /* the coupling ring around the joint */
      var cpl = new THREE.Group();
      var ring = mesh(new THREE.CylinderGeometry(r + 0.1, r + 0.1, 0.2, 32), mat.steelBrushed); cpl.add(ring);
      var band = mesh(new THREE.CylinderGeometry(r + 0.115, r + 0.115, 0.05, 32), mat.blue); cpl.add(band);
      P("coupling", cpl, [p.x, p.yTop - len1, 0.62], "chassis", 5, 26);
      M.pipeLen = { len1: len1, len2: len2 };
    })();

    /* ── the trough: an open channel the slips stand in, with a lamp at its head ───────────────────── */
    (function () {
      var t = L.trough, w = t.x1 - t.x0;
      var back = mesh(G.extrude(THREE, G.roundedRect(THREE, w, 0.22, 0.05, w / 2, 0), 0.5, 0.02, { curve: 6 }), mat.steelBrushed);
      P("trough", back, [t.x0, t.y, t.z], "chassis", 4, 27);
      var lip = mesh(G.extrude(THREE, G.roundedRect(THREE, w, 0.2, 0.04, w / 2, 0), 0.07, 0.015, { curve: 6 }), mat.steel);
      P("lip", lip, [t.x0, t.y + 0.02, t.z + 0.32], "chassis", 6, 28);
      [-6.1, -4.0, -1.9].forEach(function (x, i) { P("tb" + i, mesh(G.extrude(THREE, G.roundedRect(THREE, 0.22, 0.6, 0.05), 0.3, 0.02, { curve: 6 }), mat.steel), [x, t.y - 0.38, 0.3], "chassis", 3, 15); });
      M.lampT = K.lamp("lampT", t.x0 + 1.0, t.y - 0.62, 0.42, 0.11, "chassis", 6, 29);
      M.lampA = K.lamp("lampA", L.reader.x + 0.95, L.reader.y - 0.62, 1.12, 0.1, "chassis", 6, 29);
      M.lampP = K.lamp("lampP", L.press.x + 1.15, L.press.y + 0.55, 0.62, 0.1, "chassis", 6, 29);
    })();

    /* ── the three handwheels: how the form breaks ─────────────────────────────────────────────────── */
    (function () {
      var v = L.valve, labels = ["ERROR", "OLD DATA", "EMPTY"];
      v.xs.forEach(function (x, i) {
        var stem = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.1, v.y - L.trough.y - 0.1, 0.03, 0, (v.y - L.trough.y - 0.1) / 2), 0.1, 0.012, { curve: 4 }), mat.steel);
        P("vStem" + i, stem, [x, L.trough.y + 0.1, 0.42], "chassis", 3, 16);
        var wh = new THREE.Group();
        wh.add(mesh(G.wheel(THREE, { r: v.r, rim: 0.055, hub: 0.07, spokes: 4, thick: 0.08, bore: 0.03 }), mat.steelBrushed));
        var knob = mesh(G.lathe(THREE, [[0, 0], [0.05, 0], [0.06, 0.05], [0.06, 0.16], [0.04, 0.2], [0, 0.2]], 18), mat.black); knob.position.set(v.r - 0.05, 0, 0.04); wh.add(knob);
        var p = P("valve" + i, wh, [x, v.y, 0.55], "chassis", 6, 17 + i);
        p.isValve = true;
        P("vTag" + i, plaque(ctx, labels[i], 0.82, 0.24, { tone: "dark", size: 34, track: 4, thick: 0.045 }), [x, v.y + 0.55, 0.42], "chassis", 6, 18);
      });
    })();

    /* ── the AGENT: a gantry over the trough carrying the blue lens ────────────────────────────────── */
    (function () {
      var r = L.reader, grp = new THREE.Group();
      [-0.82, 0.82].forEach(function (dx) {
        var post = mesh(G.lathe(THREE, [[0, 0], [0.13, 0], [0.13, 0.06], [0.085, 0.1], [0.085, 1.2], [0.13, 1.24], [0.13, 1.3], [0, 1.3]], 24), mat.steel);
        post.position.set(dx, -1.15, 0.1); post.rotation.x = 0; grp.add(post);
      });
      var yoke = mesh(G.plate(THREE, 2.1, 1.5, 0.3, 0.14, [[0, 0, r.r + 0.06]], null, 0.03), mat.steelBrushed); yoke.position.set(0, 0, 0.98); grp.add(yoke);
      var bezel = mesh(G.disc(THREE, r.r + 0.2, 0.2, r.r, 0.04), mat.steel); bezel.position.set(0, 0, 1.08); grp.add(bezel);
      for (var i = 0; i < 6; i++) { var a = i * TAU / 6 + 0.26, sc = mesh(G.screw(THREE, 0.04, 0.04), mat.blue); sc.position.set(Math.cos(a) * (r.r + 0.11), Math.sin(a) * (r.r + 0.11), 1.17); grp.add(sc); }
      P("gantry", grp, [r.x, r.y, 0], "chassis", 5, 22);
      var core = new THREE.Group(), lensMat = mat.jewel.clone();
      var lens = mesh(new THREE.SphereGeometry(r.r, 48, 32), lensMat); lens.scale.z = 0.5;
      var iris = mesh(G.disc(THREE, r.r * 0.52, 0.03, r.r * 0.3, 0.008), mat.steel); iris.position.z = 0.2;
      var cart = mesh(G.disc(THREE, r.r * 0.99, 0.5, 0, 0.03), mat.plateDark); cart.position.z = -0.3;
      core.add(cart); core.add(lens); core.add(iris);
      var cp = P("core", core, [r.x, r.y, 1.1], "chassis", 6, 23);
      cp.lens = lensMat;
      var tag = plaque(ctx, "AGENT", 1.0, 0.28, { tone: "dark", ink: "#9fd0ff", size: 42, track: 10, thick: 0.05, glow: 0x3a7fd0, glowI: 0.5 });
      P("agentTag", tag, [r.x, r.y + 0.98, 1.0], "chassis", 6, 24);
      /* the scan bar across the slip under the lens */
      var scan = mesh(new THREE.BoxGeometry(0.035, L.slip.h + 0.1, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 4.2, 9.0), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      scan.castShadow = false; root.add(scan); M.scan = scan;
      scan.position.set(r.x, L.slip.y, L.slip.z + 0.03);
    })();

    /* ── IN: the box every read request falls into ─────────────────────────────────────────────────── */
    function bin(name, b, label, order) {
      var grp = new THREE.Group();
      var wall = function (w, h, x, y) { var m = mesh(G.extrude(THREE, G.roundedRect(THREE, w, h, 0.04), 0.7, 0.02, { curve: 6 }), mat.steelBrushed); m.position.set(x, y, 0.36); grp.add(m); };
      wall(0.1, b.h, -b.w / 2 + 0.05, 0); wall(0.1, b.h, b.w / 2 - 0.05, 0); wall(b.w, 0.1, 0, -b.h / 2 + 0.05);
      var tag = plaque(ctx, label, b.w - 0.2, 0.26, { tone: "dark", size: 36, track: 6, thick: 0.05 }); tag.position.set(0, -b.h / 2 - 0.22, 0.2); grp.add(tag);
      return P(name, grp, [b.x, b.y, 0.0], "chassis", 4, order);
    }
    bin("inbox", L.inbox, "IN · " + YDAY, 30);

    /* ── the JOB plate: what you wrote, engraved in gold ───────────────────────────────────────────── */
    M.JOB_PLAIN = [{ t: "Check yesterday's quote requests and write the report." }, { t: "If there were no new requests, say so." }];
    var jobP = plaque(ctx, M.JOB_PLAIN, L.job.w, L.job.h, { size: 30, weight: 800, glow: 0xffb020, glowI: 0 });
    P("job", jobP, [L.job.x, L.job.y, 0.3], "job", 5, 0);
    P("jobTag", plaque(ctx, "JOB", 0.62, 0.24, { size: 36, track: 8, thick: 0.05 }), [L.job.x - L.job.w / 2 + 0.36, L.job.y + 0.62, 0.32], "job", 6, 1);
    M.jobPlate = jobP;

    /* ── the clock: the run starts at 07:00 by itself ──────────────────────────────────────────────── */
    (function () {
      var c = L.clock, grp = new THREE.Group();
      grp.add(mesh(G.disc(THREE, c.r + 0.12, 0.16, 0, 0.03), mat.steelBrushed));
      var face = K.paper(c.r * 1.8, c.r * 1.8, 360, function (g, W, H) {
        g.fillStyle = "#101820"; g.fillRect(0, 0, W, H);
        g.strokeStyle = "#8fa8c0"; g.lineWidth = W * 0.012;
        for (var i = 0; i < 12; i++) { var a = i * TAU / 12; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * H * 0.4); g.lineTo(W / 2 + Math.cos(a) * W * 0.46, H / 2 + Math.sin(a) * H * 0.46); g.stroke(); }
        g.fillStyle = "#ffc75f"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 " + H * 0.15 + "px " + MONO; g.fillText("07:00", W / 2, H * 0.7);
      }, { emissive: 0.06, thick: 0.02 });
      root.remove(face.group); face.group.position.z = 0.09; grp.add(face.group);
      P("clock", grp, [c.x, c.y, 0.25], "chassis", 5, 19);
      var hr = mesh(G.link(THREE, c.r * 0.45, 0.07, 0.03, 0, 0.008), mat.steel), mn = mesh(G.link(THREE, c.r * 0.72, 0.05, 0.03, 0, 0.008), mat.gold);
      P("hourHand", hr, [c.x, c.y, 0.42], "chassis", 6, 20, [0, 0, Math.PI / 2 - (7 / 12) * TAU]);
      P("minHand", mn, [c.x, c.y, 0.45], "chassis", 6, 20, [0, 0, Math.PI / 2]);
    })();

    /* ── the history drawers: the earlier days, each a drawer with its date ────────────────────────── */
    M.drawers = [];
    (function () {
      var d = L.drawers;
      HISTORY.forEach(function (hd, i) {
        var x = d.x0 + d.w / 2 + i * (d.w + d.gap);
        var face = K.paper(d.w, d.h, 300, function (g, W, H) { drawDrawer(g, W, H, hd[0], hd[1], false); }, { emissive: 0.08, thick: 0.08, tint: 0xd8d8d8 });
        root.remove(face.group);
        var grp = new THREE.Group(); grp.add(face.group);
        var pull = mesh(G.link(THREE, 0.24, 0.07, 0.06, 0, 0.012), mat.gold); pull.position.set(-0.12, -d.h * 0.32, 0.07); grp.add(pull);
        var p = P("dr" + i, grp, [x, d.y, 0.22], "chassis", 5, 40 + i);
        M.drawers.push({ part: p, face: face, day: hd[0], n: hd[1] });
      });
      var t = plaque(ctx, "EARLIER DAYS", 1.7, 0.24, { tone: "dark", size: 34, track: 6, thick: 0.045 });
      P("drTag", t, [d.x0 + 0.85, d.y + d.h / 2 + 0.24, 0.24], "chassis", 6, 47);
    })();

    /* ── the PRESS: prints the morning report and pushes it out of the top slot ────────────────────── */
    (function () {
      var p = L.press, grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, p.w, p.h, 0.22, 0.6, null, [[0, p.h / 2 - 0.16, p.w - 0.3, 0.08, 0.03]], 0.04), mat.steelBrushed));
      /* two rollers seen end-on through a window in the press's face */
      [-0.62, 0.62].forEach(function (dx, i) {
        var rl = new THREE.Group();
        rl.add(mesh(G.disc(THREE, 0.34, 0.12, 0.07, 0.02), mat.steel));
        for (var k = 0; k < 6; k++) { var a = k * TAU / 6, b = mesh(G.disc(THREE, 0.05, 0.08, 0, 0.01), mat.blue); b.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.04); rl.add(b); }
        var rp = P("roller" + i, rl, [p.x + dx, p.y + 0.05, 0.36], "chassis", 6, 33);
        rp.isRoller = true;
      });
      var tag = plaque(ctx, "REPORT PRESS", 1.9, 0.26, { tone: "dark", size: 36, track: 6, thick: 0.05 }); tag.position.set(0, -p.h / 2 + 0.3, 0.32); grp.add(tag);
      P("press", grp, [p.x, p.y, 0.05], "chassis", 5, 32);
      [[-1.3, 0.85], [1.3, 0.85], [-1.3, -0.85], [1.3, -0.85]].forEach(function (c, i) { screw("prs" + i, p.x + c[0], p.y + c[1], 0.38, "chassis", 6, 34 + i, 0.07); });
    })();
    /* the rack: finished reports stand in it, newest in front */
    (function () {
      var r = L.rack, grp = new THREE.Group();
      var wall = function (w, h, x, y) { var m = mesh(G.extrude(THREE, G.roundedRect(THREE, w, h, 0.04), 0.5, 0.02, { curve: 6 }), mat.steelBrushed); m.position.set(x, y, 0.26); grp.add(m); };
      wall(0.1, r.h, -r.w / 2 + 0.05, 0); wall(0.1, r.h, r.w / 2 - 0.05, 0); wall(r.w, 0.12, 0, -r.h / 2 + 0.06);
      var tag = plaque(ctx, "REPORTS", 1.4, 0.26, { tone: "dark", size: 36, track: 6, thick: 0.05 }); tag.position.set(0, -r.h / 2 - 0.22, 0.2); grp.add(tag);
      P("rack", grp, [r.x, r.y, 0.0], "chassis", 4, 38);
    })();

    /* ── the gold modules you write in s9b: PROOF and ALARM, each on an empty mount until then ──────── */
    K.mount("mProof", L.proof.x, L.proof.y, L.proof.w + 0.1, L.proof.h + 0.1, "chassis", 2);
    K.mount("mAlarm", L.flag.x + 0.05, L.flag.y + 0.45, 0.62, 0.9, "chassis", 2);
    (function () {
      var pf = L.proof, grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, pf.w, pf.h, 0.16, 0.18, null, [[0, 0.05, pf.w - 0.32, pf.h - 0.5, 0.08]], 0.03), mat.goldBrushed));
      var rd = K.paper(pf.w - 0.36, pf.h - 0.54, 340, function (g, W, H) { drawProof(g, W, H, "--", "--:--"); }, { emissive: 0.5, tint: 0xffffff, thick: 0.02 });
      root.remove(rd.group); rd.group.position.set(0, 0.05, 0.1); grp.add(rd.group);
      var tag = plaque(ctx, "PROOF", 0.9, 0.24, { size: 36, track: 8, thick: 0.05 }); tag.position.set(0, -pf.h / 2 + 0.16, 0.12); grp.add(tag);
      P("proof", grp, [pf.x, pf.y, 0.25], "proof", 5, 0);
      [[-0.95, 0.52], [0.95, 0.52]].forEach(function (c, i) { screw("pfs" + i, pf.x + c[0], pf.y + c[1], 0.36, "proof", 6, 1 + i, 0.06); });
      M.proofFace = rd;
    })();
    (function () {
      var f = L.flag;
      var base = mesh(G.plate(THREE, 0.55, 0.85, 0.12, 0.12, [[0, -0.2, 0.07]], null, 0.025), mat.goldBrushed);
      P("alarmBase", base, [f.x + 0.05, f.y + 0.45, 0.2], "alarm", 5, 0);
      var mast = new THREE.Group();
      mast.add(mesh(G.extrude(THREE, G.roundedRect(THREE, 0.08, 2.0, 0.03, 0, 1.0), 0.08, 0.015, { curve: 4 }), mat.gold));
      var flag = K.paper(1.55, 0.62, 300, function (g, W, H) {
        g.fillStyle = "#f0a92e"; g.fillRect(0, 0, W, H);
        g.fillStyle = "#241503"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "CHECK THE SOURCE", H * 0.34, W * 0.9, 900); g.fillText("CHECK THE SOURCE", W / 2, H * 0.53);
      }, { emissive: 0.3, tint: 0xffffff, thick: 0.03 });
      root.remove(flag.group); flag.group.position.set(0.8, 1.66, 0.03); mast.add(flag.group);
      M.flagCloth = flag.group;
      var fp = P("flag", mast, [f.x, f.y + 0.25, 0.42], "alarm", 6, 1);
      fp.isFlag = true;
      P("alarmTag", plaque(ctx, "ALARM", 0.86, 0.24, { size: 36, track: 8, thick: 0.05 }), [f.x + 0.05, f.y - 0.12, 0.34], "alarm", 6, 2);
    })();

    /* ── away poses ───────────────────────────────────────────────────────────────────────────────── */
    K.awayPoses({ job: [-8, -5, 5], proof: [7, 7, 6], alarm: [6, 6, 6], chassis: [0, 0, 0] });

    /* ── state ────────────────────────────────────────────────────────────────────────────────────── */
    /** every part home; the gold modules parked unless `withModules`. Call FIRST in a pose(). */
    M.home = function (withModules) {
      for (var i = 0; i < K.parts.length; i++) {
        var p = K.parts[i], mod = p.group === "proof" || p.group === "alarm";
        p.place(mod && !withModules ? 0 : 1, "off");
      }
    };
    M.assemble = K.assemble; M.set = K.set;
    /** a handwheel: i 0 ERROR · 1 OLD DATA · 2 EMPTY, a 0 … 1 (a full turn and a quarter) */
    M.valve = function (i, a) { by["valve" + i].obj.rotation.z += -a * TAU * 1.25; };
    /** EMPTY: the coupling comes off and the lower pipe swings out — a visible gap, nothing else changes */
    M.cut = function (k) {
      if (k <= 0) return;
      /* the coupling drops away and the lower length sags out of line: a gap you can read at a glance
         between the upper flange and the lower one (~0.4 units), with nothing coming through it */
      var c = by.coupling.obj, lo = by.pipeLow.obj;
      /* the coupling drops into the trough and lies there; the lower length swings out on its hinge */
      c.position.x += 0.55 * E.out3(k); c.position.y += -(by.coupling.home.p[1] - (L.trough.y + 0.24)) * E.in2(k); c.position.z += 0.25 * k; c.rotation.z += 1.57 * E.out3(k);
      lo.rotation.z += -0.62 * E.outBack(k);
    };
    M.lamps = function (t, a, p, k) { K.setLamp(M.lampT, t, k); K.setLamp(M.lampA, a, k); K.setLamp(M.lampP, p, k); };
    /** the agent's lens glow (1 idle) and the scan bar across the slip under it */
    M.core = function (glow, u, on) {
      by.core.lens.emissiveIntensity = 1.6 * glow;
      var s = M.scan; s.material.opacity = on || 0; s.visible = (on || 0) > 0.01;
      s.position.x = L.reader.x + mix(-L.slip.w / 2, L.slip.w / 2, u || 0);
    };
    M.press = function (th) { by.roller0.obj.rotation.z += th; by.roller1.obj.rotation.z += -th; };
    /** the clock: m minutes past 07:00 (a little before the run, the minute hand sweeps up to 12) */
    M.clock = function (m) { by.minHand.obj.rotation.z += -(m / 60) * TAU; by.hourHand.obj.rotation.z += -(m / 720) * TAU; };
    /** the ALARM: p 0 mast down (telescoped into its base, flag furled) … 1 up, CHECK THE SOURCE flying.
     *  It never lies across the press or the rack: nothing else is in the column it rises through. */
    M.flag = function (p) {
      var o = by.flag.obj, k = clamp(p, 0, 1);
      o.scale.y = o.scale.y * Math.max(mix(0.06, 1, E.out3(k)), 1e-3);
      var c = span(k, 0.55, 1);
      M.flagCloth.scale.set(Math.max(E.outBack(c), 1e-3), 1, 1);
      M.flagCloth.position.x = 0.8 * Math.max(E.outBack(c), 1e-3);
      M.flagCloth.visible = c > 0.01;
    };
    /** the job plate: line 2 glow (s6), struck through (s9: 0..1), or the proof job's text */
    var jobKey = "";
    M.job = function (mode, s) {
      var key = mode + "|" + (s == null ? "" : Math.round(s * 40));
      if (key === jobKey) return; jobKey = key;
      var lines = mode === "strike" ? [M.JOB_PLAIN[0], { t: M.JOB_PLAIN[1].t, c: "#5a3a0a", strike: s }]
        : mode === "gone" ? [M.JOB_PLAIN[0], { t: " " }]
        : M.JOB_PLAIN;
      jobP.userData.redraw(lines);
    };
    M.jobGlow = function (k) { jobP.userData.mat.emissiveIntensity = 0.55 * k; };
    /** drawers: open[i] 0..1 (slides toward the lens and shows its count); lit = the one a match is found in */
    M.drawerState = function (open, lit) {
      for (var i = 0; i < M.drawers.length; i++) {
        var d = M.drawers[i], k = open ? (open[i] || 0) : 0;
        d.part.obj.position.z += 0.42 * E.out3(k);
        d.part.obj.position.y += -0.06 * k;
        var on = k > 0.55;
        d.face.show(on + "|" + (lit === i), function (g, W, H) { drawDrawer(g, W, H, d.day, d.n, on); if (lit === i) { g.strokeStyle = "#ff5c5c"; g.lineWidth = W * 0.08; rr(g, W * 0.04, H * 0.03, W * 0.92, H * 0.94, W * 0.08); g.stroke(); } });
      }
    };
    M.proofShow = function (count, newest, col) { M.proofFace.show(count + "|" + newest + "|" + col, function (g, W, H) { drawProof(g, W, H, count, newest, col); }); };

    /* ── slips: a pool of paper slips, posed by flow() ─────────────────────────────────────────────── */
    var pool = [];
    function slip(i) {
      if (pool[i]) return pool[i];
      var s = K.paper(L.slip.w, L.slip.h, 330, function (g, W, H) { drawSlip(g, W, H, REQUESTS[i % 7], "", YDAY); });
      s.key = ""; pool[i] = s; return s;
    }
    function face(s, kind, idx) {
      var key = kind + idx;
      if (s.key === key) return; s.key = key;
      s.pr.redraw(function (g, W, H) {
        if (kind === "err") drawError(g, W, H);
        else if (kind === "old") drawSlip(g, W, H, STALE[idx % 6], "old", STALE_DAY);
        else drawSlip(g, W, H, REQUESTS[idx % 7], "", YDAY);
      });
    }
    /** the IN box: where read slip j comes to rest */
    function inSlot(j) { var b = L.inbox; return [b.x + ((j % 3) - 1) * 0.16, b.y - b.h / 2 + 0.48 + j * 0.075, 0.22 + j * 0.03, (((j * 37) % 11) - 5) * 0.03]; }
    /**
     * A run of slips through the trough. Each item: { t0, kind: "new" | "old" | "err", idx }.
     * Path: drop out of the pipe mouth onto the trough → slide right to the lens → read → slide to the end →
     * fall into IN (an "err" plate stops under the lens and stays there, red).
     * @returns { update(t) → { scanU, scanOn, glow, inCount, reading } }   (call after M.home())
     */
    M.flow = function (list, o) {
      o = o || {};
      var drop = o.drop == null ? 0.35 : o.drop, slide = o.slide == null ? 0.9 : o.slide, read = o.read == null ? 0.42 : o.read, fall = o.fall == null ? 0.5 : o.fall;
      var startN = o.base || 0;
      var items = list.map(function (it, k) { var s = slip(startN + k); return { it: it, s: s, j: (o.inFrom || 0) + k, a1: it.t0 + drop, a2: it.t0 + drop + slide, a3: it.t0 + drop + slide + read, a4: it.t0 + drop + slide + read + 0.32 }; });
      var px = L.pipe.x, mouthY = L.pipe.yLow - 0.1, rx = L.reader.x, ex = L.trough.x1 - 0.2;
      return {
        items: items,
        update: function (t) {
          var st = { scanU: 0, scanOn: 0, glow: 1, inCount: o.inFrom || 0, reading: -1 };
          for (var k = 0; k < items.length; k++) {
            var c = items[k], it = c.it, s = c.s, g = s.group;
            if (t < it.t0) { s.hide(); continue; }
            face(s, it.kind || "new", it.idx == null ? k : it.idx);
            g.visible = true; g.scale.setScalar(1); g.rotation.set(0, 0, 0);
            if (t < c.a1) { var u0 = E.in2(span(t, it.t0, c.a1)); g.position.set(px + 0.35 * u0, mix(mouthY + 0.25, L.slip.y, u0), L.slip.z); g.rotation.z = (1 - u0) * 0.35; continue; }
            if (t < c.a2) { g.position.set(mix(px + 0.35, rx, E.inOut(span(t, c.a1, c.a2))), L.slip.y, L.slip.z); continue; }
            if (t < c.a3) {
              var u = span(t, c.a2, c.a3 - 0.06);
              st.scanU = u; st.scanOn = Math.min(span(t, c.a2, c.a2 + 0.06), 1 - span(t, c.a3 - 0.1, c.a3 - 0.02)); st.glow = it.kind === "err" ? 0.6 : 1.9; st.reading = k;
              g.position.set(rx, L.slip.y, L.slip.z); continue;
            }
            if (it.kind === "err") { g.position.set(rx, L.slip.y, L.slip.z); continue; }   // the error plate jams under the lens
            if (t < c.a4) { g.position.set(mix(rx, ex, E.inOut(span(t, c.a3, c.a4))), L.slip.y, L.slip.z); continue; }
            var b = inSlot(c.j), q = span(t, c.a4, c.a4 + fall);
            g.position.set(mix(ex, b[0], E.out2(q)), mix(L.slip.y, b[1], E.in2(q)), mix(L.slip.z, b[2], q));
            g.rotation.z = mix(0, b[3], q) + Math.sin(q * Math.PI) * -0.45;
            if (q >= 1) st.inCount = Math.max(st.inCount, c.j + 1);
          }
          return st;
        },
      };
    };
    /** slips already lying in IN (a finished run) */
    M.inPile = function (n, base) {
      for (var k = 0; k < n; k++) { var s = slip((base || 20) + k); face(s, "new", k); var b = inSlot(k); s.at(b[0], b[1], b[2], b[3], 1); }
      return n;
    };
    M.hideSlips = function () { for (var i = 0; i < pool.length; i++) if (pool[i]) pool[i].hide(); };

    /* ── report sheets: printed by the press, racked ───────────────────────────────────────────────── */
    var sheets = [];
    /* clipping planes live in WORLD space, so the press's lip is placed through the machine's own transform
       (a scene may move and scale M.root — sf-both, sf-close) */
    function lipPlane() { return new THREE.Plane(new THREE.Vector3(0, 1, 0), -(root.position.y + L.slotY * root.scale.y)); }
    function sheet(i) {
      if (sheets[i]) return sheets[i];
      var s = K.paper(L.sheet.w, L.sheet.h, 300, function (g, W, H) { drawSheet(g, W, H, "blank"); }, { emissive: 0.1 });
      s.key = "";
      /* it comes out of the slot: clipped below the press's lip so nothing shows inside the body */
      s.group.traverse(function (m) { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = [lipPlane()]; } });
      sheets[i] = s; return s;
    }
    function sheetFace(s, state, opt) {
      var key = state + "|" + JSON.stringify(opt || {});
      if (s.key === key) return; s.key = key;
      s.pr.redraw(function (g, W, H) { drawSheet(g, W, H, state, opt); });
    }
    function unclip(s, on) { s.group.traverse(function (m) { if (m.isMesh) m.material.clippingPlanes = on ? [lipPlane()] : []; }); }
    /** where rack slot j holds a sheet (scaled 0.78, each newer one a little lower and to the front) */
    function rackSlot(j) { var r = L.rack, s = 0.78; return [r.x - 0.1 + (j % 2) * 0.12, r.y - r.h / 2 + 0.16 + (L.sheet.h * s) / 2 + Math.min(j, 9) * 0.035, 0.32 + j * 0.035, ((j * 29) % 7 - 3) * 0.012, s]; }
    /**
     * Print a report: up out of the slot (p 0..1 over `out`), hold, then into the rack.
     * spec: { i (pool index), state, opt, t0, out, hold, rack, slot }
     * @returns { update(t) → { printing (0..1 roller speed), racked } }
     */
    M.print = function (spec) {
      var s = sheet(spec.i), out = spec.out == null ? 1.1 : spec.out, hold = spec.hold == null ? 1.4 : spec.hold, mv = spec.rack == null ? 0.7 : spec.rack;
      var t1 = spec.t0 + out, t2 = t1 + hold, t3 = t2 + mv;
      var cy = L.slotY + L.sheet.h / 2 + 0.02;
      return {
        sheet: s,
        update: function (t) {
          if (t < spec.t0) { s.hide(); return { printing: 0, racked: false }; }
          sheetFace(s, spec.state, spec.opt);
          s.group.visible = true;
          if (t < t1 || spec.hold === Infinity) {
            var p = E.inOut(span(t, spec.t0, t1));
            unclip(s, p < 0.999);
            s.at(L.press.x, L.slotY - L.sheet.h / 2 + (cy - (L.slotY - L.sheet.h / 2)) * p, L.sheet.z - 0.08 * (1 - p), 0, 1);
            return { printing: t < t1 ? 1 : 0, racked: false };
          }
          unclip(s, false);
          if (t < t2) { s.at(L.press.x, cy, L.sheet.z, 0, 1); return { printing: 0, racked: false }; }
          /* on its way to the rack a sheet lifts toward the lens, so a newer one emerging behind it never shows
             through it (MOTION_SPEC §13) — it passes in FRONT, then settles into its slot */
          var b = rackSlot(spec.slot || 0), q = E.inOut(span(t, t2, t3));
          s.at(mix(L.press.x, b[0], q), mix(cy, b[1], q) + Math.sin(q * Math.PI) * 0.5, mix(L.sheet.z, b[2], q) + Math.sin(q * Math.PI) * 0.55, mix(0, b[3], q), mix(1, b[4], q));
          return { printing: 0, racked: q >= 1 };
        },
      };
    };
    /** n reports already standing in the rack (earlier runs): state per slot */
    M.rackPile = function (n, state, base) {
      for (var j = 0; j < n; j++) { var s = sheet((base || 30) + j); sheetFace(s, state); unclip(s, false); var b = rackSlot(j); s.at(b[0], b[1], b[2], b[3], b[4]); }
    };
    M.hideSheets = function () { for (var i = 0; i < sheets.length; i++) if (sheets[i]) sheets[i].hide(); };

    return M;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * THE WATCHER — the dead man's handle for software (set 4)
   * A dial whose needle runs from FULL down to the DEADLINE. A heartbeat token dropping through the chute
   * re-arms it (needle back to full). If the needle reaches the deadline, the pawl lets go of the hammer and
   * the bell rings. Built around its own origin; a scene places it with M.root.
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var WL = { plate: { w: 4.3, h: 5.6 }, dial: { x: 0, y: -0.35, r: 1.75 }, chute: { x: 0, y0: 3.0, y1: 1.72 }, bell: { x: 1.42, y: 2.05 }, hammer: { x: 0.62, y: 1.05, len: 1.05, head: 0.15, rest: -0.35, strike: 1.29 }, a0: Math.PI * 1.18, a1: -Math.PI * 0.18 };
  function drawDial(g, W, H, o) {
    var cx = W / 2, cy = H / 2, R = W * 0.46;
    g.fillStyle = "#0f151d"; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, TAU); g.fill();
    var a0 = -WL.a0, a1 = -WL.a1;     // canvas y runs down: flip the angles
    /* the arc: blue while there is time, red in the last fifth */
    var split = a0 + (a1 - a0) * 0.8;
    g.lineWidth = R * 0.09; g.lineCap = "butt";
    g.strokeStyle = "#2f6fd0"; g.beginPath(); g.arc(cx, cy, R * 0.82, a0, split, false); g.stroke();
    g.strokeStyle = "#d3202a"; g.beginPath(); g.arc(cx, cy, R * 0.82, split, a1, false); g.stroke();
    g.strokeStyle = "#9fb4c9"; g.lineWidth = R * 0.018;
    for (var i = 0; i <= 15; i++) { var a = a0 + (a1 - a0) * (i / 15), r1 = R * (i % 5 ? 0.66 : 0.6); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72); g.stroke(); }
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#c9d7e6"; fit(g, o.start || "07:00", R * 0.15, R * 0.6, 700, MONO);
    g.fillText(o.start || "07:00", cx + Math.cos(a0) * R * 0.5, cy + Math.sin(a0) * R * 0.5 - R * 0.06);
    g.fillStyle = "#ff8585"; fit(g, o.end || "07:15", R * 0.15, R * 0.6, 800, MONO);
    g.fillText(o.end || "07:15", cx + Math.cos(a1) * R * 0.5, cy + Math.sin(a1) * R * 0.5 - R * 0.06);
    g.fillStyle = "#8fa8c0"; fit(g, "WAITING FOR", R * 0.1, R * 1.0, 800); g.fillText("WAITING FOR", cx, cy + R * 0.38);
    g.fillStyle = "#ffc75f"; fit(g, o.job || "MORNING REPORT", R * 0.15, R * 1.3, 800); g.fillText(o.job || "MORNING REPORT", cx, cy + R * 0.56);
    g.fillStyle = "#8fa8c0"; fit(g, o.sub || "proof by 07:15", R * 0.1, R * 1.2, 700); g.fillText(o.sub || "proof by 07:15", cx, cy + R * 0.74);
  }
  function watcher(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat;
    var root = new THREE.Group(); ctx.scene.add(root);
    var K = kit(ctx, root, o.seed || 41), P = K.P, mesh = K.mesh, by = K.by;
    var M = { root: root, K: K, L: WL, by: by };
    var pl = WL.plate;
    P("wPlate", mesh(G.plate(THREE, pl.w, pl.h, 0.4, 0.2, [[-1.8, 2.5, 0.08], [1.8, 2.5, 0.08], [-1.8, -2.5, 0.08], [1.8, -2.5, 0.08]], null, 0.04), mat.plate), [0, 0, 0], "w", 1, 0);
    [[-1.8, 2.5], [1.8, 2.5], [-1.8, -2.5], [1.8, -2.5]].forEach(function (c, i) { K.screw("wS" + i, c[0], c[1], 0.12, "w", 6, 20 + i, 0.09); });
    /* the dial: a gold bezel, a printed face, the needle */
    var d = WL.dial;
    P("bezel", mesh(G.disc(THREE, d.r + 0.16, 0.22, d.r - 0.02, 0.04), mat.gold), [d.x, d.y, 0.22], "w", 5, 2);
    var face = K.paper(d.r * 2, d.r * 2, 260, function (g, W, H) { drawDial(g, W, H, o); }, { emissive: 0.2, thick: 0.02, tint: 0xe6e6e6 });
    root.remove(face.group);
    var fg = new THREE.Group(); fg.add(face.group);
    P("face", fg, [d.x, d.y, 0.16], "w", 3, 1);
    M.face = face;
    var nd = new THREE.Group();
    var arm = mesh(G.link(THREE, d.r * 0.82, 0.09, 0.05, 0, 0.012), mat.steel); nd.add(arm);
    var cw = mesh(G.disc(THREE, 0.16, 0.08, 0, 0.02), mat.gold); nd.add(cw);
    var tip = mesh(new THREE.ConeGeometry(0.07, 0.22, 16), mat.steel); tip.rotation.z = -Math.PI / 2; tip.position.x = d.r * 0.82 + 0.06; nd.add(tip);
    var np = P("needle", nd, [d.x, d.y, 0.32], "w", 6, 3, [0, 0, WL.a0]);
    np.isNeedle = true;
    /* the chute and the catch cup above the dial. The chute is a HALF pipe, open to the lens: the heartbeat
       token is the whole point of this instrument, so it falls in plain sight (a closed tube hid it — and a
       glass one would put a half-visible layer over it). Two steel rails mark the open edges. */
    var c = WL.chute, len = c.y0 - c.y1;
    var tube = new THREE.CylinderGeometry(0.34, 0.34, len, 32, 1, true, Math.PI / 2, Math.PI); tube.translate(0, len / 2, 0);
    var inner = mat.steelBrushed.clone(); inner.side = THREE.DoubleSide;
    var tg = new THREE.Group(); tg.add(mesh(tube, inner));
    [-0.34, 0.34].forEach(function (x) { var r = mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 12), mat.steel); r.position.set(x, len / 2, 0); tg.add(r); });
    P("chute", tg, [c.x, c.y1, 0.45], "w", 4, 4);
    var cup = mesh(G.lathe(THREE, [[0, 0], [0.42, 0], [0.46, 0.06], [0.46, 0.2], [0.4, 0.2], [0.38, 0.06], [0, 0.06]], 32), mat.goldBrushed); cup.rotation.x = 0;
    var cupG = new THREE.Group(); var cupM = mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.18, 32), mat.goldBrushed); cupG.add(cupM);
    P("cup", cupG, [c.x, c.y1 - 0.1, 0.45], "w", 5, 5);
    /* the token: a gold disc with a tick — the heartbeat */
    var tok = K.paper(0.5, 0.5, 300, function (g, W, H) {
      g.fillStyle = "#f0a92e"; g.beginPath(); g.arc(W / 2, H / 2, W / 2, 0, TAU); g.fill();
      g.strokeStyle = "#241503"; g.lineWidth = W * 0.09; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(W * 0.28, H * 0.52); g.lineTo(W * 0.45, H * 0.68); g.lineTo(W * 0.73, H * 0.34); g.stroke();
    }, { emissive: 0.35, tint: 0xffffff, thick: 0.08, round: true });
    M.token = tok;
    /* the bell, the hammer on its pivot, the pawl that holds it */
    var b = WL.bell;
    /* a convex dome in polished gold mirrors the dark wall and reads as a black helmet: give it a diffuse share */
    var bellMat = mat.goldBrushed.clone(); bellMat.metalness = 0.55; bellMat.roughness = 0.38;
    var bell = mesh(G.lathe(THREE, [[0, 0.42], [0.16, 0.41], [0.36, 0.3], [0.48, 0.1], [0.55, 0], [0.5, 0], [0.43, 0.07], [0.32, 0.24], [0.13, 0.34], [0, 0.35]], 48), bellMat);
    var bg = new THREE.Group(); bg.add(bell); bell.rotation.x = -Math.PI / 2;   // axis vertical, mouth down: a bell silhouette, not a disc
    var bp = P("bell", bg, [b.x, b.y, 0.36], "w", 5, 6);
    bp.isBell = true;
    var h = WL.hammer, hm = new THREE.Group();
    hm.add(mesh(G.link(THREE, h.len, 0.1, 0.07, 0.03, 0.012), mat.steel));
    var head = mesh(new THREE.SphereGeometry(h.head, 24, 16), mat.steel); head.position.set(h.len, 0, 0); hm.add(head);
    var hp = P("hammer", hm, [h.x, h.y, 0.62], "w", 6, 7, [0, 0, h.rest]);
    hp.isHammer = true;
    var pawl = mesh(G.outline(THREE, [[-0.06, 0], [0.06, 0], [0.09, 0.45], [0.22, 0.6], [0.0, 0.62], [-0.09, 0.45]], 0.08, [[0, 0.04, 0.035]], 0.012), mat.gold);
    var pp = P("pawl", pawl, [h.x + 0.62, h.y - 0.62, 0.66], "w", 6, 8);
    pp.isPawl = true;
    M.lamp = K.lamp("wLamp", -1.45, 1.95, 0.32, 0.16, "w", 6, 9);
    var tag = plaque(ctx, o.label || "WATCHER", 2.4, 0.36, { tone: "dark", size: 44, track: 8, thick: 0.05 });
    P("wTag", tag, [0, -pl.h / 2 + 0.5, 0.2], "w", 6, 10);
    M.tag = tag;
    K.awayPoses({ w: [6, 4, 6] });
    M.home = function () { K.set(null, true); };
    M.assemble = K.assemble;
    /** f: 1 full (just re-armed) … 0 at the deadline */
    M.needle = function (f) { by.needle.obj.rotation.z += -(1 - clamp(f, 0, 1)) * (WL.a0 - WL.a1); };
    /** the hammer: p 0 held by the pawl … 1 on the bell rim (WL.hammer.strike: the head lands under the rim — pinned by hf-watch.test); the pawl tips away as it lets go */
    M.strike = function (p) { by.hammer.obj.rotation.z += WL.hammer.strike * E.in2(clamp(p, 0, 1)); by.pawl.obj.rotation.z += -0.7 * clamp(p * 3, 0, 1); };
    /** the bell rings: a (0..1) amplitude of a decaying shake */
    M.ring = function (a, t) { var o2 = by.bell.obj; o2.rotation.z += Math.sin(t * 52) * 0.06 * a; o2.scale.multiplyScalar(1 + 0.03 * a * Math.sin(t * 70)); };
    M.lampState = function (s, k) { K.setLamp(M.lamp, s, k); };
    /** change what the dial says (e.g. a Sunday normal engraved on it); redraws only on change */
    var dialKey = "";
    M.dialText = function (o2) { var oo = Object.assign({}, o, o2 || {}), key = JSON.stringify(oo); if (key === dialKey) return; dialKey = key; face.show(key, function (g, W2, H2) { drawDial(g, W2, H2, oo); }); };
    /** a heartbeat token: k 0 above the frame … 1 seated in the cup (hidden when k<=0 or after `gone`) */
    M.tokenAt = function (k, fade) {
      if (k <= 0 || fade >= 1) { tok.hide(); return; }
      /* the token lives in the watcher's own group: local coordinates, so a scene may move/scale M.root */
      var c2 = WL.chute, yTop = c2.y0 + 0.75, yEnd = c2.y1 + 0.16;   // starts just above a chute close-up: the whole fall is on screen
      tok.at(c2.x, mix(yTop, yEnd, E.in2(clamp(k, 0, 1))), 0.62, 0, 1 - (fade || 0));
    };
    /**
     * A schedule of runs for the watcher: each { t (when proof arrives, or null = it never comes), period }.
     * Pure: returns { f (needle), strike, ring, alarm, tok: [k, fade] } for time t.
     */
    M.run = function (events, opt) {
      opt = opt || {};
      var window2 = opt.window || 4.0;     // seconds the needle takes from full to the deadline
      return function (t) {
        var lastArm = opt.t0 == null ? 0 : opt.t0, tk = 0, fade = 0;
        for (var i = 0; i < events.length; i++) {
          var e = events[i];
          if (e == null || e.t == null) continue;
          if (t >= e.t) { lastArm = e.t; tk = 1; fade = span(t, e.t + 0.25, e.t + 0.6); }
          else if (t >= e.t - 0.45) { tk = span(t, e.t - 0.45, e.t); fade = 0; }
        }
        var f = 1 - span(t, lastArm + 0.15, lastArm + 0.15 + window2);
        var due = lastArm + 0.15 + window2;
        var strike = t >= due ? E.out3(span(t, due, due + 0.18)) - 0.25 * span(t, due + 0.18, due + 0.5) : 0;
        var ring = t >= due + 0.16 ? Math.exp(-(t - due - 0.16) * 0.9) : 0;
        return { f: f, strike: Math.max(strike, 0), ring: ring, alarm: t >= due, tok: [tk, fade], due: due };
      };
    };
    return M;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * THE VAULT — GitLab, 31 January 2017 (set 2). Cold light, steel.
   *   two database servers (db1 PRIMARY · db2 SECONDARY) with data meters; the NIGHTLY BACKUP drawer
   *   (pg_dump → S3) with its green lamp; the backup job's CRON box; the MAIL SERVER that rejects its emails.
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var VL = { cab: { w: 8.6, h: 6.4 }, db: [{ x: -2.1, y: 1.55, name: "db1", role: "PRIMARY" }, { x: 2.1, y: 1.55, name: "db2", role: "SECONDARY" }], drawer: { x: 0, y: -1.45, w: 7.2, h: 1.9 }, cron: { x: -7.4, y: -1.35 }, gate: { x: 7.5, y: -1.35 } };
  function vault(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat;
    var root = new THREE.Group(); ctx.scene.add(root);
    var K = kit(ctx, root, o.seed || 17), P = K.P, mesh = K.mesh, by = K.by;
    var M = { root: root, K: K, L: VL, by: by };
    var c = VL.cab;
    P("cab", mesh(G.plate(THREE, c.w, c.h, 0.35, 0.3, null, [[VL.drawer.x, VL.drawer.y, VL.drawer.w + 0.2, VL.drawer.h + 0.2, 0.14]], 0.05), mat.steelBrushed), [0, 0, 0], "v", 1, 0);
    P("cabBack", mesh(G.plate(THREE, VL.drawer.w + 0.3, VL.drawer.h + 0.3, 0.14, 0.1, null, null, 0.02), mat.plateDark), [VL.drawer.x, VL.drawer.y, -0.18], "v", 0, 0);
    [[-4.05, 2.95], [4.05, 2.95], [-4.05, -2.95], [4.05, -2.95]].forEach(function (q, i) { K.screw("vS" + i, q[0], q[1], 0.18, "v", 6, 30 + i, 0.09); });
    /* the two servers: a face with a data meter that drains when wiped */
    M.dbFaces = [];
    VL.db.forEach(function (d, i) {
      var grp = new THREE.Group();
      grp.add(mesh(G.plate(THREE, 3.6, 2.5, 0.2, 0.22, null, [[0, -0.15, 3.1, 1.5, 0.1]], 0.03), mat.steel));
      var pf = K.paper(3.1, 1.5, 260, function (g, W, H) { drawDb(g, W, H, d, 1); }, { emissive: 0.35, tint: 0xffffff, thick: 0.02 });
      root.remove(pf.group); pf.group.position.set(0, -0.15, 0.06); grp.add(pf.group);
      var tg = plaque(ctx, d.name + " · " + d.role, 2.6, 0.32, { tone: "dark", size: 40, track: 6, thick: 0.05 }); tg.position.set(0, 0.92, 0.14); grp.add(tg);
      P("db" + i, grp, [d.x, d.y, 0.2], "v", 4, 2 + i);
      M.dbFaces.push({ face: pf, d: d });
    });
    /* the backup bay: a front flap hinged at its BOTTOM edge (it folds down toward the lens), and behind it the
       bay you can then see straight into — face-on — holding nothing: the S3 bucket was empty */
    var dr = VL.drawer, dg = new THREE.Group();
    var front = mesh(G.plate(THREE, dr.w, dr.h, 0.16, 0.18, null, null, 0.03), mat.steel); front.position.y = dr.h / 2; dg.add(front);
    var lbl = plaque(ctx, ["NIGHTLY BACKUP", { t: "pg_dump → S3 · every 24 hours", w: 600 }], 4.4, 0.95, { tone: "dark", size: 44, thick: 0.05 }); lbl.position.set(-0.7, dr.h / 2 + 0.05, 0.12); dg.add(lbl);
    var pull = mesh(G.link(THREE, 1.4, 0.18, 0.12, 0, 0.02), mat.gold); pull.position.set(1.85, dr.h / 2 + 0.55, 0.14); dg.add(pull);
    P("drawer", dg, [dr.x, dr.y - dr.h / 2, 0.24], "v", 5, 6);
    var bay = K.paper(dr.w - 0.3, dr.h - 0.3, 220, function (g, W, H) {
      g.fillStyle = "#070b10"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(150,175,205,0.35)"; g.setLineDash([W * 0.012, W * 0.012]); g.lineWidth = H * 0.02; rr(g, W * 0.04, H * 0.1, W * 0.92, H * 0.8, H * 0.05); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#8fa8c0"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "S3 BUCKET", H * 0.16, W * 0.6, 800); g.fillText("S3 BUCKET", W / 2, H * 0.38);
      g.fillStyle = "#c9d7e6"; fit(g, "empty", H * 0.22, W * 0.5, 800); g.fillText("empty", W / 2, H * 0.64);
    }, { emissive: 0.25, thick: 0.02, tint: 0xffffff });
    root.remove(bay.group);
    var bg2 = new THREE.Group(); bg2.add(bay.group);
    P("bay", bg2, [dr.x, dr.y, -0.08], "v", 2, 5);
    M.backupLamp = K.lamp("bLamp", dr.x + 3.15, dr.y + 0.55, 0.42, 0.13, "v", 6, 7);
    /* the CRON box, left: the backup job that sends the failure emails */
    var cr = VL.cron, cg = new THREE.Group();
    cg.add(mesh(G.plate(THREE, 2.2, 2.0, 0.18, 0.5, null, [[0, 0.45, 1.6, 0.1, 0.03]], 0.04), mat.steelBrushed));
    var ct = plaque(ctx, ["CRON", { t: "backup job", w: 600 }], 1.6, 0.7, { tone: "dark", size: 40, thick: 0.05 }); ct.position.set(0, -0.2, 0.28); cg.add(ct);
    P("cron", cg, [cr.x, cr.y, 0.1], "v", 4, 8);
    M.cronLamp = K.lamp("cLamp", cr.x + 0.75, cr.y + 0.75, 0.42, 0.11, "v", 6, 9);
    /* the MAIL SERVER, right: the wall the emails bounce off */
    var gt = VL.gate, gg = new THREE.Group();
    gg.add(mesh(G.plate(THREE, 2.2, 3.0, 0.18, 0.5, null, [[0, 0.5, 0.9, 0.16, 0.05]], 0.04), mat.steelBrushed));
    var mt = plaque(ctx, ["MAIL SERVER", { t: "receiving", w: 600 }], 1.7, 0.7, { tone: "dark", size: 40, thick: 0.05 }); mt.position.set(0, -0.55, 0.28); gg.add(mt);
    P("gate", gg, [gt.x, gt.y, 0.1], "v", 4, 10);
    M.gateLamp = K.lamp("gLamp", gt.x + 0.75, gt.y + 1.15, 0.42, 0.11, "v", 6, 11);
    /* the failure emails */
    var mails = [];
    for (var i = 0; i < 6; i++) {
      mails.push(K.paper(1.5, 0.98, 300, function (g, W, H) {
        g.fillStyle = "#f7dadd"; g.fillRect(0, 0, W, H);
        g.strokeStyle = "rgba(120,40,50,0.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(W / 2, H * 0.52); g.lineTo(W, 0); g.stroke();
        g.fillStyle = "#9a1f2b"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "BACKUP FAILED", H * 0.17, W * 0.86, 900); g.fillText("BACKUP FAILED", W / 2, H * 0.74);
      }, { emissive: 0.15 }));
    }
    M.mails = mails;
    K.awayPoses({ v: [0, 0, 0] });
    M.home = function () { K.set(null, true); };
    M.assemble = K.assemble;
    /** wipe the PRIMARY: k 0 full … 1 empty (the meter drains, the face turns red) */
    M.wipe = function (k) { var f = M.dbFaces[0]; var q = Math.round(clamp(k, 0, 1) * 40) / 40; f.face.show("w" + q, function (g, W, H) { drawDb(g, W, H, f.d, 1 - q, q > 0.5); }); };
    /** the backup flap folds down toward the lens: k 0 shut … 1 open (the empty bay is in full view) */
    M.drawer = function (k) { by.drawer.obj.rotation.x += (Math.PI / 2) * E.outBack(clamp(k, 0, 1)) * 0.98; };
    M.lamps = function (b, c2, g2) { K.setLamp(M.backupLamp, b); K.setLamp(M.cronLamp, c2); K.setLamp(M.gateLamp, g2); };
    /** failure email i: k 0 in the cron box … 0.6 at the gate … 1 bounced back down and gone */
    M.mail = function (i, k) {
      var m = mails[i]; if (k <= 0 || k >= 1) { m.hide(); return; }
      var a = VL.cron, b = VL.gate, z = 0.9;
      if (k < 0.6) { var u = E.inOut(k / 0.6); m.at(mix(a.x + 0.9, b.x - 1.25, u), a.y + 0.6 + Math.sin(u * Math.PI) * 1.6, z, 0, 1); }
      else { var v = (k - 0.6) / 0.4; m.at(b.x - 1.25 - 1.4 * E.out3(v), a.y + 0.6 - 2.6 * E.in2(v), z + 0.3 * v, 1.2 * v, 1 - 0.3 * v); }
    };
    return M;
  }
  function drawDb(g, W, H, d, fill, red) {
    g.fillStyle = "#0d141c"; g.fillRect(0, 0, W, H);
    g.textBaseline = "middle"; g.textAlign = "left";
    g.fillStyle = "#8fa8c0"; fit(g, "DATA", H * 0.13, W * 0.4, 800); g.fillText("DATA", W * 0.06, H * 0.2);
    var x = W * 0.06, w = W * 0.88, y = H * 0.36, h = H * 0.3;
    g.strokeStyle = "#3b5370"; g.lineWidth = H * 0.025; g.strokeRect(x, y, w, h);
    g.fillStyle = red ? "#d3202a" : "#2f8cff"; g.fillRect(x + 4, y + 4, Math.max(0, (w - 8) * fill), h - 8);
    g.fillStyle = red ? "#ff8585" : "#c9d7e6"; fit(g, red ? "data directory removed" : Math.round(fill * 100) + "%", H * 0.13, W * 0.88, 700, MONO);
    g.fillText(red ? "data directory removed" : Math.round(fill * 100) + "%", W * 0.06, H * 0.82);
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * THE CAB — an alarm that only speaks on failure, then the dead man's handle (set 3). Warm amber, brass.
   *   left: a JOB box whose alarm wire runs to a bell; the failure cuts the wire; an OK lamp stays green.
   *   right: the driver's control stand: a spring-loaded handle held down by a gloved hand; let go and the
   *   spring lifts it, the rod opens the brake valve and the brake gauge falls.
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var CL = { job: { x: -6.2, y: 0.6 }, bellA: { x: -1.9, y: 2.2 }, stand: { x: 4.6, y: -0.6 }, pivot: { x: 3.6, y: 1.3 }, gauge: { x: 6.9, y: 1.4 }, valve: { x: 5.9, y: -1.8 } };
  function cab(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat;
    var root = new THREE.Group(); ctx.scene.add(root);
    var K = kit(ctx, root, o.seed || 23), P = K.P, mesh = K.mesh, by = K.by;
    /* o.layout overrides single parts of the layout (portrait: the bell stands above the job box) */
    var LC = {}; for (var lk in CL) LC[lk] = (o.layout && o.layout[lk]) || CL[lk];
    var M = { root: root, K: K, L: LC, by: by };
    var brass = mat.goldBrushed, brassP = mat.gold;
    /* ── the alarm circuit ── */
    var j = LC.job, jg = new THREE.Group();
    jg.add(mesh(G.plate(THREE, 2.6, 2.2, 0.2, 0.5, null, null, 0.04), mat.steelBrushed));
    var jt = plaque(ctx, ["BACKUP JOB", { t: "alarm on failure", w: 600 }], 2.0, 0.72, { tone: "dark", size: 40, thick: 0.05 }); jt.position.set(0, -0.35, 0.28); jg.add(jt);
    P("job", jg, [j.x, j.y, 0.1], "c", 4, 0);
    M.okLamp = K.lamp("okLamp", j.x - 0.75, j.y + 0.62, 0.42, 0.14, "c", 6, 1);
    var okT = plaque(ctx, "OK", 0.5, 0.26, { tone: "dark", size: 36, thick: 0.04 }); P("okTag", okT, [j.x - 0.15, j.y + 0.62, 0.4], "c", 6, 2);
    /* the wire: two lengths with a joint where the failure cuts it */
    var A = [j.x + 1.3, j.y + 0.5], B = [LC.bellA.x - 0.5, LC.bellA.y - 0.15], mid = [mix(A[0], B[0], 0.5), mix(A[1], B[1], 0.5)];
    function wire(name, p0, p1, order) {
      var len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      var w = mesh(G.link(THREE, len, 0.09, 0.09, 0, 0.02), mat.red);
      return P(name, w, [p0[0], p0[1], 0.5], "c", 5, order, [0, 0, ang]);
    }
    wire("wireA", A, mid, 3); wire("wireB", mid, B, 4);
    var bellMatC = mat.goldBrushed.clone(); bellMatC.metalness = 0.55; bellMatC.roughness = 0.38;   // the dome needs a diffuse share (see the watcher bell)
    var bl = mesh(G.lathe(THREE, [[0, 0.42], [0.16, 0.41], [0.36, 0.3], [0.48, 0.1], [0.55, 0], [0.5, 0], [0.43, 0.07], [0.32, 0.24], [0.13, 0.34], [0, 0.35]], 48), bellMatC);
    var bg = new THREE.Group(); bg.add(bl); bl.rotation.x = -Math.PI / 2;
    P("alarmBell", bg, [LC.bellA.x, LC.bellA.y, 0.4], "c", 5, 5);
    /* ── the control stand ── */
    var s = LC.stand, sg = new THREE.Group();
    sg.add(mesh(G.plate(THREE, 3.6, 4.6, 0.3, 0.5, null, [[0.2, 1.05, 2.6, 0.34, 0.08]], 0.05), brass));
    var st = plaque(ctx, ["CONTROLLER", { t: "dead man's handle", w: 600 }], 2.4, 0.72, { size: 40, thick: 0.05 }); st.position.set(0, -1.55, 0.3); sg.add(st);
    P("stand", sg, [s.x, s.y, 0.05], "c", 3, 6);
    /* the handle: an arm on the pivot with the knob; home = held down (horizontal), let go = spring lifts it */
    var pv = LC.pivot, hg = new THREE.Group();
    hg.add(mesh(G.link(THREE, 2.3, 0.26, 0.16, 0.06, 0.03), brassP));
    var knob = mesh(G.lathe(THREE, [[0, 0], [0.24, 0], [0.28, 0.1], [0.28, 0.28], [0.18, 0.36], [0, 0.36]], 32), mat.black); knob.rotation.x = -Math.PI / 2; knob.position.set(2.3, 0.12, 0); hg.add(knob);
    P("handle", hg, [pv.x, pv.y, 0.6], "c", 6, 7, [0, 0, 0]);
    P("pivotCap", mesh(G.disc(THREE, 0.24, 0.3, 0.06, 0.04), mat.steel), [pv.x, pv.y, 0.66], "c", 6, 8);
    /* the spring under the knob end: a vertical coil (base at the group origin, 0.9 tall at rest) */
    var hel = [], NH = 7 * 24;
    for (var hi = 0; hi <= NH; hi++) { var ha = (hi / 24) * TAU; hel.push(new THREE.Vector3(Math.cos(ha) * 0.17, (hi / NH) * 0.9, Math.sin(ha) * 0.17)); }
    var spr = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), NH * 2, 0.03, 6, false), mat.steel);
    var springG = new THREE.Group(); springG.add(spr);
    var sp = P("spring", springG, [pv.x + 2.0, pv.y - 1.0, 0.55], "c", 5, 9);
    sp.isSpring = true;
    /* the glove: a stylised driver's hand pressing the knob */
    var glove = mesh(G.outline(THREE, [[-0.55, -0.1], [0.45, -0.1], [0.62, 0.15], [0.62, 0.55], [0.35, 0.78], [-0.4, 0.78], [-0.62, 0.5], [-0.62, 0.12]], 0.36, null, 0.06, true), mat.rubber);
    var gl = new THREE.Group(); gl.add(glove);
    var cuff = mesh(G.extrude(THREE, G.roundedRect(THREE, 1.1, 0.3, 0.1), 0.4, 0.03, { curve: 6 }), brass); cuff.position.set(0, 0.95, 0); gl.add(cuff);
    var gp = P("glove", gl, [pv.x + 2.3, pv.y + 0.48, 0.7], "c", 6, 10);
    gp.setAway("gone", { p: [pv.x + 2.6, pv.y + 3.4, 1.4], r: [0, 0, 0.3], s: 1 });
    M.handLabel = plaque(ctx, "DRIVER", 0.86, 0.24, { tone: "dark", size: 34, thick: 0.04 });
    gl.add(M.handLabel); M.handLabel.position.set(0, 0.35, 0.22);
    /* the rod from the handle down to the brake valve */
    var rod = mesh(G.link(THREE, 1, 0.1, 0.08, 0.035, 0.015), mat.steel);
    var rp = P("rod", rod, [pv.x + 0.9, pv.y, 0.5], "c", 5, 11);
    rp.isRod = true;
    /* the brake valve: a cylinder (seen end-on as a plate) with a piston that rises as it opens */
    var v = LC.valve, vg = new THREE.Group();
    vg.add(mesh(G.plate(THREE, 1.6, 1.3, 0.14, 0.4, [[0, 0.3, 0.2]], null, 0.03), mat.steelBrushed));
    var vt = plaque(ctx, "BRAKE VALVE", 1.3, 0.26, { tone: "dark", size: 30, thick: 0.04 }); vt.position.set(0, -0.42, 0.22); vg.add(vt);
    P("valveBody", vg, [v.x, v.y, 0.1], "c", 4, 12);
    var piston = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.34, 1.2, 0.06, 0, 0.6), 0.2, 0.02, { curve: 6 }), mat.steel);
    var pp = P("piston", piston, [v.x, v.y + 0.3, 0.32], "c", 5, 13);
    pp.isPiston = true;
    /* the brake gauge */
    var gg2 = LC.gauge, gaugeG = new THREE.Group();
    gaugeG.add(mesh(G.disc(THREE, 1.0, 0.2, 0, 0.04), brass));
    var gf = K.paper(1.7, 1.7, 260, function (g, W, H) {
      g.fillStyle = "#f3eee0"; g.beginPath(); g.arc(W / 2, H / 2, W / 2, 0, TAU); g.fill();
      g.strokeStyle = "#3a2a10"; g.lineWidth = W * 0.012;
      for (var i = 0; i <= 10; i++) { var a = Math.PI * (1.15 - 1.3 * i / 10); g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * W * 0.36, H / 2 - Math.sin(a) * H * 0.36); g.lineTo(W / 2 + Math.cos(a) * W * 0.44, H / 2 - Math.sin(a) * H * 0.44); g.stroke(); }
      g.fillStyle = "#3a2a10"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "BRAKE", H * 0.09, W * 0.5, 800); g.fillText("BRAKE", W / 2, H * 0.7);
      g.fillStyle = "#9a1f2b"; fit(g, "ON", H * 0.08, W * 0.3, 800); g.fillText("ON", W * 0.24, H * 0.62);
      g.fillStyle = "#1a5c3a"; g.fillText("OFF", W * 0.77, H * 0.62);
    }, { emissive: 0.12, thick: 0.02, round: true });
    root.remove(gf.group); gf.group.position.z = 0.11; gaugeG.add(gf.group);
    P("gauge", gaugeG, [gg2.x, gg2.y, 0.15], "c", 4, 14);
    var gn = mesh(G.link(THREE, 0.7, 0.06, 0.04, 0, 0.01), mat.red);
    var gnp = P("gNeedle", gn, [gg2.x, gg2.y, 0.3], "c", 6, 15);
    gnp.isG = true;
    K.awayPoses({ c: [0, 0, 0] });
    M.home = function () { K.set(null, true); by.glove.place(1, "gone"); };
    /** the failure cuts the wire: k 0 whole … 1 the second length has fallen away */
    M.cutWire = function (k) { var w = by.wireB.obj; w.position.y += -1.4 * E.in2(k); w.position.x += 0.3 * k; w.rotation.z += -0.9 * k; w.position.z += 0.4 * k; w.visible = k < 0.98; };
    M.bellShake = function (a, t) { by.alarmBell.obj.rotation.z += Math.sin(t * 52) * 0.07 * a; };
    M.ok = function (k) { K.setLamp(M.okLamp, "green", k); };
    /** hold: 1 the glove presses the knob down … 0 the glove has let go (the handle springs up) */
    M.handle = function (hold, t) {
      var up = 1 - clamp(hold, 0, 1);
      var a = 0.62 * E.outBack(up);
      by.handle.obj.rotation.z += a;
      by.glove.place(clamp(hold, 0, 1), "gone");
      by.spring.obj.scale.y = mix(1.0, 1.85, E.outBack(up));       // the spring lifts the knob end
      /* the rod: from a point 0.9 along the handle down to the piston top */
      var hx = LC.pivot.x + Math.cos(a) * 0.9, hy = LC.pivot.y + Math.sin(a) * 0.9;
      var pz = by.piston.obj, px = LC.valve.x, py = LC.valve.y + 0.3 + 1.2 + 0.55 * up;
      pz.position.y += 0.55 * up;
      var ro = by.rod.obj, dx = px - hx, dy = py - hy;
      ro.position.x = hx; ro.position.y = hy; ro.rotation.z = Math.atan2(dy, dx); ro.scale.set(Math.hypot(dx, dy), 1, 1);
      /* the gauge: brake OFF (needle right) while held … ON (needle left) once let go */
      by.gNeedle.obj.rotation.z += mix(Math.PI * -0.12, Math.PI * 1.05, E.out3(up));
      return up;
    };
    M.assemble = K.assemble;
    return M;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * THE LEDGER — our own analytics job (s11). A weekly stamp driven by a belt from a clock, over a calendar
   * of eighteen weekly cells (mid-June → mid-October). The belt slips off; the weeks keep turning; every
   * cell stays blank and nothing anywhere turns red.
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var WEEKS = ["15 JUN", "22 JUN", "29 JUN", "6 JUL", "13 JUL", "20 JUL", "27 JUL", "3 AUG", "10 AUG", "17 AUG", "24 AUG", "31 AUG", "7 SEP", "14 SEP", "21 SEP", "28 SEP", "5 OCT", "12 OCT"];
  var GL = { plate: { w: 13.6, h: 6.8 }, cell: { w: 1.25, h: 1.05, x0: -5.6, y0: -0.55, gap: 0.14 }, clock: { x: -5.5, y: 2.3, r: 0.55 }, stamp: { x: -1.2, y: 2.35 }, belt: { run: 0.46, slipY: -0.3, slipRz: -0.32 } };
  function ledger(ctx, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat;
    var root = new THREE.Group(); ctx.scene.add(root);
    var K = kit(ctx, root, o.seed || 68), P = K.P, mesh = K.mesh, by = K.by;
    var M = { root: root, K: K, L: GL, by: by, WEEKS: WEEKS };
    P("gPlate", mesh(G.plate(THREE, GL.plate.w, GL.plate.h, 0.5, 0.22, null, null, 0.04), mat.plate), [0, 0, 0], "g", 1, 0);
    var tt = plaque(ctx, ["CHANNEL ANALYTICS", { t: "weekly · measure every video", w: 600 }], 3.6, 0.78, { tone: "dark", size: 40, thick: 0.05 });
    P("gTag", tt, [3.6, 2.45, 0.2], "g", 6, 1);
    /* the cells: 9 × 2 */
    M.cells = [];
    WEEKS.forEach(function (wk, i) {
      var c = GL.cell, col = i % 9, row = Math.floor(i / 9);
      var x = c.x0 + col * (c.w + c.gap), y = c.y0 - row * (c.h + c.gap);
      var pc = K.paper(c.w, c.h, 260, function (g, W, H) { drawCell(g, W, H, wk, false); }, { emissive: 0.1, thick: 0.03 });
      root.remove(pc.group);
      var gr = new THREE.Group(); gr.add(pc.group);
      P("cell" + i, gr, [x, y, 0.22], "g", 4, 2 + i);
      M.cells.push({ face: pc, wk: wk, x: x, y: y });
    });
    /* the clock + pulley, the belt, the stamp's pulley and the stamp head */
    var c2 = GL.clock;
    var clk = new THREE.Group(); clk.add(mesh(G.disc(THREE, c2.r + 0.12, 0.16, 0, 0.03), mat.steelBrushed));
    var cf = K.paper(c2.r * 1.8, c2.r * 1.8, 300, function (g, W, H) {
      g.fillStyle = "#101820"; g.fillRect(0, 0, W, H); g.strokeStyle = "#8fa8c0"; g.lineWidth = W * 0.012;
      for (var i = 0; i < 12; i++) { var a = i * TAU / 12; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * H * 0.4); g.lineTo(W / 2 + Math.cos(a) * W * 0.46, H / 2 + Math.sin(a) * H * 0.46); g.stroke(); }
      g.fillStyle = "#ffc75f"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 " + H * 0.14 + "px " + MONO; g.fillText("MON", W / 2, H * 0.7);
    }, { emissive: 0.06, thick: 0.02 });
    root.remove(cf.group); cf.group.position.z = 0.09; clk.add(cf.group);
    P("gClock", clk, [c2.x, c2.y, 0.25], "g", 5, 22);
    P("gHand", mesh(G.link(THREE, c2.r * 0.72, 0.05, 0.03, 0, 0.008), mat.gold), [c2.x, c2.y, 0.45], "g", 6, 23, [0, 0, Math.PI / 2]);
    var pulA = mesh(G.wheel(THREE, { r: 0.42, rim: 0.08, hub: 0.08, spokes: 4, thick: 0.1, bore: 0.03 }), mat.steel);
    P("pulA", pulA, [c2.x + 1.4, c2.y, 0.32], "g", 5, 24);
    var st = GL.stamp;
    var pulB = mesh(G.wheel(THREE, { r: 0.42, rim: 0.08, hub: 0.08, spokes: 4, thick: 0.1, bore: 0.03 }), mat.steel);
    P("pulB", pulB, [st.x, st.y, 0.32], "g", 5, 25);
    /* the belt: two straight runs (top + bottom) between the pulleys */
    var len = st.x - (c2.x + 1.4);
    var belt = new THREE.Group();
    [GL.belt.run, -GL.belt.run].forEach(function (dy) { var b = mesh(G.extrude(THREE, G.roundedRect(THREE, len, 0.07, 0.02, len / 2, 0), 0.12, 0.01, { curve: 4 }), mat.rubber); b.position.y = dy; belt.add(b); });
    P("belt", belt, [c2.x + 1.4, c2.y, 0.4], "g", 6, 26);
    var head = new THREE.Group();
    head.add(mesh(G.plate(THREE, 1.0, 0.6, 0.1, 0.3, null, null, 0.03), mat.goldBrushed));
    var pad = mesh(G.extrude(THREE, G.roundedRect(THREE, 0.8, 0.12, 0.03), 0.3, 0.01, { curve: 4 }), mat.rubber); pad.position.set(0, -0.36, 0); head.add(pad);
    P("stampHead", head, [st.x + 1.25, st.y - 0.6, 0.45], "g", 6, 27);
    P("stampTag", plaque(ctx, "MEASURE", 1.1, 0.24, { size: 32, thick: 0.04 }), [st.x + 1.25, st.y + 0.05, 0.5], "g", 6, 28);
    /* the pointer: which week it is */
    var ptr = mesh(new THREE.ConeGeometry(0.16, 0.36, 3), mat.gold); ptr.rotation.z = Math.PI;
    P("ptr", ptr, [GL.cell.x0, GL.cell.y0 + 0.82, 0.5], "g", 6, 29);
    K.awayPoses({ g: [0, 0, 0] });
    M.home = function () { K.set(null, true); };
    M.assemble = K.assemble;
    /** the drive: th (rad) turns both pulleys while the belt is on; slip 0 on … 1 the belt has slipped off and dropped */
    M.drive = function (th, slip) {
      var on = 1 - clamp(slip, 0, 1);
      by.pulA.obj.rotation.z += -th; by.pulB.obj.rotation.z += -th * on;
      by.gHand.obj.rotation.z += -th * 0.25;
      /* it slips off the stamp's pulley and hangs from the clock's — slanting down, but above the cells (layering law) */
      var s = E.in2(clamp(slip, 0, 1)); var b = by.belt.obj; b.position.y += GL.belt.slipY * s; b.rotation.z += GL.belt.slipRz * s; b.position.z += 0.15 * s;
    };
    /** the week pointer at week w (fractional); cells before it are the weeks gone by — all blank */
    M.week = function (w) {
      var wi = clamp(w, 0, WEEKS.length - 1), i0 = Math.floor(wi), f = wi - i0, i1 = Math.min(i0 + 1, WEEKS.length - 1);
      var a = M.cells[i0], b = M.cells[i1];
      var p = by.ptr.obj; p.position.x = mix(a.x, b.x, E.inOut(f)); p.position.y = mix(a.y, b.y, E.inOut(f)) + 0.82;
      for (var i = 0; i < M.cells.length; i++) { var c = M.cells[i], past = i < wi; c.face.show(past ? "p" : "f", (function (cc, ps) { return function (g, W, H) { drawCell(g, W, H, cc.wk, ps); }; })(c, past)); }
    };
    M.stamp = function (p) { by.stampHead.obj.position.y += -0.25 * p; };
    return M;
  }
  function drawCell(g, W, H, wk, past) {
    g.fillStyle = past ? "#e9e5da" : "#f6f3ea"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#16324f"; g.fillRect(0, 0, W, H * 0.24);
    g.fillStyle = "#e9f1fa"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "WEEK OF " + wk, H * 0.13, W * 0.9, 800); g.fillText("WEEK OF " + wk, W / 2, H * 0.125);
    g.strokeStyle = "rgba(40,60,80,0.25)"; g.setLineDash([W * 0.04, W * 0.04]); g.lineWidth = W * 0.02; rr(g, W * 0.12, H * 0.36, W * 0.76, H * 0.5, W * 0.05); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(60,80,100,0.45)"; fit(g, past ? "no measurement" : "", H * 0.12, W * 0.7, 600); g.fillText(past ? "no measurement" : "", W / 2, H * 0.61);
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════
   * TRAYS — the evidence bench (s6): three steel trays with a label plaque; a scene fills them with slips,
   * an error plate, or nothing, and tags the ones that carry evidence.
   * ════════════════════════════════════════════════════════════════════════════════════════════════════ */
  function trays(ctx, n, o) {
    o = o || {};
    var THREE = ctx.THREE, mat = ctx.mat;
    var root = new THREE.Group(); ctx.scene.add(root);
    var K = kit(ctx, root, o.seed || 6), P = K.P, mesh = K.mesh, by = K.by;
    var M = { root: root, K: K, by: by, list: [] };
    var w = o.w || 2.6, h = o.h || 2.1, gap = o.gap || 0.55;
    /* the bench itself: a long steel shelf the trays stand on, and a blued back plate — the set is a place */
    var bw = n * w + (n - 1) * gap + 1.4;
    P("benchBack", mesh(G.plate(THREE, bw, h + 2.3, 0.4, 0.16, null, null, 0.03), mat.plate), [0, 0.35, -0.5], "bench", 0, 0);
    P("shelf", mesh(G.extrude(THREE, G.roundedRect(THREE, bw - 0.4, 0.22, 0.06), 1.1, 0.03, { curve: 6 }), mat.steelBrushed), [0, -h / 2 - 0.62, 0.3], "bench", 3, 0);
    for (var i = 0; i < n; i++) {
      var x = (i - (n - 1) / 2) * (w + gap), grp = new THREE.Group();
      var wall = function (ww, hh, xx, yy) { var m = mesh(G.extrude(THREE, G.roundedRect(THREE, ww, hh, 0.04), 0.8, 0.02, { curve: 6 }), mat.steelBrushed); m.position.set(xx, yy, 0.4); grp.add(m); };
      wall(0.12, h, -w / 2 + 0.06, 0); wall(0.12, h, w / 2 - 0.06, 0); wall(w, 0.12, 0, -h / 2 + 0.06);
      var back = mesh(G.plate(THREE, w, h, 0.12, 0.08, null, null, 0.02), mat.plateDark); grp.add(back);
      var lbl = plaque(ctx, (o.labels || [])[i] || "", w - 0.2, 0.34, { tone: "dark", size: 40, track: 4, thick: 0.05 }); lbl.position.set(0, -h / 2 - 0.3, 0.2); grp.add(lbl);
      var tagG = plaque(ctx, "EVIDENCE", w - 0.5, 0.4, { size: 40, track: 6, thick: 0.06, glow: 0xffb020, glowI: 0.25 });
      var tp = P("ev" + i, tagG, [x, h / 2 + 0.4, 0.6], "t", 6, 2);
      tp.setAway("up", { p: [x, h / 2 + 2.6, 2.4], r: [0, 0, 0.2], s: 0 });
      var p = P("tray" + i, grp, [x, 0, 0], "t", 4, 1);
      M.list.push({ part: p, x: x, label: lbl, tag: tagG, tagPart: tp });
    }
    K.awayPoses({ t: [0, -8, 4] });
    M.home = function () { K.set(null, true); };
    /** the EVIDENCE tag on tray i: k 0 hidden above … 1 seated */
    M.tag = function (i, k) { M.list[i].tagPart.place(clamp(k, 0, 1), "up"); };
    /** relabel tray i — redraws only when the text changes (a canvas redraw per sub-frame is not free) */
    M.relabel = function (i, text) { var it = M.list[i]; if (it.lastLabel === text) return; it.lastLabel = text; it.label.userData.redraw(text); };
    M.assemble = K.assemble;
    return M;
  }

  global.HWT = {
    line: line, watcher: watcher, vault: vault, cab: cab, ledger: ledger, trays: trays,
    kit: kit, cam: cam, plaque: plaque, drawSheet: drawSheet, drawSlip: drawSlip, drawError: drawError,
    L: L, WL: WL, GL: GL, LOOK_Y: LOOK_Y, DIST: DIST, REQUESTS: REQUESTS, STALE: STALE, HISTORY: HISTORY, YDAY: YDAY,
    rr: rr, fit: fit, wrap: wrap,
  };
})(window);
