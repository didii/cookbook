import { test as base } from 'vitest';
import { clearDb, clearPhotos, createBucket, createDb, createMiniflare } from './db';

/**
 * `test` with database fixtures. Booting Miniflare is slow, so one instance (`mf`, `db`, `photos`) lives per worker.
 * The `cleanup` auto fixture empties it when a file is done; a test that needs an empty database calls `clearDb(db)` itself.
 */
export const test = base
  // eslint-disable-next-line no-empty-pattern -- Vitest reads the fixtures from the destructured first argument
  .extend('mf', { scope: 'worker' }, async ({}, { onCleanup }) => {
    const mf = createMiniflare();
    onCleanup(() => mf.dispose());
    return mf;
  })
  .extend('db', { scope: 'worker' }, async ({ mf }) => {
    const db = await createDb(mf);
    return db;
  })
  .extend('photos', { scope: 'worker' }, async ({ mf }) => {
    const photos = await createBucket(mf);
    return photos;
  })
  // Empties the worker's database and bucket once the file is done, so the next file starts clean.
  .extend('cleanup', { scope: 'file', auto: true }, async ({ db, photos }, { onCleanup }) => {
    onCleanup(async () => {
      await clearDb(db);
      await clearPhotos(photos);
    });
  });
