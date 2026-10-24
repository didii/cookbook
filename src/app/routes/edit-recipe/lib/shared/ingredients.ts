import { numberPattern, numberValue } from '~app/shared/numbers';
import type { Rules } from '~app/shared/rules';

export type ParsedIngredient = { quantityText: string; quantityValue?: number; quantityUnit?: string; name: string };

const leading = new RegExp(String.raw`^\s*(${numberPattern})(?:\s*[-–]\s*(${numberPattern}))?`, 'u');
const word = /^\s*(\p{L}+)(\.?)/u;

/** Splits one typed line into the quantity as typed, its value and unit (one of `rules.units`), and the name. A line without a leading number is all name. */
export function parseIngredient(text: string, rules: Rules): ParsedIngredient {
  const match = leading.exec(text);
  if (!match) return { quantityText: '', name: text.trim() };
  const [number, from, to] = match;
  let end = number.length;
  let unit: string | undefined;
  const next = word.exec(text.slice(end));
  if (next && rules.units.includes(next[1].toLowerCase())) {
    unit = next[1].toLowerCase();
    end += next[0].length;
  }
  return {
    quantityText: text.slice(0, end).trim(),
    // A range can't be scaled, so it has no value.
    quantityValue: to === undefined ? numberValue(from) : undefined,
    quantityUnit: unit,
    name: text.slice(end).trim(),
  };
}

/** The line as the editor shows it: quantity as typed, then the name. */
export const joinIngredient = ({ quantityText, name }: Pick<ParsedIngredient, 'quantityText' | 'name'>) =>
  [quantityText, name].filter(Boolean).join(' ');
