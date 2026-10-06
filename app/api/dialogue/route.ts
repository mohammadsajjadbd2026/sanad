import { z } from "zod";
import { loadBayyinat } from "@/lib/sources/bayyinat";
import { readJson, RequestError, errorResponse } from "@/lib/http";
import { verify } from "@/lib/verify";
import { feedback } from "@/lib/llm/feedback";
import { readFile } from "node:fs/promises";
export async function POST(request: Request) {
  try {
    const body = z.object({ questionId: z.string().regex(/^b-\d+$/), answer: z.string().trim().min(1).max(3000), allowGemini: z.boolean().default(false), audienceId: z.string().max(20).optional(), tone: z.enum(["هادئ", "موجز", "تعليمي"]).default("هادئ") }).safeParse(await readJson(request));
    if (!body.success) throw new RequestError("أدخل إجابة لا تتجاوز 3000 حرف.");
    const question = (await loadBayyinat()).get(body.data.questionId); if (!question) throw new RequestError("السؤال غير موجود.");
    const verification = await verify(body.data.answer);
    let audienceName = "عام";
    if (body.data.audienceId) {
      const audiences = z.array(z.object({ id: z.string(), name_ar: z.string() })).parse(JSON.parse(await readFile("data/audiences.json", "utf8")));
      const audience = audiences.find(a => a.id === body.data.audienceId && !["a-02", "a-03"].includes(a.id));
      if (!audience) throw new RequestError("اختر جمهورًا متاحًا.");
      audienceName = audience.name_ar;
    }
    const generated = body.data.allowGemini ? await feedback(body.data.answer, question.answer_ar, undefined, { audience: audienceName, tone: body.data.tone }) : null;
    return Response.json({ question, verification, generated, feedback: generated ? "الدرجات والملاحظة التالية مولّدة؛ راجعها مع جواب المصدر." : "قارن إجابتك بجواب المصدر، وراجع الدقة واللطف ووضوح اللغة. التقييم الآلي غير متاح الآن." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
