import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Form, Link, useLocation, useNavigate, useNavigation, useRouteLoaderData } from 'react-router';
import { proposals, usedIn } from '~/lib/chips';
import {
  addStep,
  changeChips,
  editedStep,
  editStep,
  isDirty,
  moveIngredient,
  moveStep,
  removeIngredient,
  removeStep,
  restoreStep,
  startingDraft,
  stepContexts,
  storedSteps,
  typeIngredient,
  type Content,
  type Draft,
} from '~/lib/draft';
import {
  asksBeforeLeaving,
  browserStorage,
  clearDraft,
  describeSavedAt,
  draftKey,
  draftKeyField,
  isFresh,
  loadDraft,
  purgeDrafts,
  resolveStart,
} from '~/lib/draftStore';
import { AuthorInput } from '~/shared/AuthorInput';
import { cn } from '~/shared/cn';
import type { Errors, Field } from '~/shared/recipeValidation';
import { IngredientList } from './IngredientList';
import { OpenProposals } from './OpenProposals';
import { PhotoField, type PhotoState } from './PhotoField';
import { SaveBar } from './SaveBar';
import { StepList } from './StepList';
import { useDraftPersistence } from './useDraftPersistence';
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
  /** The recipe's slug, or none for a new recipe: what its draft on the device belongs to. */
  slug?: string;
  /** When the stored recipe was last saved (none for a new recipe): a draft started from another version is flagged. */
  updatedAt?: string;
};

const inputClass = 'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink aria-invalid:border-red';
const labelClass = 'font-extrabold';
const asterisk = (
  <span aria-hidden="true" className="ml-1 font-black text-red">
    *
  </span>
);

/** The one page for creating and editing a recipe; the routes only differ in the values, heading and cancel target they pass. */
export function RecipeEditor({ heading, authors, initial, values, errors, tile, cancelTo, slug, updatedAt }: Props) {
  const [current, setCurrent] = useState(() => startingDraft(values));
  const [photo, setPhoto] = useState<PhotoState>('ready');
  // Bumped by Herstel so the photo field starts over: it drops a running upload and its preview.
  const [resets, setResets] = useState(0);
  const busy = useNavigation().formMethod != null;
  const startingValues = startingDraft(initial);
  const dirty = isDirty(startingValues, current);
  const contexts = stepContexts(current);
  const proposalCount = current.steps.reduce((n, step, i) => n + proposals(step, contexts[i]).length, 0);
  // Set when the form is submitted, before the navigation starts, so saving never asks; cleared when the response (a refusal) is back.
  const submitting = useRef(false);
  useEffect(() => {
    if (!busy) submitting.current = false;
  }, [busy]);
  const key = draftKey(useRouteLoaderData<{ email: string }>('root')?.email ?? '', slug);
  const location = useLocation();
  const navigate = useNavigate();
  // The draft on the device is read once, before the first paint; nothing is written before that.
  const [ready, setReady] = useState(false);
  const [base, setBase] = useState<{ updatedAt?: string }>({ updatedAt });
  const [restored, setRestored] = useState<{ at: string; draft: Draft }>();
  const [changedMeanwhile, setChangedMeanwhile] = useState(false);
  useLayoutEffect(() => {
    const storage = browserStorage();
    purgeDrafts(storage, new Date());
    const start = resolveStart({ draft: loadDraft(storage, key), fresh: isFresh(location.state), shown: startingDraft(values), updatedAt });
    if (start.discard) {
      clearDraft(storage, key);
      // The flag is used up: a reload from here on restores the new draft instead of starting fresh again.
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    if (start.restoredAt) {
      setCurrent(start.state);
      setBase(start.base);
      setRestored({ at: start.restoredAt, draft: start.state });
      setChangedMeanwhile(start.changedMeanwhile);
      // The step texts keep their own text while mounted, so they start over on what was restored.
      setResets((n) => n + 1);
    }
    setReady(true);
    // Once, on mount.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { kept, keepNow } = useDraftPersistence({
    key,
    state: current,
    initial: startingValues,
    base,
    uploading: photo === 'uploading',
    ready,
    isSaving: () => submitting.current,
  });
  // Writes the draft as the page is left, so the answer is true to that moment and not to the last write.
  useLeaveGuard(() => asksBeforeLeaving({ dirty, submitting: submitting.current }, keepNow));
  // Puts every field back to the starting values; the draft ends with it (the editor is not dirty any more).
  const reset = () => {
    clearDraft(browserStorage(), key);
    setCurrent(startingDraft(initial));
    setPhoto('ready');
    setResets((n) => n + 1);
  };
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
      {changedMeanwhile && (
        <output className="mt-4 grid gap-2 rounded-[0.625rem] border-3 border-ink bg-yel p-3 sm:flex sm:items-center sm:justify-between">
          <p className="font-extrabold">Dit recept is intussen gewijzigd</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setBase({ updatedAt });
                setChangedMeanwhile(false);
              }}
              className="min-h-11 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white px-3 font-black"
            >
              Concept houden
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setBase({ updatedAt });
                setChangedMeanwhile(false);
              }}
              className="min-h-11 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white px-3 font-black"
            >
              Opnieuw beginnen
            </button>
          </div>
        </output>
      )}
      <Form
        method="post"
        onSubmit={(e) => {
          // Enter in a field can submit while the save button is disabled; the photo must be settled first.
          if (photo !== 'ready') return e.preventDefault();
          submitting.current = true;
          // The latest state is on the device before the save starts, whatever happens to it.
          keepNow();
        }}
        className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12"
        noValidate
      >
        <input type="hidden" name={draftKeyField} value={key} />
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
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="text-2xl font-black">
              Ingrediënten
            </h2>
            <p className="mb-2 text-muted">Hoeveelheid eerst, dan de naam.</p>
            <IngredientList
              rows={current.ingredients}
              usedIn={(id) => usedIn(current.steps, id)}
              errors={errors.ingredients}
              onType={(id, value) => setCurrent((c) => typeIngredient(c, id, value))}
              onRemove={(id) => setCurrent((c) => removeIngredient(c, id))}
              onMove={(id, to) => setCurrent((c) => moveIngredient(c, id, to))}
            />
          </section>
          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-2xl font-black">
              Bereiding
            </h2>
            <p className="mb-2 text-muted">Eén stap per alinea. Enter aan het eind begint de volgende stap.</p>
            <input type="hidden" name="steps" value={JSON.stringify(storedSteps(current))} />
            <StepList
              key={resets}
              steps={current.steps}
              contexts={contexts}
              onChips={(id, change) => setCurrent((c) => changeChips(c, id, change))}
              onType={(id, body) => setCurrent((c) => editStep(c, id, body))}
              onEdit={(id, edit, body) => setCurrent((c) => editedStep(c, id, body, edit))}
              onAdd={(at) => setCurrent((c) => addStep(c, at))}
              onRemove={(id) => setCurrent((c) => removeStep(c, id))}
              onRestore={(step, at) => setCurrent((c) => restoreStep(c, step, at))}
              onMove={(id, to) => setCurrent((c) => moveStep(c, id, to))}
            />
          </section>
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
        <SaveBar cancelTo={cancelTo} busy={busy} saveBlocked={photo !== 'ready'} dirty={dirty} kept={kept} onReset={reset}>
          {restored && restored.draft === current && <span>Concept van {describeSavedAt(restored.at, new Date())} hersteld</span>}
          <OpenProposals count={proposalCount} />
          {photo === 'uploading' && <span>Foto wordt geüpload…</span>}
          {photo === 'error' && <span className="text-red">Foto is niet geüpload</span>}
        </SaveBar>
      </Form>
    </main>
  );
}
