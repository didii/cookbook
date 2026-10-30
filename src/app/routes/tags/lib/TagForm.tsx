import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import { useFetcher } from 'react-router';
import { Button, Pill } from '~app/shared/components';
import type { ManagedTag } from '~app/shared/tags';
import { errorOf, type ActionResult } from './actionResult';
import { DeleteActions } from './DeleteActions';
import { MergeActions } from './MergeActions';
import { SuggestInput } from './SuggestInput';
import { TagActions } from './TagActions';

interface TagFormProps {
  tag: ManagedTag;
  /** Every stored tag name (to merge with) and category (to suggest). */
  names: string[];
  categories: string[];
  /** Escape or the backdrop of the sheet: close the form. */
  onClose: () => void;
  /** Saved, merged or deleted: the answer's confirmation. Must keep its identity between renders. */
  onDone: (message: string) => void;
}

type Mode = 'main' | 'merge' | 'delete';

const label = 'mb-1 block text-[0.9375rem] font-black';

/** The form of one tag: bottom sheet below 48rem, panel under the row from 48rem. The fields stay mounted while the actions part below them swaps. */
export function TagForm({ tag, names, categories, onClose, onDone }: TagFormProps) {
  const fetcher = useFetcher<ActionResult>();
  const id = useId();
  const nameField = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(tag.name);
  const [category, setCategory] = useState(tag.category ?? '');
  const [mode, setMode] = useState<Mode>('main');
  const [into, setInto] = useState('');
  // The values that were sent to save, so a message goes away as soon as its field changes.
  const [sent, setSent] = useState<{ name: string; category: string } | null>(null);
  const result = fetcher.data;
  const failure = errorOf(result);
  const saveFailure = failure?.intent === 'save' ? failure : undefined;
  const categoryError = saveFailure?.field === 'category' && sent?.category === category ? saveFailure : undefined;
  const nameError = saveFailure && saveFailure.field !== 'category' && sent?.name === name ? saveFailure : undefined;
  const actionError = failure && failure.intent !== 'save' ? failure.error : undefined;
  const pending = fetcher.state !== 'idle';
  const others = names.filter((n) => n !== tag.name);
  // Only a stored tag other than this one counts, whatever the letter case of the text.
  const chosen = others.find((n) => n.toLowerCase() === into.trim().toLowerCase());

  useEffect(() => {
    nameField.current?.focus();
  }, []);

  useEffect(() => {
    if (result && 'done' in result) onDone(result.done);
  }, [result, onDone]);

  // The sheet covers the page below 48rem, so the page behind it must not scroll.
  useEffect(() => {
    if (!window.matchMedia('(max-width: 47.99rem)').matches) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  // What Enter or the submit button of the actions part does depends on which part is shown.
  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (pending) return;
    if (mode === 'main') {
      setSent({ name, category });
      void fetcher.submit({ intent: 'save', current: tag.name, name, category }, { method: 'post' });
    } else if (mode === 'merge' && chosen) void fetcher.submit({ intent: 'merge', from: tag.name, into: chosen }, { method: 'post' });
    else if (mode === 'delete') void fetcher.submit({ intent: 'delete', name: tag.name }, { method: 'post' });
  };

  return (
    <>
      <button
        type="button"
        data-testid="TagForm-backdrop"
        aria-label="Sluit het formulier"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-20 cursor-default bg-ink/45 md:hidden"
      />
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape inside the form's fields; the fields are the interactive elements. */}
      <form
        data-testid="TagForm-form"
        aria-label="Tag bewerken"
        noValidate
        onSubmit={submit}
        onKeyDown={(e) => {
          // Escape in an open suggestion list only closes that list.
          if (e.key === 'Escape' && (e.target as HTMLElement).getAttribute('aria-expanded') !== 'true') onClose();
        }}
        className="grid gap-4 border-t-2 border-ink bg-por px-3 pt-4 pb-5 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-21 max-md:max-h-[88dvh] max-md:animate-rise max-md:overflow-auto max-md:rounded-t-2xl max-md:border-t-3 max-md:px-[max(1rem,4vw)] motion-reduce:animate-none"
      >
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          <div>
            <label htmlFor={`${id}-name`} className={label}>
              Naam
            </label>
            <input
              ref={nameField}
              id={`${id}-name`}
              data-testid="TagForm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? `${id}-name-error` : undefined}
              className="block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-base font-bold text-ink hover:not-focus:bg-hover focus:shadow-focus focus:outline-transparent aria-invalid:border-red"
            />
            {nameError && (
              <div id={`${id}-name-error`}>
                <p data-testid="TagForm-error" role="alert" className="mt-1.5 font-extrabold text-red">
                  {nameError.error}
                </p>
                {nameError.code === 'taken' && nameError.taken && (
                  <Button
                    type="button"
                    data-testid="TagForm-offerMerge"
                    className="mt-2 flex min-h-10 flex-none items-center gap-1.5 px-3 text-base"
                    onClick={() => {
                      setInto(nameError.taken ?? '');
                      setMode('merge');
                    }}
                  >
                    Voeg samen met <Pill>{nameError.taken}</Pill>
                  </Button>
                )}
              </div>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-category`} className={label}>
              Categorie
            </label>
            <SuggestInput
              id={`${id}-category`}
              items={categories}
              value={category}
              onValueChange={setCategory}
              placeholder="Geen categorie"
              invalid={!!categoryError}
              describedBy={categoryError ? `${id}-category-error` : undefined}
            />
            {categoryError && (
              <p id={`${id}-category-error`} data-testid="TagForm-categoryError" role="alert" className="mt-1.5 font-extrabold text-red">
                {categoryError.error}
              </p>
            )}
            <p className="mt-1.5 text-sm font-bold text-muted">Kies een bestaande of typ een nieuwe. Leeg laten haalt de categorie weg.</p>
          </div>
        </div>
        <div data-testid="TagForm-actions" className="grid gap-2 border-t-2 border-dashed border-ink/20 pt-4">
          {mode === 'main' && <TagActions pending={pending} onMerge={() => setMode('merge')} onDelete={() => setMode('delete')} />}
          {mode === 'merge' && (
            <MergeActions
              tag={tag}
              others={others}
              value={into}
              onValueChange={setInto}
              chosen={chosen}
              onCancel={() => setMode('main')}
              pending={pending}
            />
          )}
          {mode === 'delete' && <DeleteActions tag={tag} onCancel={() => setMode('main')} pending={pending} />}
          {actionError && (
            <p data-testid="TagForm-actionError" role="alert" className="font-extrabold text-red">
              {actionError}
            </p>
          )}
        </div>
      </form>
    </>
  );
}
