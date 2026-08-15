// The editing-law lint: opt-in per video, catches click-narration and setup vocabulary in the VO.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lintVo, formatFindings } from "./lint-vo.mjs";

const LAW = {
  rule: "Nobody cares about the tool. They care how the problem got solved.",
  no_sentence_openers: ["then i", "next i", "go to", "i click"],
  banned_vo_terms: ["oauth", "api key", "google cloud"],
};

const scriptOf = (...sentences) => ({ scenes: [{ id: "s1", sentences }] });

test("a script with no editing_law lints clean (the rule is opt-in per video)", () => {
  const s = scriptOf("Then I click Execute and paste the API key.");
  assert.deepEqual(lintVo(s, undefined), []);
  assert.deepEqual(lintVo(s, null), []);
});

test("clean narration produces no findings", () => {
  const s = scriptOf(
    "First: my own five labels instead of the template's eight.",
    "The model box comes out and a different one goes in.",
  );
  assert.deepEqual(lintVo(s, LAW), []);
});

test("flags a sentence that opens with a click-narration phrase", () => {
  const f = lintVo(scriptOf("Then I open the node and change the prompt."), LAW);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, "no_sentence_openers");
  assert.equal(f[0].match, "then i");
  assert.equal(f[0].scene_id, "s1");
});

test("openers only match at the START of a sentence, not mid-sentence", () => {
  assert.deepEqual(lintVo(scriptOf("It reads the email, and then I get a label."), LAW), []);
});

test("openers match on a word boundary — 'go to' must not fire on 'go together'", () => {
  assert.deepEqual(lintVo(scriptOf("Go together with a human gate and it's safe."), LAW), []);
  assert.equal(lintVo(scriptOf("Go to the settings screen."), LAW).length, 1);
});

test("openers survive a leading quote or dash", () => {
  assert.equal(lintVo(scriptOf('"Next I open the mapper," I said.'), LAW).length, 1);
  assert.equal(lintVo(scriptOf("— Then I reconnect the wire."), LAW).length, 1);
});

test("flags banned setup vocabulary anywhere in the sentence", () => {
  const f = lintVo(scriptOf("You paste the API key into Google Cloud."), LAW);
  assert.equal(f.length, 2);
  assert.deepEqual(f.map((x) => x.rule), ["banned_vo_terms", "banned_vo_terms"]);
  assert.deepEqual(f.map((x) => x.match.toLowerCase()), ["api key", "google cloud"]);
});

test("banned terms are whole-word — 'api key' must not fire inside 'rapid keystroke'", () => {
  assert.deepEqual(lintVo(scriptOf("A rapid keystroke is not a problem."), LAW), []);
});

test("banned terms are case-insensitive and multi-word tolerant of extra spacing", () => {
  assert.equal(lintVo(scriptOf("The OAuth screen is fiddly."), LAW).length, 1);
  assert.equal(lintVo(scriptOf("Open Google  Cloud first."), LAW).length, 1);
});

test("findings carry the scene id so review can point at the beat", () => {
  const script = { scenes: [{ id: "s5", sentences: ["Then I click Execute."] }, { id: "s6", sentences: ["Clean line."] }] };
  const f = lintVo(script, LAW);
  assert.equal(f.length, 1);
  assert.equal(f[0].scene_id, "s5");
});

test("an empty law list is a no-op rather than a crash", () => {
  assert.deepEqual(lintVo(scriptOf("Then I click Execute."), { no_sentence_openers: [], banned_vo_terms: [] }), []);
});

test("formatFindings reports clean and reports failures with the offending line", () => {
  assert.match(formatFindings([]), /clean/i);
  const out = formatFindings(lintVo(scriptOf("Then I click Execute."), LAW));
  assert.match(out, /s1/);
  assert.match(out, /then i/);
  assert.match(out, /Then I click Execute\./);
});

test("016's real script passes its own declared editing law", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const dir = path.join(root, "content", "016-n8n-inbox-triage");
  if (!fs.existsSync(path.join(dir, "brief.json"))) return; // per-video content is git-ignored
  const brief = JSON.parse(fs.readFileSync(path.join(dir, "brief.json"), "utf8"));
  const script = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
  assert.ok(brief.editing_law, "016 declares an editing law");
  assert.deepEqual(lintVo(script, brief.editing_law), []);
});
