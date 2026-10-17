import { data, Link } from 'react-router';
import { envContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import { Fret } from '~/shared/Fret';
import { Seal } from '~/shared/Seal';
import { TileBand } from '~/shared/TileBand';
import type { Route } from './+types/route';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';

export async function loader({ params, context }: Route.LoaderArgs) {
  const recipe = await getRecipe(context.get(envContext).DB, params.slug);
  if (!recipe) throw data('Recept niet gevonden', { status: 404 });
  return { recipe, tile: tileFor(recipe.id) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function Recipe({ loaderData }: Route.ComponentProps) {
  const { recipe: r, tile } = loaderData;

  return (
    <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16">
      <Link to="/" className="mb-2 inline-block py-2 font-extrabold underline-offset-[0.25em]">
        ← Alle recepten
      </Link>
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">{r.title}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-extrabold">
        <span className="rounded-full border-3 border-ink bg-yel px-3.5 py-0.5">van {r.author}</span>
        {r.time && <span>{r.time}</span>}
        {r.servings && <span>{r.servings} personen</span>}
      </p>
      <p className="mt-2 max-w-[60ch] text-lg text-muted">{r.intro}</p>

      <div className="@container relative mt-6 overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
        {r.image && <img src={r.image} alt="" width="1280" height="640" className="block aspect-2/1 w-full border-b-3 border-ink object-cover" />}
        {r.image && r.seal && <Seal id={r.seal} className="h-16" />}
        <TileBand first={tile} responsive className="border-b-0" />
      </div>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 min-[52rem]:grid-cols-[minmax(16rem,22rem)_1fr] min-[52rem]:items-start">
        <section aria-labelledby="ing">
          <h2 id="ing" className="mb-4 text-2xl font-black">
            Ingrediënten
          </h2>
          <IngredientList ingredients={r.ingredients} />
        </section>

        <section aria-labelledby="bereiding">
          <h2 id="bereiding" className="mb-4 text-2xl font-black">
            Bereiding
          </h2>
          <StepList steps={r.steps} />
          <Fret size={18} className="mt-7 text-red" />
        </section>
      </div>
    </main>
  );
}
