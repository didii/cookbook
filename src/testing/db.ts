import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';
import { test as base } from 'vitest';

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

/** In-memory D1 with every migration applied and no data, plus an empty in-memory R2 bucket. Call dispose() when done. */
export async function createTestDb() {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response(null); } }',
      compatibilityDate: '2026-10-06',
      d1Databases: { DB: 'test' },
      r2Buckets: { PHOTOS: 'test-photos' },
    }),
  );
  // Miniflare's declarations import @cloudflare/workers-types, which is not installed (and would clash with the
  // generated worker-configuration.d.ts), so getD1Database is typed any. Annotating gives the real D1Database type.
  const db: D1Database = await mf.getD1Database('DB');
  const photos = (await mf.getR2Bucket('PHOTOS')) as unknown as R2Bucket; // typed as Miniflare's own R2Bucket, which differs from the generated one
  const migrations = readdirSync(join(root, 'db', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of migrations) await applySql(db, join(root, 'db', 'migrations', f));
  return { db, photos, dispose: () => mf.dispose() };
}

type TestDb = Pick<Awaited<ReturnType<typeof createTestDb>>, 'db' | 'photos'>;

/** Empties every table and the bucket, so the next user of a shared TestDb starts from the migrated schema. */
async function clear({ db, photos }: TestDb) {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*'")
    .all<{ name: string }>();
  await db.batch([db.prepare('PRAGMA defer_foreign_keys = on'), ...results.map(({ name }) => db.prepare(`DELETE FROM "${name}"`))]);
  let cursor: string | undefined;
  do {
    const page = await photos.list({ cursor });
    if (page.objects.length) await photos.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

/**
 * `test` with database fixtures. Booting Miniflare is slow, so one instance lives per worker and is emptied between users:
 * - `testDb`: shared by the tests of one file, emptied when the file is done. Use in `test.beforeAll`.
 * - `freshDb`: emptied after every test. Use in `test.beforeEach`.
 * Prefer these over `createTestDb()`, which boots an instance of its own.
 */
export const test = base.extend<{ $worker: { instance: TestDb }; $file: { testDb: TestDb }; $test: { freshDb: TestDb } }>({
  instance: [
    // eslint-disable-next-line no-empty-pattern -- Vitest reads the fixtures from the destructured first argument
    async ({}, provide) => {
      const { dispose, ...instance } = await createTestDb();
      await provide(instance);
      await dispose();
    },
    { scope: 'worker' },
  ],
  testDb: [
    async ({ instance }, provide) => {
      await provide(instance);
      await clear(instance);
    },
    { scope: 'file' },
  ],
  freshDb: async ({ instance }, provide) => {
    await provide(instance);
    await clear(instance);
  },
});
