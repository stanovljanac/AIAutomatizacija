/* at3d-sink — 023 s10 (3D). The till drawer.
 *
 * Shot: a real drawer with one labelled compartment per token. What belongs to the text is counted
 * out fairly — a coin or two per slot. Then the leftover, the part of the total that nothing in the
 * text has earned, is poured into the FIRST compartment until it is heaped, because it is simply
 * the nearest hole. The camera ends close on that heap with every other slot nearly empty.
 *
 * Every mark comes from S.beatAt(...); geometry is derived from the content; the camera distance is
 * solved (fitZ). Deterministic function of the seek clock.
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at3d-sink", width: 1920, height: 1080, frames: 750, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
function px(n) { return n * U + "px"; }

var SLOTS = ["Notes", "for", "the", "invoice", "run", "The", "vendor", "code", "RW-88"];
var EARNED = [0, 1, 1, 2, 1, 1, 2, 2, 3];          // what the text actually earns: 13 coins
var LEFTOVER = 19;                                  // the change nobody asked for — it all goes to slot 0

document.getElementById("name").textContent = props.title || "The attention sink";
document.getElementById("src").textContent = props.sourceChip || "Xiao et al. · StreamingLLM · 2023";
document.getElementById("kickertext").textContent = props.kicker || "It isn't interested. It's making change.";

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.20);   // "And the reason is exactly the thing we started with."
var b2 = beatAt(2, 0.32);   // "The total has to come to one, even when nothing deserves it."
var b3 = beatAt(3, 0.52);   // "So the leftovers have to go somewhere harmless…"
var b4 = beatAt(4, 0.72);   // "…dump them on whatever came first."
var b5 = beatAt(5, 0.86);   // "It is making change."

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#namewrap", { opacity: 0, y: px(20) });
gsap.set("#rule", { opacity: 0, y: px(-14) });
gsap.set("#kicker", { opacity: 0, y: px(24) });

tl.to("#namewrap", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, beatAt(0, 0.02) + 0.3);
tl.to("#rule", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b2);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b5 + 0.15);
HF.register("at3d-sink", tl);

/* ── the room ────────────────────────────────────────────────────────────────── */
var NEAR = 0.4, FAR = 70, FOV = 38;
var FRAME_FILL = P ? 0.96 : 0.95;
function fitZ(worldW) {
  return (worldW / FRAME_FILL) / (2 * Math.tan((FOV * Math.PI) / 360) * (W / H));
}

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.02);
  var camera = new THREE.PerspectiveCamera(FOV, W / H, NEAR, FAR);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x070c12, roughness: 0.97 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ── the drawer ───────────────────────────────────────────────────────────── */
  var SLOT_W = 1.5, SLOT_D = 2.6, WALL = 0.09, DEPTH = 0.85;
  var TRAY_W = SLOTS.length * SLOT_W + WALL;
  var woodMat = new THREE.MeshStandardMaterial({ color: 0x1b2b3a, roughness: 0.6, metalness: 0.25 });
  var tray = new THREE.Group();
  scene.add(tray);

  var floor = new THREE.Mesh(new THREE.BoxGeometry(TRAY_W, 0.16, SLOT_D), woodMat);
  floor.position.y = 0.08;
  floor.receiveShadow = true;
  floor.castShadow = true;
  tray.add(floor);
  for (var i = 0; i <= SLOTS.length; i++) {
    var wall = new THREE.Mesh(new THREE.BoxGeometry(WALL, DEPTH, SLOT_D), woodMat);
    wall.position.set(-TRAY_W / 2 + i * SLOT_W + WALL / 2, DEPTH / 2 + 0.16, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    tray.add(wall);
  }
  var backW = new THREE.Mesh(new THREE.BoxGeometry(TRAY_W, DEPTH, WALL), woodMat);
  backW.position.set(0, DEPTH / 2 + 0.16, -SLOT_D / 2);
  backW.castShadow = true;
  tray.add(backW);
  var frontW = new THREE.Mesh(new THREE.BoxGeometry(TRAY_W, DEPTH * 0.62, WALL), woodMat);
  frontW.position.set(0, (DEPTH * 0.62) / 2 + 0.16, SLOT_D / 2);
  frontW.castShadow = true;
  tray.add(frontW);

  /* the slot labels live IN the scene: they belong to the object, so they orbit and take the DOF */
  var slotX = [];
  SLOTS.forEach(function (name, i) {
    var x = -TRAY_W / 2 + WALL + SLOT_W / 2 + i * SLOT_W;
    slotX.push(x);
    var lbl = HF3.textPlane(THREE, name, {
      height: 0.12, weight: 800,
      color: i === 0 ? "#ffd37a" : "#9fb6cd",
      bg: "rgba(4,8,12,0.92)", border: i === 0 ? "rgba(255,176,32,0.9)" : "rgba(80,100,122,0.7)",
    });
    lbl.position.set(x, 0.34, SLOT_D / 2 + 0.12);
    lbl.rotation.x = -Math.PI / 2.5;
    tray.add(lbl);
  });

  /* ── the coins ────────────────────────────────────────────────────────────── */
  var coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.09, 26);
  var earnedMat = new THREE.MeshStandardMaterial({ color: 0xe8b64a, roughness: 0.36, metalness: 0.72 });
  var leftMat = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.3, metalness: 0.8, emissive: 0x3a2604, emissiveIntensity: 0.55 });
  var rnd = HF3.rng(17);

  function coin(mat) {
    var m = new THREE.Mesh(coinGeo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  /* what the text earns, slot by slot */
  var earned = [];
  EARNED.forEach(function (n, s) {
    for (var k = 0; k < n; k++) {
      earned.push({
        m: coin(earnedMat), slot: s, k: k,
        jx: (rnd() - 0.5) * 0.5, jz: (rnd() - 0.5) * 1.2, rot: rnd() * 3.14,
      });
    }
  });
  /* and the change — all of it into slot 0 */
  var change = [];
  for (var c = 0; c < LEFTOVER; c++) {
    change.push({
      m: coin(leftMat), k: c,
      jx: (rnd() - 0.5) * 0.72, jz: (rnd() - 0.5) * 1.5, rot: rnd() * 3.14,
    });
  }

  var key = HF3.rig(THREE, scene, { extent: 12, ambient: 0.5, key: 3.0, rim: 1.5 });
  key.position.set(4.5, 9.0, 6.0);
  /* a warm point light over the sink slot: the heap has to read as the brightest thing in the room */
  var sinkLight = new THREE.PointLight(0xffb020, 0, 9, 2);
  sinkLight.position.set(slotX[0], 2.4, 0.6);
  scene.add(sinkLight);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 6.0, maxCoc: 18 });
  var focus = new THREE.Vector3();

  var DROP_H = 5.2;
  function place(o, p, x, yTop) {
    /* a coin falls in: it is above the slot until p, then rests where it lands */
    var y = HF3.mix(DROP_H, yTop, HF3.outCubic(p));
    o.m.position.set(x + o.jx, y, o.jz * 0.6);
    o.m.rotation.set(0.12 * Math.sin(o.rot + p * 6), o.rot, 0.1 * Math.cos(o.rot + p * 4));
    o.m.visible = p > 0.001;
  }

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* the earned coins are counted out during the first half — fair, small, unremarkable */
    var eFrom = beatAt(0, 0.02) + 0.6, eTo = Math.max(b3 - 0.6, eFrom + 1.6);
    var eStep = (eTo - eFrom) / Math.max(earned.length, 1);
    earned.forEach(function (o, i) {
      var p = HF3.span(t, eFrom + i * eStep, eFrom + i * eStep + eStep * 2.6);
      place(o, p, slotX[o.slot], 0.22 + o.k * 0.1);
    });

    /* then the leftover is poured into the first slot and heaps up */
    var cFrom = b3 + 0.2, cTo = Math.max(b5 - 0.2, cFrom + 1.8);
    var cStep = (cTo - cFrom) / Math.max(change.length, 1);
    var heaped = 0;
    change.forEach(function (o, i) {
      var p = HF3.span(t, cFrom + i * cStep, cFrom + i * cStep + cStep * 2.2);
      var row = Math.floor(o.k / 4);
      place(o, p, slotX[0], 0.22 + row * 0.11 + (o.k % 4) * 0.012);
      if (p > 0.9) heaped++;
    });
    sinkLight.intensity = 3.5 * HF3.span(t, cFrom, cTo) + 1.5 * heaped / LEFTOVER;

    /* camera: high enough to see INTO the drawer (a drawer shot edge-on is a strip), then in on the
       slot that took the change. Distance solved from the content, angle fixed at ~34 degrees. */
    var close = HF3.inOutCubic(HF3.span(t, b4, Math.min(b5 + 1.2, D)));
    var dist = HF3.mix(fitZ(TRAY_W * 1.0), fitZ(SLOT_W * 4.6), close);
    var ang = HF3.mix(0.66, 0.46, close);            // radians above the tray plane
    var cx = HF3.mix(0, slotX[0] + SLOT_W * 1.1, close);
    camera.position.set(cx, dist * Math.sin(ang), dist * Math.cos(ang));
    camera.lookAt(cx, HF3.mix(0.35, 0.55, close), 0);

    focus.set(HF3.mix(0, slotX[0], close), 0.5, 0);
    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
