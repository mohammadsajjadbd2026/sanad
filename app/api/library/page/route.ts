import { z } from "zod";
import { readJson, RequestError, errorResponse } from "@/lib/http";
import { readKhizana } from "@/lib/library/external";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const input = z.object({ bookId: z.number().int().positive().max(1e9), pageId: z.number().int().nonnegative().max(1e9), external: z.literal(true) }).safeParse(await readJson(request, 1000));
    if (!input.success) throw new RequestError("مرجع الصفحة أو الموافقة غير صالح.");
    return Response.json(await readKhizana(input.data.bookId, input.data.pageId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
