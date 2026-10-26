/** The words the cookbook recognises in recipe text. Plain words, never regular expressions; all lowercase. */
export type Rules = {
  /** Words that count as a unit when they follow a number ("g", "el"). */
  units: string[];
  /** Words that count as a unit when a line starts with them and has no number ("scheutje rode wijn" is one scheutje). Letters only. */
  looseUnits: string[];
  /** Duration words that multiply the number before them, with their minutes per 1 ("uur" = 60). */
  perNumber: Record<string, number>;
  /** Words after a temperature ("graden", "°C"). */
  degreeWords: string[];
  /** Fixed durations: a phrase and its whole number of minutes ("een kwartier" = 15). */
  fixed: Record<string, number>;
};

/** What the cookbook recognised before the rules were configurable; used while no rules are saved. */
export const defaultRules: Rules = {
  units:
    'g gr gram kg mg l liter dl cl ml el tl kl snuf snufje scheut scheutje klont klontje blik blikje pot potje zak zakje bos bosje teen tenen takje takjes plak plakken plakje stuk stuks stukje bakje pak pakje handvol mespunt mespuntje eetlepel eetlepels theelepel theelepels'.split(
      ' ',
    ),
  looseUnits: 'snuf snufje scheut scheutje mespunt mespuntje handvol klont klontje'.split(' '),
  perNumber: { minuten: 1, minuut: 1, min: 1, uren: 60, uur: 60, u: 60 },
  degreeWords: ['graden', '°c', '°'],
  fixed: { 'een half uur': 30, 'een kwartier': 15, 'anderhalf uur': 90, 'een uur': 60 },
};

/** The words as one regex alternation, matched literally (special characters escaped), longest first so "minuten" wins over "min". */
export const alternation = (words: string[]) =>
  [...words]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    .join('|');
