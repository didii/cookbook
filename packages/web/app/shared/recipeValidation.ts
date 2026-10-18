export type Field = 'title' | 'author' | 'servings';

/** The trimmed form values; servings stays text because it can be empty. */
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
