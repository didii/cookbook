import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { Segmented } from '~app/shared/components';
import { control } from '~app/shared/control';
import { Search } from '~app/shared/icons';
import type { TagFilters, TagOrder } from './arrangeTags';

interface FiltersProps {
  filters: TagFilters;
  onChange: (filters: TagFilters) => void;
  selecting: boolean;
  onSelectingChange: (selecting: boolean) => void;
  /** How many tags the filters leave and how many are stored. */
  shown: number;
  total: number;
}

const orders: { value: TagOrder; label: string }[] = [
  { value: 'name', label: 'Naam' },
  { value: 'category', label: 'Categorie' },
];

/** The search box, the chips, the "Selecteer" toggle, the count line and the order switch. */
export function Filters({ filters, onChange, selecting, onSelectingChange, shown, total }: FiltersProps) {
  return (
    <div className="mt-5 grid gap-3">
      <label className="relative block">
        <span className="sr-only">Zoek op naam</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          type="search"
          data-testid="Filters-search"
          value={filters.q}
          placeholder="Zoek op naam"
          autoComplete="off"
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          className="block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white pr-3 pl-10 text-base font-bold text-ink hover:not-focus:bg-hover placeholder:font-medium placeholder:text-muted focus:shadow-focus focus:outline-transparent"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Chip data-testid="Filters-unused" pressed={filters.unused} onClick={() => onChange({ ...filters, unused: !filters.unused })}>
          Ongebruikt
        </Chip>
        <Chip
          data-testid="Filters-uncategorized"
          pressed={filters.withoutCategory}
          onClick={() => onChange({ ...filters, withoutCategory: !filters.withoutCategory })}
        >
          Zonder categorie
        </Chip>
        <span className="flex-1" />
        <Chip data-testid="Filters-select" pressed={selecting} onClick={() => onSelectingChange(!selecting)}>
          Selecteer
        </Chip>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <output data-testid="Filters-count" className="font-extrabold text-muted">
          {shown} van {total} {total === 1 ? 'tag' : 'tags'}
        </output>
        <Segmented
          legend="Volgorde"
          options={orders}
          value={filters.order}
          onChange={(order) => onChange({ ...filters, order })}
          inputProps={{ 'data-testid': 'Filters-order' }}
          labelProps={{ 'data-testid': 'Filters-orderLabel' }}
          className="md:inline-flex md:items-center md:gap-3"
        />
      </div>
    </div>
  );
}

interface ChipProps extends ComponentProps<'button'> {
  pressed: boolean;
}

/** A toggle: white when off, yellow when on. */
function Chip({ pressed, className, ...props }: ChipProps) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={pressed}
      className={cn(
        control,
        'min-h-10 rounded-full bg-white px-3.5 font-extrabold hover:not-aria-pressed:bg-hover aria-pressed:bg-yel aria-pressed:hover:brightness-95',
        className,
      )}
    />
  );
}
