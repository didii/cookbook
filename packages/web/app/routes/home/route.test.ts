import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, RouterContextProvider } from 'react-router';
import { envContext } from '~/.server/context';
import { createRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import Home, { loader } from './route';

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
