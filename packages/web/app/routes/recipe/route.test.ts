import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/lib/context';
import { createTestDb } from '../../../testing/db';
import { loader } from './route';

// The single integration test for this endpoint: real loader, real queries, seeded database.
// Not-found handling and row mapping are unit-tested where that logic lives.
test('loads a seeded recipe through the real loader', async () => {
  const { db, dispose } = await createTestDb({ seed: true });
  try {
    const context = new RouterContextProvider();
    context.set(envContext, { DB: db } as Env);
    const { recipe } = await loader({ params: { slug: 'appeltaart' }, context } as unknown as Parameters<typeof loader>[0]);
    assert.equal(recipe.title, 'Appeltaart');
    assert.equal(recipe.ingredients.length, 7);
    assert.equal(recipe.steps.length, 6);
  } finally {
    await dispose();
  }
});
