import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
console.log(JSON.stringify({
  keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  embeddingModelConfigured: Boolean(process.env.GEMINI_EMBED_MODEL?.trim()),
  generationModelConfigured: Boolean(process.env.GEMINI_MODEL?.trim()),
}));
