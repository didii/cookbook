import { Autocomplete } from '@base-ui/react/autocomplete';
import { useState } from 'react';
import { cn } from '~app/shared/cn';

type Props = {
  /** The suggestions: any text that contains what is typed (letter case and accents ignored). */
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
  /** The id of the input, for the label that names the field. */
  id: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/** Free-text field with suggestions: text that matches no suggestion stays as typed. */
export function SuggestInput({ items, value, onValueChange, id, placeholder, invalid, describedBy, className }: Props) {
  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });
  const [open, setOpen] = useState(false);
  // No match means nothing to pick, so the popup closes instead of showing an empty box.
  const hasMatches = items.some((item) => contains(item, value));

  return (
    <Autocomplete.Root
      items={items}
      value={value}
      onValueChange={onValueChange}
      open={open && hasMatches}
      onOpenChange={setOpen}
      filter={contains}
      openOnInputClick
      autoHighlight={false}
    >
      <Autocomplete.Input
        id={id}
        data-testid="SuggestInput-field"
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-base font-bold text-ink placeholder:font-medium placeholder:text-muted focus:shadow-focus focus:outline-transparent aria-invalid:border-red',
          className,
        )}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="z-40 w-(--anchor-width)">
          <Autocomplete.Popup className="max-h-60 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-sm">
            <Autocomplete.List>
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  data-testid="SuggestInput-option"
                  className="flex min-h-11 cursor-pointer items-center px-3 text-base font-bold data-highlighted:bg-yel"
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
