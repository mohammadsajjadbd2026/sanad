import "server-only";
import { z } from "zod";
import { hadithSchema, type Hadith, type RulingCategory } from "./schemas";
import { dataRoot, readSource, requireUniqueIds, SourceDataError } from "./read";

export function statusFromSourceCategories(categories: readonly RulingCategory[]): Hadith["derived_status"] | null {
  const effective = [...new Set(categories.filter(c => c !== "يُهمَل (ليس حكمًا على الحديث)"))];
  if (effective.length === 0) return null;
  if (effective.length > 1) return "HADITH_MULTIPLE_RULINGS";
  return { "ثابت": "HADITH_AUTHENTIC", "ضعيف": "HADITH_WEAK", "موضوع أو لا أصل له": "HADITH_FABRICATED" }[effective[0]] as Hadith["derived_status"];
}

export async function loadHadith(root = dataRoot()) {
  const records = await readSource(root, "hadith/index.json", z.array(hadithSchema).min(1));
  requireUniqueIds(records, "hadith/index.json");
  for (const record of records) {
    if (record.derived_status !== statusFromSourceCategories(record.rulings.map(r => r.category))) {
      throw new SourceDataError("hadith/index.json", `تعارض في حالة ${record.id}`);
    }
  }
  const byId = new Map(records.map(record => [record.id, record]));
  return { records, get: (id: string) => byId.get(id) };
}
