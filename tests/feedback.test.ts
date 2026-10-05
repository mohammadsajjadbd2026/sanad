import { test } from "node:test";
import assert from "node:assert/strict";
import { feedback } from "../lib/llm/feedback";
test("feedback validates JSON and retries once before fail closed", async () => {
  let calls = 0;
  const value = await feedback("تجربة", "جواب المصدر", async () => { calls++; return calls === 1 ? "not-json" : JSON.stringify({ clarity: 4, courtesy: 5, sourceCare: 3, tipCode: "CITE" }); });
  assert.equal(calls, 2); assert.equal(value?.label, "مولّد"); assert.equal(value?.clarity, 4);
  calls = 0;
  const invalid = await feedback("تجربة", "جواب المصدر", async () => { calls++; return JSON.stringify({ clarity: 6, courtesy: 5, sourceCare: 5, tipCode: "CITE" }); });
  assert.equal(calls, 2); assert.equal(invalid, null);
});
