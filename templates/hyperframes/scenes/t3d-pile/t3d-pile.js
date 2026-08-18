/* t3d-pile — 022 long s5, the 3D cut of cw-measured-run phase 1.
 *
 * One ordinary conversation piles up on a desk, page by page, and then a read bar travels the whole
 * stack top-to-bottom with the focal plane riding it down. That is the entire scene, because that is
 * the entire sentence: I took an ordinary chat, and I measured what the model actually read.
 *
 * EVERY TIME IS DERIVED FROM THE BEATS — the pile finishes building before the read starts, and the
 * read finishes with enough runway to settle, at whatever length the alignment hands the scene.
 *
 * Pure function of the HyperFrames seek clock; DOF + bloom from _lib/hf-three.js.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "t3d-pile", width: 1920, height: 1080, frames: 329, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props;
function px(n) { return n * U + "px"; }

document.getElementById("counter").textContent = props.counter || "16 messages · 8 requests";

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.30);                       // "So I took an ordinary chat…"
var RS = Math.min(b1 + 2.4, D - 4.6);           // the bar starts reading
var RE = D - 1.5;                               // …and finishes with runway to settle
var BUILD_END = RS - 0.55;                      // the pile is complete before it is read

/* ── the flat readout ────────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#counter", { opacity: 0, y: px(-12) });
tl.to("#counter", { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.8)" }, b1 + 0.7);
HF.register("t3d-pile", tl);

var NEAR = 0.5, FAR = 60;
/* PITCH is barely above THICK on purpose: any daylight between the sheets and the stack stops being
   a stack and becomes a set of shelves (measured on the first 022 3D pass, owner 2026-08-17). */
var PAGES = 16, PITCH = 0.042, THICK = 0.038;   // sixteen messages, sixteen sheets
var TOP_Y = (PAGES - 1) * PITCH;

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a10, 0.05);
  var camera = new THREE.PerspectiveCamera(32, W / H, NEAR, FAR);

  /* ── the desk it all sits on ──────────────────────────────────────────────── */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x070d14, roughness: 0.98, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.32;
  ground.receiveShadow = true;
  scene.add(ground);

  var desk = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.3, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x16232f, roughness: 0.72, metalness: 0.12 }),
  );
  desk.position.y = -0.16;
  desk.receiveShadow = true;
  desk.castShadow = true;
  scene.add(desk);

  /* ── the pages: real sheets with thickness, each shadowing the one beneath ── */
  var paperMat = new THREE.MeshStandardMaterial({ color: 0xdde6f0, roughness: 0.94, metalness: 0.0 });
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xf2cd86, roughness: 0.4, metalness: 0.55, emissive: 0xffb020, emissiveIntensity: 0.18,
  });
  var ruleMat = new THREE.MeshBasicMaterial({ color: 0x8fa3ba });
  var goldRule = new THREE.MeshBasicMaterial({ color: 0xb08a3c });
  var geo = new THREE.BoxGeometry(3.5, THICK, 2.45);
  var r = HF3.rng(41);
  var pages = [];
  for (var i = 0; i < PAGES; i++) {
    var mine = i % 2 === 0;                     // yours, then its answer, then yours…
    var g = new THREE.Group();
    /* only the NEWEST answer is gold paper; the other seven are ordinary sheets with gold ruling.
       Alternating gold bodies turned the stack into a striped block instead of a pile of paper. */
    var m = new THREE.Mesh(geo, i === PAGES - 1 ? goldMat : paperMat);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    /* ruled "text" on the face: the pages are only ever seen individually as they land, and a blank
       sheet landing reads as a slab. Three lines is enough to say "this is a message". */
    for (var k = 0; k < 3; k++) {
      var lw = 2.6 * (0.45 + r() * 0.5);
      var l = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.004, 0.06), mine ? ruleMat : goldRule);
      l.position.set(-1.3 + lw / 2, THICK / 2 + 0.0015, -0.55 + k * 0.42);
      g.add(l);
    }
    g._rest = i * PITCH;
    g._x = (r() - 0.5) * 0.2;
    g._z = (r() - 0.5) * 0.16;
    g._ry = (r() - 0.5) * 0.04;
    g.position.set(g._x, g._rest, g._z);
    g.rotation.y = g._ry;
    scene.add(g);
    pages.push(g);
  }

  HF3.rig(THREE, scene, { extent: 8 });

  /* what the stack IS — the label stands with the object it names */
  var subject = HF3.textPlane(THREE, props.subject || "one ordinary chat · a messy due-date column", {
    height: 0.26, color: "#cfe0f2",
  });
  subject.position.set(0, TOP_Y + 0.95, -0.1);
  subject.material.opacity = 0;
  scene.add(subject);

  /* ── the read bar, and the light it throws on the sheets around it ────────── */
  var bar = new THREE.Mesh(
    new THREE.BoxGeometry(4.05, 0.022, 2.95),
    new THREE.MeshBasicMaterial({ color: 0xffe6b4, toneMapped: false }),
  );
  bar.visible = false;
  scene.add(bar);
  var barLight = new THREE.PointLight(0xffb020, 0, 5, 2);
  scene.add(barLight);

  /* ── dust as real points: the DOF turns the out-of-focus ones into bokeh ──── */
  var dn = 110, dpos = new Float32Array(dn * 3), r2 = HF3.rng(7), drift = [];
  for (var j = 0; j < dn; j++) {
    dpos[j * 3] = (r2() - 0.5) * 16;
    dpos[j * 3 + 1] = r2() * 6.5 - 0.2;
    dpos[j * 3 + 2] = (r2() - 0.5) * 9 - 1.5;   // kept behind the stack, never right on the lens
    drift.push([(r2() - 0.5) * 0.5, 0.14 + r2() * 0.4]);
  }
  var dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  scene.add(new THREE.Points(dgeo, new THREE.PointsMaterial({
    color: 0xbcd6f2, size: 0.04, sizeAttenuation: true,
    transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending,
  })));
  var dbase = dpos.slice();

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 5.0, maxCoc: 16 });
  var focusTarget = new THREE.Vector3();

  /* ── the shot ─────────────────────────────────────────────────────────────── */
  var STEP = (BUILD_END - 0.15) / PAGES;

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);
    var u = t / D;

    /* the conversation piles up, message by message */
    for (var i = 0; i < PAGES; i++) {
      var g = pages[i];
      var appear = 0.15 + i * STEP;
      var p = HF3.outCubic(HF3.span(t, appear, appear + 0.42));
      g.visible = t >= appear;
      g.position.y = g._rest + (1 - p) * 1.5;
      g.rotation.y = g._ry * (1 + (1 - p) * 6);
    }

    subject.material.opacity = HF3.outCubic(HF3.span(t, b1, b1 + 0.45));

    /* the read bar travels the whole stack, and its light travels with it */
    var barY = HF3.mix(TOP_Y + 0.06, 0.02, HF3.span(t, RS, RE));
    bar.visible = t >= RS && t <= RE + 0.18;
    bar.position.set(0, barY, 0);
    barLight.position.set(0, barY + 0.22, 0.9);
    barLight.intensity = bar.visible ? Math.sin(HF3.span(t, RS, RS + 0.25) * Math.PI * 0.5) * 4.5 : 0;

    /* the camera orbits — the parallax between the sheets is the whole point of 3D */
    var a = -0.68 + 1.02 * HF3.inOutCubic(u);
    var R = 8.6 - 1.4 * u;
    camera.position.set(Math.sin(a) * R, 2.9 - 1.15 * u, Math.cos(a) * R);
    camera.lookAt(0, 0.46, 0);

    var dp = dgeo.attributes.position;
    for (var k = 0; k < dn; k++) {
      dp.array[k * 3] = dbase[k * 3] + drift[k][0] * t;
      dp.array[k * 3 + 1] = dbase[k * 3 + 1] + drift[k][1] * t;
    }
    dp.needsUpdate = true;

    /* rack focus: the focal plane rides the read bar down the stack, then settles on the top */
    focusTarget.set(0, t < RS ? TOP_Y * 0.55 : t > RE ? TOP_Y * 0.9 : barY, 0);
    post.render(scene, camera, camera.position.distanceTo(focusTarget));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
