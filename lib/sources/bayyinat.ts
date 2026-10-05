import "server-only";
import { z } from "zod";
import { bayyinatSchema } from "./schemas";
import { dataRoot, readSource, requireUniqueIds } from "./read";

export async function loadBayyinat(root = dataRoot()) {
  const records = await readSource(root, "bayyinat.json", z.array(bayyinatSchema).min(1));
  requireUniqueIds(records, "bayyinat.json");
  const byId = new Map(records.map(record => [record.id, record]));
  return { records, get: (id: string) => byId.get(id) };
}
