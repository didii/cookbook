import type { Range } from '~/lib/anchors';
import { parseIngredient } from '~/lib/ingredients';

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

/** An ingredient row of the recipe as the finders need it: the parsed line. */
export type Row = { id: string; quantityText: string; name: string };

/** An ingredient chip found in a step's text; `values.quantity` is the amount written before the name, else the one `findIngredients` was told to fall back on. */
export type FoundIngredient = Found<IngredientValues> & { rowId: string };

const wordPattern = /\p{L}+(?:['’]s)?/gu;
const plain = (word: string) => word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const undouble = (stem: string) => (/([^aeiou])\1$/.test(stem) ? stem.slice(0, -1) : stem);

/** What a word could be the plural of, besides itself: "eieren" → "ei", "bessen" → "bes", "appels" → "appel", "auto's" → "auto", and a long vowel written short ("tomaten" and "tomaat" both give "tomat"). Two words are the same ingredient when they share a form. */
function forms(word: string): Set<string> {
  const w = plain(word).replace(/['’]s$/, '');
  const all = new Set([w]);
  if (w.endsWith('eren')) all.add(w.slice(0, -4));
  if (w.endsWith('en')) all.add(undouble(w.slice(0, -2)));
  if (w.endsWith('s')) all.add(w.slice(0, -1));
  for (const f of [...all]) all.add(f.replace(/([aeou])\1/g, '$1'));
  return new Set([...all].filter((f) => f.length >= 2));
}
export const sameWord = (a: string, b: string) => [...forms(a)].some((f) => forms(b).has(f));

type Token = Range & { word: string };
const tokens = (text: string): Token[] => [...text.matchAll(wordPattern)].map((m) => ({ word: m[0], start: m.index, end: m.index + m[0].length }));
const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;

/** The places in the text that say this row: its whole name as consecutive words first, then its last word on its own. */
function mentions(row: Row, words: Token[], text: string): Range[] {
  const name = tokens(row.name);
  if (!name.length) return [];
  const whole: Range[] = [];
  if (name.length > 1) {
    for (let i = 0; i + name.length <= words.length; i++) {
      const run = name.every(
        (n, k) => sameWord(n.word, words[i + k].word) && (k === 0 || /^\s+$/.test(text.slice(words[i + k - 1].end, words[i + k].start))),
      );
      if (run) whole.push({ start: words[i].start, end: words[i + name.length - 1].end });
    }
  }
  const head = name[name.length - 1].word;
  return [...whole, ...words.filter((w) => sameWord(head, w.word))];
}

/** The amount written right before the name ("100 g", "2"), as a range, when the text before the name ends in one. */
function writtenQuantity(text: string, name: Range): Range | undefined {
  const before = [...text.slice(0, name.start).matchAll(/\S+/g)];
  for (const take of [2, 1]) {
    const from = before.at(-take);
    if (!from) continue;
    const phrase = text.slice(from.index, name.start).trim();
    const parsed = parseIngredient(phrase);
    if (parsed.quantityText && !parsed.name) return { start: from.index, end: from.index + phrase.length };
  }
}

/**
 * The ingredient chips a step's text asks for, in the order of the text. A word matches a row by its last word (singular or plural, any letter case) and by its whole name when all of it is written; of rows that overlap the longest wins, then the earlier row; each row is found once, at its first place that is not taken.
 * `fallback` gives the amount to show when none is written before the name.
 */
export function findIngredients(text: string, rows: Row[], fallback: (row: Row) => string): FoundIngredient[] {
  const words = tokens(text);
  const pending = rows.map((row, order) => ({ row, order, places: mentions(row, words, text), at: 0 }));
  const taken: (Range & { row: Row })[] = [];
  for (;;) {
    const open = pending.filter((p) => p.at < p.places.length);
    if (!open.length) break;
    const length = (p: (typeof open)[number]) => p.places[p.at].end - p.places[p.at].start;
    open.sort((a, b) => length(b) - length(a) || a.order - b.order);
    const [best] = open;
    const place = best.places[best.at];
    if (taken.some((t) => overlaps(t, place))) best.at++;
    else {
      taken.push({ ...place, row: best.row });
      pending.splice(pending.indexOf(best), 1);
    }
  }
  return taken
    .sort((a, b) => a.start - b.start)
    .map(({ row, ...place }) => {
      const quantity = writtenQuantity(text, place);
      return {
        rowId: row.id,
        start: quantity?.start ?? place.start,
        end: place.end,
        values: { quantity: quantity ? text.slice(quantity.start, quantity.end) : fallback(row), name: row.name },
      };
    });
}
