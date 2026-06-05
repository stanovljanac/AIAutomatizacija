# CHANNEL

Name, niche, series system, audience, SEO, brand presence, and monetization. Complements
`style/STYLE_GUIDE.md` §8 (titles/descriptions/thumbnails). Rename rationale: `DECISIONS.md`
D-023; anti-slop/brand strategy: D-025…D-028.

---

## 1. Name & promise

**Name:** **The Automation Desk** · handle **@TheAutomationDesk**. English, faceless.

**Promise:** the desk where the boring, everyday automations get figured out and explained
in plain English — start with the small back-office tasks everyone ignores, and grow into
bigger systems, tool comparisons, and automation news. One durable brand, not a one-niche
channel.

**Differentiation:** we own the *unglamorous* automations (data entry, invoices, scheduling,
reminder emails) and present them as a real show with recurring formats — not a content farm.

## 2. The series system (maps onto the 4 archetypes — D-028)

| Series | Archetype | What it is |
|---|---|---|
| **Desk Fixes** | mini-demo | a small real fix shown on a tiny example (owner screen-capture) |
| **Desk Loops** | ideas / diagram | "N ways to automate X" + the trigger→AI→check loop |
| **Automation Breakdowns** | comparison | "best tool/model for X", honest analysis |
| **Desk Notes** | news / short | quick takes on automation/AI news |

The series tag appears on the section-header and in titles/playlists → topical authority +
recognizable show.

## 3. Topical clusters (answer-engine authority — D-026/D-028)

Publish in **owned clusters**, not random one-offs: e.g. run a batch of *spreadsheet
automations*, then *email automations*, then *scheduling*, etc. The idea-bank
(`pipeline/00-ideas/ideas.json`) is tagged by task/sector/tool; produce cluster by cluster so
YouTube/Google read us as the authority on each.

## 4. Audience

Builders / freelancers / no-code & automation agencies who make automations for others (and
SMB owners curious what's possible). They come for resell-able, copy-able ideas. Tone: sharp
practical engineer + warm teacher (STYLE_GUIDE §1).

## 5. Formats & cadence

- **Long:** by archetype/series (Ideas 5-7m, Mini-demo 3-5m, Diagram 5-8m, Comparison 6-10m;
  length follows the topic — never padded/cut).
- **Shorts/Reels:** 1-2 auto-repurposed per long video → YouTube Shorts + Instagram + TikTok.
  Length lives in **STYLE_GUIDE §7** (canonical): ~50-60s, hard max 2:00, never padded.
- **Cadence:** on-demand, in cluster order; let real metrics re-rank the idea-bank.

## 6. SEO & answer-engine (D-026)

- **Answer-first:** the title + first 1-2 description lines + first 30-60s of the video
  directly answer the core question, with **specific names/dates/numbers/places**.
- **Titles:** front-load the search keyword; benefit/curiosity; ≤ ~60 chars.
- **Descriptions:** answer + keyword first, then summary, then chapters + links.
- **Tags:** task + tool names + variants. **Chapters** always. **Thumbnails:** consistent
  brand system (VISUAL_IDENTITY §9), 2 variants → owner picks.

## 7. Brand presence — the off-platform machine (D-027, owner setup checklist)

Faceless AI channels must read as a real connected brand (Fix 3). Owner one-time setup:
- [ ] Create socials under **@TheAutomationDesk**: Instagram, TikTok, Facebook (Page), X,
      Pinterest, plus a blog (Hashnode/dev.to; Medium semi-manual).
- [ ] **Link all of them in the YouTube "links" section**; put the **YouTube channel in each
      platform's bio** → one connected brand.
- [ ] Connect a **free store** (Fourthwall / Spreadshop) to the channel — legitimacy signal
      (Fix 4), even at $0 sales.
- [ ] Stand up **Postiz** (self-hosted, free) and connect each account once (OAuth) so the
      `07-distribute` pipeline can auto-post Shorts/links/pins/articles after each upload.

## 8. Compliance (D-024/D-025)

- **Always disclose altered content = yes** at upload (AI voice + AI visuals).
- **Voice:** Azure AI Speech for the published audio (licensed); edge-tts for drafts only.
- Originality + the human-fingerprint (owner angle + occasional real demo) is what actually
  protects monetization — disclosure alone doesn't.

## 9. Account & monetization

- **Repurpose EconVault** → rename to The Automation Desk, clear old finance content, rebrand
  keywords (channel keywords: `ai automation, office automation, automate boring tasks,
  no-code, spreadsheets, productivity, small business automation, ai workflows`).
- **Monetization:** ad RPM + views for now; products/affiliate deferred (no Stripe). Single
  CTA = subscribe.

## 10. Growth loop

After each video, log CTR / retention to `docs/PROGRESS.md` + the idea's `metrics`; re-rank
the idea-bank; double down on the best cluster/series/tool. The system improves with data.
