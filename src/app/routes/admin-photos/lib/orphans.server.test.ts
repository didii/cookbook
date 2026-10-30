import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import { deletePhotos, findPhotos } from './orphans.server';
import { photoCap } from './photos';

const name = (n: number, ext = 'jpg') => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}.${ext}`;
const put = (photos: R2Bucket, file: string, bytes = 3) => photos.put(`photos/${file}`, new Uint8Array(bytes));
const keys = async (photos: R2Bucket) => (await photos.list()).objects.map((o) => o.key.slice('photos/'.length));

const now = () => new Date();
/** A moment when everything put in the bucket during the test is more than a day old. */
const later = () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const both = { onlyUnused: true, onlyOld: true };
const names = async (db: D1Database, photos: R2Bucket, filters = both, at = later()) =>
  (await findPhotos(db, photos, filters, at)).photos.map((p) => p.name);

const recipe = (db: D1Database, slug: string, title: string, image: string | null = null) =>
  db.prepare('INSERT INTO recipes (slug, title, author, servings, image) VALUES (?, ?, ?, 2, ?)').bind(slug, title, 'Oma', image).run();
const step = (db: D1Database, slug: string, image: string) =>
  db
    .prepare('INSERT INTO steps (recipe_id, position, body, image) VALUES ((SELECT id FROM recipes WHERE slug = ?), 1, ?, ?)')
    .bind(slug, 'stap', image)
    .run();

describe('orphaned-photos › Unused photo is listed', () => {
  test('has its name, size and upload date', async ({ db, photos }) => {
    await put(photos, name(1), 5);
    const [photo] = (await findPhotos(db, photos, both, later())).photos;
    assert.equal(photo.name, name(1));
    assert.equal(photo.size, 5);
    assert.ok(photo.uploaded instanceof Date);
    assert.equal(photo.recipe, null);
  });
});

describe('orphaned-photos › Used photo is hidden by default', () => {
  test('is left out with the filter on', async ({ db, photos }) => {
    await put(photos, name(1));
    await put(photos, name(2));
    await recipe(db, 'taart', 'Taart', `/foto/${name(1)}`);
    assert.deepEqual(await names(db, photos), [name(2)]);
  });
});

describe('orphaned-photos › Photo of a step is hidden by default', () => {
  test('is left out with the filter on', async ({ db, photos }) => {
    await put(photos, name(1));
    await recipe(db, 'taart', 'Taart');
    await step(db, 'taart', `/foto/${name(1)}`);
    assert.deepEqual(await names(db, photos), []);
  });
});

describe('orphaned-photos › Recent photo is hidden by default', () => {
  test('is left out with the filter on', async ({ db, photos }) => {
    await put(photos, name(1));
    assert.deepEqual(await names(db, photos, both, now()), []);
  });
});

describe('orphaned-photos › Used photo is shown without the filter', () => {
  test('is listed with its recipe', async ({ db, photos }) => {
    await put(photos, name(1));
    await recipe(db, 'taart', 'Taart', `/foto/${name(1)}`);
    const { photos: listed } = await findPhotos(db, photos, { onlyUnused: false, onlyOld: true }, later());
    assert.deepEqual(
      listed.map((p) => p.recipe),
      [{ title: 'Taart', slug: 'taart' }],
    );
  });

  test('a photo of a step names the recipe of the step', async ({ db, photos }) => {
    await put(photos, name(1));
    await recipe(db, 'taart', 'Taart');
    await step(db, 'taart', `/foto/${name(1)}`);
    const { photos: listed } = await findPhotos(db, photos, { onlyUnused: false, onlyOld: true }, later());
    assert.deepEqual(listed[0].recipe, { title: 'Taart', slug: 'taart' });
  });
});

describe('orphaned-photos › Recent photo is shown without the filter', () => {
  test('is listed and marked recent', async ({ db, photos }) => {
    await put(photos, name(1));
    const { photos: listed } = await findPhotos(db, photos, { onlyUnused: true, onlyOld: false }, now());
    assert.deepEqual(
      listed.map((p) => p.recent),
      [true],
    );
  });
});

describe('orphaned-photos › Oldest first', () => {
  // R2 sets the upload date itself, so a stand-in bucket lists photos with chosen dates, in key order.
  const listing = (ages: number[]) =>
    fake<R2Bucket>({
      list: async () => ({
        objects: ages.map((days, i) => ({ key: `photos/${name(i + 1)}`, size: 1, uploaded: new Date(Date.now() - days * 24 * 60 * 60 * 1000) })),
        truncated: false,
      }),
    });

  test('lists the earliest upload first', async ({ db }) => {
    assert.deepEqual(await names(db, listing([3, 5, 4])), [name(2), name(3), name(1)]);
  });
});

describe('orphaned-photos › Only 100 are shown', () => {
  test('lists the cap and counts all matches', async ({ db, photos }) => {
    await Promise.all(Array.from({ length: photoCap + 2 }, (_, i) => put(photos, name(i + 1))));
    const found = await findPhotos(db, photos, both, later());
    assert.equal(found.photos.length, photoCap);
    assert.equal(found.matches, photoCap + 2);
  }, 30_000);

  test('the filters apply before the cap', async ({ db, photos }) => {
    await Promise.all(
      Array.from({ length: photoCap }, (_, i) => Promise.all([put(photos, name(i + 1)), recipe(db, `r${i}`, `R${i}`, `/foto/${name(i + 1)}`)])),
    );
    await put(photos, name(500));
    assert.deepEqual(await names(db, photos), [name(500)]);
  }, 30_000);
});

describe('orphaned-photos › Chosen photos are deleted', () => {
  test('removes the chosen ones and keeps the others', async ({ db, photos }) => {
    for (const n of [1, 2, 3]) await put(photos, name(n));
    const result = await deletePhotos(db, photos, [name(1), name(3)]);
    assert.deepEqual(result, { deleted: 2, kept: [] });
    assert.deepEqual(await keys(photos), [name(2)]);
  });
});

describe('orphaned-photos › Photo used in the meantime', () => {
  test('is kept and reported with its recipe', async ({ db, photos }) => {
    await put(photos, name(1));
    await recipe(db, 'taart', 'Taart', `/foto/${name(1)}`);
    const result = await deletePhotos(db, photos, [name(1)]);
    assert.deepEqual(result, { deleted: 0, kept: [{ title: 'Taart', slug: 'taart' }] });
    assert.deepEqual(await keys(photos), [name(1)]);
  });
});

describe('orphaned-photos › Recent photo can be deleted', () => {
  test('is removed', async ({ db, photos }) => {
    await put(photos, name(1));
    assert.equal((await deletePhotos(db, photos, [name(1)])).deleted, 1);
    assert.deepEqual(await keys(photos), []);
  });
});

describe('orphaned-photos › Used photo cannot be deleted by request', () => {
  test('a photo of a step stays', async ({ db, photos }) => {
    await put(photos, name(1));
    await recipe(db, 'taart', 'Taart');
    await step(db, 'taart', `/foto/${name(1)}`);
    await deletePhotos(db, photos, [name(1)]);
    assert.deepEqual(await keys(photos), [name(1)]);
  });
});

describe('orphaned-photos › Unknown name', () => {
  test('is ignored and the others are handled', async ({ db, photos }) => {
    await put(photos, name(1));
    await put(photos, 'other.txt');
    const result = await deletePhotos(db, photos, ['../photos/other.txt', 'other.txt', name(1)]);
    assert.deepEqual(result, { deleted: 1, kept: [] });
    assert.deepEqual(await keys(photos), ['other.txt']);
  });
});
