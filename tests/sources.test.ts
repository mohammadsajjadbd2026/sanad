import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadHadith, statusFromSourceCategories } from "../lib/sources/hadith";
import { loadQuran } from "../lib/sources/quran";
import { loadBayyinat } from "../lib/sources/bayyinat";
import { loadCorpus, selectSample } from "../lib/embeddings/corpus";

test("المحمّلات تحافظ على النصوص والأحكام حرفيًا وتميّز الترجمة من الآية", async () => {
  const [hadith, quran, bayyinat] = await Promise.all([loadHadith(), loadQuran(), loadBayyinat()]);
  const source = JSON.parse(await readFile("data/hadith/index.json", "utf8"));
  assert.deepEqual(hadith.get(source[0].id), source[0]);
  assert.equal(quran.get("1:1")?.text, quran.arabic["1:1"].uthmani);
  assert.equal(quran.get("1:1", "bn")?.kind, "translation");
  assert.equal(quran.get("1:1", "bn")?.text, quran.translations.bn["1:1"]);
  assert.equal(quran.get("999:999"), undefined);
  const b = bayyinat.records[0]; assert.equal(bayyinat.get(b.id)?.answer_ar, b.answer_ar);
});
test("اختلاف فئات أحكام المصدر يُحفظ دون ترجيح", () => {
  assert.equal(statusFromSourceCategories(["ثابت", "ضعيف"]), "HADITH_MULTIPLE_RULINGS");
  assert.equal(statusFromSourceCategories(["ثابت", "ثابت"]), "HADITH_AUTHENTIC");
  assert.equal(statusFromSourceCategories(["يُهمَل (ليس حكمًا على الحديث)"]), null);
});
test("رفض مصدر معرّفاته مكررة أو حالته لا توافق الأحكام", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "sanad-source-test-"));
  try {
    await mkdir(path.join(directory, "hadith"));
    const { records } = await loadHadith(); const record = records[0];
    await writeFile(path.join(directory, "hadith/index.json"), JSON.stringify([record, record]));
    await assert.rejects(() => loadHadith(directory), /معرّفات مكررة/);
    await writeFile(path.join(directory, "hadith/index.json"), JSON.stringify([{ ...record, derived_status: "HADITH_FABRICATED" }]));
    await assert.rejects(() => loadHadith(directory), /تعارض/);
    await writeFile(path.join(directory, "hadith/index.json"), "not-json");
    await assert.rejects(() => loadHadith(directory), /تعذر قراءة JSON/);
  } finally { await rm(directory, { recursive: true }); }
});
test("كل مستند دلالي يرتبط بمصدر واحد والعينة تغطي أنواع المصادر", async () => {
  const corpus = await loadCorpus();
  assert.equal(corpus.length, 6236 + 54 + 25);
  assert.equal(new Set(corpus.map(d => d.id)).size, corpus.length);
  assert.ok(corpus.every(d => !d.id.startsWith("t-") && d.hash.length === 64));
  const sample = selectSample(corpus, 20);
  assert.equal(sample.length, 20);
  assert.equal(new Set(sample.map(d => d.kind)).size, 3);
  assert.throws(() => selectSample(corpus, 0));
  assert.throws(() => selectSample(corpus, 1.5));
});
