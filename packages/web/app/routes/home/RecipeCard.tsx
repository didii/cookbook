import { Link } from 'react-router';

import type { Recipe } from '~/lib/recipes';
import { TileBand } from '~/shared/TileBand';

type Props = { recipe: Recipe; tile: number; eager?: boolean };

export function RecipeCard({ recipe: r, tile, eager }: Props) {
  return (
    <Link
      to={`/recepten/${r.slug}`}
      className="block overflow-hidden rounded-xl border-3 border-ink bg-white no-underline shadow-hard transition-[transform,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg motion-reduce:transition-none"
    >
      <img
        src={r.image}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        width="640"
        height="400"
        className="block aspect-16/10 w-full border-b-3 border-ink object-cover"
      />
      <TileBand first={tile} />
      <span className="block px-4 pt-3 pb-4">
        <span className="block text-[1.375rem] leading-[1.1] font-black">{r.title}</span>
        <span className="mt-1 block text-[0.9375rem] font-bold text-muted">
          van {r.by} · {r.time}
        </span>
      </span>
    </Link>
  );
}
