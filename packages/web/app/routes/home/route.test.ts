import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { cssFor } from '~testing/css';
import { createTestDb } from '~testing/db';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, RouterContextProvider } from 'react-router';
import { envContext } from '~/.server/context';
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
  return (await loader({ context } as Partial<Route.LoaderArgs> as Route.LoaderArgs)).recipes;
};

const render = async () => {
  const loaderData = { recipes: await load() };
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Home, { loaderData } as Route.ComponentProps)));
};

// Runs first: the other tests add recipes to the shared database.
test('recipe-browsing › No recipes yet', async () => {
  assert.deepEqual(await load(), []);
  const html = await render();
  assert.ok(html.includes('Er zijn nog geen recepten') && html.includes('href="/recepten/nieuw"'));
  assert.ok(!html.includes('<output') && !html.includes('<input'));
});

test('recipe-browsing › Recipe without time or image', async () => {
  const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma' });
  const card = (await load()).find((r) => r.slug === slug);
  assert.equal(card?.time, null);
  assert.equal(card?.image, null);
  // The card leaves the time out when there is none.
  assert.ok(readFileSync(new URL('./RecipeCard.tsx', import.meta.url), 'utf8').includes('{r.time && '));
});

test('recipe-browsing › Stored recipes are listed', async () => {
  const first = await createRecipe(db, { title: 'Eerste', author: 'Papa', time: '30 min', image: '/a.jpg' });
  const second = await createRecipe(db, { title: 'Tweede', author: 'Mama' });
  const slugs = (await load()).map((r) => r.slug);
  assert.deepEqual(slugs.slice(0, 2), [second, first]);
});

test('recipe-browsing › A new recipe appears', async () => {
  const count = (html: string) => /<output[^>]*>(\d+) recept/.exec(html)?.[1];
  const listed = await load();
  assert.equal(count(await render()), String(listed.length));
  const slug = await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
  const relisted = await load();
  assert.equal(relisted.length, listed.length + 1);
  assert.equal(relisted[0]?.slug, slug);
  assert.equal(count(await render()), String(relisted.length));
});

test('recipe-browsing › Welcome above the recipes', async () => {
  const html = await render();
  const heading = html.indexOf('Wat eten we vandaag?');
  const intro = html.indexOf('Het kookboek van de familie');
  assert.ok(heading >= 0 && intro > heading && intro < html.indexOf('<ul'));
});

// Filtering runs in the browser over the loaded list, so these render the page for a given list and address.
const summary = (title: string, author: string): RecipeSummary => ({ slug: title.toLowerCase(), title, author, time: null, image: null, seal: null });
const renderAt = (url: string, recipes: RecipeSummary[]) =>
  renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [url] }, createElement(Home, { loaderData: { recipes } } as Route.ComponentProps)),
  );
const text = (html: string) =>
  html
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
const shownTitles = (html: string) => [...html.matchAll(/href="\/recepten\/([^"]+)"/g)].map((m) => m[1]);
const family = [
  summary('Erwtensoep', 'Papa'),
  summary('Appeltaart', 'Oma'),
  summary('Pannenkoeken', 'Tante An'),
  summary('Stoofvlees', 'Papa'),
  summary('Rijstpap', 'Mama'),
];
const twelve = Array.from({ length: 12 }, (_, i) => summary(i < 3 ? `Soep ${i}` : `Gerecht ${i}`, 'Oma'));

test('recipe-filtering › Few recipes', () => {
  const html = renderAt('/', family.slice(0, 3));
  assert.match(html, /type="search"/);
  assert.doesNotMatch(html, /aria-pressed|type="radio"/);
  assert.match(renderAt('/', family), /aria-pressed/);
  // An address that sets author or order is ignored when those controls are not offered, since they could not be undone.
  assert.deepEqual(shownTitles(renderAt('/?auteur=Papa&sort=az', family.slice(0, 3))), ['erwtensoep', 'appeltaart', 'pannenkoeken']);
});

test('recipe-filtering › Count with a filter', () => {
  assert.match(text(renderAt('/?q=soep', twelve)), /3 van 12 recepten/);
});

test('recipe-filtering › Count without a filter', () => {
  assert.match(text(renderAt('/', twelve)), /12 recepten/);
  assert.doesNotMatch(text(renderAt('/', twelve)), / van 12/);
});

test('recipe-filtering › Nothing found', () => {
  const html = renderAt('/?q=zzz', family);
  assert.deepEqual(shownTitles(html), []);
  assert.match(text(html), /Niets gevonden/);
  // The way out sits with the message, after the count, and the search box keeps what was typed.
  assert.match(html.slice(html.indexOf('</output>')), /Wis filters/);
  assert.match(html, /<input[^>]*type="search"[^>]*value="zzz"|<input[^>]*value="zzz"[^>]*type="search"/);
});

test('recipe-filtering › Clearing all filters', () => {
  // "Wis filters" navigates to the address without filter parameters; that address shows everything with the defaults chosen.
  assert.equal(filterParams(noFilters).toString(), '');
  const html = renderAt('/', family);
  assert.equal(shownTitles(html).length, family.length);
  assert.match(html, /aria-pressed="true"[^>]*>Iedereen</);
  assert.match(html, /<input[^>]*-nieuwste"[^>]*checked=""/);
  assert.match(html, /<input[^>]*type="search"[^>]*value=""/);
});

test('recipe-filtering › Opening a filtered address', () => {
  const html = renderAt('/?q=appel', family);
  assert.match(html, /<input[^>]*type="search"[^>]*value="appel"|<input[^>]*value="appel"[^>]*type="search"/);
  assert.deepEqual(shownTitles(html), ['appeltaart']);
  // Author and order come from the address too.
  const byAuthor = renderAt('/?auteur=Papa&sort=az', family);
  assert.deepEqual(shownTitles(byAuthor), ['erwtensoep', 'stoofvlees']);
  assert.match(byAuthor, /aria-pressed="true"[^>]*>Papa</);
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
  const main = /<main[^>]*class="([^"]*)"/.exec(renderAt('/', family))?.[1] ?? '';
  const css = (await cssFor(main)).replace(/\s+/g, ' ');
  assert.match(css, /padding-bottom: calc\(7rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /@media \(width >= 48rem\) \{[^@]*padding-bottom: calc\(var\(--spacing\) \* 16\)/);
});
