import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildEmbeddingIndex, corpusProfile, readCompletedIndex, retryEmbedding } from "../lib/embeddings/build";
import { makeDocument } from "../lib/embeddings/corpus";
import { cosineSimilarity, normalizeVector } from "../lib/embeddings/math";
import { rankCandidates } from "../lib/embeddings/search";
import { embeddingInput, readEmbeddingConfig } from "../lib/llm/embedding-config";
import { createEmbedder, EmbeddingProviderError } from "../lib/llm/embeddings";

const documents = [makeDocument("hadith", "fixture-one", "fixture document one"), makeDocument("hadith", "fixture-two", "fixture document two")];
const fixtureConfig = { apiKey: "test-only-no-real-key", model: "gemini-embedding-2" as const, dimensions: 768 };

test("التحقق من إعدادات المفتاح لا يسربه في رسائل الخطأ", () => {
  assert.throws(() => readEmbeddingConfig({ GEMINI_API_KEY: "sensitive-test-value", GEMINI_EMBED_MODEL: "invalid" }), error => error instanceof Error && !error.message.includes("sensitive-test-value"));
  assert.throws(() => readEmbeddingConfig({}), /أكمل/);
});
test("إعداد نموذج Embedding 2 يرسل نصًا واحدًا وتعليمات الاسترجاع الصحيحة", () => {
  assert.deepEqual(embeddingInput("gemini-embedding-2", "input", "query"), { contents: "task: search result | query: input", config: {} });
  assert.deepEqual(embeddingInput("gemini-embedding-001", "input", "document"), { contents: "input", config: { taskType: "RETRIEVAL_DOCUMENT" } });
});
test("رياضيات التشابه ترفض الأبعاد المختلفة والصفر وNaN", () => {
  assert.equal(cosineSimilarity([2, 0], [5, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  assert.throws(() => normalizeVector([0, 0], 2));
  assert.throws(() => normalizeVector([NaN], 1));
  assert.throws(() => cosineSimilarity([1], [1, 2]));
});
test("استجابة API ناقصة أو مبتورة تُرفض ولا يصبح خطأ المزود سجل أسرار", async () => {
  const embed = createEmbedder(fixtureConfig, { embedContent: async () => ({ embeddings: [{ values: [1, 0] }] }) });
  await assert.rejects(() => embed("fixture"), EmbeddingProviderError);
  const truncated = createEmbedder(fixtureConfig, { embedContent: async () => ({ embeddings: [{ values: Array(768).fill(1), statistics: { truncated: true } }] }) });
  await assert.rejects(() => truncated("fixture"), EmbeddingProviderError);
  const denied = createEmbedder(fixtureConfig, { embedContent: async () => { throw { status: 403, message: "sensitive-test-value" }; } });
  await assert.rejects(() => denied("fixture"), error => error instanceof EmbeddingProviderError && error.status === 403 && !error.retryable && !error.message.includes("sensitive-test-value"));
});
test("أخطاء الخادم المؤقتة تعاد 3 مرات كحد أقصى وأخطاء الاعتماد لا تعاد", async () => {
  let calls = 0; const delays: number[] = [];
  await assert.rejects(() => retryEmbedding(async () => { calls++; throw new EmbeddingProviderError(503, true); }, async ms => { delays.push(ms); }));
  assert.equal(calls, 4); assert.deepEqual(delays, [2000, 4000, 8000]);
  calls = 0;
  await assert.rejects(() => retryEmbedding(async () => { calls++; throw new EmbeddingProviderError(403, false); }, async () => undefined));
  assert.equal(calls, 1);
});
test("العينة تُستأنف في التشغيل الكامل ولا تنشّط فهرسًا جزئيًا", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "sanad-embedding-test-"));
  try {
    let calls = 0;
    const options = { outputRoot: directory, model: "fixture-model", dimensions: 2, delayMs: 0, embed: async () => { calls++; return [3, 4]; } };
    const sample = await buildEmbeddingIndex(documents, { ...options, selectedIds: [documents[1].id] });
    assert.equal(sample.created, 1); assert.equal(sample.complete, false);
    await assert.rejects(() => readCompletedIndex(directory, documents, "fixture-model", 2));
    const full = await buildEmbeddingIndex(documents, options);
    assert.equal(full.created, 1); assert.equal(full.reused, 1); assert.equal(calls, 2);
    const entries = await readCompletedIndex(directory, documents, "fixture-model", 2);
    assert.deepEqual(entries.map(e => e.id), documents.map(d => d.id));
    const again = await buildEmbeddingIndex(documents, options);
    assert.equal(again.created, 0); assert.equal(calls, 2);
    assert.notEqual(corpusProfile(documents, "different-model", 2), full.profile);
    const changed = [makeDocument("hadith", "fixture-one", "updated fixture"), documents[1]];
    await assert.rejects(() => readCompletedIndex(directory, changed, "fixture-model", 2));
  } finally { await rm(directory, { recursive: true }); }
});
test("الانقطاع يحفظ العناصر المكتملة ويستأنف الباقي فقط", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "sanad-resume-test-"));
  try {
    let calls = 0;
    const options = { outputRoot: directory, model: "fixture", dimensions: 2, delayMs: 0 };
    await assert.rejects(() => buildEmbeddingIndex(documents, { ...options, embed: async () => { if (++calls === 2) throw new EmbeddingProviderError(403, false); return [1, 0]; } }));
    const resumed = await buildEmbeddingIndex(documents, { ...options, embed: async () => [0, 1] });
    assert.equal(resumed.reused, 1); assert.equal(resumed.created, 1);
    const entries = await readCompletedIndex(directory, documents, "fixture", 2);
    const ranked = rankCandidates([0, 1], documents, entries);
    assert.equal(ranked[0].id, documents[1].id);
    assert.ok(!("status" in ranked[0]));
    const file = path.join(directory, resumed.profile, "shard-00000.json");
    const corrupt = JSON.parse(await readFile(file, "utf8")); corrupt.entries[0].sourceHash = "wrong";
    await writeFile(file, JSON.stringify(corrupt));
    await assert.rejects(() => readCompletedIndex(directory, documents, "fixture", 2));
    await assert.rejects(() => buildEmbeddingIndex(documents, { ...options, embed: async () => [1, 0] }));
  } finally { await rm(directory, { recursive: true }); }
});
