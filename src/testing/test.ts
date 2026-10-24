import { test as base } from 'vitest';
import { clearDb, clearPhotos, createBucket, createDb, createMiniflare } from './db';

/**
 * `test` with database fixtures. Booting Miniflare is slow, so one instance lives per worker (`mf`, `rawDb`, `rawPhotos`).
 * `db` and `photos` are test-scoped: a test starts with them empty and they are emptied after every test that asks for them.
 * Seed in the test or in `test.beforeEach`; suite-level `beforeAll` cannot get a test-scoped fixture.
 */
export const test = base
  // eslint-disable-next-line no-empty-pattern -- Vitest reads the fixtures from the destructured first argument
  .extend('mf', { scope: 'worker' }, async ({}, { onCleanup }) => {
    const mf = createMiniflare();
    onCleanup(() => mf.dispose());
    return mf;
  })
  .extend('rawDb', { scope: 'worker' }, async ({ mf }) => createDb(mf))
  .extend('rawPhotos', { scope: 'worker' }, async ({ mf }) => createBucket(mf))
  .extend('db', async ({ rawDb }, { onCleanup }) => {
    onCleanup(() => clearDb(rawDb));
    return rawDb;
  })
  .extend('photos', async ({ rawPhotos }, { onCleanup }) => {
    onCleanup(() => clearPhotos(rawPhotos));
    return rawPhotos;
  });
