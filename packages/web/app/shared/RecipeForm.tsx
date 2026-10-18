import { useEffect } from 'react';
import { Form } from 'react-router';
import { AuthorInput } from '~/shared/AuthorInput';
import { Button } from '~/shared/Button';
import type { Field, Values } from '~/shared/recipeValidation';

type Props = {
  heading: string;
  submitLabel: string;
  authors: string[];
  /** The starting values: empty for a new recipe, the stored ones for an existing recipe. */
  values: Values;
  errors: Partial<Record<Field, string>>;
};

const inputClass = 'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink aria-invalid:border-red';

const fields: { name: Field; label: string; required: boolean; extra?: object }[] = [
  { name: 'title', label: 'Titel', required: true, extra: { autoComplete: 'off' } },
  { name: 'author', label: 'Van wie is het recept?', required: true },
  { name: 'servings', label: 'Aantal personen', required: false, extra: { inputMode: 'numeric', autoComplete: 'off' } },
];

/** The one form for creating and editing a recipe; the routes only differ in the values, heading and button they pass. */
export function RecipeForm({ heading, submitLabel, authors, values, errors }: Props) {
  // After a refused submit, put focus on the first field in error so its label and message are read.
  useEffect(() => {
    const first = fields.find((f) => errors[f.name]);
    if (first) document.getElementById(first.name)?.focus();
  }, [errors]);

  return (
    <main id="main" className="mx-auto max-w-xl px-[max(1rem,4vw)] pt-8 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">{heading}</h1>
      <p className="mt-2 text-lg text-muted">
        Velden met een <span className="font-black text-red">*</span> zijn verplicht.
      </p>
      <Form method="post" className="mt-6 grid gap-5" noValidate>
        {fields.map(({ name, label, required, extra }) => (
          <div key={name}>
            <label htmlFor={name} className="font-extrabold">
              {label}
              {required && (
                <span aria-hidden="true" className="ml-1 font-black text-red">
                  *
                </span>
              )}
            </label>
            {name === 'author' ? (
              <AuthorInput
                authors={authors}
                defaultValue={values.author}
                invalid={!!errors.author}
                describedBy={errors.author ? 'author-error' : undefined}
                className={inputClass}
              />
            ) : (
              <input
                id={name}
                name={name}
                type="text"
                defaultValue={values[name]}
                required={required}
                aria-invalid={errors[name] ? true : undefined}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                className={inputClass}
                {...extra}
              />
            )}
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 font-bold text-red">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
        <Button type="submit" main>
          {submitLabel}
        </Button>
      </Form>
    </main>
  );
}
