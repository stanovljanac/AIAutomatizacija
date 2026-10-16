/* hf-mech.js — the MECHANICAL kit: lit, machined OBJECTS shot face-on (built for 025, 2026-10-10).
 *
 * WHY A THIRD 3D FILE (hf-three.js and hf-world.js stay byte-for-byte; 023 and 024 depend on them):
 *   Owner, 2026-10-10: "other models make promo pieces where a car's parts fly apart, come back and slot
 *   in — and we make 3D chats of text. Keep the camera at 90 degrees unless depth is the only way to show
 *   the idea." hf-world is a ROOM the camera flies through, lit for emissive text tiles. This kit is the
 *   opposite brief: ONE object made of real parts, studio-lit, held square to the lens, and all the motion
 *   is the object's own — parts that travel, seat, mesh and turn.
 *
 * What that needs and hf-world does not have:
 *   · a STUDIO ENVIRONMENT. Metal is a mirror: a flat plate square to the lens shows whatever is BEHIND
 *     THE CAMERA, and in a dark room that is nothing — the classic dead-black CG metal. HM.env() builds a
 *     softbox studio (a big graded panel behind the lens + strips for the bevels) and prefilters it (PMREM).
 *   · MOTION BLUR FOR OBJECTS. hf-world smears along the camera path; here the camera is nearly still and
 *     the PARTS move. The frame is the average of N sub-frames across the shutter (accumulation), so every
 *     flying part, spinning gear and the camera itself blur correctly — and it stays a pure function of t.
 *   · machined GEOMETRY as builders: gears that actually mesh, plates with bores, screws, pillars, levers,
 *     springs, drums — all bevelled, because the bevel is what catches the light.
 *
 * Load order (classic scripts):  gsap → hf-scene → hf-three → hf-world → hf-mech → <scene>.js
 * DETERMINISM: no rAF, no Date.now, no Math.random. Randomness is HF3.rng(seed) at BUILD time only.
 */
(function (global) {
  "use strict";
  var HF3 = global.HF3, HW = global.HW;
  var clamp = HF3.clamp, span = HF3.span, mix = HF3.mix, rng = HF3.rng, E = HW.E;
  var TAU = Math.PI * 2;

  /* ── palettes: the backdrop + grade. The OBJECT keeps its metals in both. ────────────────────────── */
  var PAL = {
    hero: { // black + gold — the hook and the close
      bg0: [0.0016, 0.0013, 0.0010], bg1: [0.0075, 0.0052, 0.0022], grid: [1.0, 0.69, 0.13], gridA: 0.020, glow: [1.0, 0.62, 0.16], glowA: 0.018,
      lift: [0.010, 0.008, 0.004], gain: [1.03, 1.0, 0.95], sat: 1.05, envWarm: 1.0,
    },
    body: { // blue + gold — the body
      bg0: [0.0020, 0.0035, 0.0060], bg1: [0.0085, 0.0190, 0.0380], grid: [0.31, 0.60, 0.93], gridA: 0.040, glow: [0.22, 0.52, 0.95], glowA: 0.065,
      lift: [0.004, 0.008, 0.016], gain: [0.985, 1.0, 1.04], sat: 1.06, envWarm: 0.0,
    },
  };

  /* ── the post chain: accumulate → bloom → depth of field → ACES → grade ──────────────────────────── */
  var VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

  function post(THREE, renderer, W, H, o) {
    o = o || {};
    var half = THREE.HalfFloatType;
    var rt = new THREE.WebGLRenderTarget(W, H, { type: half, samples: 4, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    rt.depthTexture = new THREE.DepthTexture(W, H);
    rt.depthTexture.type = THREE.UnsignedIntType;
    function mk(w, h) { return new THREE.WebGLRenderTarget(w, h, { type: half, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
    var acc = mk(W, H);
    var w2 = W >> 1, h2 = H >> 1, w4 = W >> 2, h4 = H >> 2, w8 = W >> 3, h8 = H >> 3;
    var rB = mk(w2, h2), a4 = mk(w4, h4), b4 = mk(w4, h4), a8 = mk(w8, h8), b8 = mk(w8, h8);

    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quad.frustumCulled = false;
    var ps = new THREE.Scene(); ps.add(quad);
    var pc = new THREE.Camera();

    /* one sub-frame added into the accumulation target at weight 1/N */
    var addMat = new THREE.ShaderMaterial({
      uniforms: { t: { value: rt.texture }, uW: { value: 1 } },
      vertexShader: VS,
      fragmentShader: "uniform sampler2D t; uniform float uW; varying vec2 vUv; void main(){ gl_FragColor = vec4(min(texture2D(t, vUv).rgb, vec3(40.0)) * uW, 1.0); }",
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      depthTest: false, depthWrite: false, transparent: true,
    });
    var bright = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uThresh: { value: o.threshold == null ? 1.5 : o.threshold }, uKnee: { value: 0.5 } },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D t; uniform vec2 uTexel; uniform float uThresh, uKnee; varying vec2 vUv;",
        "void main(){",
        "  vec3 c = texture2D(t, vUv + uTexel*vec2(-0.5,-0.5)).rgb + texture2D(t, vUv + uTexel*vec2(0.5,-0.5)).rgb",
        "         + texture2D(t, vUv + uTexel*vec2(-0.5,0.5)).rgb + texture2D(t, vUv + uTexel*vec2(0.5,0.5)).rgb;",
        "  c *= 0.25; c = min(c, vec3(24.0));",
        "  float l = max(c.r, max(c.g, c.b));",
        "  float s = clamp(l - uThresh + uKnee, 0.0, 2.0*uKnee); s = s*s/(4.0*uKnee + 1e-4);",
        "  float w = max(s, l - uThresh) / max(l, 1e-4);",
        "  gl_FragColor = vec4(c * w, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });
    var blur = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D t; uniform vec2 uDir; varying vec2 vUv;",
        "void main(){",
        "  vec3 c = texture2D(t, vUv).rgb * 0.2270270;",
        "  c += (texture2D(t, vUv + uDir*1.3846154).rgb + texture2D(t, vUv - uDir*1.3846154).rgb) * 0.3162162;",
        "  c += (texture2D(t, vUv + uDir*3.2307692).rgb + texture2D(t, vUv - uDir*3.2307692).rgb) * 0.0702703;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });
    var comp = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tB4: { value: b4.texture }, tB8: { value: b8.texture },
        uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uRes: { value: new THREE.Vector2(W, H) },
        uNear: { value: o.near || 1 }, uFar: { value: o.far || 120 },
        uFocus: { value: 26 }, uRange: { value: o.range || 8 }, uMaxCoc: { value: o.maxCoc == null ? 6 : o.maxCoc },
        uBloom: { value: o.bloom == null ? 0.16 : o.bloom }, uBloomWide: { value: o.bloomWide == null ? 0.12 : o.bloomWide },
        uGrain: { value: 0.026 }, uTime: { value: 0 }, uVig: { value: 0.5 }, uExposure: { value: 1.0 }, uSat: { value: 1.05 },
        uFlash: { value: new THREE.Vector3() }, uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uFade: { value: 0 },
      },
      vertexShader: VS,
      fragmentShader: [
        "uniform sampler2D tDiffuse, tDepth, tB4, tB8;",
        "uniform vec2 uTexel, uRes;",
        "uniform float uNear, uFar, uFocus, uRange, uMaxCoc, uBloom, uBloomWide, uGrain, uTime, uVig, uExposure, uSat, uFade;",
        "uniform vec3 uFlash, uLift, uGain;",
        "varying vec2 vUv;",
        "float linDepth(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear-z*(uFar-uNear)); }",
        "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }",
        "vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }",
        "void main(){",
        "  vec2 uv = vUv;",
        "  float z = linDepth(uv);",
        "  vec3 col = texture2D(tDiffuse, uv).rgb;",
        /* a dead zone around the focal plane keeps the object pin-sharp; only what leaves it softens */
        "  float coc = clamp(abs(z - uFocus)/uRange, 0.0, 1.0);",
        "  coc = max(coc - 0.16, 0.0)/0.84; coc = coc*coc*uMaxCoc;",
        "  if (coc > 0.5) {",
        "    float rot = hash(uv) * 6.2831853;",
        "    vec3 sum = col; float ws = 1.0;",
        "    for (int i = 0; i < 22; i++){",
        "      float fi = float(i); float a = fi*2.39996323 + rot; float rr = sqrt((fi+0.5)/22.0);",
        "      vec2 uv2 = uv + vec2(cos(a), sin(a))*rr*coc*uTexel;",
        "      float w = step(z - 0.6, linDepth(uv2));",
        "      sum += texture2D(tDiffuse, uv2).rgb * w; ws += w;",
        "    }",
        "    col = sum / ws;",
        "  }",
        "  col += texture2D(tB4, uv).rgb * uBloom + texture2D(tB8, uv).rgb * uBloomWide;",
        "  col *= uExposure;",
        "  col += uFlash;",
        "  col = aces(col);",
        "  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));",
        "  col = mix(vec3(l), col, uSat);",
        "  col = col*uGain + uLift*(1.0 - col);",
        "  vec2 q = (uv - 0.5)*vec2(uRes.x/uRes.y, 1.0);",
        "  col *= mix(1.0, smoothstep(1.25, 0.32, length(q)), uVig);",
        "  col = pow(clamp(col, 0.0, 1.0), vec3(1.0/2.2));",
        "  col += (hash(uv*uRes + fract(uTime*7.31)*91.7) - 0.5) * uGrain;",
        "  col *= (1.0 - uFade);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false, depthWrite: false,
    });

    function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(ps, pc); }
    function blurPass(src, dst, dx, dy) { blur.uniforms.t.value = src.texture; blur.uniforms.uDir.value.set(dx, dy); pass(blur, dst); }

    return {
      uniforms: comp.uniforms,
      /** drawSub(i, n) must pose the scene + camera for sub-frame i of n; it is called n times. */
      render: function (scene, camera, n, drawSub) {
        n = Math.max(1, n | 0);
        var src = rt;
        if (n === 1) {
          drawSub(0, 1);
          renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
        } else {
          renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 1); renderer.clear();
          addMat.uniforms.uW.value = 1 / n;
          for (var i = 0; i < n; i++) {
            drawSub(i, n);
            renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
            var ac = renderer.autoClear; renderer.autoClear = false;
            pass(addMat, acc);
            renderer.autoClear = ac;
          }
          src = acc;
        }
        comp.uniforms.tDiffuse.value = src.texture;
        bright.uniforms.t.value = src.texture; pass(bright, rB);
        blurPass(rB, a4, 1 / w2, 0); blurPass(a4, b4, 0, 1 / h4);
        blurPass(b4, a4, 1.6 / w4, 0); blurPass(a4, b4, 0, 1.6 / h4);
        blurPass(b4, a8, 1 / w4, 0); blurPass(a8, b8, 0, 1 / h8);
        blurPass(b8, a8, 2.0 / w8, 0); blurPass(a8, b8, 0, 2.0 / h8);
        pass(comp, null);
      },
    };
  }

  /* ── the studio: what the metal reflects ─────────────────────────────────────────────────────────── */
  /**
   * A softbox studio rendered once and prefiltered. Coordinates are the OBJECT's: +z is toward the lens.
   *   · BACK-OF-LENS panel: a big graded softbox behind the camera — the reflection every face-on plate
   *     shows. Bright at the top, falling to dark at the bottom, so a flat plate reads as a soft gradient.
   *   · two STRIPS left/right (cool, warm) and a top bank: the long highlights that run along bevels and
   *     gear teeth, and that travel when scene.environmentRotation turns (the "light sweep").
   */
  function env(THREE, renderer, o) {
    o = o || {};
    var s = new THREE.Scene();
    s.background = new THREE.Color(0x020304);
    /* grad = [dirX, dirY, lo, hi]: brightness runs lo → hi across the panel along (dirX, dirY) in its own UV */
    function panel(w, h, col, k, pos, look, grad) {
      var m;
      if (grad) {
        m = new THREE.ShaderMaterial({
          uniforms: { c: { value: new THREE.Color(col).multiplyScalar(k) }, g: { value: new THREE.Vector4(grad[0], grad[1], grad[2], grad[3]) } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
          fragmentShader: "uniform vec3 c; uniform vec4 g; varying vec2 vUv; void main(){ float u = dot(vUv - 0.5, normalize(g.xy)) / 0.7 + 0.5; float v = mix(g.z, g.w, smoothstep(0.0, 1.0, u)); vec2 e = smoothstep(0.0, 0.12, vUv) * smoothstep(0.0, 0.12, 1.0 - vUv); gl_FragColor = vec4(c * v * e.x * e.y, 1.0); }",
          side: THREE.DoubleSide,
        });
      } else {
        m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide });
      }
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(pos[0], pos[1], pos[2]); p.lookAt(look[0], look[1], look[2]); s.add(p);
      return p;
    }
    var warm = o.warm == null ? 0.5 : o.warm;
    var keyCol = new THREE.Color(1.0, mix(0.97, 0.90, warm), mix(0.94, 0.78, warm)).getHex();
    /* BEHIND THE LENS — the studio's gradient sheet. A flat plate square to the lens mirrors what is behind
       the camera, and the object spans about ±17° of view, so it sees roughly a 36 × 16 patch of this wall.
       Running the brightness diagonally across that patch is what puts a sweep of light across the whole
       machine (bright upper-left, falling to near black lower-right) instead of one flat value per metal. */
    panel(80, 50, keyCol, 0.05, [0, 0, 27], [0, 0, 0]);
    panel(44, 22, keyCol, o.sheet == null ? 1.5 : o.sheet, [0, 0.5, 25], [0, 0, 0], [0.75, 0.66, 0.0, 1.0]);
    panel(30, 7, 0xffffff, 6.5, [0, 23, 5], [0, 0, 0]);                                    // top bank: the long bevel highlight
    panel(2.2, 30, 0xcfe4ff, 16.0, [-25, 4, 9], [0, 0, 0]);                                 // cool strip, left
    panel(2.2, 30, 0xffdfae, 12.0, [25, 1, 7], [0, 0, 0]);                                  // warm strip, right
    panel(22, 3, 0x5f9cff, 2.2, [0, -20, 7], [0, 0, 0]);                                    // a little blue from below
    var pm = new THREE.PMREMGenerator(renderer);
    var tex = pm.fromScene(s, 0.02).texture;
    pm.dispose();
    return tex;
  }

  /* ── procedural finishes (canvas → roughness / bump). Deterministic. ─────────────────────────────── */
  function canvasTex(THREE, w, h, draw, o) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (o && o.srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  /** straight brushing: long horizontal hairlines */
  function brushed(THREE, seed) {
    return canvasTex(THREE, 512, 512, function (g, w, h) {
      var r = rng(seed || 5);
      g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) {
        var y = r() * h, x = r() * w, len = 40 + r() * 260, v = Math.floor(96 + r() * 80);
        g.strokeStyle = "rgba(" + v + "," + v + "," + v + "," + (0.10 + r() * 0.22) + ")";
        g.lineWidth = 0.6 + r() * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
        if (x + len > w) { g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + len - w, y); g.stroke(); }
      }
    });
  }
  /** circular graining: concentric hairlines around the centre of the tile (gear faces, discs) */
  function grained(THREE, seed) {
    return canvasTex(THREE, 512, 512, function (g, w, h) {
      var r = rng(seed || 9);
      g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 520; i++) {
        var rad = 4 + r() * (w * 0.72), a0 = r() * TAU, a1 = a0 + 0.5 + r() * 3.5, v = Math.floor(92 + r() * 90);
        g.strokeStyle = "rgba(" + v + "," + v + "," + v + "," + (0.12 + r() * 0.2) + ")";
        g.lineWidth = 0.6 + r() * 0.9; g.beginPath(); g.arc(w / 2, h / 2, rad, a0, a1); g.stroke();
      }
    });
  }
  /** perlage: overlapping polished discs, the classic finish of a movement's main plate */
  function perlage(THREE, seed) {
    return canvasTex(THREE, 512, 512, function (g, w, h) {
      g.fillStyle = "#7a7a7a"; g.fillRect(0, 0, w, h);
      var step = 64, rad = 46;
      for (var row = -1; row <= h / step + 1; row++) {
        for (var col = -1; col <= w / step + 1; col++) {
          var x = col * step + (row % 2 ? step / 2 : 0), y = row * step;
          var gr = g.createRadialGradient(x, y, 2, x, y, rad);
          gr.addColorStop(0, "rgba(170,170,170,0.9)"); gr.addColorStop(0.55, "rgba(110,110,110,0.75)"); gr.addColorStop(1, "rgba(84,84,84,0.9)");
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
          g.strokeStyle = "rgba(150,150,150,0.35)"; g.lineWidth = 1;
          for (var k = 1; k < 6; k++) { g.beginPath(); g.arc(x, y, rad * k / 6, 0, TAU); g.stroke(); }
        }
      }
    });
  }

  /* ── materials ───────────────────────────────────────────────────────────────────────────────────── */
  /**
   * The object's metals. blue steel = THE MACHINE (the agent, any model). gold = WHAT YOU WRITE.
   * @returns {object} named materials; clone one before changing it per part.
   */
  function materials(THREE, o) {
    o = o || {};
    var tb = brushed(THREE, 5), tg = grained(THREE, 9), tp = perlage(THREE, 3);
    /* metalness below 1 on purpose: an env-lit mirror shows no cast shadow (a shadow only removes DIRECT
       light), and layered shadows are what give a face-on object its depth. The diffuse share carries them. */
    function metal(color, rough, tex, bump, metalness) {
      var m = new THREE.MeshPhysicalMaterial({ color: color, metalness: metalness == null ? 0.85 : metalness, roughness: rough, envMapIntensity: 1.0 });
      if (tex) { m.roughnessMap = tex; m.bumpMap = tex; m.bumpScale = bump == null ? 0.6 : bump; }
      return m;
    }
    var M = {
      plate: metal(0x1c2b42, 0.5, tp, 2.6, 0.55),          // main plate: blued steel, perlage
      plateDark: metal(0x0a1017, 0.6, tb, 0.8, 0.5),       // rear plate / recesses
      steel: metal(0xaebccc, 0.26, tg, 1.4, 0.8),          // gears, arbors: bright steel, circular grain
      steelBrushed: metal(0x8fa1b6, 0.34, tb, 1.6, 0.8),   // bridges, rails
      blue: metal(0x2a6fd6, 0.22, tb, 0.4, 0.9),           // heat-blued screws, accents
      gold: metal(0xffc75f, 0.18, tg, 0.9, 0.92),          // polished gold: the lines you write
      goldBrushed: metal(0xf0ab3c, 0.32, tb, 1.6, 0.88),
      goldDark: metal(0x8a5a16, 0.5, tb, 0.8, 0.8),
      black: new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0.3, roughness: 0.55 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.0, roughness: 0.9 }),
      red: new THREE.MeshPhysicalMaterial({ color: 0xd3202a, metalness: 0.2, roughness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.15 }),
      paper: new THREE.MeshStandardMaterial({ color: 0xbdb9ad, metalness: 0.0, roughness: 0.92 }),
      jewel: new THREE.MeshPhysicalMaterial({ color: 0x0b2f7a, metalness: 0.0, roughness: 0.06, clearcoat: 1.0, clearcoatRoughness: 0.03, emissive: 0x2f8cff, emissiveIntensity: 1.6 }),
      ruby: new THREE.MeshPhysicalMaterial({ color: 0x7a0b1c, metalness: 0.0, roughness: 0.06, clearcoat: 1.0, clearcoatRoughness: 0.03, emissive: 0xff2a3c, emissiveIntensity: 0.9 }),
    };
    M._tex = { brushed: tb, grained: tg, perlage: tp };
    return M;
  }

  /* ── geometry builders ───────────────────────────────────────────────────────────────────────────── */
  var G = {};

  /**
   * Planar UVs in XY. size = the world size one texture tile covers. Centred on the part's bounding box, so
   * a concentric finish (grained) sits on the axis of a round part; a straight finish tiles at one physical
   * scale across every part, which is what makes separate pieces read as the same metal.
   */
  function planarUV(THREE, geo, size) {
    geo.computeBoundingBox();
    var b = geo.boundingBox, cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2;
    var s = size || 2.4;
    var p = geo.attributes.position, uv = new Float32Array(p.count * 2);
    for (var i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - cx) / s + 0.5; uv[i * 2 + 1] = (p.getY(i) - cy) / s + 0.5; }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return geo;
  }
  /** extrude a Shape with a machined bevel; the result is centred on z (−depth/2 … +depth/2) */
  function extrude(THREE, shape, depth, bevel, o) {
    o = o || {};
    var bv = bevel == null ? 0.03 : bevel;
    var geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(depth - 2 * bv, 0.001), bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv,
      bevelSegments: o.bevelSegments || 3, curveSegments: o.curve || 18, steps: 1,
    });
    geo.translate(0, 0, -(depth - 2 * bv) / 2);
    planarUV(THREE, geo, o.uvSize);
    return geo;
  }
  G.extrude = extrude;

  function circlePath(THREE, r, x, y, cw) {
    var p = new THREE.Path();
    p.absarc(x || 0, y || 0, r, 0, TAU, !!cw);
    return p;
  }
  function roundedRect(THREE, w, h, r, x, y) {
    var s = new THREE.Shape(), x0 = (x || 0) - w / 2, y0 = (y || 0) - h / 2;
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3);
    s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x0 + w, y0 + h - r); s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x0 + r, y0 + h); s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function roundedRectPath(THREE, w, h, r, x, y) {
    var s = roundedRect(THREE, w, h, r, x, y), p = new THREE.Path();
    p.setFromPoints(s.getPoints(8).reverse());
    return p;
  }
  G.roundedRect = roundedRect; G.roundedRectPath = roundedRectPath; G.circlePath = circlePath;

  /**
   * A spur gear. Tooth 0 is centred on local angle 0 (the mesh() phase formula relies on it).
   * @param {object} o { teeth, r (pitch radius), thick, bore, spokes, hub, rim, bevel }
   */
  G.gear = function (THREE, o) {
    var N = o.teeth, R = o.r, m = (2 * R) / N;
    var ra = R + m * 0.95, rr = R - m * 1.15, p = TAU / N;
    var s = new THREE.Shape();
    for (var i = 0; i < N; i++) {
      var a = i * p;
      /* root → flank → rounded tip → flank → root, symmetric about the tooth centre a */
      var pts = [[rr, -0.50], [rr, -0.30], [R, -0.245], [ra, -0.135], [ra + m * 0.04, 0], [ra, 0.135], [R, 0.245], [rr, 0.30]];
      for (var k = 0; k < pts.length; k++) {
        var rad = pts[k][0], ang = a + pts[k][1] * p, x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
        if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
    }
    s.closePath();
    var bore = o.bore == null ? R * 0.14 : o.bore;
    if (bore > 0) s.holes.push(circlePath(THREE, bore, 0, 0, true));
    var sp = o.spokes == null ? 5 : o.spokes;
    if (sp > 0 && R > 0.5) {
      var hub = o.hub == null ? R * 0.30 : o.hub, rim = o.rim == null ? rr - m * 0.9 : o.rim, gap = (TAU / sp) * 0.20;
      for (var j = 0; j < sp; j++) {
        var a0 = j * (TAU / sp) + gap, a1 = (j + 1) * (TAU / sp) - gap, h = new THREE.Path();
        /* a spoke window: an annular sector with eased corners */
        var gi = gap * (rim / hub) * 0.55;   // the inner arc is shorter, so the spokes stay parallel-sided
        h.absarc(0, 0, rim, a0, a1, false);
        h.absarc(0, 0, hub, a1 - gi * 0.2, a0 + gi * 0.2, true);
        h.closePath();
        s.holes.push(h);
      }
    }
    return extrude(THREE, s, o.thick || 0.16, o.bevel == null ? Math.min(0.03, m * 0.16) : o.bevel, { curve: 14, uvSize: ra * 2.2 });
  };
  /** a rimmed wheel with spoke windows and no teeth (a balance wheel, a handwheel) */
  G.wheel = function (THREE, o) {
    var R = o.r, s = new THREE.Shape(); s.absarc(0, 0, R, 0, TAU, false);
    if (o.bore > 0) s.holes.push(circlePath(THREE, o.bore, 0, 0, true));
    var sp = o.spokes || 3, hub = o.hub || R * 0.2, rim = R - (o.rim || R * 0.18), gap = (TAU / sp) * 0.09;
    for (var j = 0; j < sp; j++) {
      var a0 = j * (TAU / sp) + gap, a1 = (j + 1) * (TAU / sp) - gap, h = new THREE.Path(), gi = gap * (rim / hub) * 0.8;
      h.absarc(0, 0, rim, a0, a1, false); h.absarc(0, 0, hub, a1 - gi, a0 + gi, true); h.closePath();
      s.holes.push(h);
    }
    return extrude(THREE, s, o.thick || 0.08, o.bevel == null ? 0.015 : o.bevel, { curve: 20, uvSize: R * 2.2 });
  };
  /** the angle gear B must hold to mesh with gear A turned to thA; phi = direction from A's centre to B's */
  function mesh(thA, NA, NB, phi) { return phi + Math.PI - Math.PI / NB - (NA / NB) * (thA - phi); }

  /** a disc / washer / ring */
  G.disc = function (THREE, r, thick, bore, bevel, seg) {
    var s = new THREE.Shape(); s.absarc(0, 0, r, 0, TAU, false);
    if (bore > 0) s.holes.push(circlePath(THREE, bore, 0, 0, true));
    return extrude(THREE, s, thick, bevel == null ? Math.min(0.03, thick * 0.3) : bevel, { curve: seg || 40, uvSize: r * 2.2 });
  };
  /** a rounded plate with optional round bores [[x,y,r]...] and rounded windows [[x,y,w,h,r]...] */
  G.plate = function (THREE, w, h, r, thick, bores, windows, bevel) {
    var s = roundedRect(THREE, w, h, r);
    (bores || []).forEach(function (b) { s.holes.push(circlePath(THREE, b[2], b[0], b[1], true)); });
    (windows || []).forEach(function (q) { s.holes.push(roundedRectPath(THREE, q[2], q[3], q[4] == null ? 0.15 : q[4], q[0], q[1])); });
    return extrude(THREE, s, thick, bevel == null ? 0.035 : bevel, { curve: 14 });
  };
  /** a free outline [[x,y]...] closed, with optional bores — levers, bridges, cams */
  G.outline = function (THREE, pts, thick, bores, bevel, smooth) {
    var s = new THREE.Shape();
    if (smooth) {
      var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      s.setFromPoints(new THREE.SplineCurve(v.concat([v[0]])).getPoints(pts.length * 10));
    } else {
      s.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      s.closePath();
    }
    (bores || []).forEach(function (b) { s.holes.push(circlePath(THREE, b[2], b[0], b[1], true)); });
    return extrude(THREE, s, thick, bevel == null ? 0.03 : bevel, { curve: 14 });
  };
  /** a bar between two points with round ends and a bore at each (a link, a bridge arm) */
  G.link = function (THREE, len, w, thick, bore, bevel) {
    var s = new THREE.Shape(), r = w / 2;
    s.moveTo(0, -r); s.lineTo(len, -r); s.absarc(len, 0, r, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(0, r); s.absarc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    if (bore > 0) { s.holes.push(circlePath(THREE, bore, 0, 0, true)); s.holes.push(circlePath(THREE, bore, len, 0, true)); }
    return extrude(THREE, s, thick, bevel == null ? 0.025 : bevel, { curve: 16 });
  };
  /** a turned profile around the z axis: pts [[radius, z]...] (pillars, screw heads, knobs, bells) */
  G.lathe = function (THREE, pts, seg) {
    var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var g = new THREE.LatheGeometry(v, seg || 40);
    g.rotateX(Math.PI / 2);          // lathe axis y → z, so the part faces the lens
    return g;
  };
  /** a slotted screw head, axis z, slot along local x */
  G.screw = function (THREE, r, h) {
    var g = G.lathe(THREE, [[0, 0], [r * 0.98, 0], [r, h * 0.25], [r, h * 0.7], [r * 0.82, h], [0, h]], 28);
    return g;
  };
  /** a flat spiral (hairspring / mainspring), as a thin ribbon standing on z */
  G.spiral = function (THREE, r0, r1, turns, w, thick) {
    var pts = [], n = Math.ceil(turns * 48);
    for (var i = 0; i <= n; i++) { var u = i / n, a = u * turns * TAU, r = mix(r0, r1, u); pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    var g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, w / 2, 6, false);
    g.scale(1, 1, (thick || w * 3) / w);
    return g;
  };

  /* ── a part: geometry + material + where it LIVES and where it comes FROM ────────────────────────── */
  /**
   * Parts are the unit of every move in this kit. Each knows its HOME pose (assembled) and can be given
   * any number of named AWAY poses (exploded, knolled, off-stage). place(p, away) blends between them on
   * an arc, with a turn — so "assemble" and "explode" are the same function run in opposite directions.
   */
  function Part(THREE, obj, home) {
    this.obj = obj;
    this.home = { p: home.p.slice(), r: (home.r || [0, 0, 0]).slice(), s: home.s == null ? 1 : home.s };
    this.away = {};
    this.spin = 0;            // extra rotation about z added on top (gears)
    this.order = 0;
  }
  Part.prototype.setAway = function (name, pose) {
    this.away[name] = { p: pose.p.slice(), r: (pose.r || this.home.r).slice(), s: pose.s == null ? this.home.s : pose.s, lift: pose.lift || 0, turn: pose.turn || 0 };
    return this;
  };
  /** k = 0 → away pose, k = 1 → home. `lift` bows the path toward the lens mid-flight; `turn` adds a spin about z. */
  Part.prototype.place = function (k, name) {
    var h = this.home, a = this.away[name] || h, o = this.obj;
    var u = 1 - k;
    var arc = Math.sin(Math.PI * clamp(k, 0, 1)) * (a.lift || 0);
    o.position.set(mix(h.p[0], a.p[0], u), mix(h.p[1], a.p[1], u), mix(h.p[2], a.p[2], u) + arc);
    o.rotation.set(mix(h.r[0], a.r[0], u), mix(h.r[1], a.r[1], u), mix(h.r[2], a.r[2], u) + (a.turn || 0) * u + this.spin);
    var s = mix(h.s, a.s, u);
    o.scale.setScalar(Math.max(s, 1e-4));
    o.visible = s > 1e-3;
  };

  /* ── the stage ───────────────────────────────────────────────────────────────────────────────────── */
  /**
   * @param {object} o { W, H, fps, palette, fov, dist, samples (motion-blur sub-frames), shutter (0..1),
   *                     exposure, bloom, bloomWide, maxCoc, range, warm, envIntensity, shadow (extent) }
   * @returns ctx { THREE, renderer, scene, camera, post, mat, backdrop, key, fill, render(t, pose, cam, fx) }
   *   pose(t)  sets every object for time t (called once per sub-frame — it must be a pure function of t)
   *   cam(t)   → { x, y, dist, yaw, pitch, roll, fov, focus }   face-on by default: yaw = pitch = 0
   */
  function create(THREE, o) {
    var W = o.W, H = o.H, fps = o.fps || 30;
    var pal = PAL[o.palette || "body"];
    var canvas = document.getElementById(o.canvas || "gl");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(pal.bg0[0], pal.bg0[1], pal.bg0[2]);
    scene.environment = env(THREE, renderer, { warm: o.warm == null ? (o.palette === "hero" ? 0.75 : 0.35) : o.warm });
    scene.environmentIntensity = o.envIntensity == null ? 1.0 : o.envIntensity;
    var camera = new THREE.PerspectiveCamera(o.fov || 22, W / H, 1, 160);

    /* the backdrop: a graded wall with the house blueprint grid and a soft glow behind the object */
    var backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 80),
      new THREE.ShaderMaterial({
        uniforms: {
          c0: { value: new THREE.Vector3(pal.bg0[0], pal.bg0[1], pal.bg0[2]) }, c1: { value: new THREE.Vector3(pal.bg1[0], pal.bg1[1], pal.bg1[2]) },
          uGrid: { value: new THREE.Vector3(pal.grid[0], pal.grid[1], pal.grid[2]) }, uGridA: { value: pal.gridA },
          uGlow: { value: new THREE.Vector3(pal.glow[0], pal.glow[1], pal.glow[2]) }, uGlowA: { value: pal.glowA },
          uCentre: { value: new THREE.Vector2(0, 0.4) }, uCell: { value: 1.0 },
        },
        vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: [
          "uniform vec3 c0, c1, uGrid, uGlow; uniform float uGridA, uGlowA, uCell; uniform vec2 uCentre; varying vec3 vP;",
          "void main(){",
          "  vec2 p = vP.xy - uCentre; float d = length(p * vec2(0.62, 1.0));",
          "  vec3 col = mix(c1, c0, smoothstep(0.0, 17.0, d));",
          "  col += uGlow * uGlowA * exp(-d*d/70.0);",
          "  vec2 g = vP.xy / uCell; vec2 f = abs(fract(g - 0.5) - 0.5) / fwidth(g); float line = 1.0 - min(min(f.x, f.y), 1.0);",
          "  vec2 g2 = vP.xy / (uCell*5.0); vec2 f2 = abs(fract(g2 - 0.5) - 0.5) / fwidth(g2); float major = 1.0 - min(min(f2.x, f2.y), 1.0);",
          "  col += uGrid * (line*0.45 + major*0.9) * uGridA * exp(-d*d/260.0);",
          "  gl_FragColor = vec4(col, 1.0);",
          "}",
        ].join("\n"),
        extensions: { derivatives: true }, depthWrite: true,
      }),
    );
    backdrop.position.set(0, 0, o.backdropZ == null ? -7 : o.backdropZ);
    scene.add(backdrop);

    /* DIRECT LIGHT. Three jobs, three lamps:
         key   a warm SPOT from upper-left-front with a wide soft edge. A spot, not a sun: its pool falls off
               across the object, which is the gradient a flat face-on subject cannot get any other way. It
               casts the layered shadows that read as depth.
         rake  a cool light skimming in from the right, almost in the object's own plane. It barely touches a
               face square to the lens and lights every bevel, tooth and step: relief.
         fill  a little from below-right so the shadow side keeps its detail. */
    var key = new THREE.SpotLight(0xfff0d8, o.keyI == null ? 6.2 : o.keyI, 0, o.keyAngle == null ? 0.42 : o.keyAngle, 0.95, 0);
    key.position.set(-12, 13, 24);
    key.target.position.set(o.keyAt ? o.keyAt[0] : -1.2, o.keyAt ? o.keyAt[1] : 0.6, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.camera.near = 8; key.shadow.camera.far = 60;
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.012; key.shadow.radius = 5;
    scene.add(key); scene.add(key.target);
    var rake = new THREE.DirectionalLight(0x7fb6ff, o.rakeI == null ? 4.2 : o.rakeI);
    rake.position.set(24, 3.5, 4.2);
    scene.add(rake);
    var fill = new THREE.DirectionalLight(0x8fb8ff, o.fillI == null ? 0.3 : o.fillI);
    fill.position.set(10, -8, 16);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xbcd4f0, 0x05070a, o.amb == null ? 0.06 : o.amb));

    var pp = post(THREE, renderer, W, H, { near: camera.near, far: camera.far, bloom: o.bloom, bloomWide: o.bloomWide, maxCoc: o.maxCoc, range: o.range, threshold: o.threshold });
    pp.uniforms.uLift.value.set(pal.lift[0], pal.lift[1], pal.lift[2]);
    pp.uniforms.uGain.value.set(pal.gain[0], pal.gain[1], pal.gain[2]);
    pp.uniforms.uSat.value = pal.sat;
    pp.uniforms.uExposure.value = o.exposure || 1.0;

    var samples = o.samples == null ? 6 : o.samples, shutter = o.shutter == null ? 0.5 : o.shutter;
    var look = new THREE.Vector3();
    function applyCam(c) {
      var yaw = c.yaw || 0, pitch = c.pitch || 0, d = c.dist == null ? 27 : c.dist;
      var tx = c.x || 0, ty = c.y || 0, tz = c.z || 0;
      camera.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, tz + Math.cos(yaw) * Math.cos(pitch) * d);
      camera.up.set(Math.sin(c.roll || 0), Math.cos(c.roll || 0), 0);
      look.set(tx, ty, tz); camera.lookAt(look);
      if (c.fov && camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(true);
      return d;
    }
    var ctx = {
      THREE: THREE, renderer: renderer, scene: scene, camera: camera, post: pp, pal: pal, W: W, H: H, fps: fps,
      backdrop: backdrop, key: key, rake: rake, fill: fill, mat: materials(THREE),
      /** render frame t: N sub-frames across the shutter, each posed by pose(ts) and shot by cam(ts) */
      render: function (t, pose, cam, fx) {
        fx = fx || {};
        var n = fx.samples == null ? samples : fx.samples;
        var last = null;
        pp.uniforms.uTime.value = t;
        var f = fx.flash || [0, 0, 0];
        pp.uniforms.uFlash.value.set(f[0], f[1], f[2]);
        pp.uniforms.uFade.value = fx.fade || 0;
        if (fx.exposure != null) pp.uniforms.uExposure.value = fx.exposure;
        if (fx.vig != null) pp.uniforms.uVig.value = fx.vig;
        pp.render(scene, camera, n, function (i, N) {
          /* sub-frame times end ON t (the last sample is the frame's own instant), spread back over the shutter */
          var ts = N === 1 ? t : Math.max(0, t - (shutter / fps) * (1 - (i + 1) / N));
          pose(ts);
          last = cam(ts);
          var d = applyCam(last);
          pp.uniforms.uFocus.value = last.focus || d;
        });
        return last;
      },
    };
    return ctx;
  }

  /* ── the scene clock (and a dev shortcut) ────────────────────────────────────────────────────────── */
  /**
   * Every mark in a scene comes from the narration: K.b(i, frac) is sentence i's start on the scene clock
   * (falling back to frac × D when the pipeline passed no beat). `props.devClock = { offset, full }` is set
   * only by a dev render looking at a late stretch (render/dev.mjs --range): the clip then starts at `offset`
   * and K.D stays the scene's real length, so nothing in the scene has to know.
   */
  function clock(S) {
    var dc = S.props && S.props.devClock, D = dc ? dc.full : S.D, off = dc ? dc.offset : 0;
    return {
      D: D, off: off,
      b: function (i, frac) { var t = S.beats.length > i ? S.beats[i] : D * (frac == null ? 0.5 : frac); return clamp(t, 0, D - 0.1); },
      t: function (time) { return clamp(time + off, 0, D); },
      /** a word mark from props.marks (scene clock), or the typed fallback when none was passed */
      m: function (name, fallback) { var mk = S.props && S.props.marks; return mk && typeof mk[name] === "number" ? mk[name] : fallback; },
      /** register the scene's HUD timeline (authored on the full scene clock) with the capture engine */
      register: function (id, hud) {
        if (!dc) return global.HF.register(id, hud);
        var master = global.gsap.timeline({ paused: true });
        hud.pause();
        master.fromTo(hud, { time: off }, { time: off + S.D, duration: S.D, ease: "none", immediateRender: true }, 0);
        return global.HF.register(id, master);
      },
    };
  }

  /**
   * The running integral of a rate, as a pure function of time. A scene describes how FAST something turns
   * (rad/s, cards/s) and reads back how FAR it has turned — so speed can change mid-scene without the
   * position ever jumping. Fixed-step midpoint rule, tabulated once.
   */
  function integral(rate, D) {
    var STEP = 1 / 240, N = Math.ceil(((D || 60) + 1) / STEP) + 1, T = new Float64Array(N);
    for (var i = 1; i < N; i++) T[i] = T[i - 1] + STEP * rate((i - 0.5) * STEP);
    return function (t) {
      if (t <= 0) return 0;
      var x = t / STEP, j = Math.floor(x);
      if (j >= N - 1) return T[N - 1];
      return T[j] + (T[j + 1] - T[j]) * (x - j);
    };
  }

  /* ── small scene helpers ─────────────────────────────────────────────────────────────────────────── */
  /** a canvas-printed face (invoice cards, engraved plaques, dials). Returns { tex, w, h, canvas, redraw } */
  function printed(THREE, wWorld, hWorld, ppu, draw) {
    var c = document.createElement("canvas");
    c.width = Math.round(wWorld * ppu); c.height = Math.round(hWorld * ppu);
    var g = c.getContext("2d");
    draw(g, c.width, c.height);
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { tex: tex, canvas: c, w: wWorld, h: hWorld, redraw: function (fn) { g.clearRect(0, 0, c.width, c.height); (fn || draw)(g, c.width, c.height); tex.needsUpdate = true; } };
  }

  global.HM = {
    PAL: PAL, TAU: TAU, create: create, env: env, post: post, materials: materials, G: G, mesh: mesh, Part: Part,
    printed: printed, canvasTex: canvasTex, planarUV: planarUV, clock: clock, integral: integral,
  };
})(window);
