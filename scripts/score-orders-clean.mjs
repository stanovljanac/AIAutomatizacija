#!/usr/bin/env node
/**
 * Score a "cleaned" orders CSV (produced by an AI) against the synthetic ground truth.
 * Honest verification for the Claude-vs-ChatGPT experiment (video 004).
 *
 *   node scripts/score-orders-clean.mjs <cleaned.csv> [original.csv] [answerkey.json]
 *   defaults: original = content/004-.../captures/sample/orders.csv
 *             key      = content/004-.../captures/sample/orders.answerkey.json
 */
import { readFileSync } from "node:fs";

const BASE = "content/004-claude-vs-chatgpt-spreadsheets/captures/sample";
const cleanedPath = process.argv[2];
const origPath = process.argv[3] || `${BASE}/orders.csv`;
const keyPath = process.argv[4] || `${BASE}/orders.answerkey.json`;
if (!cleanedPath) { console.error("usage: score-orders-clean.mjs <cleaned.csv> [orig] [key]"); process.exit(1); }

// minimal CSV parse (handles "..."-quoted fields with commas; no embedded newlines in our data)
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.length);
  const rows = lines.map((line) => {
    const out = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else { if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; }
    }
    out.push(cur); return out;
  });
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const clean = parseCsv(readFileSync(cleanedPath, "utf8"));
const key = JSON.parse(readFileSync(keyPath, "utf8"));
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
const r2 = (n) => Math.round(n * 100) / 100;

console.log(`\n=== ${cleanedPath} ===`);
console.log(`data rows: ${clean.length}  (expected 2000${clean.length === 2000 ? "" : "  ⚠ ROW COUNT CHANGED"})`);

// ── dedup: emails that still carry more than one name spelling ──
const byEmail = {};
for (const r of clean) (byEmail[String(r.email ?? "").trim().toLowerCase()] ??= new Set()).add(r.customer_name);
const stillInconsistent = Object.entries(byEmail).filter(([, s]) => s.size > 1);
console.log(`\nR1 dedup — emails still with >1 name spelling: ${stillInconsistent.length}  (perfect = 0; truth had 40 to fix)`);
for (const [e, s] of stillInconsistent.slice(0, 6)) console.log(`   ${e} => ${[...s].map((x) => JSON.stringify(x)).join("  ")}`);
if (stillInconsistent.length > 6) console.log(`   …and ${stillInconsistent.length - 6} more`);

// ── dates ──
let iso = 0, blank = 0; const nonIso = [];
for (const r of clean) { const d = String(r.order_date ?? "").trim(); if (isISO(d)) iso++; else if (!d || /^(nat|nan|none)$/i.test(d)) blank++; else nonIso.push({ id: r.order_id, d }); }
console.log(`\nR2 dates — ISO: ${iso} / ${clean.length}  | blank/NaT: ${blank}  | left non-ISO: ${nonIso.length}`);
for (const x of nonIso.slice(0, 8)) console.log(`   order ${x.id}: ${JSON.stringify(x.d)}`);
console.log(`   (truth: 30 were genuinely unparseable: ${key.round2_mixed_dates.broken_unparseable_dates})`);
// how were the KNOWN-broken dates handled?
const brokenIds = new Set((key.round2_mixed_dates.broken_order_ids || []).map(String));
const brokenHandled = clean.filter((r) => brokenIds.has(String(r.order_id))).map((r) => `${r.order_id}:${JSON.stringify(String(r.order_date).trim())}`);
console.log(`   known-broken now → ${brokenHandled.slice(0, 8).join("  ")}`);

// ── totals ──
let ok = 0, bad = 0; const badEx = [];
for (const r of clean) {
  const q = parseFloat(r.qty), u = parseFloat(r.unit_price), t = parseFloat(r.line_total);
  if (!Number.isFinite(t)) { bad++; badEx.push(`${r.order_id}:${JSON.stringify(String(r.line_total))}`); continue; }
  if (Math.abs(t - r2(q * u)) < 0.005) ok++; else { bad++; badEx.push(`${r.order_id}:${r.line_total}≠${r2(q * u)}`); }
}
console.log(`\nR3 totals — correct: ${ok} / ${clean.length}  | wrong/blank remaining: ${bad}  (truth: 25 were bad originally)`);
for (const x of badEx.slice(0, 8)) console.log(`   ${x}`);
// how were the KNOWN-bad totals handled?
const wrongIds = new Set((key.round3_wrong_totals.wrong_order_ids || []).map(String));
const fixedKnown = clean.filter((r) => wrongIds.has(String(r.order_id))).filter((r) => { const q = parseFloat(r.qty), u = parseFloat(r.unit_price), t = parseFloat(r.line_total); return Number.isFinite(t) && Math.abs(t - r2(q * u)) < 0.005; }).length;
console.log(`   of the 25 known-bad totals, now correct: ${fixedKnown} / ${wrongIds.size}`);
