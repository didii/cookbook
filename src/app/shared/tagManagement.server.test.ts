import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { addTag, deleteTag, listCategories, listManagedTags, mergeTag, saveTag, setCategory } from './tagManagement.server';

const tag = async (db: D1Database, name: string, category?: string) => {
  if (category) await db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').bind(category).run();
  await db
    .prepare('INSERT INTO tags (name, category_id) VALUES (?, (SELECT id FROM categories WHERE name = ?))')
    .bind(name, category ?? null)
    .run();
};
const recipe = async (db: D1Database, slug: string, ...tags: string[]) => {
  await db.prepare('INSERT INTO recipes (slug, title, author, servings) VALUES (?, ?, ?, ?)').bind(slug, slug, 'Oma', 4).run();
  for (const t of tags)
    await db
      .prepare('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ((SELECT id FROM recipes WHERE slug = ?), (SELECT id FROM tags WHERE name = ?))')
      .bind(slug, t)
      .run();
};
const stored = async (db: D1Database) => Object.fromEntries((await listManagedTags(db)).map((t) => [t.name, t.category]));
const categories = async (db: D1Database) =>
  (await db.prepare('SELECT name FROM categories ORDER BY name').all<{ name: string }>()).results.map((r) => r.name);
const recipesOf = async (db: D1Database, name: string) =>
  (
    await db
      .prepare(
        'SELECT r.slug FROM recipe_tags rt JOIN recipes r ON r.id = rt.recipe_id JOIN tags t ON t.id = rt.tag_id WHERE t.name = ? ORDER BY r.slug',
      )
      .bind(name)
      .all<{ slug: string }>()
  ).results.map((r) => r.slug);

describe('recipe-storage › Categories are listed alphabetically', () => {
  test('letter case is ignored', async ({ db }) => {
    await tag(db, 'a', 'seizoen');
    await tag(db, 'b', 'Gerecht');
    await tag(db, 'c', 'Dieet');
    assert.deepEqual(await listCategories(db), ['Dieet', 'Gerecht', 'seizoen']);
  });
});

describe('listManagedTags', () => {
  test('gives name, category and number of recipes', async ({ db }) => {
    await tag(db, 'Soep', 'Gerecht');
    await tag(db, 'Snel');
    await recipe(db, 'r1', 'Soep');
    await recipe(db, 'r2', 'Soep');
    const list = (await listManagedTags(db)).sort((a, b) => a.name.localeCompare(b.name));
    assert.deepEqual(list, [
      { name: 'Snel', category: null, uses: 0 },
      { name: 'Soep', category: 'Gerecht', uses: 2 },
    ]);
  });
});

describe('tag-management › Row shows tag, category and count', () => {
  test('the list data has the category and the count of the tag', async ({ db }) => {
    await tag(db, 'Soep', 'Gerecht');
    for (let i = 0; i < 7; i++) await recipe(db, `soep-${i}`, 'Soep');
    assert.deepEqual(await listManagedTags(db), [{ name: 'Soep', category: 'Gerecht', uses: 7 }]);
  });
});

describe('tag-management › Unused tag', () => {
  test('the count is 0', async ({ db }) => {
    await tag(db, 'Kerst');
    assert.equal((await listManagedTags(db))[0].uses, 0);
  });
});

describe('tag-management › A tag is added', () => {
  test('it is stored without a category and with 0 recipes', async ({ db }) => {
    assert.deepEqual(await addTag(db, '  Kerst '), { ok: true });
    assert.deepEqual(await listManagedTags(db), [{ name: 'Kerst', category: null, uses: 0 }]);
  });

  test('inner runs of spaces are collapsed', async ({ db }) => {
    await addTag(db, 'Snelle   soep');
    assert.equal((await listManagedTags(db))[0].name, 'Snelle soep');
  });
});

describe('tag-management › A taken name is refused', () => {
  test('another letter case is taken, nothing is added', async ({ db }) => {
    await tag(db, 'Soep');
    assert.deepEqual(await addTag(db, 'soep'), { error: 'taken', taken: 'Soep' });
    assert.equal((await listManagedTags(db)).length, 1);
  });
});

describe('tag-management › An empty name is refused', () => {
  test('only spaces add nothing', async ({ db }) => {
    assert.deepEqual(await addTag(db, '   '), { error: 'empty' });
    assert.equal((await listManagedTags(db)).length, 0);
  });
});

describe('tag-management › A too long name is refused', () => {
  test('101 characters add nothing', async ({ db }) => {
    assert.deepEqual(await addTag(db, 'a'.repeat(101)), { error: 'tooLong' });
    assert.equal((await listManagedTags(db)).length, 0);
  });

  test('100 characters are fine', async ({ db }) => {
    assert.deepEqual(await addTag(db, 'a'.repeat(100)), { ok: true });
  });
});
