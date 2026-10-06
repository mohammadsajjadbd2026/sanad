import "server-only";
import { GoogleGenAI } from "@google/genai";

/** This records the owner's confirmation, not a billing lookup.
 * Zero billing is enforced by using a Google project WITHOUT billing enabled.
 */
export function requireFreeTier(env: Record<string, string | undefined> = process.env) {
  if (env.GEMINI_FREE_TIER_CONFIRMED !== "true") {
    throw new Error("استخدام Google متوقف: يلزم تأكيد أن مشروع المفتاح Free tier وغير مرتبط بالفوترة.");
  }
}

export function runtimeReady(env: Record<string, string | undefined> = process.env) {
  return env.GEMINI_FREE_TIER_CONFIRMED === "true" && env.GEMINI_RUNTIME_ENABLED === "true"
    && Boolean(env.GEMINI_API_KEY?.trim()) && Boolean(env.GEMINI_MODEL?.trim());
}

export function freeClient(apiKey: string, timeout = 20_000) {
  requireFreeTier();
  // A quota error stops the request. Never switch keys, projects, or models.
  return new GoogleGenAI({ apiKey, httpOptions: { timeout, retryOptions: { attempts: 1 } } });
}
