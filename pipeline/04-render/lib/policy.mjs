// Render-time POLICY checks derived from the format recipe — pure + testable (no fs, no media).
// Today: the "strong hook in the first N seconds" rule (owner: jak hook i vizuelni detalji u
// prvih 30 sekundi). build-props warns; qa-video enforces hard on the rendered cut.

/** Base scene templates that count as a "hook-class" opener. */
export const HOOK_TEMPLATES = new Set(["hook-card"]);

/** Sparse templates — fine as SHORT overlays, but a long static hold of one is the "empty screen"
 *  failure (no-empty-scene rule). Shared by build-props (warn) and qa-video (hard). */
export const SPARSE_TEMPLATES = new Set(["lower-third", "transition"]);

/** True if a scene is a hook-class opener: a hook template, or a custom scene whose component
 *  name starts with "hook" (e.g. "hook-stat-reveal"). */
export function isHookClass(scene) {
  if (!scene) return false;
  if (HOOK_TEMPLATES.has(scene.template)) return true;
  return (
    scene.template === "custom" &&
    typeof scene.props?.component === "string" &&
    scene.props.component.startsWith("hook")
  );
}

/** True if at least one hook-class scene OPENS the video — i.e. starts before `openingEndFrame`.
 *  Null/undefined scene entries are ignored (defensive — never crash a render check). */
export function openingHasHook(scenes, openingEndFrame) {
  return (scenes ?? []).some((s) => s != null && isHookClass(s) && s.fromFrame < openingEndFrame);
}
