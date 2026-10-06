import assert from "node:assert/strict";
import test from "node:test";
import { parseTranslationLines, loadAlternativeTranslations } from "../lib/sources/quran-alternatives";
import { loadQuran } from "../lib/sources/quran";
import { verify } from "../lib/verify";

test("alternative edition parser preserves wording and rejects missing or duplicate references", () => {
  assert.equal(parseTranslationLines("# Attribution\n1|1| exact text \n", ["1:1"])["1:1"], " exact text ");
  assert.throws(() => parseTranslationLines("1|1|one\n1|1|two", ["1:1"]));
  assert.throws(() => parseTranslationLines("1|1|one", ["1:1", "1:2"]));
});

test("both existing alternate editions verify with their own translator attribution", async () => {
  const quran = await loadQuran();
  const editions = await loadAlternativeTranslations(Object.keys(quran.arabic));
  for (const edition of editions) {
    assert.equal(Object.keys(edition.texts).length, 6236);
    const report = await verify(edition.texts["3:19"]);
    const result = report.findings.find(f => f.ref === "3:19");
    assert.equal(result?.status, "QURAN_VERIFIED");
    assert.equal(result?.attribution, edition.attribution);
    assert.equal(result?.translation, edition.texts["3:19"]);
  }
});
