import { test } from "node:test";
import assert from "node:assert/strict";

import { validate } from "../shared/testkit/index.mjs";
import {
  parseRss,
  parseHnAlgolia,
  normalizeTitle,
  newsId,
  dedupeItems,
  scoreItem,
  suggestArchetype,
  guessTask,
  promoteToIdeas,
  fetchSource,
} from "./fetch-news.mjs";

const NOW = new Date("2026-06-12T00:00:00Z");

const RSS = `<?xml version="1.0"?><rss><channel>
  <item>
    <title>Anthropic launches Claude Opus 4.8</title>
    <link>https://anthropic.com/news/opus-48</link>
    <pubDate>Wed, 10 Jun 2026 10:00:00 GMT</pubDate>
    <description><![CDATA[<p>New flagship model for agentic work.</p>]]></description>
  </item>
  <item>
    <title>OpenAI ships GPT-5.5</title>
    <link>https://openai.com/news/gpt-55</link>
    <pubDate>Mon, 08 Jun 2026 09:00:00 GMT</pubDate>
    <description>Bigger context window.</description>
  </item>
</channel></rss>`;

const ATOM = `<feed>
  <entry>
    <title>Anthropic Launches Claude Opus 4.8</title>
    <link href="https://the-decoder.com/opus-48"/>
    <updated>2026-06-10T12:00:00Z</updated>
    <summary>Independent coverage of the launch.</summary>
  </entry>
</feed>`;

const HN = JSON.stringify({
  hits: [
    { title: "Anthropic launches Claude Opus 4.8", url: "https://news.ycombinator.com/item?id=1", created_at: "2026-06-10T11:00:00Z", objectID: "1" },
    { title: "An unrelated AI side project", url: null, objectID: "2", created_at: "2026-06-01T00:00:00Z" },
  ],
});

function fakeFetch(map) {
  return async (url) => {
    const v = map[url];
    if (v === "throw") throw new Error("network down");
    if (v == null) return { ok: false, text: async () => "" };
    return { ok: true, text: async () => v };
  };
}

test("parseRss extracts RSS items (CDATA + entities handled)", () => {
  const items = parseRss(RSS);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Anthropic launches Claude Opus 4.8");
  assert.equal(items[0].url, "https://anthropic.com/news/opus-48");
  assert.ok(items[0].published.startsWith("2026-06-10"));
  assert.match(items[0].summary, /flagship model/);
});

test("parseRss decodes named, decimal and hex entities in titles", () => {
  const xml = `<rss><channel><item>
    <title>Google&#039;s AI Overviews &amp; the EU&#x27;s ruling</title>
    <link>https://x/1</link>
  </item></channel></rss>`;
  assert.equal(parseRss(xml)[0].title, "Google's AI Overviews & the EU's ruling");
});

test("parseRss reads Atom <entry> with href links", () => {
  const items = parseRss(ATOM);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://the-decoder.com/opus-48");
  assert.ok(items[0].published.startsWith("2026-06-10"));
});

test("parseRss returns [] for non-feed input", () => {
  assert.deepEqual(parseRss("<html><body>not a feed</body></html>"), []);
  assert.deepEqual(parseRss(""), []);
});

test("parseRss skips items with a relative link (keeps news.json schema-valid)", () => {
  const xml = `<rss><channel>
    <item><title>Relative link story</title><link>/story/123</link></item>
    <item><title>Absolute link story</title><link>https://x/abs</link></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://x/abs");
});

test("parseHnAlgolia maps hits and falls back to the HN item url", () => {
  const items = parseHnAlgolia(HN);
  assert.equal(items.length, 2);
  assert.equal(items[1].url, "https://news.ycombinator.com/item?id=2");
});

test("normalizeTitle + newsId collapse case/punctuation to one id", () => {
  assert.equal(normalizeTitle("Anthropic Launches Claude Opus 4.8!"), "anthropic launches claude opus 4 8");
  assert.equal(newsId("Anthropic launches Claude Opus 4.8"), newsId("Anthropic Launches Claude Opus 4.8!"));
});

test("suggestArchetype + guessTask heuristics", () => {
  assert.equal(suggestArchetype({ title: "Claude vs GPT for spreadsheets" }), "comparison");
  assert.equal(suggestArchetype({ title: "How to automate invoice emails" }), "mini-demo");
  assert.equal(suggestArchetype({ title: "Anthropic launches Opus 4.8" }), "ideas");
  assert.equal(guessTask({ title: "Auto-send reminder emails" }), "outbound-comms");
  assert.equal(guessTask({ title: "Big model news" }), "other");
});

test("scoreItem rewards corroboration and recency", () => {
  const recent = { published: "2026-06-10T00:00:00Z", sources: [{ type: "official" }, { type: "aggregator" }] };
  const single = { published: "2026-06-10T00:00:00Z", sources: [{ type: "aggregator" }] };
  const old = { published: "2026-01-01T00:00:00Z", sources: [{ type: "official" }] };
  assert.ok(scoreItem(recent, NOW) > scoreItem(single, NOW));
  assert.ok(scoreItem(recent, NOW) > scoreItem(old, NOW));
  assert.ok(scoreItem(recent, NOW) <= 100);
});

test("dedupeItems merges the same story across sources into one scored item", async () => {
  const raw = [
    ...(await fetchSource({ name: "anthropic", type: "official", url: "u1" }, fakeFetch({ u1: RSS }))),
    ...(await fetchSource({ name: "the-decoder", type: "aggregator", url: "u2" }, fakeFetch({ u2: ATOM }))),
    ...(await fetchSource({ name: "hn", type: "aggregator", url: "u3" }, fakeFetch({ u3: HN }))),
  ];
  const news = dedupeItems(raw, { now: NOW, fetched: NOW });

  const opus = news.items.find((i) => i.title.toLowerCase().includes("opus 4.8"));
  assert.ok(opus, "merged opus item exists");
  assert.equal(opus.sources.length, 3, "three corroborating sources");
  assert.equal(opus.status, "new");
  // It must outrank the single-source items.
  assert.equal(news.items[0].id, opus.id);

  // Whole document validates against news.schema.json.
  const { valid, errors } = validate(news, "news");
  assert.ok(valid, JSON.stringify(errors));
});

test("fetchSource is fail-soft on dead / non-ok sources", async () => {
  assert.deepEqual(await fetchSource({ name: "x", type: "official", url: "u" }, fakeFetch({ u: "throw" })), []);
  assert.deepEqual(await fetchSource({ name: "x", type: "official", url: "u" }, fakeFetch({})), []);
});

test("promoteToIdeas: a corroborated item becomes one scored Desk Notes idea (idempotent)", async () => {
  const raw = [
    ...(await fetchSource({ name: "anthropic", type: "official", url: "u1" }, fakeFetch({ u1: RSS }))),
    ...(await fetchSource({ name: "the-decoder", type: "aggregator", url: "u2" }, fakeFetch({ u2: ATOM }))),
  ];
  const news = dedupeItems(raw, { now: NOW, fetched: NOW });
  const ideas0 = { updated: "2026-06-12", ideas: [] };

  const ideas1 = promoteToIdeas(news, ideas0, { now: NOW });
  const newIdeas = ideas1.ideas.filter((i) => i.source?.origin === "news");
  assert.ok(newIdeas.length >= 1, "at least one news idea promoted");

  const opusNews = news.items.find((i) => i.title.toLowerCase().includes("opus 4.8"));
  const opusIdea = ideas1.ideas.find((i) => i.id === `news-${opusNews.id}`);
  assert.ok(opusIdea, "opus promoted to a backlog idea");
  assert.equal(opusIdea.source.news_id, opusNews.id);
  assert.equal(opusIdea.status, "backlog");
  assert.equal(opusNews.status, "promoted"); // news item marked in place
  assert.equal(opusNews.idea_id, opusIdea.id);

  // ideas.json stays schema-valid after promotion.
  assert.ok(validate(ideas1, "ideas").valid, JSON.stringify(validate(ideas1, "ideas").errors));

  // Idempotent: re-running with the already-updated bank adds nothing.
  const ideas2 = promoteToIdeas(news, ideas1, { now: NOW });
  assert.equal(ideas2.ideas.length, ideas1.ideas.length);
});

test("promoteToIdeas respects the minScore threshold", () => {
  const news = { updated: NOW.toISOString(), items: [
    { id: "lowscore1", title: "Minor tweak", url: "https://x/1", sources: [{ name: "hn", type: "aggregator" }], score: 40, suggested_archetype: "ideas", status: "new", idea_id: null, fetched: NOW.toISOString() },
  ] };
  const out = promoteToIdeas(news, { updated: "2026-06-12", ideas: [] }, { now: NOW, minScore: 70 });
  assert.equal(out.ideas.length, 0);
});

// ── regression tests added by verifier ─────────────────────────────────────

test("parseRss: item missing title is skipped", () => {
  const xml = `<rss><channel>
    <item><link>https://x/1</link><description>no title</description></item>
    <item><title>Valid Title</title><link>https://x/2</link></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Valid Title");
});

test("parseRss: item missing link is skipped", () => {
  const xml = `<rss><channel>
    <item><title>No link here</title><description>missing url</description></item>
    <item><title>Has Link</title><link>https://x/1</link></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Has Link");
});

test("parseHnAlgolia: garbage JSON string returns []", () => {
  assert.deepEqual(parseHnAlgolia("{{not json}}}"), []);
});

test("parseHnAlgolia: hit with null url and null objectID is filtered", () => {
  const data = JSON.stringify({ hits: [
    { title: "Story", url: null, objectID: null },
    { title: "Has objectID", url: null, objectID: "999" },
  ]});
  const items = parseHnAlgolia(data);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://news.ycombinator.com/item?id=999");
});

test("dedupeItems: same-source-name entries count as ONE source (no false corroboration)", () => {
  // Two entries from "openai" (same name) must merge to 1 item with 1 source, not 2.
  const raw = [
    { title: "Big News", url: "https://x/1", published: null, source: { name: "openai", type: "official", url: "https://x/1" } },
    { title: "Big News", url: "https://x/2", published: null, source: { name: "openai", type: "official", url: "https://x/2" } },
  ];
  const news = dedupeItems(raw, { now: NOW, fetched: NOW });
  assert.equal(news.items.length, 1);
  assert.equal(news.items[0].sources.length, 1, "same source name must not double-count corroboration");
});

test("scoreItem: recency bucket boundaries (<=3 vs 4 days; <=7 vs 8 days)", () => {
  const base = { sources: [{ type: "official" }] };
  const day3 = { ...base, published: new Date(NOW.getTime() - 3 * 86400_000).toISOString() };
  const day4 = { ...base, published: new Date(NOW.getTime() - 4 * 86400_000).toISOString() };
  const day7 = { ...base, published: new Date(NOW.getTime() - 7 * 86400_000).toISOString() };
  const day8 = { ...base, published: new Date(NOW.getTime() - 8 * 86400_000).toISOString() };
  assert.equal(scoreItem(day3, NOW), 75, "3 days old: +15 recency");
  assert.equal(scoreItem(day4, NOW), 68, "4 days old: +8 recency");
  assert.equal(scoreItem(day7, NOW), 68, "7 days old: +8 recency");
  assert.equal(scoreItem(day8, NOW), 63, "8 days old: +3 recency");
});

test("promoteToIdeas: non-eligible items are NOT mutated (status stays 'new')", () => {
  // An item below the score threshold must not have its status or idea_id changed.
  const news = { updated: NOW.toISOString(), items: [
    { id: "lowscore2", title: "Tiny update", url: "https://x/1", sources: [{ name: "hn", type: "aggregator" }],
      score: 40, suggested_archetype: "ideas", status: "new", idea_id: null, fetched: NOW.toISOString() },
  ]};
  promoteToIdeas(news, { updated: "2026-06-12", ideas: [] }, { now: NOW, minScore: 70 });
  assert.equal(news.items[0].status, "new", "non-promoted item status must remain 'new'");
  assert.equal(news.items[0].idea_id, null, "non-promoted item idea_id must remain null");
});

test("promoteToIdeas: max cap limits promotion regardless of eligible count", () => {
  // 6 eligible items (score=80 each) with max=5: only 5 should be promoted.
  const items = Array.from({ length: 6 }, (_, i) => ({
    id: `item${i}`,
    title: `Story ${i}`,
    url: `https://x/${i}`,
    sources: [{ name: `src${i}`, type: "official" }],
    score: 80,
    suggested_archetype: "ideas",
    status: "new",
    idea_id: null,
    fetched: NOW.toISOString(),
    published: NOW.toISOString(),
    summary: "",
  }));
  const news = { updated: NOW.toISOString(), items };
  const result = promoteToIdeas(news, { updated: "2026-06-12", ideas: [] }, { now: NOW, minScore: 70, max: 5 });
  assert.equal(result.ideas.length, 5, "at most max=5 items promoted");
});
