// Tests for knowledge-lint (KOS validator) — builds throwaway instances in tmp dirs.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  parseFrontmatter,
  extractLinks,
  stripCode,
  lintInstance,
  fixInstance,
} from "./knowledge-lint.mjs";

const NOW = new Date("2026-07-04T12:00:00Z");

function makeInstance() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kos-"));
  const write = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  write(
    "index.md",
    `# Test instance — index

- [PROJECT.md](PROJECT.md)
- [Lessons](lessons/index.md)
- [Patterns](patterns/index.md)
`
  );
  write("PROJECT.md", `# Profile\n\nGoal, canonical map, sources, local rules.\n`);
  write(
    "lessons/index.md",
    `# Lessons

<!-- AUTO-INDEX:BEGIN -->
- [L1](2026-06-28-l1.md) — lesson, stable
<!-- AUTO-INDEX:END -->
`
  );
  write(
    "lessons/2026-06-28-l1.md",
    note("lesson", "stable", ["../patterns/p1.md"], "L1", "[profile](../PROJECT.md)")
  );
  write(
    "patterns/index.md",
    `# Patterns

<!-- AUTO-INDEX:BEGIN -->
- [P1](p1.md) — pattern, stable
<!-- AUTO-INDEX:END -->
`
  );
  write(
    "patterns/p1.md",
    note("pattern", "stable", ["../lessons/2026-06-28-l1.md"], "P1", "[home](../index.md)")
  );
  return { root, write };
}

function note(type, status, related, title, extraBody = "", extraFm = "") {
  return `---
type: ${type}
status: ${status}
created: 2026-06-28
updated: 2026-06-28
related: [${related.join(", ")}]
depends_on: []
${extraFm}---

# ${title}

**Purpose:** this file exists to test ${title}.
**When to read:** read this when testing.
**Do not duplicate:** extend this file instead of creating a new one.

Body links: ${related.map((r) => `[edge](${r})`).join(" ")} ${extraBody}
`;
}

const msgs = (arr) => arr.map((x) => `${x.file} :: ${x.msg}`).join("\n");

// ---------- pure helpers ----------

test("parseFrontmatter: inline arrays, dash lists, scalars", () => {
  const { data, error } = parseFrontmatter(
    `---\ntype: lesson\nstatus: draft\ncreated: 2026-01-01\nupdated: 2026-01-02\nrelated: [a.md, "b.md"]\ndepends_on:\n  - c.md\n---\nbody`
  );
  assert.equal(error, null);
  assert.deepEqual(data.related, ["a.md", "b.md"]);
  assert.deepEqual(data.depends_on, ["c.md"]);
  assert.equal(data.updated, "2026-01-02");
});

test("parseFrontmatter: missing/unclosed/unparseable", () => {
  assert.match(parseFrontmatter("no fm").error, /missing/);
  assert.match(parseFrontmatter("---\ntype: x\n").error, /unclosed/);
  assert.match(parseFrontmatter("---\n:::bad:::\n---\nx").error, /unparseable/);
});

test("extractLinks: skips externals/anchors/code, strips fragments", () => {
  const links = extractLinks(
    `[a](../a.md) [b](b.md#sec) [ext](https://x.com/p.md) [m](mailto:x@y.z) [anchor](#here)
\`[code](c.md)\`
\`\`\`
[fenced](d.md)
\`\`\`
![img](../img.png)`
  );
  assert.deepEqual(links, ["../a.md", "b.md", "../img.png"]);
});

test("stripCode removes fenced blocks and inline spans", () => {
  assert.equal(stripCode("a `x` b ```\nzzz\n``` c").includes("zzz"), false);
});

// ---------- baseline ----------

test("baseline fixture is fully clean (0 errors, 0 warnings)", () => {
  const { root } = makeInstance();
  const res = lintInstance(root, { now: NOW });
  assert.equal(res.errors.length, 0, msgs(res.errors));
  assert.equal(res.warnings.length, 0, msgs(res.warnings));
  assert.equal(res.fileCount, 6);
});

// ---------- check 1: frontmatter ----------

test("check 1: bad enum, bad date, unknown key, deprecated conditionals", () => {
  const { root, write } = makeInstance();
  write("lessons/bad.md", note("saga", "stable", ["../patterns/p1.md"], "Bad"));
  write(
    "lessons/bad2.md",
    `---\ntype: lesson\nstatus: stable\ncreated: not-a-date\nupdated: 2026-06-28\nbogus_key: 1\n---\n\n# B2\n\n**Purpose:** x.\n**When to read:** x.\n**Do not duplicate:** x.\n`
  );
  write("lessons/dep.md", note("lesson", "deprecated", ["../patterns/p1.md"], "Dep"));
  write(
    "lessons/sup.md",
    note("lesson", "stable", ["../patterns/p1.md"], "Sup", "", "superseded_by: 2026-06-28-l1.md\n")
  );
  const { errors } = lintInstance(root, { now: NOW });
  const text = msgs(errors);
  assert.match(text, /bad\.md :: frontmatter: \/type/);
  assert.match(text, /bad2\.md :: frontmatter: \/created/);
  assert.match(text, /bad2\.md :: frontmatter: .*additional properties/);
  assert.match(text, /dep\.md :: frontmatter: .*superseded_by/);
  assert.match(text, /sup\.md :: frontmatter: \/status/);
});

// ---------- check 2: Purpose header ----------

test("check 2: missing Purpose-header lines are errors", () => {
  const { root, write } = makeInstance();
  write(
    "lessons/nohdr.md",
    `---\ntype: lesson\nstatus: draft\ncreated: 2026-06-28\nupdated: 2026-06-28\n---\n\n# NoHdr\n\n**Purpose:** present.\n\nbody [x](../patterns/p1.md)\n`
  );
  const { errors } = lintInstance(root, { now: NOW });
  const text = msgs(errors);
  assert.match(text, /nohdr\.md :: missing Purpose-header line: \*\*When to read:\*\*/);
  assert.match(text, /nohdr\.md :: missing Purpose-header line: \*\*Do not duplicate:\*\*/);
  assert.doesNotMatch(text, /missing Purpose-header line: \*\*Purpose/);
});

// ---------- check 3: links ----------

test("check 3: broken links (body + frontmatter) and wikilinks", () => {
  const { root, write } = makeInstance();
  write(
    "lessons/links.md",
    note("lesson", "stable", ["../patterns/ghost.md"], "Links", "[gone](nope.md) [[WikiStyle]]")
  );
  const { errors } = lintInstance(root, { now: NOW });
  const text = msgs(errors);
  assert.match(text, /links\.md :: broken link: \.\.\/patterns\/ghost\.md/);
  assert.match(text, /links\.md :: broken link: nope\.md/);
  assert.match(text, /links\.md :: contains \[\[wikilinks\]\]/);
});

test("check 3: links outside the instance resolve against the real fs", () => {
  const { root, write } = makeInstance();
  fs.writeFileSync(path.join(path.dirname(root), path.basename(root) + "-ext.md"), "x");
  const ext = `../../${path.basename(root)}-ext.md`;
  write("lessons/out.md", note("lesson", "stable", ["../patterns/p1.md"], "Out", `[e](${ext})`));
  const { errors } = lintInstance(root, { now: NOW });
  assert.doesNotMatch(msgs(errors), /out\.md :: broken link/);
});

// ---------- check 4: sizes ----------

test("check 4: index hard cap 200, leaf 650 error / 500 warning", () => {
  const { root, write } = makeInstance();
  const pad = (n) => Array.from({ length: n }, (_, i) => `line ${i}`).join("\n");
  write("glossary/index.md", `# G\n\n<!-- AUTO-INDEX:BEGIN -->\n- [Big](big.md) — glossary, stable\n- [Mid](mid.md) — glossary, stable\n<!-- AUTO-INDEX:END -->\n${pad(200)}`);
  write("glossary/big.md", note("glossary", "stable", ["../patterns/p1.md"], "Big", pad(660)));
  write("glossary/mid.md", note("glossary", "stable", ["../patterns/p1.md"], "Mid", pad(520)));
  // reach them from the global index
  const idx = path.join(root, "index.md");
  fs.appendFileSync(idx, `- [G](glossary/index.md)\n`);
  const { errors, warnings } = lintInstance(root, { now: NOW });
  assert.match(msgs(errors), /glossary\/index\.md :: index is \d+ lines \(hard cap 200\)/);
  assert.match(msgs(errors), /big\.md :: \d+ lines \(> 650\)/);
  assert.match(msgs(warnings), /mid\.md :: \d+ lines \(500–650\)/);
});

// ---------- check 5: orphans + thin linking ----------

test("check 5: unreachable note = orphan error; <2 outbound = warning", () => {
  const { root, write } = makeInstance();
  write("research/lonely.md", note("research", "draft", [], "Lonely"));
  // research/ has no index and is not linked from the global index at all
  const { errors, warnings } = lintInstance(root, { now: NOW });
  assert.match(msgs(errors), /lonely\.md :: orphan: unreachable from index\.md/);
  assert.match(msgs(errors), /research\/ :: category folder has no index\.md/);
  assert.match(msgs(warnings), /lonely\.md :: only 0 outbound link\(s\)/);
});

test("check 5: missing global index reported once, reachability skipped", () => {
  const { root } = makeInstance();
  fs.rmSync(path.join(root, "index.md"));
  const { errors } = lintInstance(root, { now: NOW });
  assert.match(msgs(errors), /\. :: missing global index\.md/);
  assert.doesNotMatch(msgs(errors), /orphan/);
});

// ---------- check 6: category integrity ----------

test("check 6: root note, deep nesting, unknown category, unlisted note", () => {
  const { root, write } = makeInstance();
  write("stray.md", note("concept", "draft", ["patterns/p1.md"], "Stray"));
  write("lessons/deep/x.md", note("lesson", "draft", [], "Deep"));
  write("misc/m.md", note("concept", "draft", [], "M"));
  write("patterns/unlisted.md", note("pattern", "draft", ["../lessons/2026-06-28-l1.md"], "U"));
  const { errors } = lintInstance(root, { now: NOW });
  const text = msgs(errors);
  assert.match(text, /stray\.md :: note must live exactly one level deep/);
  assert.match(text, /lessons\/deep\/x\.md :: note must live exactly one level deep/);
  assert.match(text, /misc\/m\.md :: unknown category "misc"/);
  assert.match(text, /patterns\/unlisted\.md :: not listed in patterns\/index\.md/);
});

// ---------- checks 7 & 8: deprecated placement, stale drafts ----------

test("checks 7+8: deprecated outside archive warns; stale draft warns; archive clean", () => {
  const { root, write } = makeInstance();
  write(
    "lessons/olddep.md",
    note("lesson", "deprecated", ["../patterns/p1.md"], "OldDep", "", "superseded_by: 2026-06-28-l1.md\n")
  );
  write("lessons/stale.md", note("lesson", "draft", ["../patterns/p1.md"], "Stale")); // updated 2026-06-28
  write(
    "archive/index.md",
    `# Archive\n\n<!-- AUTO-INDEX:BEGIN -->\n- [Arch](a1.md) — lesson, deprecated\n<!-- AUTO-INDEX:END -->\n`
  );
  write(
    "archive/a1.md",
    note("lesson", "deprecated", ["../lessons/2026-06-28-l1.md"], "Arch", "[p](../patterns/p1.md)", "superseded_by: ../lessons/2026-06-28-l1.md\n")
  );
  fs.appendFileSync(path.join(root, "index.md"), `- [Archive](archive/index.md)\n`);
  fs.appendFileSync(
    path.join(root, "lessons/index.md"),
    `- [OldDep](olddep.md)\n- [Stale](stale.md)\n`
  );
  const stale = new Date("2026-11-01T00:00:00Z"); // 2026-06-28 is >90 days back
  const { errors, warnings } = lintInstance(root, { now: stale });
  assert.equal(errors.length, 0, msgs(errors));
  const text = msgs(warnings);
  assert.match(text, /olddep\.md :: deprecated but not yet moved to archive\//);
  assert.doesNotMatch(text, /a1\.md :: deprecated but/);
  assert.match(text, /stale\.md :: draft untouched for \d+ days/);
  assert.doesNotMatch(text, /olddep\.md :: draft untouched/); // deprecated, not draft
});

// ---------- check 9: evidence for canon ----------

test("check 9: canonical pattern needs an evidence link; concept exempt", () => {
  const { root, write } = makeInstance();
  write("patterns/canon-bad.md", note("pattern", "canonical", ["p1.md"], "CanonBad"));
  write(
    "patterns/canon-ok.md",
    note("pattern", "canonical", ["../lessons/2026-06-28-l1.md"], "CanonOk")
  );
  write("concepts/index.md", `# C\n\n<!-- AUTO-INDEX:BEGIN -->\n- [CC](cc.md) — concept, canonical\n<!-- AUTO-INDEX:END -->\n`);
  write("concepts/cc.md", note("concept", "canonical", ["../patterns/p1.md", "../PROJECT.md"], "CC"));
  fs.appendFileSync(path.join(root, "index.md"), `- [Concepts](concepts/index.md)\n`);
  fs.appendFileSync(
    path.join(root, "patterns/index.md"),
    `- [CanonBad](canon-bad.md)\n- [CanonOk](canon-ok.md)\n`
  );
  const { errors } = lintInstance(root, { now: NOW });
  const text = msgs(errors);
  assert.match(text, /canon-bad\.md :: canonical pattern\/decision must link/);
  assert.doesNotMatch(text, /canon-ok\.md :: canonical/);
  assert.doesNotMatch(text, /cc\.md :: canonical/);
});

// ---------- --fix ----------

test("--fix: generates backlinks footers, is idempotent, keeps lint clean", () => {
  const { root } = makeInstance();
  const first = fixInstance(root);
  assert.ok(first.changed.includes("lessons/2026-06-28-l1.md"));
  assert.ok(first.changed.includes("patterns/p1.md"));
  const l1 = fs.readFileSync(path.join(root, "lessons/2026-06-28-l1.md"), "utf8");
  assert.match(l1, /## Backlinks\n<!-- AUTO-GENERATED by knowledge-lint --fix\. Do not edit\. -->\n- \[P1\]\(\.\.\/patterns\/p1\.md\)/);
  const second = fixInstance(root);
  assert.deepEqual(second.changed, []);
  const res = lintInstance(root, { now: NOW });
  assert.equal(res.errors.length, 0, msgs(res.errors));
});

test("--fix: regenerates AUTO-INDEX block with new notes (then lint is clean)", () => {
  const { root, write } = makeInstance();
  write("lessons/2026-07-01-l2.md", note("lesson", "draft", ["../patterns/p1.md", "2026-06-28-l1.md"], "L2"));
  assert.match(msgs(lintInstance(root, { now: NOW }).errors), /l2\.md :: not listed/);
  const { changed } = fixInstance(root);
  assert.ok(changed.includes("lessons/index.md"));
  const idx = fs.readFileSync(path.join(root, "lessons/index.md"), "utf8");
  assert.match(idx, /- \[L1\]\(2026-06-28-l1\.md\) — lesson, stable\n- \[L2\]\(2026-07-01-l2\.md\) — lesson, draft/);
  const res = lintInstance(root, { now: NOW });
  assert.equal(res.errors.length, 0, msgs(res.errors));
});

test("--fix: notes with no inbound get '_none yet_' and footer links don't count as authored", () => {
  const { root, write } = makeInstance();
  write("research/index.md", `# R\n\n<!-- AUTO-INDEX:BEGIN -->\n- [R1](r1.md) — research, draft\n<!-- AUTO-INDEX:END -->\n`);
  write("research/r1.md", note("research", "draft", ["../patterns/p1.md", "../PROJECT.md"], "R1"));
  fs.appendFileSync(path.join(root, "index.md"), `- [Research](research/index.md)\n`);
  fixInstance(root);
  const r1 = fs.readFileSync(path.join(root, "research/r1.md"), "utf8");
  assert.match(r1, /## Backlinks\n<!-- AUTO-GENERATED[^\n]*-->\n- _none yet_/);
  // p1 now has a backlink line to r1; that generated link must not create authored edges
  const { warnings } = lintInstance(root, { now: NOW });
  assert.doesNotMatch(msgs(warnings), /r1\.md :: only \d+ outbound/); // has 2 authored
});
