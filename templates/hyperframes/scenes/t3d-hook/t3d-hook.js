/* t3d-hook — 022 long s1, the 3D cut of cw-never-remembered (same props, same beats).
 *
 * Shot: we are already deep in the thread, and it runs away from us — the camera physically flies
 * up the column. The pinned message goes dark while it is behind us; we come back down and the slot
 * is a hole we can see THROUGH, with the panels behind it visible in the gap. The myth is named and
 * struck on the flat type layer, then the whole thread folds down into the stack the video runs on.
 *
 * EVERY TIME IN THIS FILE IS DERIVED FROM THE BEATS, never from a fixed 7-second test length: the
 * scene has to fill whatever window the alignment gives it (11.6s here), and its actions have to sit
 * under the sentences that describe them. A 3D scene that hard-codes seconds is a clip, not a scene.
 *
 * Pure function of the HyperFrames seek clock; DOF + bloom from _lib/hf-three.js.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "t3d-hook", width: 1920, height: 1080, frames: 349, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props;
function px(n) { return n * U + "px"; }

document.getElementById("myth").textContent = props.myth || "it forgot";
document.getElementById("kickertext").textContent = props.title || "It never remembered.";

/* ── beats (identical mapping to the 2D take) ────────────────────────────────── */
var b1 = beatAt(1, 0.50);                     // "Everyone calls that forgetting."
var b2 = beatAt(2, 0.68);                     // "It didn't forget."
var b3 = beatAt(3, 0.79);                     // "It never remembered anything in the first place."
var tBack = Math.max(b1 - 1.7, 3.2);          // the view comes back to the top of the thread

/* the 3D shot's own marks, all hung off the same beats */
var AWAY = tBack - 0.55;                      // the fly-up ends
var BACK = tBack + 0.45;                      // we are back at the pinned slot
var DARK = Math.min(AWAY * 0.42, 1.6);        // it goes quiet while it is behind us
var FALL = b3 + 0.1;                          // the thread folds into the pile
var SETTLE = FALL + 1.5;

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#mythwrap", { opacity: 0, y: px(70), scale: 0.94 });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: px(34) });
gsap.set("#scrim", { opacity: 0 });

tl.to("#mythwrap", { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }, b1);
tl.to("#scrim", { opacity: 1, duration: 0.5, ease: "sine.out" }, b1);
tl.to("#slash", { scaleX: 1, duration: 0.34, ease: "power3.out" }, b2);
tl.to("#mythwrap", { opacity: 0, y: px(-40), scale: 0.9, duration: 0.28, ease: "power2.in" }, FALL - 0.3);
tl.to("#scrim", { opacity: 0, duration: 0.32, ease: "power2.in" }, FALL - 0.3);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, FALL + 1.0);
HF.register("t3d-hook", tl);

var NEAR = 0.5, FAR = 90;
var MSGS = 16, PITCH = 1.55, PIN = 3;
var PIN_Y = PIN * PITCH;
var PAPER_THIN = 0.34, PAPER_PITCH = 0.062;     // what a message becomes when it lands as paper

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.028);
  var camera = new THREE.PerspectiveCamera(38, W / H, NEAR, FAR);

  /* ── the thread: real panels standing in a column, alternating sides ──────── */
  /* a floor, so the stack the thread becomes has somewhere to land and something to shadow */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x070d14, roughness: 0.98, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.42;
  ground.receiveShadow = true;
  scene.add(ground);
  var desk = new THREE.Mesh(
    new THREE.BoxGeometry(13, 0.3, 7.5),
    new THREE.MeshStandardMaterial({ color: 0x16232f, roughness: 0.72, metalness: 0.12 }),
  );
  desk.position.y = -0.25;
  desk.receiveShadow = true;
  desk.castShadow = true;
  scene.add(desk);

  /* Each panel owns its material: when the thread folds down, the message has to BECOME paper, and
     a shared material cannot be lerped per panel (a hard swap mid-motion reads as a glitch). */
  /* lifted off the 2D bubble fills: at #2a2312 / #171719 a real light rig renders them as black
     rectangles on a black ground, because the 2D scene reads those colours against a LIT stage. */
  var ME = new THREE.Color(0x3d3319), AI = new THREE.Color(0x24252b), PAPER = new THREE.Color(0xf1f5fa);
  var lineMat = new THREE.MeshBasicMaterial({ color: 0xd8c9a4 });
  var lineMat2 = new THREE.MeshBasicMaterial({ color: 0x8fa3ba });
  var r = HF3.rng(23);
  var panels = [];
  for (var i = 0; i < MSGS; i++) {
    var mine = i % 2 === 0;
    var w = 3.1 + r() * 1.3, h = 0.82 + r() * 0.34;
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: mine ? ME : AI, roughness: 0.66, metalness: 0.22 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), mat);
    body._base = mine ? ME : AI;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    /* ruled "text" on the face — a panel with nothing on it reads as a slab, not a message */
    var nl = h > 1.0 ? 3 : 2;
    for (var k = 0; k < nl; k++) {
      var lw = (w - 0.6) * (0.5 + r() * 0.45);
      var l = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.055, 0.02), mine ? lineMat : lineMat2);
      l.position.set(-(w - 0.6) / 2 + lw / 2, h / 2 - 0.26 - k * 0.2, 0.085);
      g.add(l);
    }
    g.position.set(mine ? 1.5 + r() * 0.3 : -(1.5 + r() * 0.3), i * PITCH, (r() - 0.5) * 0.5);
    g.rotation.y = (mine ? -1 : 1) * 0.16;
    g._home = g.position.clone();
    g._ry = g.rotation.y;
    g._sx = (r() - 0.5) * 0.2;
    g._sz = (r() - 0.5) * 0.16;
    scene.add(g);
    panels.push(g);
  }

  /* the pinned message: its own warm material, a gold rail down its leading edge and a pin —
     the same vocabulary as the 2D hook, so the two cuts read as one object. */
  var pinned = panels[PIN];
  pinned.children[0].material = new THREE.MeshStandardMaterial({
    color: 0x30280f, roughness: 0.55, metalness: 0.3, emissive: 0xffb020, emissiveIntensity: 0.22,
  });
  var pw = pinned.children[0].geometry.parameters.width;
  var ph = pinned.children[0].geometry.parameters.height;
  var goldBar = new THREE.MeshBasicMaterial({ color: 0xffc84a });
  var rail = new THREE.Mesh(new THREE.BoxGeometry(0.085, ph - 0.22, 0.2), goldBar);
  rail.position.set(-pw / 2 + 0.06, 0, 0.02);
  pinned.add(rail);
  var pin = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), goldBar);
  pin.position.set(pw / 2 - 0.05, ph / 2 - 0.02, 0.08);
  pinned.add(pin);
  var pinLight = new THREE.PointLight(0xffb020, 9, 12, 2);
  pinLight.position.set(0, PIN_Y, 1.6);
  scene.add(pinLight);

  /* the hole it leaves: a soft gold volume, nothing else — no outline, no marker.
     A Sprite with no map draws a hard SQUARE, so the falloff is a generated radial texture. */
  var hc = document.createElement("canvas");
  hc.width = hc.height = 128;
  var hg = hc.getContext("2d");
  var grd = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.4)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  hg.fillStyle = grd;
  hg.fillRect(0, 0, 128, 128);
  var holeMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(hc), color: 0xffb020,
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  var hole = new THREE.Sprite(holeMat);
  /* Small and faint. At 8.5 x 4.2 x 0.55 this glow stopped reading as "the gap where the message
     was" and became a sun sitting in the middle of the shot (owner: "ostalo ono kao loš kvalitet i
     senka", 2026-08-17). The hole is supposed to be an ABSENCE with a little warmth left in it. */
  hole.scale.set(4.4, 1.5, 1);
  hole.position.set(pinned._home.x, PIN_Y, -0.9);
  scene.add(hole);

  HF3.rig(THREE, scene, { extent: 16, ambient: 0.62, key: 3.2, rim: 1.5 });

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 6.5, maxCoc: 20 });
  var focus = new THREE.Vector3();
  var camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();

  /* ── the shot ─────────────────────────────────────────────────────────────── */
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* the thread runs away from us, then we come back to the top of it */
    var camY = t < AWAY
      ? HF3.mix(PIN_Y + 0.6, (MSGS - 1) * PITCH + 2.4, Math.pow(HF3.span(t, 0, AWAY), 2))
      : HF3.mix((MSGS - 1) * PITCH + 2.4, PIN_Y + 0.2, HF3.inOutCubic(HF3.span(t, AWAY, BACK)));

    /* it goes quiet while it is behind us — nothing is crossed out, it just stops being there */
    var gone = t >= DARK;
    pinned.visible = !gone;
    pinLight.intensity = gone ? 0 : 6;
    holeMat.opacity = HF3.mix(0, 0.28, HF3.span(t, BACK - 0.25, BACK + 0.45)) * (1 - HF3.span(t, FALL, FALL + 0.3));

    /* every message folds down into a page, and the thread becomes the stack */
    var fp = HF3.inOutCubic(HF3.span(t, FALL, FALL + 1.15));
    for (var i = 0; i < MSGS; i++) {
      var g = panels[i];
      var lag = HF3.clamp(fp * 1.25 - i * 0.012, 0, 1);
      g.position.set(
        HF3.mix(g._home.x, g._sx, lag),
        HF3.mix(g._home.y, -0.06 + i * PAPER_PITCH, lag),
        HF3.mix(g._home.z, g._sz, lag),
      );
      g.rotation.x = HF3.mix(0, -Math.PI / 2, lag);
      g.rotation.y = HF3.mix(g._ry, 0, lag);
      /* a message is 0.16 THICK; a sheet of paper is not. Without thinning it on the way down the
         sixteen "pages" land as venetian blinds instead of a pile (first 022 3D pass). */
      g.scale.z = HF3.mix(1, PAPER_THIN, lag);
      /* and the message turns into paper on the way down */
      var bd = g.children[0];
      bd.material.color.copy(bd._base).lerp(PAPER, lag);
      bd.material.roughness = HF3.mix(0.66, 0.94, lag);
      bd.material.metalness = HF3.mix(0.22, 0.0, lag);
    }

    /* the camera hands over from "flying the thread" to "looking at the stack" */
    var c = HF3.inOutCubic(HF3.span(t, FALL + 0.15, SETTLE));
    var a = -0.5 + 0.85 * HF3.span(t, SETTLE - 0.6, D);
    /* the fly-up runs close to the column (a 13-unit standoff left two thirds of a 16:9 frame black),
       and the settle comes in tight on the pile so the object the video runs on has real size */
    camPos.set(
      HF3.mix(0, Math.sin(a) * 5.6, c),
      HF3.mix(camY, 1.9, c),
      HF3.mix(9.6, Math.cos(a) * 5.6, c),
    );
    lookAt.set(0, HF3.mix(camY - 0.5, 0.75, c), 0);
    camera.position.copy(camPos);
    camera.lookAt(lookAt);

    focus.set(0, HF3.mix(camY, 0.45, c), 0);
    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
