/* hf-fx.js — the SHARED CINEMATIC SUBSTRATE (behaviour half; hf-fx.css is the look half).
 *
 * WHY (owner, 2026-08-16, after 021 shipped "too plain"): a scene's budget must go to the IDEA, not
 * to rebuilding a stage. This file builds the stage, the paper, the camera and the ambient life —
 * so the author writes art direction and the frame is already produced.
 *
 * Load order (classic scripts, no modules):
 *   <script src="../../_lib/gsap.min.js"></script>
 *   <script src="../../_lib/hf-scene.js"></script>
 *   <script src="../../_lib/hf-fx.js"></script>
 *
 * Typical scene opening:
 *   var S = HF.scene({ id: "cw-desk-cycle", width: 1920, height: 1080, frames: 532 });
 *   FX.init(S);                                   // stage layers + palette + dust, injected
 *   var tl = gsap.timeline({ paused: true });
 *   FX.ambient(tl);                               // the always-on secondary motion
 *   ... art direction ...
 *   HF.register("cw-desk-cycle", tl);
 *
 * DETERMINISM IS THE CONTRACT. No Math.random / Date.now: randomness comes from FX.rng(seed),
 * a fixed-sequence PRNG evaluated at build time. No tl.add(callback) either — the capture engine
 * SEEKS (frames out of order), so a crossed-playhead callback may never fire. Everything is a
 * property tween or an onUpdate write.
 *
 * NEVER CALL gsap.fromTo() DIRECTLY FOR A LATER BEAT (measured 2026-08-16, cost one bad render):
 * fromTo defaults to immediateRender:true, so a fromTo placed at 12s applies its `from` values at
 * BUILD time — a gold page meant to fade in late sat at opacity 0.2 from frame 0 and looked dirty.
 * Use FX.fromTo(tl, target, from, to, at) below, which pins immediateRender:false; or set the
 * opening state with gsap.set() and tween forward from it. (A fromTo at position 0 is harmless, but
 * FX.fromTo is still the habit to keep.) Do NOT "fix" this with a global gsap.defaults() —
 * gsap.set() is a zero-duration tween that relies on immediateRender:true and silently stops
 * applying, which erases every opening state in the scene.
 */
(function (global) {
  "use strict";

  var S = null;      // the HF.scene context
  var refs = {};     // stage layer refs

  /** design-px → CSS px string, scaled by --u */
  function px(n) { return n * (S ? S.U : 1) + "px"; }

  /** mulberry32 — a tiny, fixed-sequence PRNG. Same seed ⇒ same frame, every render. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(cls, parent, tag) {
    var d = document.createElement(tag || "div");
    if (cls) d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }

  /**
   * Build the stage into #root: the far layers (ground, grid, shafts, bloom, dust) behind the
   * content, the near layers (grain, vignette, caption band) in front of it.
   *
   * @param {object} sctx           the HF.scene() context
   * @param {object} [o]
   * @param {string} [o.palette]    "body" (blue+gold, default) | "hero" (black+gold)
   * @param {number} [o.dust]       mote count (default 26; 0 disables)
   * @param {number} [o.seed]       PRNG seed for the motes (default 1)
   * @param {number} [o.bloomX]     bloom centre X in % (default 50)
   * @param {number} [o.bloomY]     bloom centre Y in % (default 44)
   */
  function init(sctx, o) {
    S = sctx; o = o || {};

    var root = S.root;
    root.classList.add(o.palette === "hero" ? "pal-hero" : "pal-body");

    var far = el("fx-far", null);
    far.setAttribute("data-layout-ignore", "");
    root.insertBefore(far, root.firstChild);
    refs.far = far;
    refs.ground = el("fx-ground", far);
    refs.grid = el("fx-grid", far);
    refs.shaftA = el("fx-shaft a", far);
    refs.shaftB = el("fx-shaft b", far);
    refs.bloom = el("fx-bloom", far);
    refs.dustLayer = el("fx-dust", far);

    var near = el("fx-near", null);
    near.setAttribute("data-layout-ignore", "");
    root.appendChild(near);
    refs.near = near;
    refs.grain = el("fx-grain", near);
    refs.vig = el("fx-vig", near);
    refs.band = el("fx-band", near);

    refs.world = document.getElementById("world");

    if (o.bloomX != null || o.bloomY != null) aim(o.bloomX, o.bloomY);

    var n = o.dust == null ? 26 : o.dust;
    refs.motes = n > 0 ? dust(refs.dustLayer, n, o.seed == null ? 1 : o.seed) : [];
    return refs;
  }

  /** Re-aim the focal bloom (percent of frame). Tween it instead for a moving light. */
  function aim(x, y) {
    if (x != null) refs.bloom.style.left = x + "%";
    if (y != null) refs.bloom.style.top = y + "%";
  }

  /** Deterministic dust motes spread over the frame, biased toward the centre band. */
  function dust(layer, count, seed) {
    var r = rng(seed), out = [];
    for (var i = 0; i < count; i++) {
      var m = el("fx-mote", layer);
      var size = 2 + r() * 5;
      m.style.width = px(size);
      m.style.height = px(size);
      m.style.left = (r() * 104 - 2) + "%";
      m.style.top = (8 + r() * 76) + "%";
      m.style.opacity = String(0.12 + r() * 0.5);
      m._drift = { x: (r() - 0.5) * 90, y: -18 - r() * 70, ph: r() };
      out.push(m);
    }
    return out;
  }

  /**
   * The ambient loop — the reason no frame of ours is ever dead. Breathing bloom, drifting light
   * shafts, a parallax grid, rising dust and stepped film grain, all over the FULL duration.
   * Costs the author one line and runs under whatever the scene does on top.
   */
  function ambient(tl, o) {
    o = o || {};
    var D = S.D;
    tl.fromTo(refs.bloom, { opacity: 0.6, scale: 0.97 }, { opacity: 0.9, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);
    tl.fromTo(refs.shaftA, { opacity: 0.34, x: px(-26) }, { opacity: 0.62, x: px(26), duration: D, ease: "sine.inOut" }, 0);
    tl.fromTo(refs.shaftB, { opacity: 0.52, x: px(22) }, { opacity: 0.3, x: px(-22), duration: D, ease: "sine.inOut" }, 0);
    tl.fromTo(refs.grid, { x: px(-14), y: px(8) }, { x: px(14), y: px(-8), duration: D, ease: "sine.inOut" }, 0);

    refs.motes.forEach(function (m, i) {
      var d = m._drift;
      tl.fromTo(m, { x: 0, y: 0 }, { x: px(d.x), y: px(d.y), duration: D, ease: "none" }, 0);
      tl.to(m, { opacity: "+=0", duration: 0.01 }, 0); // keep the element in the render tree
      tl.fromTo(m, { scale: 0.7 + d.ph * 0.5 }, { scale: 1.1 + d.ph * 0.4, duration: D / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
    });

    // film grain: step the tile so the noise "moves" like real grain (24 discrete positions)
    var g = { t: 0 }, r = rng(7);
    var jumps = [];
    for (var i = 0; i < 24; i++) jumps.push([Math.round(r() * 190), Math.round(r() * 190)]);
    tl.to(g, {
      t: 23.999, duration: D, ease: "none",
      onUpdate: function () {
        var j = jumps[Math.floor(g.t) % 24];
        refs.grain.style.backgroundPosition = j[0] + "px " + j[1] + "px";
      },
    }, 0);

    if (o.push !== false && refs.world) {
      // a slow, motivated push — the frame is never mechanically still (MOTION_SPEC §1)
      var from = o.pushFrom == null ? 1 : o.pushFrom;
      var to = o.pushTo == null ? 1.035 : o.pushTo;
      tl.fromTo(refs.world, { scale: from }, { scale: to, duration: D, ease: "sine.inOut" }, 0);
    }
    return tl;
  }

  /**
   * Build a PILE — the desk-lessons spine object: pages seen edge-on, stacked upward from a
   * baseline, each one a physical slab with its own width jitter, tilt and shadow.
   *
   * @param {HTMLElement} host
   * @param {object} o
   * @param {number} o.n            page count
   * @param {number} o.baseY        design-px from the TOP of the frame where page 0 sits
   * @param {number} [o.w]          nominal page width in design px (default 520)
   * @param {number} [o.h]          slab height in design px (default 15)
   * @param {number} [o.gap]        vertical pitch in design px (default 17)
   * @param {number} [o.x]          centre X in % (default 50)
   * @param {number} [o.seed]       PRNG seed (default 3)
   * @param {number[]} [o.gold]     indices rendered as the model's own (gold) pages
   * @returns {HTMLElement[]}       bottom-up; each carries ._y (its resting design-px top)
   */
  function pile(host, o) {
    var r = rng(o.seed == null ? 3 : o.seed);
    var w = o.w == null ? 520 : o.w, h = o.h == null ? 15 : o.h, gap = o.gap == null ? 17 : o.gap;
    var gold = o.gold || [];
    var out = [];
    for (var i = 0; i < o.n; i++) {
      var s = el("fx-slab" + (gold.indexOf(i) >= 0 ? " gold" : ""), host);
      var jw = w * (0.9 + r() * 0.2);
      var y = o.baseY - i * gap;
      s.style.width = px(jw);
      s.style.height = px(h);
      s.style.top = px(y);
      s.style.left = (o.x == null ? 50 : o.x) + "%";
      s.style.zIndex = String(100 + i);
      s._y = y;
      s._rot = (r() - 0.5) * 1.5;
      s._dx = (r() - 0.5) * 26;
      gsap.set(s, { xPercent: -50, x: px(s._dx), rotation: s._rot });
      out.push(s);
    }
    return out;
  }

  /** A face-on sheet with legible ruled "text" lines. Returns { sheet, lines }. */
  function sheet(host, o) {
    var s = el("fx-sheet", host);
    s.style.width = px(o.w);
    s.style.height = px(o.h);
    s.style.left = o.left != null ? o.left : "50%";
    s.style.top = px(o.top);
    if (o.left == null) gsap.set(s, { xPercent: -50 });
    var lines = [];
    var n = o.lines || 0, r = rng(o.seed == null ? 5 : o.seed);
    for (var i = 0; i < n; i++) {
      var l = el("fx-rule", s);
      l.style.left = px(o.pad == null ? 34 : o.pad);
      l.style.top = px((o.pad == null ? 34 : o.pad) + i * (o.pitch == null ? 26 : o.pitch));
      l.style.width = px((o.w - 2 * (o.pad == null ? 34 : o.pad)) * (0.55 + r() * 0.45));
      lines.push(l);
    }
    return { sheet: s, lines: lines };
  }

  /** The gold read-sweep bar (the model reading the pile). */
  function sweep(host, widthPx) {
    var s = el("fx-sweep", host);
    s.style.width = px(widthPx);
    s.style.top = "0px";
    gsap.set(s, { opacity: 0 });
    return s;
  }

  /** The desk plane a pile sits on (environmental, so a perspective read is allowed here). */
  function desk(host, o) {
    var d = el("fx-desk", host);
    d.style.width = px(o.w == null ? 900 : o.w);
    d.style.top = px(o.top);
    if (o.x != null) d.style.left = o.x + "%";
    return d;
  }

  /**
   * Tick a number up to its final value (MOTION_SPEC §4). Property tween + onUpdate, never a
   * callback, so it survives an out-of-order seek.
   */
  function count(tl, node, o) {
    var p = { v: o.from == null ? 0 : o.from };
    var fmt = o.fmt || function (v) { return String(Math.round(v)); };
    node.textContent = fmt(p.v);
    tl.to(p, {
      v: o.to, duration: o.dur == null ? 0.7 : o.dur, ease: o.ease || "power2.out",
      onUpdate: function () { node.textContent = fmt(p.v); },
    }, o.at);
    return tl;
  }

  /** Thousands separator for the big counters. */
  function comma(v) {
    return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /** A camera move on #world: push in / pull back / drift, on a beat. */
  function camera(tl, o) {
    if (!refs.world) return tl;
    tl.to(refs.world, {
      scale: o.scale == null ? 1 : o.scale,
      x: o.x == null ? 0 : px(o.x),
      y: o.y == null ? 0 : px(o.y),
      duration: o.dur == null ? 0.9 : o.dur,
      ease: o.ease || "power2.inOut",
    }, o.at);
    return tl;
  }

  /**
   * fromTo that cannot reach backwards in time. Always use this instead of tl.fromTo for a beat
   * that happens later than 0 (see the header note — immediateRender:true is the trap).
   */
  function fromTo(tl, target, from, to, at) {
    to = Object.assign({}, to);
    to.immediateRender = false;
    tl.fromTo(target, from, to, at);
    return tl;
  }

  /** Kill a myth plate: the gold slash strikes across it and the plate goes quiet. */
  function strike(tl, plate, slash, at) {
    tl.to(slash, { scaleX: 1, duration: 0.2, ease: "power4.out" }, at);
    tl.to(plate, { opacity: 0.3, duration: 0.3, ease: "sine.out" }, at + 0.12);
    return tl;
  }

  global.FX = {
    init: init, ambient: ambient, dust: dust, aim: aim,
    pile: pile, sheet: sheet, sweep: sweep, desk: desk,
    count: count, comma: comma, camera: camera, strike: strike, fromTo: fromTo,
    rng: rng, px: px, el: el,
    refs: refs,
  };
})(window);
