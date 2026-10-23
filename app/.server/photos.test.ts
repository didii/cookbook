import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { deletePhoto, getPhoto, isPhotoPath, maxPhotoBytes, storePhoto } from './photos';

let photos: R2Bucket;
let dispose: () => Promise<void>;

before(async () => {
  ({ photos, dispose } = await createTestDb());
});
after(() => dispose());

const bytes = (...head: number[]) => {
  const b = new Uint8Array(64);
  b.set(head);
  return b.buffer;
};
const jpeg = () => bytes(0xff, 0xd8, 0xff, 0xe0);
const count = async () => (await photos.list()).objects.length;

test('recipe-photo › Acceptable photo is stored', async () => {
  const before = await count();
  for (const [data, ext, type] of [
    [jpeg(), 'jpg', 'image/jpeg'],
    [bytes(0x89, 0x50, 0x4e, 0x47), 'png', 'image/png'],
    [bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50), 'webp', 'image/webp'],
  ] as const) {
    const res = await storePhoto(photos, data);
    assert.ok('path' in res);
    assert.match(res.path, new RegExp(`^/foto/[0-9a-f-]{36}.${ext}$`));
    assert.equal(isPhotoPath(res.path), true);
    const stored = await getPhoto(photos, res.path.slice('/foto/'.length));
    assert.equal(stored?.httpMetadata?.contentType, type);
  }
  assert.equal(await count(), before + 3);
});

test('recipe-photo › Oversized file refused', async () => {
  const before = await count();
  assert.deepEqual(await storePhoto(photos, new Uint8Array(maxPhotoBytes + 1).fill(0xff).buffer), { status: 413 });
  assert.equal(await count(), before);
});

test('recipe-photo › Other file types refused', async () => {
  const before = await count();
  // A text file named .jpg: only the content counts.
  assert.deepEqual(await storePhoto(photos, new TextEncoder().encode('just text, named cat.jpg').buffer), { status: 415 });
  assert.deepEqual(await storePhoto(photos, bytes(0x47, 0x49, 0x46, 0x38)), { status: 415 });
  assert.deepEqual(await storePhoto(photos, new ArrayBuffer(0)), { status: 415 });
  assert.equal(await count(), before);
});

test('recipe-photo › Unknown photo', async () => {
  assert.equal(await getPhoto(photos, '00000000-0000-4000-8000-000000000000.jpg'), null);
  // Names that are not <uuid>.<ext> never reach the bucket
  await photos.put('photos/secret', 'x');
  assert.equal(await getPhoto(photos, 'secret'), null);
});

test('deletePhoto removes an upload and ignores other paths', async () => {
  const res = await storePhoto(photos, jpeg());
  assert.ok('path' in res);
  await deletePhoto(photos, '/img/appeltaart.jpg');
  assert.ok(await getPhoto(photos, res.path.slice(6)));
  await deletePhoto(photos, res.path);
  assert.equal(await getPhoto(photos, res.path.slice(6)), null);
});
