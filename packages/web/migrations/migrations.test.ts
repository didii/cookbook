import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';

// Each test uses its own recipe slug, so one database serves the whole file.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const addRecipe = async (slug: string) =>
  (await db
    .prepare('INSERT INTO recipes (slug, title, author, servings) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(slug, slug, 'Oma', 4)
    .first<{ id: number }>())!.id;
const addIngredient = async (recipe: number, position: number) =>
  (await db
    .prepare("INSERT INTO ingredients (recipe_id, position, name) VALUES (?, ?, 'x') RETURNING id")
    .bind(recipe, position)
    .first<{ id: number }>())!.id;
const addIngredientWithAmount = async (recipe: number, position: number, amount: number, unit: string) =>
  (await db
    .prepare("INSERT INTO ingredients (recipe_id, position, name, amount, unit) VALUES (?, ?, 'x', ?, ?) RETURNING id")
    .bind(recipe, position, amount, unit)
    .first<{ id: number }>())!.id;
const addStep = async (recipe: number, position: number) =>
  (await db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES (?, ?, 'x') RETURNING id").bind(recipe, position).first<{ id: number }>())!
    .id;
const link = (step: number, ingredient: number, recipe: number, amount: number | null = null) =>
  db
    .prepare('INSERT INTO step_ingredients (step_id, ingredient_id, recipe_id, amount, unit) VALUES (?, ?, ?, ?, ?)')
    .bind(step, ingredient, recipe, amount, amount ? 'g' : null)
    .run();

test('a recipe with all fields reads back as stored', async () => {
  await db
    .prepare('INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind('full', 'Full', 'Oma', '1u', 8, 'intro', '/a.jpg', 'fu', 'mum@example.com')
    .run();
  const r = await db.prepare("SELECT * FROM recipes WHERE slug = 'full'").first();
  assert.deepEqual(
    { ...r, id: 0, created_at: '', updated_at: '' },
    {
      id: 0,
      slug: 'full',
      title: 'Full',
      author: 'Oma',
      time: '1u',
      servings: 8,
      intro: 'intro',
      image: '/a.jpg',
      seal: 'fu',
      created_by: 'mum@example.com',
      created_at: '',
      updated_at: '',
    },
  );
});

test('a duplicate slug is refused and the original is unchanged', async () => {
  await addRecipe('dup');
  await assert.rejects(addRecipe('dup'));
  const { results } = await db.prepare("SELECT id FROM recipes WHERE slug = 'dup'").all();
  assert.equal(results.length, 1);
});

test('a recipe needs a title and servings above zero', async () => {
  await assert.rejects(db.prepare("INSERT INTO recipes (slug, author, servings) VALUES ('no-title', 'Oma', 4)").run());
  await assert.rejects(db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('zero', 'Zero', 'Oma', 0)").run());
});

test('ingredients and steps need an existing recipe and a unique position', async () => {
  await assert.rejects(addIngredient(9999, 1));
  await assert.rejects(addStep(9999, 1));
  const r = await addRecipe('positions');
  await addIngredient(r, 1);
  await addStep(r, 1);
  await assert.rejects(addIngredient(r, 1));
  await assert.rejects(addStep(r, 1));
});

test('ingredient quantity: amount and unit are kept, empty text is accepted, amount must be positive', async () => {
  const r = await addRecipe('quantity');
  const id = await addIngredientWithAmount(r, 1, 250, 'g');
  assert.deepEqual(await db.prepare('SELECT quantity_text, amount, unit FROM ingredients WHERE id = ?').bind(id).first(), {
    quantity_text: '',
    amount: 250,
    unit: 'g',
  });
  await assert.rejects(addIngredientWithAmount(r, 2, 0, 'g'));
  await assert.rejects(addIngredientWithAmount(r, 3, -1, 'g'));
});

test('a step may carry an image with alt text, or none', async () => {
  const r = await addRecipe('step-image');
  await db.prepare("INSERT INTO steps (recipe_id, position, body, image, image_alt) VALUES (?, 1, 'x', '/s.jpg', 'a pan')").bind(r).run();
  await addStep(r, 2);
  assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ? AND position = 1').bind(r).first(), {
    image: '/s.jpg',
    image_alt: 'a pan',
  });
});

test('a step links to ingredients of its own recipe only, once each', async () => {
  const a = await addRecipe('link-a');
  const b = await addRecipe('link-b');
  const step = await addStep(a, 1);
  const own = await addIngredient(a, 1);
  const foreign = await addIngredient(b, 1);
  await link(step, own, a, 200);
  assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), { amount: 200, unit: 'g' });
  await assert.rejects(link(step, foreign, a));
  await assert.rejects(link(step, own, a));
  const whole = await addIngredient(a, 2);
  await link(step, whole, a);
  const { results } = await db.prepare('SELECT ingredient_id FROM step_ingredients WHERE step_id = ? AND amount IS NULL').bind(step).all();
  assert.equal(results.length, 1);
  await assert.rejects(link(step, whole, a, 0));
});

test('deleting an ingredient removes only its links', async () => {
  const r = await addRecipe('del-ingredient');
  const step = await addStep(r, 1);
  const ing = await addIngredient(r, 1);
  await link(step, ing, r);
  await db.prepare('DELETE FROM ingredients WHERE id = ?').bind(ing).run();
  assert.equal((await db.prepare('SELECT id FROM steps WHERE id = ?').bind(step).all()).results.length, 1);
  assert.equal((await db.prepare('SELECT step_id FROM step_ingredients WHERE step_id = ?').bind(step).all()).results.length, 0);
});

test('deleting a recipe removes its ingredients, steps and links', async () => {
  const r = await addRecipe('del-recipe');
  await link(await addStep(r, 1), await addIngredient(r, 1), r);
  await db.prepare('DELETE FROM recipes WHERE id = ?').bind(r).run();
  assert.equal((await db.prepare('SELECT id FROM ingredients WHERE recipe_id = ?').bind(r).all()).results.length, 0);
  assert.equal((await db.prepare('SELECT id FROM steps WHERE recipe_id = ?').bind(r).all()).results.length, 0);
  assert.equal((await db.prepare('SELECT step_id FROM step_ingredients WHERE recipe_id = ?').bind(r).all()).results.length, 0);
});
