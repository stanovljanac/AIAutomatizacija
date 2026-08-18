// The SHARED render-entry generator (templates/hyperframes/_lib/make-entry.mjs) that every bespoke
// scene's two-line make-entry.mjs delegates to. Its contract is load-bearing in two directions:
//
//   1. DURATION — hyperframes v0.6.70 reads the frame count from a STATIC attribute of the entry
//      HTML, so data-duration must ceil to EXACTLY durationFrames at the job's fps.
//   2. ASSET PATHS — the entry lives one level down (in compositions/), so the scene's OWN css/js
//      gain a leading ../, while the ../../_lib references are left ALONE on purpose (the HF file
//      server roots at the scene dir; the CLI resolves _lib against the project dir and copies it
//      in). A 3D scene's Three.js URL travels inside a JS string the compiler never scans, so it is
//      declared as window.__THREE_URL and rewritten here like any other local asset.
//
// A wrong path here does NOT fail the render: the CLI still exits 0 and still writes a valid but
// FROZEN mp4. These assertions are the cheap guard for that expensive silence.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { withTempDir } from "../shared/testkit/index.mjs";
import { makeEntry } from "../../templates/hyperframes/_lib/make-entry.mjs";

/** A minimal scene dir named `name`, whose index.html mirrors the real ones. */
function scaffold(dir, name, { three = false } = {}) {
  const sceneDir = path.join(dir, name);
  fs.mkdirSync(sceneDir, { recursive: true });
  fs.writeFileSync(
    path.join(sceneDir, "index.html"),
    [
      "<html>",
      "  <head>",
      '    <script src="../../_lib/gsap.min.js"></script>',
      '    <script src="../../_lib/hf-scene.js"></script>',
      '    <link rel="stylesheet" href="../../_lib/hf-fx.css" />',
      `    <link rel="stylesheet" href="${name}.css" />`,
      ...(three ? ['    <script>window.__THREE_URL = "./vendor/three.module.min.js";</script>'] : []),
      "  </head>",
      "  <body>",
      `    <div id="root" data-composition-id="${name}" data-width="1920" data-height="1080"></div>`,
      `    <script src="${name}.js"></script>`,
      "  </body>",
      "</html>",
    ].join("\n"),
  );
  return sceneDir;
}

function writeVars(dir, vars) {
  const p = path.join(dir, "variables.json");
  fs.writeFileSync(p, JSON.stringify(vars));
  return p;
}

/** Run makeEntry against a scaffolded scene and return { entryPath, html }. */
function run(sceneDir, varsPath) {
  const rel = makeEntry(pathToFileURL(path.join(sceneDir, "make-entry.mjs")).href, varsPath);
  return { rel, html: fs.readFileSync(path.join(sceneDir, rel), "utf8") };
}

test("data-duration ceils to EXACTLY durationFrames at the job fps", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "cw-handoff");
    for (const [frames, fps] of [[544, 30], [325, 30], [188, 30], [1, 30], [1500, 60], [7, 24]]) {
      const vars = writeVars(dir, { fps, width: 1920, height: 1080, durationFrames: frames });
      const { html } = run(sceneDir, vars);
      const dur = Number(html.match(/data-duration="([\d.]+)"/)[1]);
      assert.equal(Math.ceil(dur * fps), frames, `${frames}f @ ${fps}fps must ceil back to ${frames}`);
      assert.ok(dur * fps > frames - 1, "and must not ceil one frame short");
    }
  });
});

test("geometry comes from the variables, and the entry filename records it", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "cw-tower");
    const vars = writeVars(dir, { fps: 30, width: 1080, height: 1920, durationFrames: 325 });
    const { rel, html } = run(sceneDir, vars);
    assert.match(html, /data-width="1080"/);
    assert.match(html, /data-height="1920"/);
    // forward slashes even on Windows — this string is handed to the CLI's -c flag, not to fs
    assert.equal(rel, "compositions/render-entry-1080x1920-325f-30fps.html");
  });
});

test("the scene's OWN css/js gain ../ but the ../../_lib references are left alone", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "cws-forgot");
    const vars = writeVars(dir, { fps: 30, width: 1080, height: 1920, durationFrames: 188 });
    const { html } = run(sceneDir, vars);
    assert.match(html, /href="\.\.\/cws-forgot\.css"/, "scene css is one level up from compositions/");
    assert.match(html, /src="\.\.\/cws-forgot\.js"/, "scene js is one level up from compositions/");
    assert.match(html, /src="\.\.\/\.\.\/_lib\/hf-scene\.js"/, "_lib stays ../../ — rewriting it 404s the render");
    assert.match(html, /href="\.\.\/\.\.\/_lib\/hf-fx\.css"/);
    assert.ok(!html.includes("../../../_lib/"), "_lib must never gain a third level");
  });
});

test("a 3D scene's window.__THREE_URL is rewritten for the compositions/ entry", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "t3d-pile", { three: true });
    const vars = writeVars(dir, { fps: 30, width: 1920, height: 1080, durationFrames: 210 });
    const { html } = run(sceneDir, vars);
    assert.match(html, /window\.__THREE_URL = "\.\.\/vendor\/three\.module\.min\.js"/);
    assert.ok(!html.includes('"./vendor/'), "the canonical ./vendor/ form must not survive");
  });
});

test("the __THREE_URL rewrite is a no-op for the 2D scenes, which never declare it", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "cw-handoff");
    const vars = writeVars(dir, { fps: 30, width: 1920, height: 1080, durationFrames: 544 });
    const { html } = run(sceneDir, vars);
    assert.ok(!html.includes("__THREE_URL"), "nothing injected into a scene that has no 3D layer");
  });
});

test("defaults hold when the variables file omits fields", async () => {
  await withTempDir(async (dir) => {
    const sceneDir = scaffold(dir, "cw-handoff");
    const vars = writeVars(dir, {});
    const { html } = run(sceneDir, vars);
    assert.match(html, /data-width="1920"/);
    assert.match(html, /data-height="1080"/);
    assert.equal(Math.ceil(Number(html.match(/data-duration="([\d.]+)"/)[1]) * 30), 300);
  });
});
