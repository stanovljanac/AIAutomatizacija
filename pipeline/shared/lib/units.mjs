/**
 * units.mjs — what a content id / ledger key names: a topic's long video, or one of its Shorts.
 *
 * One topic = one folder (CLAUDE.md). Its Shorts nest inside: `short/` (the first, the convention
 * since 2026-06) and, since 1B (D-074), `short-2/` … `short-9/` — a long video gives 2-3 Shorts cut
 * from its own scenes (make-shorts.mjs). The legacy flat folders (`002-short`, `003-short`) are
 * Shorts too. Every phase asked "is this a Short?" with its own copy of
 * `seg === "short" || seg.endsWith("-short")`; this is the one place that answers it now.
 *
 *   content id   "025-always-on-agents"          → the long
 *                "025-always-on-agents/short"    → Short 1
 *                "025-always-on-agents/short-2"  → Short 2
 */

/** A nested Short unit's folder name: `short` or `short-2` … `short-9`. */
export const SHORT_UNIT_RE = /^short(?:-([2-9]))?$/;

/** The same suffix on a ledger key / content key, for schemas and regex callers. */
export const SHORT_KEY_SUFFIX = "(/short(-[2-9])?)?";

/** Last path segment of a content id ("025-x/short-2" → "short-2"). */
export const lastSegment = (id) => String(id ?? "").split(/[\\/]/).pop();

/** Is this content id a Short (nested unit or legacy flat `NNN-short` folder)? */
export function isShortUnit(id) {
  const seg = lastSegment(id);
  return SHORT_UNIT_RE.test(seg) || seg.endsWith("-short");
}

/** "025-x/short-2" → 2 · "025-x/short" → 1 · a long or a legacy flat Short → null. */
export function shortIndex(id) {
  const parts = String(id ?? "").split(/[\\/]/);
  if (parts.length < 2) return null;
  const m = SHORT_UNIT_RE.exec(parts.at(-1));
  return m ? Number(m[1] ?? 1) : null;
}

/** The unit folder name for Short n (1-based): 1 → "short", 2 → "short-2". */
export function shortUnitName(n) {
  if (!Number.isInteger(n) || n < 1 || n > 9) throw new Error(`Short number must be 1..9, got ${n}`);
  return n === 1 ? "short" : `short-${n}`;
}

/** The topic folder a content id / ledger key belongs to ("025-x/short-2" → "025-x"). */
export function topicOf(id) {
  return String(id ?? "").replace(/\/short(?:-[2-9])?$/, "");
}

/** Sort Short unit names in their natural order (short, short-2, short-3 …). */
export function sortUnits(names) {
  return [...names].sort((a, b) => (shortIndex(`x/${a}`) ?? 0) - (shortIndex(`x/${b}`) ?? 0));
}
