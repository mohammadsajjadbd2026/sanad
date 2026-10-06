import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { verify } from "../lib/verify";
import { labels } from "../lib/verify/types";
const { values } = parseArgs({ options: { split: { type: "string", default: "dev" }, runs: { type: "string", default: "3" }, baseline: { type: "boolean", default: false } }, strict: true });
async function main() {
  const split = z.enum(["dev", "test"]).parse(values.split), runs = z.coerce.number().int().min(1).max(5).parse(values.runs);
  const cases = z.array(z.object({ id: z.string(), split: z.string(), review_status: z.string(), text: z.string(), expected_status: z.enum(Object.keys(labels) as [keyof typeof labels, ...(keyof typeof labels)[]]), expected_ref: z.string(), lang: z.string(), category: z.string(), target_module: z.string() })).parse(JSON.parse(await readFile("data/testset.json", "utf8")));
  const selected = cases.filter(c => c.split === split), approved = selected.filter(c => c.review_status === "مقبول" && c.target_module === "verifier");
  // Baseline intentionally cannot invent religious rulings: requires separate consent/method review.
  if (values.baseline) throw new Error("خط الأساس الخام غير مفعّل: يلزم حالات معتمدة وبروتوكول يمنع توليد أحكام شرعية من النموذج.");
  const outcomes: { id: string; run: number; lang: string; category: string; correct: boolean; statuses: string[]; refs: string[]; expected: string; latencyMs: number; failed: boolean }[] = [];
  for (const item of approved) for (let run = 0; run < runs; run++) {
    const started = performance.now();
    try { const report = await verify(item.text); const correct = report.findings.some(f => f.status === item.expected_status && (!item.expected_ref || f.ref === item.expected_ref)); outcomes.push({ id: item.id, run, lang: item.lang, category: item.category, correct, statuses: report.findings.map(f => f.status), refs: report.findings.map(f => f.ref ?? ""), expected: item.expected_status, latencyMs: performance.now() - started, failed: false }); }
    catch { outcomes.push({ id: item.id, run, lang: item.lang, category: item.category, correct: false, statuses: [], refs: [], expected: item.expected_status, latencyMs: performance.now() - started, failed: true }); }
  }
  const grouped = (key: "lang" | "category") => Object.fromEntries([...new Set(outcomes.map(o => o[key]))].map(value => { const rows = outcomes.filter(o => o[key] === value); return [value, { n: rows.length, accuracy: rows.filter(o => o.correct).length / rows.length }]; }));
  const abstention = new Set(["NOT_FOUND", "OUT_OF_SCOPE", "REFER_TO_SCHOLAR"]);
  const predicted = outcomes.filter(o => o.statuses.some(s => abstention.has(s))), expected = outcomes.filter(o => abstention.has(o.expected));
  const tp = predicted.filter(o => abstention.has(o.expected)).length;
  const consistency = approved.length ? approved.filter(c => new Set(outcomes.filter(o => o.id === c.id).map(o => JSON.stringify([o.statuses, o.refs]))).size === 1).length / approved.length : null;
  const result = { split, runs, selected: selected.length, approved: approved.length, skipped: selected.length - approved.length, baseline: values.baseline, accuracy: outcomes.length ? outcomes.filter(o => o.correct).length / outcomes.length : null, perLanguage: grouped("lang"), perCategory: grouped("category"), abstentionPrecision: predicted.length ? tp / predicted.length : null, abstentionRecall: expected.length ? tp / expected.length : null, consistency, latencyMs: outcomes.length ? outcomes.reduce((sum, o) => sum + o.latencyMs, 0) / outcomes.length : null, failures: outcomes.filter(o => o.failed).length, worst: outcomes.filter(o => !o.correct).slice(0, 10), outcomes };
  await mkdir("results", { recursive: true });
  await writeFile(`results/eval-${split}${values.baseline ? "-baseline" : ""}.json`, JSON.stringify(result, null, 2));
  await writeFile(`results/REPORT-${split}.md`, `# تقرير القياس — سَنَد\n\nالتقسيم: ${split}، مرات التشغيل المطلوبة: ${runs}.\n\nحالات التقسيم: ${selected.length}، المعتمد للمدقّق: ${approved.length}، المتجاوز: ${result.skipped}.\n\n${approved.length ? `الدقة: ${result.accuracy}. التفاصيل في ملف JSON المصاحب.` : "لا يمكن حساب الدقة أو أسوأ عشرة إخفاقات: لا توجد حالات معتمدة. لا تُعد الحالات غير المراجعة صحيحة تلقائيًا. هذا قيد بيانات واعتماد بشري، وليس نجاحًا بنسبة 100%."}\n\nاختبارات البرمجيات مستقلة ولا تمثل تقييمًا شرعيًا. خط الأساس التوليدي غير مفعّل.\n`);
  console.log(JSON.stringify({ ...result, outcomes: undefined }));
}
main().catch(() => { console.error("تعذر القياس: راجع بنية البيانات والخيارات. لم تُنشر نتائج بديلة."); process.exitCode = 1; });
