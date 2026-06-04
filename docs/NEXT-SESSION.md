# NEXT SESSION — what's open (handoff)

Quick start for a fresh session. Full reasoning in `docs/DECISIONS.md` (D-023…D-028) and
the current state in `docs/PROGRESS.md`. Channel is now **The Automation Desk**
(@TheAutomationDesk).

## Where we are
- **Video 002** ("What AI Automation Actually Is", the manifesto) is rendered as an
  **edge-tts DRAFT** (long form) + a **Short** (also edge draft). Both await the owner's
  separate approval. After approval → regenerate the **final voice via Azure** (D-024).
- Dynamic-scene system (D-022), rebrand (D-023), compliance rules (D-024…D-026), anti-slop
  core (D-028) are all **in the code/docs**. Distribution machinery (D-027) is **not built yet**.
- **Nothing since commit `fd1c1fe` is committed** — the rebrand + compliance + Short are in
  the working tree (commit when the owner says).

## Owner actions (Phase A — owner doing in parallel)
1. **Azure Speech key** (free): create a Speech resource → put `AZURE_SPEECH_KEY` +
   `AZURE_SPEECH_REGION` in `.env`. Then the agent runs `scripts/make_voice_azure.py 002-…`
   → `make_alignment.py` → rebuild props → re-render the **final** (long + Short).
2. **Rename EconVault → The Automation Desk**; clear old finance content; set channel
   keywords (list in `style/CHANNEL.md` §9). Verify the YouTube handle **@TheAutomationDesk**.
3. **Create socials** under @TheAutomationDesk: Instagram, TikTok, Facebook Page, X,
   Pinterest, a blog (Hashnode/dev.to; Medium semi-manual). Link them all in the YouTube
   "links" section; put the YouTube channel in each platform **bio**.
4. **Connect a free store** (Fourthwall / Spreadshop) to the channel (legitimacy signal).
5. At upload, set **"altered content = yes"** (D-025).

## Agent build tasks (Phase B — distribution machinery, D-027)
- [ ] Stand up **Postiz** (self-hosted, free) as the posting hub; connect each account (OAuth).
- [ ] `pipeline/07-distribute` + skills, triggered after upload (passes the video link):
  - [ ] `make-short` — generalize the vertical Short pipeline (done once for 002; make it reusable).
  - [ ] `social-distribute` orchestrator → Postiz.
  - [ ] Short/Reel → YouTube Shorts + Instagram + TikTok.
  - [ ] `social-link-post` → Facebook + X (hook + YouTube link).
  - [ ] `pinterest-pin` → thumbnail + link.
  - [ ] `blog-from-transcript` → SEO article + link (Hashnode/dev.to API; Medium semi-manual).
- [ ] Verify: which YouTube Data API fields set the altered-content flag (else Studio toggle).

## Finish line for 002 launch
1. Owner approves the long + Short drafts (separately) and notes any changes.
2. Apply changes → regenerate **Azure final voice** → re-align → re-render long + Short.
3. Owner uploads (disclosed) + picks title (`publish.json`) + thumbnail (A/B) + chapters.
4. Distribute via the machinery (or semi-manually for the first one).

## Caveats / verify
- Azure free-tier commercial-output terms (confirm).
- Platform automation gating (TikTok app audit, X write tier, IG Business account).
- edge-tts is **drafts only** — never in a published file.
