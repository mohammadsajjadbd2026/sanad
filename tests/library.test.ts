import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedJson, mapIslamhouse, khizanaSearchSchema, khizanaPageSchema } from "../lib/library/external";
import { libraryRequest, searchLibrary } from "../lib/library/search";
import { reportDraft, reportIssueUrl } from "../lib/error-report";
test("library validates query length, pagination and provider parameters", () => {
  assert.equal(libraryRequest.parse({ query: "رحمة" }).external, false);
  for (const input of [{ query: "x".repeat(201) }, { query: "", page: -1 }, { query: "", type: "../../" }, { query: "", language: "xx" }]) assert.equal(libraryRequest.safeParse(input).success, false);
});
test("IslamHouse filtering keeps exact source wording and attribution, with explicit page scope", () => {
  const raw = { data: [{ id: 42, title: "الرحمة", type: "books", source_language: "ar", description: "نصّ المصدر كما هو.", prepared_by: [{ title: "المؤلف", kind: "author" }] }], links: { current_page: 1, pages_number: 3 } };
  const result = mapIslamhouse(raw, "الرَّحمة", "ar");
  assert.equal(result.items[0].text, raw.data[0].description);
  assert.match(result.items[0].citation, /المؤلف/);
  assert.equal(result.items[0].url, "https://islamhouse.com/ar/books/42/");
  assert.equal(result.nextPage, 2); assert.match(result.note, /فقط/);
  assert.equal(mapIslamhouse(raw, "غير موجود", "ar").items.length, 0);
  assert.throws(() => mapIslamhouse({ data: [{ ...raw.data[0], type: "javascript:" }], links: raw.links }, "", "ar"));
});
test("MCP schemas reject missing citations and keep body and footnotes distinct", () => {
  assert.equal(khizanaSearchSchema.safeParse({ results: [{ snippet: "نص" }] }).success, false);
  const page = khizanaPageSchema.parse({ book_id: 1, book: "كتاب", author: "مؤلف", pages: [{ page_id: 1, location: "ص1", text: "متن", footnotes: "حاشية" }] });
  assert.equal(page.pages[0].text, "متن"); assert.equal(page.pages[0].footnotes, "حاشية");
});
test("bounded provider reader supports JSON and SSE and rejects oversized/error responses", async () => {
  assert.deepEqual(await boundedJson(new Response('{"id":1}')), { id: 1 });
  assert.deepEqual(await boundedJson(new Response('event: message\ndata: {"id":2,"result":{}}\n\n', { headers: { "content-type": "text/event-stream" } })), { id: 2, result: {} });
  await assert.rejects(boundedJson(new Response("x", { status: 429 })));
  await assert.rejects(boundedJson(new Response("x".repeat(2_000_001))));
});
test("no external provider is contacted without explicit consent", async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("unexpected network"); };
  try { const result = await searchLibrary(libraryRequest.parse({ query: "" })); assert.equal(calls, 0); assert.equal(result.groups[0].provider, "local"); }
  finally { globalThis.fetch = original; }
});
test("provider failures are not reported as successful empty searches", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("private upstream detail"); };
  try { const result = await searchLibrary(libraryRequest.parse({ query: "", external: true, onlyIslamhouse: true })); assert.ok(result.groups[0].error); assert.ok(!JSON.stringify(result).includes("private upstream")); }
  finally { globalThis.fetch = original; }
});
test("error report creates a draft only and encodes user text as data", () => {
  const draft = reportDraft("خطأ & # عنوان", "h-001", "/library");
  const url = new URL(reportIssueUrl(draft));
  assert.equal(url.origin, "https://github.com"); assert.equal(url.searchParams.get("body"), draft);
  assert.ok(!draft.includes("undefined"));
});
