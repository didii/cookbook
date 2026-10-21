import { numberPattern, numberValue, units } from '~/lib/ingredients';
import { findIngredients, type Row } from '~/lib/stepParsers';

// TODO: placeholder logic. Scaling parses the quantity text with the parser of `ingredients.ts`; once `quantityValue` and `quantityUnit` are saved in the DB it multiplies those instead.
/** A number or range at the start of a text: leading space, first number, the dash, second number. */
const leading = new RegExp(String.raw`^(\s*)(${numberPattern})(?:(\s*[-–]\s*)(${numberPattern}))?`, 'u');
const whole = new RegExp(String.raw`^${numberPattern}$`, 'u');
// A number or range followed by a word, not glued to other letters or digits.
const beforeWord = new RegExp(String.raw`(?<![\p{L}\d.,/])(${numberPattern})(?:\s*[-–]\s*(${numberPattern}))?(?![\d.,/])\s*(\p{L}+)`, 'gu');

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

/** The leading number(s) of a quantity multiplied by the factor; the rest stays as written. Factor 1 and text without a leading number are returned as is. */
export function scaleQuantity(text: string, factor: number): string {
  if (factor === 1) return text;
  const m = leading.exec(text);
  if (!m) return text;
  const [all, space, from, dash, to] = m;
  const a = numberValue(from);
  const b = to === undefined ? undefined : numberValue(to);
  if (a === undefined || (to !== undefined && b === undefined)) return text;
  const scaled = space + formatNumber(a * factor) + (to === undefined ? '' : dash + formatNumber(b! * factor));
  return scaled + text.slice(all.length);
}

/** A step text with its amounts multiplied: those followed by an ingredient unit and those written right before the name of one of the rows. Durations and temperatures are not touched. */
export function scaleBody(body: string, factor: number, rows: Row[]): string {
  if (factor === 1) return body;
  const spans: [number, number][] = [];
  for (const m of body.matchAll(beforeWord)) {
    if (units.includes(m[3].toLowerCase())) spans.push([m.index, m.index + m[0].length - m[3].length]);
  }
  for (const f of findIngredients(body, rows, () => '')) {
    if (f.values.quantity) spans.push([f.start, f.start + f.values.quantity.length]);
  }
  // From the end, so earlier positions stay valid; a span that overlaps a later one is skipped.
  spans.sort((a, b) => b[0] - a[0]);
  let out = body;
  let limit = Infinity;
  for (const [start, end] of spans) {
    if (end > limit) continue;
    out = out.slice(0, start) + scaleQuantity(body.slice(start, end), factor) + out.slice(end);
    limit = start;
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
