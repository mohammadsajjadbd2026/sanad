import "server-only";
import { loadBayyinat } from "./sources/bayyinat";
import { normalizeForSearch } from "./verify/normalize";
import { searchSources } from "./verify/retrieve";
import { decide } from "./verify/decide";
export function scoreQuestion(query: string, question: string) {
  const q = new Set(normalizeForSearch(query).split(" ").filter(x => x.length > 2));
  const a = new Set(normalizeForSearch(question).split(" ").filter(x => x.length > 2));
  const shared = [...q].filter(x => a.has(x)).length;
  // One common word such as «الإسلام» is not sufficient evidence for a Q&A match.
  return q.size >= 2 && shared >= 2 ? shared / q.size : 0;
}
export async function fieldSearch(query: string) {
  const source = await loadBayyinat();
  const ranked = source.records.map(record => ({ record, score: normalizeForSearch(query) === normalizeForSearch(record.question_ar) ? 2 : scoreQuestion(query, record.question_ar) })).sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0.6) return { match: null, related: [], note: "لم نجد سؤالًا قريبًا بدرجة كافية في الأسئلة المحلية. لا ننشئ جوابًا من عندنا." };
  const match = ranked[0].record;
  const related = (await searchSources(match.question_ar, 6)).filter(({ row }) => row.kind === "quran" || row.hadith?.derived_status === "HADITH_AUTHENTIC").slice(0, 3).map(({ row }) => decide(row, row.text, true));
  return { match, related, note: "سؤال وجواب بيّنات بنص المصدر. التشابه لفظي؛ راجع الصفحة والسياق قبل الاستخدام." };
}
