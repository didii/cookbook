import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { beforeAll, describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createRecipe, getMemberRecipeData } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { test } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route } from './+types/NoteUpdateRoute';
import { action } from './NoteUpdateRoute';

let db: D1Database;

test.beforeAll(({ testDb }) => {
  ({ db } = testDb);
});

const post = (slug: string, fields: Record<string, string>, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const request = new Request('http://x/', { method: 'POST', body: new URLSearchParams(fields) });
  return action(fake<Route.ActionArgs>({ request, params: { slug }, context }));
};
const noteOf = async (slug: string) => (await getMemberRecipeData(db, 'oma@example.com', slug)).note;

describe('NoteUpdateRoute', () => {
  test('stores the note, and a blank note clears it', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Met notitie', author: 'Oma' });
    assert.equal((await post(slug, { note: 'minder zout' })).status, 204);
    assert.equal(await noteOf(slug), 'minder zout');
    assert.equal((await post(slug, { note: '  ' })).status, 204);
    assert.equal(await noteOf(slug), '');
  });

  describe('refuses what it cannot store', () => {
    let slug: string;
    beforeAll(async () => {
      await createUser(db, 'oma@example.com', 'Oma');
      slug = await createRecipe(db, { title: 'Streng', author: 'Oma' });
    });

    test('an unknown recipe gives 404', async () => {
      assert.equal((await post('does-not-exist', { note: 'x' })).status, 404);
    });

    test('an unknown user gives 403', async () => {
      assert.equal((await post(slug, { note: 'x' }, 'vreemd@example.com')).status, 403);
    });

    test('a missing note gives 400', async () => {
      assert.equal((await post(slug, {})).status, 400);
    });

    test('a note of 4000 characters is accepted', async () => {
      assert.equal((await post(slug, { note: 'x'.repeat(4000) })).status, 204);
    });
  });
});

describe('recipe-note › Note too long', () => {
  let slug: string;
  beforeAll(async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    slug = await createRecipe(db, { title: 'Lang', author: 'Oma' });
  });

  test('the action answers 413', async () => {
    assert.equal((await post(slug, { note: 'x'.repeat(4001) })).status, 413);
  });

  test('the note stays empty', async () => {
    await post(slug, { note: 'x'.repeat(4001) });
    assert.equal(await noteOf(slug), '');
  });
});
