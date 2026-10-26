import { useEffect, useId, useRef, useState } from 'react';
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
  /** The backdrop of the sheet was tapped. */
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
  // The name that was sent to save, so its message goes away as soon as the name changes.
  const [sent, setSent] = useState<string | null>(null);
  const result = fetcher.data;
  const failure = errorOf(result);
  const nameError = failure?.intent === 'save' && sent === name ? failure : undefined;
  const actionError = failure && failure.intent !== 'save' ? failure.error : undefined;
  const pending = fetcher.state !== 'idle';

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

  // No <form>: the answer is read from the fetcher, and Enter in the name does what "Opslaan" does.
  const send = (fields: Record<string, string>) => void fetcher.submit(fields, { method: 'post' });
  const save = () => {
    setSent(name);
    send({ intent: 'save', current: tag.name, name, category });
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
      <section
        data-testid="TagForm-form"
        aria-label="Tag bewerken"
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
              onKeyDown={(e) => e.key === 'Enter' && mode === 'main' && save()}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? `${id}-name-error` : undefined}
              className="block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-base font-bold text-ink focus:shadow-focus focus:outline-transparent aria-invalid:border-red"
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
            <SuggestInput id={`${id}-category`} items={categories} value={category} onValueChange={setCategory} placeholder="Geen categorie" />
            <p className="mt-1.5 text-sm font-bold text-muted">Kies een bestaande of typ een nieuwe. Leeg laten haalt de categorie weg.</p>
          </div>
        </div>
        <div data-testid="TagForm-actions" className="grid gap-2 border-t-2 border-dashed border-ink/20 pt-4">
          {mode === 'main' && <TagActions pending={pending} onSave={save} onMerge={() => setMode('merge')} onDelete={() => setMode('delete')} />}
          {mode === 'merge' && (
            <MergeActions
              tag={tag}
              others={names.filter((n) => n !== tag.name)}
              value={into}
              onValueChange={setInto}
              onConfirm={(target) => send({ intent: 'merge', from: tag.name, into: target })}
              onCancel={() => setMode('main')}
              pending={pending}
            />
          )}
          {mode === 'delete' && (
            <DeleteActions
              tag={tag}
              onConfirm={() => send({ intent: 'delete', name: tag.name })}
              onCancel={() => setMode('main')}
              pending={pending}
            />
          )}
          {actionError && (
            <p data-testid="TagForm-actionError" role="alert" className="font-extrabold text-red">
              {actionError}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
