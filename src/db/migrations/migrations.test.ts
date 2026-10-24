import assert from 'node:assert/strict';
import { describe } from 'vitest';
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

const addCategory = async (db: D1Database, name: string) =>
  (await db.prepare('INSERT INTO categories (name) VALUES (?) RETURNING id').bind(name).first<{ id: number }>())!.id;
const linkCategory = (db: D1Database, recipe: number, category: number, position = 1) =>
  db.prepare('INSERT INTO recipe_categories (recipe_id, category_id, position) VALUES (?, ?, ?)').bind(recipe, category, position).run();

describe('recipe-storage › Recipe with categories', () => {
  test('categories read back in position order', async ({ db }) => {
    const recipe = await addRecipe(db, 'cat-order');
    await linkCategory(db, recipe, await addCategory(db, 'Winter'), 2);
    await linkCategory(db, recipe, await addCategory(db, 'Soep'), 1);
    const { results } = await db
      .prepare('SELECT c.name FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = ? ORDER BY rc.position')
      .bind(recipe)
      .all<{ name: string }>();
    assert.deepEqual(
      results.map((r) => r.name),
      ['Soep', 'Winter'],
    );
  });
});

describe('recipe-storage › Category name is unique', () => {
  test('the same name in another letter case is refused', async ({ db }) => {
    await addCategory(db, 'Nagerecht');
    await assert.rejects(addCategory(db, 'NAGERECHT'));
  });

  test('an empty name is refused', async ({ db }) => {
    await assert.rejects(addCategory(db, '  '));
  });
});

describe('recipe-storage › Category is shared', () => {
  test('two recipes link to one stored category', async ({ db }) => {
    const category = await addCategory(db, 'Bakken');
    await linkCategory(db, await addRecipe(db, 'cat-shared-a'), category);
    await linkCategory(db, await addRecipe(db, 'cat-shared-b'), category);
    assert.equal(await count(db, 'SELECT recipe_id FROM recipe_categories WHERE category_id = ?', category), 2);
    assert.equal(await count(db, 'SELECT id FROM categories WHERE name = ?', 'Bakken'), 1);
  });
});

describe('recipe-storage › Category linked twice is refused', () => {
  test('a second link to the same category fails', async ({ db }) => {
    const recipe = await addRecipe(db, 'cat-twice');
    const category = await addCategory(db, 'Snel');
    await linkCategory(db, recipe, category);
    await assert.rejects(linkCategory(db, recipe, category, 2));
  });
});

describe('recipe-storage › Link needs a recipe and a category', () => {
  test('an unknown recipe is refused', async ({ db }) => {
    await assert.rejects(linkCategory(db, 999999, await addCategory(db, 'Zonder recept')));
  });

  test('an unknown category is refused', async ({ db }) => {
    await assert.rejects(linkCategory(db, await addRecipe(db, 'cat-no-category'), 999999));
  });
});

describe('recipe-storage › Recipe with categories deleted', () => {
  test('the links are gone', async ({ db }) => {
    const recipe = await addRecipe(db, 'cat-deleted');
    await linkCategory(db, recipe, await addCategory(db, 'Hoofdgerecht'));
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT category_id FROM recipe_categories WHERE recipe_id = ?', recipe), 0);
  });

  test('the category remains', async ({ db }) => {
    const recipe = await addRecipe(db, 'cat-deleted-keep');
    await linkCategory(db, recipe, await addCategory(db, 'Blijft'));
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count(db, 'SELECT id FROM categories WHERE name = ?', 'Blijft'), 1);
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
