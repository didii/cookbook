import { Combobox } from '@base-ui/react/combobox';
import { useState } from 'react';
import { sortTags } from '~app/shared/tags';
import { maxTagLength } from './recipeValidation';

type Props = {
  /** Every stored tag, to suggest. */
  tags: string[];
  /** The picked tags. */
  value: string[];
  onValueChange: (tags: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
};

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Multi-select for tags: suggests the stored tags that contain the typed text, and offers text that matches none as a new tag. Picked tags are shown alphabetically, each with a button to remove it. */
export function TagInput({ tags, value, onValueChange, invalid, describedBy }: Props) {
  // Ignores letter case and accents: "soep" finds "Soép".
  const { contains } = Combobox.useFilter({ sensitivity: 'base' });
  const [text, setText] = useState('');
  const typed = text.trim();
  const suggestions = tags.filter((t) => !value.includes(t) && contains(t, typed));
  // The offer comes first, so Enter on text that matches no stored tag adds it, and on text that does picks the stored tag (the first suggestion).
  const offersNew = typed !== '' && ![...tags, ...value].some((t) => sameTag(t, typed));
  const items = offersNew ? [typed, ...suggestions] : suggestions;

  return (
    <Combobox.Root
      multiple
      items={items}
      filter={null}
      value={value}
      onValueChange={(next) => {
        onValueChange(sortTags(next));
        setText('');
      }}
      inputValue={text}
      onInputValueChange={(next) => setText(next.slice(0, maxTagLength))}
      autoHighlight
    >
      <Combobox.Chips
        data-testid="TagInput-chips"
        className="mt-1 flex min-h-13 flex-wrap items-center gap-1.5 rounded-[0.625rem] border-3 border-ink bg-white px-2 py-1.5 focus-within:shadow-focus has-aria-invalid:border-red"
      >
        <Combobox.Value>
          {(picked: string[]) =>
            picked.map((tag) => (
              <Combobox.Chip
                key={tag}
                data-testid="TagInput-chip"
                className="flex items-center gap-1 rounded-full border-2 border-ink bg-yel py-0.5 pr-1 pl-3 font-bold"
              >
                <span data-testid="TagInput-tag">{tag}</span>
                <Combobox.ChipRemove
                  data-testid="TagInput-remove"
                  aria-label={`${tag} verwijderen`}
                  className="grid size-8 cursor-pointer place-items-center rounded-full font-black hover:bg-ink/10"
                >
                  <span aria-hidden="true">×</span>
                </Combobox.ChipRemove>
              </Combobox.Chip>
            ))
          }
        </Combobox.Value>
        <Combobox.Input
          id="tags"
          data-testid="TagInput-field"
          maxLength={maxTagLength}
          autoComplete="off"
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 min-w-32 flex-1 bg-transparent px-1 text-lg text-ink focus:outline-transparent"
        />
      </Combobox.Chips>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-10 w-(--anchor-width)">
          <Combobox.Popup className="max-h-60 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-sm empty:hidden">
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  data-testid="TagInput-option"
                  className="flex min-h-11 cursor-pointer items-center px-3 text-lg font-bold data-highlighted:bg-yel"
                >
                  {tags.includes(item) ? item : `Toevoegen: "${item}"`}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
