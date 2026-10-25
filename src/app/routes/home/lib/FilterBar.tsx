import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { Button } from '~app/shared/components';
import { Search, Sliders } from '~app/shared/icons';
import { press } from '~app/shared/press';
import { activeFilterCount, noFilters, sameAuthor, type Filters, type Sort } from './filterRecipes';
import { useKeyboardOffset } from './useKeyboardOffset';

interface FilterBarProps extends ComponentProps<'search'> {
  filters: Filters;
  authors: string[];
  /** Whether the author chips and the sort control are offered; the search box always is. */
  detailed: boolean;
  onFiltersChange: (filters: Filters) => void;
}

const sorts: { value: Sort; label: string }[] = [
  { value: 'nieuwste', label: 'Nieuwste' },
  { value: 'az', label: 'A–Z' },
];

const control =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[0.625rem] border-3 border-ink px-4 text-base font-black text-ink';

/** The search box and the detailed filters. Fixed to the bottom of the screen below 48rem, with the details in a sheet above the box; inline from 48rem. */
export function FilterBar({ filters, authors, detailed, onFiltersChange, className, ...props }: FilterBarProps) {
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
      if (e.key !== 'Escape') return;
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
      {detailed && (
        <div
          id={sheetId}
          data-testid="FilterBar-sheet"
          data-open={open || undefined}
          className="hidden pb-3 data-open:block data-open:animate-rise max-md:mb-3 max-md:border-b-3 max-md:border-ink/15 motion-reduce:animate-none md:block md:animate-none md:p-0"
        >
          <fieldset data-testid="FilterBar-authors" className="m-0 mb-4 min-w-0 border-0 p-0 md:mr-6 md:mb-3 md:inline-flex md:items-center md:gap-3">
            <legend className="mb-2 p-0 font-black md:float-left md:mb-0">Van wie</legend>
            <div className="flex flex-wrap gap-2">
              <Chip pressed={filters.author === undefined} onClick={() => onFiltersChange({ ...filters, author: undefined })}>
                Iedereen
              </Chip>
              {authors.map((a) => (
                <Chip
                  key={a}
                  pressed={filters.author !== undefined && sameAuthor(filters.author, a)}
                  onClick={() => onFiltersChange({ ...filters, author: a })}
                >
                  {a}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="m-0 mb-4 min-w-0 border-0 p-0 md:mr-6 md:mb-3 md:inline-flex md:items-center md:gap-3">
            <legend className="mb-2 p-0 font-black md:float-left md:mb-0">Volgorde</legend>
            <div className="inline-flex">
              {sorts.map(({ value, label }) => (
                <span key={value} className="flex">
                  <input
                    type="radio"
                    data-testid="FilterBar-sort"
                    name="sort"
                    id={`${sheetId}-${value}`}
                    value={value}
                    checked={(filters.sort ?? 'nieuwste') === value}
                    onChange={() => onFiltersChange({ ...filters, sort: value })}
                    className="peer sr-only"
                  />
                  <label
                    data-testid="FilterBar-sortLabel"
                    htmlFor={`${sheetId}-${value}`}
                    className={cn(
                      control,
                      'relative bg-white peer-checked:bg-red peer-checked:text-white peer-focus-visible:outline-4 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-blu',
                      value === sorts[0].value ? 'rounded-r-none' : 'ml-[-3px] rounded-l-none',
                    )}
                  >
                    {label}
                  </label>
                </span>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3 md:hidden">
            <Button type="button" data-testid="FilterBar-clear" className="min-h-11 text-base" onClick={() => onFiltersChange(noFilters)}>
              Wis filters
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 md:max-w-lg">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Zoek een recept</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" />
          <input
            type="search"
            data-testid="FilterBar-search"
            value={text}
            placeholder="Zoek op naam of kok"
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
        {detailed && (
          <button
            ref={toggle}
            data-testid="FilterBar-toggle"
            type="button"
            aria-expanded={open}
            aria-controls={sheetId}
            onClick={() => setOpen(!open)}
            className={cn(control, press, 'relative min-h-12 min-w-12 gap-2 bg-yel px-3.5 aria-expanded:bg-red aria-expanded:text-white md:hidden')}
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
        )}
      </div>
    </search>
  );
}

type ChipProps = { pressed: boolean; onClick: () => void; children: string };

/** An author choice: dashed and flat when not chosen, solid and dark when chosen. No shadow, so it does not press. */
function Chip({ pressed, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      data-testid="FilterBar-chip"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(control, 'border-dashed bg-transparent hover:bg-ink/8 aria-pressed:border-solid aria-pressed:bg-red aria-pressed:text-white')}
    >
      {children}
    </button>
  );
}
