import { Autocomplete } from '@base-ui/react/autocomplete';
import { useState } from 'react';

type Props = {
  authors: string[];
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/** Free-text author field that suggests the authors already on stored recipes; a name that isn't listed is submitted as typed. */
export function AuthorInput({ authors, value, onValueChange, invalid, describedBy, className }: Props) {
  // Ignores letter case and accents: "oma" finds "Oma".
  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });
  const [open, setOpen] = useState(false);
  // No match means nothing to pick, so the popup closes instead of showing an empty box (APG: the popup is shown only while it has options).
  const hasMatches = authors.some((a) => contains(a, value));

  return (
    <Autocomplete.Root
      items={authors}
      name="author"
      value={value}
      onValueChange={onValueChange}
      open={open && hasMatches}
      onOpenChange={setOpen}
      filter={contains}
      openOnInputClick
      autoHighlight={false}
    >
      <Autocomplete.Input
        id="author"
        required
        autoComplete="off"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={className}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="z-10 w-(--anchor-width)">
          <Autocomplete.Popup className="max-h-60 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-sm">
            <Autocomplete.List>
              {(author: string) => (
                <Autocomplete.Item
                  key={author}
                  value={author}
                  className="flex min-h-11 cursor-pointer items-center px-3 text-lg font-bold data-highlighted:bg-yel"
                >
                  {author}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
