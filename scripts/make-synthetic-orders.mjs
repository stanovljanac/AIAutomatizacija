#!/usr/bin/env node
/**
 * Synthetic "messy orders export" generator for the Claude-vs-ChatGPT experiment (video 004)
 * and reusable for future data-cleaning demos. Deterministic (fixed seed) → re-running
 * yields the byte-identical CSV + answer key. SYNTHETIC ONLY — fake names/emails, never
 * real client data (STYLE_GUIDE §2.3).
 *
 *   node scripts/make-synthetic-orders.mjs [outDir]
 *   default outDir: content/004-claude-vs-chatgpt-spreadsheets/captures/sample
 *
 * Writes:
 *   <outDir>/orders.csv            the messy export the owner uploads to each tool
 *   <outDir>/orders.answerkey.json the ground truth, used to SCORE the tools honestly
 *
 * Three deliberate, realistic messes (the 3 experiment rounds):
 *   R1 duplicate customers — same person (same email, lowercased) under cosmetically
 *      different name spellings (case / extra spaces / punctuation).
 *   R2 mixed date formats — order_date in ISO / US-slash / long / d-Mon-yy, plus a few
 *      unparseable/broken strings.
 *   R3 totals that don't add up — line_total should equal qty*unit_price; some are wrong,
 *      blank, "#REF!", or "ERROR".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "content/004-claude-vs-chatgpt-spreadsheets/captures/sample";
const N = 2000;

// ---- deterministic RNG (mulberry32) ----
let _s = 0x9e3779b9; // fixed seed
function rnd() {
  _s |= 0; _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const FIRST = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","David","Elizabeth","William","Barbara","Maria","Susan","Joseph","Karen","Thomas","Nancy","Daniel","Lisa","Paul","Sandra","Mark","Ashley","Donald","Kimberly","George","Emily","Kenneth","Carol"];
const LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Clark","Lewis","Walker","Hall","Young"];
const REGION = ["North","South","East","West","Central"];
const DOMAIN = ["gmail.com","outlook.com","yahoo.com","acme-co.com","brightlabs.io","northwind.test"];

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");

// ---- base customers (canonical) ----
const baseCount = 220;
const customers = [];
const seenEmail = new Set();
while (customers.length < baseCount) {
  const f = pick(FIRST), l = pick(LAST);
  const email = `${slug(f)}.${slug(l)}@${pick(DOMAIN)}`;
  if (seenEmail.has(email)) continue;
  seenEmail.add(email);
  customers.push({ name: `${f} ${l}`, email });
}

// cosmetic name variants for the duplicate round (same email identity, different spelling)
function nameVariant(name) {
  const kind = ri(0, 4);
  if (kind === 0) return name.toUpperCase();
  if (kind === 1) return name.toLowerCase();
  if (kind === 2) return `  ${name} `;            // padded whitespace
  if (kind === 3) return name.replace(" ", "  ");  // double inner space
  return name.replace(/(\w+) (\w+)/, "$2, $1");    // "Last, First"
}

const DUP_CLUSTERS = 40; // exactly this many customers will appear under a 2nd spelling

// date formatters
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pad = (n) => String(n).padStart(2, "0");
function fmtDate(y, m, d, style) {
  if (style === "iso") return `${y}-${pad(m)}-${pad(d)}`;
  if (style === "us") return `${pad(m)}/${pad(d)}/${y}`;
  if (style === "long") return `${MON[m - 1]} ${d}, ${y}`;
  return `${d}-${MON[m - 1]}-${String(y).slice(2)}`; // d-Mon-yy
}
const BROKEN_DATES = ["March 4th", "2026/13/40", "", "Q1 2026", "44991", "next friday"];

// ---- decide which order rows carry each mess (deterministic) ----
const dupExtraRows = new Set();   // rows that are a duplicate-spelling of an existing customer
const brokenDateRows = new Set(); // rows with an unparseable date
const wrongTotalRows = new Map(); // row -> reason

// reserve 40 "duplicate extra" rows spread across the file
{
  const chosen = new Set();
  while (chosen.size < DUP_CLUSTERS) chosen.add(ri(50, N - 1));
  for (const r of chosen) dupExtraRows.add(r);
}
// 30 broken-date rows
{ const c = new Set(); while (c.size < 30) c.add(ri(0, N - 1)); for (const r of c) brokenDateRows.add(r); }
// 25 wrong-total rows
{
  const reasons = ["wrong", "wrong", "wrong", "blank", "ref", "error"];
  const c = new Set(); while (c.size < 25) c.add(ri(0, N - 1));
  for (const r of c) wrongTotalRows.set(r, pick(reasons));
}

// map each dup-extra row to a specific base customer (so it's a true duplicate identity)
const dupRowToCustomer = new Map();
{
  const ids = [...dupExtraRows];
  ids.forEach((row, i) => dupRowToCustomer.set(row, customers[i % DUP_CLUSTERS]));
}

// ---- build rows ----
const header = ["order_id", "order_date", "customer_name", "email", "region", "qty", "unit_price", "line_total"];
const lines = [header.join(",")];
const dupCustomerEmails = new Set();
let nonIsoCount = 0;
const wrongTotalIds = [], brokenDateIds = [];

function csv(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

for (let r = 0; r < N; r++) {
  const order_id = 1001 + r;

  // customer (duplicate-extra rows reuse a base customer under a variant spelling)
  let name, email;
  if (dupRowToCustomer.has(r)) {
    const c = dupRowToCustomer.get(r);
    name = nameVariant(c.name);
    email = rnd() < 0.5 ? c.email.toUpperCase() : c.email; // same identity, sometimes different case
    dupCustomerEmails.add(c.email);
  } else {
    const c = pick(customers);
    name = c.name; email = c.email;
  }

  // date
  const y = 2026, m = ri(1, 12), d = ri(1, 28);
  let order_date;
  if (brokenDateRows.has(r)) { order_date = pick(BROKEN_DATES); brokenDateIds.push(order_id); }
  else {
    const style = pick(["iso", "iso", "us", "long", "dmon"]); // ~40% ISO
    order_date = fmtDate(y, m, d, style);
    if (style !== "iso") nonIsoCount++;
  }

  // money
  const qty = ri(1, 25);
  const unit_price = (ri(100, 50000) / 100); // 1.00 - 500.00
  const correct = Math.round(qty * unit_price * 100) / 100;
  let line_total = correct.toFixed(2);
  if (wrongTotalRows.has(r)) {
    const reason = wrongTotalRows.get(r);
    if (reason === "wrong") line_total = (correct + ri(5, 200)).toFixed(2);
    else if (reason === "blank") line_total = "";
    else if (reason === "ref") line_total = "#REF!";
    else line_total = "ERROR";
    wrongTotalIds.push(order_id);
  }

  lines.push([order_id, order_date, name, email, pick(REGION), qty, unit_price.toFixed(2), line_total].map(csv).join(","));
}

const answerKey = {
  generated_by: "scripts/make-synthetic-orders.mjs",
  note: "Ground truth for scoring the tools. Do NOT read these numbers on camera before the tools answer.",
  rows: N,
  round1_duplicate_customers: {
    rule: "same email (case-insensitive) = same customer; duplicates appear under a different name spelling",
    duplicate_customer_count: dupCustomerEmails.size,
    duplicate_extra_rows: dupExtraRows.size
  },
  round2_mixed_dates: {
    rule: "standardize order_date to YYYY-MM-DD",
    non_iso_dates_to_convert: nonIsoCount,
    broken_unparseable_dates: brokenDateIds.length,
    broken_order_ids: brokenDateIds
  },
  round3_wrong_totals: {
    rule: "line_total should equal qty * unit_price (2 dp)",
    wrong_or_broken_totals: wrongTotalIds.length,
    wrong_order_ids: wrongTotalIds
  }
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "orders.csv"), lines.join("\n") + "\n");
writeFileSync(join(outDir, "orders.answerkey.json"), JSON.stringify(answerKey, null, 2) + "\n");

console.log(`OK wrote ${outDir}/orders.csv  (${N} rows)`);
console.log(`   R1 duplicate customers : ${answerKey.round1_duplicate_customers.duplicate_customer_count} (extra rows ${dupExtraRows.size})`);
console.log(`   R2 non-ISO dates       : ${nonIsoCount}  (+ ${brokenDateIds.length} broken/unparseable)`);
console.log(`   R3 wrong/broken totals : ${wrongTotalIds.length}`);
console.log(`   answer key             : ${outDir}/orders.answerkey.json`);
