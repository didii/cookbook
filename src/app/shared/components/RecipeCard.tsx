import { useId, type ComponentProps, type ReactNode } from 'react';
import { Link } from 'react-router';
import { LikeButton } from './LikeButton';
import { Pill } from './Pill';
import { Seal } from './Seal';
import { TileBand } from './TileBand';
import { cn } from '../cn';
import { StickyNote } from '../icons';
import type { RecipeSummary } from '../recipe';
import { twoTileRows } from '../tile';

interface RecipeCardProps extends ComponentProps<'article'> {
  recipe: RecipeSummary;
  tile: number;
  eager?: boolean;
  onSaved?: () => void;
  /** Shown under the tags, still in the part that opens the recipe. */
  footer?: ReactNode;
}

const maxTags = 2;

/** Recipe card: image (two tiles high), tile band with the buttons, then the text. The title link is stretched over the card, the buttons sit above it. Children go below a separator, above the link, so nothing in them opens the recipe. */
export function RecipeCard({ recipe: r, tile, eager, onSaved, footer, children, className, ...props }: RecipeCardProps) {
  const newId = useId();
  const titleId = useId();
  const more = r.tags.length - maxTags;
  return (
    <article
      {...props}
      data-testid="RecipeCard-card"
      className={cn(
        '@container relative overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard has-[a:focus-visible]:outline-4 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-blu hover:bg-hover',
        className,
      )}
    >
      {r.isNew && (
        <span
          id={newId}
          data-testid="RecipeCard-new"
          className="absolute top-2.5 left-2.5 z-1 rounded-md border-2 border-ink bg-yel px-2 py-0.5 text-sm font-black text-ink shadow-hard-sm"
        >
          Nieuw
        </span>
      )}
      {r.image && (
        <img
          data-testid="RecipeCard-image"
          src={r.image}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          className={cn('block h-auto w-full border-b-3 border-ink object-cover', twoTileRows)}
        />
      )}
      {r.image && r.seal && <Seal sealId={r.seal} className="h-13" />}
      <div className="relative">
        <TileBand first={tile} responsive rows={r.image ? 1 : 3} />
        <div className="pointer-events-none absolute size-full top-0 left-0 z-2 flex items-end justify-end gap-1 pr-0.75 pb-0.75">
          {r.hasNote && (
            <span
              data-testid="RecipeCard-note"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a span with an icon, not an image file
              role="img"
              aria-label="Je hebt een notitie"
              className="grid size-11 place-items-center rounded-[10px] border-3 border-ink bg-yel text-ink"
            >
              <StickyNote className="size-6" />
            </span>
          )}
          <span className="pointer-events-auto">
            <LikeButton slug={r.slug} initialLiked={r.liked} onSaved={onSaved} aria-describedby={titleId} />
          </span>
        </div>
      </div>
      <div className="px-4 pt-3 pb-4 border-t-3 border-ink">
        <Link
          id={titleId}
          to={`/recepten/${r.slug}`}
          data-testid="RecipeCard-link"
          aria-describedby={r.isNew ? newId : undefined}
          className="block text-[1.375rem] leading-[1.1] font-black text-ink no-underline after:absolute after:inset-0 after:z-1 focus-visible:outline-none"
        >
          {r.title}
        </Link>
        <p data-testid="RecipeCard-author" className="mt-1 text-[0.9375rem] font-bold text-muted">
          van {r.author}
          {r.time && ` · ${r.time}`}
        </p>
        {r.tags.length > 0 && (
          <div data-testid="RecipeCard-tags" className="mt-1.5 flex flex-wrap gap-1.5">
            {r.tags.slice(0, maxTags).map((name) => (
              <Pill key={name} data-testid="RecipeCard-tag">
                {name}
              </Pill>
            ))}
            {more > 0 && (
              <Pill variant="dashed" data-testid="RecipeCard-more">
                +{more}
              </Pill>
            )}
          </div>
        )}
        {footer}
      </div>
      {children && (
        <div data-testid="RecipeCard-extra" className="relative z-2 border-t-3 border-ink px-4 pb-4">
          {children}
        </div>
      )}
    </article>
  );
}
