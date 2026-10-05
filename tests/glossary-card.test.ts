import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { glossaryMatches } from "../lib/cards";

test("card glossary suggests registered terms but never rewrites source text", async () => {
  const raw = await readFile("data/glossary.json", "utf8");
  const text = "الإسلام دين";
  const matches = glossaryMatches(text, "ar", raw);
  assert.equal(text, "الإسلام دين");
  assert.ok(matches.some(match => match.term === "الإسلام"));
  assert.equal(glossaryMatches("unrelated text", "en", raw).length, 0);
});
