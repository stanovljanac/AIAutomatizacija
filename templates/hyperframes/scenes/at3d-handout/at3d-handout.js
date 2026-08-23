/* at3d-handout — 023 s5 (3D).
 *
 * Shot: five real pages standing on a desk with readable text on them, a beam that is tried and
 * rejected, and a stack of gold chips that has to be handed out COMPLETELY before the model can
 * write its next word. Then it happens again, faster, for the word after that.
 *
 * Every mark comes from S.beatAt(...). Geometry is derived from the content and the camera distance
 * is SOLVED (fitZ) so the row fills the frame at any duration or aspect.
 *
 * Pure function of the HyperFrames seek clock. VARIABLES CONTRACT: fps,width,height,durationFrames,
 * durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at3d-handout", width: 1920, height: 1080, frames: 482, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
function px(n) { return n * U + "px"; }

var PIECES = props.pieces && props.pieces.length ? props.pieces : ["your brief", "the contract", "the notes", "the vendor sheet", "your question"];
var BODY = [
  ["onboarded in March", "accounts desk, not site", "terms agreed by email", "POs raised monthly", "site visits booked ahead", "escalate to account lead", "no direct supplier calls", "review notes attached"],
  ["§4 net thirty", "§9 renewal automatic", "§11 disputed lines held", "§14 notices by email", "§16 rates fixed for term", "§18 audit on request", "§21 assignment barred", "§24 governing law"],
  ["Q2 volumes steady", "two credit notes, closed", "no open disputes", "review booked October", "lead time down a day", "depot change has held", "one short shipment, June", "credited same week"],
  ["Ridgeway Supplies Ltd", "vendor code RW-88", "invoice run: August", "status: active", "terms: net 30", "category: supplies", "owner: accounts desk", "duplicate check: clean"],
  ["which vendor code", "goes on the August", "invoice for Ridgeway?", "answer with the code", "do not summarise the", "contract, do not restate", "the brief, the code is", "on one page above"],
];
var SHARE = [3, 4, 2, 7, 4];                       // 20 chips = the whole total, dealt in this order
var TOTAL_CHIPS = 20;
var REPEATS = props.repeats && props.repeats.length ? props.repeats : ["the", "vendor", "code", "is"];

document.getElementById("myth").textContent = props.wrongLabel || "a beam sweeping your text";
document.getElementById("kickertext").textContent = props.title || "Handed out. Every word.";
document.getElementById("sval").textContent = props.sum || "1.0000000";
document.getElementById("wval").textContent = REPEATS[0];

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.10);                          // "Not a beam sweeping your text…"
var b2 = beatAt(2, 0.30);                          // "A fixed sum… handed out before it can write the next word."
var b3 = beatAt(3, 0.78);                          // "Every word."
var b4 = beatAt(4, 0.88);                          // "From scratch."

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#mythwrap", { opacity: 0, y: px(18) });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#sumchip", { opacity: 0, y: px(-12) });
gsap.set("#wordrow", { opacity: 0, y: px(-12) });
gsap.set("#kicker", { opacity: 0, y: px(26) });

tl.to("#mythwrap", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b1);
tl.to("#slash", { scaleX: 1, duration: 0.28, ease: "power3.out" }, b1 + 1.1);
tl.to("#mythwrap", { opacity: 0, duration: 0.34, ease: "power2.in" }, b1 + 1.5);
tl.to("#sumchip", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b2);
tl.to("#wordrow", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b2 + 0.6);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b4 + 0.2);
/* the word counter — a property tween, never a callback (the engine seeks) */
var wval = document.getElementById("wval"), wcnt = document.getElementById("wcnt");
var wp = { i: 0 };
wcnt.textContent = "1 / " + REPEATS.length;
tl.to(wp, {
  i: REPEATS.length - 0.001, duration: Math.max(D - b2 - 0.8, 1.2), ease: "none",
  onUpdate: function () {
    var k = Math.floor(wp.i);
    wval.textContent = REPEATS[k];
    wcnt.textContent = (k + 1) + " / " + REPEATS.length;
  },
}, b2 + 0.8);
HF.register("at3d-handout", tl);

/* ── the room ────────────────────────────────────────────────────────────────── */
var NEAR = 0.5, FAR = 80, FOV = 40;
var FRAME_FILL = P ? 0.94 : 0.86;
function fitZ(worldW) {
  return (worldW / FRAME_FILL) / (2 * Math.tan((FOV * Math.PI) / 360) * (W / H));
}

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.018);
  var camera = new THREE.PerspectiveCamera(FOV, W / H, NEAR, FAR);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x070c12, roughness: 0.97, metalness: 0.02 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* the desk the pages stand on */
  var desk = new THREE.Mesh(
    new THREE.BoxGeometry(26, 0.5, 9),
    new THREE.MeshStandardMaterial({ color: 0x16232f, roughness: 0.68, metalness: 0.14 }),
  );
  desk.position.set(0, -0.25, 0);
  desk.castShadow = true;
  desk.receiveShadow = true;
  scene.add(desk);

  /* ── the five pages, face-on, with real text ─────────────────────────────── */
  var PAGE_W = 2.7, PAGE_H = 5.6, GAP = 0.42;
  var ROW_W = PIECES.length * PAGE_W + (PIECES.length - 1) * GAP;
  var pages = [], slots = [];
  var paperMat = function (gold) {
    return new THREE.MeshStandardMaterial({ color: gold ? 0xf3ddaa : 0xe9eff6, roughness: 0.92, metalness: 0.0 });
  };
  for (var i = 0; i < PIECES.length; i++) {
    var g = new THREE.Group();
    var isQ = i === PIECES.length - 1;
    var body = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.09), paperMat(isQ));
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    var title = HF3.textPlane(THREE, PIECES[i], { height: 0.145, weight: 800, color: "#1b2b3b" });
    title.position.set(0, PAGE_H / 2 - 0.55, 0.06);
    g.add(title);
    var ruleBar = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W - 0.44, 0.035, 0.01), new THREE.MeshBasicMaterial({ color: 0x9fb0c2 }));
    ruleBar.position.set(0, PAGE_H / 2 - 0.85, 0.06);
    g.add(ruleBar);
    for (var k = 0; k < BODY[i].length; k++) {
      var ln = HF3.textPlane(THREE, BODY[i][k], { height: 0.105, weight: 500, color: i === 3 && k === 1 ? "#7a5a10" : "#465b70" });
      ln.position.set(0, PAGE_H / 2 - 1.28 - k * 0.54, 0.06);
      g.add(ln);
    }

    g.position.set(-ROW_W / 2 + PAGE_W / 2 + i * (PAGE_W + GAP), PAGE_H / 2, 0);
    scene.add(g);
    pages.push(g);
    slots.push(g.position.x);
  }

  /* ── the chips: the fixed sum, and the only thing that moves ─────────────── */
  var chipGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.1, 28);
  var chipMat = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.34, metalness: 0.75, emissive: 0x3a2604, emissiveIntensity: 0.5 });
  var CHIP_T = 0.12;
  var STACK = new THREE.Vector3(0, 0.14, 5.4);   // the whole total, in the foreground, before it moves
  var chips = [], plan = [];
  var acc = 0;
  for (var s = 0; s < SHARE.length; s++) {
    for (var c = 0; c < SHARE[s]; c++) {
      plan.push({ page: s, k: c });
      acc++;
    }
  }
  for (var n = 0; n < TOTAL_CHIPS; n++) {
    var m = new THREE.Mesh(chipGeo, chipMat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    chips.push(m);
  }

  /* the beam that is tried and found useless */
  var beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 2.1, 9, 28, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd37a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.set(0, 6.4, 2.4);
  scene.add(beam);

  var key = HF3.rig(THREE, scene, { extent: 16, ambient: 0.52, key: 2.8, rim: 1.6 });
  key.position.set(6.5, 11.0, 7.5);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 8.5, maxCoc: 15 });
  var focus = new THREE.Vector3();

  /* three deals, each faster than the last: what ACCUMULATES on screen is the escalation, and the
     stack is swept back up between them, never erased (MOTION_SPEC §10). */
  var DEALS = [
    { from: b2 + 1.0, to: Math.max(b3 - 0.45, b2 + 2.2) },
    { from: b3 + 0.25, to: Math.max(b4 - 0.15, b3 + 1.0) },
    { from: b4 + 0.2, to: Math.max(D - 0.3, b4 + 0.9) },
  ];

  function chipTarget(idx, out) {
    var p = plan[idx];
    var row = Math.floor(p.k / 4), col = p.k % 4;
    out.set(
      slots[p.page] + (col - 1.5) * 0.62,
      0.06 + row * CHIP_T,
      1.5 + row * 0.02,
    );
    return out;
  }
  var tgt = new THREE.Vector3();

  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* the beam: it sweeps the row, finds nothing it can switch off, and is struck */
    var bo = HF3.span(t, b1, b1 + 0.35) * (1 - HF3.span(t, b1 + 1.15, b1 + 1.6));
    beam.material.opacity = bo * 0.30;
    beam.position.x = HF3.mix(-ROW_W / 2, ROW_W / 2, HF3.inOutCubic(HF3.span(t, b1 + 0.1, b1 + 1.15)));
    pages.forEach(function (g, i) {
      var lit = 1 - Math.min(Math.abs(g.position.x - beam.position.x) / 2.4, 1);
      g.children[0].material.emissive = g.children[0].material.emissive || new THREE.Color(0x000000);
      g.children[0].material.emissive.setRGB(lit * bo * 0.22, lit * bo * 0.16, lit * bo * 0.05);
    });

    /* the stack arrives whole, is dealt out completely, is swept up, and is dealt again */
    var arrive = HF3.outCubic(HF3.span(t, b2, b2 + 0.7));
    for (var i2 = 0; i2 < chips.length; i2++) {
      var ch = chips[i2];
      var stackY = STACK.y + i2 * CHIP_T;
      var place = 0;
      for (var d = 0; d < DEALS.length; d++) {
        var slice = (DEALS[d].to - DEALS[d].from) / chips.length;
        var mine = DEALS[d].from + (chips.length - 1 - i2) * slice;
        var pp = HF3.outCubic(HF3.span(t, mine, mine + slice * 2.4));
        /* swept back up just before the next deal - the chips return, they never vanish */
        if (d < DEALS.length - 1) pp *= 1 - HF3.inOutCubic(HF3.span(t, DEALS[d + 1].from - 0.32, DEALS[d + 1].from));
        if (pp > place) place = pp;
      }
      chipTarget(i2, tgt);
      ch.position.set(
        HF3.mix(STACK.x, tgt.x, place),
        HF3.mix(stackY, tgt.y, place) + Math.sin(Math.PI * place) * 1.5,
        HF3.mix(STACK.z, tgt.z, place),
      );
      ch.rotation.z = place * 0.9;
      ch.visible = arrive > 0.02;
      ch.scale.setScalar(HF3.mix(0.2, 1, arrive));
    }

    /* camera: face-on to the row, easing in as the deal starts — never a tilt on the pages */
    var push = HF3.inOutCubic(HF3.span(t, b2, b2 + 1.6));
    /* the row sits LOW in frame on purpose: the top quarter is reserved for the flat type layer,
       so a label never has to land on a bright page (MOTION_SPEC §10). */
    var z = fitZ(ROW_W * HF3.mix(1.04, 0.98, push));
    var yc = PAGE_H * HF3.mix(0.66, 0.60, push);
    camera.position.set(0, yc, z);
    camera.lookAt(0, PAGE_H * HF3.mix(0.62, 0.56, push), 0);

    focus.set(0, PAGE_H * 0.5, HF3.mix(0, 1.6, push));
    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
