// T5.1 — scaffoldVideo core (reused by the autonomous picker): id allocation, lean Short, brief seed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { slugify, nextVideoId, scaffoldVideo } from "./new-video.mjs";
import { validate } from "../shared/lib/validate-lib.mjs";
import { withTempDir } from "../shared/testkit/index.mjs";

/** Build a throwaway content/ + _TEMPLATE/ pair; return { content, template }. */
function stageTemplate(dir, existingIds = []) {
  const content = path.join(dir, "content");
  const template = path.join(content, "_TEMPLATE");
  fs.mkdirSync(path.join(template, "voice"), { recursive: true });
  fs.mkdirSync(path.join(template, "captures"), { recursive: true });
  fs.writeFileSync(path.join(template, "voice", ".gitkeep"), "");
  fs.writeFileSync(path.join(template, "brief.json"), "{}");
  fs.writeFileSync(path.join(template, "README.md"), "tpl");
  for (const id of existingIds) fs.mkdirSync(path.join(content, id), { recursive: true });
  return { content, template };
}

test("slugify lowercases, hyphenates, and trims", () => {
  assert.equal(slugify("Invoice Emails (Sheets)!"), "invoice-emails-sheets");
  assert.equal(slugify("--Already-Slug--"), "already-slug");
  assert.equal(slugify("@@@"), "");
});

test("nextVideoId is max NNN + 1, zero-padded", async () => {
  await withTempDir(async (dir) => {
    const { content } = stageTemplate(dir, ["001-a", "004-b"]);
    assert.equal(nextVideoId("foo", { content }), "005-foo");
  });
});

test("scaffoldVideo creates the folder + lean Short and writes a schema-valid brief", async () => {
  await withTempDir(async (dir) => {
    const { content, template } = stageTemplate(dir, ["003-x"]);
    const { id, dest } = scaffoldVideo("invoice emails", {
      titleWorking: "Email Invoices",
      brief: { archetype: "mini-demo", task: "documents", angle: "the freelancer gets paid" },
      content,
      template,
    });
    assert.equal(id, "004-invoice-emails");
    assert.ok(fs.existsSync(path.join(dest, "short", "voice", ".gitkeep")), "lean Short voice/ exists");
    assert.ok(!fs.existsSync(path.join(dest, "short", "brief.json")), "Short has no brief.json (pruned)");
    assert.ok(!fs.existsSync(path.join(dest, "short", "captures")), "Short has no captures/ (pruned)");
    const brief = JSON.parse(fs.readFileSync(path.join(dest, "brief.json"), "utf8"));
    assert.equal(brief.id, "004-invoice-emails");
    assert.equal(brief.archetype, "mini-demo");
    assert.equal(brief.task, "documents");
    assert.equal(brief.title_working, "Email Invoices");
    const { valid, errors } = validate(brief, "brief");
    assert.ok(valid, JSON.stringify(errors));
  });
});

test("scaffoldVideo never lets a brief override change the id", async () => {
  await withTempDir(async (dir) => {
    const { content, template } = stageTemplate(dir);
    const { id } = scaffoldVideo("foo", { brief: { id: "999-hijack" }, content, template });
    assert.equal(id, "001-foo");
    const brief = JSON.parse(fs.readFileSync(path.join(content, id, "brief.json"), "utf8"));
    assert.equal(brief.id, "001-foo", "override id must be ignored");
  });
});

test("scaffoldVideo rejects an empty slug and a missing template", async () => {
  await withTempDir(async (dir) => {
    const { content, template } = stageTemplate(dir);
    assert.throws(() => scaffoldVideo("@@@", { content, template }), /Invalid slug/);
    assert.throws(() => scaffoldVideo("ok", { content, template: path.join(dir, "nope") }), /Template not found/);
  });
});
