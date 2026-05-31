# TERM BANK (EN → SR)

The authority for how English/AI terms are written in our Serbian scripts. The
script-writing and review skills **must** follow this. **You (the owner) edit this
file freely** — add a row whenever we hit a new term. When a term isn't here, the
review agent flags it and proposes an entry rather than guessing.

Rules of thumb (from STYLE_GUIDE §2):
- If a clean Serbian word exists and sounds natural → use Serbian.
- If the English term is the de-facto standard among Serbian speakers in tech →
  keep it (as a loanword), spelled consistently as decided here.
- Never invent a word. Never half-translate awkwardly.

Columns: **EN term** · **Use in script (SR)** · **Notes / example**

| EN term | Use in script (SR) | Notes / example |
|--------|---------------------|-----------------|
| prompt | prompt | Keep. "Napiši dobar prompt." Plural: promptovi. |
| token | token | Keep. Plural: tokeni. |
| embedding | embedding (imenica) / embedovani (pridev) | "embedovani sistemi" = embedded systems. |
| fine-tuning | fino podešavanje | Verb: fino podesiti. |
| model | model | Keep. |
| large language model (LLM) | veliki jezički model (LLM) | Spell out first time, then LLM. |
| dataset | skup podataka | |
| training | treniranje / obučavanje | "model je treniran na…". |
| inference | izvođenje (zaključivanje) | Prefer "izvođenje"; explain on first use. |
| open source | otvoreni kod | "model otvorenog koda". |
| open weights | otvoreni parametri (težine) | Explain once. |
| agent | agent | Keep. |
| agentic | agentski | "agentski tok rada". |
| workflow | tok rada | |
| pipeline | tok / pajplajn (radije: tok obrade) | Prefer "tok obrade"; avoid "pajplajn" in narration. |
| skill (Claude) | skil / veština | When it's the product feature, keep "skil" or say "veština"; be consistent within a video. |
| MCP (server) | MCP (server) | Keep acronym; explain "protokol za povezivanje alata" first time. |
| context window | kontekstni prozor | |
| hallucination | halucinacija | "model halucinira". |
| benchmark | benčmark / merenje performansi | Prefer "merenje performansi"; "benčmark" acceptable. |
| latency | kašnjenje (latencija) | |
| throughput | propusnost | |
| API | API | Keep. |
| endpoint | krajnja tačka (endpoint) | |
| deploy | postaviti / objaviti (deploy) | Context-dependent. |
| repository (repo) | repozitorijum (repo) | |
| commit | komit / sačuvati izmene | Prefer plain "sačuvati izmene" in beginner videos. |
| frontend | frontend | Keep. |
| backend | backend | Keep. |
| framework | radni okvir (framework) | |
| chatbot | četbot | |
| voice cloning | kloniranje glasa | |
| text-to-speech (TTS) | sinteza govora (TTS) | |
| render (video) | renderovanje | |
| subtitle / caption | titl / titlovi | |
| thumbnail | sličica (thumbnail) | "sličica videa"; "thumbnail" acceptable. |
| update | ažuriranje / apdejt | Prefer "ažuriranje". |
| release | izdanje / objava | "novo izdanje modela". |
| feature | funkcija / mogućnost | Avoid "fičer". |
| use case | primer upotrebe | |
| state of the art (SOTA) | najnaprednije / vrhunsko | Avoid raw "SOTA" in narration. |
| GPU | grafička kartica (GPU) | |
| cloud | klaud / oblak | Prefer "klaud" if natural; "u klaudu". |

<!--
HOW TO ADD A TERM:
- Add a row. Keep the SR choice consistent across all videos.
- If a term has both a noun and adjective form, give both (see "embedding").
- If you change a decision, update the row and note it in docs/DECISIONS.md if it
  matters project-wide.
-->

## Quick "avoid these spellings" list
- Don't write: "fičer", "dejta", "trening dejta", "implementirati" (when "uraditi/
  napraviti" fits), "pajplajn" (in narration).
- Don't anglicize verbs unnecessarily: prefer "pokrenuti" over "ranovati",
  "instalirati" is fine, "konfigurisati" is fine, "debug-ovati" → "tražiti grešku".
