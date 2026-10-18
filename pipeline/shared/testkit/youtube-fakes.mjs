// Fake YouTube clients for the analytics-loop tests (D-073) — the same call shapes googleapis
// exposes, backed by plain data, with every call recorded so a test can assert what was asked.

/** Split `items` into pages of `size`, keyed by a numeric pageToken. */
function paged(items, size, pageToken, key = "items") {
  const start = Number(pageToken ?? 0);
  const next = start + size < items.length ? String(start + size) : undefined;
  return { data: { [key]: items.slice(start, start + size), nextPageToken: next } };
}

/**
 * google.youtube('v3') — `uploads`: [{id, title, publishedAt, duration, privacy}],
 * `playlists`: [{id, title, videoIds}]. Pages of 2 so pagination is always exercised.
 */
export function fakeYouTube({ uploads = [], playlists = [] } = {}) {
  const calls = [];
  const lists = { UPLOADS: uploads.map((u) => u.id), ...Object.fromEntries(playlists.map((p) => [p.id, p.videoIds])) };
  return {
    calls,
    channels: {
      list: async (p) => (calls.push(["channels.list", p]), { data: { items: [{ contentDetails: { relatedPlaylists: { uploads: "UPLOADS" } } }] } }),
    },
    playlistItems: {
      list: async (p) => {
        calls.push(["playlistItems.list", p]);
        const ids = lists[p.playlistId] ?? [];
        return paged(ids.map((videoId) => ({ contentDetails: { videoId } })), 2, p.pageToken);
      },
    },
    videos: {
      list: async (p) => {
        calls.push(["videos.list", p]);
        const want = new Set(String(p.id).split(","));
        const items = uploads
          .filter((u) => want.has(u.id))
          .map((u) => ({
            id: u.id,
            snippet: { title: u.title, publishedAt: u.publishedAt },
            contentDetails: { duration: u.duration },
            status: { privacyStatus: u.privacy ?? "public", ...(u.publishAt ? { publishAt: u.publishAt } : {}) },
          }));
        return { data: { items } };
      },
    },
    playlists: {
      list: async (p) => {
        calls.push(["playlists.list", p]);
        return paged(playlists.map((pl) => ({ id: pl.id, snippet: { title: pl.title } })), 2, p.pageToken);
      },
    },
  };
}

/**
 * google.youtubeAnalytics('v2') — `types`: {id: "short"|"long"}, `metrics`: {id: {views, …API names}},
 * `traffic`: {id: {SOURCE: views}}. Answers the exact query shapes youtube-catalog.mjs sends.
 */
export function fakeAnalytics({ types = {}, metrics = {}, traffic = {} } = {}) {
  const calls = [];
  const table = (headers, rows) => ({ data: { columnHeaders: headers.map((name) => ({ name })), rows } });
  return {
    calls,
    reports: {
      query: async (p) => {
        calls.push(p);
        const type = /creatorContentType==(\w+)/.exec(p.filters ?? "")?.[1];
        if (type) {
          const want = type === "shorts" ? "short" : "long";
          return table(["video", "views"], Object.entries(types).filter(([, t]) => t === want).map(([id]) => [id, metrics[id]?.views ?? 0]));
        }
        if (p.dimensions === "insightTrafficSourceType") {
          const id = /video==(.+)$/.exec(p.filters)?.[1];
          return table(["insightTrafficSourceType", "views"], Object.entries(traffic[id] ?? {}));
        }
        const cols = String(p.metrics).split(",");
        return table(["video", ...cols], Object.entries(metrics).map(([id, m]) => [id, ...cols.map((c) => m[c] ?? null)]));
      },
    },
  };
}

/**
 * google.youtubereporting('v1') + the OAuth client that downloads reports. `jobs`: existing jobs,
 * `reports`: [{id, createTime, startTime, csv}]. `disabled: true` answers every call the way the
 * API does before it is enabled in the Cloud project.
 */
export function fakeReporting({ jobs = [], reports = [], disabled = false } = {}) {
  const calls = [];
  const state = { jobs: [...jobs] };
  const refuse = () => {
    const e = new Error("YouTube Reporting API has not been used in project 123 before or it is disabled.");
    e.errors = [{ reason: "accessNotConfigured" }];
    throw e;
  };
  const yr = {
    calls,
    state,
    jobs: {
      list: async (p) => (calls.push(["jobs.list", p]), disabled && refuse(), { data: { jobs: state.jobs } }),
      create: async (p) => {
        calls.push(["jobs.create", p]);
        if (disabled) refuse();
        const job = { id: `job-${state.jobs.length + 1}`, ...p.requestBody };
        state.jobs.push(job);
        return { data: job };
      },
      reports: {
        list: async (p) => {
          calls.push(["jobs.reports.list", p]);
          const items = reports.map(({ csv, ...r }) => ({ ...r, downloadUrl: `https://example.test/${r.id}` }));
          return paged(items, 2, p.pageToken, "reports");
        },
      },
    },
  };
  const auth = {
    calls,
    request: async ({ url }) => {
      calls.push(["download", url]);
      const r = reports.find((x) => url.endsWith(`/${x.id}`));
      return { data: r?.csv ?? "" };
    },
  };
  return { yr, auth };
}
