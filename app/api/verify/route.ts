import { z } from "zod";
import { readJson, RequestError, errorResponse } from "@/lib/http";
import { verify } from "@/lib/verify";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = z.object({ text: z.string().trim().min(1).max(12000) }).safeParse(await readJson(request));
    if (!body.success) throw new RequestError("أدخل نصًا لا يتجاوز 12000 حرف.");
    return Response.json(await verify(body.data.text), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
