import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { loadCorpus, selectSample } from "../lib/embeddings/corpus";
import { buildEmbeddingIndex } from "../lib/embeddings/build";
import { readEmbeddingConfig } from "../lib/llm/embedding-config";
import { createEmbedder } from "../lib/llm/embeddings";

async function main() {
  loadEnvConfig(process.cwd());
  const { values } = parseArgs({ options: { sample: { type: "string" }, plan: { type: "boolean", default: false }, "batch-size": { type: "string", default: "5" }, "delay-ms": { type: "string", default: "1000" } }, strict: true });
  const corpus = await loadCorpus();
  const sampleSize = values.sample === undefined ? null : Number(values.sample);
  const selected = sampleSize === null ? corpus : selectSample(corpus, sampleSize);
  const counts = Object.fromEntries(["quran", "hadith", "bayyinat"].map(kind => [kind, selected.filter(d => d.kind === kind).length]));
  console.log(JSON.stringify({ mode: values.plan ? "plan-no-api-calls" : sampleSize === null ? "full" : "sample", documents: corpus.length, selected: selected.length, counts, characters: selected.reduce((sum, d) => sum + d.text.length, 0) }));
  if (values.plan) return;
  const config = readEmbeddingConfig();
  const result = await buildEmbeddingIndex(corpus, {
    outputRoot: path.join(process.cwd(), "data/embeddings"), model: config.model, dimensions: config.dimensions,
    ...(sampleSize === null ? {} : { selectedIds: selected.map(d => d.id) }),
    batchSize: Number(values["batch-size"]), delayMs: Number(values["delay-ms"]), embed: createEmbedder(config),
    onProgress: (done, target) => { if (done === 0 || done % 5 === 0 || done === target) console.log(`embeddings ${done}/${target}`); },
    onRetry: attempt => console.log(`إعادة محاولة مؤقتة ${attempt}/3؛ آخر بصمات مكتملة محفوظة.`),
  });
  await mkdir("results", { recursive: true });
  const report = { ...result, mode: sampleSize === null ? "full" : "sample", counts, selectedIds: selected.map(d => d.id), note: "فحص فهرسة المصادر، وليس قياس دقة المدقّق. النصوص المرجعية لم تعدّل." };
  await writeFile(path.join("results", sampleSize === null ? "embeddings-full.json" : "embeddings-sample.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(result));
}

main().catch(error => {
  // Provider messages are sanitized by the adapter; never print arbitrary exception dumps.
  const message = error instanceof Error && !/AIza|api[_-]?key[=:]/i.test(error.message) ? error.message : "تعذر بناء الفهرس. تحقّق من الإعدادات والاتصال.";
  console.error(message);
  process.exitCode = 1;
});
