/**
 * make-entry.mjs — derive a disposable HyperFrames render entry from a variables file.
 *
 * MIRRORS scenes/hook-kinetic/make-entry.mjs EXACTLY (same contract, same patch math)
 * so hook-prism is a drop-in alternative the pipeline can render unchanged.
 *
 * WHY THIS EXISTS (hyperframes v0.6.70 limitation): the renderer takes the output
 * frame count and canvas size from STATIC attributes of the entry HTML — the
 * duration-probe page never receives --variables (createCaptureSession is called
 * without options.variables for the probe), so variables alone cannot set the
 * mp4 length. This script bridges the gap deterministically: it reads the SAME
 * variables file the render will use and emits compositions/render-entry-*.html —
 * a copy of index.html with the exact static geometry + duration patched in.
 *
 *   data-duration = (durationFrames - 0.5) / fps
 *
 * ceil(data-duration * fps) === durationFrames exactly for any integer frame
 * count (immune to float epsilon; a naive durationFrames/fps can ceil 1 high).
 *
 * Usage (the pipeline's render pre-step; prints the -c value on stdout):
 *   node scenes/hook-prism/make-entry.mjs <variables.json>
 *   npx hyperframes render ./scenes/hook-prism -c <printed path> \
 *     --variables-file <variables.json> --fps <fps> --quality high --output <clip.mp4>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const varsPath = process.argv[2];
if (!varsPath) {
  console.error("usage: node make-entry.mjs <variables.json>");
  process.exit(1);
}

const V = JSON.parse(readFileSync(varsPath, "utf8"));
const fps = Number(V.fps) > 0 ? Number(V.fps) : 30;
const W = Number(V.width) > 0 ? Math.round(Number(V.width)) : 1920;
const H = Number(V.height) > 0 ? Math.round(Number(V.height)) : 1080;
const FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 189;
const dur = (FRAMES - 0.5) / fps;

let html = readFileSync(join(here, "index.html"), "utf8");
// patch the root clip's static geometry + exact duration (the renderer reads
// these statically; the in-page script still applies the live variables).
// the generated entry lives one level down (in compositions/), so every local
// asset reference is rewritten with a leading ../ — same rewrite hook-kinetic uses.
html = html
  .replace('data-width="1920"', `data-duration="${dur}" data-width="${W}"`)
  .replace('data-height="1080"', `data-height="${H}"`)
  .replace('href="hook-prism.css"', 'href="../hook-prism.css"')
  .replace('src="hook-prism.js"', 'src="../hook-prism.js"')
  // hook-prism.js dynamically import()s the Three.js ESM. A dynamic import path is
  // resolved against the DOCUMENT base URL (the entry HTML), not the JS file — so
  // when the entry moves into compositions/ the path must gain a leading ../ too.
  // We feed the URL through window.__THREE_URL and rewrite it here, exactly like
  // the other local assets above.
  .replace('window.__THREE_URL = "./vendor/three.module.min.js"', 'window.__THREE_URL = "../vendor/three.module.min.js"');

const name = `render-entry-${W}x${H}-${FRAMES}f-${fps}fps.html`;
mkdirSync(join(here, "compositions"), { recursive: true });
writeFileSync(join(here, "compositions", name), html);
console.log(`compositions/${name}`);
