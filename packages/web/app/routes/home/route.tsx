import { Link, useSearchParams, type ShouldRevalidateFunctionArgs } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { listRecipes } from '~/.server/recipes';
import { authorsOf, filterParams, filterRecipes, isFiltered, minRecipesForFilters, noFilters, parseFilters, type Filters } from '~/lib/filterRecipes';
import { tileFor } from '~/lib/tile';
import { Button } from '~/shared/Button';
import type { Route } from './+types/route';
import { FilterBar } from './FilterBar';
import { RecipeCard } from './RecipeCard';

export async function loader({ context }: Route.LoaderArgs) {
  return { recipes: await listRecipes(context.get(envContext).DB, context.get(userEmailContext), new Date()) };
}

/** Typing in the search box only changes the address; the whole list is already here, so nothing is fetched again. */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate;
}

const intro = 'Het kookboek van de familie. Kies iets, of zoek wat je zin hebt.';

export function meta() {
  return [{ title: 'Familiekookboek' }];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { recipes } = loaderData;
  const [params, setParams] = useSearchParams();
  const detailed = recipes.length >= minRecipesForFilters;
  const parsed = parseFilters(params);
  // Without the chips and the sort control there is no way to undo them, so an address that sets them is ignored.
  const filters: Filters = detailed ? parsed : { ...noFilters, q: parsed.q };
  const change = (next: Filters) => setParams(filterParams(next), { replace: true });
  const shown = filterRecipes(recipes, filters);
  return (
    <main
      id="main"
      data-testid="Home-main"
      className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <h1 data-testid="Home-title" className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">
        Wat eten we vandaag?
      </h1>
      {recipes.length === 0 ? (
        <p data-testid="Home-empty" className="mt-2 text-lg text-muted">
          Er zijn nog geen recepten.{' '}
          <Link to="/recepten/nieuw" data-testid="Home-add">
            Voeg het eerste recept toe.
          </Link>
        </p>
      ) : (
        <>
          <p data-testid="Home-intro" className="mt-2 text-lg text-pretty text-muted">
            {intro}
          </p>
          <FilterBar filters={filters} authors={authorsOf(recipes)} detailed={detailed} onChange={change} />
          <output data-testid="Home-count" className="mt-6 mb-4 block font-extrabold text-muted">
            {isFiltered(filters) ? `${shown.length} van ${recipes.length}` : shown.length} {recipes.length === 1 ? 'recept' : 'recepten'}
          </output>
          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p data-testid="Home-none" className="text-lg">
                Niets gevonden voor deze zoekopdracht.
              </p>
              <Button type="button" data-testid="Home-clear" className="flex-none px-4" onClick={() => change(noFilters)}>
                Wis filters
              </Button>
            </div>
          ) : (
            <ul data-testid="Home-list" className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-6 p-0">
              {shown.map((r, i) => (
                <li key={r.slug}>
                  <RecipeCard recipe={r} tile={tileFor(i)} eager={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
