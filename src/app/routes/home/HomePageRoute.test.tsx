import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createMemoryRouter, MemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import type { RecipeSummary } from '~app/shared/recipe';
import { createRecipe } from '~app/shared/recipes.server';
import { cssFor } from '~testing/css';
import { createTestDb } from '~testing/db';
import { act, cleanup, fireEvent, precedes, render, screen, within } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/HomePageRoute';
import HomePage, { loader, shouldRevalidate } from './HomePageRoute';
import { filterParams, noFilters } from './lib/filterRecipes';

// Real loader against an in-memory D1 holding the recipes the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const load = async () => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return (await loader(fake<Route.LoaderArgs>({ context }))).recipes;
};

/** The page for a list of recipes at an address. */
const renderAt = (url: string, recipes: RecipeSummary[]) => {
  const props = { loaderData: { recipes } } as Route.ComponentProps;
  return render(
    <MemoryRouter initialEntries={[url]}>
      <HomePage {...props} />
    </MemoryRouter>,
  );
};
/** The slugs of the cards on the page, in order. */
const shownTitles = () => screen.queryAllByTestId('RecipeCard-link').map((a) => a.getAttribute('href')?.replace('/recepten/', ''));
const chip = (name: string) => screen.getAllByTestId('FilterBar-chip').find((c) => c.textContent === name)!;
const sortInput = (value: string) => screen.getAllByTestId<HTMLInputElement>('FilterBar-sort').find((i) => i.value === value)!;
/** The "n recepten" line. */
const count = () => screen.getByTestId('Home-count').textContent;
const searchBox = () => screen.getByTestId<HTMLInputElement>('FilterBar-search');

// Runs first: the other tests add recipes to the shared database.
test('recipe-browsing › No recipes yet', async () => {
  assert.deepEqual(await load(), []);
  const { container } = renderAt('/', await load());
  assert.ok(screen.getByTestId('Home-empty'));
  assert.equal(screen.getByTestId('Home-add').getAttribute('href'), '/recepten/nieuw');
  assert.equal(container.querySelector('output, input'), null);
});

test('recipe-browsing › Recipe without time or image', async () => {
  const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma' });
  const card = (await load()).find((r) => r.slug === slug);
  assert.equal(card?.time, null);
  assert.equal(card?.image, null);
  // The card leaves the time and the image out when there are none.
  renderAt('/', [card!]);
  const link = screen.getByTestId('RecipeCard-link');
  assert.equal(within(link).getByTestId('RecipeCard-author').textContent, 'van Oma');
  assert.ok(!link.textContent?.includes('·'));
  assert.equal(link.querySelector('img'), null);
});

test('recipe-browsing › Stored recipes are listed', async () => {
  const first = await createRecipe(db, { title: 'Eerste', author: 'Papa', time: '30 min', image: '/a.jpg' });
  const second = await createRecipe(db, { title: 'Tweede', author: 'Mama' });
  const slugs = (await load()).map((r) => r.slug);
  assert.deepEqual(slugs.slice(0, 2), [second, first]);
});

test('recipe-browsing › A new recipe appears', async () => {
  const shownCount = async () => {
    const view = renderAt('/', await load());
    const n = /^(\d+) recept/.exec(count() ?? '')?.[1];
    view.unmount();
    return n;
  };
  const listed = await load();
  assert.equal(await shownCount(), String(listed.length));
  const slug = await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
  const relisted = await load();
  assert.equal(relisted.length, listed.length + 1);
  assert.equal(relisted[0]?.slug, slug);
  assert.equal(await shownCount(), String(relisted.length));
});

test('recipe-browsing › Welcome above the recipes', async () => {
  const { container } = renderAt('/', await load());
  const heading = screen.getByTestId('Home-title');
  const intro = screen.getByTestId('Home-intro');
  assert.ok(precedes(heading, intro) && precedes(intro, container.querySelector('ul')!));
});

// Filtering runs in the browser over the loaded list, so these render the page for a given list and address.
const summary = (title: string, author: string): RecipeSummary => ({ slug: title.toLowerCase(), title, author, time: null, image: null, seal: null });
const family = [
  summary('Erwtensoep', 'Papa'),
  summary('Appeltaart', 'Oma'),
  summary('Pannenkoeken', 'Tante An'),
  summary('Stoofvlees', 'Papa'),
  summary('Rijstpap', 'Mama'),
];
const twelve = Array.from({ length: 12 }, (_, i) => summary(i < 3 ? `Soep ${i}` : `Gerecht ${i}`, 'Oma'));

test('recipe-filtering › Few recipes', () => {
  const few = renderAt('/', family.slice(0, 3));
  assert.ok(searchBox());
  assert.equal(few.container.querySelector('[aria-pressed]'), null);
  assert.equal(screen.queryAllByTestId('FilterBar-sort').length, 0);
  few.unmount();
  assert.ok(renderAt('/', family).container.querySelector('[aria-pressed]'));
  cleanup();
  // An address that sets author or order is ignored when those controls are not offered, since they could not be undone.
  renderAt('/?auteur=Papa&sort=az', family.slice(0, 3));
  assert.deepEqual(shownTitles(), ['erwtensoep', 'appeltaart', 'pannenkoeken']);
});

test('recipe-filtering › Count with a filter', () => {
  renderAt('/?q=soep', twelve);
  assert.equal(count(), '3 van 12 recepten');
});

test('recipe-filtering › Count without a filter', () => {
  renderAt('/', twelve);
  assert.equal(count(), '12 recepten');
});

test('recipe-filtering › Nothing found', () => {
  renderAt('/?q=zzz', family);
  assert.deepEqual(shownTitles(), []);
  assert.ok(screen.getByTestId('Home-none'));
  // The way out sits with the message, after the count, and the search box keeps what was typed.
  assert.ok(precedes(screen.getByTestId('Home-count'), screen.getByTestId('Home-clear')));
  assert.equal(searchBox().value, 'zzz');
});

test('recipe-filtering › Clearing all filters', () => {
  // "Wis filters" navigates to the address without filter parameters; that address shows everything with the defaults chosen.
  assert.equal(filterParams(noFilters).toString(), '');
  renderAt('/', family);
  assert.equal(shownTitles().length, family.length);
  assert.equal(chip('Iedereen').getAttribute('aria-pressed'), 'true');
  assert.equal(sortInput('nieuwste').checked, true);
  assert.equal(searchBox().value, '');
  cleanup();
  // Using the button from the nothing-found message gets there.
  renderAt('/?q=zzz&auteur=Papa&sort=az', family);
  const wis = screen.getByTestId('Home-clear');
  fireEvent.click(wis);
  assert.equal(shownTitles().length, family.length);
  assert.equal(searchBox().value, '');
  assert.equal(chip('Iedereen').getAttribute('aria-pressed'), 'true');
});

test('recipe-filtering › Opening a filtered address', () => {
  renderAt('/?q=appel', family);
  assert.equal(searchBox().value, 'appel');
  assert.deepEqual(shownTitles(), ['appeltaart']);
  cleanup();
  // Author and order come from the address too.
  renderAt('/?auteur=Papa&sort=az', family);
  assert.deepEqual(shownTitles(), ['erwtensoep', 'stoofvlees']);
  assert.equal(chip('Papa').getAttribute('aria-pressed'), 'true');
});

test('typing a search does not fetch the recipes again, other navigation does', () => {
  const url = (s: string) => new URL(`https://cookbook.test/${s}`);
  const args = (from: string, to: string, defaultShouldRevalidate = true) =>
    ({ currentUrl: url(from), nextUrl: url(to), defaultShouldRevalidate }) as Parameters<typeof shouldRevalidate>[0];
  assert.equal(shouldRevalidate(args('', '?q=a')), false);
  assert.equal(shouldRevalidate(args('?q=a', '?q=ab&sort=az')), false);
  assert.equal(shouldRevalidate(args('?q=a', '')), false);
  assert.equal(shouldRevalidate(args('recepten/nieuw', '')), true);
  assert.equal(shouldRevalidate(args('', '')), true);
  assert.equal(shouldRevalidate(args('recepten/nieuw', '', false)), false);
});

test('recipe-filtering › Filtering does not fill the history', async () => {
  // A memory history stands in for the browser's: one step back from the home page leads to the page before it, however much was typed.
  const props = { loaderData: { recipes: family } } as Route.ComponentProps;
  const router = createMemoryRouter(
    [
      { path: '/', element: <HomePage {...props} /> },
      { path: '/eerder', element: null },
    ],
    { initialEntries: ['/eerder', '/'], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  fireEvent.change(searchBox(), { target: { value: 'a' } });
  fireEvent.change(searchBox(), { target: { value: 'ap' } });
  assert.equal(router.state.location.search, '?q=ap');
  assert.equal(router.state.historyAction, 'REPLACE');
  await act(() => router.navigate(-1));
  assert.equal(router.state.location.pathname, '/eerder');
});

test('recipe-filtering › Reaching the last recipe', async () => {
  // The page keeps room under the list for the fixed bar and the safe area on phones, and returns to normal spacing from 48rem.
  renderAt('/', family);
  const css = (await cssFor(screen.getByTestId('Home-main').className)).replace(/\s+/g, ' ');
  assert.match(css, /padding-bottom: calc\(7rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /@media \(width >= 48rem\) \{[^@]*padding-bottom: calc\(var\(--spacing\) \* 16\)/);
});
