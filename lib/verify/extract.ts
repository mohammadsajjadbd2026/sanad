/** Bounded, deterministic extraction. Inputs are data, never instructions. */
export function extract(text: string): string[] {
  const marked = [...text.matchAll(/[﴿«“"]([^﴾»”"\n]{3,4000})[﴾»”"]/gu)].map(m => m[1].trim());
  const attributed = [...text.matchAll(/(?:قوله تعالى|قال في كتابه|قال الله تعالى|يقول الله عز وجل)[^:\n]{0,20}:\s*([^،.؛\n]{8,500})/gu)].map(m => m[1].trim());
  const lines = text.split(/[\n\r]+/u).map(s => s.trim()).filter(Boolean);
  return [...new Set([...marked, ...attributed, ...lines])].slice(0, 30);
}
export function isPersonalFatwa(text: string) {
  return /(?:هل يجوز لي|هل علي[ّ ]|طلقت زوجتي|زوجي طلقني|أفتي?ني|افتني|حكم طلاقي|is it (?:halal|haram|permissible) for me|my divorce|আমার.*(?:তালাক|ফতোয়া|সম্পত্তি|বিয়ে)|আমাদের.*সম্পত্তি.*ভাগ|میرے.*(?:طلاق|فتوی|وراثت|نکاح))/iu.test(text);
}
