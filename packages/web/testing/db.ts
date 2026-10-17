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

/** In-memory D1 with every migration applied and no data. Call dispose() when done. */
export async function createTestDb() {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response(null); } }',
      compatibilityDate: '2026-10-06',
      d1Databases: { DB: 'test' },
    }),
  );
  // Miniflare's declarations import @cloudflare/workers-types, which is not installed (and would clash with the
  // generated worker-configuration.d.ts), so getD1Database is typed any. Annotating gives the real D1Database type.
  const db: D1Database = await mf.getD1Database('DB');
  const migrations = readdirSync(join(root, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of migrations) await applySql(db, join(root, 'migrations', f));
  return { db, dispose: () => mf.dispose() };
}
