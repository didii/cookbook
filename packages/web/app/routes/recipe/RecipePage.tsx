import { Link } from 'react-router';
import type { StoredRecipe } from '~/.server/recipes';
import type { Step } from '~/lib/steps';
import { Fret } from '~/shared/Fret';
import { Seal } from '~/shared/Seal';
import { TileBand } from '~/shared/TileBand';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';

type Props = { recipe: StoredRecipe; tile: number; steps: Step[] };

export function RecipePage({ recipe: r, tile, steps }: Props) {
  return (
    <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16">
      <div className="mb-2 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em]">
          ← Alle recepten
        </Link>
        <Link to={`/recepten/${r.slug}/bewerken`} className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em]">
          Bewerk
        </Link>
      </div>
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
          <StepList steps={steps} />
          <Fret size={18} className="mt-7 text-red" />
        </section>
      </div>
    </main>
  );
}
