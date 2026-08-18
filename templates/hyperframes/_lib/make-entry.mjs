/**
 * make-entry.mjs (shared) — derive a disposable HyperFrames render entry from a variables file.
 *
 * Every scene used to carry its own 40-line copy of this with the scene name hard-coded in four
 * string replacements. That is boilerplate, not art direction, so it lives here once and each
 * scene's make-entry.mjs is two lines:
 *
 *     import { makeEntry } from "../../_lib/make-entry.mjs";
 *     makeEntry(import.meta.url, process.argv[2]);
 *
 * (Pre-existing scenes keep their own copies — this is additive, nothing was rewritten.)
 *
 * Contract, unchanged: data-duration = (durationFrames - 0.5) / fps, so the capture engine's ceil
 * lands on EXACTLY durationFrames. The entry lives in <scene>/compositions/ and therefore refers to
 * the scene's own css/js one level up — but the ../../_lib paths are left ALONE on purpose (the HF
 * file server roots at the scene dir; the CLI resolves _lib against the project dir and copies it in.
 * See _lib/hf-scene.js header — rewriting them 404s the render into a silent, frozen mp4).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {string} metaUrl   the caller's import.meta.url (its dir is the scene dir)
 * @param {string} varsPath  path to the job's variables.json
 * @returns {string} the entry path relative to the scene dir (also printed on stdout)
 */
export function makeEntry(metaUrl, varsPath) {
  const here = dirname(fileURLToPath(metaUrl));
  const name = basename(here);
  if (!varsPath) {
    console.error("usage: node make-entry.mjs <variables.json>");
    process.exit(1);
  }

  const V = JSON.parse(readFileSync(varsPath, "utf8"));
  const fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
  const W = Number(V.width) > 0 ? Math.round(Number(V.width)) : 1920;
  const H = Number(V.height) > 0 ? Math.round(Number(V.height)) : 1080;
  const FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 300;
  const dur = (FRAMES - 0.5) / fps;

  const html = readFileSync(join(here, "index.html"), "utf8")
    .replace(/data-width="\d+"/, `data-duration="${dur}" data-width="${W}"`)
    .replace(/data-height="\d+"/, `data-height="${H}"`)
    .replace(`href="${name}.css"`, `href="../${name}.css"`)
    .replace(`src="${name}.js"`, `src="../${name}.js"`)
    // A 3D scene reaches its vendored Three.js through a DYNAMIC import(), which resolves against
    // the DOCUMENT base URL — the entry in compositions/ — not against the scene's .js file. The
    // CLI compiler only rewrites src/href attributes, so it never sees a URL living in a JS string:
    // the scene declares it as window.__THREE_URL and we rewrite it here, like the assets above.
    // (No-op for the 2D scenes, which never set it.)
    .replace('window.__THREE_URL = "./vendor/', 'window.__THREE_URL = "../vendor/');

  const file = `render-entry-${W}x${H}-${FRAMES}f-${fps}fps.html`;
  mkdirSync(join(here, "compositions"), { recursive: true });
  writeFileSync(join(here, "compositions", file), html);
  console.log(`compositions/${file}`);
  return `compositions/${file}`;
}
