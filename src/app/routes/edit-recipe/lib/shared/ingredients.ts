import { numberPattern, numberValue, rangePattern, tussen } from '~app/shared/numbers';
import type { Rules } from '~app/shared/rules';

export type ParsedIngredient = { quantityText: string; quantityValue?: number; quantityValueMax?: number; quantityUnit?: string; name: string };

const leading = new RegExp(String.raw`^\s*${tussen}(?:${rangePattern}|(${numberPattern}))`, 'u');
const word = /^\s*(\p{L}+)(\.?)/u;

/** Splits one typed line into the quantity as typed, its value and unit (one of `rules.units`), and the name. A line with no leading number is all name, unless it starts with a loose unit (`rules.looseUnits`): that word is the quantity, with value 1. */
export function parseIngredient(text: string, rules: Rules): ParsedIngredient {
  const match = leading.exec(text);
  if (!match) {
    const first = word.exec(text);
    if (first && rules.looseUnits.includes(first[1].toLowerCase())) {
      const end = first[0].length;
      return { quantityText: text.slice(0, end).trim(), quantityValue: 1, quantityUnit: first[1].toLowerCase(), name: text.slice(end).trim() };
    }
    return { quantityText: '', name: text.trim() };
  }
  const [number, from, to, single] = match;
  const first = numberValue(from ?? single);
  const second = to === undefined ? undefined : numberValue(to);
  // A range needs two numbers; one that fails to parse has neither.
  const isRange = to !== undefined && Boolean(first) && Boolean(second);
  let end = number.length;
  let unit: string | undefined;
  const next = word.exec(text.slice(end));
  if (next && rules.units.includes(next[1].toLowerCase())) {
    unit = next[1].toLowerCase();
    end += next[0].length;
  }
  return {
    quantityText: text.slice(0, end).trim(),
    quantityValue: to === undefined || isRange ? first : undefined,
    ...(isRange && { quantityValueMax: second }),
    quantityUnit: unit,
    name: text.slice(end).trim(),
  };
}

/** The line as the editor shows it: quantity as typed, then the name. */
export const joinIngredient = ({ quantityText, name }: Pick<ParsedIngredient, 'quantityText' | 'name'>) =>
  [quantityText, name].filter(Boolean).join(' ');
