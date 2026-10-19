import { useEffect, useRef, useState } from 'react';
import { Form, Link, useNavigation } from 'react-router';
import { isDirty, startingDraft, type Content } from '~/lib/draft';
import { AuthorInput } from '~/shared/AuthorInput';
import { cn } from '~/shared/cn';
import type { Errors, Field } from '~/shared/recipeValidation';
import { PhotoField, type PhotoState } from './PhotoField';
import { SaveBar } from './SaveBar';
import { useLeaveGuard } from './useLeaveGuard';

type Props = {
  /** Visually hidden page heading. */
  heading: string;
  authors: string[];
  /** The starting values: what Reset restores and what unsaved changes are measured against. */
  initial: Content;
  /** What the editor shows when it opens: the starting values, or the values of a refused submit. */
  values: Content;
  errors: Errors;
  /** Index of the tile band shown under the photo. */
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
export function RecipeEditor({ heading, authors, initial, values, errors, tile, cancelTo }: Props) {
  const [current, setCurrent] = useState(() => startingDraft(values));
  const [photo, setPhoto] = useState<PhotoState>('ready');
  // Bumped by Herstel so the photo field starts over: it drops a running upload and its preview.
  const [resets, setResets] = useState(0);
  const busy = useNavigation().formMethod != null;
  const dirty = isDirty(startingDraft(initial), current);
  // Set when the form is submitted, before the navigation starts, so saving never asks; cleared when the response (a refusal) is back.
  const submitting = useRef(false);
  useEffect(() => {
    if (!busy) submitting.current = false;
  }, [busy]);
  useLeaveGuard(() => dirty && !submitting.current);
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
        <span aria-hidden="true">←</span> Terug
      </Link>
      <p className="mt-1 text-lg text-muted">
        Velden met een <span className="font-black text-red">*</span> zijn verplicht.
      </p>
      <Form
        method="post"
        onSubmit={(e) => {
          // Enter in a field can submit while the save button is disabled; the photo must be settled first.
          if (photo !== 'ready') return e.preventDefault();
          submitting.current = true;
        }}
        className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12"
        noValidate
      >
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
          <PhotoField key={resets} value={current.image} onChange={set('image')} onStateChange={setPhoto} tile={tile} />
        </div>
        <SaveBar
          cancelTo={cancelTo}
          busy={busy}
          saveBlocked={photo !== 'ready'}
          dirty={dirty}
          onReset={() => {
            setCurrent(startingDraft(initial));
            setPhoto('ready');
            setResets((n) => n + 1);
          }}
        >
          {photo === 'uploading' && <span>Foto wordt geüpload…</span>}
          {photo === 'error' && <span className="text-red">Foto is niet geüpload</span>}
        </SaveBar>
      </Form>
    </main>
  );
}
