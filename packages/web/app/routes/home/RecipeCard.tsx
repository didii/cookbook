import { Link } from 'react-router';
import type { RecipeSummary } from '~/lib/recipe';
import { Seal } from '~/shared/Seal';
import { TileBand } from '~/shared/TileBand';

type Props = { recipe: RecipeSummary; tile: number; eager?: boolean };

export function RecipeCard({ recipe: r, tile, eager }: Props) {
  return (
    <Link
      to={`/recepten/${r.slug}`}
      className="relative block overflow-hidden rounded-xl border-3 border-ink bg-white no-underline shadow-hard transition-[transform,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg motion-reduce:transition-none"
    >
      {r.isNew && (
        <span className="absolute top-2.5 left-2.5 z-1 rounded-md border-2 border-ink bg-yel px-2 py-0.5 text-sm font-black text-ink shadow-hard-sm">
          Nieuw
        </span>
      )}
      {r.image && (
        <img
          src={r.image}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          width="640"
          height="400"
          className="block aspect-5/2 h-auto w-full md:aspect-16/10 border-b-3 border-ink object-cover"
        />
      )}
      {r.image && r.seal && <Seal id={r.seal} className="h-13" />}
      <TileBand first={tile} />
      <span className="block px-4 pt-3 pb-4">
        <span className="block text-[1.375rem] leading-[1.1] font-black">{r.title}</span>
        <span className="mt-1 block text-[0.9375rem] font-bold text-muted">
          van {r.author}
          {r.time && ` · ${r.time}`}
        </span>
      </span>
    </Link>
  );
}
