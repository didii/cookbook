import { useEffect } from 'react';
import { data, Form, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { createRecipe, listAuthors } from '~/.server/recipes';
import { Button } from '~/shared/Button';
import type { Route } from './+types/route';
import { AuthorInput } from './AuthorInput';

type Field = 'title' | 'author' | 'servings';

export async function loader({ context }: Route.LoaderArgs) {
  return { authors: await listAuthors(context.get(envContext).DB) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const text = (name: Field) => String(form.get(name) ?? '').trim();
  const values = { title: text('title'), author: text('author'), servings: text('servings') };

  const errors: Partial<Record<Field, string>> = {};
  if (!values.title) errors.title = 'Geef het recept een titel.';
  if (!values.author) errors.author = 'Vul in van wie het recept is.';
  if (values.servings && (!/^\d+$/.test(values.servings) || Number(values.servings) < 1))
    errors.servings = 'Vul een heel aantal personen in, minstens 1.';
  if (Object.keys(errors).length) return data({ errors, values }, { status: 400 });

  const slug = await createRecipe(context.get(envContext).DB, {
    title: values.title,
    author: values.author,
    servings: values.servings ? Number(values.servings) : undefined,
    createdBy: context.get(userEmailContext),
  });
  return redirect(`/recepten/${slug}`);
}

export function meta() {
  return [{ title: 'Nieuw recept · Familiekookboek' }];
}

const inputClass = 'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink aria-invalid:border-red';

const fields: { name: Field; label: string; required: boolean; extra?: object }[] = [
  { name: 'title', label: 'Titel', required: true, extra: { autoComplete: 'off' } },
  { name: 'author', label: 'Van wie is het recept?', required: true },
  { name: 'servings', label: 'Aantal personen', required: false, extra: { inputMode: 'numeric', autoComplete: 'off' } },
];

export default function NewRecipe({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values;

  // After a refused submit, put focus on the first field in error so its label and message are read.
  useEffect(() => {
    const first = fields.find((f) => actionData?.errors[f.name]);
    if (first) document.getElementById(first.name)?.focus();
  }, [actionData]);

  return (
    <main id="main" className="mx-auto max-w-xl px-[max(1rem,4vw)] pt-8 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">Nieuw recept</h1>
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
                authors={loaderData.authors}
                defaultValue={values?.author}
                invalid={!!errors.author}
                describedBy={errors.author ? 'author-error' : undefined}
                className={inputClass}
              />
            ) : (
              <input
                id={name}
                name={name}
                type="text"
                defaultValue={values?.[name]}
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
          Bewaar recept
        </Button>
      </Form>
    </main>
  );
}
