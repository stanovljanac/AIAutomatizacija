/* at3d-hook-v11 — 023 s1 (hook hero, 3D). V1.1: the rebuilt opener.
 *
 * THE SHOT. We are looking at a whole AI chat window standing face-on in a dark room — title strip,
 * message bubbles, an input box with a caret — and we can see all four of its edges. Inside it, a
 * short question has already been answered well. Then the viewer's habit arrives: four pasted blocks
 * slam into the thread, the content scrolls under the window's own top edge, and the scrollbar thumb
 * collapses to a stub. The good answer STAYS pinned at the top of the content area, so when the new
 * reply lands at the bottom — one line, alone, in the only pool of light left — the comparison is in
 * the same frame instead of in the viewer's memory.
 *
 * WHAT THIS FIXES vs at3d-hook (owner review, 2026-08-23):
 *   · the object is established before it is attacked, and NEVER leaves the frame (FRAME_FILL caps
 *     at 0.66, and the window is a fixed-size object — the CONTENT grows, not the box);
 *   · exactly one thing is lit per beat, so there is somewhere to look;
 *   · every flat word rides on its own opaque plate (the CSS owns that), and what is struck exits
 *     at 0 instead of parking at 0.24.
 *
 * EVERY MARK COMES FROM S.beatAt(...), never from a literal second (MOTION_SPEC §11) — the scene has
 * to fill whatever window the alignment gives it.
 *
 * Panels stay FACE-ON (no resting 3D tilt — VISUAL_IDENTITY / owner rule); the camera does the
 * dimensional work by dollying, not by tipping anything.
 *
 * Pure function of the HyperFrames seek clock; DOF + bloom from _lib/hf-three.js.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at3d-hook-v11", width: 1920, height: 1080, frames: 344, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, W = S.W, H = S.H, U = S.U, beatAt = S.beatAt, props = S.props, P = S.portrait;
function px(n) { return n * U + "px"; }

document.getElementById("myth").textContent = props.myth || "losing focus";
document.getElementById("kickertext").textContent = props.title || "It doesn't focus. It spends.";
document.getElementById("blbltext").textContent = props.budgetLabel || "the total";

/* ── what is in the thread ───────────────────────────────────────────────────────
   Built from the SAME props contract the old hook used, so the scene-plan only swaps hf_scene. */
var PASTED = (props.promptLines && props.promptLines.length ? props.promptLines : [
  "Here is everything about the Ridgeway account.",
  "Attached: the full onboarding brief, the old",
  "contract, last quarter's notes and the vendor",
  "sheet. The invoice question is somewhere in",
  "there. Please read all of it before you answer,",
  "and pay special attention to the important parts.",
]);
var ANSWER_FULL = props.answerFull || "Ridgeway's vendor code is RW-88, used on the August invoice run.";
var ANSWER_THIN = props.answerThin || "Ridgeway is a vendor.";

/** Split a sentence into <= n lines of roughly equal length, on word boundaries. */
function wrap(text, per) {
  var words = String(text).split(" "), out = [], line = "";
  for (var i = 0; i < words.length; i++) {
    var next = line ? line + " " + words[i] : words[i];
    if (next.length > per && line) { out.push(line); line = words[i]; } else { line = next; }
  }
  if (line) out.push(line);
  return out;
}

/* The thread, in order. `at` is the flood index (null = present from frame 1). The four pasted
   blocks are the viewer's own habit: a titled attachment plus the body nobody will ever read. */
var THREAD = [
  { side: "user", lines: wrap(PASTED[0] || "Here is everything about the Ridgeway account.", 30) },
  { side: "ai", lines: wrap(ANSWER_FULL, 34), good: true },
  { side: "user", at: 0, title: "onboarding-brief.pdf", ruled: 6 },
  { side: "user", at: 1, title: "contract-2019.pdf", ruled: 5 },
  { side: "user", at: 2, title: "Q2-review-thread.txt", ruled: 7 },
  { side: "user", at: 3, title: "vendor-sheet-v4.xlsx", ruled: 6 },
];
var FLOOD = 4;

/* ── beats ───────────────────────────────────────────────────────────────────── */
var b1 = beatAt(1, 0.14);                        // "The answer came back worse."
var b2 = beatAt(2, 0.34);                        // "Everyone calls that losing focus."
var b3 = beatAt(3, 0.56);                        // "It has no focus to lose…"
var ESTABLISH = Math.min(0.55, b1 * 0.34);       // the chat reads as a chat BEFORE anything moves
var PASTE_END = Math.max(b1 - 0.22, ESTABLISH + 0.35);

/* ── the flat type layer ─────────────────────────────────────────────────────── */
var tl = gsap.timeline({ paused: true });
gsap.set("#mythwrap", { opacity: 0, y: px(52) });
gsap.set("#cone", { opacity: 0, scaleY: 0.7 });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#budget", { opacity: 0 });
gsap.set("#bfill", { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: px(28) });
gsap.set("#scrim", { opacity: 0 });

/* the room only ever dims UNDER a plate, never instead of one */
tl.to("#scrim", { opacity: 0.55, duration: 0.5, ease: "sine.out" }, b2 - 0.1);
tl.to("#mythwrap", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b2);
tl.to("#cone", { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }, b2 + 0.12);

/* the strike, then the cone collapses INTO the bar: the wrong picture becomes the right one */
tl.to("#slash", { scaleX: 1, duration: 0.28, ease: "power3.out" }, b3);
tl.to("#cone", { opacity: 0, scaleY: 0.1, duration: 0.36, ease: "power3.in" }, b3 + 0.12);
/* KILLED MEANS GONE. The old hook parked the struck myth at 0.24 and it read as a smudge under the
   next line — the single clearest note in the owner's review. */
tl.to("#mythwrap", { opacity: 0, y: px(-40), duration: 0.36, ease: "power2.in" }, b3 + 0.3);
tl.to("#scrim", { opacity: 0.60, duration: 0.5, ease: "sine.inOut" }, b3 + 0.3);
tl.to("#budget", { opacity: 1, duration: 0.28 }, b3 + 0.42);
/* it does not fill up to something — it arrives already spent to the last cent */
tl.to("#bfill", { scaleX: 1, duration: 0.5, ease: "power4.out" }, b3 + 0.48);
tl.to("#kicker", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b3 + 0.74);
HF.register("at3d-hook-v11", tl);

/* ── the room ────────────────────────────────────────────────────────────────── */
var NEAR = 0.5, FAR = 70;
var FOV = 40;
/* how much of the frame WIDTH the window holds. It is capped well under 1 on purpose: the whole
   defect being fixed is that the old scene filled 80% and grew past both edges, so the viewer never
   saw what the object was. */
var FILL_OPEN = P ? 0.90 : 0.58;
var FILL_PUSH = P ? 0.96 : 0.66;
var FILL_BACK = P ? 0.84 : 0.50;
function fitZ(worldW, fill) {
  var visW = worldW / fill;
  return visW / (2 * Math.tan((FOV * Math.PI) / 360) * (W / H));
}

HF3.boot(function (THREE) {
  var renderer = HF3.renderer(THREE, document.getElementById("gl"), W, H);
  /* the content scrolls UNDER the window's own chrome — that is what makes it read as a window and
     not as a growing slab. Local clipping planes are the only way to get a real mask in 3D. */
  renderer.localClippingEnabled = true;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070b, 0.019);
  var camera = new THREE.PerspectiveCamera(FOV, W / H, NEAR, FAR);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: 0x06090e, roughness: 0.98, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6.4;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ── the window shell: a real app frame, and it never changes size ─────────── */
  var WIN_W = P ? 6.4 : 8.8, WIN_H = P ? 8.6 : 5.3;
  var CHROME = 0.46;                 // the title strip
  var INPUT = 0.78;                  // the composer at the bottom
  var PADX = 0.34;
  var GUTTER = 0.40;                 // reserved for the scrollbar — bubbles never enter it
  var TOP = WIN_H / 2 - CHROME;      // content area, world Y
  var BOT = -WIN_H / 2 + INPUT;
  var LINE_H = P ? 0.30 : 0.24;      // cap height of body type
  var PITCH = LINE_H * 1.30;

  var shell = new THREE.Group();
  scene.add(shell);

  var body = new THREE.Mesh(
    new THREE.BoxGeometry(WIN_W, WIN_H, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x0c141d, roughness: 0.78, metalness: 0.12 }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  shell.add(body);

  /* the title strip — the single cheapest signal that this is an APP and not a page of text */
  var strip = new THREE.Mesh(
    new THREE.BoxGeometry(WIN_W - 0.06, CHROME, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x16232f }),
  );
  strip.position.set(0, WIN_H / 2 - CHROME / 2, 0.18);
  shell.add(strip);
  var dot = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), new THREE.MeshBasicMaterial({ color: 0xffb020 }));
  dot.position.set(-WIN_W / 2 + PADX, WIN_H / 2 - CHROME / 2, 0.2);
  shell.add(dot);
  var title = HF3.textPlane(THREE, "New chat", { height: LINE_H * 0.78, align: "left", weight: 600, color: "#8ea3b8" });
  title.position.set(-WIN_W / 2 + PADX + 0.16, WIN_H / 2 - CHROME / 2, 0.2);
  shell.add(title);

  /* the composer, with the caret that says a human is at the other end of this */
  var composer = new THREE.Mesh(
    new THREE.BoxGeometry(WIN_W - PADX * 2, INPUT - 0.24, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x101c27 }),
  );
  composer.position.set(0, -WIN_H / 2 + INPUT / 2, 0.18);
  shell.add(composer);
  var caret = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, LINE_H * 0.9, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xffb020 }),
  );
  caret.position.set(-WIN_W / 2 + PADX + 0.22, -WIN_H / 2 + INPUT / 2, 0.21);
  shell.add(caret);
  /* the send affordance — a small gold chevron plate on the right of the composer */
  var send = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.3, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x3a2c10 }),
  );
  send.position.set(WIN_W / 2 - PADX - 0.32, -WIN_H / 2 + INPUT / 2, 0.21);
  shell.add(send);

  /* the gold rail down the leading edge — the family's vocabulary */
  var rail = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, WIN_H, 0.36),
    new THREE.MeshBasicMaterial({ color: 0xffc84a }),
  );
  rail.position.set(-WIN_W / 2 + 0.03, 0, 0.02);
  shell.add(rail);

  /* ── the scroll region ────────────────────────────────────────────────────── */
  /* World-space clip planes, so the content is cut by the window's chrome exactly. They are static
     because the window never moves in world space — only the camera does. */
  var clipTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), TOP);
  var clipBot = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOT);
  var CLIP = [clipTop, clipBot];

  var scroll = new THREE.Group();
  shell.add(scroll);

  var dimmable = [];    // everything that steps back when the reply lands
  /**
   * Register a mesh into the scroll region.
   *
   * `transparent` is deliberately LEFT OFF and the base colour is cached instead, because the whole
   * class of defects the owner flagged on this cut is one thing showing through another. A bubble
   * that recedes by dropping its alpha lets whatever is behind it print straight through its face —
   * which is how a sticky header ended up with an attachment's filename running across it. Recessing
   * by COLOUR keeps every surface opaque, so nothing in this scene can ever double-expose.
   */
  function reg(mesh) {
    mesh.material.clippingPlanes = CLIP;
    mesh.material.clipShadows = true;
    mesh._base = mesh.material.color.clone();
    dimmable.push(mesh);
    return mesh;
  }
  /** Recess a registered mesh toward the room: k=0 is its own colour, k=1 is fully stepped back. */
  function recess(mesh, k) {
    mesh.material.color.copy(mesh._base).multiplyScalar(1 - 0.48 * k);
  }

  /**
   * One message bubble. Sized to its content, face-on, side-anchored. `ruled` draws real ruled text
   * at real leading so an attachment is never an empty rounded rect (the frame gate scores a flat
   * fill as no detail — 2026-08-22 lesson).
   */
  function bubble(spec) {
    var g = new THREE.Group();
    var isUser = spec.side === "user";
    var rows = (spec.lines ? spec.lines.length : 0) + (spec.title ? 1 : 0) + (spec.ruled || 0);
    var h = 0.30 + rows * PITCH;

    /* THE BUBBLE IS SIZED TO ITS TEXT, never to a guessed fraction of the window. The first pass
       used WIN_W * 0.58 and the longest line ran past the window's right edge and over the
       scrollbar — the exact class of overlap the owner flagged across the cut. Measure first. */
    var texts = [];
    if (spec.title) texts.push(HF3.textPlane(THREE, spec.title, { height: LINE_H * 0.84, align: "left", weight: 700, color: spec.ruled ? "#8a5f10" : "#ffd37a" }));
    (spec.lines || []).forEach(function (ln) {
      texts.push(HF3.textPlane(THREE, ln, { height: LINE_H, align: "left", weight: 500, color: spec.good ? "#ffe9bd" : "#dfe9f4" }));
    });
    var textW = 0;
    for (var m = 0; m < texts.length; m++) if (texts[m]._w > textW) textW = texts[m]._w;
    var MAXW = WIN_W - PADX * 2 - GUTTER;
    var w = Math.min(Math.max(textW + 0.48, WIN_W * 0.34), MAXW);
    if (spec.ruled) w = MAXW * 0.94;   // an attachment block always reads as a full-width paste

    var paper = !!spec.ruled;
    var skin = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.06),
      new THREE.MeshStandardMaterial({
        color: paper ? 0xdae3ed : isUser ? 0x1b2a3a : 0x14202c,
        roughness: paper ? 0.92 : 0.66, metalness: paper ? 0.0 : 0.1,
        emissive: spec.good ? 0x2a1d05 : 0x000000, emissiveIntensity: spec.good ? 0.5 : 0,
      }),
    );
    skin.position.z = 0.19;
    g.add(reg(skin));

    /* the speaker rail: gold for the model, steel for you — readable at a glance, no labels */
    var edge = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, h, 0.02),
      new THREE.MeshBasicMaterial({ color: paper ? 0xe0b866 : isUser ? 0x4c6076 : 0xffb020 }),
    );
    edge.position.set(isUser ? w / 2 - 0.022 : -w / 2 + 0.022, 0, 0.23);
    g.add(reg(edge));

    var y = h / 2 - 0.15 - LINE_H / 2;
    for (var n = 0; n < texts.length; n++) {
      texts[n].position.set(-w / 2 + 0.24, y, 0.24);
      g.add(reg(texts[n]));
      y -= PITCH;
    }
    /* the body nobody reads — ragged ruled lines, so it has real page texture */
    for (var k = 0; k < (spec.ruled || 0); k++) {
      var frac = k % 4 === 0 ? 0.56 : k % 3 === 0 ? 0.82 : 0.95;
      var rw = (w - 0.5) * frac;
      var r = new THREE.Mesh(
        new THREE.BoxGeometry(rw, LINE_H * 0.2, 0.02),
        new THREE.MeshBasicMaterial({ color: paper ? 0x74889e : 0x40556b }),
      );
      r.position.set(-w / 2 + 0.24 + rw / 2, y, 0.24);
      g.add(reg(r));
      y -= PITCH;
    }

    g.position.x = isUser ? WIN_W / 2 - PADX - GUTTER - w / 2 : -WIN_W / 2 + PADX + w / 2;
    g._h = h;
    g._spec = spec;
    return g;
  }

  var bubbles = THREAD.map(function (spec) {
    var b = bubble(spec);
    scroll.add(b);
    return b;
  });
  /* Everything registered SO FAR is the thread — the thing that steps back. The reply built next
     must not be in that list, or the beat would dim the one object it exists to light. */
  var threadMats = dimmable.length;
  var thin = bubble({ side: "ai", lines: [ANSWER_THIN] });
  scroll.add(thin);

  var GAP = 0.22;
  var goodIdx = 1;   // the answer that stays pinned at the top of the scroll

  /* the scrollbar: the thumb collapses as the paste grows — "there is always more of this" */
  var trackMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, TOP - BOT, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x1d2c3c }),
  );
  trackMesh.position.set(WIN_W / 2 - GUTTER / 2, (TOP + BOT) / 2, 0.2);
  shell.add(trackMesh);
  var thumb = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 1, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x7d8fa3 }),
  );
  thumb.position.x = WIN_W / 2 - GUTTER / 2;
  thumb.position.z = 0.21;
  shell.add(thumb);

  var key = HF3.rig(THREE, scene, { extent: 13, ambient: 0.48, key: 2.5, rim: 1.6 });
  key.position.set(4.6, 8.4, 7.2);

  var post = HF3.composite(THREE, renderer, W, H, { near: NEAR, far: FAR, range: 6.4, maxCoc: 15 });
  var focus = new THREE.Vector3();

  /* ── the shot ─────────────────────────────────────────────────────────────── */
  function renderAt(time) {
    var t = HF3.clamp(time, 0, D);

    /* how much of the flood has arrived: 0 at ESTABLISH, all four by PASTE_END, one at a time */
    var grow = HF3.outCubic(HF3.span(t, ESTABLISH, PASTE_END));
    var floodF = grow * FLOOD;
    var arrived = Math.floor(floodF + 1e-6);
    var frac = HF3.clamp(floodF - arrived, 0, 1);

    /* the reply lands at b1 and is the only lit thing after it */
    var ap = HF3.outCubic(HF3.span(t, b1, b1 + 0.42));
    /* the whole thread steps BACK when the reply arrives — one lit object per beat */
    var recede = HF3.inOutCubic(HF3.span(t, b1 - 0.1, b1 + 0.5));

    /* ── lay the thread out top-down, then scroll it so the newest sits at the bottom ── */
    var y = 0;
    var tops = [];
    for (var i = 0; i < bubbles.length; i++) {
      var spec = bubbles[i]._spec;
      var vis = spec.at == null || spec.at < arrived || (spec.at === arrived && frac > 0);
      bubbles[i].visible = vis;
      tops.push(y);
      if (vis) y -= bubbles[i]._h + GAP;
    }
    var thinTop = y;
    if (ap > 0.001) y -= thin._h + GAP;
    var contentH = -y;

    /* A real chat is BOTTOM-anchored: the newest message sits on the composer and the empty room
       is above it, under the title strip. Top-anchoring it (the first pass) left a dead slab in the
       middle of the establishing frame with the thread floating at the top. */
    var viewH = TOP - BOT;
    scroll.position.y = BOT + contentH;

    for (var j = 0; j < bubbles.length; j++) {
      if (!bubbles[j].visible) continue;
      var yy = tops[j] - bubbles[j]._h / 2;
      /* the newest block shoves in from below and settles — the viewer's own paste, mirrored. It
         arrives by MOVING, not by fading: a page sliding into place under the one above it is what
         pasting looks like, and it keeps every surface opaque. */
      if (bubbles[j]._spec.at === arrived) {
        var e = HF3.outCubic(HF3.span(frac, 0, 0.62));
        yy -= (1 - e) * (bubbles[j]._h * 0.9);
      }
      /* THE PIN: the good answer stops scrolling when it would leave through the TOP of the content
         area, so it is still on screen — and still readable — when the thin one lands under the
         flood. `yy` is a local offset and `scroll` slides up under it, so the clamp is a MIN: once
         wantTop drops below the natural slot, the natural slot is the one that has gone off-screen. */
      var pinned = false;
      if (j === goodIdx) {
        var wantTop = TOP - scroll.position.y - bubbles[j]._h / 2;
        pinned = wantTop < yy;
        if (pinned) yy = wantTop;
      }
      bubbles[j].position.y = yy;
      /* the pinned answer rides in FRONT of the flood sliding under it (a sticky header, not a
         double exposure), everything else steps back together when the reply lands */
      bubbles[j].position.z = pinned ? 0.14 : 0;
      bubbles[j]._pinned = pinned;
    }

    /* The thread recedes so there is somewhere to look — but it MUST STAY VISIBLE. The first pass
       faded it to 22% and the flood disappeared against the dark panel, so the money frame ("you
       pasted a mountain and got a stub") came back as an empty rectangle. Colour does the stepping
       back now, which is why the paste is still plainly a stack of pasted pages after the beat. */
    for (var d = 0; d < threadMats; d++) recess(dimmable[d], recede);
    /* …except the pinned good answer, which stays at FULL strength: it is the other half of the
       comparison the narration is making ("the answer came back worse" — worse than THAT one), and
       as a sticky header it is the one surface the flood scrolls underneath. */
    if (bubbles[goodIdx]._pinned) {
      bubbles[goodIdx].children.forEach(function (c) { recess(c, 0); });
    }

    thin.visible = ap > 0.02;
    /* the reply slides up into its slot; it never fades, so nothing ever shows through it */
    thin.position.y = thinTop - thin._h / 2 - HF3.mix(0.9, 0, ap);
    thin.position.z = 0;
    thin.scale.setScalar(HF3.mix(1.05, 1, ap));
    thin.children[0].material.emissiveIntensity = 0.5 * (1 - HF3.span(t, b1 + 0.4, b1 + 1.2)) + 0.18;

    /* the thumb collapses: there is always more of this than fits */
    var seen = HF3.clamp(viewH / Math.max(contentH, viewH), 0.08, 1);
    thumb.scale.y = viewH * seen;
    thumb.position.y = TOP - (viewH * seen) / 2;

    caret.material.opacity = t < PASTE_END ? 1 : 0.35;
    caret.material.transparent = true;

    /* ── camera: establish, push, then pull back and drop the window into the lower band so the
       top third is CLEAR for the budget bar. The window is never cropped and never leaves. ── */
    var push = HF3.inOutCubic(HF3.span(t, ESTABLISH, b2));
    var back = HF3.inOutCubic(HF3.span(t, b3 + 0.2, b3 + 1.1));
    var fill = HF3.mix(HF3.mix(FILL_OPEN, FILL_PUSH, push), FILL_BACK, back);
    /* looking ABOVE the window pushes it down the frame without tipping anything */
    var shift = back * (P ? 1.9 : 1.98);
    var z = fitZ(WIN_W, fill);
    camera.position.set(0, shift, z);
    camera.lookAt(0, shift, 0);

    /* focus rides the lit object: the thread, then the reply as it comes forward */
    focus.set(0, shift, 0.2);
    post.render(scene, camera, camera.position.distanceTo(focus));
  }

  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  renderAt(typeof window.__hfThreeTime === "number" ? window.__hfThreeTime : 0);
});
