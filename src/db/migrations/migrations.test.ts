import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
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

describe('recipe-storage › Recipe is saved', () => {
  test('every column is stored', async () => {
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
  test('the second recipe is refused', async () => {
    await addRecipe('dup');
    await assert.rejects(addRecipe('dup'));
  });

  test('only one recipe is stored', async () => {
    await addRecipe('dup').catch(() => {});
    assert.equal(await count("SELECT id FROM recipes WHERE slug = 'dup'"), 1);
  });
});

describe('recipe-storage › Servings are optional', () => {
  test('missing servings are null', async () => {
    await db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('no-servings', 'No servings', 'Oma')").run();
    assert.equal((await db.prepare("SELECT servings FROM recipes WHERE slug = 'no-servings'").first())?.servings, null);
  });
});

describe('recipe-storage › Required field is missing', () => {
  test('a recipe without a title is refused', async () => {
    await assert.rejects(db.prepare("INSERT INTO recipes (slug, author, servings) VALUES ('no-title', 'Oma', 4)").run());
  });

  test('zero servings are refused', async () => {
    await assert.rejects(db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('zero', 'Zero', 'Oma', 0)").run());
  });
});

describe('recipe-storage › Ingredients keep their order', () => {
  let r: number;
  let first: number;
  let second: number;
  before(async () => {
    r = await addRecipe('ingredient-order');
    second = await addIngredient(r, 2);
    first = await addIngredient(r, 1);
  });

  test('they are read in position order', async () => {
    const { results } = await db.prepare('SELECT id FROM ingredients WHERE recipe_id = ? ORDER BY position').bind(r).all();
    assert.deepEqual(
      results.map((row) => row.id),
      [first, second],
    );
  });

  test('a position is used once', async () => {
    await assert.rejects(addIngredient(r, 1));
  });
});

describe('recipe-storage › Ingredient needs a recipe', () => {
  test('an ingredient of an unknown recipe is refused', async () => {
    await assert.rejects(addIngredient(9999, 1));
  });
});

describe('recipe-storage › Quantity with amount and unit', () => {
  test('amount and unit are stored, the quantity text is empty', async () => {
    const id = await addIngredientWithAmount(await addRecipe('quantity'), 1, 250, 'g');
    assert.deepEqual(await db.prepare('SELECT quantity_text, amount, unit FROM ingredients WHERE id = ?').bind(id).first(), {
      quantity_text: '',
      amount: 250,
      unit: 'g',
    });
  });
});

describe('recipe-storage › Quantity without a number', () => {
  test('the quantity text is empty and amount and unit are null', async () => {
    const id = await addIngredient(await addRecipe('no-number'), 1);
    assert.deepEqual(await db.prepare('SELECT quantity_text, amount, unit FROM ingredients WHERE id = ?').bind(id).first(), {
      quantity_text: '',
      amount: null,
      unit: null,
    });
  });
});

describe('recipe-storage › Non-positive amount refused', () => {
  test('zero is refused', async () => {
    await assert.rejects(addIngredientWithAmount(await addRecipe('bad-amount-zero'), 1, 0, 'g'));
  });

  test('a negative amount is refused', async () => {
    await assert.rejects(addIngredientWithAmount(await addRecipe('bad-amount-negative'), 1, -1, 'g'));
  });
});

describe('recipe-storage › Steps keep their order', () => {
  let r: number;
  let first: number;
  let second: number;
  before(async () => {
    r = await addRecipe('step-order');
    second = await addStep(r, 2);
    first = await addStep(r, 1);
  });

  test('they are read in position order', async () => {
    const { results } = await db.prepare('SELECT id FROM steps WHERE recipe_id = ? ORDER BY position').bind(r).all();
    assert.deepEqual(
      results.map((row) => row.id),
      [first, second],
    );
  });

  test('a position is used once', async () => {
    await assert.rejects(addStep(r, 1));
  });
});

describe('recipe-storage › Step needs a recipe', () => {
  test('a step of an unknown recipe is refused', async () => {
    await assert.rejects(addStep(9999, 1));
  });
});

describe('recipe-storage › Step with image', () => {
  test('image and alt text are stored', async () => {
    const r = await addRecipe('step-image');
    await db.prepare("INSERT INTO steps (recipe_id, position, body, image, image_alt) VALUES (?, 1, 'x', '/s.jpg', 'a pan')").bind(r).run();
    assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), {
      image: '/s.jpg',
      image_alt: 'a pan',
    });
  });
});

describe('recipe-storage › Step without image', () => {
  test('image and alt text are null', async () => {
    const r = await addRecipe('step-no-image');
    await addStep(r, 1);
    assert.deepEqual(await db.prepare('SELECT image, image_alt FROM steps WHERE recipe_id = ?').bind(r).first(), { image: null, image_alt: null });
  });
});

describe('recipe-storage › Step uses part of an ingredient', () => {
  test('amount and unit are stored', async () => {
    const r = await addRecipe('link-part');
    const step = await addStep(r, 1);
    await link(step, await addIngredient(r, 1), r, 200);
    assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), { amount: 200, unit: 'g' });
  });
});

describe('recipe-storage › Step uses a whole ingredient', () => {
  test('amount and unit are null', async () => {
    const r = await addRecipe('link-whole');
    const step = await addStep(r, 1);
    await link(step, await addIngredient(r, 1), r);
    assert.deepEqual(await db.prepare('SELECT amount, unit FROM step_ingredients WHERE step_id = ?').bind(step).first(), {
      amount: null,
      unit: null,
    });
  });

  test('an amount of zero is refused', async () => {
    const r = await addRecipe('link-whole-zero');
    const step = await addStep(r, 1);
    await assert.rejects(link(step, await addIngredient(r, 1), r, 0));
  });
});

describe('recipe-storage › Ingredient of another recipe refused', () => {
  test('the link is refused', async () => {
    const a = await addRecipe('link-a');
    const foreign = await addIngredient(await addRecipe('link-b'), 1);
    await assert.rejects(link(await addStep(a, 1), foreign, a));
  });
});

describe('recipe-storage › Same ingredient linked twice refused', () => {
  test('the second link is refused', async () => {
    const r = await addRecipe('link-twice');
    const step = await addStep(r, 1);
    const ingredient = await addIngredient(r, 1);
    await link(step, ingredient, r);
    await assert.rejects(link(step, ingredient, r));
  });
});

describe('recipe-storage › Recipe deleted', () => {
  let r: number;
  before(async () => {
    r = await addRecipe('del-recipe');
    await link(await addStep(r, 1), await addIngredient(r, 1), r);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(r).run();
  });

  test('its ingredients are gone', async () => {
    assert.equal(await count('SELECT id FROM ingredients WHERE recipe_id = ?', r), 0);
  });

  test('its steps are gone', async () => {
    assert.equal(await count('SELECT id FROM steps WHERE recipe_id = ?', r), 0);
  });

  test('its step links are gone', async () => {
    assert.equal(await count('SELECT step_id FROM step_ingredients WHERE recipe_id = ?', r), 0);
  });
});

describe('recipe-storage › Ingredient deleted', () => {
  let step: number;
  before(async () => {
    const r = await addRecipe('del-ingredient');
    step = await addStep(r, 1);
    const ing = await addIngredient(r, 1);
    await link(step, ing, r);
    await db.prepare('DELETE FROM ingredients WHERE id = ?').bind(ing).run();
  });

  test('the step stays', async () => {
    assert.equal(await count('SELECT id FROM steps WHERE id = ?', step), 1);
  });

  test('the link is gone', async () => {
    assert.equal(await count('SELECT step_id FROM step_ingredients WHERE step_id = ?', step), 0);
  });
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

describe('recipe-storage › Step with oven temperature and timer', () => {
  test('oven temperature, timer minutes and timer label are stored', async () => {
    const step = (await addStepWith(await addRecipe('oven-timer'), 1, 180, 50, 'Bakken'))!.id;
    assert.deepEqual(await db.prepare('SELECT oven_temperature, timer_minutes, timer_label FROM steps WHERE id = ?').bind(step).first(), {
      oven_temperature: 180,
      timer_minutes: 50,
      timer_label: 'Bakken',
    });
  });
});

describe('recipe-storage › Step without oven or timer', () => {
  test('oven temperature, timer minutes and timer label are null', async () => {
    const step = await addStep(await addRecipe('no-oven-timer'), 1);
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
    test(`${what} is refused`, async () => {
      await assert.rejects(addStepWith(await addRecipe(`bad-oven-timer-${i}`), 1, oven, minutes));
    }),
  );
});

describe('recipe-storage › Timer name needs minutes', () => {
  test('a timer name without minutes is refused', async () => {
    await assert.rejects(addStepWith(await addRecipe('label-only'), 1, null, null, 'Bakken'));
  });
});

describe('recipe-storage › Chips keep their order', () => {
  test('they are read in position order', async () => {
    const step = await addStep(await addRecipe('chip-order'), 1);
    await addChip(step, 2, 'boter');
    await addChip(step, 1, 'bloem');
    const { results } = await db.prepare('SELECT name FROM step_ingredient_chips WHERE step_id = ? ORDER BY position').bind(step).all();
    assert.deepEqual(
      results.map((row) => row.name),
      ['bloem', 'boter'],
    );
  });
});

describe('recipe-storage › Chip without a quantity', () => {
  test('the quantity text is empty', async () => {
    const step = await addStep(await addRecipe('chip-no-quantity'), 1);
    await addChip(step, 1, 'boter');
    assert.deepEqual(await db.prepare('SELECT quantity_text, name FROM step_ingredient_chips WHERE step_id = ?').bind(step).first(), {
      quantity_text: '',
      name: 'boter',
    });
  });
});

describe('recipe-storage › Chip needs a name and a step', () => {
  test('a chip without a name is refused', async () => {
    const step = await addStep(await addRecipe('chip-invalid'), 1);
    await assert.rejects(addChip(step, 1, ''));
  });

  test('a chip of an unknown step is refused', async () => {
    await assert.rejects(addChip(9999, 1, 'boter'));
  });
});

describe('recipe-storage › Chips are removed with their step', () => {
  test('the chips are gone', async () => {
    const step = await addStep(await addRecipe('chip-cascade'), 1);
    await addChip(step, 1, 'boter');
    await db.prepare('DELETE FROM steps WHERE id = ?').bind(step).run();
    assert.equal(await count('SELECT step_id FROM step_ingredient_chips WHERE step_id = ?', step), 0);
  });
});

const addUser = (email: string, name: string) => db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(email, name).run();

describe('users table', () => {
  describe('an email address is one user whatever its letter case', () => {
    before(async () => {
      await addUser('Jos@Example.com', 'Jos');
    });

    test('the same address in another case is refused', async () => {
      await assert.rejects(addUser('jos@example.com', 'Josje'));
    });

    test('one user is stored', async () => {
      assert.equal(await count("SELECT id FROM users WHERE email = 'JOS@EXAMPLE.COM'"), 1);
    });
  });

  describe('a user needs a calling name that is not blank', () => {
    test('an empty name is refused', async () => {
      await assert.rejects(addUser('blank@example.com', ''));
    });

    test('a name of spaces is refused', async () => {
      await assert.rejects(addUser('spaces@example.com', '   '));
    });

    test('nobody is stored', async () => {
      assert.equal(await count("SELECT id FROM users WHERE email IN ('blank@example.com', 'spaces@example.com')"), 0);
    });
  });

  test('a user gets a creation time in the same format as a recipe', async () => {
    await addUser('time@example.com', 'Tim');
    const row = await db.prepare("SELECT created_at FROM users WHERE email = 'time@example.com'").first<{ created_at: string }>();
    assert.match(row!.created_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  });
});

describe('users › Unknown role is refused', () => {
  test('the insert is refused', async () => {
    await assert.rejects(db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('x@example.com', 'X', 'owner')").run());
  });

  test('nobody is stored', async () => {
    await db
      .prepare("INSERT INTO users (email, calling_name, role) VALUES ('x@example.com', 'X', 'owner')")
      .run()
      .catch(() => {});
    assert.equal(await count("SELECT id FROM users WHERE email = 'x@example.com'"), 0);
  });
});

const addView = (user: number, recipe: number) => db.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const userId = async (email: string) =>
  (await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?) RETURNING id').bind(email, 'X').first<{ id: number }>())!.id;

describe('recipe_views table', () => {
  describe('a member and a recipe have one view row', () => {
    let user: number;
    let recipe: number;
    before(async () => {
      user = await userId('viewer@example.com');
      recipe = await addRecipe('view-once');
      await addView(user, recipe);
    });

    test('a second view row of the same pair is refused', async () => {
      await assert.rejects(addView(user, recipe));
    });

    test('another member has a view row of their own', async () => {
      await addView(await userId('other-viewer@example.com'), recipe);
      assert.equal(await count('SELECT user_id FROM recipe_views WHERE recipe_id = ?', recipe), 2);
    });

    test('an unknown recipe is refused', async () => {
      await assert.rejects(addView(user, 9999));
    });

    test('an unknown member is refused', async () => {
      await assert.rejects(addView(9999, recipe));
    });
  });

  describe('views are removed with their recipe or member', () => {
    let user: number;
    let other: number;
    before(async () => {
      user = await userId('cascade-viewer@example.com');
      const recipe = await addRecipe('view-cascade');
      other = await addRecipe('view-cascade-user');
      await addView(user, recipe);
      await addView(user, other);
      await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    });

    test('deleting a recipe removes only its views', async () => {
      assert.equal(await count('SELECT user_id FROM recipe_views WHERE user_id = ?', user), 1);
    });

    test('deleting a member removes their views', async () => {
      await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
      assert.equal(await count('SELECT user_id FROM recipe_views WHERE recipe_id = ?', other), 0);
    });
  });
});

describe('settings table', () => {
  const put = (key: string, value: string) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind(key, value).run();

  test('keeps one value per key', async () => {
    await put('k', '{"a":1}');
    await assert.rejects(put('k', '{}'));
  });

  test('refuses a value that is not JSON', async () => {
    await assert.rejects(put('bad', 'not json'));
  });

  test('stores nothing for a value that is not JSON', async () => {
    await put('bad2', 'not json').catch(() => {});
    assert.equal(await count("SELECT key FROM settings WHERE key = 'bad2'"), 0);
  });
});

const addLike = (user: number, recipe: number) =>
  db.prepare('INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run();
const addNote = (user: number, recipe: number, body = 'minder zout') =>
  db.prepare('INSERT INTO recipe_notes (user_id, recipe_id, body) VALUES (?, ?, ?)').bind(user, recipe, body).run();

describe('recipe-like › Liking twice stores one like', () => {
  let user: number;
  let recipe: number;
  before(async () => {
    user = await userId('liker@example.com');
    recipe = await addRecipe('like-twice');
    await addLike(user, recipe);
    await addLike(user, recipe);
  });

  test('one like is stored', async () => {
    assert.equal(await count('SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 1);
  });

  test('a plain second insert is refused', async () => {
    await assert.rejects(db.prepare('INSERT INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)').bind(user, recipe).run());
  });
});

describe('recipe-like › Deleting a recipe removes its likes', () => {
  test('the likes are gone', async () => {
    const recipe = await addRecipe('like-recipe-cascade');
    await addLike(await userId('like-cascade-a@example.com'), recipe);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count('SELECT user_id FROM recipe_likes WHERE recipe_id = ?', recipe), 0);
  });
});

describe('recipe-like › Removing a member removes their likes', () => {
  test('the likes are gone', async () => {
    const user = await userId('like-user-cascade@example.com');
    await addLike(user, await addRecipe('like-user-cascade'));
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
    assert.equal(await count('SELECT recipe_id FROM recipe_likes WHERE user_id = ?', user), 0);
  });
});

describe('recipe-note › Deleting a recipe removes its notes', () => {
  test('the notes are gone', async () => {
    const recipe = await addRecipe('note-recipe-cascade');
    await addNote(await userId('note-cascade-a@example.com'), recipe);
    await db.prepare('DELETE FROM recipes WHERE id = ?').bind(recipe).run();
    assert.equal(await count('SELECT user_id FROM recipe_notes WHERE recipe_id = ?', recipe), 0);
  });
});

describe('recipe-note › Removing a member removes their notes', () => {
  test('the notes are gone', async () => {
    const user = await userId('note-user-cascade@example.com');
    await addNote(user, await addRecipe('note-user-cascade'));
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user).run();
    assert.equal(await count('SELECT recipe_id FROM recipe_notes WHERE user_id = ?', user), 0);
  });
});

describe('recipe_notes table', () => {
  test('a blank note body is refused', async () => {
    const user = await userId('blank-note@example.com');
    await assert.rejects(addNote(user, await addRecipe('blank-note'), '  \n '));
  });

  test('a second note per member and recipe is refused', async () => {
    const user = await userId('second-note@example.com');
    const recipe = await addRecipe('second-note');
    await addNote(user, recipe);
    await assert.rejects(addNote(user, recipe, 'andere'));
  });
});
