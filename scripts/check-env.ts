import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
console.log(JSON.stringify({
  keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  embeddingModelConfigured: Boolean(process.env.GEMINI_EMBED_MODEL?.trim()),
  generationModelConfigured: Boolean(process.env.GEMINI_MODEL?.trim()),
  freeTierConfirmed: process.env.GEMINI_FREE_TIER_CONFIRMED === "true",
  runtimeEnabled: process.env.GEMINI_RUNTIME_ENABLED === "true",
}));
