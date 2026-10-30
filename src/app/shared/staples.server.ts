import { defaultStaples } from './staples';

const key = 'staples';
export const maxStaples = 100;
export const maxStapleLength = 40;

const valid = /^[\p{L} ]+$/u;
const isStaples = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((w) => typeof w === 'string' && valid.test(w) && w.length <= maxStapleLength);

/** Letter case and accents ignored, for finding repeats. */
const fold = (word: string) => word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** The saved staples. No row, invalid JSON or a value of the wrong shape gives the defaults; a saved empty list means none. */
export async function getStaples(db: D1Database): Promise<string[]> {
  // A failing query is a real failure and surfaces; only an unreadable value gives the defaults.
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  if (!row) return defaultStaples;
  try {
    const saved: unknown = JSON.parse(row.value);
    return isStaples(saved) ? saved : defaultStaples;
  } catch {
    return defaultStaples;
  }
}

/** A message for the list as a whole and for single rows, by their index in the posted rows. */
export type StaplesErrors = { list?: string; rows?: Record<number, string> };

/** Checks and cleans the rows: spaces trimmed and merged, empty rows and repeats dropped. Either the staples or the messages; nothing is stored. */
export function readStaples(input: string[]): { staples: string[] } | { errors: StaplesErrors } {
  const errors: StaplesErrors = {};
  const staples: string[] = [];
  const seen = new Set<string>();
  input.forEach((raw, i) => {
    const word = String(raw ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!word) return;
    if (!valid.test(word)) (errors.rows ??= {})[i] = 'Een woord mag alleen letters en spaties bevatten.';
    else if (word.length > maxStapleLength) (errors.rows ??= {})[i] = `Een woord mag niet langer zijn dan ${maxStapleLength} tekens.`;
    else if (!seen.has(fold(word))) {
      seen.add(fold(word));
      staples.push(word);
    }
  });
  if (staples.length > maxStaples) errors.list = `Er mogen niet meer dan ${maxStaples} basisproducten zijn.`;
  return errors.list || errors.rows ? { errors } : { staples };
}

/** Overrides the whole setting in one statement. The staples must be read first with `readStaples`. */
export async function saveStaples(db: D1Database, staples: string[]): Promise<void> {
  await db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value')
    .bind(key, JSON.stringify(staples))
    .run();
}

/** Removes the saved staples, so the defaults are in use. */
export async function resetStaples(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
}
