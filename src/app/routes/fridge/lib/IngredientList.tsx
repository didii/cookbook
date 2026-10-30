import { useId, useRef, useState } from 'react';
import { cn } from '~app/shared/cn';
import { control } from '~app/shared/control';
import { hoverDarken, hoverField, hoverTint } from '~app/shared/hover';
import { Cross, Minus, Plus } from '~app/shared/icons';
import { press } from '~app/shared/press';
import { cleanEntry, sameEntry } from './fold';
import type { ListKind } from './lists';

type Props = {
  /** `heb` is "Heb ik" (blue +), `zonder` is "Liever niet" (−). */
  kind: ListKind;
  entries: string[];
  onAdd: (text: string) => void;
  onRemove: (entry: string) => void;
};

const copy = {
  heb: { label: 'Heb ik', placeholder: 'Wat heb je nog?', field: 'Ingrediënt dat ik heb', add: 'Voeg toe aan Heb ik' },
  zonder: { label: 'Liever niet', placeholder: 'Wat wil je niet?', field: 'Ingrediënt dat ik liever niet wil', add: 'Voeg toe aan Liever niet' },
};

/** One list of the fridge page: a label, an input with a button, and the entries as removable chips. Enter or the button adds the text and keeps the focus in the input; a cross removes a chip and moves the focus to the input. */
export function IngredientList({ kind, entries, onAdd, onRemove }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const { label, placeholder, field, add } = copy[kind];
  const have = kind === 'heb';

  const submit = () => {
    const entry = cleanEntry(text);
    if (entry && !entries.some((x) => sameEntry(x, entry))) onAdd(entry);
    setText('');
    input.current?.focus();
  };

  return (
    <div data-testid="IngredientList-list" data-kind={kind}>
      <label htmlFor={id} data-testid="IngredientList-label" className="mb-2 block font-black">
        {label}
      </label>
      <div data-testid="IngredientList-entryRow" className="flex gap-2">
        <input
          ref={input}
          id={id}
          data-testid="IngredientList-input"
          type="text"
          value={text}
          placeholder={placeholder}
          aria-label={field}
          enterKeyHint="enter"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
            e.preventDefault();
            submit();
          }}
          className={cn(
            'min-h-12 min-w-0 flex-1 rounded-[0.625rem] border-3 border-ink bg-white px-3 text-base font-bold text-ink placeholder:font-medium placeholder:text-muted focus-visible:outline-offset-0',
            hoverField,
          )}
        />
        <button
          type="button"
          data-testid="IngredientList-button"
          onClick={submit}
          aria-label={add}
          className={cn(control, press, 'size-12 shrink-0 p-0', have ? `bg-blu text-white ${hoverDarken}` : `bg-white ${hoverTint}`)}
        >
          {have ? <Plus className="size-5.5 stroke-[3.5]" /> : <Minus className="size-5.5 stroke-[3.5]" />}
        </button>
      </div>
      {entries.length > 0 && (
        <ul data-testid="IngredientList-chips" className="mt-3 flex list-none flex-wrap gap-2 p-0">
          {entries.map((entry) => (
            <li
              key={entry}
              data-testid="IngredientList-chip"
              className={cn(
                'inline-flex min-h-9 items-center gap-0.5 rounded-[0.625rem] border-3 border-ink py-0 pr-0.5 pl-2.5 text-[0.9375rem] leading-none font-black',
                have ? 'bg-blu text-white' : 'border-dashed bg-white',
              )}
            >
              <span data-testid="IngredientList-entry">{entry}</span>
              <button
                type="button"
                data-testid="IngredientList-remove"
                aria-label={`Haal ${entry} weg uit ${label}`}
                onClick={() => {
                  onRemove(entry);
                  input.current?.focus();
                }}
                className={cn('grid size-8 cursor-pointer place-items-center rounded-lg', have ? `bg-blu ${hoverDarken}` : `bg-white ${hoverTint}`)}
              >
                <Cross className="size-3.5 stroke-[3.5]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
