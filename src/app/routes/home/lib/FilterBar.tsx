import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { Button, Segmented } from '~app/shared/components';
import { control } from '~app/shared/control';
import type { Filters, Sort } from '~app/shared/filterParams';
import { hoverDarken } from '~app/shared/hover';
import { Search, Sliders } from '~app/shared/icons';
import { press } from '~app/shared/press';
import { useKeyboardOffset } from '~app/shared/useKeyboardOffset';
import { activeFilterCount, noFilters } from './filterRecipes';
import { MultiSelect } from './MultiSelect';

interface FilterBarProps extends ComponentProps<'search'> {
  filters: Filters;
  authors: string[];
  /** The tags to pick from; the field is left out when there are none. */
  tags: string[];
  /** The category of the tags that have one, shown in the suggestions. */
  tagCategories?: Record<string, string>;
  onFiltersChange: (filters: Filters) => void;
}

const sorts: { value: Sort; label: string }[] = [
  { value: 'nieuwste', label: 'Nieuwste' },
  { value: 'az', label: 'A–Z' },
];

/** The search box and the filters. Fixed to the bottom of the screen below 48rem, with the details in a sheet above the box; inline from 48rem. */
export function FilterBar({ filters, authors, tags, tagCategories, onFiltersChange, className, ...props }: FilterBarProps) {
  const sheetId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // The box keeps its own text so typing never waits for the address to update; it follows the address when that changes otherwise.
  const q = filters.q ?? '';
  const [text, setText] = useState(q);
  const [seen, setSeen] = useState(q);
  if (q !== seen) {
    setSeen(q);
    setText(q);
  }
  const count = activeFilterCount(filters);
  useKeyboardOffset();

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      // An Escape that closed the suggestions was handled by the field; the next one closes the sheet.
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <search
      {...props}
      data-testid="FilterBar-bar"
      className={cn(
        'fixed inset-x-0 bottom-(--kb,0px) z-10 border-t-3 border-ink bg-por px-[max(1rem,4vw)] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:z-auto md:mt-6 md:flex md:flex-col-reverse md:gap-4 md:border-0 md:bg-transparent md:p-0',
        className,
      )}
    >
      <div
        id={sheetId}
        data-testid="FilterBar-sheet"
        data-open={open || undefined}
        className="hidden pb-3 data-open:block data-open:animate-rise max-md:mb-3 max-md:border-b-3 max-md:border-ink/15 motion-reduce:animate-none md:block md:animate-none md:p-0"
      >
        <fieldset data-testid="FilterBar-authors" className="m-0 mb-4 min-w-0 border-0 p-0 md:mr-6 md:mb-3 md:inline-flex md:items-center md:gap-3">
          <legend className="mb-2 p-0 font-black md:float-left md:mb-0">Van wie</legend>
          <div className="md:min-w-72">
            <MultiSelect
              options={authors}
              value={filters.authors ?? []}
              onValueChange={(next) => onFiltersChange({ ...filters, authors: next })}
              placeholder="Iedereen"
              label="Van wie"
            />
          </div>
        </fieldset>
        {(tags.length > 0 || (filters.tags ?? []).length > 0) && (
          <fieldset data-testid="FilterBar-tags" className="m-0 mb-4 min-w-0 border-0 p-0 md:mr-6 md:mb-3 md:inline-flex md:items-center md:gap-3">
            <legend className="mb-2 p-0 font-black md:float-left md:mb-0">Tags</legend>
            <div className="md:min-w-72">
              <MultiSelect
                options={tags}
                categories={tagCategories}
                value={filters.tags ?? []}
                onValueChange={(next) => onFiltersChange({ ...filters, tags: next })}
                placeholder="Alle tags"
                label="Tags"
              />
            </div>
          </fieldset>
        )}
        <Segmented
          legend="Volgorde"
          options={sorts}
          value={filters.sort ?? 'nieuwste'}
          onChange={(sort) => onFiltersChange({ ...filters, sort })}
          inputProps={{ 'data-testid': 'FilterBar-sort' }}
          labelProps={{ 'data-testid': 'FilterBar-sortLabel' }}
          className="mb-4 md:mr-6 md:mb-3 md:inline-flex md:items-center md:gap-3"
        />
        <div className="flex gap-3 md:mb-3 md:inline-flex">
          <Button type="button" data-testid="FilterBar-clear" className="min-h-11 text-base" onClick={() => onFiltersChange(noFilters)}>
            Wis filters
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3 md:max-w-lg">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Zoek een recept</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" />
          <input
            type="search"
            data-testid="FilterBar-search"
            value={text}
            placeholder="Zoek op naam, kok of tag"
            enterKeyHint="search"
            autoComplete="off"
            onChange={(e) => {
              setText(e.target.value);
              onFiltersChange({ ...filters, q: e.target.value });
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white pr-4 pl-11 text-base font-bold text-ink placeholder:font-medium placeholder:text-muted focus-visible:outline-offset-0"
          />
        </label>
        <button
          ref={toggle}
          data-testid="FilterBar-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={sheetId}
          onClick={() => setOpen(!open)}
          className={cn(
            control,
            press,
            hoverDarken,
            'relative min-h-12 min-w-12 gap-2 bg-yel px-3.5 aria-expanded:bg-red aria-expanded:text-white md:hidden',
          )}
        >
          <Sliders />
          <span>Filter</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 grid h-5.5 min-w-5.5 place-items-center rounded-full border-2 border-ink bg-red px-1 text-[0.8125rem] font-black text-white">
              <span data-testid="FilterBar-count">{count}</span>
              <span className="sr-only"> actief</span>
            </span>
          )}
        </button>
      </div>
    </search>
  );
}
