import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
const styles = ["INVITE", "REFLECT", "SHARE"] as const;
const styleSchema = z.object({ style: z.enum(styles) }).strict();
const captions = {
  ar: { INVITE: "اقرأ هذا النص في سياقه، وتأمّل مصدره قبل مشاركته.", REFLECT: "ابدأ حوارًا هادئًا حول هذا النص، وارجع إلى مرجعه.", SHARE: "شارك النص ومعه مصدره الواضح." },
  en: { INVITE: "Read this sourced passage in context before sharing.", REFLECT: "Start a thoughtful conversation about this passage and check its source.", SHARE: "Share the passage together with its source." },
} as const;
export type CaptionLanguage = keyof typeof captions;
export async function proposeCaption(language: CaptionLanguage, audienceName: string, generate?: (prompt: string) => Promise<string | undefined>) {
  const prompt = `اختر أسلوبًا واحدًا فقط من INVITE أو REFLECT أو SHARE لوصف بطاقة نص موثّق. الجمهور اختاره المستخدم بنفسه: ${audienceName.slice(0, 120)}. لا تُنشئ نصًا دينيًا أو حكمًا أو مرجعًا. أعد JSON فقط.`;
  const fn = generate ?? (async (contents: string) => {
    if (process.env.GEMINI_RUNTIME_ENABLED !== "true" || !process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return undefined;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 20000 } });
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL, contents, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { style: { type: Type.STRING, enum: [...styles] } }, required: ["style"] }, maxOutputTokens: 80, temperature: 0.2 } });
    return response.text;
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try { const raw = await fn(prompt); if (!raw) return null; const parsed = styleSchema.safeParse(JSON.parse(raw)); if (parsed.success) return { text: captions[language][parsed.data.style], label: "مولّد" as const, style: parsed.data.style }; } catch { /* fail closed */ }
  }
  return null;
}
