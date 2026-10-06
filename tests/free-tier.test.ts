import assert from "node:assert/strict";
import test from "node:test";
import { requireFreeTier, runtimeReady } from "../lib/llm/free-tier";
import { feedback } from "../lib/llm/feedback";
import { proposeCaption } from "../lib/llm/caption";
import { createEmbedder, EmbeddingProviderError } from "../lib/llm/embeddings";

test("Google access requires a confirmed free project, separately from runtime enablement", () => {
  assert.throws(() => requireFreeTier({}));
  assert.throws(() => requireFreeTier({ GEMINI_FREE_TIER_CONFIRMED: "false" }));
  assert.doesNotThrow(() => requireFreeTier({ GEMINI_FREE_TIER_CONFIRMED: "true" }));
  assert.equal(runtimeReady({ GEMINI_RUNTIME_ENABLED: "true", GEMINI_API_KEY: "fixture", GEMINI_MODEL: "fixture" }), false);
});

test("quota errors stop all adapters without automatic retry or model switching", async () => {
  let calls = 0;
  const quota = async () => { calls++; throw { status: 429 }; };
  assert.equal(await feedback("fixture", "fixture", quota), null);
  assert.equal(calls, 1);
  assert.equal(await proposeCaption("en", "fixture", quota), null);
  assert.equal(calls, 2);
  const embed = createEmbedder({ apiKey: "fixture", model: "gemini-embedding-2", dimensions: 768 }, { embedContent: quota });
  await assert.rejects(() => embed("fixture"), error => error instanceof EmbeddingProviderError && error.status === 429 && !error.retryable);
  assert.equal(calls, 3);
});
