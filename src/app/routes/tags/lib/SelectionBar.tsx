import { useEffect, useId, useState, type FormEvent } from 'react';
import { useFetcher } from 'react-router';
import { Button } from '~app/shared/components';
import { useKeyboardOffset } from '~app/shared/useKeyboardOffset';
import { errorOf, type ActionResult } from './actionResult';
import { SuggestInput } from './SuggestInput';

interface SelectionBarProps {
  /** The names of the selected tags. */
  selected: string[];
  categories: string[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  /** The category was set: the answer's confirmation. The selection should be emptied. Must keep its identity between renders. */
  onDone: (message: string) => void;
}

const link =
  'min-h-11 cursor-pointer px-1 font-extrabold text-blu underline decoration-2 underline-offset-3 hover:text-red focus-visible:outline-offset-0';

/** Select mode: how many tags are selected, "Alles selecteren" (the filtered list) and "Niets", and one category to set on all of them. Fixed to the bottom of the screen, above the keyboard. */
export function SelectionBar({ selected, categories, onSelectAll, onSelectNone, onDone }: SelectionBarProps) {
  const fetcher = useFetcher<ActionResult>();
  const id = useId();
  const [category, setCategory] = useState('');
  const result = fetcher.data;
  const error = errorOf(result)?.intent === 'bulk' ? errorOf(result)?.error : undefined;
  useKeyboardOffset();

  // A set category empties the field: reset while rendering the answer, not in an effect.
  const [seen, setSeen] = useState(result);
  if (result !== seen) {
    setSeen(result);
    if (result && 'done' in result) setCategory('');
  }

  useEffect(() => {
    if (result && 'done' in result) onDone(result.done);
  }, [result, onDone]);

  const apply = (e: FormEvent) => {
    e.preventDefault();
    if (selected.length === 0 || fetcher.state !== 'idle') return;
    const form = new FormData();
    form.set('intent', 'bulk');
    form.set('category', category);
    for (const name of selected) form.append('name', name);
    void fetcher.submit(form, { method: 'post' });
  };

  return (
    <div
      data-testid="SelectionBar-bar"
      className="fixed inset-x-0 bottom-(--kb,0px) z-10 border-t-3 border-ink bg-por pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-3xl gap-2.5 px-[max(1rem,4vw)] py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <output data-testid="SelectionBar-count" className="font-black">
            {selected.length} geselecteerd
          </output>
          <span className="flex gap-3">
            <button type="button" data-testid="SelectionBar-all" onClick={onSelectAll} className={link}>
              Alles selecteren
            </button>
            <button type="button" data-testid="SelectionBar-none" onClick={onSelectNone} className={link}>
              Niets
            </button>
          </span>
        </div>
        <form onSubmit={apply} noValidate className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div>
            <label htmlFor={id} className="sr-only">
              Categorie voor de selectie
            </label>
            <SuggestInput id={id} items={categories} value={category} onValueChange={setCategory} placeholder="Categorie voor de selectie" />
          </div>
          <Button
            type="submit"
            main
            data-testid="SelectionBar-apply"
            disabled={selected.length === 0 || fetcher.state !== 'idle'}
            className="min-h-12 flex-none px-4 text-base"
          >
            Instellen
          </Button>
        </form>
        {error && (
          <p data-testid="SelectionBar-error" role="alert" className="font-extrabold text-red">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
