import { test } from "node:test";
import assert from "node:assert/strict";
import { proposeCaption } from "../lib/llm/caption";
test("caption model only chooses a reviewed neutral template", async () => {
  const candidate = await proposeCaption("ar", "جمهور محدد", async () => JSON.stringify({ style: "SHARE" }));
  assert.equal(candidate?.text, "شارك النص ومعه مصدره الواضح.");
  assert.equal(candidate?.label, "مولّد");
  let tries = 0;
  const invented = await proposeCaption("en", "audience", async () => { tries++; return JSON.stringify({ style: "FAKE", verse: "invented" }); });
  assert.equal(invented, null); assert.equal(tries, 2);
});
