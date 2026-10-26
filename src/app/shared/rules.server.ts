import { defaultRules, type Rules } from './rules';

const key = 'parsing-rules';

const valid = /^[\p{L}° ]+$/u;
const maxMinutes = 1440;
const isWords = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every((w) => typeof w === 'string' && valid.test(w));
// Loose units match as one word, like units; an empty list switches them off.
const isLooseUnits = (v: unknown): v is string[] => Array.isArray(v) && v.every((w) => typeof w === 'string' && /^\p{L}+$/u.test(w));
const isMinutes = (m: unknown): m is number => typeof m === 'number' && Number.isSafeInteger(m) && m > 0 && m <= maxMinutes;
const isMinutesMap = (v: unknown): v is Record<string, number> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.entries(v).every(([word, m]) => valid.test(word) && isMinutes(m));

/** Rules saved with separate minute words, hour words and spoken durations become the two maps. New keys win over old ones; an old list that is missing takes its default words. */
function converted(saved: Record<string, unknown>): Record<string, unknown> {
  const { minuteWords, hourWords, spoken, ...rest } = saved;
  const factor = (list: unknown, minutes: number) => {
    if (list === undefined) return Object.entries(defaultRules.perNumber).filter(([, m]) => m === minutes);
    return isWords(list) ? list.map((w) => [w, minutes] as const) : undefined;
  };
  const minute = factor(minuteWords, 1);
  const hour = factor(hourWords, 60);
  const old = minuteWords !== undefined || hourWords !== undefined;
  return {
    // null makes the value invalid when an old list was unreadable
    ...(old && { perNumber: minute && hour ? Object.fromEntries([...minute, ...hour]) : null }),
    ...(spoken !== undefined && { fixed: spoken }),
    ...rest,
  };
}

/** The saved rules. No row, invalid JSON or a value of the wrong shape gives the defaults, and a field an older value lacks takes its default. */
export async function getRules(db: D1Database): Promise<Rules> {
  // A failing query is a real failure and surfaces; only an unreadable value gives the defaults.
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  if (!row) return defaultRules;
  try {
    const saved: Record<string, unknown> = JSON.parse(row.value);
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return defaultRules;
    const { units, looseUnits, perNumber, degreeWords, fixed } = { ...defaultRules, ...converted(saved) };
    const ok =
      isWords(units) &&
      isLooseUnits(looseUnits) &&
      isMinutesMap(perNumber) &&
      Object.keys(perNumber).length > 0 &&
      isWords(degreeWords) &&
      isMinutesMap(fixed);
    return ok ? { units, looseUnits, perNumber, degreeWords, fixed } : defaultRules;
  } catch {
    return defaultRules;
  }
}

export type DurationRow = { word: string; minutes: number | null; fixed: boolean };
/** The rows of the admin form: what is posted and what the page shows. */
export type RulesRows = { units: string[]; looseUnits: string[]; degreeWords: string[]; durations: DurationRow[] };
export type RulesList = keyof RulesRows;
/** A message for a list as a whole and for single rows, by their index in the posted rows. */
export type RulesErrors = Partial<Record<RulesList, { list?: string; rows?: Record<number, string> }>>;

const label = { units: 'Eenheden', looseUnits: 'Losse eenheden', degreeWords: 'Graadwoorden', durations: 'Duur' };
const clean = (word: unknown) =>
  String(word ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

/** Checks and cleans the rows: empty rows and repeats dropped, words lowercased. Either the rules or a message per list and row; nothing is stored. */
export function readRules(input: RulesRows): { rules: Rules } | { errors: RulesErrors } {
  const errors: RulesErrors = {};
  const rowError = (list: RulesList, i: number, message: string) => {
    const rows = ((errors[list] ??= {}).rows ??= {});
    rows[i] ??= message;
  };
  const listError = (list: RulesList, message: string) => {
    (errors[list] ??= {}).list ??= message;
  };

  const words = (list: 'units' | 'looseUnits' | 'degreeWords') => {
    // Units and loose units match as one letters-only word.
    const letters = list !== 'degreeWords';
    const out: string[] = [];
    input[list].forEach((raw, i) => {
      const word = clean(raw);
      if (!word) return;
      if (!(letters ? /^\p{L}+$/u : valid).test(word))
        rowError(list, i, letters ? 'Een woord mag alleen letters bevatten.' : 'Een woord mag alleen letters, ° en spaties bevatten.');
      else if (!out.includes(word)) out.push(word);
    });
    // An empty loose list switches the feature off.
    if (!out.length && list !== 'looseUnits') listError(list, `${label[list]} mogen niet leeg zijn.`);
    return out;
  };
  const units = words('units');
  const looseUnits = words('looseUnits');
  const degreeWords = words('degreeWords');

  const perNumber: Rules['perNumber'] = {};
  const fixed: Rules['fixed'] = {};
  const seen = new Set<string>();
  input.durations.forEach((row, i) => {
    const word = clean(row.word);
    const empty = row.minutes === null || row.minutes === undefined || String(row.minutes).trim() === '';
    if (!word && empty) return;
    if (!word) return rowError('durations', i, 'Een duur heeft een woord nodig.');
    if (!valid.test(word)) return rowError('durations', i, 'Een woord mag alleen letters, ° en spaties bevatten.');
    const minutes = empty ? NaN : Number(row.minutes);
    if (!isMinutes(minutes)) return rowError('durations', i, `Een duur heeft een heel aantal minuten van 1 tot en met ${maxMinutes} nodig.`);
    if (seen.has(word)) return rowError('durations', i, `"${word}" staat al in de duren.`);
    seen.add(word);
    (row.fixed ? fixed : perNumber)[word] = minutes;
  });
  if (!Object.keys(perNumber).length) listError('durations', 'Er moet een duur zijn zonder "Vast".');

  // A word means one thing: it is in one list only. A fixed phrase is not compared, and a loose unit may be a unit.
  const lists: [RulesList, string[]][] = [
    ['units', units],
    ['durations', Object.keys(perNumber)],
    ['degreeWords', degreeWords],
  ];
  const rowOf = (list: RulesList, word: string) =>
    list === 'durations' ? input.durations.findIndex((r) => clean(r.word) === word) : input[list].findIndex((w) => clean(w) === word);
  lists.forEach(([a, wordsA], i) =>
    lists
      .slice(i + 1)
      .forEach(([b, wordsB]) =>
        wordsB
          .filter((w) => wordsA.includes(w))
          .forEach((w) => rowError(b, rowOf(b, w), `"${w}" staat ook bij ${label[a].toLowerCase()}; een woord mag maar in één lijst.`)),
      ),
  );
  return Object.keys(errors).length ? { errors } : { rules: { units, looseUnits, perNumber, degreeWords, fixed } };
}

/** Validates, then overrides the whole setting in one statement. Stores nothing when a row is faulty. */
export async function saveRules(db: D1Database, rows: RulesRows): Promise<{ errors?: RulesErrors }> {
  const read = readRules(rows);
  if ('errors' in read) return { errors: read.errors };
  await db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value')
    .bind(key, JSON.stringify(read.rules))
    .run();
  return {};
}

/** Removes the saved rules, so the defaults are in use. */
export async function resetRules(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
}

/** The rules as the admin form shows them: one row per word, duration words before fixed durations. */
export const toRows = (rules: Rules): RulesRows => ({
  units: rules.units,
  looseUnits: rules.looseUnits,
  degreeWords: rules.degreeWords,
  durations: [
    ...Object.entries(rules.perNumber).map(([word, minutes]) => ({ word, minutes, fixed: false })),
    ...Object.entries(rules.fixed).map(([word, minutes]) => ({ word, minutes, fixed: true })),
  ],
});
