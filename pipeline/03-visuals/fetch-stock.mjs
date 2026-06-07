#!/usr/bin/env node
/**
 * 03-visuals: fetch fitting stock VIDEO b-roll for any scene that declares
 * `props.broll = "<query>"` in scene-plan.json. Prefer VIDEO (Pexels, then Pixabay);
 * images only if a fitting video doesn't exist. The clip is dark-graded at render time
 * (SceneWrapper) so on-screen text stays legible — it must fit our segment, never bury it.
 *
 *   node pipeline/03-visuals/fetch-stock.mjs <content_id>
 *
 * Needs PEXELS_API_KEY and/or PIXABAY_API_KEY in .env (free). Downloads to
 * content/<id>/broll/<slug>.mp4 (git-ignored). Idempotent: skips clips already present.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const id = process.argv[2];
if (!id) { console.error("usage: fetch-stock.mjs <content_id>"); process.exit(1); }

function env(key) {
  try {
    const t = readFileSync(join(ROOT, ".env"), "utf8");
    const m = t.match(new RegExp("^" + key + "\\s*=\\s*(.+)$", "m"));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, "") : "";
  } catch { return ""; }
}
const PEXELS = process.env.PEXELS_API_KEY || env("PEXELS_API_KEY");
const PIXABAY = process.env.PIXABAY_API_KEY || env("PIXABAY_API_KEY");

const cdir = join(ROOT, "content", id);
const plan = JSON.parse(readFileSync(join(cdir, "scene-plan.json"), "utf8"));
const slug = (q) => String(q).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const queries = [...new Set(plan.scenes.map((s) => s.props?.broll).filter(Boolean).map(String))];
if (!queries.length) { console.log("no scenes declare props.broll — nothing to fetch."); process.exit(0); }
console.log(`b-roll queries: ${queries.join(" | ")}  (PEXELS=${!!PEXELS} PIXABAY=${!!PIXABAY})`);

const outDir = join(cdir, "broll");
mkdirSync(outDir, { recursive: true });

async function dl(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download HTTP ${r.status}`);
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function pexels(q) {
  if (!PEXELS) return null;
  const u = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=landscape&size=medium&per_page=5`;
  const r = await fetch(u, { headers: { Authorization: PEXELS } });
  if (!r.ok) throw new Error(`pexels HTTP ${r.status}`);
  const j = await r.json();
  const vid = (j.videos || [])[0];
  if (!vid) return null;
  const files = (vid.video_files || []).filter((f) => f.file_type === "video/mp4" && f.width);
  files.sort((a, b) => Math.abs((a.width || 0) - 1600) - Math.abs((b.width || 0) - 1600)); // ~1600px = light HD
  return files[0] ? { link: files[0].link, credit: vid.user?.name, src: "Pexels" } : null;
}

async function pixabay(q) {
  if (!PIXABAY) return null;
  const u = `https://pixabay.com/api/videos/?key=${PIXABAY}&q=${encodeURIComponent(q)}&per_page=5`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`pixabay HTTP ${r.status}`);
  const j = await r.json();
  const hit = (j.hits || [])[0];
  if (!hit) return null;
  const v = hit.videos?.medium || hit.videos?.large || hit.videos?.small;
  return v ? { link: v.url, credit: hit.user, src: "Pixabay" } : null;
}

let ok = 0;
for (const q of queries) {
  const dest = join(outDir, `${slug(q)}.mp4`);
  if (existsSync(dest)) { console.log(`skip "${q}" (already have ${slug(q)}.mp4)`); ok++; continue; }
  let pick = null;
  try { pick = await pexels(q); } catch (e) { console.warn(`  pexels "${q}": ${e.message}`); }
  if (!pick) { try { pick = await pixabay(q); } catch (e) { console.warn(`  pixabay "${q}": ${e.message}`); } }
  if (!pick) { console.warn(`NO RESULT for "${q}" — set a key in .env or try another query.`); continue; }
  try {
    await dl(pick.link, dest);
    console.log(`OK "${q}" → broll/${slug(q)}.mp4  (${pick.src}${pick.credit ? ", credit: " + pick.credit : ""})`);
    ok++;
  } catch (e) { console.warn(`FAILED download "${q}": ${e.message}`); }
}
console.log(`done: ${ok}/${queries.length} clips ready in content/${id}/broll/`);
