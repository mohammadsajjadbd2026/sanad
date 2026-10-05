import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

export class SourceDataError extends Error {
  constructor(file: string, issue: string) {
    super(`مصدر غير صالح (${file}): ${issue}. راجع ملف المصدر ثم شغّل build_data.py.`);
    this.name = "SourceDataError";
  }
}

export function dataRoot() { return path.join(process.cwd(), "data"); }

export async function readSource<T>(root: string, file: string, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try { raw = JSON.parse(await readFile(path.join(root, file), "utf8")); }
  catch { throw new SourceDataError(file, "تعذر قراءة JSON"); }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const location = result.error.issues[0]?.path.join(".") || "الجذر";
    // No source text, credentials or raw provider messages in error logs.
    throw new SourceDataError(file, `بنية غير متوقعة عند ${location}`);
  }
  return result.data;
}

export function requireUniqueIds(items: { id: string }[], file: string) {
  if (new Set(items.map(item => item.id)).size !== items.length) throw new SourceDataError(file, "معرّفات مكررة");
}
