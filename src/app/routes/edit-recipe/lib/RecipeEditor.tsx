import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Form, Link, useLocation, useNavigate, useNavigation, useRouteLoaderData } from 'react-router';
import { cn } from '~app/shared/cn';
import { AuthorInput } from '~app/shared/components';
import { ChevronBack } from '~app/shared/icons';
import type { RecipeFormErrors, RecipeFormField } from '~app/shared/recipeValidation';
import type { Rules } from '~app/shared/rules';
import { proposals, usedIn } from './chips';
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
  type DraftSeed,
  type RecipeDraft,
} from './draft';
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
} from './draftStore';
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
  initial: DraftSeed;
  /** What the editor shows when it opens: the starting values, or the values of a refused submit. */
  values: DraftSeed;
  errors: RecipeFormErrors;
  /** Index of the tile band shown under the photo. */
  tile: number;
  /** The recipe's seal, shown on the photo; a new recipe gets one chosen up front and posts it, so it is the one that gets saved. */
  seal?: string;
  /** Where "Terug" leads: the recipe, or the home page for a new recipe. */
  cancelTo: string;
  /** The recognition rules in force; the editor keeps the ones it was first given. */
  rules: Rules;
  /** The recipe's slug, or none for a new recipe: what its draft on the device belongs to. */
  slug?: string;
  /** When the stored recipe was last saved (none for a new recipe): a draft started from another version is flagged. */
  updatedAt?: string;
};

const inputClass =
  'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink hover:not-focus:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)] focus:shadow-focus focus:outline-transparent aria-invalid:border-red';
const labelClass = 'font-extrabold';
const asterisk = (
  <span aria-hidden="true" className="ml-1 font-black text-red">
    *
  </span>
);

/** The one page for creating and editing a recipe; the routes only differ in the values, heading and cancel target they pass. */
export function RecipeEditor({ rules: rulesNow, heading, authors, initial, values, errors, tile, seal, cancelTo, slug, updatedAt }: Props) {
  // The rules the edit started with stay for the whole edit: a save by an admin meanwhile does not change an open draft.
  const [rules] = useState(rulesNow);
  const [current, setCurrent] = useState(() => startingDraft(rules, values));
  const [photo, setPhoto] = useState<PhotoState>('ready');
  // Bumped by Herstel so the photo field starts over: it drops a running upload and its preview.
  const [resets, setResets] = useState(0);
  const busy = useNavigation().formMethod != null;
  const startingValues = startingDraft(rules, initial);
  const dirty = isDirty(startingValues, current, rules);
  const contexts = stepContexts(current, rules);
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
  const [restored, setRestored] = useState<{ at: string; draft: RecipeDraft }>();
  const [changedMeanwhile, setChangedMeanwhile] = useState(false);
  useLayoutEffect(() => {
    const storage = browserStorage();
    purgeDrafts(storage, new Date());
    const start = resolveStart({ draft: loadDraft(storage, key), fresh: isFresh(location.state), shown: startingDraft(rules, values), updatedAt });
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
    rules,
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
    setCurrent(startingDraft(rules, initial));
    setPhoto('ready');
    setResets((n) => n + 1);
  };
  const set = (name: RecipeFormField) => (value: string) => setCurrent((c) => ({ ...c, [name]: value }));
  const text = (name: RecipeFormField) => ({
    id: name,
    name,
    value: current[name],
    onChange: (e: { target: { value: string } }) => set(name)(e.target.value),
    'aria-invalid': errors[name] ? (true as const) : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });
  const error = (name: RecipeFormField) =>
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
    <main id="main" className="mx-auto max-w-290 px-[max(1rem,4vw)] pt-6 pb-[50vh]">
      <h1 data-testid="RecipeEditor-heading" className="sr-only">
        {heading}
      </h1>
      <Link
        to={cancelTo}
        data-testid="RecipeEditor-cancel"
        className="inline-flex min-h-11 items-center gap-1 font-extrabold text-muted underline-offset-[0.25em] hover:text-ink hover:underline"
      >
        <ChevronBack className="-ml-1.5" /> Terug
      </Link>
      <p data-testid="RecipeEditor-required" className="mt-1 text-lg text-muted">
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
          // The latest state is on the device before the save starts, whatever happens to it; once the save runs nothing is written any more.
          keepNow();
          submitting.current = true;
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
              data-testid="RecipeEditor-title"
              type="text"
              autoComplete="off"
              required
              placeholder="Naam van het gerecht"
              className="block w-full border-0 border-b-3 border-dashed border-ink/35 bg-transparent pt-[0.1em] pb-[0.15em] text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] font-black tracking-[-0.03em] text-ink placeholder:text-ink/35 hover:not-focus:bg-ink/5 focus:border-solid focus:border-blu focus:outline-transparent aria-invalid:border-red"
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
              rules={rules}
              usedIn={(id) => usedIn(current.steps, id)}
              errors={errors.ingredients}
              onType={(id, value) => setCurrent((c) => typeIngredient(c, id, value, rules))}
              onRemove={(id) => setCurrent((c) => removeIngredient(c, id, rules))}
              onMove={(id, to) => setCurrent((c) => moveIngredient(c, id, to, rules))}
            />
          </section>
          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-2xl font-black">
              Bereiding
            </h2>
            <p className="mb-2 text-muted">
              Eén stap per alinea. Enter gaat naar de volgende stap; typ in de lege stap onderaan om er een toe te voegen.
            </p>
            <input type="hidden" name="steps" value={JSON.stringify(storedSteps(current, rules))} />
            <StepList
              key={resets}
              steps={current.steps}
              contexts={contexts}
              onChips={(id, change) => setCurrent((c) => changeChips(c, id, change, rules))}
              onType={(id, body) => setCurrent((c) => editStep(c, id, body))}
              onEdit={(id, edit, body) => setCurrent((c) => editedStep(c, id, body, edit, rules))}
              onAdd={(at) => setCurrent((c) => addStep(c, at))}
              onRemove={(id) => setCurrent((c) => removeStep(c, id, rules))}
              onRestore={(step, at) => setCurrent((c) => restoreStep(c, step, at, rules))}
              onMove={(id, to) => setCurrent((c) => moveStep(c, id, to))}
            />
          </section>
        </div>
        <div className="order-first grid gap-5 lg:sticky lg:top-4 lg:order-0">
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
            <input {...text('time')} type="text" autoComplete="off" placeholder="1u30" className={inputClass} />
          </div>
          <PhotoField key={resets} value={current.image} onChange={set('image')} onStateChange={setPhoto} tile={tile} seal={seal} />
          {seal && <input type="hidden" name="seal" value={seal} />}
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
