import { readFile, writeFile } from "node:fs/promises";
import { verify } from "../lib/verify";
import { loadQuran } from "../lib/sources/quran";
import { normalizeForComparison } from "../lib/verify/normalize";
import type { Language } from "../lib/sources/schemas";
type Case = { id: string; split: string; review_status: string; category: string; lang: string; text: string; expected_status: string; expected_ref: string };
async function main() {
  const cases = JSON.parse(await readFile("data/testset.json", "utf8")) as Case[];
  const dev = cases.filter(c => c.split === "dev" && c.review_status !== "مقبول");
  const quran = await loadQuran();
  const sample: { id: string; category: string; language: string; recordedExpectation: string; recordedRef: string; found: string; refs: string[]; classification: string }[] = [];
  for (const item of dev) {
    const report = await verify(item.text);
    if (report.findings.some(f => f.status === item.expected_status && (!item.expected_ref || f.ref === item.expected_ref))) continue;
    const found = report.findings.map(f => f.status).join(", ");
    const approvedTranslation = ["bn", "ur", "en"].includes(item.lang) ? quran.get(item.expected_ref, item.lang as Language)?.text : undefined;
    const translationMismatch = approvedTranslation && !normalizeForComparison(item.text).includes(normalizeForComparison(approvedTranslation));
    sample.push({ id: item.id, category: item.category, language: item.lang, recordedExpectation: item.expected_status, recordedRef: item.expected_ref, found, refs: report.findings.map(f => f.ref ?? ""), classification: translationMismatch ? "اختلاف بيانات/تغطية مصادر مرجّح: نص الحالة لا يطابق ترجمة المعاني المسجلة لهذا المرجع. راجع مصدر الترجمة أو توقع الحالة قبل اعتمادها." : "غير محسوم: توقع الحالة غير معتمد؛ افحص المصدر والمطابقة يدويًا." });
    if (sample.length === 10) break;
  }
  const lines = ["# فرز أولي لحالات dev غير المعتمدة", "", "هذه ليست نتائج دقة أو أخطاء مثبتة؛ توقعات الحالات نفسها تحمل حالة «لم يراجع». يفرز الملف أول عشر حالات تحتاج نظرًا من المراجع. لا تعدّل المصدر اعتمادًا على هذا التقرير وحده.", "", ...sample.map((s, i) => `${i + 1}. **${s.id}** (${s.category}، ${s.language}): المتوقع المسجّل ${s.recordedExpectation}، المرجع ${s.recordedRef}؛ خرج ${s.found || "بلا نتيجة"}، المراجع ${s.refs.join("، ") || "لا شيء"}. ${s.classification}`), "", `حالات فرزت: ${dev.length}. حالات معتمدة دخلت قياس الدقة: صفر.`];
  await writeFile("results/DEV_TRIAGE.md", lines.join("\n"));
  console.log(JSON.stringify({ unreviewedDev: dev.length, triaged: sample.length, acceptedForAccuracy: 0 }));
}
main().catch(() => { console.error("تعذر الفرز الأولي؛ لم تُنشر قائمة بديلة."); process.exitCode = 1; });
