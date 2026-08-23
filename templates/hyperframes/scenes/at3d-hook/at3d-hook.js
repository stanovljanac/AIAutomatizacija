/* at3d-hook — 023 s1 (hook hero, 3D).
 *
 * Shot: we are already inside the prompt box. It is a real panel standing in the room with READABLE
 * pasted text on it, and it grows past the top and bottom of the frame as more paragraphs shove in —
 * the viewer's own habit, staged as a physical object that will not fit. The answer comes back on a
 * card that is visibly thinner than the ghost of the last one. Then the flat type layer names the
 * myth, strikes it, and the spotlight cone collapses into the budget bar.
 *
 * EVERY MARK COMES FROM S.beatAt(...), never from a literal second (MOTION_SPEC §11) — the scene has
 * to fill whatever window the alignment gives it.
 *
 * Panels stay FACE-ON (no resting 3D tilt — VISUAL_IDENTITY / owner rule); the camera does the
 * dimensional work by dollying, not by tipping the cards.
 *
 * Pure function of the HyperFrames seek clock; DOF + bloom from _lib/hf-three.js.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at3d-hook", width: 1920, height: 1080, frames: 345, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
function px(n) { return n * U + "px"; }

document.getElementById("myth").textContent = props.myth || "losing focus";
document.getElementById("kickertext").textContent = props.title || "It doesn't focus. It spends.";
document.getElementById("blbltext").textContent = props.budgetLabel || "the total";

/* the pasted brief — what is actually on the panel, readable */
var PASTED = (props.promptLines && props.promptLines.length ? props.promptLines : [
  "Here is everything about the Ridgeway account.",
  "Attached: the full onboarding brief, the old",
  "contract, last quarter's notes and the vendor",
  "sheet. The invoice question is somewhere in",
  "there. Please read all of it before you answer,",
  "and pay special attention to the important parts.",
]);
/* what gets shoved in on top of it while the viewer watches */
var SHOVED = [
  "Also pasting the Q2 review thread below, plus",
  "the supplier list, the old policy PDF and the",
  "email chain about the August run. Ignore what",
  "is not relevant. Focus on the important parts.",
  "Adding the archived notes as well, just in case.",
  "And the vendor sheet again, the newer version.",
];

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.24);                       // "The answer came back worse."
var b2 = beatAt(2, 0.46);                       // "Everyone calls that losing focus."
var b3 = beatAt(3, 0.62);                       // "It has no focus to lose…"
var PASTE_END = Math.max(b1 - 0.5, 1.4);        // the shoving stops when the answer returns

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#mythwrap", { opacity: 0, y: px(64), scale: 0.94 });
gsap.set("#cone", { opacity: 0, scaleY: 0.7 });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#budget", { opacity: 0 });
gsap.set("#bfill", { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: px(30) });
gsap.set("#scrim", { opacity: 0 });

tl.to("#mythwrap", { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }, b2);
tl.to("#scrim", { opacity: 1, duration: 0.5, ease: "sine.out" }, b2);
tl.to("#cone", { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }, b2 + 0.12);
/* the strike, then the cone collapses INTO the bar: the wrong picture becomes the right one */
tl.to("#slash", { scaleX: 1, duration: 0.3, ease: "power3.out" }, b3);
tl.to("#cone", { opacity: 0, scaleY: 0.14, duration: 0.4, ease: "power3.in" }, b3 + 0.14);
tl.to("#mythwrap", { opacity: 0.24, y: px(-26), duration: 0.4, ease: "power2.in" }, b3 + 0.34);
tl.to("#budget", { opacity: 1, duration: 0.3 }, b3 + 0.3);
/* it does not fill up to something — it arrives already spent to the last cent */
tl.to("#bfill", { scaleX: 1, duration: 0.5, ease: "power4.out" }, b3 + 0.36);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b3 + 0.62);
HF.register("at3d-hook", tl);

/* ── the room ────────────────────────────────────────────────────────────────── */
/* Geometry is DERIVED FROM THE CONTENT, never guessed: the text planes are built first, the panel is
   sized to the widest line, and the camera distance is solved so the panel fills FRAME_FILL of the
   shot. Hard-coded world units and a hard-coded camera z is how the first pass came back at 3x too
   close with the type running off both edges. */
var NEAR = 0.5, FAR = 70;
var FOV = 40, PAD = 0.5;
var FRAME_FILL = P ? 0.94 : 0.80;               // how much of the frame width the panel holds
function fitZ(worldW) {                          // camera distance that makes worldW fill the frame
  var visW = worldW / FRAME_FILL;
  return visW / (2 * Math.tan((FOV * Math.PI) / 360) * (W / H));
}

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.021);
  var camera = new THREE.PerspectiveCamera(40, W / H, NEAR, FAR);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: 0x06090e, roughness: 0.98, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -7.5;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ── the prompt box: a real panel, face-on, with readable text ON it ───────── */
  var boxGrp = new THREE.Group();
  scene.add(boxGrp);

  /* the text first — the panel is sized to it, not the other way round */
  var ALL = PASTED.concat(SHOVED);
  var lines = [];
  var maxW = 0;
  for (var i = 0; i < ALL.length; i++) {
    var tp = HF3.textPlane(THREE, ALL[i], {
      height: 0.15, align: "left", weight: 500,
      color: i < PASTED.length ? "#dfe9f4" : "#b9cadb",
    });
    tp.position.z = 0.19;
    boxGrp.add(tp);
    lines.push(tp);
    if (tp._w > maxW) maxW = tp._w;
  }
  var LINE_H = lines[0]._h;
  var PITCH = LINE_H * 0.98;      // real paragraph leading — 1.34 read as double-spaced
  var PANEL_W = maxW + PAD * 2 + 0.55;           // + room for the scrollbar gutter

  var panelMat = new THREE.MeshStandardMaterial({ color: 0x101a24, roughness: 0.74, metalness: 0.14 });
  var panel = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W, 1, 0.34), panelMat);
  panel.castShadow = true;
  panel.receiveShadow = true;
  boxGrp.add(panel);

  /* the gold rail down the leading edge — the same vocabulary as the rest of the family */
  var railMat = new THREE.MeshBasicMaterial({ color: 0xffc84a });
  var rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.36), railMat);
  rail.position.set(-PANEL_W / 2 + 0.055, 0, 0.02);
  boxGrp.add(rail);

  /* the scrollbar: its thumb shrinks as the paste grows — "it keeps going" */
  var trackMat = new THREE.MeshBasicMaterial({ color: 0x24384c });
  var track = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.02), trackMat);
  track.position.set(PANEL_W / 2 - 0.26, 0, 0.19);
  boxGrp.add(track);
  var thumb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.03), new THREE.MeshBasicMaterial({ color: 0x7d8fa3 }));
  thumb.position.set(PANEL_W / 2 - 0.26, 0, 0.2);
  boxGrp.add(thumb);

  for (var j = 0; j < lines.length; j++) lines[j].position.x = -PANEL_W / 2 + PAD;

  /* the caret sitting at the end of what you typed */
  var caret = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, LINE_H * 0.7, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xffb020 }),
  );
  caret.position.z = 0.2;
  boxGrp.add(caret);

  /* ── the two answers: the fat one you used to get, and the thin one you got ── */
  var CARD_W = PANEL_W * 0.38;   // + the perspective magnification at z=1.0 keeps both cards inside
  function answerCard(nLines, text, warm) {
    var g = new THREE.Group();
    var h = 0.46 + nLines * PITCH * 0.62;
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(CARD_W, h, 0.16),
      new THREE.MeshStandardMaterial({
        color: warm ? 0x1c2836 : 0x141d27, roughness: 0.6, metalness: 0.2,
        emissive: warm ? 0xffb020 : 0x000000, emissiveIntensity: warm ? 0.1 : 0,
      }),
    );
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    var lbl = HF3.textPlane(THREE, text, { height: 0.13, align: "left", weight: 600, color: warm ? "#ffd37a" : "#94a8bd" });
    lbl.position.set(-CARD_W / 2 + 0.28, h / 2 - 0.24 - lbl._h / 2, 0.1);
    g.add(lbl);
    /* the body of the answer: real ruled text at real leading, so a card is never an empty
       rounded rect with one line in it (the frame gate scores flat fills as no detail). */
    for (var k = 1; k < nLines; k++) {
      var w = (CARD_W - 0.56) * (k % 4 === 0 ? 0.54 : k % 3 === 0 ? 0.86 : 0.97);
      var r = new THREE.Mesh(
        new THREE.BoxGeometry(w, LINE_H * 0.19, 0.02),
        new THREE.MeshBasicMaterial({ color: warm ? 0x8a7442 : 0x4d6076 }),
      );
      r.position.set(-CARD_W / 2 + 0.28 + w / 2, h / 2 - 0.3 - k * PITCH * 0.62, 0.1);
      g.add(r);
    }
    g._h = h;
    return g;
  }
  /* the ghost of the answer you used to get: six lines, and it stays for the comparison */
  var ghost = answerCard(6, "the answer you used to get", false);
  scene.add(ghost);
  /* what came back this time */
  var thin = answerCard(2, props.answerThin || "Ridgeway is a vendor.", true);
  scene.add(thin);

  var key = HF3.rig(THREE, scene, { extent: 14, ambient: 0.5, key: 2.6, rim: 1.7 });
  key.position.set(5.0, 9.0, 7.0);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 7.5, maxCoc: 17 });
  var focus = new THREE.Vector3();

  /* ── the shot ─────────────────────────────────────────────────────────────── */
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* the paste grows: 6 lines at t=0, all 12 by PASTE_END, one shoving in at a time */
    var grow = HF3.outCubic(HF3.span(t, 0.15, PASTE_END));
    var shovedF = grow * SHOVED.length;
    var shown = Math.min(PASTED.length + Math.floor(shovedF + 1e-6), ALL.length);
    var frac = HF3.clamp(shovedF - Math.floor(shovedF), 0, 1);
    var panelH = PAD * 2 + shown * PITCH;
    panel.scale.y = panelH;
    rail.scale.y = panelH - 0.16;
    track.scale.y = panelH - 0.4;

    /* the box grows DOWNWARD past the bottom of the shot: the top of what you pasted stays put and
       the thing you are adding to keeps running off the frame — the viewer's own scroll, mirrored. */
    var top = panelH / 2;
    boxGrp.position.y = top - (PAD + LINE_H / 2) - LINE_H * 0.6;
    for (var i = 0; i < lines.length; i++) {
      var vis = i < shown;
      lines[i].visible = vis;
      var newest = i === shown - 1 && shown > PASTED.length;
      lines[i].position.y = top - PAD - LINE_H / 2 - i * PITCH - (newest ? (1 - HF3.outCubic(HF3.span(frac, 0, 0.55))) * PITCH * 0.8 : 0);
      lines[i].material.transparent = true;
      lines[i].material.opacity = vis ? (newest ? 0.25 + 0.75 * HF3.span(frac, 0, 0.4) : 1) : 0;
    }
    var lastLine = lines[shown - 1];
    caret.position.set(lastLine.position.x + lastLine._w + 0.06, lastLine.position.y, 0.2);
    caret.material.transparent = true;
    caret.material.opacity = t < PASTE_END ? 1 : 0.3;

    /* the thumb shrinks: there is always more of this than fits */
    var seen = PASTED.length / shown;
    var trackH = panelH - 0.4;
    thumb.scale.y = trackH * seen;
    thumb.position.y = top - 0.2 - (trackH * seen) / 2;

    /* the two answers land IN FRONT of the lower third of the box, face-on and top-aligned, and they
       are SOLID: a translucent card over the paste reads as a double exposure, not as a comparison.
       They do not get their own framing either — the camera never leaves the wall of text, because a
       travel between two framings crosses empty room and puts a near-black second in the middle of
       the hook (measured: mean luma 41 -> 17 -> 41 across the move). */
    var cardH = Math.max(ghost._h, thin._h);
    /* on the myth beat they slide out of frame downward — they leave, they do not dissolve */
    var clear = HF3.inOutCubic(HF3.span(t, b3 - 0.05, b3 + 0.55));   // they leave when the bar takes the lower band
    var cardY = boxGrp.position.y - panelH * 0.34 - clear * panelH * 0.95;
    ghost.position.set(-PANEL_W * 0.235, cardY + cardH / 2 - ghost._h / 2, 1.0);
    var ap = HF3.outCubic(HF3.span(t, b1, b1 + 0.5));
    thin.position.set(PANEL_W * 0.235, cardY + cardH / 2 - thin._h / 2 + HF3.mix(2.4, 0, ap), 1.0);
    thin.scale.setScalar(HF3.mix(1.1, 1, ap));
    thin.visible = ap > 0.001 && clear < 0.999;
    thin.children[0].material.emissiveIntensity = 0.12 + 0.34 * (1 - HF3.span(t, b1 + 0.35, b1 + 1.1));
    var gp = HF3.span(t, b1 - 0.35, b1 + 0.4);
    ghost.children.forEach(function (c, i) {
      if (!c.material) return;
      c.material.transparent = gp < 0.999;
      /* the body stays opaque once it has arrived; only the ruled text sits back */
      c.material.opacity = gp * (i === 0 ? 1 : 0.85);
    });
    ghost.visible = gp > 0.001 && clear < 0.999;

    /* camera: one slow push on the paste, and nothing else — the object stays in frame throughout */
    var push = HF3.inOutCubic(HF3.span(t, 0, D));
    var yc = boxGrp.position.y - panelH * HF3.mix(0.10, 0.14, push);
    var z = fitZ(PANEL_W * HF3.mix(1.04, 0.96, push));
    camera.position.set(0, yc, z);
    camera.lookAt(0, yc, 0);

    focus.set(0, yc, HF3.mix(0, 1.4, ap));
    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
