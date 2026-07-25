#!/usr/bin/env node
/**
 * reconcile.mjs — the lifecycle reconciler (D-062).
 *
 * `pipeline/state/videos.json` (the ledger) owns each video's lifecycle; `ideas.json` status,
 * `publish.json` status and `produced_subjects.json` are DERIVED projections. This module holds
 * the whole ruleset as io-free functions plus a thin fs/CLI edge, mirroring `fetch-analytics.mjs`:
 * pure logic first, side effects at the bottom.
 *
 *   ingestPublish(ledger, fact)          reality (a publish.json) → a ledger record
 *   projectIdeas(ideas, ledger)          ledger → ideas.json status + produced_video_id
 *   projectSubjects(registry, ledger)    ledger → produced_subjects.json
 *   projectPublishStatus(publish, rec)   ledger → that video's publish.json status
 *   lessonOwed / owedLessons             what the Stop hook blocks on
 *   setLesson(record, …)                 the owner settling the one manual obligation
 *   ── the fs edge ──
 *   scanVideos(contentDir)               every publish.json under content/ = one candidate record
 *   resolveFact(scan, …)                 subject / idea_id / content_type for that video
 *   planReconcile({root})                the whole pass, computed, writing NOTHING
 *   applyPlan(plan)                      write the plan's files (schema-validated first)
 *   stampLesson({videoId, state, …})     `--learned` — the one thing a machine can't decide
 *
 * Two invariants every function upholds, because the reconciler runs on every turn-end:
 *  • **idempotent** — running it twice on the same reality changes nothing the second time
 *    (each function reports `changed`, and returns the INPUT object untouched when false).
 *  • **forward-only** — a projection never demotes: `published` ↛ `draft_pending`,
 *    `produced` ↛ `in-progress`, a subject entry is never removed, a settled lesson never
 *    re-opens. Reconciling is allowed to heal state, never to undo it.
 *
 *   node pipeline/state/reconcile.mjs                     # print the diff, write nothing
 *   node pipeline/state/reconcile.mjs --fix               # write the derived files
 *   node pipeline/state/reconcile.mjs --backfill [--fix]  # only the videos below live_from (one-time)
 *   node pipeline/state/reconcile.mjs <id> --learned --note <slug>   # a KOS note exists
 *   node pipeline/state/reconcile.mjs <id> --learned --nothing       # reviewed, nothing durable
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatErrors, validate } from "../shared/lib/validate-lib.mjs";
import { DEFAULT_LIVE_FROM, loadLedger, saveLedger, todayStr, videoSeq } from "./ledger.mjs";

/** publish.json / ledger status vocabulary, ordered — the rank IS the forward-only rule. */
export const STATUS_RANK = { draft_pending: 0, uploaded_private: 1, published: 2 };

export const LESSON_STATES = ["pending", "none", "linked"];

/** First analytics snapshot is due a week after publish (YouTube data is 48–72h delayed). */
export const FIRST_SNAPSHOT_DAYS = 7;

const rank = (status) => (status in STATUS_RANK ? STATUS_RANK[status] : -1);

/** The furthest-forward of two statuses; unknown values lose to any known one. */
export function forwardStatus(current, next) {
  if (rank(next) > rank(current)) return next;
  return rank(current) >= 0 ? current : (next ?? null);
}

/** "2026-07-25" + 7 → "2026-08-01". Returns null on an unparseable date. */
export function addDays(dateStr, days) {
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The video FOLDER a ledger key belongs to: "019-next-word-engine/short" → "019-next-word-engine".
 * `ideas.produced_video_id` and `produced_subjects.json` name the topic folder, and a nested Short
 * is the same topic — so both projections key off this, never off the raw ledger key.
 */
export function baseVideoId(id) {
  return String(id ?? "").replace(/\/short$/, "");
}

/** A record is GOVERNED by the ledger from `live_from` on; earlier ones are backfilled history. */
export function isLive(id, liveFrom = DEFAULT_LIVE_FROM) {
  const seq = videoSeq(id);
  const from = videoSeq(liveFrom);
  return seq !== null && from !== null && seq >= from;
}

/** `content_type` for a ledger key — explicit wins, else the "/short" suffix decides. */
export function contentTypeFor(id, explicit) {
  if (explicit === "long" || explicit === "short") return explicit;
  return /\/short$/.test(String(id ?? "")) ? "short" : "long";
}

/** Key-order-insensitive deep comparison, so `changed` means a real difference. */
const stable = (value) =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v
  );

// ── reality → ledger ─────────────────────────────────────────────────────────

/**
 * Ingest one video's reality into the ledger.
 *
 * `fact` = { videoId, contentType, subject, ideaId, publishStatus, publishExists } — resolved by
 * the CLI layer from that video's publish.json + brief.json + ideas.json. `videoId` is the ledger
 * key (the publish.json's directory relative to content/, e.g. "019-next-word-engine/short").
 *
 * A publish.json only exists once the owner approved the final video (Gate 2), so its **presence**
 * is the approval signal; the `status` field inside it is a derived projection that may be stale
 * (019 sat at `draft_pending` long after shipping), so it can only ever raise the ledger status,
 * never cap it. With no publish.json and no status there is nothing to ingest — an unresolved
 * video is reported by the caller, never invented here.
 *
 * Seeding rules (all one-shot, so re-ingesting is a no-op):
 *  • `published_at` is stamped once, only for live videos — we don't fabricate ship dates for
 *    pre-`live_from` history.
 *  • `analytics.due_at` = published_at + 7d, only for a live record that has no snapshots yet.
 *  • `lesson` starts `pending` for a live video (the obligation the Stop hook blocks on) and
 *    `none`/`"backfill"` below `live_from` — a closed stamp, never owed.
 *  • `youtube_video_id` is copied from the publish.json once and then frozen — the id the owner
 *    uploaded under is a fact about reality, and re-uploading is not a lifecycle event we model.
 *
 * @returns {{ledger: object, changed: boolean, record: object|null}}
 */
export function ingestPublish(ledger, fact = {}, { now = new Date(), liveFrom = ledger?.live_from ?? DEFAULT_LIVE_FROM } = {}) {
  const id = fact.videoId;
  const videos = ledger?.videos ?? {};
  const prev = id ? (videos[id] ?? null) : null;
  const incoming = fact.publishExists ? "published" : (fact.publishStatus ?? null);
  if (!id || (!prev && !incoming)) return { ledger, changed: false, record: prev };

  const live = isLive(id, liveFrom);
  const next = { ...prev }; // spread first so an existing record keeps its key order on disk
  // Assigned in the documented record order, which is the key order for a NEW record.
  next.subject = fact.subject ?? prev?.subject ?? null;
  next.idea_id = fact.ideaId ?? prev?.idea_id ?? null;
  next.content_type = contentTypeFor(id, fact.contentType ?? prev?.content_type);
  next.status = forwardStatus(prev?.status, incoming);
  next.published_at =
    prev?.published_at ?? (next.status === "published" && live ? todayStr(now) : null);
  next.youtube_video_id = prev?.youtube_video_id ?? fact.youtubeVideoId ?? null;
  next.lesson = prev?.lesson?.state
    ? { ...prev.lesson }
    : live
      ? { state: "pending", at: null, note: null }
      : { state: "none", at: todayStr(now), note: "backfill" };

  const analytics = { due_at: null, snapshots: [], ...(prev?.analytics ?? {}) };
  if (!Array.isArray(analytics.snapshots)) analytics.snapshots = [];
  if (analytics.due_at == null && !analytics.snapshots.length && live && next.published_at) {
    analytics.due_at = addDays(next.published_at, FIRST_SNAPSHOT_DAYS);
  }
  next.analytics = analytics;

  const changed = stable(prev) !== stable(next);
  return {
    ledger: changed ? { ...ledger, videos: { ...videos, [id]: next } } : ledger,
    changed,
    record: next,
  };
}

// ── ledger → derived projections ─────────────────────────────────────────────

/**
 * Project the ledger onto the idea bank: a video that exists means its idea was produced.
 *
 * Deliberately narrow — `ideas.json` stays authoritative for idea *selection* (backlog, scores,
 * metrics), so this touches exactly two fields and only forward:
 *  • `status: "in-progress" → "produced"` — and ONLY that transition. A `backlog` idea is left
 *    alone on purpose: recurring series entries (`everyone-asks-ai-series`) stay in the backlog to
 *    be spent again, and `parked` is a decision a projection has no business reversing.
 *  • `produced_video_id` — bound only when empty, so a series idea keeps the first video it was
 *    spent on.
 * A record with no `idea_id` (a bespoke video) is a no-op, as is an `idea_id` with no bank entry.
 */
export function projectIdeas(ideas, ledger, { now = new Date() } = {}) {
  const boundVideo = new Map();
  for (const [id, record] of Object.entries(ledger?.videos ?? {})) {
    if (record?.idea_id && !boundVideo.has(record.idea_id)) boundVideo.set(record.idea_id, baseVideoId(id));
  }

  let changed = false;
  const list = (ideas?.ideas ?? []).map((idea) => {
    const video = boundVideo.get(idea?.id);
    if (!video) return idea;
    const next = { ...idea };
    if (!next.produced_video_id) next.produced_video_id = video;
    if (next.status === "in-progress") next.status = "produced";
    if (stable(next) === stable(idea)) return idea;
    changed = true;
    return next;
  });

  return { ideas: changed ? { ...ideas, updated: todayStr(now), ideas: list } : ideas, changed };
}

/**
 * Project the ledger onto `produced_subjects.json` — the machine mirror of docs/CHANNEL_MAP.md
 * that `pick-next.mjs` reads to warn on a subject collision (D-059). Append-only: an entry is
 * never removed, and the human prose in CHANNEL_MAP.md is never touched by code. Ids are the topic
 * folder, so a nested Short does not get its own entry.
 */
export function projectSubjects(registry, ledger, { now = new Date() } = {}) {
  const subjects = { ...(registry?.subjects ?? {}) };
  let changed = false;
  let addedSubject = false;

  for (const [id, record] of Object.entries(ledger?.videos ?? {})) {
    const subject = record?.subject;
    if (!subject) continue;
    const video = baseVideoId(id);
    const claimed = subjects[subject];
    if (!claimed) {
      subjects[subject] = [video];
      changed = addedSubject = true;
    } else if (!claimed.includes(video)) {
      subjects[subject] = [...claimed, video].sort();
      changed = true;
    }
  }
  if (!changed) return { registry, changed: false };

  // Keep the file readable: subjects sorted by coordinate whenever a new one appears.
  const ordered = addedSubject
    ? Object.fromEntries(Object.keys(subjects).sort().map((k) => [k, subjects[k]]))
    : subjects;
  return { registry: { ...registry, updated: todayStr(now), subjects: ordered }, changed: true };
}

/**
 * Flip a video's `publish.json` status forward to match its ledger record (the 019
 * `draft_pending → published` case). Never demotes; fail-soft on a missing/broken file.
 */
export function projectPublishStatus(publishJson, record) {
  if (!publishJson || typeof publishJson !== "object" || !record?.status) {
    return { publishJson, changed: false };
  }
  const status = forwardStatus(publishJson.status, record.status);
  if (status === publishJson.status) return { publishJson, changed: false };
  return { publishJson: { ...publishJson, status }, changed: true };
}

// ── the lesson obligation (D-061 as code, not a rule) ────────────────────────

/**
 * Does this video still owe the durable insight? True only for a record the ledger GOVERNS whose
 * lesson state is explicitly `pending` — never inferred from a missing field, so a malformed or
 * pre-`live_from` record can't silently block the owner's turn.
 */
export function lessonOwed(ledger, id, { liveFrom = ledger?.live_from ?? DEFAULT_LIVE_FROM } = {}) {
  const record = ledger?.videos?.[id];
  return Boolean(record) && isLive(id, liveFrom) && record.lesson?.state === "pending";
}

/** Every governed video that still owes a lesson, in ledger order (what the Stop hook lists). */
export function owedLessons(ledger, opts = {}) {
  return Object.keys(ledger?.videos ?? {}).filter((id) => lessonOwed(ledger, id, opts));
}

/**
 * Settle a record's lesson explicitly: `linked` (a KOS note exists — `note` is its slug), `none`
 * (reviewed, nothing durable to write) or back to `pending`. Throws on an unknown state and on
 * `linked` without a slug — an unreadable lesson state is worse than a blocked turn.
 */
export function setLesson(record, { state, note = null, now = new Date() } = {}) {
  if (!LESSON_STATES.includes(state)) {
    throw new Error(`unknown lesson state "${state}" (expected ${LESSON_STATES.join(" | ")})`);
  }
  if (state === "linked" && !note) {
    throw new Error('lesson state "linked" needs the KOS note slug (--note <slug>)');
  }
  const lesson =
    state === "pending"
      ? { state, at: null, note: null }
      : { state, at: todayStr(now), note };
  return { ...record, lesson };
}

// ── the fs edge: reality in ──────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");

/** Every file the reconciler reads or writes, resolved from a repo root (tests pass a temp one). */
export function statePaths(root = ROOT) {
  return {
    content: path.join(root, "content"),
    ideas: path.join(root, "pipeline", "00-ideas", "ideas.json"),
    subjects: path.join(root, "pipeline", "00-ideas", "produced_subjects.json"),
    ledger: path.join(root, "pipeline", "state", "videos.json"),
  };
}

/** A video folder is `NNN-slug` — which is also what excludes `_TEMPLATE` / `_FIXTURE` / stray files. */
export const VIDEO_DIR_RE = /^\d{3}-[a-z0-9-]+$/;

/**
 * Folders that own a publish.json but are NOT channel videos, so "presence ⇒ published" would
 * invent a lifecycle for them: `001-sta-je-ai` is the archived Serbian pilot (git tag
 * `serbian-ai-archive`), `004-hfproof` a HyperFrames render proof. Everything else with a
 * publish.json is a video the owner shipped or is shipping.
 */
export const NON_VIDEOS = new Set(["001-sta-je-ai", "004-hfproof"]);

/** Parse a JSON file, or warn and return null — one broken file must not stop the whole pass. */
export function readJsonSoft(filePath, warn = () => {}) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    warn(`! ${filePath} is not parseable JSON: ${e.message}`);
    return null;
  }
}

/** The video folders under content/, sorted, minus the non-videos. */
export function videoFolders(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && VIDEO_DIR_RE.test(e.name) && !NON_VIDEOS.has(e.name))
    .map((e) => e.name)
    .sort();
}

/**
 * Every publish.json under content/ — the long at `<folder>/publish.json`, its Short at
 * `<folder>/short/publish.json`. One file = one candidate ledger record, keyed by its directory
 * relative to content/ (always with a forward slash, so the key matches the schema on Windows too).
 * `publish` is null when the file is unreadable — such a video is still ingested (its presence is
 * the approval signal) but its status is never projected back into the broken file.
 */
export function scanVideos(contentDir, { warn = () => {} } = {}) {
  const scans = [];
  for (const folder of videoFolders(contentDir)) {
    for (const videoId of [folder, `${folder}/short`]) {
      const publishPath = path.join(contentDir, ...videoId.split("/"), "publish.json");
      if (!fs.existsSync(publishPath)) continue;
      const publish = readJsonSoft(publishPath, warn);
      scans.push({
        videoId,
        publishPath,
        publish,
        publishExists: true,
        publishStatus: typeof publish?.status === "string" ? publish.status : null,
      });
    }
  }
  return scans;
}

/** Which subject coordinate already claims this video (`brief.json` mostly carries none). */
export function subjectOf(registry, videoId) {
  for (const [subject, videos] of Object.entries(registry?.subjects ?? {})) {
    if (Array.isArray(videos) && videos.includes(videoId)) return subject;
  }
  return null;
}

/** Which idea was spent on this video (`brief.idea_id` is absent on everything before 013). */
export function ideaIdOf(ideas, videoId) {
  return (ideas?.ideas ?? []).find((idea) => idea?.produced_video_id === videoId)?.id ?? null;
}

/**
 * Resolve one scanned publish.json into the `fact` ingestPublish consumes.
 *
 * `brief.json` is the primary source but an incomplete one — it has no `subject` field at all on
 * most videos and no `idea_id` before 013 — so both fall back to a REVERSE lookup of the derived
 * files (which subject claims this video · which idea points at it). Without the idea fallback the
 * shipped-but-`in-progress` drift (005/006/008/012/016) never clears. A nested Short has no brief
 * of its own: it inherits its topic folder's, and its `/short` key decides `content_type` anyway.
 * `youtube_video_id` is the one field the publish.json itself is authoritative for — it is written
 * there by the upload, so the ledger just captures it.
 */
export function resolveFact(scan, { brief, ideas, registry } = {}) {
  const base = baseVideoId(scan.videoId);
  return {
    videoId: scan.videoId,
    contentType: contentTypeFor(scan.videoId, brief?.format),
    subject: brief?.subject ?? subjectOf(registry, base),
    ideaId: brief?.idea_id ?? ideaIdOf(ideas, base),
    youtubeVideoId: typeof scan.publish?.youtube_video_id === "string" ? scan.publish.youtube_video_id : null,
    publishStatus: scan.publishStatus,
    publishExists: scan.publishExists,
  };
}

// ── the fs edge: the whole pass ──────────────────────────────────────────────

const fmtValue = (v) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

/** "status: draft_pending → published" for every field that actually moved. */
function fieldDiff(before, after) {
  return Object.keys(after ?? {})
    .filter((k) => stable(before?.[k]) !== stable(after[k]))
    .map((k) => `${k}: ${fmtValue(before?.[k])} → ${fmtValue(after[k])}`);
}

function ideaChanges(before, after) {
  const prev = new Map((before?.ideas ?? []).map((idea) => [idea?.id, idea]));
  return (after?.ideas ?? [])
    .map((idea) => {
      const diff = fieldDiff(prev.get(idea?.id), idea);
      return diff.length ? `~ ideas.json ${idea.id}  ${diff.join(" · ")}` : null;
    })
    .filter(Boolean);
}

function subjectChanges(before, after) {
  const prev = before?.subjects ?? {};
  const lines = [];
  for (const [subject, videos] of Object.entries(after?.subjects ?? {})) {
    const added = videos.filter((v) => !(prev[subject] ?? []).includes(v));
    if (added.length) lines.push(`~ produced_subjects.json ${subject} += ${added.join(", ")}`);
  }
  return lines;
}

/**
 * The whole reconcile pass, computed against the real files but writing NOTHING: scan every
 * publish.json → ingest into the ledger → project the ledger onto the three derived files.
 *
 * `backfill:true` narrows the pass to the videos BELOW `live_from` — the one-time seeding of
 * history (D-062). It is the same ruleset, not a second one: `ingestPublish` already stamps a
 * pre-live record as closed (`lesson: none/"backfill"`, no `published_at`, no `due_at`). The flag
 * exists so the historical write can be reviewed and applied on its own, without the live records
 * riding along in the same diff.
 *
 * @returns {{paths: object, ledger: object, writes: Array, changes: string[], scanned: string[],
 *            owed: string[], noPublish: string[]}}
 *   `writes` = the files `applyPlan` would write (empty ⇒ derived state already matches the ledger);
 *   `changes` = human-readable diff lines; `owed` = governed videos still owing a lesson;
 *   `noPublish` = video folders with no publish.json anywhere (nothing to ingest — owner's call).
 */
export function planReconcile({ root = ROOT, now = new Date(), liveFrom, backfill = false, warn = () => {} } = {}) {
  const paths = statePaths(root);
  const opts = { now, ...(liveFrom ? { liveFrom } : {}) };
  const ledgerBefore = loadLedger(paths.ledger);
  const ideasBefore = readJsonSoft(paths.ideas, warn);
  const registryBefore = readJsonSoft(paths.subjects, warn);
  // A file that EXISTS but won't parse is never rewritten from scratch — that would clobber the
  // owner's data. A merely missing derived file is fine to create.
  const registryBroken = registryBefore == null && fs.existsSync(paths.subjects);

  const allScans = scanVideos(paths.content, { warn });
  const governedFrom = liveFrom ?? ledgerBefore.live_from ?? DEFAULT_LIVE_FROM;
  const scans = backfill ? allScans.filter((s) => !isLive(s.videoId, governedFrom)) : allScans;
  const changes = [];
  let ledger = ledgerBefore;
  for (const scan of scans) {
    const brief = readJsonSoft(path.join(paths.content, baseVideoId(scan.videoId), "brief.json"), warn);
    const fact = resolveFact(scan, { brief, ideas: ideasBefore, registry: registryBefore });
    const before = ledger.videos?.[scan.videoId];
    const { ledger: next, changed, record } = ingestPublish(ledger, fact, opts);
    ledger = next;
    if (!changed) continue;
    changes.push(
      before
        ? `~ ledger ${scan.videoId}  ${fieldDiff(before, record).join(" · ")}`
        : `+ ledger ${scan.videoId}  ${record.status} · lesson ${record.lesson.state}` +
          (record.analytics.due_at ? ` · analytics due ${record.analytics.due_at}` : "")
    );
  }

  const writes = [];
  if (ledger !== ledgerBefore) writes.push({ kind: "ledger", path: paths.ledger, doc: ledger });

  const ideasAfter = projectIdeas(ideasBefore, ledger, opts);
  if (ideasAfter.changed) {
    writes.push({ kind: "ideas", path: paths.ideas, doc: ideasAfter.ideas, schema: "ideas" });
    changes.push(...ideaChanges(ideasBefore, ideasAfter.ideas));
  }

  const subjectsAfter = projectSubjects(registryBefore, ledger, opts);
  if (subjectsAfter.changed && !registryBroken) {
    // produced_subjects.json has no schema of its own (it's a free-form subject → videos mirror).
    writes.push({ kind: "subjects", path: paths.subjects, doc: subjectsAfter.registry, schema: null });
    changes.push(...subjectChanges(registryBefore, subjectsAfter.registry));
  } else if (subjectsAfter.changed) {
    warn(`! ${paths.subjects} is unreadable — not rewriting it (subjects left unprojected)`);
  }

  for (const scan of scans) {
    if (!scan.publish) continue;
    const { publishJson, changed } = projectPublishStatus(scan.publish, ledger.videos?.[scan.videoId]);
    if (!changed) continue;
    writes.push({ kind: "publish", path: scan.publishPath, doc: publishJson, schema: "publish" });
    changes.push(`~ ${scan.videoId}/publish.json  status: ${fmtValue(scan.publish.status)} → ${publishJson.status}`);
  }

  // Always computed from the FULL scan: a video the backfill pass skipped still has a publish.json.
  const ingested = new Set(allScans.map((s) => baseVideoId(s.videoId)));
  return {
    paths,
    ledger,
    writes,
    changes,
    scanned: scans.map((s) => s.videoId),
    owed: owedLessons(ledger, opts),
    noPublish: videoFolders(paths.content).filter((folder) => !ingested.has(folder)),
  };
}

/**
 * Write a plan's files. Every document is schema-validated FIRST (the ledger inside `saveLedger`),
 * so a reconcile pass can never leave an invalid artifact on disk.
 *
 * A derived document that fails validation is **skipped, not thrown on** — and the rest of the plan
 * still lands. The invalid part is almost always pre-existing legacy drift the projection didn't
 * touch (004's `medium` is a filename, 007 predates `title_options`), and this runs from the
 * turn-end hook: aborting the pass on the first such file would leave every later video unhealed
 * forever. Skips are returned and printed, never swallowed. The LEDGER is the exception — it is our
 * own generated document, so an invalid one is a bug and stays loud.
 *
 * @returns {{written: string[], skipped: Array<{path: string, error: string}>}}
 */
export function applyPlan(plan, { now = new Date(), warn = () => {} } = {}) {
  const written = [];
  const skipped = [];
  for (const write of plan?.writes ?? []) {
    if (write.kind === "ledger") {
      saveLedger(write.doc, { filePath: write.path, now });
    } else {
      if (write.schema) {
        const { valid, errors } = validate(write.doc, write.schema);
        if (!valid) {
          const error = formatErrors(errors);
          warn(`! skipped ${write.path} — it would not be a valid ${write.schema}: ${error}`);
          skipped.push({ path: write.path, error });
          continue;
        }
      }
      fs.mkdirSync(path.dirname(write.path), { recursive: true });
      fs.writeFileSync(write.path, JSON.stringify(write.doc, null, 2) + "\n");
    }
    written.push(write.path);
  }
  return { written, skipped };
}

/**
 * Settle one video's lesson obligation on disk (`--learned`). The only reconciler entry point the
 * owner drives by hand, because it is the only judgement a machine can't make.
 */
export function stampLesson({ root = ROOT, videoId, state, note = null, now = new Date() } = {}) {
  const paths = statePaths(root);
  const ledger = loadLedger(paths.ledger);
  const record = ledger.videos?.[videoId];
  if (!record) throw new Error(`no ledger record for "${videoId}" — run reconcile --fix first`);
  const next = setLesson(record, { state, note, now });
  const saved = saveLedger({ ...ledger, videos: { ...ledger.videos, [videoId]: next } }, {
    filePath: paths.ledger,
    now,
  });
  return { ledger: saved, record: next };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

/** `[<id>] [--backfill] [--dry-run | --fix] [--learned [--note <slug> | --nothing]]` — last flag wins. */
export function parseArgs(argv = []) {
  const out = { videoId: null, fix: false, backfill: false, learned: false, state: null, note: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fix") out.fix = true;
    else if (arg === "--dry-run") out.fix = false; // the default; accepted for symmetry
    else if (arg === "--backfill") out.backfill = true;
    else if (arg === "--learned") out.learned = true;
    else if (arg === "--nothing") out.state = "none";
    else if (arg === "--note") {
      out.state = "linked";
      out.note = argv[++i] ?? null;
    } else if (arg.startsWith("--")) throw new Error(`unknown flag ${arg}`);
    else if (!out.videoId) out.videoId = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  return out;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

  if (args.learned) {
    if (!args.videoId) throw new Error("--learned needs the video id: reconcile <id> --learned --nothing");
    if (!args.state) {
      throw new Error("--learned needs --note <slug> (a KOS note exists) or --nothing (reviewed, nothing durable)");
    }
    const { record } = stampLesson({ videoId: args.videoId, state: args.state, note: args.note });
    console.log(`${args.videoId} lesson → ${record.lesson.state}${record.lesson.note ? ` (${record.lesson.note})` : ""}`);
    return;
  }

  const plan = planReconcile({ backfill: args.backfill, warn: (m) => console.warn(m) });
  const scope = args.backfill ? " (backfill scope: below live_from only)" : "";
  console.log(`scanned ${plan.scanned.length} publish.json file(s) under content/${scope}`);
  for (const line of plan.changes) console.log(`  ${line}`);

  if (!plan.writes.length) {
    console.log("  (clean — every derived file already matches the ledger)");
  } else if (args.fix) {
    const { written, skipped } = applyPlan(plan, { warn: (m) => console.warn(m) });
    console.log(`\nwrote ${written.length} file(s): ${written.map(rel).join(", ")}`);
    if (skipped.length) {
      console.log(`\n${skipped.length} file(s) SKIPPED — already invalid against their schema, so the`);
      console.log("projection can't be written until the file itself is repaired (the ledger is still correct):");
      for (const s of skipped) console.log(`  • ${rel(s.path)} — ${s.error}`);
    }
  } else {
    console.log(`\n${plan.writes.length} file(s) to write: ${plan.writes.map((w) => rel(w.path)).join(", ")}`);
    console.log("--fix to apply.");
  }

  if (plan.owed.length) {
    console.log(`\nlesson owed by ${plan.owed.length} video(s): ${plan.owed.join(", ")}`);
    console.log("  clear it: node pipeline/state/reconcile.mjs <id> --learned --note <slug> | --nothing");
  }
  if (plan.noPublish.length) {
    console.log(`\nno publish.json yet (nothing ingested): ${plan.noPublish.join(", ")}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
