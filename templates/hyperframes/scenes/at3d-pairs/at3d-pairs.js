/* at3d-pairs — 023 s17 (3D). Per pair, not per word.
 *
 * Shot: seven token blocks standing in a ring, each with its word readable on the face. First the
 * cheap picture — one lookup per word, seven wires to the centre. Then the real one: every block
 * connects to every other block and the ring fills with wire. The camera lifts so the lattice reads
 * as a volume, not a diagram, and the pair counter runs to 49.
 *
 * Every mark comes from S.beatAt(...); the camera distance is solved from the ring's radius.
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at3d-pairs", width: 1920, height: 1080, frames: 381, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
function px(n) { return n * U + "px"; }

var TOKENS = props.tokens && props.tokens.length ? props.tokens : ["The", "vendor", "code", "for", "Ridgeway", "is", "RW-88"];
var N = TOKENS.length;
var PAIRS = N * N;

/* the props carry "7 lookups" / "49 comparisons"; the number is the counter, so the label drops it */
function unit(v, dflt) { return String(v == null ? dflt : v).replace(/^\s*[\d,]+\s*/, "") || dflt; }
document.getElementById("cwl").textContent = unit(props.perWord, "lookups");
document.getElementById("cpl").textContent = unit(props.perPair, "comparisons");
document.getElementById("cwv").textContent = String(N);
document.getElementById("kickertext").textContent = props.title || "Per pair. Not per word.";

var b1 = beatAt(1, 0.34);   // "The scoring is not done per word."
var b2 = beatAt(2, 0.58);   // "It is done per pair — every piece of text against every other piece."

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#cntWord", { opacity: 0, y: px(-12) });
gsap.set("#cntPair", { opacity: 0, y: px(-12) });
gsap.set("#kicker", { opacity: 0, y: px(22) });

tl.to("#cntWord", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b1);
tl.to("#cntPair", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b2);
FX_count(tl, document.getElementById("cpv"), 0, PAIRS, b2 + 0.1, Math.max(D - b2 - 0.8, 1.0));
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b2 + 0.5);
HF.register("at3d-pairs", tl);

/* a counter without FX (this scene does not load hf-fx: the stage here is the room) */
function FX_count(timeline, node, from, to, at, dur) {
  var p = { v: from };
  node.textContent = String(from);
  timeline.to(p, {
    v: to, duration: dur, ease: "power2.out",
    onUpdate: function () { node.textContent = String(Math.round(p.v)); },
  }, at);
}

/* ── the room ────────────────────────────────────────────────────────────────── */
var NEAR = 0.4, FAR = 70, FOV = 42;
var FRAME_FILL = P ? 0.92 : 0.78;
function fitZ(worldW) {
  return (worldW / FRAME_FILL) / (2 * Math.tan((FOV * Math.PI) / 360) * (W / H));
}

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.022);
  var camera = new THREE.PerspectiveCamera(FOV, W / H, NEAR, FAR);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x070c12, roughness: 0.97 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* the ring of tokens — blocks standing upright, each face-on to the centre */
  var R = 5.2, BW = 2.1, BH = 1.15, BD = 0.5;
  var blocks = [], pts = [];
  for (var i = 0; i < N; i++) {
    var a = (i / N) * Math.PI * 2 - Math.PI / 2;
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(BW, BH, BD),
      new THREE.MeshStandardMaterial({ color: 0x2c3e51, roughness: 0.5, metalness: 0.3 }),
    );
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    var face = HF3.textPlane(THREE, TOKENS[i], { height: 0.2, weight: 800, color: "#f2f7fc" });
    face.position.set(0, 0, BD / 2 + 0.02);
    g.add(face);
    var back = HF3.textPlane(THREE, TOKENS[i], { height: 0.2, weight: 800, color: "#f2f7fc" });
    back.position.set(0, 0, -BD / 2 - 0.02);
    back.rotation.y = Math.PI;
    g.add(back);
    g.position.set(Math.cos(a) * R, BH / 2 + 0.1, Math.sin(a) * R);
    g.rotation.y = -a + Math.PI / 2;      // face the centre, standing upright — never tipped
    scene.add(g);
    blocks.push(g);
    pts.push(g.position.clone());

    /* a label lying FLAT on the block top, added at scene level so it never rotates with the ring —
       the camera looks down on the lattice, and from up there this is the readable face. */
    var top = HF3.textPlane(THREE, TOKENS[i], {
      height: 0.26, weight: 800, color: "#ffd37a",
      bg: "rgba(4,8,12,0.88)", border: "rgba(255,176,32,0.55)",
    });
    top.rotation.x = -Math.PI / 2;
    top.position.set(g.position.x, BH + 0.16, g.position.z);
    scene.add(top);
  }

  /* the cheap picture: one lookup each, to the centre */
  var naive = [];
  var naiveMat = new THREE.LineBasicMaterial({ color: 0x63a8ec, transparent: true, opacity: 0 });
  for (var k = 0; k < N; k++) {
    var geo = new THREE.BufferGeometry().setFromPoints([pts[k].clone(), new THREE.Vector3(0, 1.0, 0)]);
    var line = new THREE.Line(geo, naiveMat);
    scene.add(line);
    naive.push(line);
  }

  /* the real one: every block against every other block */
  var pairMat = new THREE.LineBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0 });
  var pairs = [];
  for (var a1 = 0; a1 < N; a1++) {
    for (var a2 = a1 + 1; a2 < N; a2++) {
      var pg = new THREE.BufferGeometry().setFromPoints([pts[a1].clone(), pts[a2].clone()]);
      var pl = new THREE.Line(pg, pairMat.clone());
      pl.material.opacity = 0;
      scene.add(pl);
      pairs.push(pl);
    }
  }

  var key = HF3.rig(THREE, scene, { extent: 12, ambient: 0.55, key: 2.6, rim: 1.8 });
  key.position.set(5.0, 10.0, 6.0);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 7.0, maxCoc: 14 });
  var focus = new THREE.Vector3(0, 1.0, 0);

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* the naive wires come up, then dim as the truth arrives */
    var nOn = HF3.span(t, b1, b1 + 0.5) * (1 - 0.75 * HF3.span(t, b2, b2 + 0.6));
    naiveMat.opacity = 0.5 * nOn;

    /* the lattice fills in, wire by wire */
    var span = Math.max(D - 0.5 - b2, 1.0);
    var step = span / pairs.length;
    for (var i = 0; i < pairs.length; i++) {
      var p = HF3.span(t, b2 + i * step * 0.85, b2 + i * step * 0.85 + step * 3.0);
      pairs[i].material.opacity = 0.62 * p;
    }

    /* the camera lifts as the wire fills, so the graph reads as a volume, not a diagram */
    var lift = HF3.inOutCubic(HF3.span(t, b2 - 0.3, D));
    var dist = fitZ((R + BW) * 2);
    var ang = HF3.mix(0.16, 0.62, lift);
    var spin = HF3.mix(-0.12, 0.22, HF3.span(t, 0, D));
    camera.position.set(Math.sin(spin) * dist * Math.cos(ang), dist * Math.sin(ang) + 0.6, Math.cos(spin) * dist * Math.cos(ang));
    camera.lookAt(0, HF3.mix(0.9, 0.5, lift), 0);

    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
