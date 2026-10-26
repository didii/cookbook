import { numberPattern, numberValue, rangePattern, tussen } from '~app/shared/numbers';
import type { Rules } from '~app/shared/rules';

const leading = new RegExp(String.raw`^\s*${tussen}(?:${rangePattern}|(${numberPattern}))\s*(.*)$`, 'u');

/** The value and unit of a chip's quantity text, which holds no name: the number at the start, and whatever follows it is the unit ("1 klontje" gives 1 and "klontje"). A range ("2-3 el") also gives its second number as `quantityValueMax`. A quantity that is only a loose unit ("scheutje") is one of it, with value 1. Other text gives no value. */
export function parseQuantity(text: string, rules: Rules): { quantityValue?: number; quantityValueMax?: number; quantityUnit?: string } {
  const match = leading.exec(text);
  if (!match) {
    const unit = text.trim().toLowerCase();
    return rules.looseUnits.includes(unit) ? { quantityValue: 1, quantityUnit: unit } : {};
  }
  const [, from, to, single, rest] = match;
  const quantityValue = numberValue(from ?? single);
  if (!quantityValue) return {};
  const quantityUnit = rest.trim() || undefined;
  if (to === undefined) return { quantityValue, quantityUnit };
  const quantityValueMax = numberValue(to);
  return quantityValueMax ? { quantityValue, quantityValueMax, quantityUnit } : {};
}
