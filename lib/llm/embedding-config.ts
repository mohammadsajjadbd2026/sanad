import { z } from "zod";

const configSchema = z.object({
  apiKey: z.string().trim().min(1),
  model: z.enum(["gemini-embedding-2", "gemini-embedding-001"]),
  dimensions: z.coerce.number().int().refine(n => [768, 1536, 3072].includes(n)),
});
export type EmbeddingConfig = z.infer<typeof configSchema>;

export function readEmbeddingConfig(env: Record<string, string | undefined> = process.env): EmbeddingConfig {
  const parsed = configSchema.safeParse({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_EMBED_MODEL, dimensions: env.GEMINI_EMBED_DIMENSIONS || 768 });
  if (!parsed.success) throw new Error("أكمل GEMINI_API_KEY وGEMINI_EMBED_MODEL في .env.local. الأبعاد المدعومة: 768 أو 1536 أو 3072. لا ترسل المفتاح في المحادثة.");
  return parsed.data;
}

export function embeddingInput(model: EmbeddingConfig["model"], text: string, mode: "document" | "query") {
  if (model === "gemini-embedding-2") return {
    contents: mode === "document" ? `title: none | text: ${text}` : `task: search result | query: ${text}`,
    config: {},
  };
  return { contents: text, config: { taskType: mode === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY" } };
}
