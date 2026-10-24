import { numberPattern, numberValue } from '~app/shared/numbers';
import type { StepQuantity } from '~app/shared/recipe';
import type { Rules } from '~app/shared/rules';
import { findIngredients, type Row } from './shared/stepParsers';

const leading = new RegExp(String.raw`^(${numberPattern})(\s*[-–]\s*${numberPattern})?`, 'u');
// A number or range followed by a word, not glued to other letters or digits.
const beforeWord = new RegExp(String.raw`(?<![\p{L}\d.,/])(${numberPattern})(\s*[-–]\s*${numberPattern})?(?![\d.,/])\s*(\p{L}+)`, 'gu');

/** The amounts in a step's text that scale: a number followed by a unit of the rules, and a number written right before the name of one of the rows. Durations, temperatures and ranges are not found; of two amounts that overlap the earlier wins. */
export function findQuantities(body: string, rows: Row[], rules: Rules): StepQuantity[] {
  const found: StepQuantity[] = [];
  const add = (start: number, number: string, quantityUnit: string | null) => {
    const quantityValue = numberValue(number);
    if (quantityValue && quantityValue > 0) found.push({ startIndex: start, endIndex: start + number.length, quantityValue, quantityUnit });
  };
  const ranges: [number, number][] = [];
  for (const m of body.matchAll(beforeWord)) {
    if (m[2]) ranges.push([m.index, m.index + m[1].length + m[2].length]);
    else if (rules.units.includes(m[3].toLowerCase())) add(m.index, m[1], m[3].toLowerCase());
  }
  for (const f of findIngredients(body, rows, () => '', rules)) {
    const m = leading.exec(f.values.quantity);
    if (m && !m[2]) add(f.start, m[1], null);
  }
  // Stable sort: at the same start the amount with a unit stays first.
  found.sort((a, b) => a.startIndex - b.startIndex);
  let limit = 0;
  return found
    .filter((q) => !ranges.some(([from, to]) => q.startIndex >= from && q.startIndex < to))
    .filter((q) => q.startIndex >= limit && ((limit = q.endIndex), true));
}
