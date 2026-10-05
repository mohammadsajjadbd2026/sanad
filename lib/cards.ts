import "server-only";
import { z } from "zod";
import { getCandidates, searchSources } from "./verify/retrieve";
import { decide } from "./verify/decide";
import { languageSchema } from "./sources/schemas";
import { RequestError } from "./http";
export const cardRequestSchema = z.object({ kind: z.enum(["quran", "hadith"]), ref: z.string().max(30), language: languageSchema.default("ar") });
export async function canonicalCard(input: z.infer<typeof cardRequestSchema>) {
  const row = (await getCandidates()).find(r => r.kind === input.kind && r.ref === input.ref && r.language === input.language);
  if (!row) throw new RequestError("هذه الصيغة غير مسجلة للمصدر واللغة المختارين.");
  const finding = decide(row, row.text, true);
  if (!["QURAN_VERIFIED", "HADITH_AUTHENTIC"].includes(finding.status)) throw new RequestError("لا تُصدّر بطاقة لهذا النص بسبب حالة الحكم في المصدر.");
  const reference = row.kind === "quran" ? `القرآن الكريم · ${row.ref}${row.language !== "ar" ? ` · ترجمة المعاني: ${row.attribution}` : ""}` : `${row.hadith!.rulings.map(r => `${r.muhaddith} · ${r.source} (${r.ref}) · ${r.ruling_text}`).join(" | ")}${row.language !== "ar" ? " · صيغة مترجمة مسجلة، وليست اللفظ العربي" : ""}`;
  return { kind: row.kind, ref: row.ref, language: row.language, text: row.text, arabic: row.arabic, reference, url: finding.url!, status: finding.status, disclaimer: "أداة مدعومة بالذكاء الاصطناعي، وليست مفتيًا ولا محدّثًا" };
}
export async function catalog(query: string) {
  return (await searchSources(query, 30)).filter(({ row }) => row.kind === "quran" || row.hadith?.derived_status === "HADITH_AUTHENTIC").slice(0, 12).map(({ row }) => ({ kind: row.kind, ref: row.ref, text: row.arabic, topic: row.hadith?.topic ?? "القرآن الكريم" }));
}
