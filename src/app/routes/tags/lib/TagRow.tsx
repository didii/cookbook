import { useRef, type ReactNode } from 'react';
import { cn } from '~app/shared/cn';
import { Pill } from '~app/shared/components';
import { Book, Check } from '~app/shared/icons';
import type { ManagedTag } from '~app/shared/tags';

interface TagRowProps {
  tag: ManagedTag;
  /** Whether the category pill is drawn (not under a category heading). */
  showCategory: boolean;
  /** Whether the form below the row is open. */
  open: boolean;
  /** Select mode: the row is a checkbox and opens no form. */
  selecting: boolean;
  selected: boolean;
  onActivate: () => void;
  /** Escape in the form: closes it, and the focus comes back to the row. */
  onClose: () => void;
  /** The form, shown below the row while open. */
  children?: ReactNode;
}

/** One tag: its pill, category pill and number of recipes. Activating the row opens its form (or toggles it in select mode). */
export function TagRow({ tag, showCategory, open, selecting, selected, onActivate, onClose, children }: TagRowProps) {
  const row = useRef<HTMLButtonElement>(null);
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape inside the open form; the row button is the interactive element.
    <li
      data-testid="TagRow-item"
      onKeyDown={(e) => {
        // Escape in an open suggestion list only closes that list.
        if (e.key !== 'Escape' || !open || (e.target as HTMLElement).getAttribute('aria-expanded') === 'true') return;
        onClose();
        row.current?.focus();
      }}
      className="border-t-2 border-ink/18 first:border-t-0"
    >
      <button
        ref={row}
        type="button"
        data-testid="TagRow-row"
        aria-expanded={selecting ? undefined : open}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the whole row is the toggle; a native checkbox cannot hold the pills.
        role={selecting ? 'checkbox' : undefined}
        aria-checked={selecting ? selected : undefined}
        onClick={onActivate}
        className={cn(
          'flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-1.5 text-left hover:bg-yel/20',
          open && 'bg-blu/10',
          selected && 'bg-yel/30',
        )}
      >
        {selecting && (
          <span
            data-testid="TagRow-check"
            aria-hidden="true"
            className={cn('grid size-6 shrink-0 place-items-center rounded-md border-3 border-ink bg-white text-white', selected && 'bg-blu')}
          >
            {selected && <Check className="size-4" />}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 wrap-anywhere">
          <Pill data-testid="TagRow-tag" className="text-[1.0625rem] font-black">
            {tag.name}
          </Pill>
          {showCategory && tag.category && (
            <Pill variant="category" data-testid="TagRow-category" className="whitespace-nowrap">
              {tag.category}
            </Pill>
          )}
        </span>
        <span
          data-testid="TagRow-uses"
          className={cn('inline-flex items-center gap-1.5 font-extrabold whitespace-nowrap tabular-nums', tag.uses === 0 ? 'text-red' : 'text-muted')}
        >
          <Book className="opacity-50" />
          {tag.uses}
          <span className="sr-only"> {tag.uses === 1 ? 'recept' : 'recepten'}</span>
        </span>
      </button>
      {open && children}
    </li>
  );
}
