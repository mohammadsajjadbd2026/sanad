/** Search-only normalization. Never use this output as a displayed source or proof of authenticity. */
export function normalizeForSearch(input: string): string {
  return input.normalize("NFKC")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u08d3-\u08ff]/gu, "")
    .replace(/[\u0640\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/[ک]/gu, "ك")
    .replace(/[ی]/gu, "ي")
    .toLocaleLowerCase("en")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/gu, " ").trim();
}

/** Conservative comparison key: preserves letter distinctions folded by retrieval. */
export function normalizeForComparison(input: string): string {
  return input.normalize("NFC")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu, "")
    .replace(/[\u0640\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/gu, " ").trim();
}
