/** A range of a step's text: UTF-16 indexes, `end` exclusive. */
export type Range = { start: number; end: number };

/** What the words of a chip say, per kind of chip. */
export type IngredientValues = { quantity: string; name: string };
export type OvenValues = { degrees: number };
export type TimerValues = { minutes: number };

/** A chip found in a step's text. */
export type Found<V> = Range & { values: V };

const num = String.raw`\d+(?:[.,]\d+)?`;
const toNumber = (text: string) => Number(text.replace(',', '.'));
// Whole words only: no letter or digit right before or after.
const before = String.raw`(?<![\p{L}\d])`;
const after = String.raw`(?![\p{L}\d])`;

const spoken: Record<string, number> = { 'een half uur': 30, 'een kwartier': 15, 'anderhalf uur': 90, 'een uur': 60 };
const duration = new RegExp(
  String.raw`${before}(?:(een half uur|een kwartier|anderhalf uur|een uur)|(${num})(?:\s*[-–]\s*${num})?\s*(minuten|minuut|min|uren|uur|u))${after}`,
  'giu',
);

/** The first duration in the text ("30 minuten", "1,5 uur", "20-25 minuten", "een kwartier"), in whole minutes; a range gives its lower value. */
export function findTimer(text: string): Found<TimerValues> | undefined {
  for (const m of text.matchAll(duration)) {
    const minutes = m[1] ? spoken[m[1].toLowerCase()] : Math.round(toNumber(m[2]) * (m[3].toLowerCase().startsWith('u') ? 60 : 1));
    if (minutes > 0) return { start: m.index, end: m.index + m[0].length, values: { minutes } };
  }
}

const temperature = new RegExp(String.raw`${before}(\d+)\s*(?:graden|gr|°\s?C?)${after}`, 'giu');

/** The first temperature in the text ("180 graden", "180 °C", "180°"), when it is plausible for an oven: 50 to 300. */
export function findOven(text: string): Found<OvenValues> | undefined {
  for (const m of text.matchAll(temperature)) {
    const degrees = Number(m[1]);
    if (degrees >= 50 && degrees <= 300) return { start: m.index, end: m.index + m[0].length, values: { degrees } };
  }
}
