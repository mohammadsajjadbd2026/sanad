import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { embeddingInput, type EmbeddingConfig } from "./embedding-config";
import { normalizeVector } from "../embeddings/math";
import { freeClient } from "./free-tier";

export class EmbeddingProviderError extends Error {
  constructor(public readonly status: number | null, public readonly retryable: boolean) {
    super(status === 429 ? "بلغ مشروع Google حد الحصة المجانية (HTTP 429). توقفت الطلبات والمكتمل محفوظ؛ استأنف بعد تجدد الحصة." : `تعذر الاتصال بخدمة البصمات${status ? ` (HTTP ${status})` : ""}. لم يُحفظ أي ناتج غير صالح.`);
    this.name = "EmbeddingProviderError";
  }
}

export function createEmbedder(config: EmbeddingConfig, transport?: Pick<GoogleGenAI["models"], "embedContent">) {
  const models = transport ?? freeClient(config.apiKey, 30_000).models;
  const vectorSchema = z.array(z.number().finite()).length(config.dimensions);
  return async (text: string, mode: "document" | "query" = "document"): Promise<number[]> => {
    const input = embeddingInput(config.model, text, mode);
    let response;
    try {
      // Exactly one text per request: Embedding 2 otherwise aggregates unrelated inputs.
      response = await models.embedContent({ model: config.model, contents: input.contents, config: { ...input.config, outputDimensionality: config.dimensions } });
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : null;
      throw new EmbeddingProviderError(status, status === null || (status >= 500 && status <= 599));
    }
    if (response.embeddings?.length !== 1) throw new EmbeddingProviderError(null, false);
    const item = response.embeddings[0];
    if (item.statistics?.truncated) throw new EmbeddingProviderError(null, false);
    const parsed = vectorSchema.safeParse(item.values);
    if (!parsed.success) throw new EmbeddingProviderError(null, false);
    return normalizeVector(parsed.data, config.dimensions);
  };
}
