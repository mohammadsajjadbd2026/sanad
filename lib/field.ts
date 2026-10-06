import "server-only";
import { loadBayyinat } from "./sources/bayyinat";
import { normalizeForSearch } from "./verify/normalize";
import { searchSources } from "./verify/retrieve";
import { decide } from "./verify/decide";
import { isPersonalFatwa } from "./verify/extract";
import { suggestQuestions } from "./llm/question-selector";
import type { Bayyinat } from "./sources/schemas";
export function scoreQuestion(query: string, question: string) {
  const q = new Set(normalizeForSearch(query).split(" ").filter(x => x.length > 2));
  const a = new Set(normalizeForSearch(question).split(" ").filter(x => x.length > 2));
  const shared = [...q].filter(x => a.has(x)).length;
  // One common word such as «الإسلام» is not sufficient evidence for a Q&A match.
  return q.size >= 2 && shared >= 2 ? shared / q.size : 0;
}
async function sourceAnswer(match: Bayyinat, note: string) {
  const related = (await searchSources(match.question_ar, 6)).filter(({ row }) => row.kind === "quran" || row.hadith?.derived_status === "HADITH_AUTHENTIC").slice(0, 3).map(({ row }) => decide(row, row.text, true));
  return { match, related, suggestions: [], note };
}

export async function fieldSearch(query: string, options: { allowGemini?: boolean; selectedId?: string } = {}) {
  if (isPersonalFatwa(query)) return { match: null, related: [], suggestions: [], note: "هذا السؤال يتصل بواقعة شخصية؛ اعرض تفاصيلها على عالم موثوق." };
  const source = await loadBayyinat();
  if (options.selectedId) {
    const selected = source.get(options.selectedId);
    if (!selected) throw new Error("السؤال غير موجود في المصدر.");
    return sourceAnswer(selected, "هذا جواب السؤال الذي اخترته، بنص بيّنات الأصلي. راجع مطابقة السؤال لحالتك والسياق قبل الاستخدام.");
  }
  const ranked = source.records.map(record => ({ record, score: normalizeForSearch(query) === normalizeForSearch(record.question_ar) ? 2 : scoreQuestion(query, record.question_ar) })).sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0.6) {
    const ids = options.allowGemini === true ? await suggestQuestions(query, source.records.map(({ id, question_ar }) => ({ id, question_ar }))) : null;
    const suggestions = (ids ?? []).flatMap(id => { const q = source.get(id); return q ? [{ id: q.id, question_ar: q.question_ar, page: q.page }] : []; });
    return { match: null, related: [], suggestions, note: suggestions.length
      ? "ترشيح بحث بمساعدة Gemini؛ اختر السؤال الأقرب لمقصودك لعرض جوابه الأصلي. الجواب متاح بالعربية كما ورد في المصدر."
      : options.allowGemini && ids === null ? "البحث بمساعدة Gemini غير متاح الآن أو نفدت حصته المجانية. يمكنك البحث بألفاظ السؤال العربي أو المحاولة لاحقًا."
      : "لم نجد سؤالًا قريبًا بدرجة كافية في الأسئلة المحلية. لا ننشئ جوابًا من عندنا." };
  }
  const match = ranked[0].record;
  return sourceAnswer(match, "سؤال وجواب بيّنات بنص المصدر. التشابه لفظي؛ راجع الصفحة والسياق قبل الاستخدام.");
}
