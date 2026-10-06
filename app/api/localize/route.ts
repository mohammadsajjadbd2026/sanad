import { readFile } from "node:fs/promises";
import { z } from "zod";
import { readJson, RequestError, errorResponse } from "@/lib/http";
import { canonicalCard, cardRequestSchema } from "@/lib/cards";
import { proposeCaption } from "@/lib/llm/caption";
import { runtimeReady } from "@/lib/llm/free-tier";
export async function POST(request: Request) {
  try {
    const body = cardRequestSchema.extend({ audienceId: z.string().max(20), allowGemini: z.literal(true) }).safeParse(await readJson(request));
    if (!body.success) throw new RequestError("اختيارات البطاقة أو الموافقة غير صالحة.");
    if (body.data.language !== "ar" && body.data.language !== "en") throw new RequestError("الوصف المولّد متاح بالعربية والإنجليزية فقط حتى مراجعة الصياغة باللغات الأخرى.");
    if (!runtimeReady()) throw new RequestError("الوصف المولّد غير مفعّل على الموقع حاليًا.", 503);
    const audiences = z.array(z.object({ id: z.string(), name_ar: z.string() })).parse(JSON.parse(await readFile("data/audiences.json", "utf8")));
    const audience = audiences.find(a => a.id === body.data.audienceId && !["a-02", "a-03"].includes(a.id));
    if (!audience) throw new RequestError("ملف الجمهور يحتاج مراجعة أو غير موجود.");
    const card = await canonicalCard(body.data);
    const generated = await proposeCaption(body.data.language, audience.name_ar);
    if (!generated) throw new RequestError("تعذر إنشاء وصف موثوق الآن؛ البطاقة المرجعية ما زالت متاحة.", 503);
    return Response.json({ generated, ref: card.ref, sourceLine: card.reference }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
