import { test } from "node:test";
import assert from "node:assert/strict";
import { verify } from "../lib/verify";
import { getCandidates } from "../lib/verify/retrieve";
import { decide } from "../lib/verify/decide";
import { readJson, RequestError } from "../lib/http";

test("all source hadith statuses are deterministic and preserve ruling text", async () => {
  const rows = (await getCandidates()).filter(r => r.kind === "hadith" && r.language === "ar");
  const seen = new Set<string>();
  for (const row of rows) { const finding = decide(row, row.text, true); assert.equal(finding.status, row.hadith!.derived_status); assert.deepEqual(finding.rulings, row.hadith!.rulings); seen.add(finding.status); }
  for (const status of ["HADITH_AUTHENTIC", "HADITH_WEAK", "HADITH_FABRICATED", "HADITH_MULTIPLE_RULINGS"]) assert.ok(seen.has(status));
});
test("Quran direct source and registered translations verify without model", async () => {
  const rows = (await getCandidates()).filter(r => r.kind === "quran" && r.ref === "112:1");
  for (const row of rows) { const report = await verify(row.text); assert.equal(report.findings[0].status, "QURAN_VERIFIED"); assert.equal(report.findings[0].ref, "112:1"); assert.equal(report.findings[0].sourceText, row.arabic); }
});
test("near Quran is never marked verified and near hadith never inherits ruling", async () => {
  const rows = await getCandidates();
  const q = rows.find(r => r.kind === "quran")!, h = rows.find(r => r.kind === "hadith")!;
  assert.equal(decide(q, "test input", false).status, "QURAN_WORDING_DIFFERS");
  assert.equal(decide(h, "test input", false).status, "NOT_FOUND");
});
test("unknown, personal fatwa, out of scope and invalid input fail safely", async () => {
  assert.equal((await verify("عبارة تجريبية لا تنسب إلى الوحي" )).findings[0].status, "NOT_FOUND");
  assert.equal((await verify("هل يجوز لي أخذ هذا المال؟")).findings[0].status, "REFER_TO_SCHOLAR");
  assert.equal((await verify("123456789")).findings[0].status, "OUT_OF_SCOPE");
  await assert.rejects(verify("")); await assert.rejects(verify("a".repeat(12001)));
});
test("quoted scripture is isolated from surrounding prose", async () => {
  const q = (await getCandidates()).find(r => r.kind === "quran" && r.ref === "112:1")!;
  const report = await verify(`مقدمة للتجربة «${q.text}» ثم تعليق.`);
  assert.equal(report.findings.length, 1); assert.equal(report.findings[0].status, "QURAN_VERIFIED");
});
test("complete source text embedded in prose is detected without attribution invention", async () => {
  const q = (await getCandidates()).find(r => r.kind === "quran" && r.ref === "3:8" && r.language === "ar")!;
  const result = await verify(`قال في كلمة للتجربة: ${q.text}، وفي ذلك تذكير.`);
  assert.ok(result.findings.some(f => f.status === "QURAN_VERIFIED" && f.ref === "3:8"));
});
test("API rejects origin mismatch, invalid JSON and oversized streaming bodies", async () => {
  await assert.rejects(readJson(new Request("https://example.test/api/verify", { method: "POST", headers: { origin: "https://evil.test", "content-type": "application/json" }, body: "{}" })), (e: unknown) => e instanceof RequestError && e.status === 403);
  await assert.rejects(readJson(new Request("https://example.test/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: "invalid" })));
  await assert.rejects(readJson(new Request("https://example.test/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "x".repeat(100) }) }), 20));
});
