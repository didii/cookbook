import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { Form, Link, useLocation, useNavigate, useNavigation, useRouteLoaderData } from 'react-router';
import { cn } from '~app/shared/cn';
import { AuthorInput } from '~app/shared/components';
import { ChevronBack } from '~app/shared/icons';
import type { Rules } from '~app/shared/rules';
import { DeleteRecipe } from './DeleteRecipe';
import {
  addStep,
  changeChips,
  editedStep,
  editStep,
  importedDraft,
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
  type Start,
} from './draftStore';
import { fetchImage } from './import/fetchImage';
import { ImportBox } from './import/ImportBox';
import type { ImportedRecipe } from './import/readRecipe';
import { IngredientList } from './ingredients/IngredientList';
import { PhotoField, type PhotoState } from './photo/PhotoField';
import { limits, type RecipeFormErrors, type RecipeFormField } from './recipeValidation';
import { RestoreDraftDialog } from './RestoreDraftDialog';
import { SaveBar } from './SaveBar';
import { proposals, usedIn } from './steps/chips';
import { OpenProposals } from './steps/OpenProposals';
import { StepList } from './steps/StepList';
import { TagInput } from './TagInput';
import { toDraftSeed } from './toDraftSeed';
import { useDraftPersistence } from './useDraftPersistence';
import { useLeaveGuard } from './useLeaveGuard';

interface RecipeEditorProps extends ComponentProps<'main'> {
  /** Visually hidden page heading. */
  heading: string;
  authors: string[];
  /** Every stored tag, to suggest. */
  tags: string[];
  /** The category of the stored tags that have one, shown next to their suggestion. */
  tagCategories?: Record<string, string>;
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
  /** Show only a field for a web address while the form is untouched; the form follows once a recipe is imported. Only the import page sets it. */
  canImport?: boolean;
}

const inputClass =
  'mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink hover:not-focus:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)] focus:shadow-focus focus:outline-transparent aria-invalid:border-red';
const labelClass = 'font-extrabold';
const asterisk = (
  <span aria-hidden="true" className="ml-1 font-black text-red">
    *
  </span>
);

/** The one page for creating and editing a recipe; the routes only differ in the values, heading and cancel target they pass. */
export function RecipeEditor({
  rules: rulesNow,
  heading,
  authors,
  tags,
  tagCategories,
  initial,
  values,
  errors,
  tile,
  seal,
  cancelTo,
  slug,
  updatedAt,
  canImport,
  className,
  ...props
}: RecipeEditorProps) {
  // The rules the edit started with stay for the whole edit: a save by an admin meanwhile does not change an open draft.
  const [rules] = useState(rulesNow);
  const [current, setCurrent] = useState(() => startingDraft(rules, values));
  const [photo, setPhoto] = useState<PhotoState>('ready');
  // The imported photo, handed to the photo field; and whether fetching it failed.
  const [incoming, setIncoming] = useState<{ blob: Blob }>();
  const [photoSkipped, setPhotoSkipped] = useState(false);
  // Counts imports and resets, so an image that arrives after a reset is dropped.
  const imports = useRef(0);
  // Bumped by Herstel so the photo field starts over: it drops a running upload and its preview.
  const [resets, setResets] = useState(0);
  const busy = useNavigation().formMethod != null;
  const startingValues = startingDraft(rules, initial);
  const dirty = isDirty(startingValues, current, rules);
  const offerImport = canImport && !dirty;
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
  // The draft of a new recipe shows in the form behind the popup and stays here until the family member chose to use or discard it.
  const [pending, setPending] = useState<Start>();
  const applyStart = (start: Start) => {
    setCurrent(start.state);
    setBase(start.base);
    // A new recipe asks first, so its form needs no line saying a draft was restored.
    if (slug !== undefined) setRestored({ at: start.restoredAt!, draft: start.state });
    setChangedMeanwhile(start.changedMeanwhile);
    // The step texts keep their own text while mounted, so they start over on what was restored.
    setResets((n) => n + 1);
  };
  useLayoutEffect(() => {
    const storage = browserStorage();
    purgeDrafts(storage, new Date());
    const start = resolveStart({ draft: loadDraft(storage, key), fresh: isFresh(location.state), shown: startingDraft(rules, values), updatedAt });
    if (start.discard) {
      clearDraft(storage, key);
      // The flag is used up: a reload from here on restores the new draft instead of starting fresh again.
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    if (start.restoredAt) applyStart(start);
    if (start.restoredAt && slug === undefined) {
      setPending(start);
      return;
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
    imports.current++;
    setIncoming(undefined);
    setPhotoSkipped(false);
    setPhoto('ready');
    setResets((n) => n + 1);
  };
  // Fills the form from the imported recipe, then fetches its photo and hands it to the photo field; a photo that fails never undoes the import.
  const importRecipe = async (imported: ImportedRecipe, address: string) => {
    const { seed, imageUrl } = toDraftSeed(imported, address, initial);
    const run = ++imports.current;
    setCurrent(importedDraft(rules, seed));
    setIncoming(undefined);
    setPhotoSkipped(false);
    // The step texts keep their own text while mounted, so they start over on what was imported.
    setResets((n) => n + 1);
    if (!imageUrl) return;
    const blob = await fetchImage(imageUrl);
    if (run !== imports.current) return;
    if (blob) setIncoming({ blob });
    else setPhotoSkipped(true);
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
  const error = (name: RecipeFormField | 'tags') =>
    errors[name] && (
      <p id={`${name}-error`} className="mt-1 font-bold text-red">
        {errors[name]}
      </p>
    );

  // After a refused submit, focus goes to the first thing in error, in page order, so its label and message are read. A list focuses its own row when it is the first.
  const firstInError = (['title', 'intro', 'ingredients', 'steps', 'author', 'source', 'servings', 'time', 'tags'] as const).find(
    (name) => errors[name],
  );
  useEffect(() => {
    if (firstInError && firstInError !== 'ingredients' && firstInError !== 'steps') document.getElementById(firstInError)?.focus();
    // Only when the errors change, not on every keystroke.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [errors]);

  return (
    <main {...props} id="main" className={cn('mx-auto max-w-290 px-[max(1rem,4vw)] pt-6 pb-[50vh]', className)}>
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
      {offerImport && (
        <>
          <ImportBox onImported={importRecipe} className="mt-4" />
          <Link to="/recepten/nieuw" data-testid="RecipeEditor-typeItself" className="mt-4 inline-block font-black text-blu hover:underline">
            Zelf typen
          </Link>
        </>
      )}
      {/* The import page shows the form only after an import (or a restored draft). */}
      {!offerImport && (
        <Form
          method="post"
          data-testid="RecipeEditor-form"
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
                maxLength={limits.title}
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
              <textarea {...text('intro')} data-testid="RecipeEditor-intro" maxLength={limits.intro} rows={4} className={cn(inputClass, 'py-2')} />
              {error('intro')}
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
                focusErrors={firstInError === 'ingredients'}
                maxLength={limits.ingredientLine}
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
                errors={errors.steps}
                focusErrors={firstInError === 'steps'}
                maxLength={limits.step}
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
                id="author"
                authors={authors}
                value={current.author}
                onValueChange={set('author')}
                maxLength={limits.author}
                invalid={!!errors.author}
                describedBy={errors.author ? 'author-error' : undefined}
                className={inputClass}
              />
              {error('author')}
            </div>
            <div>
              <label htmlFor="source" className={labelClass}>
                Bron
              </label>
              <input
                {...text('source')}
                data-testid="RecipeEditor-source"
                maxLength={limits.source}
                type="text"
                autoComplete="off"
                placeholder="Een naam of een link"
                className={inputClass}
              />
              {error('source')}
            </div>
            <div>
              <label htmlFor="servings" className={labelClass}>
                Aantal porties
              </label>
              <input
                {...text('servings')}
                data-testid="RecipeEditor-servings"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
              {error('servings')}
            </div>
            <div>
              <label htmlFor="time" className={labelClass}>
                Bereidingstijd
              </label>
              <input
                {...text('time')}
                data-testid="RecipeEditor-time"
                maxLength={limits.time}
                type="text"
                autoComplete="off"
                placeholder="1u30"
                className={inputClass}
              />
              {error('time')}
            </div>
            <div>
              <label htmlFor="tags" className={labelClass}>
                Tags
              </label>
              <input type="hidden" name="tags" data-testid="RecipeEditor-tags" value={JSON.stringify(current.tags)} />
              <TagInput
                id="tags"
                tags={tags}
                tagCategories={tagCategories}
                value={current.tags}
                onValueChange={(next) => setCurrent((c) => ({ ...c, tags: next }))}
                invalid={!!errors.tags}
                describedBy={errors.tags ? 'tags-error' : undefined}
              />
              {error('tags')}
            </div>
            <PhotoField
              key={resets}
              value={current.image}
              incoming={incoming}
              onPhotoChange={(path) => (setPhotoSkipped(false), set('image')(path))}
              onStateChange={(state) => (state === 'uploading' && setPhotoSkipped(false), setPhoto(state))}
              tile={tile}
              seal={seal}
            />
            {photoSkipped && (
              <p data-testid="RecipeEditor-photoSkipped" className="-mt-3 font-bold text-red">
                De foto is overgeslagen.
              </p>
            )}
            {seal && <input type="hidden" name="seal" value={seal} />}
          </div>
          <SaveBar cancelTo={cancelTo} busy={busy} saveBlocked={photo !== 'ready'} dirty={dirty} kept={kept} onFormReset={reset}>
            {restored && restored.draft === current && (
              <span data-testid="RecipeEditor-restored">Concept van {describeSavedAt(restored.at, new Date())} hersteld</span>
            )}
            <OpenProposals count={proposalCount} />
            {photo === 'uploading' && <span>Foto wordt geüpload…</span>}
            {photo === 'error' && <span className="text-red">Foto is niet geüpload</span>}
          </SaveBar>
        </Form>
      )}
      {/* Outside the save form (forms cannot nest); it posts to its own route. */}
      {slug && <DeleteRecipe headingText={initial.title} slug={slug} />}
      {pending && (
        <RestoreDraftDialog
          draft={pending.state}
          savedAt={pending.restoredAt!}
          onUse={() => {
            setPending(undefined);
            setReady(true);
          }}
          onDiscard={() => {
            reset();
            setPending(undefined);
            setReady(true);
          }}
        />
      )}
    </main>
  );
}
