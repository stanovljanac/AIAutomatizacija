// 1A (D-073) — the catalog → ledger edge: YouTube ids bound once and frozen; snapshots taken only
// when due, append-only, then rescheduled four weeks out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyLedger, validateLedger } from "./ledger.mjs";
import { NEXT_SNAPSHOT_DAYS, bindYoutubeIds, takeDueSnapshots } from "./reconcile.mjs";

const NOW = new Date("2026-10-17T12:00:00Z");

const record = (over = {}) => ({
  subject: null,
  idea_id: null,
  content_type: "long",
  status: "published",
  published_at: "2026-08-25",
  youtube_video_id: null,
  lesson: { state: "none", at: "2026-08-25", note: null },
  analytics: { due_at: "2026-09-01", snapshots: [] },
  ...over,
});

const ledgerOf = (videos) => ({ ...emptyLedger({ now: NOW }), videos });
const catalogOf = (videos) => ({ videos });

test("bindYoutubeIds sets a missing id, keeps a frozen one, and reports a conflict", () => {
  const ledger = ledgerOf({
    "023-attention": record(),
    "024-frozen": record({ youtube_video_id: "rKTadKQ4CYU" }),
    "006-validated-cleanup-system": record({ youtube_video_id: "eZXUIn9GZTI" }),
  });
  const catalog = catalogOf({
    DPXmsLBjyyw: { content_key: "023-attention" },
    rKTadKQ4CYU: { content_key: "024-frozen" },
    OTHER: { content_key: "006-validated-cleanup-system" },
    SHORT: { content_key: "023-attention/short" }, // no ledger record → catalog only
    LOOSE: { content_key: null },
  });
  const out = bindYoutubeIds(ledger, catalog);
  assert.equal(out.changed, true);
  assert.deepEqual(out.bound, [{ key: "023-attention", id: "DPXmsLBjyyw" }]);
  assert.deepEqual(out.conflicts, [{ key: "006-validated-cleanup-system", has: "eZXUIn9GZTI", catalog: "OTHER" }]);
  assert.equal(out.ledger.videos["023-attention"].youtube_video_id, "DPXmsLBjyyw");
  assert.equal(out.ledger.videos["006-validated-cleanup-system"].youtube_video_id, "eZXUIn9GZTI", "frozen");
  assert.equal(out.ledger.videos["023-attention/short"], undefined, "never invents a record");
  assert.equal(ledger.videos["023-attention"].youtube_video_id, null, "pure");
  assert.ok(validateLedger(out.ledger).valid);

  const again = bindYoutubeIds(out.ledger, catalog);
  assert.equal(again.changed, false);
  assert.equal(again.ledger, out.ledger, "idempotent → the same object back");
});

const metrics = { fetched: "2026-10-17", views: 17, watch_minutes: 53, avg_view_seconds: 189, retention_pct: 50.1, subs_gained: 1, impressions: 400, ctr: 0.05, traffic: { YT_SEARCH: 3 } };

test("takeDueSnapshots snapshots a due record and schedules the next one 28 days out", () => {
  assert.equal(NEXT_SNAPSHOT_DAYS, 28);
  const ledger = ledgerOf({
    "023-attention": record({ youtube_video_id: "A" }), // due 2026-09-01 → overdue
    "025-always-on-agents": record({ youtube_video_id: "B", published_at: "2026-10-17", analytics: { due_at: "2026-10-24", snapshots: [] } }), // not yet
    "012-studio-reveal": record({ youtube_video_id: "C", analytics: { due_at: null, snapshots: [] } }), // backfilled history
    "022-context-window": record({ youtube_video_id: null }), // no id yet
    "021-what-is-a-token": record({ youtube_video_id: "MISSING" }), // id the catalog doesn't hold
  });
  const catalog = catalogOf({ A: { metrics }, B: { metrics }, C: { metrics } });
  const out = takeDueSnapshots(ledger, catalog, { now: NOW });
  assert.deepEqual(out.taken, [{ key: "023-attention", at: "2026-10-17" }]);
  const a = out.ledger.videos["023-attention"].analytics;
  assert.equal(a.due_at, "2026-11-14");
  assert.deepEqual(a.snapshots, [{ at: "2026-10-17", views: 17, watch_minutes: 53, avg_view_seconds: 189, retention_pct: 50.1, subs_gained: 1, impressions: 400, ctr: 0.05 }]);
  for (const key of ["025-always-on-agents", "012-studio-reveal", "022-context-window", "021-what-is-a-token"]) {
    assert.equal(out.ledger.videos[key], ledger.videos[key], `${key} untouched`);
  }
  assert.ok(validateLedger(out.ledger).valid, JSON.stringify(validateLedger(out.ledger).errors));
});

test("takeDueSnapshots is idempotent within a day and append-only across due dates", () => {
  const ledger = ledgerOf({ "023-attention": record({ youtube_video_id: "A", analytics: { due_at: "2026-10-17", snapshots: [{ at: "2026-09-19", views: 9 }] } }) });
  const catalog = catalogOf({ A: { metrics } });
  const first = takeDueSnapshots(ledger, catalog, { now: NOW });
  assert.equal(first.ledger.videos["023-attention"].analytics.snapshots.length, 2);
  const second = takeDueSnapshots(first.ledger, catalog, { now: NOW });
  assert.equal(second.changed, false);
  assert.equal(second.ledger, first.ledger);
  const later = takeDueSnapshots(first.ledger, catalog, { now: new Date("2026-11-14T08:00:00Z") });
  assert.deepEqual(later.ledger.videos["023-attention"].analytics.snapshots.map((s) => s.at), ["2026-09-19", "2026-10-17", "2026-11-14"]);
});

test("takeDueSnapshots writes only the numbers the catalog has", () => {
  const ledger = ledgerOf({ "023-attention": record({ youtube_video_id: "A" }) });
  const out = takeDueSnapshots(ledger, catalogOf({ A: { metrics: { fetched: "2026-10-17", views: 4 } } }), { now: NOW });
  assert.deepEqual(out.ledger.videos["023-attention"].analytics.snapshots, [{ at: "2026-10-17", views: 4 }]);
});
