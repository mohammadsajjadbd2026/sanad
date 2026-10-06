import { z } from "zod";
import { fieldSearch } from "@/lib/field";
import { readJson, RequestError, errorResponse } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const body = z.object({ question: z.string().trim().min(3).max(500), allowGemini: z.boolean().default(false), selectedId: z.string().regex(/^b-\d+$/).optional() }).safeParse(await readJson(request));
    if (!body.success) throw new RequestError("اكتب سؤالًا بين 3 و500 حرف.");
    return Response.json(await fieldSearch(body.data.question, body.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
