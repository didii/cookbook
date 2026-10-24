import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { clearPhotos } from '~testing/db';
import { test } from '~testing/test';
import { deletePhoto, getPhoto, isPhotoPath, maxPhotoBytes, storePhoto } from './photos.server';

const bytes = (...head: number[]) => {
  const b = new Uint8Array(64);
  b.set(head);
  return b.buffer;
};
const jpeg = () => bytes(0xff, 0xd8, 0xff, 0xe0);
/** The file name getPhoto takes, from a stored /foto/ path. */
const fileOf = (path: string) => path.slice('/foto/'.length);
const count = async (photos: R2Bucket) => (await photos.list()).objects.length;

// Every test starts on an empty bucket.
test.beforeEach(async ({ photos }) => clearPhotos(photos));

describe('recipe-photo › Acceptable photo is stored', () => {
  for (const [name, data, ext, type] of [
    ['jpeg', jpeg(), 'jpg', 'image/jpeg'],
    ['png', bytes(0x89, 0x50, 0x4e, 0x47), 'png', 'image/png'],
    ['webp', bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50), 'webp', 'image/webp'],
  ] as const) {
    test(`a ${name} gets a /foto/<uuid>.${ext} path and its content type`, async ({ photos }) => {
      const res = await storePhoto(photos, data);
      assert.ok('path' in res);
      assert.match(res.path, new RegExp(`^/foto/[0-9a-f-]{36}.${ext}$`));
      assert.equal(isPhotoPath(res.path), true);
      const stored = await getPhoto(photos, fileOf(res.path));
      assert.equal(stored?.httpMetadata?.contentType, type);
    });

    test(`a ${name} adds one photo to the bucket`, async ({ photos }) => {
      await storePhoto(photos, data);
      assert.equal(await count(photos), 1);
    });
  }
});

describe('recipe-photo › Oversized file refused', () => {
  test('is refused with 413', async ({ photos }) => {
    assert.deepEqual(await storePhoto(photos, new Uint8Array(maxPhotoBytes + 1).fill(0xff).buffer), { status: 413 });
  });

  test('stores nothing', async ({ photos }) => {
    await storePhoto(photos, new Uint8Array(maxPhotoBytes + 1).fill(0xff).buffer);
    assert.equal(await count(photos), 0);
  });
});

describe('recipe-photo › Other file types refused', () => {
  test('a text file named .jpg is refused with 415, only the content counts', async ({ photos }) => {
    assert.deepEqual(await storePhoto(photos, new TextEncoder().encode('just text, named cat.jpg').buffer), { status: 415 });
  });

  test('a gif is refused with 415', async ({ photos }) => {
    assert.deepEqual(await storePhoto(photos, bytes(0x47, 0x49, 0x46, 0x38)), { status: 415 });
  });

  test('an empty file is refused with 415', async ({ photos }) => {
    assert.deepEqual(await storePhoto(photos, new ArrayBuffer(0)), { status: 415 });
  });

  test('stores nothing', async ({ photos }) => {
    await storePhoto(photos, new TextEncoder().encode('just text, named cat.jpg').buffer);
    await storePhoto(photos, bytes(0x47, 0x49, 0x46, 0x38));
    await storePhoto(photos, new ArrayBuffer(0));
    assert.equal(await count(photos), 0);
  });
});

describe('recipe-photo › Unknown photo', () => {
  test('a name that is not stored gives null', async ({ photos }) => {
    assert.equal(await getPhoto(photos, '00000000-0000-4000-8000-000000000000.jpg'), null);
  });

  test('names that are not <uuid>.<ext> never reach the bucket', async ({ photos }) => {
    await photos.put('photos/secret', 'x');
    assert.equal(await getPhoto(photos, 'secret'), null);
  });
});

describe('deletePhoto', () => {
  test('ignores other paths', async ({ photos }) => {
    const res = await storePhoto(photos, jpeg());
    assert.ok('path' in res);
    await deletePhoto(photos, '/img/appeltaart.jpg');
    assert.ok(await getPhoto(photos, fileOf(res.path)));
  });

  test('removes an upload', async ({ photos }) => {
    const res = await storePhoto(photos, jpeg());
    assert.ok('path' in res);
    await deletePhoto(photos, res.path);
    assert.equal(await getPhoto(photos, fileOf(res.path)), null);
  });
});
