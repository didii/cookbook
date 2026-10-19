import { useEffect, useState } from 'react';
import { Form, Link, useNavigation } from 'react-router';
import { isDirty, startingDraft, type Draft } from '~/lib/draft';
import { AuthorInput } from '~/shared/AuthorInput';
import { cn } from '~/shared/cn';
import { ImagePreview } from '~/shared/ImagePreview';
import type { Field } from '~/shared/recipeValidation';
import { SaveBar } from './SaveBar';

type Props = {
  /** Visually hidden page heading. */
  heading: string;
  authors: string[];
  /** What the editor shows when it opens: the starting values, or the values of a refused submit. */
  values: Draft;
  errors: Partial<Record<Field, string>>;
  /** Index of the tile band shown under the image preview. */
  tile: number;
  /** Where "Terug" leads: the recipe, or the home page for a new recipe. */
  cancelTo: string;
};

const inputClass = 'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink aria-invalid:border-red';
const labelClass = 'font-extrabold';
const asterisk = (
  <span aria-hidden="true" className="ml-1 font-black text-red">
    *
  </span>
);

/** The one page for creating and editing a recipe; the routes only differ in the values, heading and cancel target they pass. */
export function RecipeEditor({ heading, authors, values, errors, tile, cancelTo }: Props) {
  const [current, setCurrent] = useState(values);
  const set = (name: Field) => (value: string) => setCurrent((c) => ({ ...c, [name]: value }));
  const text = (name: Field) => ({
    id: name,
    name,
    value: current[name],
    onChange: (e: { target: { value: string } }) => set(name)(e.target.value),
    'aria-invalid': errors[name] ? (true as const) : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });
  const error = (name: Field) =>
    errors[name] && (
      <p id={`${name}-error`} className="mt-1 font-bold text-red">
        {errors[name]}
      </p>
    );

  // After a refused submit, put focus on the first field in error so its label and message are read.
  useEffect(() => {
    const first = (['title', 'author', 'servings'] as const).find((name) => errors[name]);
    if (first) document.getElementById(first)?.focus();
  }, [errors]);

  return (
    <main id="main" className="mx-auto max-w-290 px-[max(1rem,4vw)] pt-6 pb-32">
      <h1 className="sr-only">{heading}</h1>
      <Link to={cancelTo} className="inline-flex min-h-11 items-center gap-1.5 font-extrabold text-muted">
        <span aria-hidden="true">←</span> Terug naar het recept
      </Link>
      <p className="mt-1 text-lg text-muted">
        Velden met een <span className="font-black text-red">*</span> zijn verplicht.
      </p>
      <Form method="post" className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12" noValidate>
        <div className="grid gap-5">
          <div>
            <label htmlFor="title" className={labelClass}>
              Titel{asterisk}
            </label>
            <input
              {...text('title')}
              type="text"
              autoComplete="off"
              required
              className="block w-full border-0 border-b-3 border-dashed border-ink/35 bg-transparent pt-[0.1em] pb-[0.15em] text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] font-black tracking-[-0.03em] text-ink focus:border-solid focus:border-blu focus:outline-none aria-invalid:border-red"
            />
            {error('title')}
          </div>
          <div>
            <label htmlFor="intro" className={labelClass}>
              Inleiding
            </label>
            <textarea {...text('intro')} rows={4} className={cn(inputClass, 'py-2')} />
          </div>
        </div>
        <div className="order-first grid gap-5 lg:sticky lg:top-4 lg:order-none">
          <div>
            <label htmlFor="author" className={labelClass}>
              Van wie is het recept?{asterisk}
            </label>
            <AuthorInput
              authors={authors}
              value={current.author}
              onValueChange={set('author')}
              invalid={!!errors.author}
              describedBy={errors.author ? 'author-error' : undefined}
              className={inputClass}
            />
            {error('author')}
          </div>
          <div>
            <label htmlFor="servings" className={labelClass}>
              Aantal personen
            </label>
            <input {...text('servings')} type="text" inputMode="numeric" autoComplete="off" className={inputClass} />
            {error('servings')}
          </div>
          <div>
            <label htmlFor="time" className={labelClass}>
              Bereidingstijd
            </label>
            <input {...text('time')} type="text" autoComplete="off" className={inputClass} />
          </div>
          {/* The image field stays here until edit-recipe-picture replaces it. */}
          <div>
            <label htmlFor="image" className={labelClass}>
              Afbeelding (link)
            </label>
            <input {...text('image')} type="text" inputMode="url" autoComplete="off" className={inputClass} />
            <ImagePreview src={current.image.trim()} tile={tile} />
          </div>
        </div>
        <Button type="submit" main className="lg:col-span-2">
          Opslaan
        </Button>
      </Form>
    </main>
  );
}
