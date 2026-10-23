import { parseIngredient, type ParsedIngredient } from '~/lib/ingredients';
import type { Step } from '~/lib/recipe';
import type { Rules } from '~/lib/rules';

export type RecipeFormField = 'title' | 'author' | 'servings' | 'time' | 'intro' | 'image';

/** The trimmed form values; servings stays text because it can be empty. Time, intro and image are free text, so they have no validation. */
export type RecipeForm = Record<RecipeFormField, string>;

/** One message per invalid field. Servings may be empty, but when filled in it must be a whole number of at least 1. */
export function validate(values: RecipeForm): Partial<Record<RecipeFormField, string>> {
  const errors: Partial<Record<RecipeFormField, string>> = {};
  if (!values.title) errors.title = 'Geef het recept een titel.';
  if (!values.author) errors.author = 'Vul in van wie het recept is.';
  if (values.servings && (!/^\d+$/.test(values.servings) || Number(values.servings) < 1))
    errors.servings = 'Vul een heel aantal personen in, minstens 1.';
  return errors;
}

/** The trimmed values of a submitted form. */
export function readForm(form: FormData): RecipeForm {
  const text = (name: RecipeFormField) => String(form.get(name) ?? '').trim();
  return { title: text('title'), author: text('author'), servings: text('servings'), time: text('time'), intro: text('intro'), image: text('image') };
}

/** Valid form values as recipe fields: empty optional ones become undefined. */
export function toRecipeFields(values: RecipeForm) {
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
export type RecipeFormErrors = Partial<Record<RecipeFormField, string>> & { ingredients?: Record<number, string> };

/** The posted ingredient lines, as typed. The form carries them as a JSON list of `{ text }`; a missing or malformed field gives undefined, which is not the same as an empty list. */
function readLines(form: FormData): string[] | undefined {
  try {
    const list: unknown = JSON.parse(String(form.get('ingredients')));
    return Array.isArray(list) ? list.map((row) => String((row as { text?: unknown })?.text ?? '').trim()) : undefined;
  } catch {
    return undefined;
  }
}

/** Parses the posted ingredient lines here against the rules, never trusting a client-side split: blank lines are dropped, a quantity without a name is an error on its row. `lines` is every posted line, to show again after a refusal. `ingredients` is undefined when the form carried no (valid) list, so a submit without the field leaves the stored ingredients alone instead of clearing them; an explicit empty list does clear them. */
export function readIngredients(form: FormData, rules: Rules) {
  const posted = readLines(form);
  const lines = posted ?? [];
  const ingredients: ParsedIngredient[] | undefined = posted && [];
  const errors: Record<number, string> = {};
  lines.forEach((line, i) => {
    if (!line) return;
    const parsed = parseIngredient(line, rules);
    if (parsed.name) ingredients?.push(parsed);
    else errors[i] = `Vul bij "${parsed.quantityText}" ook een naam in.`;
  });
  return { lines, ingredients, errors };
}

/** The posted steps. The form carries them as a JSON list of `{ body, ingredients?, ovenTemperature?, timer? }`; a missing or malformed field gives undefined, which is not the same as an empty list. */
function readPosted(form: FormData): unknown[] | undefined {
  try {
    const list: unknown = JSON.parse(String(form.get('steps')));
    return Array.isArray(list) ? list : undefined;
  } catch {
    return undefined;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const whole = (value: unknown) => (typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined);

/** One posted step, cleaned here and not trusted: the text trimmed with line breaks turned into spaces; ingredient chips need a name (a quantity may be empty); an oven temperature and timer minutes need to be whole numbers above zero or they are left out, and a timer name goes with its minutes. Whatever is missing is simply not there. */
function cleanStep(posted: unknown): Step {
  const step = isRecord(posted) ? posted : {};
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const chips = Array.isArray(step.ingredients) ? step.ingredients.filter(isRecord) : [];
  const timer = isRecord(step.timer) ? step.timer : {};
  const minutes = whole(timer.minutes);
  const label = text(timer.label);
  const oven = whole(step.ovenTemperature);
  return {
    body: String(step.body ?? '')
      .replace(/\s*[\r\n]+\s*/g, ' ')
      .trim(),
    ingredients: chips.map((c) => ({ quantityText: text(c.quantityText), name: text(c.name) })).filter((c) => c.name),
    ...(oven && { ovenTemperature: oven }),
    ...(minutes && { timer: { minutes, ...(label && { label }) } }),
  };
}

/** Parses the posted steps here, never trusting the client's cleaning (see `cleanStep`); blank ones are dropped. `lines` is every posted step cleaned the same way, to show again after a refusal. `steps` is undefined when the form carried no (valid) list, so a submit without the field leaves the stored steps alone instead of clearing them; an explicit empty list does clear them. */
export function readSteps(form: FormData) {
  const posted = readPosted(form);
  const lines = (posted ?? []).map(cleanStep);
  return { lines, steps: posted && lines.filter((s) => s.body) };
}
