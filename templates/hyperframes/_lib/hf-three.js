/* hf-three.js — the shared 3D substrate for HyperFrames scenes that render with Three.js.
 *
 * WHY (2026-08-17): our whole scene library is 2D DOM + GSAP. HyperFrames ships a Three.js adapter
 * we had never used, so "real shadows, depth-of-field, a camera that orbits" was an untested claim.
 * The t3d-* test scenes are the evidence for that claim, and this file is the part of them worth
 * keeping: the render-target + composite pass that gives a 3D scene depth-of-field and bloom
 * WITHOUT vendoring anything from three/examples — the Three.js core build is the whole payload.
 *
 * Loaded as a CLASSIC script (like hf-scene.js / hf-fx.js), before the scene's own file:
 *   <script src="../../_lib/hf-three.js"></script>
 * Three.js itself arrives per-scene via a dynamic import() of window.__THREE_URL, because it is an
 * ES module and the vendored copy has to live INSIDE the scene dir (the HF file server roots there;
 * see hf-scene.js header). _lib/make-entry.mjs rewrites that URL for the generated entry.
 *
 * DETERMINISM IS THE CONTRACT, exactly as in 2D: a 3D scene renders from the HyperFrames seek clock
 * (window.__hfThreeTime + the `hf-seek` event), never from rAF/Date.now, and all jitter comes from
 * rng(seed). renderAt(time) must be a pure function of time.
 */
(function (global) {
  "use strict";

  /** mulberry32 — the same fixed-sequence PRNG FX.rng uses, so 2D and 3D scenes jitter alike. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  /** 0..1 progress of `t` across [a, b] */
  function span(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function outCubic(p) { return 1 - Math.pow(1 - p, 3); }
  function inOutCubic(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function mix(a, b, p) { return a + (b - a) * p; }

  /**
   * Build the composite pass: the scene renders into a render target that carries a depth texture,
   * and ONE fullscreen shader does
   *   · depth-of-field — a golden-angle disc whose radius is the depth delta to the focal plane,
   *     with the sample angle rotated per pixel so the disc does not read as a rosette, and
   *   · bloom — a wide bright-pass halo added back over the top.
   * It also encodes the result (a raw ShaderMaterial gets no colour-space chunk from Three.js).
   *
   * @param {object} THREE            the imported Three.js namespace
   * @param {THREE.WebGLRenderer} renderer
   * @param {number} W @param {number} H
   * @param {object} o  { near, far, range, maxCoc, bloom, threshold }
   * @returns {{ uniforms: object, render: function(scene, camera, focusDistance): void }}
   */
  function composite(THREE, renderer, W, H, o) {
    o = o || {};
    /* samples:4 = MSAA on the offscreen pass. Without it the render target is single-sampled, so
       every silhouette in a 3D scene is stair-stepped no matter what `antialias` the renderer was
       constructed with — that flag only ever applied to the default framebuffer we stopped drawing
       to. This was half of "the 3D clips look low quality" (owner, 2026-08-17). */
    var rt = new THREE.WebGLRenderTarget(W, H, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4,
    });
    rt.depthTexture = new THREE.DepthTexture(W, H);
    rt.depthTexture.type = THREE.UnsignedIntType;

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: rt.texture },
        tDepth: { value: rt.depthTexture },
        uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
        uNear: { value: o.near == null ? 0.5 : o.near },
        uFar: { value: o.far == null ? 60 : o.far },
        uFocus: { value: 10 },
        uRange: { value: o.range == null ? 5.0 : o.range },
        uMaxCoc: { value: o.maxCoc == null ? 16 : o.maxCoc },
        uBloom: { value: o.bloom == null ? 0.3 : o.bloom },
        uThresh: { value: o.threshold == null ? 0.93 : o.threshold },
        uBloomR: { value: o.bloomRadius == null ? 13 : o.bloomRadius },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D tDiffuse; uniform sampler2D tDepth;",
        "uniform vec2 uTexel;",
        "uniform float uNear, uFar, uFocus, uRange, uMaxCoc, uBloom, uThresh, uBloomR;",
        "varying vec2 vUv;",
        "float linDepth(vec2 uv){",
        "  float d = texture2D(tDepth, uv).x;",
        "  float z = d * 2.0 - 1.0;",
        "  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));",
        "}",
        "void main(){",
        "  float z = linDepth(vUv);",
        "  vec3 centre = texture2D(tDiffuse, vUv).rgb;",
        /* a dead zone around the focal plane: anything meant to be IN focus must stay pixel-sharp,
           otherwise the whole frame reads as soft and "low quality" even where nothing is blurred */
        "  float coc = clamp(abs(z - uFocus) / uRange, 0.0, 1.0);",
        "  coc = max(coc - 0.14, 0.0) / 0.86;",
        "  coc = coc * coc * uMaxCoc;",
        "  vec3 col = centre;",
        "  if (coc > 0.5) {",
        // per-pixel rotation of the spiral: without it a 20-tap disc reads as a rosette
        "    float rot = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831853;",
        "    vec3 sum = centre; float wsum = 1.0;",
        "    for (int i = 0; i < 20; i++){",
        "      float fi = float(i);",
        "      float a = fi * 2.39996323 + rot;",
        "      float rr = sqrt((fi + 0.5) / 20.0);",
        "      vec2 uv2 = vUv + vec2(cos(a), sin(a)) * rr * coc * uTexel;",
        /* REJECT samples that sit well in FRONT of this pixel. A naive gather-DOF lets a sharp
           foreground bleed outward over the background, which is the giant dark halo the owner saw
           around every object — it looked like a shadow and was really the stack smearing itself. */
        "      float w = step(z - 0.45, linDepth(uv2));",
        "      sum += texture2D(tDiffuse, uv2).rgb * w; wsum += w;",
        "    }",
        "    col = sum / wsum;",
        "  }",
        /* bloom is a HIGHLIGHT, not an atmosphere: a low threshold over bright paper haloed the
           whole frame. Only genuinely blown-out pixels (gold emissives) may glow. */
        "  vec3 bl = vec3(0.0);",
        "  for (int j = 0; j < 16; j++){",
        "    float fj = float(j);",
        "    float a2 = fj * 2.39996323 + 0.7;",
        "    float r2 = sqrt((fj + 0.5) / 16.0) * uBloomR;",
        "    bl += max(texture2D(tDiffuse, vUv + vec2(cos(a2), sin(a2)) * r2 * uTexel).rgb - uThresh, 0.0);",
        "  }",
        "  col += (bl / 16.0) * uBloom;",
        "  gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });

    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    var postScene = new THREE.Scene();
    postScene.add(quad);
    var postCam = new THREE.Camera();

    return {
      uniforms: mat.uniforms,
      render: function (scene, camera, focusDistance) {
        if (typeof focusDistance === "number") mat.uniforms.uFocus.value = focusDistance;
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCam);
      },
    };
  }

  /**
   * A word that stands INSIDE the 3D scene: a canvas-textured plane, sized in world units.
   *
   * WHY (2026-08-17): the t3d-* tests were object studies with no words in them, so a 3D cut could
   * not carry a narration beat that names things ("your conversation", "the document you pasted").
   * The house answer for a LINE is still flat DOM over the canvas — a kicker must not sit in
   * perspective. But a LABEL belongs to the object it names: it should orbit, catch the depth of
   * field and occlude like everything else, which only works if it is real geometry.
   *
   * Unlit (MeshBasicMaterial) on purpose: a label is ink, not a surface — the key light must not
   * make the four column labels different brightnesses depending on where the camera has swung to.
   *
   * @param {object} THREE
   * @param {string} text
   * @param {object} [o]
   * @param {number} [o.height]   world height of the CAP HEIGHT (default 0.34)
   * @param {string} [o.color]    css fill (default var-ish paper blue #cfe0f2)
   * @param {number} [o.weight]   font weight (default 700)
   * @param {number} [o.track]    letter-spacing in texture px (default 0)
   * @param {boolean} [o.upper]   uppercase + tracking, the .fx-lbl look (default false)
   * @param {string} [o.align]    "center" (default) | "left" — which edge position() anchors
   * @param {string} [o.bg]       css fill for a rounded plate behind the text (default none)
   * @param {string} [o.border]   css stroke for that plate (default none)
   * @returns {THREE.Mesh} with .material.opacity animatable and ._w/._h in world units
   */
  function textPlane(THREE, text, o) {
    o = o || {};
    var str = o.upper ? String(text).toUpperCase() : String(text);
    var PX = 88;                                   // texture cap height — plenty for a 1080p frame
    var track = o.track == null ? (o.upper ? 9 : 0) : o.track;
    var weight = o.weight == null ? 700 : o.weight;
    var family = '"Segoe UI Variable Display","Segoe UI",system-ui,-apple-system,Arial,sans-serif';
    var font = weight + " " + PX + "px " + family;

    var c = document.createElement("canvas");
    var g = c.getContext("2d");
    g.font = font;
    var w = 0;
    for (var i = 0; i < str.length; i++) w += g.measureText(str[i]).width + track;
    var padX = Math.round(PX * 0.34), padY = Math.round(PX * 0.42);
    c.width = Math.max(2, Math.ceil(w) + padX * 2);
    c.height = Math.ceil(PX * 1.42) + padY;
    /* re-set: sizing the canvas resets the 2D context */
    g = c.getContext("2d");
    if (o.bg || o.border) {
      var rad = Math.round(PX * 0.28), bw = Math.round(PX * 0.05);
      var x0 = bw, y0 = bw, x1 = c.width - bw, y1 = c.height - bw;
      g.beginPath();
      g.moveTo(x0 + rad, y0);
      g.arcTo(x1, y0, x1, y1, rad);
      g.arcTo(x1, y1, x0, y1, rad);
      g.arcTo(x0, y1, x0, y0, rad);
      g.arcTo(x0, y0, x1, y0, rad);
      g.closePath();
      if (o.bg) { g.fillStyle = o.bg; g.fill(); }
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = bw * 2; g.stroke(); }
    }
    g.font = font;
    g.textBaseline = "alphabetic";
    g.fillStyle = o.color || "#cfe0f2";
    var x = padX, base = padY / 2 + PX;
    for (var k = 0; k < str.length; k++) {
      g.fillText(str[k], x, base);
      x += g.measureText(str[k]).width + track;
    }

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearFilter;
    if ("colorSpace" in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

    var H = (o.height == null ? 0.34 : o.height) * (c.height / PX);
    var W = H * (c.width / c.height);
    /* depthWrite MUST stay on, with alphaTest doing the cut-out (measured 2026-08-17, cost one dead
       render pass): the composite's depth-of-field reads the DEPTH BUFFER, so a label that writes no
       depth is blurred by whatever stands behind it — with a back wall 16 units away every word in
       the frame came out smeared while the paper beside it was pin-sharp. alphaTest discards the
       transparent margin instead, so only the ink writes depth and the label focuses with its object. */
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 1, depthWrite: true, alphaTest: 0.02,
        toneMapped: false, side: THREE.DoubleSide,
      }),
    );
    mesh._w = W;
    mesh._h = H;
    if (o.align === "left") mesh.geometry.translate(W / 2, 0, 0);
    return mesh;
  }

  /** The house light rig: cool sky fill, warm key with soft shadows, blue rim. Returns the key. */
  function rig(THREE, scene, o) {
    o = o || {};
    scene.add(new THREE.HemisphereLight(0x9fc4ea, 0x04070b, o.ambient == null ? 0.55 : o.ambient));
    var key = new THREE.DirectionalLight(0xfff2dc, o.key == null ? 2.5 : o.key);
    key.position.set(5.5, 8.0, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -(o.extent || 8); key.shadow.camera.right = o.extent || 8;
    key.shadow.camera.top = o.extent || 8; key.shadow.camera.bottom = -(o.extent || 8);
    key.shadow.camera.near = 1; key.shadow.camera.far = 40;
    key.shadow.bias = -0.0006;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x66a9ee, o.rim == null ? 1.9 : o.rim);
    rim.position.set(-6.5, 2.8, -5.5);
    scene.add(rim);
    return key;
  }

  /** The standard renderer setup for a deterministic video render (pinned size, no device pixels). */
  function renderer(THREE, canvas, W, H) {
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    return r;
  }

  /**
   * Load the vendored Three.js and hand it to `cb`. One place to get the URL contract right.
   *
   * The URL is resolved against document.baseURI ON PURPOSE (measured 2026-08-17, cost one dead
   * render): a dynamic import() inside a CLASSIC script resolves against that SCRIPT's URL, and
   * this file is served from _lib/ — so a bare "../vendor/…" resolved to _lib/../vendor and 404'd.
   * The vendored copy has to live inside the SCENE dir (the HF file server roots there), and the
   * entry HTML is what knows where that is, so the entry's base URL is the right anchor.
   */
  function boot(cb) {
    var url = new URL(global.__THREE_URL || "./vendor/three.module.min.js", document.baseURI).href;
    import(url)
      .then(function (THREE) { cb(THREE); })
      .catch(function (e) { console.error("[hf-three] Three.js failed to load from " + url, e); });
  }

  global.HF3 = {
    rng: rng, clamp: clamp, span: span, outCubic: outCubic, inOutCubic: inOutCubic, mix: mix,
    composite: composite, rig: rig, renderer: renderer, boot: boot, textPlane: textPlane,
  };
})(window);
