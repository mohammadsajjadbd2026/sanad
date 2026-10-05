import "server-only";
import { quranSchema, translationSchema, type Language } from "./schemas";
import { dataRoot, readSource, SourceDataError } from "./read";

export const translators = {
  en: "Saheeh International", bn: "د. أبو بكر محمد زكريا", ur: "محمد جوناكري",
} as const;

export async function loadQuran(root = dataRoot()) {
  const [arabic, en, bn, ur] = await Promise.all([
    readSource(root, "quran/ar.json", quranSchema),
    readSource(root, "quran/en.json", translationSchema),
    readSource(root, "quran/bn.json", translationSchema),
    readSource(root, "quran/ur.json", translationSchema),
  ]);
  const keys = Object.keys(arabic);
  if (keys.length !== 6236) throw new SourceDataError("quran/ar.json", "عدد الآيات ليس 6236");
  const translations = { en, bn, ur };
  for (const [language, translation] of Object.entries(translations)) {
    if (Object.keys(translation).length !== keys.length || keys.some(key => !Object.hasOwn(translation, key))) {
      throw new SourceDataError(`quran/${language}.json`, "مفاتيح الترجمة لا تطابق الآيات");
    }
  }
  return {
    arabic, translations,
    get(ref: string, language: Language = "ar") {
      if (!Object.hasOwn(arabic, ref)) return undefined;
      return language === "ar"
        ? { ref, text: arabic[ref].uthmani, language, kind: "quran" as const, attribution: "موسوعة القرآن الكريم وموقع تنزيل" }
        : { ref, text: translations[language][ref], language, kind: "translation" as const, attribution: translators[language] };
    },
  };
}
