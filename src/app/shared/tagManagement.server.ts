import { sortTags, type ManagedTag } from './tags';

/** Why a write was refused. Nothing is thrown for these, so the page can answer the form. */
export type TagError = { error: 'empty' | 'tooLong' | 'taken' | 'notFound' | 'same'; taken?: string; field?: 'name' | 'category' };
export type TagResult = { ok: true } | TagError;

const maxLength = 100;

/** Trimmed, with inner runs of whitespace collapsed. */
export const normalizeName = (raw: string) => raw.trim().replace(/\s+/g, ' ');

const checkName = (name: string): TagError | undefined => {
  if (!name) return { error: 'empty' };
  if (name.length > maxLength) return { error: 'tooLong' };
};

/** The stored spelling of another tag that has this name (letter case ignored), if any. `except` is the tag itself. */
async function findTaken(db: D1Database, name: string, except?: string) {
  const row = await db
    .prepare('SELECT name FROM tags WHERE name = ?1 AND (?2 IS NULL OR name <> ?2)')
    .bind(name, except ?? null)
    .first<{ name: string }>();
  return row?.name;
}

const exists = async (db: D1Database, name: string) => !!(await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first());

// One statement after every write that can free a category: categories no tag has are not kept.
const pruneCategories = (db: D1Database) =>
  db.prepare('DELETE FROM categories WHERE id NOT IN (SELECT category_id FROM tags WHERE category_id IS NOT NULL)');

// Reuses the stored spelling of a category (NOCASE) or creates it, then points the tags at it; empty removes the category.
const assignCategory = (db: D1Database, where: string, binds: unknown[], category: string) =>
  category
    ? [
        db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').bind(category),
        db.prepare(`UPDATE tags SET category_id = (SELECT id FROM categories WHERE name = ?) WHERE ${where}`).bind(category, ...binds),
      ]
    : [db.prepare(`UPDATE tags SET category_id = NULL WHERE ${where}`).bind(...binds)];

const isUnique = (e: unknown) => e instanceof Error && /UNIQUE|constraint/i.test(e.message);

/** Every tag with its category and the number of recipes that have it, in no particular order. */
export async function listManagedTags(db: D1Database): Promise<ManagedTag[]> {
  const { results } = await db
    .prepare(
      'SELECT t.name, c.name AS category, (SELECT COUNT(*) FROM recipe_tags rt WHERE rt.tag_id = t.id) AS uses FROM tags t LEFT JOIN categories c ON c.id = t.category_id',
    )
    .all<ManagedTag>();
  return results;
}

/** The stored categories, alphabetical. */
export async function listCategories(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare('SELECT name FROM categories').all<{ name: string }>();
  return sortTags(results.map((r) => r.name));
}

/** Adds a tag without a category. */
export async function addTag(db: D1Database, raw: string): Promise<TagResult> {
  const name = normalizeName(raw);
  const invalid = checkName(name);
  if (invalid) return invalid;
  const taken = await findTaken(db, name);
  if (taken) return { error: 'taken', taken };
  try {
    await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run();
  } catch (e) {
    if (isUnique(e)) return { error: 'taken', taken: name };
    throw e;
  }
  return { ok: true };
}

/** Renames a tag and sets its category in one batch. A taken name (another tag, any letter case) refuses everything. */
export async function saveTag(db: D1Database, current: string, input: { name: string; category: string }): Promise<TagResult> {
  const name = normalizeName(input.name);
  const category = normalizeName(input.category);
  const invalid = checkName(name);
  if (invalid) return invalid;
  if (category.length > maxLength) return { error: 'tooLong', field: 'category' };
  if (!(await exists(db, current))) return { error: 'notFound' };
  const taken = await findTaken(db, name, current);
  if (taken) return { error: 'taken', taken };
  try {
    await db.batch([
      db.prepare('UPDATE tags SET name = ? WHERE name = ?').bind(name, current),
      ...assignCategory(db, 'name = ?', [name], category),
      pruneCategories(db),
    ]);
  } catch (e) {
    if (isUnique(e)) return { error: 'taken', taken: name };
    throw e;
  }
  return { ok: true };
}

/** Gives every recipe with `from` the tag `into` (once), removes `from` and keeps `into` as it is. */
export async function mergeTag(db: D1Database, from: string, into: string): Promise<TagResult> {
  const ids = await Promise.all([from, into].map((name) => db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>()));
  if (!ids[0] || !ids[1]) return { error: 'notFound' };
  // Compared by id, so letter case decides as it does everywhere else; a merge into itself would drop every link and the tag.
  if (ids[0].id === ids[1].id) return { error: 'same' };
  const id = 'SELECT id FROM tags WHERE name = ?';
  await db.batch([
    db.prepare(`UPDATE OR IGNORE recipe_tags SET tag_id = (${id}) WHERE tag_id = (${id})`).bind(into, from),
    db.prepare(`DELETE FROM recipe_tags WHERE tag_id = (${id})`).bind(from),
    db.prepare('DELETE FROM tags WHERE name = ?').bind(from),
    pruneCategories(db),
  ]);
  return { ok: true };
}

/** Deletes a tag and its links to recipes, never the recipes. */
export async function deleteTag(db: D1Database, name: string): Promise<TagResult> {
  if (!(await exists(db, name))) return { error: 'notFound' };
  await db.batch([
    db.prepare('DELETE FROM recipe_tags WHERE tag_id = (SELECT id FROM tags WHERE name = ?)').bind(name),
    db.prepare('DELETE FROM tags WHERE name = ?').bind(name),
    pruneCategories(db),
  ]);
  return { ok: true };
}

/** Gives all named tags one category (empty removes it). Returns how many tags changed. */
export async function setCategory(db: D1Database, names: string[], raw: string): Promise<{ ok: true; changed: number } | TagError> {
  const category = normalizeName(raw);
  if (category.length > maxLength) return { error: 'tooLong', field: 'category' };
  if (!names.length) return { ok: true, changed: 0 };
  const where = `name IN (${names.map(() => '?').join(', ')})`;
  const results = await db.batch([...assignCategory(db, where, names, category), pruneCategories(db)]);
  const update = results[category ? 1 : 0];
  return { ok: true, changed: update.meta.changes };
}
