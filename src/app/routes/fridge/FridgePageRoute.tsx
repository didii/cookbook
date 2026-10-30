import { Link, useRevalidator, useSearchParams, type ShouldRevalidateFunctionArgs } from 'react-router';
import { Button, Segmented } from '~app/shared/components';
import { envContext, userEmailContext } from '~app/shared/context.server';
import type { Sort } from '~app/shared/filterParams';
import { hoverUnderline } from '~app/shared/hover';
import { listIngredientNames, listRecipes } from '~app/shared/recipes.server';
import { getStaples } from '~app/shared/staples.server';
import { tileFor } from '~app/shared/tile';
import type { Route } from './+types/FridgePageRoute';
import { FridgeCard } from './lib/FridgeCard';
import { IngredientList } from './lib/IngredientList';
import { addEntry, isFiltered, listParams, noLists, parseLists, removeEntry } from './lib/lists';
import { rankRecipes } from './lib/matchIngredients';

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  return {
    recipes: await listRecipes(db, context.get(userEmailContext), new Date()),
    ingredients: await listIngredientNames(db),
    staples: await getStaples(db),
  };
}

/** Changing the lists only changes the address; everything is already here, so nothing is fetched again. */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate;
}

export function meta() {
  return [{ title: 'Koelkast · Familiekookboek' }];
}

const sorts: { value: Sort; label: string }[] = [
  { value: 'nieuwste', label: 'Nieuwste' },
  { value: 'az', label: 'A–Z' },
];

export default function FridgePage({ loaderData }: Route.ComponentProps) {
  const { recipes, ingredients, staples } = loaderData;
  const [params, setParams] = useSearchParams();
  const { revalidate } = useRevalidator();
  const lists = parseLists(params);
  const change = (next: typeof lists) => setParams(listParams(next), { replace: true });
  const shown = rankRecipes(recipes, ingredients, lists, staples);
  return (
    <main id="main" data-testid="FridgePage-main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <h1 data-testid="FridgePage-title" className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">
        Wat zit er in de koelkast?
      </h1>
      {recipes.length === 0 ? (
        <p data-testid="FridgePage-empty" className="mt-2 text-lg text-muted">
          Er zijn nog geen recepten.{' '}
          <Link to="/recepten/nieuw" data-testid="FridgePage-add" className={hoverUnderline}>
            Voeg het eerste recept toe.
          </Link>
        </p>
      ) : (
        <>
          <p data-testid="FridgePage-intro" className="mt-2 text-lg text-pretty text-muted">
            Typ wat je nog hebt. Recepten die het meeste gebruiken staan bovenaan.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-8">
            <IngredientList
              kind="heb"
              entries={lists.heb}
              onAdd={(text) => change(addEntry(lists, 'heb', text))}
              onRemove={(e) => change(removeEntry(lists, 'heb', e))}
            />
            <IngredientList
              kind="zonder"
              entries={lists.zonder}
              onAdd={(text) => change(addEntry(lists, 'zonder', text))}
              onRemove={(e) => change(removeEntry(lists, 'zonder', e))}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Segmented
              legend="Volgorde bij gelijk"
              options={sorts}
              value={lists.sort}
              onChange={(sort) => change({ ...lists, sort })}
              inputProps={{ 'data-testid': 'FridgePage-sort' }}
              className="md:inline-flex md:items-center md:gap-3"
            />
            {isFiltered(lists) && (
              <Button type="button" data-testid="FridgePage-clear" className="min-h-11 flex-none px-4 text-base" onClick={() => change(noLists)}>
                Wis alles
              </Button>
            )}
          </div>
          <output data-testid="FridgePage-count" className="mt-6 mb-4 block font-extrabold text-muted">
            {isFiltered(lists) ? `${shown.length} van ${recipes.length}` : shown.length} {recipes.length === 1 ? 'recept' : 'recepten'}
          </output>
          {shown.length === 0 ? (
            <p data-testid="FridgePage-none" className="text-lg">
              Niets gevonden met deze lijsten.
            </p>
          ) : (
            <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-6 p-0">
              {shown.map(({ recipe, used, unused, missing }, i) => (
                <li key={recipe.slug}>
                  <FridgeCard
                    recipe={recipe}
                    tile={tileFor(i)}
                    eager={i < 3}
                    onSaved={() => void revalidate()}
                    total={lists.heb.length}
                    used={used}
                    unused={unused}
                    missing={missing}
                    onHave={(name) => change(addEntry(lists, 'heb', name))}
                    onSkip={(name) => change(addEntry(lists, 'zonder', name))}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
