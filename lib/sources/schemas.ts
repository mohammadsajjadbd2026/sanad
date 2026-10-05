import { z } from "zod";

const text = z.string().refine(value => value.trim().length > 0, "empty text");
export const languageSchema = z.enum(["ar", "en", "bn", "ur"]);
export type Language = z.infer<typeof languageSchema>;
export const rulingCategorySchema = z.enum(["ثابت", "ضعيف", "موضوع أو لا أصل له", "يُهمَل (ليس حكمًا على الحديث)"]);
export const hadithStatusSchema = z.enum(["HADITH_AUTHENTIC", "HADITH_WEAK", "HADITH_FABRICATED", "HADITH_MULTIPLE_RULINGS"]);
export const rulingSchema = z.object({ muhaddith: text, source: text, ref: z.string(), ruling_text: text, category: rulingCategorySchema });
export const hadithSchema = z.object({
  id: z.string().regex(/^h-\d+$/), text_ar: text, rawi: z.string(),
  rulings: z.array(rulingSchema).min(1),
  takhrij: z.array(z.object({ muhaddith: z.string(), source: z.string(), ref: z.string() })),
  derived_status: hadithStatusSchema,
  url: z.url().refine(value => ["https:", "http:"].includes(new URL(value).protocol)),
  common_translations: z.object({ en: z.array(text), bn: z.array(text), ur: z.array(text) }),
  topic: z.string(), added_by: z.string(), notes: z.string(),
});
export type Hadith = z.infer<typeof hadithSchema>;
export type RulingCategory = z.infer<typeof rulingCategorySchema>;

export const quranSchema = z.record(z.string().regex(/^\d{1,3}:\d{1,3}$/), z.object({ uthmani: text, clean: text }));
export const translationSchema = z.record(z.string().regex(/^\d{1,3}:\d{1,3}$/), text);
export const bayyinatSchema = z.object({
  id: z.string().regex(/^b-\d+$/), question_ar: text, answer_ar: text,
  page: z.string().regex(/^\d+$/), topic: z.string(), audience_tags: z.string(), level: z.string(),
});
export type Bayyinat = z.infer<typeof bayyinatSchema>;
