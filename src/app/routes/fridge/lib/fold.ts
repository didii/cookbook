/** Lowercase without accents, so "Crème" and "creme" are the same. */
export const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** The text as an entry: trimmed, runs of spaces made one. */
export const cleanEntry = (text: string) => text.trim().replace(/\s+/g, ' ');

/** Whether two entries are the same word, letter case and accents ignored. */
export const sameEntry = (a: string, b: string) => fold(a) === fold(b);
