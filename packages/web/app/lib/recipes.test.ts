import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { getRecipe } from './recipes';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
  await db.batch([
    // Ingredients and steps are inserted out of position order, so the tests prove the query sorts.
    db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('ordering', 'Ordering', 'Oma', 2)"),
    db.prepare("INSERT INTO ingredients (recipe_id, position, name) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 2, 'zout')"),
    db.prepare(
      "INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 1, 'ei', '1')",
    ),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 2, 'twee')"),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'ordering'), 1, 'een')"),
    db.prepare(
      "INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('full', 'Full', 'Papa', '1u 20', 8, 'intro', '/full.jpg', 'fu')",
    ),
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

test('maps every recipe column', async () => {
  const r = await getRecipe(db, 'full');
  assert.deepEqual(
    { ...r, id: 0 },
    {
      id: 0,
      slug: 'full',
      title: 'Full',
      author: 'Papa',
      time: '1u 20',
      servings: 8,
      intro: 'intro',
      image: '/full.jpg',
      seal: 'fu',
      ingredients: [],
      steps: [],
    },
  );
});
