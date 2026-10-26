import { numberPattern, numberValue } from '~app/shared/numbers';
import type { StepIngredient, StepQuantity } from '~app/shared/recipe';

const whole = new RegExp(String.raw`^${numberPattern}$`, 'u');

/** At most 3 significant digits, comma as separator, no trailing zeros; 1000 and up only rounds to a whole number. */
export function formatNumber(n: number): string {
  const rounded = n >= 1000 ? Math.round(n) : Number(n.toPrecision(3));
  return String(rounded).replace('.', ',');
}

/** The value of a typed number ("2,5", "1/3", "½"), or undefined when the whole text is not one. */
export function parseNumber(text: string): number | undefined {
  const t = text.trim();
  return whole.test(t) ? numberValue(t) : undefined;
}

/** The quantity of an ingredient row or step chip for the factor: its stored value multiplied, followed by its unit; a range shows both numbers as `min-max`, in the order stored. Factor 1 and a row or chip without a stored value (no number) keep the quantity text as written. */
export function scaleIngredient({ quantityText, quantityValue, quantityValueMax, quantityUnit }: StepIngredient, factor: number): string {
  if (factor === 1 || quantityValue == null) return quantityText;
  const numbers = [quantityValue, quantityValueMax].filter((n) => n != null).map((n) => formatNumber(n * factor));
  return [numbers.join('-'), quantityUnit].filter(Boolean).join(' ');
}

/** A step text with each stored amount replaced by its value multiplied by the factor (both numbers of a range); the rest of the text, including the separator of a range and the unit after the number, stays. Factor 1 gives the text as stored. An amount of which a number's characters are no number any more (text changed outside the editor) or that overlaps one already replaced is left alone, whatever the order of `quantities`. */
export function scaleText(body: string, quantities: StepQuantity[], factor: number): string {
  if (factor === 1) return body;
  let out = body;
  let replacedFrom = body.length;
  // From the end, so earlier places stay valid.
  for (const q of [...quantities].sort((a, b) => b.startIndex - a.startIndex)) {
    const max =
      q.quantityValueMax != null && q.maxStartIndex != null && q.maxEndIndex != null
        ? { value: q.quantityValueMax, start: q.maxStartIndex, end: q.maxEndIndex }
        : undefined;
    if ((max?.end ?? q.endIndex) > replacedFrom) continue;
    if ([[q.startIndex, q.endIndex], max && [max.start, max.end]].some((span) => span && parseNumber(body.slice(...span)) === undefined)) continue;
    if (max) out = out.slice(0, max.start) + formatNumber(max.value * factor) + out.slice(max.end);
    out = out.slice(0, q.startIndex) + formatNumber(q.quantityValue * factor) + out.slice(q.endIndex);
    replacedFrom = q.startIndex;
  }
  return out;
}

const ladder = [1 / 10, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 1, 1.5, 2, 3, 4];
const eps = 1e-3;

/** The next multiplier above (`1`) or below (`-1`) the current one on the ladder 1/10 … 4, then by one; stops at 1/10. */
export function nextMultiplier(current: number, direction: 1 | -1): number {
  if (direction === 1) return ladder.find((v) => v > current + eps) ?? Math.floor(current + eps) + 1;
  if (current > 4 + eps) return Math.max(4, Math.ceil(current - eps) - 1);
  return ladder.filter((v) => v < current - eps).at(-1) ?? Math.min(current, ladder[0]);
}
