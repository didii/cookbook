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

const count = async (sql: string, ...binds: unknown[]) =>
  (
    await db
      .prepare(sql)
      .bind(...binds)
      .all()
  ).results.length;

test('recipe-storage › Recipe is saved', async () => {
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

test('recipe-storage › Duplicate slug is refused', async () => {
  await addRecipe('dup');
  await assert.rejects(addRecipe('dup'));
  assert.equal(await count("SELECT id FROM recipes WHERE slug = 'dup'"), 1);
});

test('recipe-storage › Servings are optional', async () => {
  await db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('no-servings', 'No servings', 'Oma')").run();
  assert.equal((await db.prepare("SELECT servings FROM recipes WHERE slug = 'no-servings'").first())?.servings, null);
});

test('recipe-storage › Required field is missing', async () => {
  await assert.rejects(db.prepare("INSERT INTO recipes (slug, author, servings) VALUES ('no-title', 'Oma', 4)").run());
  await assert.rejects(db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('zero', 'Zero', 'Oma', 0)").run());
});

test('recipe-storage › Ingredients keep their order', async () => {
  const r = await addRecipe('ingredient-order');
  const second = await addIngredient(r, 2);
  const first = await addIngredient(r, 1);
  const { results } = await db.prepare('SELECT id FROM ingredients WHERE recipe_id = ? ORDER BY position').bind(r).all();
  assert.deepEqual(
    results.map((row) => row.id),
    [first, second],
  );
  await assert.rejects(addIngredient(r, 1));
});

test('recipe-storage › Ingredient needs a recipe', async () => {
  await assert.rejects(addIngredient(9999, 1));
});

test('recipe-storage › Quantity with amount and unit', async () => {
  const id = await addIngredientWithAmount(await addRecipe('quantity'), 1, 250, 'g');
  assert.deepEqual(await db.prepare('SELECT quantity_text, amount, unit FROM ingredients WHERE id = ?').bind(id).first(), {
    quantity_text: '',
    amount: 250,
    unit: 'g',
  });
});

test('recipe-storage › Quantity without a number', async () => {
  const id = await addIngredient(await addRecipe('no-number'), 1);
  assert.deepEqual(await db.prepare('SELECT quantity_text, amount, unit FROM ingredients WHERE id = ?').bind(id).first(), {
    quantity_text: '',
    amount: null,
    unit: null,
  });
});

test('recipe-storage › Non-positive amount refused', async () => {
  const r = await addRecipe('bad-amount');
  await assert.rejects(addIngredientWithAmount(r, 1, 0, 'g'));
  await assert.rejects(addIngredientWithAmount(r, 2, -1, 'g'));
});

test('recipe-storage › Steps keep their order', async () => {
  const r = await addRecipe('step-order');
  const second = await addStep(r, 2);
  const first = await addStep(r, 1);
  const { results } = await db.prepare('SELECT id FROM steps WHERE recipe_id = ? ORDER BY position').bind(r).all();
  assert.deepEqual(
    results.map((row) => row.id),
    [first, second],
  );
  await assert.rejects(addStep(r, 1));
});

test('recipe-storage › Step needs a recipe', async () => {
  await assert.rejects(addStep(9999, 1));
});

test('recipe-storage › Step with image', async () => {
  const r = await addRecipe('step-image');
  await db.prepare("INSERT INTO steps (recipe_id, position, body, image, image_alt) VALUES (?, 1, 'x', '/s.jpg', 'a pan')").bind(r).run();
  assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), {
    image: '/s.jpg',
    image_alt: 'a pan',
  });
});

test('recipe-storage › Step without image', async () => {
  const r = await addRecipe('step-no-image');
  await addStep(r, 1);
  assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), { image: null, image_alt: null });
});

test('recipe-storage › Step uses part of an ingredient', async () => {
  const r = await addRecipe('link-part');
  const step = await addStep(r, 1);
  await link(step, await addIngredient(r, 1), r, 200);
  assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), { amount: 200, unit: 'g' });
});

test('recipe-storage › Step uses a whole ingredient', async () => {
  const r = await addRecipe('link-whole');
  const step = await addStep(r, 1);
  await link(step, await addIngredient(r, 1), r);
  assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), { amount: null, unit: null });
  await assert.rejects(link(step, await addIngredient(r, 2), r, 0));
});

test('recipe-storage › Ingredient of another recipe refused', async () => {
  const a = await addRecipe('link-a');
  const foreign = await addIngredient(await addRecipe('link-b'), 1);
  await assert.rejects(link(await addStep(a, 1), foreign, a));
});

test('recipe-storage › Same ingredient linked twice refused', async () => {
  const r = await addRecipe('link-twice');
  const step = await addStep(r, 1);
  const ingredient = await addIngredient(r, 1);
  await link(step, ingredient, r);
  await assert.rejects(link(step, ingredient, r));
});

test('recipe-storage › Recipe deleted', async () => {
  const r = await addRecipe('del-recipe');
  await link(await addStep(r, 1), await addIngredient(r, 1), r);
  await db.prepare('DELETE FROM recipes WHERE id = ?').bind(r).run();
  assert.equal(await count('SELECT id FROM ingredients WHERE recipe_id = ?', r), 0);
  assert.equal(await count('SELECT id FROM steps WHERE recipe_id = ?', r), 0);
  assert.equal(await count('SELECT step_id FROM step_ingredients WHERE recipe_id = ?', r), 0);
});

test('recipe-storage › Ingredient deleted', async () => {
  const r = await addRecipe('del-ingredient');
  const step = await addStep(r, 1);
  const ing = await addIngredient(r, 1);
  await link(step, ing, r);
  await db.prepare('DELETE FROM ingredients WHERE id = ?').bind(ing).run();
  assert.equal(await count('SELECT id FROM steps WHERE id = ?', step), 1);
  assert.equal(await count('SELECT step_id FROM step_ingredients WHERE step_id = ?', step), 0);
});

const addStepWith = (recipe: number, position: number, oven: number | null, minutes: number | null, label: string | null = null) =>
  db
    .prepare('INSERT INTO steps (recipe_id, position, body, oven_temperature, timer_minutes, timer_label) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(recipe, position, 'x', oven, minutes, label)
    .first<{ id: number }>();
const addChip = (step: number, position: number, name: string, quantity = '') =>
  db
    .prepare('INSERT INTO step_ingredient_chips (step_id, position, quantity_text, name) VALUES (?, ?, ?, ?)')
    .bind(step, position, quantity, name)
    .run();

test('recipe-storage › Step with oven temperature and timer', async () => {
  const step = (await addStepWith(await addRecipe('oven-timer'), 1, 180, 50, 'Bakken'))!.id;
  assert.deepEqual(await db.prepare('SELECT oven_temperature, timer_minutes, timer_label FROM steps WHERE id = ?').bind(step).first(), {
    oven_temperature: 180,
    timer_minutes: 50,
    timer_label: 'Bakken',
  });
});

test('recipe-storage › Step without oven or timer', async () => {
  const step = await addStep(await addRecipe('no-oven-timer'), 1);
  assert.deepEqual(await db.prepare('SELECT oven_temperature, timer_minutes, timer_label FROM steps WHERE id = ?').bind(step).first(), {
    oven_temperature: null,
    timer_minutes: null,
    timer_label: null,
  });
});

test('recipe-storage › Non-positive oven temperature or timer refused', async () => {
  const r = await addRecipe('bad-oven-timer');
  await assert.rejects(addStepWith(r, 1, 0, null));
  await assert.rejects(addStepWith(r, 2, -5, null));
  await assert.rejects(addStepWith(r, 3, null, 0));
  await assert.rejects(addStepWith(r, 4, null, -1));
});

test('recipe-storage › Timer name needs minutes', async () => {
  await assert.rejects(addStepWith(await addRecipe('label-only'), 1, null, null, 'Bakken'));
});

test('recipe-storage › Chips keep their order', async () => {
  const step = await addStep(await addRecipe('chip-order'), 1);
  await addChip(step, 2, 'boter');
  await addChip(step, 1, 'bloem');
  const { results } = await db.prepare('SELECT name FROM step_ingredient_chips WHERE step_id = ? ORDER BY position').bind(step).all();
  assert.deepEqual(
    results.map((row) => row.name),
    ['bloem', 'boter'],
  );
});

test('recipe-storage › Chip without a quantity', async () => {
  const step = await addStep(await addRecipe('chip-no-quantity'), 1);
  await addChip(step, 1, 'boter');
  assert.deepEqual(await db.prepare('SELECT quantity_text, name FROM step_ingredient_chips WHERE step_id = ?').bind(step).first(), {
    quantity_text: '',
    name: 'boter',
  });
});

test('recipe-storage › Chip needs a name and a step', async () => {
  const step = await addStep(await addRecipe('chip-invalid'), 1);
  await assert.rejects(addChip(step, 1, ''));
  await assert.rejects(addChip(9999, 1, 'boter'));
});

test('recipe-storage › Chips are removed with their step', async () => {
  const step = await addStep(await addRecipe('chip-cascade'), 1);
  await addChip(step, 1, 'boter');
  await db.prepare('DELETE FROM steps WHERE id = ?').bind(step).run();
  assert.equal(await count('SELECT step_id FROM step_ingredient_chips WHERE step_id = ?', step), 0);
});

const addUser = (email: string, name: string) => db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(email, name).run();

test('an email address is one user whatever its letter case', async () => {
  await addUser('Jos@Example.com', 'Jos');
  await assert.rejects(addUser('jos@example.com', 'Josje'));
  assert.equal(await count("SELECT id FROM users WHERE email = 'JOS@EXAMPLE.COM'"), 1);
});

test('a user needs a calling name that is not blank', async () => {
  await assert.rejects(addUser('blank@example.com', ''));
  await assert.rejects(addUser('spaces@example.com', '   '));
  assert.equal(await count("SELECT id FROM users WHERE email IN ('blank@example.com', 'spaces@example.com')"), 0);
});

test('a user gets a creation time in the same format as a recipe', async () => {
  await addUser('time@example.com', 'Tim');
  const row = await db.prepare("SELECT created_at FROM users WHERE email = 'time@example.com'").first<{ created_at: string }>();
  assert.match(row!.created_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
});

test('users › Unknown role is refused', async () => {
  await assert.rejects(db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('x@example.com', 'X', 'owner')").run());
  assert.equal(await count("SELECT id FROM users WHERE email = 'x@example.com'"), 0);
});

const addView = (user: number, recipe: number) => db.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const userId = async (email: string) =>
  (await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?) RETURNING id').bind(email, 'X').first<{ id: number }>())!.id;

test('a member and a recipe have one view row', async () => {
  const user = await userId('viewer@example.com');
  const recipe = await addRecipe('view-once');
  await addView(user, recipe);
  await assert.rejects(addView(user, recipe));
  await addView(await userId('other-viewer@example.com'), recipe);
  assert.equal(await count('SELECT user_id FROM recipe_views WHERE recipe_id = ?', recipe), 2);
  await assert.rejects(addView(user, 9999));
  await assert.rejects(addView(9999, recipe));
});

test('settings keep one JSON value per key', async () => {
  await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind('k', '{"a":1}').run();
  await assert.rejects(db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind('k', '{}').run());
  await assert.rejects(db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind('bad', 'not json').run());
  assert.equal(await count("SELECT key FROM settings WHERE key = 'bad'"), 0);
});

test('views are removed with their recipe or member', async () => {
  const user = await userId('cascade-viewer@example.com');
  const recipe = await addRecipe('view-cascade');
  const other = await addRecipe('view-cascade-user');
  await addView(user, recipe);
  await addView(user, other);
  await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
  assert.equal(await count('SELECT user_id FROM recipe_views WHERE user_id = ?', user), 1);
  await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
  assert.equal(await count('SELECT user_id FROM recipe_views WHERE recipe_id = ?', other), 0);
});

const addLike = (user: number, recipe: number) =>
  db.prepare('INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const addNote = (user: number, recipe: number, body = 'minder zout') =>
  db.prepare('INSERT INTO recipe_notes (user_id, recipe_id, body) VALUES (?, ?, ?)').bind(user, recipe, body).run();

test('recipe-like › Liking twice stores one like', async () => {
  const user = await userId('liker@example.com');
  const recipe = await addRecipe('like-twice');
  await addLike(user, recipe);
  await addLike(user, recipe);
  assert.equal(await count('SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 1);
  await assert.rejects(db.prepare('INSERT INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run());
});

test('recipe-like › Deleting a recipe removes its likes', async () => {
  const recipe = await addRecipe('like-recipe-cascade');
  await addLike(await userId('like-cascade-a@example.com'), recipe);
  await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
  assert.equal(await count('SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 0);
});

test('recipe-like › Removing a member removes their likes', async () => {
  const user = await userId('like-user-cascade@example.com');
  await addLike(user, await addRecipe('like-user-cascade'));
  await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
  assert.equal(await count('SELECT recipe_id FROM recipe_likes WHERE user_id = ?', user), 0);
});

test('recipe-note › Deleting a recipe removes its notes', async () => {
  const recipe = await addRecipe('note-recipe-cascade');
  await addNote(await userId('note-cascade-a@example.com'), recipe);
  await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
  assert.equal(await count('SELECT user_id FROM recipe_notes WHERE recipe_id = ?', recipe), 0);
});

test('recipe-note › Removing a member removes their notes', async () => {
  const user = await userId('note-user-cascade@example.com');
  await addNote(user, await addRecipe('note-user-cascade'));
  await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
  assert.equal(await count('SELECT recipe_id FROM recipe_notes WHERE user_id = ?', user), 0);
});

test('a blank note body and a second note per member and recipe are refused', async () => {
  const user = await userId('blank-note@example.com');
  const recipe = await addRecipe('blank-note');
  await assert.rejects(addNote(user, recipe, '  \n '));
  await addNote(user, recipe);
  await assert.rejects(addNote(user, recipe, 'andere'));
});
