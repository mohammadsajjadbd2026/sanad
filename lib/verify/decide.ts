import "server-only";
import { statusFromSourceCategories } from "../sources/hadith";
import type { Candidate } from "./retrieve";
import type { Finding } from "./types";
export function decide(candidate: Candidate, quote: string, exact: boolean): Finding {
  const base = { quote, ref: candidate.ref, sourceText: candidate.arabic, attribution: candidate.attribution, ...(candidate.language !== "ar" ? { translation: candidate.text } : {}) };
  if (candidate.kind === "quran") return { ...base, status: exact ? "QURAN_VERIFIED" : "QURAN_WORDING_DIFFERS", reason: exact ? "مطابقة نص مسجل بعد إزالة التشكيل وعلامات الترقيم فقط. لا يشمل ذلك صحة سياق الاستشهاد." : "مرشح قرآني قريب؛ لا نعتمد اللفظ المدخل. راجع النص المرجعي حرفيًا.", url: `https://quran.com/${candidate.ref.replace(":", "/")}` };
  if (!exact || !candidate.hadith) return { quote, status: "NOT_FOUND", reason: "التشابه وحده لا يثبت الحديث؛ لم تتحقق مطابقة محافظة. راجع مختصًا." };
  return { ...base, status: statusFromSourceCategories(candidate.hadith.rulings.map(r => r.category)) ?? "NOT_FOUND", rulings: candidate.hadith.rulings, url: candidate.hadith.url, reason: "اللفظ مطابق للفهرس؛ الحالة مشتقة حتميًا من جميع تصنيفات أحكام المصدر، دون ترجيح من نموذج." };
}
