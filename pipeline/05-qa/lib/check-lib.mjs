// Deterministic, artifact-level VIDEO QA (the MECHANICAL half of qa-video; fails-closed). Pure —
// no fs, no media — so it is unit-testable: runChecks(props, fmt, { vertical, durationSeconds }).
// Thresholds come from the resolved FORMAT recipe. The PERCEPTUAL half (legibility-in-context,
// emphasis, demo cursor, scene "fit", angle) stays in the qa-video SKILL (agent + vision on stills).
// Emits checks in the qa.schema.json shape: { name, pass, severity, detail?, scene?, fix? }.
import { isHookClass, openingHasHook, SPARSE_TEMPLATES } from "../../04-render/lib/policy.mjs";

const mk = (name, pass, severity, detail, extra = {}) => ({
  name,
  pass,
  severity,
  ...(detail ? { detail } : {}),
  ...extra,
});

// Paid SaaS products we never tell a viewer to use unless the owner pre-approved them for the video
// (brief.approved_tools) — owner rule 2026-06-24 ([[no-paid-saas-products]]). Generic categories
// ("a receipt OCR") and free/generic tools are fine. Owner-extensible via fmt.deny_paid_saas.
export const PAID_SAAS_DENYLIST = ["expensify", "quickbooks", "freshbooks", "dext", "bill.com", "sap concur", "zoho books"];

// The reskinnable "gallery" templates — the slideshow culprits the variety rules guard against.
const GALLERY_TEMPLATES = new Set(["bullet-steps", "term-highlight", "icon-list", "stat-callout", "comparison-table", "section-header", "lower-third"]);
// TITLE-ONLY "card" kinds — a title/subtitle on a background with NO concrete visualization. These are
// the exact scenes the owner rejected on 009 ([[no-title-card-scenes]]): "empty slides with just a
// title". A bespoke custom component or a RICH HF hero VISUALIZES its point (= fine); these do not.
// (hook-card is the sanctioned opener and is excluded; lower-third is covered by the no-empty rule.)
const TEXT_CARD_TEMPLATES = new Set(["section-header", "term-highlight", "stat-callout", "cta-card"]);
// HyperFrames heroes that are just kinetic text on a background (no subject visualization).
const TEXT_ONLY_HF = new Set(["hook-kinetic"]);
// Below this scene count a video is too small to judge variety (a 1–3 scene test clip isn't a slideshow).
const VARIETY_MIN_SCENES = 5;

/** A scene's visual "kind": bespoke scenes are identified by their component/hero so two DIFFERENT
 *  bespoke scenes don't read as a repeat; gallery scenes are identified by their template. */
function sceneKind(s) {
  // A multi-PHASE HyperFrames scene file is how a `carry` boundary is authored (D-060): one file draws
  // both sides of the cut so the shared object lands at the same size and position. Two phases are a
  // CONTINUATION, not the "same card again" smell — so the phase is part of the kind. The same file at
  // the same phase back-to-back is still a repeat (it would be literally the same clip twice).
  if (s.engine === "hyperframes") {
    const base = s.props?.hf_scene ?? s.props?.hfSrc ?? "hf";
    const phase = s.props?.phase;
    return `hf:${base}${phase == null ? "" : `#${phase}`}`;
  }
  if (s.template === "custom") return `custom:${s.props?.component ?? "custom"}`;
  return s.template;
}
/** Bespoke / non-slideshow scenes: authored HyperFrames, custom components, and real screen-capture. */
function isBespoke(s) {
  return s.engine === "hyperframes" || s.template === "custom" || s.template === "capture-segment";
}
/** A "title card": a title/subtitle on a background with no concrete visualization — the owner's
 *  rejected 009 scenes. Custom components and RICH HF heroes visualize their point and are NOT cards;
 *  text-only HF heroes (hook-kinetic) and the gallery TEXT templates ARE. (capture-segment = real footage.) */
function isTitleCard(s) {
  if (s.engine === "hyperframes") return TEXT_ONLY_HF.has(s.props?.hf_scene);
  if (s.template === "custom" || s.template === "capture-segment") return false;
  return TEXT_CARD_TEMPLATES.has(s.template);
}
/** Recursively collect every string value (titles, labels, list items…) from a scene's props. */
function collectStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) collectStrings(x, out);
  else if (v && typeof v === "object") for (const k of Object.keys(v)) collectStrings(v[k], out);
  return out;
}

/**
 * Run the artifact-level QA checks over a video's render props.
 * @param props  the emitted Remotion props (fps, introFrames, outroFrames, totalFrames, scenes[], captions[]).
 * @param fmt    the resolved format recipe.
 * @param opts   { vertical, durationSeconds, approvedTools } — vertical = the 9:16 Short; duration
 *               from alignment; approvedTools = brief.approved_tools (paid SaaS the owner OK'd).
 * @returns { pass, checks } — pass is false if ANY high-severity check fails (fails-closed).
 */
export function runChecks(props, fmt, { vertical, durationSeconds, approvedTools = [] }) {
  const checks = [];
  const fps = props?.fps ?? 30;
  const scenes = props?.scenes ?? [];
  const captions = props?.captions ?? [];

  // 1. Length — the Short band is a HARD rule; the long band is a soft sanity cap.
  const band = vertical ? fmt.length?.short : fmt.length?.long;
  if (band) {
    if (vertical) {
      const pass = durationSeconds >= band.min && durationSeconds <= band.max;
      checks.push(
        mk(
          "short_length",
          pass,
          "high",
          pass
            ? `${durationSeconds.toFixed(1)}s within ${band.min}-${band.max}s`
            : `${durationSeconds.toFixed(1)}s outside ${band.min}-${band.max}s (target ~${band.target}s)`,
          pass ? {} : { fix: "Trim or expand the Short script to the target length." },
        ),
      );
    } else if (band.max != null) {
      const pass = durationSeconds <= band.max;
      checks.push(
        mk("long_length", pass, "medium", `${durationSeconds.toFixed(1)}s (soft cap ${band.max}s)`,
          pass ? {} : { fix: "Unusually long — confirm the topic genuinely needs it." }),
      );
    }
  }

  // 2. Strong hook in the opening window (HARD). The Short uses a TIGHTER window than the long-form
  //    (Short psychology — the purpose-built hook must land in the first ~3s, not 30s).
  const vd = fmt.hook?.visual_detail ?? {};
  if (vd.require_hook_class_scene) {
    const openSec = vertical ? (vd.short_first_seconds ?? 3) : (vd.first_seconds ?? 30);
    const openingEnd = (props?.introFrames ?? 0) + Math.round(openSec * fps);
    const pass = openingHasHook(scenes, openingEnd);
    const why = scenes.length
      ? scenes.some(isHookClass)
        ? "hook starts after the window"
        : `first scene = ${scenes[0]?.template}`
      : "no scenes";
    checks.push(
      mk("hook_opening", pass, "high",
        pass ? `a hook-class scene opens within ${openSec}s` : `no hook-class scene in the first ${openSec}s (${why})`,
        pass ? {} : { fix: "Open with a hook-card or a custom hook-* scene (e.g. hook-stat-reveal)." }),
    );
  }

  // 3. Caption density (HARD) — no cue exceeds the format's words-per-chunk (would overflow lines).
  const maxWords = fmt.captions?.max_words ?? 7;
  const tooLong = captions.filter((c) => (c.words?.length ?? 0) > maxWords);
  checks.push(
    mk("caption_density", tooLong.length === 0, "high",
      tooLong.length === 0
        ? `all ${captions.length} caption cues ≤ ${maxWords} words`
        : `${tooLong.length} caption cue(s) > ${maxWords} words (would exceed ${fmt.captions?.max_lines ?? 2} lines)`,
      tooLong.length === 0 ? {} : { fix: "Re-chunk captions (build-props derives these from alignment)." }),
  );

  // 4. No empty / long static hold (HARD).
  const maxHold = fmt.pacing?.max_static_hold_seconds ?? 6;
  const offenders = scenes.filter((s) => {
    const secs = (s.durFrames ?? 0) / fps;
    const dynamic = Array.isArray(s.props?.reveals) && s.props.reveals.length > 1;
    return SPARSE_TEMPLATES.has(s.template) && secs > maxHold && !dynamic;
  });
  if (offenders.length === 0) {
    checks.push(mk("no_empty_scene", true, "high", `no sparse scene held > ${maxHold}s`));
  } else {
    for (const s of offenders) {
      checks.push(
        mk("no_empty_scene", false, "high",
          `${s.sceneId} (${s.template}) held ${((s.durFrames ?? 0) / fps).toFixed(1)}s > ${maxHold}s with no reveals`,
          { scene: s.sceneId, fix: "Split into reveal beats or use a fuller/animated scene." }),
      );
    }
  }

  // 5. Coverage (HARD) — scenes must span the whole narration window; a gap renders as black.
  if (scenes.length && props?.totalFrames != null) {
    const tol = Math.round(0.5 * fps);
    const winStart = props.introFrames ?? 0;
    const winEnd = props.totalFrames - (props.outroFrames ?? 0);
    const intervals = scenes
      .map((s) => [s.fromFrame ?? 0, (s.fromFrame ?? 0) + (s.durFrames ?? 0)])
      .sort((a, b) => a[0] - b[0]);
    let cursor = winStart;
    let gap = null;
    for (const [a, b] of intervals) {
      if (a > cursor + tol) { gap = [cursor, a]; break; }
      cursor = Math.max(cursor, b);
    }
    if (!gap && cursor < winEnd - tol) gap = [cursor, winEnd];
    checks.push(
      mk("coverage", gap == null, "high",
        gap == null
          ? "scenes cover the full narration window (no black gaps)"
          : `${((gap[1] - gap[0]) / fps).toFixed(1)}s uncovered at ${(gap[0] / fps).toFixed(1)}s — would render black`,
        gap == null ? {} : { fix: "Ensure scenes span every sentence; check the build-props windows." }),
    );
  }

  // 6. No paid-SaaS product names (HARD — owner rule 2026-06-24) on screen or in narration, unless the
  //    owner pre-approved them for this video (brief.approved_tools). Scans captions (= narration) AND
  //    every scene-prop string (titles/labels/list items).
  {
    const approved = new Set((approvedTools ?? []).map((t) => String(t).toLowerCase()));
    const deny = (fmt.deny_paid_saas ?? PAID_SAAS_DENYLIST).filter((n) => !approved.has(String(n).toLowerCase()));
    const hay = [
      ...captions.flatMap((c) => (c.words ?? []).map((w) => w.w)),
      ...scenes.flatMap((s) => collectStrings(s.props ?? {})),
    ].join("  ").toLowerCase();
    const hits = deny.filter((n) => hay.includes(String(n).toLowerCase()));
    checks.push(
      mk("no_paid_saas", hits.length === 0, "high",
        hits.length === 0
          ? "no paid-SaaS product names on screen or in narration"
          : `names paid SaaS not in brief.approved_tools: ${hits.join(", ")}`,
        hits.length === 0 ? {} : { fix: "Use a generic category (e.g. 'a receipt OCR') or add the product to brief.approved_tools if the owner approved it." }),
    );
  }

  // 7. No identical scene kind BACK-TO-BACK (HARD) — the visible "same card again" smell. Bespoke
  //    scenes with different components are NOT repeats; consecutive screen-captures are allowed.
  {
    const adjacent = [];
    for (let i = 1; i < scenes.length; i++) {
      if (scenes[i].template !== "capture-segment" && sceneKind(scenes[i]) === sceneKind(scenes[i - 1])) adjacent.push(scenes[i].sceneId);
    }
    checks.push(
      mk("no_adjacent_repeat", adjacent.length === 0, "high",
        adjacent.length === 0 ? "no identical template back-to-back" : `identical template back-to-back at: ${adjacent.join(", ")}`,
        adjacent.length === 0 ? {} : { fix: "Break consecutive identical scenes with a different layout / bespoke scene." }),
    );
  }

  // 7b. No TITLE-ONLY card scenes (HARD — owner rule 2026-06-28, [[no-title-card-scenes]]). A title/
  //     subtitle on a background with no concrete visualization is the "empty slide" the owner rejected
  //     on 009; EVERY scene must VISUALIZE its point like s4 (MoneyLeakRun). Custom components + rich HF
  //     heroes pass; the gallery TEXT templates + text-only HF (hook-kinetic) fail. Runs at any length.
  {
    const cards = scenes.filter(isTitleCard);
    checks.push(
      mk("no_title_card", cards.length === 0, "high",
        cards.length === 0
          ? "no title-only card scenes — every scene visualizes its point"
          : `title-only card scene(s): ${cards.map((s) => `${s.sceneId} (${sceneKind(s)})`).join(", ")}`,
        cards.length === 0 ? {} : { fix: "Replace title-on-background cards with a bespoke custom component or a rich HF hero that VISUALIZES the point (s4 = MoneyLeakRun is the bar)." }),
    );
  }

  // 8–9. Variety rules (HARD) — only meaningful on real-length videos (>= VARIETY_MIN_SCENES).
  if (scenes.length >= VARIETY_MIN_SCENES) {
    // 8. Bespoke ratio — don't ship the template gallery on repeat (the slideshow the owner rejected).
    const minRatio = fmt.scene_set?.custom_ratio_min ?? 0.25;
    const bespoke = scenes.filter(isBespoke).length;
    const ratio = bespoke / scenes.length;
    checks.push(
      mk("bespoke_ratio", ratio >= minRatio, "high",
        `${bespoke}/${scenes.length} bespoke scenes (${Math.round(ratio * 100)}% vs ${Math.round(minRatio * 100)}% min)`,
        ratio >= minRatio ? {} : { fix: "Author more scenes as bespoke HyperFrames/custom (MOTION_SPEC bespoke-first) instead of reskinned templates." }),
    );

    // 9. No gallery template used too many times (e.g. 5× term-highlight = the 008 slideshow).
    //    Count ONLY scenes that actually render as the gallery template — a bespoke HyperFrames/custom
    //    scene merely carries a gallery `template` as a render FALLBACK (e.g. section-header) and is a
    //    distinct authored scene, so it must not inflate the repeat count (mirrors sceneKind/no_adjacent_repeat).
    const counts = {};
    for (const s of scenes) if (!isBespoke(s) && GALLERY_TEMPLATES.has(s.template)) counts[s.template] = (counts[s.template] ?? 0) + 1;
    const maxSame = fmt.scene_set?.max_same_template ?? 3;
    const over = Object.entries(counts).filter(([, n]) => n > maxSame);
    checks.push(
      mk("template_repeat", over.length === 0, "high",
        over.length === 0 ? `no gallery template used > ${maxSame}×` : `${over.map(([k, n]) => `${k} ×${n}`).join(", ")} (> ${maxSame})`,
        over.length === 0 ? {} : { fix: "Replace repeated gallery cards with distinct bespoke scenes (no slideshow on repeat)." }),
    );
  }

  const pass = checks.every((c) => c.severity !== "high" || c.pass);
  return { pass, checks };
}

/** One-line human summary for the report + log. */
export function summarize(checks) {
  const fails = checks.filter((c) => !c.pass);
  if (!fails.length) return `QA passed: ${checks.length} checks, all green.`;
  return (
    `QA found ${fails.length} issue(s): ` +
    fails.map((c) => `${c.name}${c.scene ? ` [${c.scene}]` : ""}`).join(", ")
  );
}
