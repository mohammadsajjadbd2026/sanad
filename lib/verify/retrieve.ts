import "server-only";
import { loadQuran } from "../sources/quran";
import { loadHadith } from "../sources/hadith";
import { loadAlternativeTranslations } from "../sources/quran-alternatives";
import { normalizeForComparison, normalizeForSearch } from "./normalize";
import type { Hadith, Language } from "../sources/schemas";

export type Candidate = { kind: "quran" | "hadith"; ref: string; text: string; comparison: string; search: string; language: Language; arabic: string; attribution: string; hadith?: Hadith };
let cached: Promise<Candidate[]> | undefined;
export function getCandidates(): Promise<Candidate[]> {
  return cached ??= (async () => {
    const [quran, hadith] = await Promise.all([loadQuran(), loadHadith()]);
    const rows: Candidate[] = [];
    const add = (row: Omit<Candidate, "comparison" | "search">) => rows.push({ ...row, comparison: normalizeForComparison(row.text), search: normalizeForSearch(row.text) });
    for (const [ref, ar] of Object.entries(quran.arabic)) {
      add({ kind: "quran", ref, text: ar.uthmani, arabic: ar.uthmani, language: "ar", attribution: "القرآن الكريم" });
      add({ kind: "quran", ref, text: ar.clean, arabic: ar.uthmani, language: "ar", attribution: "القرآن الكريم" });
      for (const lang of ["en", "bn", "ur"] as const) {
        const source = quran.get(ref, lang)!;
        add({ kind: "quran", ref, text: source.text, arabic: ar.uthmani, language: lang, attribution: source.attribution });
      }
    }
    const alternatives = await loadAlternativeTranslations(Object.keys(quran.arabic));
    for (const edition of alternatives) for (const [ref, text] of Object.entries(edition.texts)) {
      add({ kind: "quran", ref, text, arabic: quran.arabic[ref].uthmani, language: edition.language, attribution: edition.attribution });
    }
    for (const h of hadith.records) {
      add({ kind: "hadith", ref: h.id, text: h.text_ar, arabic: h.text_ar, language: "ar", attribution: "فهرس الحديث المحلي", hadith: h });
      for (const lang of ["en", "bn", "ur"] as const) for (const translation of h.common_translations[lang]) add({ kind: "hadith", ref: h.id, text: translation, arabic: h.text_ar, language: lang, attribution: "صيغة مترجمة مسجلة في الفهرس؛ ليست لفظ الحديث العربي", hadith: h });
    }
    return rows;
  })().catch(error => { cached = undefined; throw error; });
}

export function tokenSimilarity(a: string, b: string) {
  const x = new Set(a.split(" ").filter(Boolean)), y = new Set(b.split(" ").filter(Boolean));
  const overlap = [...x].filter(t => y.has(t)).length;
  return x.size + y.size ? 2 * overlap / (x.size + y.size) : 0;
}
export async function searchSources(query: string, limit = 12) {
  const key = normalizeForSearch(query);
  if (key.length < 2) return [];
  const rows = await getCandidates();
  const seen = new Set<string>();
  return rows.map(row => ({ row, score: row.search.includes(key) ? 1 : tokenSimilarity(key, row.search) }))
    .filter(r => r.score >= 0.15).sort((a, b) => b.score - a.score)
    .filter(({ row }) => { const id = `${row.kind}:${row.ref}`; if (seen.has(id)) return false; seen.add(id); return true; }).slice(0, limit);
}
