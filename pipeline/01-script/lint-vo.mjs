// The EDITING-LAW lint: a per-video, opt-in check that the narration never drifts into a tool tour.
//
// Some videos are built on screen-capture footage of a tool, and the failure mode is always the same:
// the voice starts narrating the CLICKING ("then I open the node, next I click Execute") instead of
// what changed and why. Nobody cares about the tool; they care how the problem got solved. That is a
// content rule, so it belongs at the SCRIPT gate — caught before the owner records, not in the edit.
//
// Opt-in per video: a brief with no `editing_law` block lints clean and this file does nothing. A
// brief that declares one gets it enforced, so the rule fails the gate rather than living in prose
// (016 declares both lists; see content/016-n8n-inbox-triage/brief.json).
//
//   import { lintVo } from "./lint-vo.mjs";        // pure: (script, law) -> findings[]
//   node pipeline/01-script/lint-vo.mjs <id>       // CLI: reads brief.json + script.json, exits 1 on findings

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Strip the leading quotes/dashes/brackets a sentence may open with before matching an opener. */
const stripLead = (s) => String(s).replace(/^[\s"'“”‘’(\[—–-]+/, "");

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Check every narration sentence against one video's editing law.
 *
 * @param {object} script  script.json
 * @param {object} [law]   brief.editing_law — { no_sentence_openers?: string[], banned_vo_terms?: string[] }
 * @returns {Array<{scene_id:string, rule:"no_sentence_openers"|"banned_vo_terms", match:string, sentence:string}>}
 */
export function lintVo(script, law) {
  if (!law) return [];
  const openers = (law.no_sentence_openers ?? []).map((p) => ({
    phrase: p,
    // an opener matches at the START of a sentence, on a word boundary ("go to" must not fire on "go together")
    re: new RegExp(`^${escapeRe(p).replace(/\s+/g, "\\s+")}\\b`, "i"),
  }));
  const terms = (law.banned_vo_terms ?? []).map((t) => ({
    phrase: t,
    // a banned term matches anywhere, whole-word ("api key" must not fire inside "rapid keystroke")
    re: new RegExp(`\\b${escapeRe(t).replace(/\s+/g, "\\s+")}\\b`, "i"),
  }));

  const findings = [];
  for (const scene of script.scenes ?? []) {
    for (const raw of scene.sentences ?? []) {
      const sentence = String(raw);
      const head = stripLead(sentence);
      for (const o of openers) {
        if (o.re.test(head)) findings.push({ scene_id: scene.id, rule: "no_sentence_openers", match: o.phrase, sentence });
      }
      for (const t of terms) {
        const hit = sentence.match(t.re);
        if (hit) findings.push({ scene_id: scene.id, rule: "banned_vo_terms", match: hit[0], sentence });
      }
    }
  }
  return findings;
}

/** Human-readable report for the CLI and for pasting into script.review.json. */
export function formatFindings(findings) {
  if (!findings.length) return "EDITING LAW: clean — no click-narration openers, no setup vocabulary in the VO.";
  return findings
    .map((f) => `  ${f.scene_id}  [${f.rule}: "${f.match}"]\n      ${f.sentence}`)
    .join("\n");
}

// ── CLI ──
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: node pipeline/01-script/lint-vo.mjs <content-id>   e.g. 016-n8n-inbox-triage");
    process.exit(2);
  }
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const dir = path.join(root, "content", id);
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  // a Short inherits its parent's brief (content/<id>/short/ has no brief.json of its own)
  const briefPath = fs.existsSync(path.join(dir, "brief.json")) ? path.join(dir, "brief.json") : path.join(dir, "..", "brief.json");
  const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
  const script = read("script.json");

  if (!brief.editing_law) {
    console.log(`SKIP ${id} — brief declares no editing_law (this lint is opt-in per video).`);
    process.exit(0);
  }
  const findings = lintVo(script, brief.editing_law);
  console.log(brief.editing_law.rule ? `LAW  ${brief.editing_law.rule}` : "");
  console.log(formatFindings(findings));
  if (findings.length) {
    console.error(`\nFAIL ${id} — ${findings.length} narration line(s) break the editing law.`);
    process.exit(1);
  }
  console.log(`PASS ${id}`);
}
