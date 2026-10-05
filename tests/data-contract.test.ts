import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

function read<T>(file: string): T { return JSON.parse(readFileSync(join(process.cwd(), "data", file), "utf8")) as T; }
type Hadith = { id: string; text_ar: string; url: string; derived_status: string; rulings: { ruling_text: string; category: string }[] };
type TestCase = { id: string; split: string; lang: string; expected_status: string; expected_ref: string; review_status: string };

test("كل حديث له نص ومصدر وحالة مشتقة متوافقة مع تصنيفات المصدر", () => {
  const hadith = read<Hadith[]>("hadith/index.json");
  assert.ok(hadith.length > 0);
  assert.equal(new Set(hadith.map(h => h.id)).size, hadith.length);
  const statuses: Record<string, string> = { "ثابت": "HADITH_AUTHENTIC", "ضعيف": "HADITH_WEAK", "موضوع أو لا أصل له": "HADITH_FABRICATED" };
  for (const h of hadith) {
    assert.ok(h.text_ar.trim(), h.id);
    assert.ok(["http:", "https:"].includes(new URL(h.url).protocol), h.id);
    assert.ok(h.rulings.length > 0, h.id);
    for (const r of h.rulings) assert.ok(r.ruling_text.trim(), h.id);
    const categories = [...new Set(h.rulings.map(r => r.category).filter(c => c !== "يُهمَل (ليس حكمًا على الحديث)"))];
    assert.ok(categories.length > 0, h.id);
    assert.ok(categories.every(c => Object.hasOwn(statuses, c)), h.id);
    assert.equal(h.derived_status, categories.length > 1 ? "HADITH_MULTIPLE_RULINGS" : statuses[categories[0]], h.id);
  }
});

test("مراجع الاختبار موجودة ومتوافقة والتقسيم واللغات صالحة", () => {
  const cases = read<TestCase[]>("testset.json");
  const hadith = new Map(read<Hadith[]>("hadith/index.json").map(h => [h.id, h]));
  const quran = read<Record<string, unknown>>("quran/ar.json");
  assert.ok(cases.length > 0);
  assert.equal(new Set(cases.map(t => t.id)).size, cases.length);
  for (const t of cases) {
    assert.ok(["dev", "test"].includes(t.split), t.id);
    assert.ok(["ar", "en", "bn", "ur"].includes(t.lang), t.id);
    if (t.expected_status.startsWith("HADITH")) assert.equal(hadith.get(t.expected_ref)?.derived_status, t.expected_status, t.id);
    if (t.expected_status.startsWith("QURAN")) assert.ok(Object.hasOwn(quran, t.expected_ref), t.id);
  }
});

test("القرآن والترجمات مكتملة وتشترك في جميع المفاتيح", () => {
  const quran = read<Record<string, { uthmani: string; clean: string }>>("quran/ar.json");
  const keys = Object.keys(quran).sort();
  assert.equal(keys.length, 6236);
  for (const verse of Object.values(quran)) { assert.ok(verse.uthmani.trim()); assert.ok(verse.clean.trim()); }
  for (const language of ["en", "bn", "ur"]) {
    const translation = read<Record<string, string>>(`quran/${language}.json`);
    assert.deepEqual(Object.keys(translation).sort(), keys);
    assert.ok(Object.values(translation).every(text => text.trim().length > 0));
  }
});
