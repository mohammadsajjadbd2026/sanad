import { readJson, errorResponse, RequestError } from "@/lib/http";
import { canonicalCard, cardRequestSchema } from "@/lib/cards";
export async function POST(request: Request) {
  try { const body = cardRequestSchema.safeParse(await readJson(request)); if (!body.success) throw new RequestError("مرجع غير صالح."); return Response.json({ card: await canonicalCard(body.data) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return errorResponse(error); }
}
