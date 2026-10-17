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

/** In-memory D1 with every migration applied, and optionally the dev seed. Call dispose() when done. */
export async function createTestDb({ seed = false } = {}) {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response(null); } }',
      compatibilityDate: '2026-10-06',
      d1Databases: { DB: 'test' },
    }),
  );
  const db = (await mf.getD1Database('DB')) as unknown as D1Database;
  const migrations = readdirSync(join(root, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const files = migrations.map((f) => join(root, 'migrations', f));
  if (seed) files.push(join(root, 'seed', 'dev.sql'));
  for (const file of files) await db.batch(statements(file).map((s) => db.prepare(s)));
  return { db, dispose: () => mf.dispose() };
}
