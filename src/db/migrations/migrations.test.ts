import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe } from 'vitest';
import { applySql, createMiniflare } from '~testing/db';
import { test } from '~testing/test';

// Each test uses its own recipe slug, so one database serves the whole file.

const addRecipe = async (db: D1Database, slug: string) =>
  (await db
    .prepare('INSERT INTO recipes (slug, title, author, servings) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(slug, slug, 'Oma', 4)
    .first<{ id: number }>())!.id;
const addIngredient = async (db: D1Database, recipe: number, position: number) =>
  (await db
    .prepare("INSERT INTO ingredients (recipe_id, position, name) VALUES (?, ?, 'x') RETURNING id")
    .bind(recipe, position)
    .first<{ id: number }>())!.id;
const addIngredientWithAmount = async (db: D1Database, recipe: number, position: number, quantityValue: number, quantityUnit: string) =>
  (await db
    .prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_value, quantity_unit) VALUES (?, ?, 'x', ?, ?) RETURNING id")
    .bind(recipe, position, quantityValue, quantityUnit)
    .first<{ id: number }>())!.id;
const addStep = async (db: D1Database, recipe: number, position: number) =>
  (await db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES (?, ?, 'x') RETURNING id").bind(recipe, position).first<{ id: number }>())!
    .id;
const link = (db: D1Database, step: number, ingredient: number, recipe: number, amount: number | null = null) =>
  db
    .prepare('INSERT INTO step_ingredients (step_id, ingredient_id, recipe_id, amount, unit) VALUES (?, ?, ?, ?, ?)')
    .bind(step, ingredient, recipe, amount, amount ? 'g' : null)
    .run();

const count = async (db: D1Database, sql: string, ...binds: unknown[]) =>
  (
    await db
      .prepare(sql)
      .bind(...binds)
      .all()
  ).results.length;

describe('recipe-storage › Recipe is saved', () => {
  test('every column is stored', async ({ db }) => {
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
        source: null,
        seal: 'fu',
        created_by: 'mum@example.com',
        created_at: '',
        updated_at: '',
      },
    );
  });
});

describe('recipe-storage › Duplicate slug is refused', () => {
  test('the second recipe is refused', async ({ db }) => {
    await addRecipe(db, 'dup');
    await assert.rejects(addRecipe(db, 'dup'));
  });

  test('only one recipe is stored', async ({ db }) => {
    await addRecipe(db, 'dup').catch(() => {});
    assert.equal(await count(db, "SELECT id FROM recipes WHERE slug = 'dup'"), 1);
  });
});

describe('recipe-storage › Servings are optional', () => {
  test('missing servings are null', async ({ db }) => {
    await db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('no-servings', 'No servings', 'Oma')").run();
    assert.equal((await db.prepare("SELECT servings FROM recipes WHERE slug = 'no-servings'").first())?.servings, null);
  });
});

describe('recipe-storage › Required field is missing', () => {
  test('a recipe without a title is refused', async ({ db }) => {
    await assert.rejects(db.prepare("INSERT INTO recipes (slug, author, servings) VALUES ('no-title', 'Oma', 4)").run());
  });

  test('zero servings are refused', async ({ db }) => {
    await assert.rejects(db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('zero', 'Zero', 'Oma', 0)").run());
  });
});

describe('recipe-storage › Ingredients keep their order', () => {
  let r: number;
  let first: number;
  let second: number;
  test.beforeEach(async ({ db }) => {
    r = await addRecipe(db, 'ingredient-order');
    second = await addIngredient(db, r, 2);
    first = await addIngredient(db, r, 1);
  });

  test('they are read in position order', async ({ db }) => {
    const { results } = await db.prepare('SELECT id FROM ingredients WHERE recipe_id = ? ORDER BY position').bind(r).all();
    assert.deepEqual(
      results.map((row) => row.id),
      [first, second],
    );
  });

  test('a position is used once', async ({ db }) => {
    await assert.rejects(addIngredient(db, r, 1));
  });
});

describe('recipe-storage › Ingredient needs a recipe', () => {
  test('an ingredient of an unknown recipe is refused', async ({ db }) => {
    await assert.rejects(addIngredient(db, 9999, 1));
  });
});

describe('recipe-storage › Quantity with amount and unit', () => {
  test('amount and unit are stored, the quantity text is empty', async ({ db }) => {
    const id = await addIngredientWithAmount(db, await addRecipe(db, 'quantity'), 1, 250, 'g');
    assert.deepEqual(await db.prepare('SELECT quantity_text, quantity_value, quantity_unit FROM ingredients WHERE id = ?').bind(id).first(), {
      quantity_text: '',
      quantity_value: 250,
      quantity_unit: 'g',
    });
  });
});

describe('recipe-storage › Quantity without a number', () => {
  test('the quantity text is empty and amount and unit are null', async ({ db }) => {
    const id = await addIngredient(db, await addRecipe(db, 'no-number'), 1);
    assert.deepEqual(await db.prepare('SELECT quantity_text, quantity_value, quantity_unit FROM ingredients WHERE id = ?').bind(id).first(), {
      quantity_text: '',
      quantity_value: null,
      quantity_unit: null,
    });
  });
});

describe('recipe-storage › Non-positive amount refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addIngredientWithAmount(db, await addRecipe(db, 'bad-amount-zero'), 1, 0, 'g'));
  });

  test('a negative amount is refused', async ({ db }) => {
    await assert.rejects(addIngredientWithAmount(db, await addRecipe(db, 'bad-amount-negative'), 1, -1, 'g'));
  });
});

describe('recipe-storage › Steps keep their order', () => {
  let r: number;
  let first: number;
  let second: number;
  test.beforeEach(async ({ db }) => {
    r = await addRecipe(db, 'step-order');
    second = await addStep(db, r, 2);
    first = await addStep(db, r, 1);
  });

  test('they are read in position order', async ({ db }) => {
    const { results } = await db.prepare('SELECT id FROM steps WHERE recipe_id = ? ORDER BY position').bind(r).all();
    assert.deepEqual(
      results.map((row) => row.id),
      [first, second],
    );
  });

  test('a position is used once', async ({ db }) => {
    await assert.rejects(addStep(db, r, 1));
  });
});

describe('recipe-storage › Step needs a recipe', () => {
  test('a step of an unknown recipe is refused', async ({ db }) => {
    await assert.rejects(addStep(db, 9999, 1));
  });
});

describe('recipe-storage › Step with image', () => {
  test('image and alt text are stored', async ({ db }) => {
    const r = await addRecipe(db, 'step-image');
    await db.prepare("INSERT INTO steps (recipe_id, position, body, image, image_alt) VALUES (?, 1, 'x', '/s.jpg', 'a pan')").bind(r).run();
    assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), {
      image: '/s.jpg',
      image_alt: 'a pan',
    });
  });
});

describe('recipe-storage › Step without image', () => {
  test('image and alt text are null', async ({ db }) => {
    const r = await addRecipe(db, 'step-no-image');
    await addStep(db, r, 1);
    assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), { image: null, image_alt: null });
  });
});

describe('recipe-storage › Step uses part of an ingredient', () => {
  test('amount and unit are stored', async ({ db }) => {
    const r = await addRecipe(db, 'link-part');
    const step = await addStep(db, r, 1);
    await link(db, step, await addIngredient(db, r, 1), r, 200);
    assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), { amount: 200, unit: 'g' });
  });
});

describe('recipe-storage › Step uses a whole ingredient', () => {
  test('amount and unit are null', async ({ db }) => {
    const r = await addRecipe(db, 'link-whole');
    const step = await addStep(db, r, 1);
    await link(db, step, await addIngredient(db, r, 1), r);
    assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), {
      amount: null,
      unit: null,
    });
  });

  test('an amount of zero is refused', async ({ db }) => {
    const r = await addRecipe(db, 'link-whole-zero');
    const step = await addStep(db, r, 1);
    await assert.rejects(link(db, step, await addIngredient(db, r, 1), r, 0));
  });
});

describe('recipe-storage › Ingredient of another recipe refused', () => {
  test('the link is refused', async ({ db }) => {
    const a = await addRecipe(db, 'link-a');
    const foreign = await addIngredient(db, await addRecipe(db, 'link-b'), 1);
    await assert.rejects(link(db, await addStep(db, a, 1), foreign, a));
  });
});

describe('recipe-storage › Same ingredient linked twice refused', () => {
  test('the second link is refused', async ({ db }) => {
    const r = await addRecipe(db, 'link-twice');
    const step = await addStep(db, r, 1);
    const ingredient = await addIngredient(db, r, 1);
    await link(db, step, ingredient, r);
    await assert.rejects(link(db, step, ingredient, r));
  });
});

describe('recipe-storage › Recipe deleted', () => {
  let r: number;
  test.beforeEach(async ({ db }) => {
    r = await addRecipe(db, 'del-recipe');
    await link(db, await addStep(db, r, 1), await addIngredient(db, r, 1), r);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(r).run();
  });

  test('its ingredients are gone', async ({ db }) => {
    assert.equal(await count(db, 'SELECT id FROM ingredients WHERE recipe_id = ?', r), 0);
  });

  test('its steps are gone', async ({ db }) => {
    assert.equal(await count(db, 'SELECT id FROM steps WHERE recipe_id = ?', r), 0);
  });

  test('its step links are gone', async ({ db }) => {
    assert.equal(await count(db, 'SELECT step_id FROM step_ingredients WHERE recipe_id = ?', r), 0);
  });
});

describe('recipe-storage › Ingredient deleted', () => {
  let step: number;
  test.beforeEach(async ({ db }) => {
    const r = await addRecipe(db, 'del-ingredient');
    step = await addStep(db, r, 1);
    const ing = await addIngredient(db, r, 1);
    await link(db, step, ing, r);
    await db.prepare('DELETE FROM ingredients WHERE id = ?').bind(ing).run();
  });

  test('the step stays', async ({ db }) => {
    assert.equal(await count(db, 'SELECT id FROM steps WHERE id = ?', step), 1);
  });

  test('the link is gone', async ({ db }) => {
    assert.equal(await count(db, 'SELECT step_id FROM step_ingredients WHERE step_id = ?', step), 0);
  });
});

const addStepWith = (db: D1Database, recipe: number, position: number, oven: number | null, minutes: number | null, label: string | null = null) =>
  db
    .prepare('INSERT INTO steps (recipe_id, position, body, oven_temperature, timer_minutes, timer_label) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(recipe, position, 'x', oven, minutes, label)
    .first<{ id: number }>();
const addChip = (db: D1Database, step: number, position: number, name: string, quantity = '') =>
  db
    .prepare('INSERT INTO step_ingredient_chips (step_id, position, quantity_text, name) VALUES (?, ?, ?, ?)')
    .bind(step, position, quantity, name)
    .run();

describe('recipe-storage › Step with oven temperature and timer', () => {
  test('oven temperature, timer minutes and timer label are stored', async ({ db }) => {
    const step = (await addStepWith(db, await addRecipe(db, 'oven-timer'), 1, 180, 50, 'Bakken'))!.id;
    assert.deepEqual(await db.prepare('SELECT oven_temperature, timer_minutes, timer_label FROM steps WHERE id = ?').bind(step).first(), {
      oven_temperature: 180,
      timer_minutes: 50,
      timer_label: 'Bakken',
    });
  });
});

describe('recipe-storage › Step without oven or timer', () => {
  test('oven temperature, timer minutes and timer label are null', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'no-oven-timer'), 1);
    assert.deepEqual(await db.prepare('SELECT oven_temperature, timer_minutes, timer_label FROM steps WHERE id = ?').bind(step).first(), {
      oven_temperature: null,
      timer_minutes: null,
      timer_label: null,
    });
  });
});

describe('recipe-storage › Non-positive oven temperature or timer refused', () => {
  const cases: [string, number | null, number | null][] = [
    ['an oven temperature of zero', 0, null],
    ['a negative oven temperature', -5, null],
    ['a timer of zero minutes', null, 0],
    ['a negative timer', null, -1],
  ];
  cases.forEach(([what, oven, minutes], i) =>
    test(`${what} is refused`, async ({ db }) => {
      await assert.rejects(addStepWith(db, await addRecipe(db, `bad-oven-timer-${i}`), 1, oven, minutes));
    }),
  );
});

describe('recipe-storage › Timer name needs minutes', () => {
  test('a timer name without minutes is refused', async ({ db }) => {
    await assert.rejects(addStepWith(db, await addRecipe(db, 'label-only'), 1, null, null, 'Bakken'));
  });
});

describe('recipe-storage › Chips keep their order', () => {
  test('they are read in position order', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'chip-order'), 1);
    await addChip(db, step, 2, 'boter');
    await addChip(db, step, 1, 'bloem');
    const { results } = await db.prepare('SELECT name FROM step_ingredient_chips WHERE step_id = ? ORDER BY position').bind(step).all();
    assert.deepEqual(
      results.map((row) => row.name),
      ['bloem', 'boter'],
    );
  });
});

describe('recipe-storage › Chip without a quantity', () => {
  test('the quantity text is empty', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'chip-no-quantity'), 1);
    await addChip(db, step, 1, 'boter');
    assert.deepEqual(await db.prepare('SELECT quantity_text, name FROM step_ingredient_chips WHERE step_id = ?').bind(step).first(), {
      quantity_text: '',
      name: 'boter',
    });
  });
});

describe('recipe-storage › Chip needs a name and a step', () => {
  test('a chip without a name is refused', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'chip-invalid'), 1);
    await assert.rejects(addChip(db, step, 1, ''));
  });

  test('a chip of an unknown step is refused', async ({ db }) => {
    await assert.rejects(addChip(db, 9999, 1, 'boter'));
  });
});

describe('recipe-storage › Chips are removed with their step', () => {
  test('the chips are gone', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'chip-cascade'), 1);
    await addChip(db, step, 1, 'boter');
    await db.prepare('DELETE FROM steps WHERE id = ?').bind(step).run();
    assert.equal(await count(db, 'SELECT step_id FROM step_ingredient_chips WHERE step_id = ?', step), 0);
  });
});

const addUser = (db: D1Database, email: string, name: string) =>
  db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(email, name).run();

describe('users table', () => {
  describe('an email address is one user whatever its letter case', () => {
    test.beforeEach(async ({ db }) => {
      await addUser(db, 'Jos@Example.com', 'Jos');
    });

    test('the same address in another case is refused', async ({ db }) => {
      await assert.rejects(addUser(db, 'jos@example.com', 'Josje'));
    });

    test('one user is stored', async ({ db }) => {
      assert.equal(await count(db, "SELECT id FROM users WHERE email = 'JOS@EXAMPLE.COM'"), 1);
    });
  });

  describe('a user needs a calling name that is not blank', () => {
    test('an empty name is refused', async ({ db }) => {
      await assert.rejects(addUser(db, 'blank@example.com', ''));
    });

    test('a name of spaces is refused', async ({ db }) => {
      await assert.rejects(addUser(db, 'spaces@example.com', '   '));
    });

    test('nobody is stored', async ({ db }) => {
      assert.equal(await count(db, "SELECT id FROM users WHERE email IN ('blank@example.com', 'spaces@example.com')"), 0);
    });
  });

  test('a user gets a creation time in the same format as a recipe', async ({ db }) => {
    await addUser(db, 'time@example.com', 'Tim');
    const row = await db.prepare("SELECT created_at FROM users WHERE email = 'time@example.com'").first<{ created_at: string }>();
    assert.match(row!.created_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  });
});

describe('users › Unknown role is refused', () => {
  test('the insert is refused', async ({ db }) => {
    await assert.rejects(db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('x@example.com', 'X', 'owner')").run());
  });

  test('nobody is stored', async ({ db }) => {
    await db
      .prepare("INSERT INTO users (email, calling_name, role) VALUES ('x@example.com', 'X', 'owner')")
      .run()
      .catch(() => {});
    assert.equal(await count(db, "SELECT id FROM users WHERE email = 'x@example.com'"), 0);
  });
});

const addView = (db: D1Database, user: number, recipe: number) =>
  db.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const userId = async (db: D1Database, email: string) =>
  (await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?) RETURNING id').bind(email, 'X').first<{ id: number }>())!.id;

describe('recipe_views table', () => {
  describe('a member and a recipe have one view row', () => {
    let user: number;
    let recipe: number;
    test.beforeEach(async ({ db }) => {
      user = await userId(db, 'viewer@example.com');
      recipe = await addRecipe(db, 'view-once');
      await addView(db, user, recipe);
    });

    test('a second view row of the same pair is refused', async ({ db }) => {
      await assert.rejects(addView(db, user, recipe));
    });

    test('another member has a view row of their own', async ({ db }) => {
      await addView(db, await userId(db, 'other-viewer@example.com'), recipe);
      assert.equal(await count(db, 'SELECT user_id FROM recipe_views WHERE recipe_id = ?', recipe), 2);
    });

    test('an unknown recipe is refused', async ({ db }) => {
      await assert.rejects(addView(db, user, 9999));
    });

    test('an unknown member is refused', async ({ db }) => {
      await assert.rejects(addView(db, 9999, recipe));
    });
  });

  describe('views are removed with their recipe or member', () => {
    let user: number;
    let other: number;
    test.beforeEach(async ({ db }) => {
      user = await userId(db, 'cascade-viewer@example.com');
      const recipe = await addRecipe(db, 'view-cascade');
      other = await addRecipe(db, 'view-cascade-user');
      await addView(db, user, recipe);
      await addView(db, user, other);
      await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    });

    test('deleting a recipe removes only its views', async ({ db }) => {
      assert.equal(await count(db, 'SELECT user_id FROM recipe_views WHERE user_id = ?', user), 1);
    });

    test('deleting a member removes their views', async ({ db }) => {
      await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
      assert.equal(await count(db, 'SELECT user_id FROM recipe_views WHERE recipe_id = ?', other), 0);
    });
  });
});

describe('settings table', () => {
  const put = (db: D1Database, key: string, value: string) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind(key, value).run();

  test('keeps one value per key', async ({ db }) => {
    await put(db, 'k', '{"a":1}');
    await assert.rejects(put(db, 'k', '{}'));
  });

  test('refuses a value that is not JSON', async ({ db }) => {
    await assert.rejects(put(db, 'bad', 'not json'));
  });

  test('stores nothing for a value that is not JSON', async ({ db }) => {
    await put(db, 'bad2', 'not json').catch(() => {});
    assert.equal(await count(db, "SELECT key FROM settings WHERE key = 'bad2'"), 0);
  });
});

const addLike = (db: D1Database, user: number, recipe: number) =>
  db.prepare('INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const addNote = (db: D1Database, user: number, recipe: number, body = 'minder zout') =>
  db.prepare('INSERT INTO recipe_notes (user_id, recipe_id, body) VALUES (?, ?, ?)').bind(user, recipe, body).run();

describe('recipe-like › Liking twice stores one like', () => {
  let user: number;
  let recipe: number;
  test.beforeEach(async ({ db }) => {
    user = await userId(db, 'liker@example.com');
    recipe = await addRecipe(db, 'like-twice');
    await addLike(db, user, recipe);
    await addLike(db, user, recipe);
  });

  test('one like is stored', async ({ db }) => {
    assert.equal(await count(db, 'SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 1);
  });

  test('a plain second insert is refused', async ({ db }) => {
    await assert.rejects(db.prepare('INSERT INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run());
  });
});

describe('recipe-like › Deleting a recipe removes its likes', () => {
  test('the likes are gone', async ({ db }) => {
    const recipe = await addRecipe(db, 'like-recipe-cascade');
    await addLike(db, await userId(db, 'like-cascade-a@example.com'), recipe);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 0);
  });
});

describe('recipe-like › Removing a member removes their likes', () => {
  test('the likes are gone', async ({ db }) => {
    const user = await userId(db, 'like-user-cascade@example.com');
    await addLike(db, user, await addRecipe(db, 'like-user-cascade'));
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
    assert.equal(await count(db, 'SELECT recipe_id FROM recipe_likes WHERE user_id = ?', user), 0);
  });
});

describe('recipe-note › Deleting a recipe removes its notes', () => {
  test('the notes are gone', async ({ db }) => {
    const recipe = await addRecipe(db, 'note-recipe-cascade');
    await addNote(db, await userId(db, 'note-cascade-a@example.com'), recipe);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT user_id FROM recipe_notes WHERE recipe_id = ?', recipe), 0);
  });
});

describe('recipe-note › Removing a member removes their notes', () => {
  test('the notes are gone', async ({ db }) => {
    const user = await userId(db, 'note-user-cascade@example.com');
    await addNote(db, user, await addRecipe(db, 'note-user-cascade'));
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
    assert.equal(await count(db, 'SELECT recipe_id FROM recipe_notes WHERE user_id = ?', user), 0);
  });
});

describe('recipe_notes table', () => {
  test('a blank note body is refused', async ({ db }) => {
    const user = await userId(db, 'blank-note@example.com');
    await assert.rejects(addNote(db, user, await addRecipe(db, 'blank-note'), '  \n '));
  });

  test('a second note per member and recipe is refused', async ({ db }) => {
    const user = await userId(db, 'second-note@example.com');
    const recipe = await addRecipe(db, 'second-note');
    await addNote(db, user, recipe);
    await assert.rejects(addNote(db, user, recipe, 'andere'));
  });
});

const addTag = async (db: D1Database, name: string) =>
  (await db.prepare('INSERT INTO tags (name) VALUES (?) RETURNING id').bind(name).first<{ id: number }>())!.id;
const linkTag = (db: D1Database, recipe: number, tag: number) =>
  db.prepare('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)').bind(recipe, tag).run();

describe('recipe-storage › Recipe with tags', () => {
  test('tags read back with their recipe', async ({ db }) => {
    const recipe = await addRecipe(db, 'tag-read');
    await linkTag(db, recipe, await addTag(db, 'Winter'));
    await linkTag(db, recipe, await addTag(db, 'Soep'));
    const { results } = await db
      .prepare('SELECT t.name FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.recipe_id = ? ORDER BY t.name')
      .bind(recipe)
      .all<{ name: string }>();
    assert.deepEqual(
      results.map((r) => r.name),
      ['Soep', 'Winter'],
    );
  });
});

describe('migration 0013', () => {
  test('rows written before the migration survive it', async () => {
    const mf = createMiniflare();
    try {
      const db: D1Database = await mf.getD1Database('DB');
      const dir = import.meta.dirname;
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      for (const f of files.filter((f) => f < '0013')) await applySql(db, join(dir, f));
      await db.prepare("INSERT INTO recipes (id, slug, title, author, servings) VALUES (1, 'old', 'old', 'Oma', 4)").run();
      await db.prepare("INSERT INTO categories (id, name) VALUES (1, 'Soep')").run();
      await db.prepare('INSERT INTO recipe_categories (recipe_id, category_id, position) VALUES (1, 1, 1)').run();
      for (const f of files.filter((f) => f >= '0013')) await applySql(db, join(dir, f));
      assert.deepEqual(await db.prepare('SELECT t.name, rt.recipe_id FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id').first(), {
        name: 'Soep',
        recipe_id: 1,
      });
    } finally {
      await mf.dispose();
    }
  });
});

describe('recipe-storage › Tag name is unique', () => {
  test('the same name in another letter case is refused', async ({ db }) => {
    await addTag(db, 'Nagerecht');
    await assert.rejects(addTag(db, 'NAGERECHT'));
  });

  test('an empty name is refused', async ({ db }) => {
    await assert.rejects(addTag(db, '  '));
  });
});

describe('recipe-storage › Tag is shared', () => {
  test('two recipes link to one stored tag', async ({ db }) => {
    const tag = await addTag(db, 'Bakken');
    await linkTag(db, await addRecipe(db, 'tag-shared-a'), tag);
    await linkTag(db, await addRecipe(db, 'tag-shared-b'), tag);
    assert.equal(await count(db, 'SELECT recipe_id FROM recipe_tags WHERE tag_id = ?', tag), 2);
    assert.equal(await count(db, 'SELECT id FROM tags WHERE name = ?', 'Bakken'), 1);
  });
});

describe('recipe-storage › Tag linked twice is refused', () => {
  test('a second link to the same tag fails', async ({ db }) => {
    const recipe = await addRecipe(db, 'tag-twice');
    const tag = await addTag(db, 'Snel');
    await linkTag(db, recipe, tag);
    await assert.rejects(linkTag(db, recipe, tag));
  });
});

describe('recipe-storage › Link needs a recipe and a tag', () => {
  test('an unknown recipe is refused', async ({ db }) => {
    await assert.rejects(linkTag(db, 999999, await addTag(db, 'Zonder recept')));
  });

  test('an unknown tag is refused', async ({ db }) => {
    await assert.rejects(linkTag(db, await addRecipe(db, 'tag-no-tag'), 999999));
  });
});

describe('recipe-storage › Recipe with tags deleted', () => {
  test('the links are gone', async ({ db }) => {
    const recipe = await addRecipe(db, 'tag-deleted');
    await linkTag(db, recipe, await addTag(db, 'Hoofdgerecht'));
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT tag_id FROM recipe_tags WHERE recipe_id = ?', recipe), 0);
  });

  test('the tag remains', async ({ db }) => {
    const recipe = await addRecipe(db, 'tag-deleted-keep');
    await linkTag(db, recipe, await addTag(db, 'Blijft'));
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT id FROM tags WHERE name = ?', 'Blijft'), 1);
  });
});

const addCategory = async (db: D1Database, name: string) =>
  (await db.prepare('INSERT INTO categories (name) VALUES (?) RETURNING id').bind(name).first<{ id: number }>())!.id;
const tagCategory = async (db: D1Database, tag: string) =>
  (
    await db
      .prepare('SELECT c.name FROM tags t LEFT JOIN categories c ON c.id = t.category_id WHERE t.name = ?')
      .bind(tag)
      .first<{ name: string | null }>()
  )?.name;

describe('recipe-storage › Tag with a category', () => {
  test('reading the tag gives its category', async ({ db }) => {
    const category = await addCategory(db, 'Gerecht');
    await db.prepare('INSERT INTO tags (name, category_id) VALUES (?, ?)').bind('Soep', category).run();
    assert.equal(await tagCategory(db, 'Soep'), 'Gerecht');
  });
});

describe('recipe-storage › Tag without a category', () => {
  test('its category is empty', async ({ db }) => {
    await addTag(db, 'Zonder');
    assert.equal(await tagCategory(db, 'Zonder'), null);
  });
});

describe('recipe-storage › Category name is unique', () => {
  test('the same name in another letter case is refused', async ({ db }) => {
    await addCategory(db, 'Seizoen');
    await assert.rejects(addCategory(db, 'SEIZOEN'));
  });

  test('an empty name is refused', async ({ db }) => {
    await assert.rejects(addCategory(db, ''));
  });
});

describe('recipe-storage › Category is shared', () => {
  test('two tags have one stored category', async ({ db }) => {
    const category = await addCategory(db, 'Dieet');
    await db.prepare('INSERT INTO tags (name, category_id) VALUES (?, ?), (?, ?)').bind('Vegan', category, 'Glutenvrij', category).run();
    assert.equal(await tagCategory(db, 'Vegan'), 'Dieet');
    assert.equal(await tagCategory(db, 'Glutenvrij'), 'Dieet');
    assert.equal(await count(db, 'SELECT id FROM categories'), 1);
  });
});

describe('recipe-storage › Tag needs an existing category', () => {
  test('an unknown category is refused', async ({ db }) => {
    const tag = await addTag(db, 'Eenzaam');
    await assert.rejects(db.prepare('UPDATE tags SET category_id = 999999 WHERE id = ?').bind(tag).run());
  });
});

describe('migration 0014', () => {
  test('tags written before the migration survive it with no category', async () => {
    const mf = createMiniflare();
    try {
      const db: D1Database = await mf.getD1Database('DB');
      const dir = import.meta.dirname;
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      for (const f of files.filter((f) => f < '0014')) await applySql(db, join(dir, f));
      await db.prepare("INSERT INTO tags (name) VALUES ('Soep')").run();
      for (const f of files.filter((f) => f >= '0014')) await applySql(db, join(dir, f));
      assert.equal(await tagCategory(db, 'Soep'), null);
    } finally {
      await mf.dispose();
    }
  });
});

const addChipWithValue = (db: D1Database, step: number, value: number) =>
  db
    .prepare('INSERT INTO step_ingredient_chips (step_id, position, quantity_text, quantity_value, quantity_unit, name) VALUES (?, 1, ?, ?, ?, ?)')
    .bind(step, '200 g', value, 'g', 'bloem')
    .run();

describe('recipe-storage › Chip with value and unit', () => {
  test('text, value and unit are returned as stored', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'chip-value'), 1);
    await addChipWithValue(db, step, 200);
    assert.deepEqual(
      await db.prepare('SELECT quantity_text, quantity_value, quantity_unit FROM step_ingredient_chips WHERE step_id = ?').bind(step).first(),
      {
        quantity_text: '200 g',
        quantity_value: 200,
        quantity_unit: 'g',
      },
    );
  });
});

describe('recipe-storage › Non-positive chip value refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addChipWithValue(db, await addStep(db, await addRecipe(db, 'chip-zero'), 1), 0));
  });

  test('a negative value is refused', async ({ db }) => {
    await assert.rejects(addChipWithValue(db, await addStep(db, await addRecipe(db, 'chip-negative'), 1), -1));
  });
});

const addStepQuantity = (db: D1Database, step: number, start: number, end: number, value = 200) =>
  db
    .prepare('INSERT INTO step_quantities (step_id, start_index, end_index, quantity_value, quantity_unit) VALUES (?, ?, ?, ?, ?)')
    .bind(step, start, end, value, 'g')
    .run();

describe('recipe-storage › Amounts keep their text order', () => {
  test('they come back ordered by start', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'sq-order'), 1);
    await addStepQuantity(db, step, 20, 21, 2);
    await addStepQuantity(db, step, 5, 8);
    const { results } = await db.prepare('SELECT start_index FROM step_quantities WHERE step_id = ? ORDER BY start_index').bind(step).all();
    assert.deepEqual(
      results.map((r) => r.start_index),
      [5, 20],
    );
  });
});

describe('recipe-storage › Amount with place, value and unit', () => {
  test('place, value and unit are returned as stored', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'sq-stored'), 1);
    await addStepQuantity(db, step, 5, 8);
    assert.deepEqual(
      await db.prepare('SELECT start_index, end_index, quantity_value, quantity_unit FROM step_quantities WHERE step_id = ?').bind(step).first(),
      { start_index: 5, end_index: 8, quantity_value: 200, quantity_unit: 'g' },
    );
  });
});

describe('recipe-storage › Non-positive amount in text refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addStepQuantity(db, await addStep(db, await addRecipe(db, 'sq-zero'), 1), 5, 8, 0));
  });

  test('a negative value is refused', async ({ db }) => {
    await assert.rejects(addStepQuantity(db, await addStep(db, await addRecipe(db, 'sq-negative'), 1), 5, 8, -1));
  });
});

describe('recipe-storage › Amount must end after it starts', () => {
  test('an end equal to the start is refused', async ({ db }) => {
    await assert.rejects(addStepQuantity(db, await addStep(db, await addRecipe(db, 'sq-empty'), 1), 5, 5));
  });

  test('an end before the start is refused', async ({ db }) => {
    await assert.rejects(addStepQuantity(db, await addStep(db, await addRecipe(db, 'sq-backwards'), 1), 5, 4));
  });
});

describe('recipe-storage › Two amounts cannot start at the same place', () => {
  test('the second insert fails', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'sq-same-start'), 1);
    await addStepQuantity(db, step, 5, 8);
    await assert.rejects(addStepQuantity(db, step, 5, 6));
  });
});

describe('recipe-storage › Amounts are removed with their step', () => {
  test('none remain', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'sq-deleted'), 1);
    await addStepQuantity(db, step, 5, 8);
    await db.prepare('DELETE FROM steps WHERE id = ?').bind(step).run();
    assert.equal(await count(db, 'SELECT start_index FROM step_quantities WHERE step_id = ?', step), 0);
  });
});

const addIngredientWithMax = (db: D1Database, recipe: number, position: number, value: number | null, max: number) =>
  db
    .prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_value, quantity_value_max, quantity_unit) VALUES (?, ?, 'x', ?, ?, 'el')")
    .bind(recipe, position, value, max)
    .run();

describe('recipe-storage › Non-positive maximum refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addIngredientWithMax(db, await addRecipe(db, 'max-zero'), 1, 2, 0));
  });

  test('a negative maximum is refused', async ({ db }) => {
    await assert.rejects(addIngredientWithMax(db, await addRecipe(db, 'max-negative'), 1, 2, -1));
  });
});

describe('recipe-storage › Maximum without a value refused', () => {
  test('the insert fails', async ({ db }) => {
    await assert.rejects(addIngredientWithMax(db, await addRecipe(db, 'max-no-value'), 1, null, 3));
  });
});

const addChipWithMax = (db: D1Database, step: number, value: number | null, max: number) =>
  db
    .prepare(
      "INSERT INTO step_ingredient_chips (step_id, position, quantity_text, quantity_value, quantity_value_max, quantity_unit, name) VALUES (?, 1, '2-3 el', ?, ?, 'el', 'olie')",
    )
    .bind(step, value, max)
    .run();

describe('recipe-storage › Non-positive chip maximum refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addChipWithMax(db, await addStep(db, await addRecipe(db, 'chip-max-zero'), 1), 2, 0));
  });

  test('a maximum without a value is refused', async ({ db }) => {
    await assert.rejects(addChipWithMax(db, await addStep(db, await addRecipe(db, 'chip-max-no-value'), 1), null, 3));
  });
});

const addRangeAmount = (db: D1Database, step: number, max: number | null, maxStart: number | null, maxEnd: number | null) =>
  db
    .prepare(
      "INSERT INTO step_quantities (step_id, start_index, end_index, quantity_value, quantity_value_max, max_start_index, max_end_index, quantity_unit) VALUES (?, 5, 6, 2, ?, ?, ?, 'el')",
    )
    .bind(step, max, maxStart, maxEnd)
    .run();

describe('recipe-storage › Range amount with both places', () => {
  test('both places, both values and the unit are returned as stored', async ({ db }) => {
    const step = await addStep(db, await addRecipe(db, 'sq-range'), 1);
    await addRangeAmount(db, step, 3, 9, 10);
    assert.deepEqual(
      await db
        .prepare(
          'SELECT start_index, end_index, quantity_value, quantity_value_max, max_start_index, max_end_index, quantity_unit FROM step_quantities WHERE step_id = ?',
        )
        .bind(step)
        .first(),
      { start_index: 5, end_index: 6, quantity_value: 2, quantity_value_max: 3, max_start_index: 9, max_end_index: 10, quantity_unit: 'el' },
    );
  });
});

describe('recipe-storage › Non-positive maximum in text refused', () => {
  test('zero is refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-max-zero'), 1), 0, 9, 10));
  });
});

describe('recipe-storage › Range needs all three fields', () => {
  test('a maximum without places is refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-only-max'), 1), 3, null, null));
  });

  test('places without a maximum are refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-only-places'), 1), null, 9, 10));
  });

  test('a start without an end is refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-no-end'), 1), 3, 9, null));
  });
});

describe('recipe-storage › Second number must come after the first', () => {
  test('a second number starting before the first ends is refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-overlap'), 1), 3, 5, 7));
  });

  test('a second number ending at its start is refused', async ({ db }) => {
    await assert.rejects(addRangeAmount(db, await addStep(db, await addRecipe(db, 'sq-max-empty'), 1), 3, 9, 9));
  });
});

describe('migration 0016', () => {
  test('every row, id and link written before the migration survives it', async () => {
    const mf = createMiniflare();
    try {
      const db: D1Database = await mf.getD1Database('DB');
      const dir = import.meta.dirname;
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      for (const f of files.filter((f) => f < '0016')) await applySql(db, join(dir, f));
      await db.batch([
        db.prepare("INSERT INTO users (id, email, calling_name) VALUES (7, 'oma@example.com', 'Oma')"),
        db.prepare(
          "INSERT INTO recipes (id, slug, title, author, time, servings, intro, image, seal, created_by) VALUES (5, 'old', 'Soep', 'Oma', '1u', 4, 'Warm', '/a.jpg', 'ab', 'oma@example.com')",
        ),
        db.prepare(
          "INSERT INTO ingredients (id, recipe_id, position, name, quantity_text, quantity_value, quantity_value_max, quantity_unit) VALUES (11, 5, 1, 'bloem', '2-3 el', 2, 3, 'el')",
        ),
        db.prepare(
          "INSERT INTO steps (id, recipe_id, position, body, image, image_alt, oven_temperature, timer_minutes, timer_label) VALUES (21, 5, 1, 'Kneed 2 el bloem', '/s.jpg', 'alt', 180, 10, 'deeg')",
        ),
        db.prepare("INSERT INTO step_ingredients (step_id, ingredient_id, recipe_id, amount, unit) VALUES (21, 11, 5, 2, 'el')"),
        db.prepare(
          "INSERT INTO step_ingredient_chips (step_id, position, quantity_text, quantity_value, quantity_value_max, quantity_unit, name) VALUES (21, 1, '1-2 el', 1, 2, 'el', 'olie')",
        ),
        db.prepare("INSERT INTO step_quantities (step_id, start_index, end_index, quantity_value, quantity_unit) VALUES (21, 6, 7, 2, 'el')"),
        db.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (7, 5)'),
        db.prepare('INSERT INTO recipe_likes (user_id, recipe_id) VALUES (7, 5)'),
        db.prepare("INSERT INTO recipe_notes (user_id, recipe_id, body) VALUES (7, 5, 'lekker')"),
        db.prepare("INSERT INTO tags (id, name) VALUES (3, 'Soep')"),
        db.prepare('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (5, 3)'),
      ]);
      const tables = [
        'recipes',
        'ingredients',
        'steps',
        'step_ingredients',
        'step_ingredient_chips',
        'step_quantities',
        'recipe_views',
        'recipe_likes',
        'recipe_notes',
        'recipe_tags',
      ];
      const read = () => Promise.all(tables.map(async (t) => (await db.prepare(`SELECT * FROM ${t}`).all()).results));
      const before = await read();
      for (const t of before) assert.equal(t.length, 1);
      for (const f of files.filter((f) => f >= '0016' && f < '0017')) await applySql(db, join(dir, f));
      assert.deepEqual(await read(), before);
      assert.equal(await db.prepare("SELECT 1 FROM sqlite_master WHERE name LIKE 'copy_%'").first(), null);
      assert.ok(await db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'recipes_seal'").first());
    } finally {
      await mf.dispose();
    }
  });
});

const text = (n: number) => 'a'.repeat(n);
const insertRecipe = (db: D1Database, slug: string, column: string, value: string | number) =>
  db.prepare(`INSERT INTO recipes (slug, title, author, ${column}) VALUES (?, 't', 'Oma', ?)`).bind(slug, value).run();

describe('recipe-limits › Recipe columns are limited', () => {
  test('a title of 201 characters is refused', async ({ db }) => {
    await assert.rejects(db.prepare('INSERT INTO recipes (slug, title, author) VALUES (?, ?, ?)').bind('lim-title-201', text(201), 'Oma').run());
  });

  test('a title of 200 characters is stored', async ({ db }) => {
    await db.prepare('INSERT INTO recipes (slug, title, author) VALUES (?, ?, ?)').bind('lim-title-200', text(200), 'Oma').run();
    assert.equal(await count(db, 'SELECT id FROM recipes WHERE slug = ?', 'lim-title-200'), 1);
  });
});

describe('recipe-limits › Recipe update is limited', () => {
  test('an intro of 5001 characters is refused and the row is unchanged', async ({ db }) => {
    const recipe = await addRecipe(db, 'lim-upd-intro');
    await assert.rejects(db.prepare('UPDATE recipes SET intro = ? WHERE id = ?').bind(text(5001), recipe).run());
    assert.equal((await db.prepare('SELECT intro FROM recipes WHERE id = ?').bind(recipe).first<{ intro: string }>())?.intro, '');
  });

  test('servings of 1000 are refused and the row is unchanged', async ({ db }) => {
    const recipe = await addRecipe(db, 'lim-upd-servings');
    await assert.rejects(db.prepare('UPDATE recipes SET servings = 1000 WHERE id = ?').bind(recipe).run());
    assert.equal((await db.prepare('SELECT servings FROM recipes WHERE id = ?').bind(recipe).first<{ servings: number }>())?.servings, 4);
  });
});

describe('recipe-limits › Other recipe text columns are limited', () => {
  const cases: [string, string | number][] = [
    ['time', text(101)],
    ['intro', text(5001)],
    ['servings', 1000],
  ];
  for (const [column, value] of cases)
    test(`${column} over the limit is refused`, async ({ db }) => {
      await assert.rejects(insertRecipe(db, `lim-${column}`, column, value));
    });

  test('an author of 101 characters is refused', async ({ db }) => {
    await assert.rejects(db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('lim-author', 't', ?)").bind(text(101)).run());
  });

  test('values at the limit are stored', async ({ db }) => {
    await db
      .prepare('INSERT INTO recipes (slug, title, author, time, intro, servings) VALUES (?, ?, ?, ?, ?, ?)')
      .bind('lim-at', 't', text(100), text(100), text(5000), 999)
      .run();
    assert.equal(await count(db, 'SELECT id FROM recipes WHERE slug = ?', 'lim-at'), 1);
  });
});

describe('recipe-limits › Ingredient columns are limited', () => {
  const insert = (db: D1Database, recipe: number, name: string, quantityText: string) =>
    db.prepare('INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES (?, 1, ?, ?)').bind(recipe, name, quantityText).run();

  test('a name of 201 characters is refused', async ({ db }) => {
    await assert.rejects(insert(db, await addRecipe(db, 'lim-ing-name'), text(201), ''));
  });

  test('a quantity text of 201 characters is refused', async ({ db }) => {
    await assert.rejects(insert(db, await addRecipe(db, 'lim-ing-qty'), 'x', text(201)));
  });

  test('values at the limit are stored', async ({ db }) => {
    await insert(db, await addRecipe(db, 'lim-ing-at'), text(200), text(200));
  });
});

describe('recipe-limits › Step and chip columns are limited', () => {
  const insertStep = (db: D1Database, recipe: number, body: string, label: string | null = null) =>
    db.prepare('INSERT INTO steps (recipe_id, position, body, timer_minutes, timer_label) VALUES (?, 1, ?, 5, ?)').bind(recipe, body, label).run();
  const insertChip = (db: D1Database, step: number, quantityText: string, name: string) =>
    db.prepare('INSERT INTO step_ingredient_chips (step_id, position, quantity_text, name) VALUES (?, 1, ?, ?)').bind(step, quantityText, name).run();

  test('a body of 2001 characters is refused', async ({ db }) => {
    await assert.rejects(insertStep(db, await addRecipe(db, 'lim-step-body'), text(2001)));
  });

  test('a timer name of 101 characters is refused', async ({ db }) => {
    await assert.rejects(insertStep(db, await addRecipe(db, 'lim-step-timer'), 'x', text(101)));
  });

  test('a chip quantity text of 51 characters is refused', async ({ db }) => {
    await assert.rejects(insertChip(db, await addStep(db, await addRecipe(db, 'lim-chip-qty'), 1), text(51), 'x'));
  });

  test('a chip name of 201 characters is refused', async ({ db }) => {
    await assert.rejects(insertChip(db, await addStep(db, await addRecipe(db, 'lim-chip-name'), 1), '', text(201)));
  });

  test('values at the limit are stored', async ({ db }) => {
    const recipe = await addRecipe(db, 'lim-step-at');
    await insertStep(db, recipe, text(2000), text(100));
    const step = (await db.prepare('SELECT id FROM steps WHERE recipe_id = ?').bind(recipe).first<{ id: number }>())!.id;
    await insertChip(db, step, text(50), text(200));
  });
});

describe('recipe-source › Source over the limit is refused by the database', () => {
  test('a source of 501 characters is refused', async ({ db }) => {
    await assert.rejects(insertRecipe(db, 'src-501', 'source', text(501)));
  });

  test('a source of 500 characters is stored', async ({ db }) => {
    await insertRecipe(db, 'src-500', 'source', text(500));
    assert.equal(await count(db, 'SELECT id FROM recipes WHERE slug = ?', 'src-500'), 1);
  });

  test('a recipe without a source reads back as null', async ({ db }) => {
    const recipe = await addRecipe(db, 'src-none');
    assert.equal((await db.prepare('SELECT source FROM recipes WHERE id = ?').bind(recipe).first<{ source: null }>())?.source, null);
  });
});
