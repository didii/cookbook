import { numberPattern, numberValue, rangePattern, tussen } from '~app/shared/numbers';
import type { StepQuantity } from '~app/shared/recipe';
import type { Rules } from '~app/shared/rules';
import { findIngredients, type Row } from './shared/stepParsers';

// A number or range: groups 1 and 2 are the range's numbers, group 3 a single number. With the `d` flag every group has indices.
const amount = String.raw`(?:${rangePattern}|(${numberPattern}))`;
const leading = new RegExp(String.raw`^${tussen}${amount}`, 'du');
// A number or range followed by a word, not glued to other letters or digits.
const beforeWord = new RegExp(String.raw`(?<![\p{L}\d.,/])${amount}(?![\d.,/])\s*(\p{L}+)`, 'dgu');

type Span = [start: number, end: number];

/** The amounts in a step's text that scale: a number or range followed by a unit of the rules, and a number or range written right before the name of one of the rows. A range is one amount with both numbers, only when the unit or name follows the second number ("2 el - 3 el" is two amounts). Durations and temperatures are not found; of two amounts that overlap the earlier wins. */
export function findQuantities(body: string, rows: Row[], rules: Rules): StepQuantity[] {
  const found: StepQuantity[] = [];
  const add = ([first, second, single]: (Span | undefined)[], quantityUnit: string | null) => {
    const a = first ?? single;
    const quantityValue = a && numberValue(body.slice(...a));
    const quantityValueMax = second && numberValue(body.slice(...second));
    if (!a || !quantityValue || quantityValue <= 0 || (second && !(quantityValueMax && quantityValueMax > 0))) return;
    found.push({
      startIndex: a[0],
      endIndex: a[1],
      quantityValue,
      ...(second && { quantityValueMax, maxStartIndex: second[0], maxEndIndex: second[1] }),
      quantityUnit,
    });
  };
  for (const m of body.matchAll(beforeWord)) {
    const word = m[4].toLowerCase();
    if (rules.units.includes(word)) add([m.indices![1], m.indices![2], m.indices![3]], word);
  }
  for (const f of findIngredients(body, rows, () => '', rules)) {
    const m = leading.exec(f.values.quantity);
    if (m)
      add(
        [1, 2, 3].map((i) => m.indices![i] && ([m.indices![i][0] + f.start, m.indices![i][1] + f.start] as Span)),
        null,
      );
  }
  // Stable sort: at the same start the amount with a unit stays first.
  found.sort((a, b) => a.startIndex - b.startIndex);
  let limit = 0;
  return found.filter((q) => q.startIndex >= limit && ((limit = q.maxEndIndex ?? q.endIndex), true));
}
