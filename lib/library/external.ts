import "server-only";
import { z } from "zod";
import { normalizeForSearch } from "../verify/normalize";
import type { LibraryGroup } from "./types";

const KHIZANA = "https://mcp.khizanat-almaarif.com/mcp";
// Public key published in the official IslamHouse v3 documentation examples.
const PUBLIC_ISLAMHOUSE_KEY = "paV29H2gm56kvLPy";
const shortText = z.string().max(100000);
export async function boundedJson(response: Response): Promise<unknown> {
  if (!response.ok) { await response.body?.cancel(); throw new Error("Provider unavailable"); }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty provider response");
  let size = 0, text = ""; const decoder = new TextDecoder();
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 2_000_000) throw new Error("Provider response too large");
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    if (response.headers.get("content-type")?.includes("text/event-stream")) {
      for (const event of text.split(/\r?\n\r?\n/)) {
        const data = event.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
        if (data) { const value = JSON.parse(data); if (value.id != null) return value; }
      }
      throw new Error("Missing RPC response");
    }
    return JSON.parse(text);
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
const envelope = z.object({ result: z.unknown().optional(), error: z.unknown().optional() });
const toolResult = z.object({ isError: z.boolean().optional(), content: z.array(z.object({ type: z.string(), text: shortText.optional() })).max(30) });
// Fixed read-only tools. Remote instructions never control routing or gain write access.
async function khizanaCall(name: "search_text" | "read_pages", args: Record<string, unknown>) {
  if (process.env.KHIZANA_ENABLED === "false") throw new Error("Disabled");
  const signal = AbortSignal.timeout(15000);
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  async function rpc(method: string, params: unknown, id?: number) {
    const response = await fetch(KHIZANA, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", ...(id ? { id } : {}), method, params }), signal, redirect: "error", cache: "no-store" });
    const session = response.headers.get("mcp-session-id"); if (session) headers["Mcp-Session-Id"] = session;
    if (!id) { if (!response.ok) throw new Error("MCP notification failed"); await response.body?.cancel(); return undefined; }
    const value = envelope.parse(await boundedJson(response)); if (value.error) throw new Error("MCP error"); return value.result;
  }
  const init = z.object({ protocolVersion: z.string() }).parse(await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "sanad-library", version: "1.0" } }, 1));
  headers["MCP-Protocol-Version"] = init.protocolVersion;
  await rpc("notifications/initialized", {});
  const result = toolResult.parse(await rpc("tools/call", { name, arguments: args }, 2));
  if (result.isError) throw new Error("MCP tool failed");
  const content = result.content.find(c => c.type === "text" && c.text)?.text;
  if (!content) throw new Error("Missing content");
  return JSON.parse(content) as unknown;
}
export const khizanaSearchSchema = z.object({
  results: z.array(z.object({ book_id: z.number().int().positive(), page_id: z.number().int().nonnegative(), book: shortText, author: shortText, location: shortText, snippet: shortText })).max(100),
  widened: z.unknown().optional(), "تنبيه_التحديث": z.string().optional(),
});
export async function searchKhizana(query: string): Promise<LibraryGroup> {
  const data = khizanaSearchSchema.parse(await khizanaCall("search_text", { query, mode: "phrase", limit: 8 }));
  return { provider: "khizana", note: "مقتطفات بحث حرفي خارجية؛ افتح السياق قبل النقل. الترقيم كما أعاده المصدر، وقد لا يطابق المطبوع." + (data.widened ? " وسّع المصدر البحث؛ راجع صلة النتائج." : "") + (data["تنبيه_التحديث"] ? ` ${data["تنبيه_التحديث"]}` : ""), items: data.results.map(r => ({ id: `khizana:${r.book_id}:${r.page_id}`, provider: "khizana", title: r.book, text: r.snippet, citation: `${r.author} · ${r.location}`, language: "ar", bookId: r.book_id, pageId: r.page_id })) };
}
export const khizanaPageSchema = z.object({ book_id: z.number().int(), book: shortText, author: shortText, pages: z.array(z.object({ page_id: z.number().int(), location: shortText, text: shortText, footnotes: shortText.nullish() })).max(20), "تنبيه_التحديث": z.string().optional() });
export async function readKhizana(bookId: number, pageId: number) {
  return khizanaPageSchema.parse(await khizanaCall("read_pages", { book_id: bookId, page_id: pageId, count: 1, max_chars: 12000 }));
}
export const islamhouseSchema = z.object({
  data: z.array(z.object({ id: z.number().int().positive(), title: shortText, type: z.string().regex(/^[a-z_]+$/), description: shortText.nullish(), source_language: z.string(), prepared_by: z.array(z.object({ title: shortText, kind: z.string().optional() })).default([]) })).max(50),
  links: z.object({ current_page: z.number().int().positive(), pages_number: z.number().int().nonnegative() }),
});
export function mapIslamhouse(raw: unknown, query: string, language: string): LibraryGroup {
  const data = islamhouseSchema.parse(raw); const key = normalizeForSearch(query);
  return { provider: "islamhouse", note: `IslamHouse.com · تصفية عناوين وأوصاف الصفحة ${data.links.current_page} من ${data.links.pages_number} فقط (حتى 50 مادة)، وليست بحثًا في كامل الكتب. امسح عبارة البحث لتصفّح الصفحة كاملة.`, nextPage: data.links.current_page < data.links.pages_number ? data.links.current_page + 1 : undefined,
    items: data.data.filter(r => !key || normalizeForSearch(`${r.title} ${r.description ?? ""}`).includes(key)).map(r => ({ id: `islamhouse:${r.id}`, provider: "islamhouse", title: r.title, text: r.description ?? "", language: r.source_language, citation: `IslamHouse.com · ${r.prepared_by.map(p => `${p.title}${p.kind ? ` (${p.kind})` : ""}`).join(" · ") || "بيانات المؤلف في المصدر"}`, url: `https://islamhouse.com/${language}/${r.type}/${r.id}/` })) };
}
export async function searchIslamhouse(query: string, language: string, page: number, type: string): Promise<LibraryGroup> {
  if (process.env.ISLAMHOUSE_ENABLED === "false") throw new Error("Disabled");
  const key = process.env.ISLAMHOUSE_API_KEY || PUBLIC_ISLAMHOUSE_KEY;
  const response = await fetch(`https://api3.islamhouse.com/v3/${encodeURIComponent(key)}/main/${type}/${language}/${language}/${page}/50/json`, { signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store" });
  return mapIslamhouse(await boundedJson(response), query, language);
}
