import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldSearch, scoreQuestion } from "../lib/field";
import { loadBayyinat } from "../lib/sources/bayyinat";
test("generic question does not borrow unrelated Bayyinat answer", async () => {
  assert.equal(scoreQuestion("ما هو الإسلام؟", "إن النبي أكره الناس على الدخول في الإسلام"), 0);
  assert.equal((await fieldSearch("ما هو الإسلام؟")).match, null);
});
test("source question retrieves its own verbatim answer and page", async () => {
  const source = (await loadBayyinat()).records[0];
  const result = await fieldSearch(source.question_ar);
  assert.equal(result.match?.id, source.id);
  assert.equal(result.match?.answer_ar, source.answer_ar);
  assert.equal(result.match?.page, source.page);
});
