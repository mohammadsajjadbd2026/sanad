import assert from "node:assert/strict";
import test from "node:test";
import { suggestQuestions } from "../lib/llm/question-selector";
import { fieldSearch } from "../lib/field";
import { loadBayyinat } from "../lib/sources/bayyinat";

const questions = [{ id: "b-001", question_ar: "سؤال المصدر" }];
test("retrieval accepts existing IDs only and rejects generated answers or invented references", async () => {
  assert.deepEqual(await suggestQuestions("English question", questions, async () => '{"ids":["b-001"]}'), ["b-001"]);
  assert.equal(await suggestQuestions("query", questions, async () => '{"ids":["b-999"]}'), null);
  assert.equal(await suggestQuestions("query", questions, async () => '{"ids":["b-001"],"answer":"invented"}'), null);
  assert.deepEqual(await suggestQuestions("query", questions, async () => '{"ids":[]}'), []);
  let calls = 0;
  assert.equal(await suggestQuestions("query", questions, async () => { calls++; throw { status: 429 }; }), null);
  assert.equal(calls, 1);
});

test("selected source is verbatim and personal fatwa bypasses Gemini even with consent", async () => {
  const record = (await loadBayyinat()).records[0];
  const result = await fieldSearch("Explain this source", { selectedId: record.id });
  assert.deepEqual(result.match, record);
  const personal = await fieldSearch("هل يجوز لي بيع ميراثي؟", { allowGemini: true });
  assert.equal(personal.match, null);
  assert.deepEqual(personal.suggestions, []);
});
