import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '~app/shared/cn';
import { hoverTint } from '~app/shared/hover';
import { Ellipsis } from '~app/shared/icons';
import { pressCss } from '~app/shared/press';

type Props = { slug: string };

const item = cn('flex min-h-11 w-full items-center px-4 text-left font-extrabold disabled:cursor-not-allowed disabled:opacity-40', hoverTint);

/** The "Meer acties" button of the recipe page with its popup: Bewerk, Kopieer and Deel. Deel is disabled until its feature exists. */
export function RecipeActionsMenu({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        data-testid="RecipeActionsMenu-button"
        aria-label="Meer acties"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'grid size-11 cursor-pointer place-items-center rounded-[10px] border-3 border-ink bg-white text-ink',
          pressCss('xs'),
          hoverTint,
        )}
      >
        <Ellipsis className="size-7" />
      </button>
      {open && (
        <div
          id={id}
          data-testid="RecipeActionsMenu-panel"
          className="absolute top-full right-0 z-30 mt-2 flex w-44 flex-col overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard"
        >
          <Link
            to={`/recepten/${slug}/bewerken`}
            state={{ fresh: true }}
            data-testid="RecipeActionsMenu-edit"
            onClick={() => setOpen(false)}
            className={item}
          >
            Bewerk
          </Link>
          <Link
            to={`/recepten/nieuw?kopie=${slug}`}
            state={{ fresh: true }}
            data-testid="RecipeActionsMenu-copy"
            onClick={() => setOpen(false)}
            className={item}
          >
            Kopieer
          </Link>
          <button type="button" disabled data-testid="RecipeActionsMenu-share" className={item}>
            Deel
          </button>
        </div>
      )}
    </div>
  );
}
