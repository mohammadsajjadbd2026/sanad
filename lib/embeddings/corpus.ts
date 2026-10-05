import "server-only";
import { createHash } from "node:crypto";
import { loadQuran } from "../sources/quran";
import { loadHadith } from "../sources/hadith";
import { loadBayyinat } from "../sources/bayyinat";
import { dataRoot } from "../sources/read";

export type CorpusKind = "quran" | "hadith" | "bayyinat";
export type SearchDocument = { id: string; kind: CorpusKind; ref: string; text: string; hash: string };
export function sha256(text: string) { return createHash("sha256").update(text).digest("hex"); }
export function makeDocument(kind: CorpusKind, ref: string, text: string): SearchDocument {
  return { id: `${kind}:${ref}`, kind, ref, text, hash: sha256(text) };
}

export async function loadCorpus(root = dataRoot()): Promise<SearchDocument[]> {
  const [quran, hadith, bayyinat] = await Promise.all([loadQuran(root), loadHadith(root), loadBayyinat(root)]);
  // Each document represents ONE reference. All texts come from sources, never the eval set.
  const verses = Object.keys(quran.arabic).sort((a, b) => {
    const [as, av] = a.split(":").map(Number); const [bs, bv] = b.split(":").map(Number);
    return as - bs || av - bv;
  }).map(ref => makeDocument("quran", ref, [quran.arabic[ref].uthmani, ...["en", "bn", "ur"].map(lang => quran.translations[lang as "en" | "bn" | "ur"][ref])].join("\n")));
  const narrations = hadith.records.map(h => makeDocument("hadith", h.id, [h.text_ar, ...Object.values(h.common_translations).flat()].join("\n")));
  // The question alone retrieves the existing answer; the answer is never generated.
  const questions = bayyinat.records.map(b => makeDocument("bayyinat", b.id, b.question_ar));
  return [...verses, ...narrations, ...questions];
}

export function selectSample(documents: readonly SearchDocument[], limit: number): SearchDocument[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("حجم العينة يجب أن يكون عددًا صحيحًا موجبًا");
  const groups = ["quran", "hadith", "bayyinat"].map(kind => documents.filter(doc => doc.kind === kind));
  const result: SearchDocument[] = [];
  for (let index = 0; result.length < Math.min(limit, documents.length); index++) {
    for (const group of groups) if (group[index] && result.length < limit) result.push(group[index]);
  }
  return result;
}
