import "server-only";
import type { SearchDocument, CorpusKind } from "./corpus";
import type { StoredEmbedding } from "./build";
import { cosineSimilarity } from "./math";

/** Candidates only: a similarity score is not confidence in a religious ruling. */
export function rankCandidates(query: readonly number[], documents: readonly SearchDocument[], entries: readonly StoredEmbedding[], options: { limit?: number; kind?: CorpusKind } = {}) {
  const limit = options.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("عدد نتائج غير صالح");
  const byId = new Map(documents.map(d => [d.id, d]));
  return entries.flatMap(entry => {
    const document = byId.get(entry.id);
    if (!document || document.hash !== entry.sourceHash) throw new Error("الفهرس الدلالي لا يطابق المصادر الحالية");
    if (options.kind && document.kind !== options.kind) return [];
    return [{ id: document.id, kind: document.kind, ref: document.ref, similarity: cosineSimilarity(query, entry.values) }];
  }).sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id)).slice(0, limit);
}
