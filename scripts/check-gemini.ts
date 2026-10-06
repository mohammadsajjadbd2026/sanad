import { loadEnvConfig } from "@next/env";
import { proposeCaption } from "../lib/llm/caption";
import { requireFreeTier, runtimeReady } from "../lib/llm/free-tier";
import { suggestQuestions } from "../lib/llm/question-selector";
import { loadBayyinat } from "../lib/sources/bayyinat";
import { writeFile } from "node:fs/promises";

async function main() {
  loadEnvConfig(process.cwd());
  requireFreeTier();
  if (!runtimeReady()) throw new Error("أكمل إعداد النموذج والمفتاح وتفعيل التكامل المجاني في بيئة الخادم.");
  const result = await proposeCaption("ar", "قارئ عام");
  console.log(JSON.stringify({ model: process.env.GEMINI_MODEL, freeTierConfirmed: true, captionValidated: Boolean(result), note: result ? "نجح اتصال حقيقي وخرج JSON صالح. لا يمثل ذلك قياس دقة دينية." : "لم يكتمل الاتصال أو نفدت الحصة؛ لم يُستخدم بديل مدفوع." }));
  if (!result) process.exitCode = 1;
  if (result && process.argv.includes("--retrieval")) {
    const questions = (await loadBayyinat()).records.map(({ id, question_ar }) => ({ id, question_ar }));
    const probes = [
      { language: "ar", query: "لماذا يصوم المسلمون؟" },
      { language: "en", query: "Why do Muslims fast?" },
      { language: "bn", query: "মুসলমানরা কেন রোজা রাখে?" },
      { language: "ur", query: "مسلمان روزہ کیوں رکھتے ہیں؟" },
    ];
    const results = [];
    for (const probe of probes) {
      const ids = await suggestQuestions(probe.query, questions);
      results.push({ ...probe, ids });
      if (ids === null) { process.exitCode = 1; break; }
    }
    const report = { checkedAt: new Date().toISOString(), model: process.env.GEMINI_MODEL, captionValidated: true, results, note: "فحص اتصال واسترجاع لأمثلة صغيرة، وليس تقييم دقة معتمدًا أو اختبارًا دينيًا." };
    await writeFile("results/gemini-smoke.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  }
}
main().catch(() => { console.error("تعذر فحص Gemini المجاني؛ راجع الإعداد والحصة. لم يُعرض المفتاح."); process.exitCode = 1; });
