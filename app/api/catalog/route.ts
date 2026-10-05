import { z } from "zod";
import { readJson, errorResponse, RequestError } from "@/lib/http";
import { catalog } from "@/lib/cards";
export async function POST(request: Request) {
  try { const body = z.object({ query: z.string().trim().min(2).max(120) }).safeParse(await readJson(request)); if (!body.success) throw new RequestError("أدخل كلمة بحث صالحة بحد أقصى 120 حرفًا."); return Response.json({ items: await catalog(body.data.query) }); } catch (error) { return errorResponse(error); }
}
