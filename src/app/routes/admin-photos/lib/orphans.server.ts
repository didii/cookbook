import { deletePhoto, isPhotoPath } from '~app/shared/photos.server';

export const photoCap = 100;
const day = 24 * 60 * 60 * 1000;

export type PhotoRecipe = { title: string; slug: string };
/** A stored photo. `recipe` is the recipe that uses it (the first one when several share it), null when none does. */
export type StoredPhotoInfo = { name: string; size: number; uploaded: Date; recent: boolean; recipe: PhotoRecipe | null };
export type PhotoFilters = { onlyUnused: boolean; onlyOld: boolean };

/** The recipe that uses each stored photo, by file name, from the image of every recipe and step. */
async function usedPhotos(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT image, title, slug FROM recipes WHERE image LIKE '/foto/%'
       UNION ALL
       SELECT s.image, r.title, r.slug FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE s.image LIKE '/foto/%'`,
    )
    .all<{ image: string; title: string; slug: string }>();
  const used = new Map<string, PhotoRecipe>();
  for (const { image, title, slug } of results) {
    const name = image.slice('/foto/'.length);
    if (!used.has(name)) used.set(name, { title, slug });
  }
  return used;
}

/** The stored photos that match the filters, oldest first and at most `photoCap`, with the number of matches. */
export async function findPhotos(db: D1Database, bucket: R2Bucket, { onlyUnused, onlyOld }: PhotoFilters, now: Date) {
  const used = await usedPhotos(db);
  const all: StoredPhotoInfo[] = [];
  let cursor: string | undefined;
  // ponytail: the whole bucket is listed on every page load; add a page limit and cursor if it reaches many thousands of photos
  do {
    const page = await bucket.list({ prefix: 'photos/', cursor });
    for (const { key, size, uploaded } of page.objects) {
      const name = key.slice('photos/'.length);
      if (isPhotoPath(`/foto/${name}`))
        all.push({ name, size, uploaded, recent: now.getTime() - uploaded.getTime() < day, recipe: used.get(name) ?? null });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const matching = all.filter((p) => !(onlyUnused && p.recipe) && !(onlyOld && p.recent)).sort((a, b) => a.uploaded.getTime() - b.uploaded.getTime());
  return { photos: matching.slice(0, photoCap), matches: matching.length };
}

/** Deletes the named photos that no recipe or step uses (checked now); the used ones are kept and reported with their recipe. Names that are not shaped like a stored photo are ignored. The age of a photo does not matter. */
export async function deletePhotos(db: D1Database, bucket: R2Bucket, names: string[]) {
  const used = await usedPhotos(db);
  const valid = [...new Set(names)].filter((n) => isPhotoPath(`/foto/${n}`));
  const kept = valid.flatMap((n) => used.get(n) ?? []);
  const toDelete = valid.filter((n) => !used.has(n));
  await Promise.all(toDelete.map((n) => deletePhoto(bucket, `/foto/${n}`)));
  return { deleted: toDelete.length, kept };
}
