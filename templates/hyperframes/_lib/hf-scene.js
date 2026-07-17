/* hf-scene.js — the shared HyperFrames scene contract (D-060 Phase 3).
 *
 * Every bespoke scene under scenes/<name>/ used to retype ~20 lines of identical preamble:
 * readVars(), the fps/W/H/FRAMES/D derivation, the props/beats normalisation, the root
 * data-duration/geometry write, the portrait class, the --u unit, and cl()/beatAt(). That is the
 * authoring tax this file removes — the scene file should contain ART DIRECTION, not contract
 * plumbing (bespoke-first: Remotion/HyperFrames assemble, the scene expresses the idea).
 *
 * Loaded as a CLASSIC script (no modules — scenes are plain <script> pages), after gsap:
 *   <script src="../../_lib/gsap.min.js"></script>
 *   <script src="../../_lib/hf-scene.js"></script>
 *
 * WHY ../../_lib AND NOT ../_lib (load-bearing, measured 2026-07-17):
 *   The render entry is a disposable file in <scene>/compositions/, and the HyperFrames file server
 *   roots at the SCENE dir — so a browser-relative ../_lib escapes the root and 404s. The CLI's
 *   compiler resolves src/href against the PROJECT dir, finds an outside-the-project asset, copies
 *   it into the render output and rewrites the path ("[Compiler] Found N asset(s) outside project
 *   directory"). ../../_lib is what resolves — from the project dir — to templates/hyperframes/_lib.
 *   That indirection is why make-entry.mjs must NOT rewrite the _lib paths the way it rewrites the
 *   scene's own css/js. A wrong path here does not fail the render: gsap goes undefined, no timeline
 *   registers, and hyperframes still exits 0 with a valid, STATIC mp4. Verify with a real render.
 *
 * USAGE (the whole contract, two lines):
 *   var S = HF.scene({ id: "my-scene", width: 1080, height: 1920, frames: 290, beatLo: 0.02, beatHi: 0.4 });
 *   var fps = S.fps, W = S.W, H = S.H, D = S.D, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;
 *   var tl = HF.register("my-scene", gsap.timeline({ paused: true }));
 *
 * Determinism is the contract: NO Math.random / Date.now anywhere in a scene. One paused,
 * seek-driven GSAP timeline registered on window.__timelines[id].
 */
(function (global) {
  "use strict";

  /**
   * The variables the pipeline passes (compile-hyperframes.mjs jobVariables):
   * { fps, width, height, durationFrames, durationSeconds, revealsSeconds[], props{} }.
   * Order matters: the runtime's own getVariables() wins when present; otherwise fall back to the
   * index.html declared defaults, then let an injected __hfVariables override them.
   */
  function readVars() {
    if (global.__hyperframes && typeof global.__hyperframes.getVariables === "function") {
      return global.__hyperframes.getVariables();
    }
    var out = {};
    try {
      var decls = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
      for (var i = 0; i < decls.length; i++) out[decls[i].id] = decls[i].default;
    } catch (e) {}
    if (global.__hfVariables && typeof global.__hfVariables === "object") Object.assign(out, global.__hfVariables);
    return out;
  }

  /** clamp */
  function cl(t, lo, hi) {
    return t < lo ? lo : t > hi ? hi : t;
  }

  /**
   * Derive the scene context from the variables and apply it to the DOM.
   *
   * @param {object} opts
   * @param {string} opts.id            data-composition-id (also the __timelines key)
   * @param {number} [opts.width]       fallback canvas width  when no variable is passed
   * @param {number} [opts.height]      fallback canvas height when no variable is passed
   * @param {number} [opts.frames]      fallback duration in frames when no variable is passed
   * @param {number} [opts.fps]         fallback fps (default 30)
   * @param {number} [opts.beatLo]      beatAt() lower clamp (default 0.1)
   * @param {number} [opts.beatHi]      beatAt() upper margin — clamps to D - beatHi (default 0.4)
   * @param {boolean} [opts.sortBeats]  sort revealsSeconds ascending (default true)
   * @returns {{V,props,fps,W,H,FRAMES,D,U,portrait,beats,root,cl,beatAt}}
   */
  function scene(opts) {
    opts = opts || {};
    var V = readVars();
    var fps = Number(V.fps) > 0 ? Number(V.fps) : Number(opts.fps) > 0 ? Number(opts.fps) : 30;
    var W = Number(V.width) > 0 ? Number(V.width) : Number(opts.width) > 0 ? Number(opts.width) : 1920;
    var H = Number(V.height) > 0 ? Number(V.height) : Number(opts.height) > 0 ? Number(opts.height) : 1080;
    var FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : Number(opts.frames) > 0 ? Math.round(Number(opts.frames)) : 300;
    var D = FRAMES / fps;
    var props = V.props && typeof V.props === "object" ? V.props : {};

    var beats = Array.isArray(V.revealsSeconds)
      ? V.revealsSeconds.filter(function (t) {
          return typeof t === "number" && isFinite(t);
        })
      : [];
    if (opts.sortBeats !== false) {
      beats = beats.slice().sort(function (a, b) {
        return a - b;
      });
    }

    // apply the EXACT duration + geometry before the capture engine reads it.
    // data-duration = (FRAMES - 0.5) / fps  =>  the engine's ceil lands on EXACTLY FRAMES.
    var root = document.getElementById("root");
    root.setAttribute("data-duration", String((FRAMES - 0.5) / fps));
    root.setAttribute("data-width", String(W));
    root.setAttribute("data-height", String(H));
    var portrait = H > W;
    if (portrait) root.classList.add("portrait");

    // --u: the responsive unit every scene sizes against, so ONE file serves 16:9 and 9:16.
    var U = Math.min(W, H) / 1080;
    document.documentElement.style.setProperty("--u", String(U));

    var lo = typeof opts.beatLo === "number" ? opts.beatLo : 0.1;
    var hi = typeof opts.beatHi === "number" ? opts.beatHi : 0.4;

    /**
     * Map sentence beat `idx` (revealsSeconds, narration-anchored) to a safe time on the timeline,
     * falling back to `frac` of the duration when the pipeline passed no beat for it.
     */
    function beatAt(idx, frac) {
      var t = beats.length > idx ? beats[idx] : D * frac;
      return cl(t, lo, D - hi);
    }

    return {
      V: V,
      props: props,
      fps: fps,
      W: W,
      H: H,
      FRAMES: FRAMES,
      D: D,
      U: U,
      portrait: portrait,
      beats: beats,
      root: root,
      cl: cl,
      beatAt: beatAt,
    };
  }

  /** Register the scene's paused, seek-driven timeline under `id` (what the capture engine reads). */
  function register(id, tl) {
    global.__timelines = global.__timelines || {};
    global.__timelines[id] = tl;
    return tl;
  }

  global.HF = { scene: scene, register: register, readVars: readVars, cl: cl };
})(window);
