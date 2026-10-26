import { Combobox } from '@base-ui/react/combobox';
import { useState } from 'react';

type Props = {
  /** Every value that can be picked. */
  options: string[];
  /** The picked values. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Shown while nothing is picked. */
  placeholder: string;
  /** Names the field for assistive technology. */
  label: string;
};

/** Multi-select with autocomplete over fixed options: typing narrows the suggestions (letter case and accents ignored), picked values are not suggested again and show as chips with a remove button. Offers no new values. */
export function MultiSelect({ options, value, onValueChange, placeholder, label }: Props) {
  const { contains } = Combobox.useFilter({ sensitivity: 'base' });
  const [text, setText] = useState('');
  const items = options.filter((o) => !value.includes(o) && contains(o, text.trim()));

  return (
    <Combobox.Root
      multiple
      items={items}
      filter={null}
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
        setText('');
      }}
      inputValue={text}
      onInputValueChange={setText}
      autoHighlight
    >
      <Combobox.Chips
        data-testid="MultiSelect-chips"
        className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-[0.625rem] border-3 border-ink bg-white px-2 py-1 focus-within:shadow-focus"
      >
        <Combobox.Value>
          {(picked: string[]) =>
            picked.map((item) => (
              <Combobox.Chip
                key={item}
                data-testid="MultiSelect-chip"
                className="flex items-center gap-1 rounded-full border-2 border-ink bg-yel py-0.5 pr-1 pl-3 font-bold"
              >
                <span data-testid="MultiSelect-value">{item}</span>
                <Combobox.ChipRemove
                  data-testid="MultiSelect-remove"
                  aria-label={`${item} verwijderen`}
                  className="grid size-8 cursor-pointer place-items-center rounded-full font-black hover:bg-ink/10"
                >
                  <span aria-hidden="true">×</span>
                </Combobox.ChipRemove>
              </Combobox.Chip>
            ))
          }
        </Combobox.Value>
        <Combobox.Input
          data-testid="MultiSelect-field"
          aria-label={label}
          placeholder={value.length === 0 ? placeholder : undefined}
          autoComplete="off"
          className="min-h-10 min-w-24 flex-1 bg-transparent px-1 text-base font-bold text-ink placeholder:font-medium placeholder:text-muted focus:outline-transparent"
        />
      </Combobox.Chips>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-20 w-(--anchor-width)">
          <Combobox.Popup className="max-h-60 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-sm empty:hidden">
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  data-testid="MultiSelect-option"
                  className="flex min-h-11 cursor-pointer items-center px-3 text-base font-bold data-highlighted:bg-yel"
                >
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
