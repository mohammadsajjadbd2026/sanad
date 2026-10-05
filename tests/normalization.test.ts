import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeForComparison, normalizeForSearch } from "../lib/verify/normalize";

test("التطبيع للبحث يعالج التشكيل والتطويل والهمزات وأشكال الأحرف", () => {
  assert.equal(normalizeForSearch("  إِسْــلَامٌ، أَمَانَةٌ!  "), "اسلام امانة");
  assert.equal(normalizeForSearch("ٱلْهُدَى کِتاب یَد"), "الهدي كتاب يد");
  assert.equal(normalizeForSearch("ﻻ"), "لا");
});
test("المطابقة المحافظة لا تطمس فروق الأحرف الحساسة", () => {
  assert.notEqual(normalizeForComparison("إلى"), normalizeForComparison("إلي"));
  assert.notEqual(normalizeForComparison("سأل"), normalizeForComparison("سال"));
  assert.notEqual(normalizeForSearch("رحمة"), normalizeForSearch("رحمه"));
});
test("التطبيع لا يحذف حركات البنغالية ولا يغيّر أصل النص", () => {
  const source = "বাংলা ভাষা";
  assert.equal(normalizeForSearch(source), source);
  assert.equal(normalizeForSearch("English   TEXT"), "english text");
  assert.equal(normalizeForSearch("\u200fأمانة\u200e"), "امانة");
  assert.equal(normalizeForSearch(""), "");
});
test("تكرار تطبيع البحث يعطي النتيجة نفسها", () => {
  for (const input of ["أَلِف، يَاء!", "বাংলা", "اردو", "English TEXT", "ﻻ"]) {
    assert.equal(normalizeForSearch(normalizeForSearch(input)), normalizeForSearch(input));
  }
});
