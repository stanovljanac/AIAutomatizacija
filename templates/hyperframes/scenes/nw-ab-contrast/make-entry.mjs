/**
 * make-entry.mjs — derive a disposable HyperFrames render entry from a variables file.
 * data-duration = (durationFrames - 0.5) / fps  => ceils to EXACTLY durationFrames.
 *   node scenes/nw-ab-contrast/make-entry.mjs <variables.json>
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
const W = Number(V.width) > 0 ? Math.round(Number(V.width)) : 1080;
const H = Number(V.height) > 0 ? Math.round(Number(V.height)) : 1920;
const FRAMES = Number(V.durationFrames) > 0 ? Math.round(Number(V.durationFrames)) : 546;
const dur = (FRAMES - 0.5) / fps;

let html = readFileSync(join(here, "index.html"), "utf8");
html = html
  .replace('data-width="1080"', `data-duration="${dur}" data-width="${W}"`)
  .replace('data-height="1920"', `data-height="${H}"`)
  .replace('href="nw-ab-contrast.css"', 'href="../nw-ab-contrast.css"')
  .replace('src="nw-ab-contrast.js"', 'src="../nw-ab-contrast.js"');

const name = `render-entry-${W}x${H}-${FRAMES}f-${fps}fps.html`;
mkdirSync(join(here, "compositions"), { recursive: true });
writeFileSync(join(here, "compositions", name), html);
console.log(`compositions/${name}`);
