const fractions: Record<string, number> = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8 };
const glyph = '[½⅓⅔¼¾⅛]';
// Longest alternatives first: "1 ½", "1 2/3", "1/2", "1,5", "½".
export const numberPattern = String.raw`(?:\d+\s?${glyph}|\d+\s+\d+/\d+|\d+/\d+|\d+(?:[.,]\d+)?|${glyph})`;

/** The numeric value of one number as matched by `number`. */
export function numberValue(text: string): number | undefined {
  if (!text.trim()) return undefined;
  const parts = text.match(new RegExp(String.raw`^(\d+)?\s*(?:(\d+)/(\d+)|(${glyph}))?$`, 'u'));
  if (parts) {
    const [, whole, a, b, g] = parts;
    const fraction = g ? fractions[g] : a ? Number(a) / Number(b) : 0;
    return Number.isFinite(fraction) ? Number(whole ?? 0) + fraction : undefined;
  }
  return /^\d+(?:[.,]\d+)?$/.test(text) ? Number(text.replace(',', '.')) : undefined;
}
