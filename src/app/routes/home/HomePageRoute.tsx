import { Link, useRevalidator, useSearchParams, type ShouldRevalidateFunctionArgs } from 'react-router';
import { Button, RecipeCard } from '~app/shared/components';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { filterParams, type Filters } from '~app/shared/filterParams';
import { hoverUnderline } from '~app/shared/hover';
import { listRecipes } from '~app/shared/recipes.server';
import { listManagedTags } from '~app/shared/tagManagement.server';
import { categoriesOf } from '~app/shared/tags';
import { tileFor } from '~app/shared/tile';
import type { Route } from './+types/HomePageRoute';
import { FilterBar } from './lib/FilterBar';
import { authorsOf, filterRecipes, isFiltered, noFilters, parseFilters, tagsOf } from './lib/filterRecipes';

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  return { recipes: await listRecipes(db, context.get(userEmailContext), new Date()), tagCategories: categoriesOf(await listManagedTags(db)) };
}

/** Typing in the search box only changes the address; the whole list is already here, so nothing is fetched again. */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate;
}

const intro = 'Het kookboek van de familie. Kies iets, of zoek wat je zin hebt.';

export function meta() {
  return [{ title: 'Familiekookboek' }];
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { recipes, tagCategories } = loaderData;
  const [params, setParams] = useSearchParams();
  const { revalidate } = useRevalidator();
  const filters: Filters = parseFilters(params);
  const change = (next: Filters) => setParams(filterParams(next), { replace: true });
  const shown = filterRecipes(recipes, filters);
  return (
    <main
      id="main"
      data-testid="HomePage-main"
      className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <h1 data-testid="HomePage-title" className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">
        Wat eten we vandaag?
      </h1>
      {recipes.length === 0 ? (
        <p data-testid="HomePage-empty" className="mt-2 text-lg text-muted">
          Er zijn nog geen recepten.{' '}
          <Link to="/recepten/nieuw" data-testid="HomePage-add" className={hoverUnderline}>
            Voeg het eerste recept toe.
          </Link>
        </p>
      ) : (
        <>
          <p data-testid="HomePage-intro" className="mt-2 text-lg text-pretty text-muted">
            {intro}
          </p>
          <FilterBar filters={filters} authors={authorsOf(recipes)} tags={tagsOf(recipes)} tagCategories={tagCategories} onFiltersChange={change} />
          <output data-testid="HomePage-count" className="mt-6 mb-4 block font-extrabold text-muted">
            {isFiltered(filters) ? `${shown.length} van ${recipes.length}` : shown.length} {recipes.length === 1 ? 'recept' : 'recepten'}
          </output>
          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p data-testid="HomePage-none" className="text-lg">
                Niets gevonden voor deze zoekopdracht.
              </p>
              <Button type="button" data-testid="HomePage-clear" className="flex-none px-4" onClick={() => change(noFilters)}>
                Wis filters
              </Button>
            </div>
          ) : (
            <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-6 p-0">
              {shown.map((r, i) => (
                <li key={r.slug}>
                  <RecipeCard recipe={r} tile={tileFor(i)} eager={i < 3} onSaved={() => void revalidate()} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
