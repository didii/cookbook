export type ParsedIngredient = { quantityText: string; amount?: number; unit?: string; name: string };

/** Dutch units that count as a unit when they follow the number; any other word stays in the name. */
export const units =
  'g gr gram kg mg l liter dl cl ml el tl kl snuf snufje scheut scheutje klont klontje blik blikje pot potje zak zakje bos bosje teen tenen takje takjes plak plakken plakje stuk stuks stukje bakje pak pakje handvol mespunt mespuntje eetlepel eetlepels theelepel theelepels'.split(
    ' ',
  );

// TODO: placeholder logic. This parsing of the quantity text goes away once `quantityValue` and `quantityUnit` are saved in the DB. The unit and temperature keywords then become configurable in the DB too, so this logic changes anyway.
const fractions: Record<string, number> = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8 };
const glyph = '[½⅓⅔¼¾⅛]';
// Longest alternatives first: "1 ½", "1 2/3", "1/2", "1,5", "½".
export const numberPattern = String.raw`(?:\d+\s?${glyph}|\d+\s+\d+/\d+|\d+/\d+|\d+(?:[.,]\d+)?|${glyph})`;
const leading = new RegExp(String.raw`^\s*(${numberPattern})(?:\s*[-–]\s*(${numberPattern}))?`, 'u');
const word = /^\s*(\p{L}+)(\.?)/u;

/** The numeric value of one number as matched by `number`. */
export function numberValue(text: string): number | undefined {
  const parts = text.match(new RegExp(String.raw`^(\d+)?\s*(?:(\d+)/(\d+)|(${glyph}))?$`, 'u'));
  if (parts) {
    const [, whole, a, b, g] = parts;
    const fraction = g ? fractions[g] : a ? Number(a) / Number(b) : 0;
    return Number.isFinite(fraction) ? Number(whole ?? 0) + fraction : undefined;
  }
  return Number(text.replace(',', '.'));
}

/** Splits one typed line into the quantity as typed, its amount and unit, and the name. A line without a leading number is all name. */
export function parseIngredient(text: string): ParsedIngredient {
  const match = leading.exec(text);
  if (!match) return { quantityText: '', name: text.trim() };
  const [number, from, to] = match;
  let end = number.length;
  let unit: string | undefined;
  const next = word.exec(text.slice(end));
  if (next && units.includes(next[1].toLowerCase())) {
    unit = next[1].toLowerCase();
    end += next[0].length;
  }
  return {
    quantityText: text.slice(0, end).trim(),
    // A range can't be scaled, so it has no amount.
    amount: to === undefined ? numberValue(from) : undefined,
    unit,
    name: text.slice(end).trim(),
  };
}

/** The line as the editor shows it: quantity as typed, then the name. */
export const joinIngredient = ({ quantityText, name }: Pick<ParsedIngredient, 'quantityText' | 'name'>) =>
  [quantityText, name].filter(Boolean).join(' ');
