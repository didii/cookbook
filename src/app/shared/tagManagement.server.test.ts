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

describe('tag-management › Name and category in one save', () => {
  test('both change', async ({ db }) => {
    await tag(db, 'Soepen');
    assert.deepEqual(await saveTag(db, 'Soepen', { name: 'Bouillon', category: 'Gerecht' }), { ok: true });
    assert.deepEqual(await stored(db), { Bouillon: 'Gerecht' });
  });
});

describe('tag-management › Own name in another letter case', () => {
  test('the tag is renamed', async ({ db }) => {
    await tag(db, 'soep');
    assert.deepEqual(await saveTag(db, 'soep', { name: 'Soep', category: '' }), { ok: true });
    assert.deepEqual(await stored(db), { Soep: null });
  });
});

describe('tag-management › A taken name refuses the whole save', () => {
  test('name and category stay as they were', async ({ db }) => {
    await tag(db, 'Soep');
    await tag(db, 'Soepen', 'Seizoen');
    assert.deepEqual(await saveTag(db, 'Soepen', { name: 'soep', category: 'Gerecht' }), { error: 'taken', taken: 'Soep' });
    assert.deepEqual(await stored(db), { Soep: null, Soepen: 'Seizoen' });
    assert.deepEqual(await categories(db), ['Seizoen']);
  });
});

describe('tag-management › Empty or too long name', () => {
  test('an empty name saves nothing', async ({ db }) => {
    await tag(db, 'Soep');
    assert.deepEqual(await saveTag(db, 'Soep', { name: ' ', category: 'Gerecht' }), { error: 'empty' });
    assert.deepEqual(await stored(db), { Soep: null });
  });

  test('101 characters save nothing', async ({ db }) => {
    await tag(db, 'Soep');
    assert.deepEqual(await saveTag(db, 'Soep', { name: 'a'.repeat(101), category: '' }), { error: 'tooLong' });
    assert.deepEqual(await stored(db), { Soep: null });
  });
});

describe('tag-management › A new category is created', () => {
  test('the category is stored and the tag has it', async ({ db }) => {
    await tag(db, 'Kerst');
    await saveTag(db, 'Kerst', { name: 'Kerst', category: 'Gelegenheid' });
    assert.deepEqual(await stored(db), { Kerst: 'Gelegenheid' });
    assert.deepEqual(await categories(db), ['Gelegenheid']);
  });
});

describe('tag-management › Stored spelling is used for a category', () => {
  test('no second category is stored', async ({ db }) => {
    await tag(db, 'Soep');
    await tag(db, 'Bakken', 'Gerecht');
    await saveTag(db, 'Soep', { name: 'Soep', category: 'gerecht' });
    assert.deepEqual(await stored(db), { Soep: 'Gerecht', Bakken: 'Gerecht' });
    assert.deepEqual(await categories(db), ['Gerecht']);
  });
});

describe('tag-management › Empty category removes it', () => {
  test('the tag has no category', async ({ db }) => {
    await tag(db, 'Soep', 'Gerecht');
    await saveTag(db, 'Soep', { name: 'Soep', category: '' });
    assert.deepEqual(await stored(db), { Soep: null });
  });
});

describe('tag-management › Unused category disappears', () => {
  test('the old category is no longer listed', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await saveTag(db, 'Winter', { name: 'Winter', category: 'Gerecht' });
    assert.deepEqual(await listCategories(db), ['Gerecht']);
  });
});

describe('recipe-storage › Unused category is removed', () => {
  test('when its only tag gets another category', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await saveTag(db, 'Winter', { name: 'Winter', category: 'Gerecht' });
    assert.deepEqual(await categories(db), ['Gerecht']);
  });

  test('when its only tag gets none', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await saveTag(db, 'Winter', { name: 'Winter', category: '' });
    assert.deepEqual(await categories(db), []);
  });

  test('when its only tag is deleted', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await deleteTag(db, 'Winter');
    assert.deepEqual(await categories(db), []);
  });

  test('a category another tag has is kept', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await tag(db, 'Zomer', 'Seizoen');
    await deleteTag(db, 'Winter');
    assert.deepEqual(await categories(db), ['Seizoen']);
  });

  test('when its only tag is merged away', async ({ db }) => {
    await tag(db, 'Winter', 'Seizoen');
    await tag(db, 'Koud');
    await mergeTag(db, 'Winter', 'Koud');
    assert.deepEqual(await categories(db), []);
  });
});

describe('tag-management › Merge moves the recipes', () => {
  test('every recipe has the target once and the source is gone', async ({ db }) => {
    await tag(db, 'Soepen');
    await tag(db, 'Soep');
    await recipe(db, 'a', 'Soepen');
    await recipe(db, 'b', 'Soepen', 'Soep');
    await recipe(db, 'c', 'Soep');
    assert.deepEqual(await mergeTag(db, 'Soepen', 'Soep'), { ok: true });
    assert.deepEqual(await recipesOf(db, 'Soep'), ['a', 'b', 'c']);
    assert.deepEqual(await stored(db), { Soep: null });
  });

  test('an unknown tag is not found', async ({ db }) => {
    await tag(db, 'Soep');
    assert.deepEqual(await mergeTag(db, 'Nope', 'Soep'), { error: 'notFound' });
    assert.deepEqual(await mergeTag(db, 'Soep', 'Nope'), { error: 'notFound' });
  });
});

describe('tag-management › Merge keeps the chosen tag as it is', () => {
  test('the category of the target stays', async ({ db }) => {
    await tag(db, 'Soepen', 'Seizoen');
    await tag(db, 'Soep', 'Gerecht');
    await mergeTag(db, 'Soepen', 'Soep');
    assert.deepEqual(await stored(db), { Soep: 'Gerecht' });
  });
});

describe('tag-management › Tag is deleted', () => {
  test('the tag and its links go, the recipes stay', async ({ db }) => {
    await tag(db, 'Soep');
    await recipe(db, 'a', 'Soep');
    await recipe(db, 'b', 'Soep');
    await recipe(db, 'c', 'Soep');
    assert.deepEqual(await deleteTag(db, 'Soep'), { ok: true });
    assert.deepEqual(await listManagedTags(db), []);
    assert.equal((await db.prepare('SELECT id FROM recipes').all()).results.length, 3);
    assert.equal((await db.prepare('SELECT * FROM recipe_tags').all()).results.length, 0);
  });

  test('an unknown tag is not found', async ({ db }) => {
    assert.deepEqual(await deleteTag(db, 'Nope'), { error: 'notFound' });
  });
});

describe('tag-management › Setting a category on the selection', () => {
  test('every named tag gets it and the count is returned', async ({ db }) => {
    await tag(db, 'Soep');
    await tag(db, 'Bakken');
    await tag(db, 'Rest');
    assert.deepEqual(await setCategory(db, ['Soep', 'Bakken'], 'gerecht'), { ok: true, changed: 2 });
    assert.deepEqual(await stored(db), { Soep: 'gerecht', Bakken: 'gerecht', Rest: null });
  });

  test('the stored spelling is reused', async ({ db }) => {
    await tag(db, 'Soep');
    await tag(db, 'Bakken', 'Gerecht');
    await setCategory(db, ['Soep'], 'gerecht');
    assert.deepEqual(await stored(db), { Soep: 'Gerecht', Bakken: 'Gerecht' });
  });
});

describe('tag-management › Empty category on the selection', () => {
  test('both tags have no category and the category is gone', async ({ db }) => {
    await tag(db, 'Soep', 'Gerecht');
    await tag(db, 'Bakken', 'Gerecht');
    assert.deepEqual(await setCategory(db, ['Soep', 'Bakken'], ''), { ok: true, changed: 2 });
    assert.deepEqual(await stored(db), { Soep: null, Bakken: null });
    assert.deepEqual(await categories(db), []);
  });
});
