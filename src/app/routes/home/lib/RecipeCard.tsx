import { useId } from 'react';
import { Link } from 'react-router';
import { cn } from '~app/shared/cn';
import { LikeButton, Seal, TileBand } from '~app/shared/components';
import { StickyNote } from '~app/shared/icons';
import type { RecipeSummary } from '~app/shared/recipe';
import { twoTileRows } from '~app/shared/tile';

type Props = { recipe: RecipeSummary; tile: number; eager?: boolean; onSaved?: () => void };

const maxCategories = 2;

/** Recipe card: image (two tiles high), tile band with the buttons, then the text. The title link is stretched over the card, the buttons sit above it. */
export function RecipeCard({ recipe: r, tile, eager, onSaved }: Props) {
  const newId = useId();
  const more = r.categories.length - maxCategories;
  return (
    <article
      data-testid="RecipeCard-card"
      className="@container relative overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard transition-[transform,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] has-[a:focus-visible]:outline-4 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-blu hover:-translate-0.5 hover:shadow-hard-lg motion-reduce:transition-none"
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
      {r.image && r.seal && <Seal id={r.seal} className="h-13" />}
      <div className="relative">
        <TileBand first={tile} responsive rows={r.image ? 1 : 3} />
        <div className="pointer-events-none absolute inset-x-2 top-0 bottom-[3px] z-2 flex items-end justify-end gap-2 pb-[3px]">
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
            <LikeButton slug={r.slug} initialLiked={r.liked} onSaved={onSaved} />
          </span>
        </div>
      </div>
      <div className="px-4 pt-3 pb-4">
        <Link
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
        {r.categories.length > 0 && (
          <div data-testid="RecipeCard-categories" className="mt-1.5 flex flex-wrap gap-1.5">
            {r.categories.slice(0, maxCategories).map((name) => (
              <span
                key={name}
                data-testid="RecipeCard-category"
                className="rounded-full border-2 border-ink bg-por px-2.5 text-[0.8125rem] leading-[1.45] font-extrabold"
              >
                {name}
              </span>
            ))}
            {more > 0 && (
              <span
                data-testid="RecipeCard-more"
                className="rounded-full border-2 border-dashed border-ink px-2.5 text-[0.8125rem] leading-[1.45] font-extrabold"
              >
                +{more}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
