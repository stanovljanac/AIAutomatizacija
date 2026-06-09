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

/**
 * Run the artifact-level QA checks over a video's render props.
 * @param props  the emitted Remotion props (fps, introFrames, outroFrames, totalFrames, scenes[], captions[]).
 * @param fmt    the resolved format recipe.
 * @param opts   { vertical, durationSeconds } — vertical = the 9:16 Short; duration from alignment.
 * @returns { pass, checks } — pass is false if ANY high-severity check fails (fails-closed).
 */
export function runChecks(props, fmt, { vertical, durationSeconds }) {
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

  // 2. Strong hook in the opening window (HARD).
  const vd = fmt.hook?.visual_detail ?? {};
  if (vd.require_hook_class_scene) {
    const openSec = vd.first_seconds ?? 30;
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
