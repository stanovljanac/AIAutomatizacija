# Phase 01-script — see pipeline/README.md and the matching skill in .claude/skills/

## `lint-vo.mjs` — the editing-law lint (opt-in per video)

```
node pipeline/01-script/lint-vo.mjs <content-id>
```

For videos built on screen-capture footage, the recurring failure is the voice narrating the
**clicking** ("then I open the node, next I click Execute") and leaking setup vocabulary (OAuth, API
key, Google Cloud) that no viewer cares about. That's a content rule, so it's checked at the script
gate — before the owner records, not in the edit.

Opt in by declaring `editing_law` in the video's `brief.json`:

```json
"editing_law": {
  "rule": "Nobody cares about n8n. They care how the problem got solved.",
  "no_sentence_openers": ["then i", "next i", "go to"],
  "banned_vo_terms": ["oauth", "api key", "google cloud"]
}
```

A brief without that block lints clean (the CLI prints `SKIP`). Openers match only at the start of a
sentence; banned terms match whole-word anywhere in it. Exit 1 on any finding, so it can gate.
`lintVo(script, law)` is exported pure for use inside `script-review`.
