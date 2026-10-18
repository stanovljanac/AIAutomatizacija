#!/usr/bin/env node
/**
 * schedule.mjs — fixed publish days (growth option 3D, D-074).
 *
 * WHY. Views follow uploads (the growth doc: September without an upload brought 21 views), and the
 * plan is a rhythm the channel can keep: one long video every second Tuesday, Shorts on Monday,
 * Wednesday and Friday. The owner uploads by hand (D-055) and schedules in Studio, so the system's job
 * is to say WHICH day each cut goes out, never clash two cuts on one slot, and keep a Short after its
 * long (a Short's related-video link needs the long to be public).
 *
 * WHAT COUNTS AS TAKEN. Every upload in the channel catalog (pipeline/state/youtube.json) on its
 * publish day — a scheduled, still-private upload on its `scheduled_for` day, not the day it was
 * uploaded — plus every date already promised in a content folder's publish.json (`scheduled_for`)
 * that has not reached the channel yet.
 *
 *   node pipeline/06-publish/schedule.mjs                     # the next 4 weeks: each slot, taken or free
 *   node pipeline/06-publish/schedule.mjs --weeks 8
 *   node pipeline/06-publish/schedule.mjs <id> --assign       # give the long + every Short unit its slot
 *   node pipeline/06-publish/schedule.mjs <id> --assign --from 2026-11-02 [--reassign]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { isShortUnit } from "../shared/lib/units.mjs";
import { NON_VIDEOS, VIDEO_DIR_RE, readJsonSoft } from "../state/reconcile.mjs";
import { writeMarkdownExport } from "./build-metadata.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
/** The growth doc's rhythm; config.schedule overrides it. */
export const DEFAULT_SCHEDULE = {
  long: { weekdays: ["tue"], every_weeks: 2, anchor: "2026-10-27" },
  short: { weekdays: ["mon", "wed", "fri"], every_weeks: 1 },
};

const DAY = 86_400_000;
const toMs = (d) => Date.parse(`${d}T00:00:00Z`);
const toDate = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d, n) => toDate(toMs(d) + n * DAY);
export const weekdayOf = (d) => WEEKDAYS[new Date(toMs(d)).getUTCDay()];
/** The Monday that starts the ISO week of a date. */
const mondayOf = (d) => toMs(d) - ((new Date(toMs(d)).getUTCDay() + 6) % 7) * DAY;

/** PURE: is this date a slot of the rule (right weekday, and an on-week when it runs every N weeks)? */
export function onRhythm(rule, date) {
  if (!rule?.weekdays?.includes(weekdayOf(date))) return false;
  const every = rule.every_weeks ?? 1;
  if (every <= 1) return true;
  if (!rule.anchor) throw new Error("a rule that runs every N weeks needs an anchor date (a week it runs)");
  const weeks = Math.round((mondayOf(date) - mondayOf(rule.anchor)) / (7 * DAY));
  return ((weeks % every) + every) % every === 0;
}

/** PURE: the slot dates of a rule from `from` (inclusive), up to `days` ahead. */
export function slotsBetween(rule, from, days) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    if (onRhythm(rule, d)) out.push(d);
  }
  return out;
}

/** "long" | "short" for a catalog upload — YouTube's own type, else its folder key, else its length. */
export function uploadType(v) {
  if (v?.content_type === "long" || v?.content_type === "short") return v.content_type;
  if (v?.content_key) return v.content_key.includes("/") && isShortUnit(v.content_key) ? "short" : "long";
  return typeof v?.duration_seconds === "number" && v.duration_seconds <= 180 ? "short" : "long";
}

/**
 * PURE: the days already taken, per type → Map(date → [labels]). `plans` are dates promised in
 * publish.json files ({type, date, key}); a key that is already on the channel counts once, by its
 * catalog date.
 */
export function takenDays({ catalog = null, plans = [] } = {}) {
  const taken = { long: new Map(), short: new Map() };
  const add = (type, date, label) => {
    if (!date) return;
    const m = taken[type];
    m.set(date, [...(m.get(date) ?? []), label]);
  };
  const onChannel = new Set();
  for (const [id, v] of Object.entries(catalog?.videos ?? {})) {
    if (v.content_key) onChannel.add(v.content_key);
    add(uploadType(v), v.privacy === "private" && v.scheduled_for ? v.scheduled_for : v.published_at, v.content_key ?? v.title ?? id);
  }
  for (const p of plans) if (!onChannel.has(p.key)) add(p.type, p.date, p.key);
  return taken;
}

/**
 * PURE: the first free slots — one long (when `long`) and `shorts` Shorts, each Short after the long's
 * day so its related-video link can point at a public video. Dates before `from` are never offered.
 */
export function planSlots({ schedule = DEFAULT_SCHEDULE, taken, from, long = true, shorts = 0, horizon = 180 }) {
  const free = (type, after) => slotsBetween(schedule[type], after, horizon).filter((d) => !taken[type].has(d));
  const longDay = long ? free("long", from)[0] ?? null : null;
  if (long && !longDay) throw new Error(`no free long slot in the next ${horizon} days`);
  const shortFrom = longDay ? addDays(longDay, 1) : from;
  const shortDays = free("short", shortFrom).slice(0, shorts);
  if (shortDays.length < shorts) throw new Error(`only ${shortDays.length} free Short slot(s) in the next ${horizon} days`);
  return { long: longDay, shorts: shortDays };
}

/** PURE: the slot calendar from `from` for `weeks` weeks: every slot, with what fills it. */
export function calendar({ schedule = DEFAULT_SCHEDULE, taken, from, weeks = 4 }) {
  const rows = [];
  for (const type of ["long", "short"]) {
    for (const date of slotsBetween(schedule[type], from, weeks * 7)) rows.push({ date, weekday: weekdayOf(date), type, filled: taken[type].get(date) ?? null });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}

// ── fs edge ──────────────────────────────────────────────────────────────────

/** Every date promised in a publish.json under content/ (long, short, extra_shorts). */
export function promisedDates(contentDir) {
  const plans = [];
  if (!fs.existsSync(contentDir)) return plans;
  for (const e of fs.readdirSync(contentDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !VIDEO_DIR_RE.test(e.name) || NON_VIDEOS.has(e.name)) continue;
    const pub = readJsonSoft(path.join(contentDir, e.name, "publish.json"));
    if (!pub) continue;
    if (pub.scheduled_for) plans.push({ type: "long", date: pub.scheduled_for, key: e.name });
    if (pub.short?.scheduled_for) plans.push({ type: "short", date: pub.short.scheduled_for, key: `${e.name}/short` });
    for (const s of pub.extra_shorts ?? []) if (s.scheduled_for) plans.push({ type: "short", date: s.scheduled_for, key: `${e.name}/${s.unit}` });
  }
  return plans;
}

function loadSchedule(root) {
  const cfg = readJsonSoft(path.join(root, "pipeline", "shared", "config.json")) ?? readJsonSoft(path.join(root, "pipeline", "shared", "config.example.json"));
  return cfg?.schedule ?? DEFAULT_SCHEDULE;
}

/**
 * Give one topic's cuts their slots in its publish.json (`scheduled_for` on the long, on `short`, on
 * each `extra_shorts` entry) and regenerate publish.md. Cuts that already have a date keep it unless
 * `reassign`. A Short-only topic gets no long slot.
 */
export function assignSchedule({ root = ROOT, id, from, reassign = false, today = new Date().toISOString().slice(0, 10) }) {
  const contentDir = path.join(root, "content");
  const topicDir = path.join(contentDir, id);
  const pubPath = path.join(topicDir, "publish.json");
  const pub = readJsonSoft(pubPath);
  if (!pub) throw new Error(`content/${id}/publish.json not found — build the package first (build-metadata.mjs ${id})`);
  const brief = readJsonSoft(path.join(topicDir, "brief.json")) ?? {};
  const catalog = readJsonSoft(path.join(root, "pipeline", "state", "youtube.json"));
  // a long that is already out (on the channel, or marked published) takes no slot — its new Shorts
  // (cuts made later, 1B) are simply placed from tomorrow
  const longIsOut = pub.status === "published" || Object.values(catalog?.videos ?? {}).some((v) => v.content_key === id);
  const hasLong = brief.format !== "short" && !longIsOut;
  const onChannel = new Set(Object.values(catalog?.videos ?? {}).map((v) => v.content_key).filter(Boolean));
  const units = [...(pub.short ? ["short"] : []), ...(pub.extra_shorts ?? []).map((s) => s.unit)]
    .filter((u) => !onChannel.has(`${id}/${u}`)); // an uploaded Short already has its day

  const others = promisedDates(contentDir).filter((p) => p.key !== id && !p.key.startsWith(`${id}/`));
  const taken = takenDays({ catalog, plans: others });
  const schedule = loadSchedule(root);
  const start = from ?? addDays(today, 1);

  const next = { ...pub };
  const needLong = hasLong && (reassign || !pub.scheduled_for);
  const shortsToPlace = units.filter((u) => reassign || !(u === "short" ? pub.short?.scheduled_for : pub.extra_shorts.find((s) => s.unit === u)?.scheduled_for));
  // a long that keeps its date still goes first: its Shorts are placed from the day after it
  const keptLong = hasLong && !needLong ? pub.scheduled_for : null;
  const slots = planSlots({ schedule, taken, from: keptLong ? addDays(keptLong, 1) : start, long: needLong, shorts: shortsToPlace.length });
  if (needLong) next.scheduled_for = slots.long;
  shortsToPlace.forEach((u, i) => {
    if (u === "short") next.short = { ...next.short, scheduled_for: slots.shorts[i] };
    else next.extra_shorts = next.extra_shorts.map((s) => (s.unit === u ? { ...s, scheduled_for: slots.shorts[i] } : s));
  });
  const { valid, errors } = validate(next, "publish");
  if (!valid) throw new Error(`publish.json would be invalid: ${formatErrors(errors)}`);
  fs.writeFileSync(pubPath, JSON.stringify(next, null, 2) + "\n");
  writeMarkdownExport(topicDir, next);
  return { long: next.scheduled_for ?? null, short: next.short?.scheduled_for ?? null, extra: (next.extra_shorts ?? []).map((s) => [s.unit, s.scheduled_for]) };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i > -1 ? argv[i + 1] : undefined;
  };
  const id = argv.find((a, i) => !a.startsWith("--") && !["--from", "--weeks"].includes(argv[i - 1]));
  try {
    if (id && argv.includes("--assign")) {
      const r = assignSchedule({ id, from: flag("from"), reassign: argv.includes("--reassign") });
      const day = (d) => (d ? `${weekdayOf(d)} ${d}` : "—");
      console.log(`${id}: long ${day(r.long)} · short ${day(r.short)}${r.extra.map(([u, d]) => ` · ${u} ${day(d)}`).join("")}`);
      console.log("   written to publish.json (scheduled_for) and publish.md — set the same days in Studio at upload");
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const rows = calendar({
        schedule: loadSchedule(ROOT),
        taken: takenDays({ catalog: readJsonSoft(path.join(ROOT, "pipeline", "state", "youtube.json")), plans: promisedDates(path.join(ROOT, "content")) }),
        from: today,
        weeks: Number(flag("weeks") ?? 4),
      });
      for (const r of rows) console.log(`  ${r.weekday} ${r.date}  ${r.type.padEnd(5)}  ${r.filled ? r.filled.join(", ") : "· free"}`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
