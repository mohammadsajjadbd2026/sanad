import "server-only";
import { z } from "zod";
import { searchSources } from "../verify/retrieve";
import { loadBayyinat } from "../sources/bayyinat";
import { normalizeForSearch } from "../verify/normalize";
import { searchKhizana, searchIslamhouse } from "./external";
import type { LibraryGroup, LibraryResponse } from "./types";
export const libraryRequest = z.object({ query: z.string().trim().max(200), external: z.boolean().default(false), language: z.enum(["ar", "en", "bn", "ur"]).default("ar"), page: z.number().int().min(1).max(1000).default(1), type: z.enum(["showall", "books", "articles", "audios", "videos"]).default("showall"), onlyIslamhouse: z.boolean().default(false) });
export async function searchLibrary(input: z.infer<typeof libraryRequest>): Promise<LibraryResponse> {
  const tasks: Promise<LibraryGroup>[] = [];
  if (!input.onlyIslamhouse) tasks.push((async () => {
    const found = input.query.length >= 2 ? await searchSources(input.query, 12) : [];
    const key = normalizeForSearch(input.query);
    const bayyinat = key.length >= 2 ? (await loadBayyinat()).records.filter(r => normalizeForSearch(`${r.question_ar} ${r.answer_ar}`).includes(key)).slice(0, 5) : [];
    return { provider: "local", note: "بحث لفظي في القرآن وترجماته وفهرس الأحاديث وبيّنات. ظهور النص في البحث ليس حكمًا بصحته؛ استخدم المدقّق.", items: [...found.map(({ row }) => ({ id: `local:${row.kind}:${row.ref}`, provider: "local" as const, title: `${row.kind === "quran" ? "القرآن الكريم" : "فهرس الحديث"} · ${row.ref}`, text: row.text, citation: row.attribution, language: row.language })), ...bayyinat.map(r => ({ id: `local:${r.id}`, provider: "local" as const, title: r.question_ar, text: r.answer_ar, citation: `بيّنات · ص ${r.page} · ${r.id}`, language: "ar" }))] };
  })());
  async function external(provider: "khizana" | "islamhouse", call: () => Promise<LibraryGroup>): Promise<LibraryGroup> {
    try { return await call(); } catch { return { provider, items: [], note: "", error: "تعذر الاتصال بالمصدر أو بلغت حصته. لا تعني هذه الرسالة عدم وجود النص. حاول لاحقًا." }; }
  }
  if (input.external) {
    if (!input.onlyIslamhouse && input.query.length >= 2) tasks.push(external("khizana", () => searchKhizana(input.query)));
    tasks.push(external("islamhouse", () => searchIslamhouse(input.query, input.language, input.page, input.type)));
  }
  return { groups: await Promise.all(tasks) };
}
