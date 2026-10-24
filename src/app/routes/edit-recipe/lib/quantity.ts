import { numberPattern, numberValue } from '~app/shared/numbers';

const leading = new RegExp(String.raw`^\s*(${numberPattern})(\s*[-–]\s*${numberPattern})?\s*(.*)$`, 'u');

/** The value and unit of a chip's quantity text, which holds no name: the number at the start, and whatever follows it is the unit ("1 klontje" gives 1 and "klontje"). A range or text without a leading number gives no value. */
export function parseQuantity(text: string): { quantityValue?: number; quantityUnit?: string } {
  const match = leading.exec(text);
  if (!match || match[2]) return {};
  const quantityValue = numberValue(match[1]);
  if (!quantityValue) return {};
  return { quantityValue, quantityUnit: match[3].trim() || undefined };
}
