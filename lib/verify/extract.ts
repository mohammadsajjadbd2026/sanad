/** Bounded, deterministic extraction. Inputs are data, never instructions. */
export function extract(text: string): string[] {
  const marked = [...text.matchAll(/[﴿«“"]([^﴾»”"\n]{3,4000})[﴾»”"]/gu)].map(m => m[1].trim());
  const lines = text.split(/[\n\r]+/u).map(s => s.trim()).filter(Boolean);
  return [...new Set([...marked, ...lines])].slice(0, 30);
}
export function isPersonalFatwa(text: string) {
  return /(?:هل يجوز لي|هل علي[ّ ]|طلقت زوجتي|زوجي طلقني|أفتي?ني|افتني|حكم طلاقي|is it (?:halal|haram|permissible) for me|my divorce|আমার.*(?:তালাক|ফতোয়া)|میرے.*(?:طلاق|فتوی))/iu.test(text);
}
