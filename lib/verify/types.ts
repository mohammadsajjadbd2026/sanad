export const labels = {
  QURAN_VERIFIED: "مطابق للمصدر القرآني", QURAN_WORDING_DIFFERS: "اللفظ يختلف عن المصدر القرآني",
  HADITH_AUTHENTIC: "ثابت بحسب المصدر", HADITH_WEAK: "ضعيف بحسب المصدر",
  HADITH_FABRICATED: "موضوع أو لا أصل له بحسب المصدر", HADITH_MULTIPLE_RULINGS: "أحكام متعددة — دون ترجيح",
  NOT_FOUND: "لم يُعثر عليه", OUT_OF_SCOPE: "خارج نطاق التحقّق", REFER_TO_SCHOLAR: "يحتاج سؤال مختص",
} as const;
export type Status = keyof typeof labels;
export type Finding = { status: Status; quote: string; reason: string; ref?: string; sourceText?: string; translation?: string; attribution?: string; url?: string; rulings?: { muhaddith: string; source: string; ref: string; ruling_text: string; category: string }[] };
export type Report = { findings: Finding[]; mode: "local-conservative"; elapsedMs: number; limitation: string };
