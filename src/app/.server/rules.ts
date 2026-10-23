import { defaultRules, type Rules } from '~app/lib/rules';

const key = 'parsing-rules';

const valid = /^[\p{L}° ]+$/u;
const maxMinutes = 1440;
const isWords = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every((w) => typeof w === 'string' && valid.test(w));
const isSpoken = (v: unknown): v is Record<string, number> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every((m) => typeof m === 'number' && Number.isSafeInteger(m) && m > 0 && m <= maxMinutes);

/** The saved rules. No row, invalid JSON or a value of the wrong shape gives the defaults, and a field an older value lacks takes its default. */
export async function getRules(db: D1Database): Promise<Rules> {
  // A failing query is a real failure and surfaces; only an unreadable value gives the defaults.
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  if (!row) return defaultRules;
  try {
    const saved: Record<string, unknown> = JSON.parse(row.value);
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return defaultRules;
    const rules = { ...defaultRules, ...saved };
    const ok = isWords(rules.units) && isWords(rules.minuteWords) && isWords(rules.hourWords) && isWords(rules.degreeWords) && isSpoken(rules.spoken);
    return ok ? rules : defaultRules;
  } catch {
    return defaultRules;
  }
}

/** The five fields of the admin form: one word per line, and for spoken durations `phrase = minutes`. */
export type RulesFields = Record<'units' | 'minuteWords' | 'hourWords' | 'degreeWords' | 'spoken', string>;
export type RulesErrors = Partial<Record<keyof RulesFields, string>>;

const label = { units: 'Eenheden', minuteWords: 'Minuutwoorden', hourWords: 'Uurwoorden', degreeWords: 'Graadwoorden', spoken: 'Uitgesproken duur' };
const clean = (line: string) => line.trim().replace(/\s+/g, ' ').toLowerCase();
const lines = (text: string) => text.split(/\r?\n/).map(clean).filter(Boolean);

/** Checks and cleans the form: blank lines and repeats dropped, words lowercased. Either the rules or one message per faulty field; nothing is stored. */
export function readRules(fields: RulesFields): { rules: Rules } | { errors: RulesErrors } {
  const errors: RulesErrors = {};
  const words = (field: 'units' | 'minuteWords' | 'hourWords' | 'degreeWords') => {
    const list = [...new Set(lines(fields[field]))];
    if (!list.length) errors[field] = `${label[field]} mogen niet leeg zijn.`;
    // Units match as one letters-only word, so they take no spaces or °.
    const ok = field === 'units' ? /^\p{L}+$/u : valid;
    const bad = list.find((w) => !ok.test(w));
    if (bad) errors[field] = field === 'units' ? `"${bad}" mag alleen letters bevatten.` : `"${bad}" mag alleen letters, ° en spaties bevatten.`;
    return list;
  };
  const rules: Rules = {
    units: words('units'),
    minuteWords: words('minuteWords'),
    hourWords: words('hourWords'),
    degreeWords: words('degreeWords'),
    spoken: {},
  };
  for (const line of lines(fields.spoken)) {
    const at = line.lastIndexOf('=');
    const phrase = clean(at < 0 ? line : line.slice(0, at));
    const minutes = at < 0 ? '' : line.slice(at + 1).trim();
    if (!valid.test(phrase)) errors.spoken = `"${line}": de zin mag alleen letters, ° en spaties bevatten.`;
    else if (!/^\d+$/.test(minutes) || Number(minutes) < 1 || Number(minutes) > maxMinutes)
      errors.spoken = `"${line}": schrijf "zin = minuten" met een heel aantal minuten van 1 tot en met ${maxMinutes}.`;
    else rules.spoken[phrase] = Number(minutes);
  }
  // A word means one thing: it is in one list only.
  const lists = ['units', 'minuteWords', 'hourWords', 'degreeWords'] as const;
  lists.forEach((a, i) =>
    lists.slice(i + 1).forEach((b) => {
      const twice = rules[a].find((w) => rules[b].includes(w));
      if (twice && !errors[b]) errors[b] = `"${twice}" staat ook bij ${label[a].toLowerCase()}; een woord mag maar in één lijst.`;
    }),
  );
  return Object.keys(errors).length ? { errors } : { rules };
}

/** Validates, then overrides the whole setting in one statement. Stores nothing when a field is faulty. */
export async function saveRules(db: D1Database, fields: RulesFields): Promise<{ errors?: RulesErrors }> {
  const read = readRules(fields);
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

/** The rules as the admin form shows them. */
export const toFields = (rules: Rules): RulesFields => ({
  units: rules.units.join('\n'),
  minuteWords: rules.minuteWords.join('\n'),
  hourWords: rules.hourWords.join('\n'),
  degreeWords: rules.degreeWords.join('\n'),
  spoken: Object.entries(rules.spoken)
    .map(([phrase, minutes]) => `${phrase} = ${minutes}`)
    .join('\n'),
});
