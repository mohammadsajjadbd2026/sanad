import "server-only";
import { createHash } from "node:crypto";
const visitors = new Map<string, { count: number; reset: number }>();
export class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function guard(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new RequestError("طلب من مصدر غير مسموح.", 403);
  const now = Date.now();
  for (const [key, value] of visitors) if (value.reset < now) visitors.delete(key);
  // Best-effort per instance only; use a managed gateway for distributed production limits.
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = createHash("sha256").update(ip).digest("hex");
  const bucket = visitors.get(key) ?? { count: 0, reset: now + 60000 };
  if (++bucket.count > 20 || visitors.size > 10000) throw new RequestError("طلبات كثيرة. انتظر دقيقة وحاول مجددًا.", 429);
  visitors.set(key, bucket);
}
export async function readJson(request: Request, maxBytes = 60000) {
  guard(request);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("نوع الطلب غير مدعوم.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("طلب فارغ.");
  const decoder = new TextDecoder(); let size = 0, body = "";
  try { for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new RequestError("النص أكبر من الحد المسموح.", 413); } body += decoder.decode(part.value, { stream: true }); } body += decoder.decode(); return JSON.parse(body) as unknown; }
  catch (error) { if (error instanceof RequestError) throw error; throw new RequestError("صيغة الطلب غير صحيحة."); }
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof RequestError ? error.message : "تعذرت المعالجة بأمان. حاول لاحقًا؛ لم تُصدر نتيجة تحقق." }, { status: error instanceof RequestError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
