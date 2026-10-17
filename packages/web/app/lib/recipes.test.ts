import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '../../testing/db';
import { getRecipe } from './recipes';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb({ seed: true }));
  // Inserted out of position order, so the test proves the query sorts.
  await db.batch([
    db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('ordering', 'Ordering', 'Oma', 2)"),
    db.prepare("INSERT INTO ingredients (recipe_id, position, name) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 2, 'zout')"),
    db.prepare(
      "INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 1, 'ei', '1')",
    ),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 2, 'twee')"),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 1, 'een')"),
  ]);
});

after(() => dispose());

test('returns undefined for an unknown slug', async () => {
  assert.equal(await getRecipe(db, 'nope'), undefined);
});

test('returns ingredients and steps in position order, and leaves optional fields null', async () => {
  const r = await getRecipe(db, 'ordering');
  assert.equal(r?.author, 'Oma');
  assert.equal(r?.time, null);
  assert.equal(r?.image, null);
  assert.deepEqual(r?.ingredients, [
    { quantity_text: '1', name: 'ei' },
    { quantity_text: '', name: 'zout' },
  ]);
  assert.deepEqual(r?.steps, ['een', 'twee']);
});

test('reads a seeded recipe with all its parts', async () => {
  const r = await getRecipe(db, 'appeltaart');
  assert.equal(r?.title, 'Appeltaart');
  assert.equal(r?.servings, 8);
  assert.equal(r?.ingredients.length, 7);
  assert.equal(r?.steps.length, 6);
});
