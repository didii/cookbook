import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';

const root = join(import.meta.dirname, '..');

/** D1's exec() runs one statement per line, so split on `;` at the end of a line and run the pieces as a batch. */
const statements = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/^--.*$/gm, '')
    .split(/;[ \t]*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Runs a .sql file against the database, statement by statement. */
export async function applySql(db: D1Database, file: string) {
  await db.batch(statements(file).map((s) => db.prepare(s)));
}

/** A Miniflare with an in-memory D1 (`DB`) and R2 bucket (`PHOTOS`). Call dispose() when done. */
export function createMiniflare() {
  return new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response(null); } }',
      compatibilityDate: '2026-10-06',
      d1Databases: { DB: 'test' },
      r2Buckets: { PHOTOS: 'test-photos' },
    }),
  );
}

/** The Miniflare's D1 with every migration applied and no data. */
export async function createDb(miniflare: Miniflare) {
  // Miniflare's declarations import @cloudflare/workers-types, which is not installed (and would clash with the
  // generated worker-configuration.d.ts), so getD1Database is typed any. Annotating gives the real D1Database type.
  const db: D1Database = await miniflare.getD1Database('DB');
  const migrations = readdirSync(join(root, 'db', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of migrations) await applySql(db, join(root, 'db', 'migrations', f));
  return db;
}

/** The Miniflare's empty R2 bucket. */
export async function createBucket(miniflare: Miniflare) {
  return (await miniflare.getR2Bucket('PHOTOS')) as unknown as R2Bucket; // typed as Miniflare's own R2Bucket, which differs from the generated one
}

/** Empties every table, so the next test starts from the migrated schema. */
export async function clearDb(db: D1Database) {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*'")
    .all<{ name: string }>();
  await db.batch([db.prepare('PRAGMA defer_foreign_keys = on'), ...results.map(({ name }) => db.prepare(`DELETE FROM "${name}"`))]);
}

/** Deletes every object from the bucket. */
export async function clearPhotos(photos: R2Bucket) {
  let cursor: string | undefined;
  do {
    const page = await photos.list({ cursor });
    if (page.objects.length) await photos.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}
