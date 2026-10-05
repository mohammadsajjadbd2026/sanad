import { z } from "zod";
import { loadBayyinat } from "@/lib/sources/bayyinat";
import { readJson, RequestError, errorResponse } from "@/lib/http";
import { verify } from "@/lib/verify";
export async function POST(request: Request) {
  try {
    const body = z.object({ questionId: z.string().regex(/^b-\d+$/), answer: z.string().trim().min(1).max(3000) }).safeParse(await readJson(request));
    if (!body.success) throw new RequestError("أدخل إجابة لا تتجاوز 3000 حرف.");
    const question = (await loadBayyinat()).get(body.data.questionId); if (!question) throw new RequestError("السؤال غير موجود.");
    const verification = await verify(body.data.answer);
    return Response.json({ question, verification, feedback: "قارن إجابتك بجواب المصدر، وراجع الدقة واللطف ووضوح اللغة. هذه ملاحظات إرشادية ثابتة وليست تقييمًا آليًا معتمدًا." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
