import { numberPattern, numberValue } from '~app/shared/numbers';
import type { Rules } from '~app/shared/rules';

const leading = new RegExp(String.raw`^\s*(${numberPattern})(\s*[-–]\s*${numberPattern})?\s*(.*)$`, 'u');

/** The value and unit of a chip's quantity text, which holds no name: the number at the start, and whatever follows it is the unit ("1 klontje" gives 1 and "klontje"). A quantity that is only a loose unit ("scheutje") is one of it, with value 1. A range or other text gives no value. */
export function parseQuantity(text: string, rules: Rules): { quantityValue?: number; quantityUnit?: string } {
  const match = leading.exec(text);
  if (!match) {
    const unit = text.trim().toLowerCase();
    return rules.looseUnits.includes(unit) ? { quantityValue: 1, quantityUnit: unit } : {};
  }
  if (match[2]) return {};
  const quantityValue = numberValue(match[1]);
  if (!quantityValue) return {};
  return { quantityValue, quantityUnit: match[3].trim() || undefined };
}
