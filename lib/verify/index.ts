import "server-only";
import { extract, isPersonalFatwa } from "./extract";
import { getCandidates, tokenSimilarity } from "./retrieve";
import { normalizeForComparison, normalizeForSearch } from "./normalize";
import { decide } from "./decide";
import type { Finding, Report } from "./types";

export async function verify(text: string): Promise<Report> {
  if (!text.trim() || text.length > 12000) throw new Error("أدخل نصًا بين حرف واحد و12000 حرف.");
  const started = performance.now();
  const findings: Finding[] = [];
  const finish = (): Report => ({ findings, mode: "local-conservative", elapsedMs: Math.round(performance.now() - started), limitation: "مطابقة محلية محافظة، وليست فتوى ولا تقييمًا للسياق. البحث الدلالي الكامل غير مفعّل. عدم العثور لا يعني أن النص موضوع." });
  if (isPersonalFatwa(text)) { findings.push({ status: "REFER_TO_SCHOLAR", quote: text, reason: "يبدو أن الطلب يتصل بفتوى شخصية؛ اعرض تفاصيله على عالم موثوق. لا تصدر المنصة حكمًا في الواقعة." }); return finish(); }
  const rows = await getCandidates();
  const seen = new Set<string>();
  for (const quote of extract(text)) {
    const key = normalizeForComparison(quote);
    const matches = rows.filter(r => r.comparison === key);
    const refs = new Set(matches.map(r => `${r.kind}:${r.ref}`));
    if (refs.size > 1) { findings.push({ quote, status: "NOT_FOUND", reason: "العبارة تطابق أكثر من مرجع؛ أضف رقم السورة والآية أو نصًا أطول لتجنب نسبة غير مؤكدة." }); continue; }
    if (matches.length) {
      const candidate = matches[0], id = `${candidate.kind}:${candidate.ref}`;
      if (!seen.has(id)) { findings.push(decide(candidate, quote, true)); seen.add(id); }
      continue;
    }
    // A sentence surrounding an extracted quotation is context, not a second quotation.
    if (extract(quote).some(part => part !== quote)) continue;
    // Complete source wording embedded in ordinary prose is still an exact excerpt.
    // Require substantial length; short common formulas have many ambiguous refs.
    const contained = rows.filter(r => r.comparison.length >= 30 && key.includes(r.comparison));
    const unique = new Map(contained.map(r => [`${r.kind}:${r.ref}`, r]));
    if (unique.size > 0 && unique.size <= 4) {
      for (const [id, row] of unique) if (!seen.has(id)) {
        findings.push({ ...decide(row, row.text, true), reason: "ورد النص الكامل للمصدر داخل فقرة المدخل بمطابقة محافظة؛ راجع سياق استعماله." });
        seen.add(id);
      }
      continue;
    }
    const search = normalizeForSearch(quote);
    const near = rows.filter(r => r.kind === "quran" && r.language === "ar" && r.search.split(" ").length >= 4)
      .map(row => ({ row, score: tokenSimilarity(search, row.search) })).sort((a, b) => b.score - a.score)[0];
    if (near && near.score >= 0.7 && search.split(" ").length >= 4) {
      const id = `quran:${near.row.ref}`;
      if (!seen.has(id)) { findings.push(decide(near.row, quote, false)); seen.add(id); }
    } else findings.push({ quote, status: /[\u0600-\u06ff\u0980-\u09ffa-z]/iu.test(quote) ? "NOT_FOUND" : "OUT_OF_SCOPE", reason: "لم تتحقق مطابقة في المصادر المحلية. لا يعني ذلك أن النص باطل أو موضوع؛ راجع مصدرًا متخصصًا." });
  }
  return finish();
}
