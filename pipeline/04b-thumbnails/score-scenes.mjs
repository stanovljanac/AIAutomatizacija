// 04b-thumbnails / scene scorer — deterministic "would this frame work as a thumbnail?"
// score from scene metadata WE author (scene-plan / timeline). No vision model, no AI ranking
// (owner decision: the agent offers candidates, the owner picks; revisit only with real CTR data).
//
// Design: ONE exported WEIGHTS object of criteria — the score is the sum of fired criteria and
// `reasons` is exactly the list that fired (free by construction). When CTR data arrives, tuning
// = editing weights, never rewriting logic. Best-thumbnail heuristic: one large focal object,
// high contrast, minimal text — NOT "most crowded scene" (the density trap).

export const WEIGHTS = {
  hero_scene: 30, // bespoke HyperFrames / hook-class — big focal object, hero craft
  high_contrast: 20, // opener + hook-class scenes run the black+gold hero palette (MOTION_SPEC)
  dominant_focal: 20, // one large focal element (big stat / short verdict), few siblings
  minimal_text: 15, // little rendered prop text (word walls don't read at thumbnail size)
  low_clutter: 15, // no icon/card wall: any array prop >4 entries loses this (the "crowded" trap)
  no_cta: 10, // not a subscribe/CTA beat (outright CTA/outro/transition scenes are excluded)
};

// Scenes that can never be a thumbnail: end-cards, connective tissue, overlays.
export const EXCLUDED_TEMPLATES = new Set(["cta-card", "transition", "lower-third"]);

// Prop keys whose text is not (meaningfully) rendered on screen: authoring notes, addressing,
// and the tiny on-screen source chip (mandatory per D-026 — never punish a sourced stat).
const NON_RENDERED_TEXT_KEYS = new Set(["note", "hf_scene", "language", "source"]);

// Templates whose center is a single big visual object (vs. text-only section headers).
const FOCAL_TEMPLATES = new Set(["hook-card", "term-highlight", "stat-callout"]);

/** Recursively collect rendered text length + array shapes from a props object. Pure. */
export function propShape(props, acc = { textChars: 0, maxArrayLen: 0, totalArrayItems: 0 }) {
  if (props == null) return acc;
  for (const [key, val] of Object.entries(props)) {
    if (NON_RENDERED_TEXT_KEYS.has(key)) continue;
    if (typeof val === "string") acc.textChars += val.length;
    else if (Array.isArray(val)) {
      acc.maxArrayLen = Math.max(acc.maxArrayLen, val.length);
      acc.totalArrayItems += val.length;
      for (const item of val) {
        if (typeof item === "string") acc.textChars += item.length;
        else if (item && typeof item === "object") propShape(item, acc);
      }
    } else if (val && typeof val === "object") propShape(val, acc);
  }
  return acc;
}

const MINIMAL_TEXT_MAX_CHARS = 120;
const LOW_CLUTTER_MAX_ARRAY = 4;
const FOCAL_MAX_SIBLINGS = 4;
const FOCAL_TITLE_MAX_CHARS = 40;

function isHookClass(scene) {
  const hf = scene.props?.hf_scene ?? "";
  return String(scene.template ?? "").startsWith("hook") || String(hf).startsWith("hook-");
}

function isExcluded(scene) {
  if (EXCLUDED_TEMPLATES.has(scene.template)) return true;
  const hf = String(scene.props?.hf_scene ?? "");
  if (/outro/i.test(hf)) return true;
  const text = JSON.stringify(scene.props ?? {});
  if (/subscribe/i.test(text)) return true;
  // Bare title-on-background card (section-header with no visual element at all): a thumbnail
  // reject by owner rule (no-title-card-scenes) — words on a background don't earn a candidate
  // slot. A section-header that carries visual props (arrays/value) stays in the running.
  if (scene.template === "section-header") {
    const shape = propShape(scene.props ?? {});
    if (shape.totalArrayItems === 0 && (scene.props?.value ?? null) == null) return true;
  }
  return false;
}

/**
 * Score ONE scene (a timeline.json scenes[] entry or an equivalent { template, engine, props }).
 * @param {object} scene  { template, engine, props }
 * @param {object} [opts] { index } — position in the timeline (index 0 = the opener)
 * @returns {{ score:number, reasons:string[], excluded?:boolean }}
 */
export function thumbnailScore(scene, { index = -1 } = {}) {
  if (isExcluded(scene)) return { score: 0, reasons: [], excluded: true };

  const props = scene.props ?? {};
  const shape = propShape(props);
  const hookClass = isHookClass(scene);

  const fired = {
    hero_scene: scene.engine === "hyperframes" || hookClass,
    high_contrast: hookClass || index === 0,
    dominant_focal:
      shape.totalArrayItems <= FOCAL_MAX_SIBLINGS &&
      (props.value != null ||
        (FOCAL_TEMPLATES.has(scene.template) &&
          [props.title, props.term].some((t) => typeof t === "string" && t.length > 0 && t.length <= FOCAL_TITLE_MAX_CHARS))),
    minimal_text: shape.textChars <= MINIMAL_TEXT_MAX_CHARS,
    low_clutter: shape.maxArrayLen <= LOW_CLUTTER_MAX_ARRAY,
    no_cta: true, // CTA-ish scenes were excluded above; everything else earns this
  };

  const reasons = Object.keys(WEIGHTS).filter((k) => fired[k]);
  const score = reasons.reduce((sum, k) => sum + WEIGHTS[k], 0);
  return { score, reasons };
}

/**
 * Score every scene of a timeline (or any { scenes:[...] }) and return them ranked best-first.
 * Stable: ties keep timeline order (earlier scene wins — openers make better thumbnails).
 * @returns {Array<{ scene_id:string, template:string, index:number, score:number, reasons:string[], excluded:boolean }>}
 */
export function scoreScenes(timeline) {
  const rows = (timeline.scenes ?? []).map((sc, index) => {
    const { score, reasons, excluded = false } = thumbnailScore(sc, { index });
    return { scene_id: sc.scene_id, template: sc.template, index, score, reasons, excluded };
  });
  return rows.slice().sort((a, b) => b.score - a.score || a.index - b.index);
}
