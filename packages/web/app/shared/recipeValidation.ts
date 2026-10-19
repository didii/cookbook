import { parseIngredient, type ParsedIngredient } from '~/lib/ingredients';

export type Field = 'title' | 'author' | 'servings' | 'time' | 'intro' | 'image';

/** The trimmed form values; servings stays text because it can be empty. Time, intro and image are free text, so they have no validation. */
export type Values = Record<Field, string>;

/** One message per invalid field. Servings may be empty, but when filled in it must be a whole number of at least 1. */
export function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.title) errors.title = 'Geef het recept een titel.';
  if (!values.author) errors.author = 'Vul in van wie het recept is.';
  if (values.servings && (!/^\d+$/.test(values.servings) || Number(values.servings) < 1))
    errors.servings = 'Vul een heel aantal personen in, minstens 1.';
  return errors;
}

/** The trimmed values of a submitted form. */
export function readForm(form: FormData): Values {
  const text = (name: Field) => String(form.get(name) ?? '').trim();
  return { title: text('title'), author: text('author'), servings: text('servings'), time: text('time'), intro: text('intro'), image: text('image') };
}

/** Valid form values as recipe fields: empty optional ones become undefined. */
export function toRecipeFields(values: Values) {
  return {
    title: values.title,
    author: values.author,
    servings: values.servings ? Number(values.servings) : undefined,
    time: values.time || undefined,
    intro: values.intro,
    image: values.image || undefined,
  };
}

/** Field errors, plus one message per ingredient row (keyed by the row's place in the posted list). */
export type Errors = Partial<Record<Field, string>> & { ingredients?: Record<number, string> };

/** The posted ingredient lines, as typed. The form carries them as a JSON list of `{ text }`; anything else counts as no lines. */
function readLines(form: FormData): string[] {
  try {
    const list: unknown = JSON.parse(String(form.get('ingredients') ?? '[]'));
    return Array.isArray(list) ? list.map((row) => String((row as { text?: unknown })?.text ?? '').trim()) : [];
  } catch {
    return [];
  }
}

/** Parses the posted ingredient lines here, never trusting a client-side split: blank lines are dropped, a quantity without a name is an error on its row. `lines` is every posted line, to show again after a refusal. */
export function readIngredients(form: FormData) {
  const lines = readLines(form);
  const ingredients: ParsedIngredient[] = [];
  const errors: Record<number, string> = {};
  lines.forEach((line, i) => {
    if (!line) return;
    const parsed = parseIngredient(line);
    if (parsed.name) ingredients.push(parsed);
    else errors[i] = `Vul bij "${parsed.quantityText}" ook een naam in.`;
  });
  return { lines, ingredients, errors };
}
