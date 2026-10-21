import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cssFor } from '~testing/css';
import { createTestDb } from '~testing/db';
import { cleanup, fireEvent, precedes, render, screen, within } from '~testing/dom';
import { createElement } from 'react';
import { MemoryRouter, RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { createRecipe } from '~/.server/recipes';
import { filterParams, noFilters } from '~/lib/filterRecipes';
import type { RecipeSummary } from '~/lib/recipe';
import type { Route } from './+types/route';
import Home, { loader, shouldRevalidate } from './route';

// Real loader against an in-memory D1 holding the recipes the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const load = async () => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  context.set(userEmailContext, 'oma@example.com');
  return (await loader({ context } as Partial<Route.LoaderArgs> as Route.LoaderArgs)).recipes;
};

/** The page for a list of recipes at an address. */
const renderAt = (url: string, recipes: RecipeSummary[]) =>
  render(createElement(MemoryRouter, { initialEntries: [url] }, createElement(Home, { loaderData: { recipes } } as Route.ComponentProps)));
/** The slugs of the cards on the page, in order. */
const shownTitles = () => screen.queryAllByRole('link').map((a) => a.getAttribute('href')?.replace('/recepten/', ''));
/** The "n recepten" line. */
const count = () => screen.getByRole('status').textContent;
const searchBox = () => screen.getByRole<HTMLInputElement>('searchbox');

// Runs first: the other tests add recipes to the shared database.
test('recipe-browsing › No recipes yet', async () => {
  assert.deepEqual(await load(), []);
  const { container } = renderAt('/', await load());
  assert.ok(screen.getByText(/Er zijn nog geen recepten/));
  assert.equal(screen.getByRole('link', { name: 'Voeg het eerste recept toe.' }).getAttribute('href'), '/recepten/nieuw');
  assert.equal(container.querySelector('output, input'), null);
});

test('recipe-browsing › Recipe without time or image', async () => {
  const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma' });
  const card = (await load()).find((r) => r.slug === slug);
  assert.equal(card?.time, null);
  assert.equal(card?.image, null);
  // The card leaves the time and the image out when there are none.
  renderAt('/', [card!]);
  const link = screen.getByRole('link', { name: /Kaal/ });
  assert.ok(within(link).getByText('van Oma'));
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
  const heading = screen.getByRole('heading', { name: 'Wat eten we vandaag?' });
  const intro = screen.getByText(/Het kookboek van de familie/);
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
  assert.equal(screen.queryAllByRole('radio').length, 0);
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
  assert.ok(screen.getByText(/Niets gevonden/));
  // The way out sits with the message, after the count, and the search box keeps what was typed.
  assert.ok(screen.getAllByRole('button', { name: 'Wis filters' }).some((b) => precedes(screen.getByRole('status'), b)));
  assert.equal(searchBox().value, 'zzz');
});

test('recipe-filtering › Clearing all filters', () => {
  // "Wis filters" navigates to the address without filter parameters; that address shows everything with the defaults chosen.
  assert.equal(filterParams(noFilters).toString(), '');
  renderAt('/', family);
  assert.equal(shownTitles().length, family.length);
  assert.ok(screen.getByRole('button', { name: 'Iedereen', pressed: true }));
  assert.equal(screen.getByRole<HTMLInputElement>('radio', { name: 'Nieuwste' }).checked, true);
  assert.equal(searchBox().value, '');
  cleanup();
  // Using the button from the nothing-found message gets there.
  renderAt('/?q=zzz&auteur=Papa&sort=az', family);
  const wis = screen.getAllByRole('button', { name: 'Wis filters' }).find((b) => precedes(screen.getByRole('status'), b))!;
  fireEvent.click(wis);
  assert.equal(shownTitles().length, family.length);
  assert.equal(searchBox().value, '');
  assert.ok(screen.getByRole('button', { name: 'Iedereen', pressed: true }));
});

test('recipe-filtering › Opening a filtered address', () => {
  renderAt('/?q=appel', family);
  assert.equal(searchBox().value, 'appel');
  assert.deepEqual(shownTitles(), ['appeltaart']);
  cleanup();
  // Author and order come from the address too.
  renderAt('/?auteur=Papa&sort=az', family);
  assert.deepEqual(shownTitles(), ['erwtensoep', 'stoofvlees']);
  assert.ok(screen.getByRole('button', { name: 'Papa', pressed: true }));
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

// The history behaviour (replace) is set where the address changes, in the browser: it needs a real back button.
test.todo('recipe-filtering › Filtering does not fill the history');

test('recipe-filtering › Reaching the last recipe', async () => {
  // The page keeps room under the list for the fixed bar and the safe area on phones, and returns to normal spacing from 48rem.
  renderAt('/', family);
  const css = (await cssFor(screen.getByRole('main').className)).replace(/\s+/g, ' ');
  assert.match(css, /padding-bottom: calc\(7rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /@media \(width >= 48rem\) \{[^@]*padding-bottom: calc\(var\(--spacing\) \* 16\)/);
});
