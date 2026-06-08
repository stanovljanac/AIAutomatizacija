// make-short (Phase B #2, feeds D-033): derive the Short script.json from the approved
// long script — the Short stops being a hand-built folder. Deterministic heuristic:
// hook + the strongest point(s) that fit the target + a short CTA.
import fs from "node:fs";
import path from "node:path";
import { validate } from "../shared/lib/validate-lib.mjs";

/** Estimate spoken seconds from narration word count at a given words-per-minute. */
export function estimateSeconds(scenes, wpm = 160) {
  const words = scenes.reduce(
    (n, s) => n + (s.narration || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );
  return (words / wpm) * 60;
}

/** Build a Short script object from a long script. Does not write to disk. */
export function makeShort(longScript, { targetSeconds = 55, wpm = 160 } = {}) {
  const scenes = longScript.scenes || [];
  const hook = scenes.find((s) => s.role === "hook") || scenes[0];
  const points = scenes.filter((s) => ["point", "demo"].includes(s.role));
  const cta = scenes.find((s) => s.role === "cta" || s.role === "outro");

  // De-dup by identity: when there is no hook role we fall back to scenes[0], which may also
  // appear in points/cta — never include the same scene twice.
  const picked = [];
  const seen = new Set();
  const add = (s) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      picked.push(s);
    }
  };
  add(hook);
  for (const p of points) {
    add(p);
    if (estimateSeconds(cta && !seen.has(cta) ? [...picked, cta] : picked, wpm) >= targetSeconds) break;
  }
  add(cta);

  return {
    id: longScript.id,
    language: longScript.language,
    archetype: longScript.archetype,
    angle: longScript.angle,
    title_working: `${longScript.title_working} (Short)`,
    target_seconds: targetSeconds,
    scenes: picked.map((s, i) => ({ ...s, id: `s${i + 1}` })),
  };
}

/** CLI: node make-short.mjs <id> — reads content/<id>/script.json, writes content/<id>/short/script.json. */
export function deriveShortFile(contentDir, { targetSeconds, wpm } = {}) {
  const longScript = JSON.parse(fs.readFileSync(path.join(contentDir, "script.json"), "utf8"));
  const short = makeShort(longScript, { targetSeconds, wpm });
  const { valid, errors } = validate(short, "script");
  if (!valid) throw new Error(`derived short invalid: ${JSON.stringify(errors)}`);
  const outDir = path.join(contentDir, "short");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "script.json"), JSON.stringify(short, null, 2) + "\n");
  return short;
}
