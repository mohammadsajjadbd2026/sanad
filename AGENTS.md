# Sanad (سَنَد) — Project Spec for AI Coding Agents

## What this is
One platform where an Islamic da'wah worker goes through five stations:
1. Prepare (استعدّ)  /prepare  dialogue trainer: questions from data/bayyinat.json
2. Draft (أعِدّ)     /draft    the VERIFIER: paste or upload text, get a citation report
3. Produce (أنتِج)  /produce  verified social cards, localized to an audience
4. Publish (انشر)    /publish  export PNG, copy caption, share to WhatsApp, source always visible
5. Practice (مارِس)  /practice field mode: type a question, get the closest Bayyinat
                              answer verbatim + related verified texts (retrieval only)
Home page (/) shows the journey. Verification sits under every station.
Challenge: "AI Challenge Serving Islamic Content", Track 4. Build window Oct 4-6 2026.

## The one rule that overrides everything
The LLM PROPOSES, the SOURCE DECIDES.
- The LLM must NEVER output or invent a hadith ruling, a verse, or a reference.
- Rulings are shown ONLY as verbatim `ruling_text` from data/hadith/index.json.
- Status is computed by deterministic code (lib/verify/decide.ts), never by the model.
- No candidate with confidence >= THRESHOLD -> NOT_FOUND + referral to a scholar.
  "Not found" is NOT "fabricated". Fabricated only if a source ruling says so.
- Conflicting rulings -> HADITH_MULTIPLE_RULINGS, show all, no automatic preference.
- Personal fatwa questions -> general info + referral, never a ruling.
- Every LLM call uses JSON output with a schema, validated with zod; invalid output
  -> retry once -> fail safely to NOT_FOUND.
- Field mode (/practice) never generates religious text; it only retrieves.

## Data
- The user fills Excel files in /sources. `python build_data.py` converts them to
  JSON in /data. NEVER edit, generate, or complete anything in /sources or /data.
  The only allowed action: converting a downloaded Quran translation file into the
  `sura|aya|text` format inside /sources/quran, without changing any text.
- If data is missing or malformed: STOP and tell the user what is wrong.
- Test cases with review_status other than "مقبول" are skipped by eval by default.

## Stack
Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel from GitHub.
Gemini via @google/genai. Model names from env vars: GEMINI_MODEL, GEMINI_EMBED_MODEL.
GEMINI_API_KEY is server-only, in .env.local locally and in Vercel settings.
No database. Precomputed embeddings in /data/embeddings.
Font: Readex Pro. RTL Arabic UI; content in ar/en/bn/ur. Mobile-friendly.

## Folder layout
/app            pages above + /about (method, sources, limits)
/app/api        verify, produce, localize, dialogue, practice
/lib/verify     extract.ts, retrieve.ts, match.ts, rulings.ts, decide.ts, index.ts
/lib/sources    quran.ts, hadith.ts, dorar.ts (optional, only if DORAR_LIVE=true)
/lib/llm        gemini.ts, prompts/*.ts, schemas.ts
/scripts        build-embeddings.ts, eval.ts
/results        eval outputs (committed)

## Status values
QURAN_VERIFIED, QURAN_WORDING_DIFFERS, HADITH_AUTHENTIC, HADITH_WEAK,
HADITH_FABRICATED, HADITH_MULTIPLE_RULINGS, NOT_FOUND, OUT_OF_SCOPE, REFER_TO_SCHOLAR.
Show each with colour AND text label (never colour alone).

## Privacy & transparency
- No accounts. Do not store user texts on the server. Saved items stay in the browser.
- Banner on every page: "أداة مدعومة بالذكاء الاصطناعي، وليست مفتيًا ولا محدّثًا".
- Never infer the user's religion or traits. The user picks the audience.
- Generated text (captions, localized wording, feedback) is labeled "مولّد".
- Rate limit per visitor and a max input length on every API route.

## Working rules
- Small steps. After each phase: `npm run build` and `npm test`, then commit.
- Never commit secrets. Keep .env.example current.
- Explain dependencies you add. Prefer simple code the user can explain.
- Keep README.md (run, eval, results, limitations) and PLAN.md current.
