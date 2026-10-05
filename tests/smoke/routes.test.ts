import assert from "node:assert/strict";
import { test } from "node:test";
import { disclaimer, stations } from "../../lib/journey";

const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
for (const path of ["/", ...stations.map(s => `/${s.slug}`), "/about"]) {
  test(`الصفحة ${path} تُعرض بالعربية مع التنبيه`, async () => {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const html = await response.text();
    assert.match(html, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
    assert.ok(html.includes(disclaimer));
    assert.match(html, /id="main-content"/);
    const station = stations.find(s => path === `/${s.slug}`);
    if (station) {
      assert.ok(html.includes(station.name));
      assert.ok(!html.includes("هذه المحطة قيد البناء"));
    }
    assert.ok(!html.includes("GEMINI_API_KEY"));
  });
}
test("المسارات المجهولة تُرجع 404", async () => {
  const response = await fetch(`${base}/unknown-page`);
  assert.equal(response.status, 404);
});
