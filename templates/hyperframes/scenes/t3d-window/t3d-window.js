/* t3d-window — 022 long s2 (phase 1) and s3 (phase 2), the 3D cut of cw-window-frame.
 *
 * One file for both phases so the frame and the four labelled groups cross the s2/s3 boundary as the
 * SAME object at the same size and position — the carry has to be literal, exactly as in the 2D take.
 *
 * EVERY TIME IS DERIVED FROM THE BEATS. The scene fills whatever window the alignment gives it
 * (18.4s for s2, 11.4s for s3) and its actions sit under the sentences that describe them.
 *
 * Pure function of the HyperFrames seek clock; DOF + bloom from _lib/hf-three.js.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "t3d-window", width: 1920, height: 1080, frames: 552, beatLo: 0.0, beatHi: 0.25 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props;
function px(n) { return n * U + "px"; }

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var LABELS = props.groups || ["your conversation", "your instructions", "the document you pasted", "the answer it's writing"];
var CHUNKS = props.chunks || ["your", " con", "ver", "sa", "tion", " so", " far"];

document.getElementById("motif").textContent = props.motif || "Here's what's actually happening.";
document.getElementById("emptytext").textContent = props.emptyLine || "Nothing is kept.";

/* ── beats (identical mapping to the 2D take) ────────────────────────────────── */
var t0, t1, t2, t3, tc, u0, u1, u2;
if (PHASE === 1) {
  t0 = beatAt(0, 0.0);
  t1 = Math.max(beatAt(1, 0.09), t0 + 1.2);     // "Every model has a context window…"
  t2 = Math.max(beatAt(2, 0.51), t1 + 6.0);     // "Your conversation, your instructions…"
  t3 = Math.max(beatAt(3, 0.95), t2 + 6.0);     // "That part is true."
  tc = Math.min(t1 + 5.0, t2 - 1.9);            // "…counted in the chunks we measured last time"
} else {
  u0 = beatAt(0, 0.0);
  u1 = Math.max(beatAt(1, 0.53), u0 + 3.4);     // "Nothing is kept."
  u2 = Math.max(beatAt(2, 0.64), u1 + 0.9);     // "…the model holds nothing at all."
}

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#motif", { opacity: 0, y: px(-16) });
gsap.set("#empty", { opacity: 0, y: px(24) });
if (PHASE === 1) {
  tl.to("#motif", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t0 + 0.12);
  tl.to("#motif", { opacity: 0, y: px(-18), duration: 0.3, ease: "power2.in" }, t2 - 0.5);
} else {
  tl.to("#empty", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, u2 + 0.15);
}
HF.register("t3d-window", tl);

/* ── geometry (shared by both phases so the carry is literal) ────────────────── */
var NEAR = 0.5, FAR = 90;
var FW = 9.4, FH = 4.6, BAR = 0.12;
var N = 16;                                     // the pages carried in from s1
var GROUP = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15]];
var ROW_Y = [1.42, 0.42, -0.58, -1.58];
var CARD_W = 1.9, CARD_H = 0.86;
/* While it is still ONE pile the paper is the only thing in a 9.4 x 4.6 window, so it is staged at
   nearly twice the size it settles at — at row scale the pile was a 20%-wide chip at the bottom of a
   large empty rectangle for seven seconds. Standing up into four groups then reads as the same paper
   being divided into smaller shares, which is exactly what the sentence says. */
var FLAT_SCALE = 1.75, FLAT_PITCH = 0.10, PILE_Y0 = -1.35;

/** where card `i` rests once it has stood up into its group */
function grouped(i) {
  for (var g = 0; g < GROUP.length; g++) {
    var j = GROUP[g].indexOf(i);
    if (j >= 0) return { x: 1.5 + j * 0.30, y: ROW_Y[g], z: -0.15 - j * 0.32, ry: -0.12 - j * 0.02, g: g };
  }
  return { x: 0, y: 0, z: 0, ry: 0, g: 0 };
}
/** where card `i` lies while the pile is still a pile (group 0 on TOP, so it empties downward) */
function flatY(i) { return PILE_Y0 + (N - 1 - i) * FLAT_PITCH; }

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.022);
  var camera = new THREE.PerspectiveCamera(36, W / H, NEAR, FAR);

  /* ── the room behind it, so "empty" still has somewhere to be empty IN ────── */
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x070d14, roughness: 0.98, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -FH / 2 - 1.4;
  floor.receiveShadow = true;
  scene.add(floor);
  var backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 34),
    new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.96, metalness: 0 }),
  );
  backWall.position.set(0, 3, -16);
  backWall.receiveShadow = true;
  scene.add(backWall);

  /* ── the frame: four gold edges that draw themselves ─────────────────────── */
  var goldEdge = new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xffb020, emissiveIntensity: 1.1, roughness: 0.32, metalness: 0.7,
  });
  var edges = [];
  function edge(w, h, x, y, axis) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, BAR * 1.6), goldEdge);
    m.position.set(x, y, 0);
    m._axis = axis;
    scene.add(m);
    edges.push(m);
    return m;
  }
  edge(FW, BAR, 0, FH / 2, "x");
  edge(BAR, FH, FW / 2, 0, "y");
  edge(FW, BAR, 0, -FH / 2, "x");
  edge(BAR, FH, -FW / 2, 0, "y");

  /* the pane — dark glass well behind the contents, so the frame is a volume and not four sticks */
  /* the glass writes depth on purpose: it is the backdrop the DOF should focus against, otherwise
     every empty part of the window is blurred by the wall sixteen units behind it (see hf-three.js) */
  var pane = new THREE.Mesh(
    new THREE.PlaneGeometry(FW - BAR, FH - BAR),
    new THREE.MeshBasicMaterial({ color: 0x0d1a28, transparent: true, opacity: 0.55, depthWrite: true }),
  );
  pane.position.z = -1.95;
  scene.add(pane);
  var innerLight = new THREE.PointLight(0xffb020, 0, 20, 2);
  innerLight.position.set(0, 0, 1.8);
  scene.add(innerLight);

  /* the frame's own name, standing on its top edge — a label belongs to its object */
  var frameLabel = HF3.textPlane(THREE, props.frameLabel || "The context window", {
    height: 0.26, align: "left", color: "#ffd37a",
  });
  frameLabel.position.set(-FW / 2 + 0.04, FH / 2 + 0.30, 0.02);
  frameLabel.material.opacity = 0;
  scene.add(frameLabel);

  /* "That part is true." — a green tick on the far end of the same edge. No strike-through: the
     claim being confirmed here is the one the video is about to build ON, not one it corrects. */
  var tickMat = new THREE.MeshBasicMaterial({ color: 0x3ddc97, transparent: true, opacity: 0, toneMapped: false });
  var tick = new THREE.Group();
  /* the two strokes are built from their JOINT outward, so they actually meet at a point instead of
     crossing — a check drawn as two centred bars reads as a broken letter, not a tick */
  var tShort = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.075, 0.05), tickMat);
  tShort.geometry.translate(0.13, 0, 0);
  tShort.rotation.z = Math.PI - 0.90;
  var tLong = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.075, 0.05), tickMat);
  tLong.geometry.translate(0.26, 0, 0);
  tLong.rotation.z = 1.02;
  tick.add(tShort);
  tick.add(tLong);
  tick.position.set(FW / 2 - 0.66, FH / 2 + 0.30, 0.04);
  scene.add(tick);

  /* ── the pages carried in from s1 ─────────────────────────────────────────── */
  var cardGeo = new THREE.BoxGeometry(CARD_W, CARD_H, 0.06);
  var ruleMat = new THREE.MeshBasicMaterial({ color: 0x8fa3ba });
  var goldRule = new THREE.MeshBasicMaterial({ color: 0xd8c9a4 });
  var r = HF3.rng(41);
  var cards = [];
  for (var i = 0; i < N; i++) {
    var isGold = i === N - 1;                   // the one page it is writing itself
    var g0 = new THREE.Group();
    var mat = isGold
      ? new THREE.MeshStandardMaterial({ color: 0xf2cd86, roughness: 0.4, metalness: 0.55, emissive: 0xffb020, emissiveIntensity: 0.16, transparent: true })
      : new THREE.MeshStandardMaterial({ color: 0xdde6f0, roughness: 0.94, metalness: 0.0, transparent: true });
    var body = new THREE.Mesh(cardGeo, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    g0.add(body);
    /* ruled "text" on the face — a card with nothing on it reads as a slab, not a page */
    for (var k = 0; k < 3; k++) {
      var lw = (CARD_W - 0.5) * (0.5 + r() * 0.45);
      var l = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.05, 0.02), isGold ? goldRule : ruleMat);
      l.position.set(-(CARD_W - 0.5) / 2 + lw / 2, CARD_H / 2 - 0.24 - k * 0.19, 0.035);
      g0.add(l);
    }
    var G = grouped(i);
    g0._to = new THREE.Vector3(G.x, G.y, G.z);
    g0._ry = G.ry;
    g0._g = G.g;
    g0._flat = new THREE.Vector3((r() - 0.5) * 0.30, flatY(i), -0.55 + (r() - 0.5) * 0.3);
    g0._fry = (r() - 0.5) * 0.06;
    g0._mat = mat;
    scene.add(g0);
    cards.push(g0);
  }

  /* ── the four group labels, standing inside the window beside their stacks ── */
  var labels = LABELS.slice(0, 4).map(function (text, g) {
    var m = HF3.textPlane(THREE, text, {
      height: 0.28, align: "left", color: g === 3 ? "#ffd37a" : "#cfe0f2",
    });
    m.position.set(-FW / 2 + 0.42, ROW_Y[g], -0.10);
    m.material.opacity = 0;
    scene.add(m);
    return m;
  });

  /* ── the token capsules the top page dissolves into (the Ep.2 callback) ───── */
  var caps = CHUNKS.map(function (c) {
    var m = HF3.textPlane(THREE, c, {
      height: 0.20, color: "#ffd37a", weight: 800,
      bg: "#1c2b3d", border: "rgba(255,176,32,0.62)",
    });
    m.material.opacity = 0;
    scene.add(m);
    return m;
  });
  var capW = 0;
  caps.forEach(function (m) { capW += m._w + 0.05; });
  var capX = -capW / 2;
  caps.forEach(function (m) {
    m.position.set(capX + m._w / 2, 0.72, 0.55);
    m._x = m.position.x;
    capX += m._w + 0.05;
  });

  /* ── phase 2's wrong mental model: a room where things are FILED, behind the glass ── */
  var room = new THREE.Group();
  var shelfMat = new THREE.MeshStandardMaterial({ color: 0x1b2c3e, roughness: 0.9, metalness: 0.05 });
  var rr = HF3.rng(17);
  var boxes = [], shelves = [];
  [2.0, 0.2, -1.6].forEach(function (y) {
    var sh = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.16, 1.5), shelfMat.clone());
    sh.material.transparent = true;
    sh.position.set(0, y, -7.4);
    sh.receiveShadow = true;
    room.add(sh);
    shelves.push(sh);
    for (var b = 0; b < 7; b++) {
      var bw = 0.7 + rr() * 0.75, bh = 0.55 + rr() * 0.5;
      var bx = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x2c4256, roughness: 0.85, metalness: 0.08, emissive: 0x0d1c2a, emissiveIntensity: 0.6, transparent: true }),
      );
      bx.position.set(-4.9 + b * 1.62 + (rr() - 0.5) * 0.25, y + 0.08 + bh / 2, -7.4);
      bx._y = bx.position.y;
      bx.castShadow = true;
      room.add(bx);
      boxes.push(bx);
    }
  });
  room.visible = PHASE === 2;
  scene.add(room);

  HF3.rig(THREE, scene, { extent: 13, ambient: 0.5, key: 2.4, rim: 2.0 });
  var greenWash = new THREE.PointLight(0x3ddc97, 0, 22, 2);
  greenWash.position.set(0, 0, 2.4);
  scene.add(greenWash);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 5.5, maxCoc: 16 });
  var focus = new THREE.Vector3(0, 0, 0);
  var COLD = new THREE.Color(0x3884d0), WARM = new THREE.Color(0xffb020);

  /* the span each group gets to stand up in — the narration names them one phrase at a time */
  var fillSpan = PHASE === 1 ? Math.max(t3 - t2 - 1.4, 3.6) : 0;
  function groupAt(g) { return t2 + 0.25 + (g * fillSpan) / 4; }

  /* ── the shot ─────────────────────────────────────────────────────────────── */
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var u = t / D;
    var i, m, g, q;

    if (PHASE === 1) {
      /* the frame draws itself around the pile that is already there */
      /* the draw is deliberately unhurried: b1 is one long sentence and the frame is the only thing
         happening under it, so each edge gets its own half-second rather than snapping shut in 1.3s */
      for (var e = 0; e < edges.length; e++) {
        m = edges[e];
        var p = HF3.outCubic(HF3.span(t, t1 + 0.4 + e * 0.42, t1 + 0.92 + e * 0.42));
        if (m._axis === "x") m.scale.x = Math.max(p, 0.0001);
        else m.scale.y = Math.max(p, 0.0001);
        m.visible = p > 0.001;
      }
      pane.material.opacity = 0.55 * HF3.span(t, t1 + 1.1, t1 + 1.9);
      frameLabel.material.opacity = HF3.span(t, t1 + 2.4, t1 + 2.86);

      /* "counted in the chunks we measured last time" — the top page dissolves into tokens */
      var dis = HF3.span(t, tc, tc + 0.24) * (1 - HF3.span(t, tc + 1.3, tc + 1.6));
      cards[0]._mat.opacity = 1 - dis;
      for (i = 0; i < caps.length; i++) {
        var ca = HF3.outCubic(HF3.span(t, tc + 0.1 + i * 0.045, tc + 0.3 + i * 0.045));
        var cg = HF3.span(t, tc + 1.15 + i * 0.02, tc + 1.35 + i * 0.02);
        caps[i].material.opacity = ca * (1 - cg);
        caps[i].scale.setScalar(HF3.mix(0.6, 1, ca) * HF3.mix(1, 0.72, cg));
        caps[i].position.x = caps[i]._x;
      }

      /* the pile stands up into the four labelled groups, one phrase at a time */
      for (i = 0; i < N; i++) {
        m = cards[i];
        g = m._g;
        var j = GROUP[g].indexOf(i);
        var at = groupAt(g) + 0.06 + j * 0.08;
        q = HF3.outCubic(HF3.span(t, at, at + 0.62));
        m.position.set(
          HF3.mix(m._flat.x, m._to.x, q),
          HF3.mix(m._flat.y, m._to.y, q) + Math.sin(q * Math.PI) * 0.35,
          HF3.mix(m._flat.z, m._to.z, q),
        );
        m.rotation.x = HF3.mix(-Math.PI / 2, 0, q);
        m.rotation.y = HF3.mix(m._fry, m._ry, q);
        var sc = HF3.mix(FLAT_SCALE, 1, q) * (i === 0 ? HF3.mix(1, 0.7, dis) : 1);
        m.scale.setScalar(sc);
      }
      for (g = 0; g < labels.length; g++) {
        var la = HF3.outCubic(HF3.span(t, groupAt(g), groupAt(g) + 0.36));
        labels[g].material.opacity = la;
        labels[g].position.x = HF3.mix(-FW / 2 + 0.10, -FW / 2 + 0.42, la);
      }

      /* the inner light warms as the window fills */
      var warmth = HF3.span(t, t1 + 1.0, t3);
      innerLight.intensity = 2 + warmth * 9;
      innerLight.color.copy(COLD).lerp(WARM, warmth);
      goldEdge.emissiveIntensity = HF3.mix(0.5, 1.5, warmth);

      /* "That part is true." */
      var tk = HF3.outCubic(HF3.span(t, t3 + 0.1, t3 + 0.42));
      tickMat.opacity = tk;
      tick.scale.setScalar(HF3.mix(2.2, 1, tk));
      greenWash.intensity = tk * 3.4;

      /* a slow orbit, and a push in once the claim is conceded. The radius keeps the WHOLE frame in
         shot at every angle — an object called "the window everything must fit inside" cannot be the
         one thing that runs off the edge. */
      var a1 = -0.28 + 0.44 * HF3.inOutCubic(u);
      var R1 = 11.4 - 0.7 * u - 0.5 * HF3.span(t, t3, D);
      camera.position.set(Math.sin(a1) * R1, 1.0 - 0.4 * u, Math.cos(a1) * R1);
      camera.lookAt(0, 0, 0);

    } else {
      /* ── PHASE 2 — it opens exactly where phase 1 ended ───────────────────── */
      for (var e2 = 0; e2 < edges.length; e2++) {
        edges[e2].scale.set(1, 1, 1);
        edges[e2].visible = true;
      }
      pane.material.opacity = 0.55;
      frameLabel.material.opacity = 1;

      /* the wrong mental model builds behind the glass: shelves, with the conversation filed away */
      var lift = HF3.inOutCubic(HF3.span(t, u1, u1 + 0.85));
      for (i = 0; i < boxes.length; i++) {
        var ba = HF3.outCubic(HF3.span(t, u0 + 0.45 + i * 0.045, u0 + 0.85 + i * 0.045));
        var bl = HF3.clamp(lift * 1.2 - (i % 9) * 0.02, 0, 1);
        boxes[i].material.opacity = ba * (1 - bl);
        boxes[i].position.y = boxes[i]._y + bl * 3.2;
        boxes[i].scale.setScalar(Math.max(1 - bl, 0.0001));
        boxes[i].visible = ba > 0.01 && bl < 0.99;
      }
      var shOp = HF3.span(t, u0 + 0.3, u0 + 1.0) * (1 - HF3.span(t, u1, u1 + 0.5));
      for (i = 0; i < shelves.length; i++) {
        shelves[i].material.opacity = shOp;
        shelves[i].visible = shOp > 0.01;
      }

      /* "Nothing is kept." — every page and every label lifts out of the frame */
      for (i = 0; i < N; i++) {
        m = cards[i];
        var lg = HF3.clamp(lift * 1.25 - (i % 6) * 0.03, 0, 1);
        m.position.set(m._to.x, m._to.y + lg * (2.9 + (i % 5) * 0.3), m._to.z);
        m.rotation.set(0, m._ry, 0);
        m._mat.opacity = 1 - lg;
        m.scale.setScalar(Math.max(1 - lg, 0.0001));
        m.visible = lg < 0.995;
      }
      for (g = 0; g < labels.length; g++) {
        var lgl = HF3.clamp(lift * 1.25 - g * 0.04, 0, 1);
        labels[g].material.opacity = 1 - lgl;
        labels[g].position.set(-FW / 2 + 0.42, ROW_Y[g] + lgl * 2.6, -0.10);
      }

      /* the tick dims out of the way — the concession is over, the correction is landing */
      tickMat.opacity = 1 - HF3.span(t, u0 + 0.3, u0 + 0.9) * 0.75 - HF3.span(t, u1, u1 + 0.5) * 0.25;
      tick.scale.setScalar(1);
      greenWash.intensity = 3.4 * (1 - HF3.span(t, u0 + 0.3, u0 + 0.9));

      /* the inner light cools from gold to blue over the empty frame, and the gold edge drops back
         so the cooling is something you SEE and not something only the code knows about */
      var cool = HF3.span(t, u1, u2 + 0.6);
      innerLight.intensity = HF3.mix(11, 7.0, cool);
      innerLight.color.copy(WARM).lerp(COLD, cool);
      goldEdge.emissiveIntensity = HF3.mix(1.5, 0.5, cool);

      /* a slow orbit, and a push into the emptiness — still framing the whole window */
      var a2 = 0.16 - 0.30 * HF3.inOutCubic(u);
      var R2 = 11.0 - 0.4 * u - 0.7 * HF3.span(t, u2, D);
      camera.position.set(Math.sin(a2) * R2, 0.55 - 0.3 * u, Math.cos(a2) * R2);
      camera.lookAt(0, 0, 0);
    }

    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
