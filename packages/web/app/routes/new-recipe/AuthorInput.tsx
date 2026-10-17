import { Autocomplete } from '@base-ui/react/autocomplete';

type Props = { authors: string[]; defaultValue?: string; invalid?: boolean; describedBy?: string; className?: string };

/** Free-text author field that suggests the authors already on stored recipes; a name that isn't listed is submitted as typed. */
export function AuthorInput({ authors, defaultValue, invalid, describedBy, className }: Props) {
  // Ignores letter case and accents: "oma" finds "Oma".
  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  return (
    <Autocomplete.Root items={authors} name="author" defaultValue={defaultValue} filter={contains} openOnInputClick autoHighlight={false}>
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
          <Autocomplete.Popup className="max-h-60 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-sm empty:hidden">
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
