import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SourceDataError } from "./read";

const editions = [
  { file: "bn-muhiuddinkhan.txt", language: "bn", attribution: "محيي الدين خان" },
  { file: "ur-maududi.txt", language: "ur", attribution: "أبو الأعلى المودودي" },
] as const;

export function parseTranslationLines(raw: string, expectedKeys: readonly string[]) {
  const texts: Record<string, string> = Object.create(null);
  for (const line of raw.split(/\r?\n/u)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const match = /^(\d+)\|(\d+)\|(.+)$/u.exec(line);
    if (!match) throw new Error("سطر ترجمة غير صالح");
    const ref = `${Number(match[1])}:${Number(match[2])}`;
    if (Object.hasOwn(texts, ref)) throw new Error("مرجع ترجمة مكرر");
    texts[ref] = match[3];
  }
  if (Object.keys(texts).length !== expectedKeys.length || expectedKeys.some(key => !Object.hasOwn(texts, key))) throw new Error("مفاتيح الترجمة البديلة غير مكتملة");
  return texts;
}

/** Read the existing attributed editions verbatim. Never synthesize from test cases. */
export async function loadAlternativeTranslations(keys: readonly string[]) {
  return Promise.all(editions.map(async edition => {
    try {
      const raw = await readFile(path.join(process.cwd(), "sources/quran", edition.file), "utf8");
      return { ...edition, texts: parseTranslationLines(raw, keys) };
    } catch { throw new SourceDataError(`sources/quran/${edition.file}`, "تعذر تحميل ترجمة بديلة مكتملة"); }
  }));
}
