import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import type { Route } from './+types/route';
import { loader } from './route';

// The loader serves hardcoded recipes for now (see route.tsx); reading from the database is tested in .server/recipes.test.ts.
const load = (slug: string) => loader({ params: { slug }, context: new RouterContextProvider() } as Partial<Route.LoaderArgs> as Route.LoaderArgs);

test('recipe-viewing › Unknown slug', () => {
  assert.throws(
    () => load('does-not-exist'),
    (thrown: { init?: { status?: number } }) => thrown.init?.status === 404,
  );
});

// Not automated: rendering needs component tests.
test.todo('recipe-viewing › Optional fields are empty');
test.todo('recipe-viewing › Ingredient without quantity');

// Rendering needs the JSX settings that tsx doesn't read from this project's tsconfig, so this checks the source:
// the page links to the edit address of its own recipe and the route table serves it.
test('recipe-viewing › Link to the edit form', () => {
  assert.ok(readFileSync(new URL('./RecipePage.tsx', import.meta.url), 'utf8').includes('/bewerken`}'));
  assert.ok(readFileSync(new URL('../../routes.ts', import.meta.url), 'utf8').includes("'recepten/:slug/bewerken'"));
});
