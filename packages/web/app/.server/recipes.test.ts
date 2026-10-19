import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { seals } from '~/lib/seals';
import { createRecipe, getRecipe, listAuthors, slugify, updateRecipe } from './recipes';

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

test('recipe-viewing › Order is kept', async () => {
  assert.deepEqual((await getRecipe(db, 'ordering'))?.steps, ['een', 'twee']);
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

test('recipe-viewing › Existing recipe', async () => {
  assert.equal((await getRecipe(db, 'full'))?.title, 'Full');
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

test('recipe-creation › Slug from title', async () => {
  assert.equal(slugify('Kip met Rijst!'), 'kip-met-rijst');
  assert.equal(slugify('  Crème brûlée  '), 'creme-brulee');
  assert.equal(slugify('!!!'), 'recept');
  assert.equal(await createRecipe(db, { title: 'Kip met Rijst!', author: 'Oma', servings: 4 }), 'kip-met-rijst');
});

test('recipe-creation › Same title twice', async () => {
  const first = await createRecipe(db, { title: 'Dubbel', author: 'Oma', servings: 2 });
  const second = await createRecipe(db, { title: 'Dubbel', author: 'Papa', servings: 3 });
  const third = await createRecipe(db, { title: 'Dubbel', author: 'Opa', servings: 4 });
  assert.deepEqual([first, second, third], ['dubbel', 'dubbel-2', 'dubbel-3']);
  assert.equal((await getRecipe(db, 'dubbel'))?.author, 'Oma');
});

test('recipe-creation › Title that clashes with the form address', async () => {
  assert.equal(await createRecipe(db, { title: 'Nieuw', author: 'Oma', servings: 2 }), 'nieuw-2');
});

test('createRecipe stores every property, ingredient and step so getRecipe reads them back', async () => {
  const slug = await createRecipe(db, {
    title: 'Alles',
    author: 'Tante An',
    servings: 6,
    time: '1u',
    intro: 'Intro',
    image: '/alles.jpg',
    seal: 'fu',
    createdBy: 'iemand@example.com',
    ingredients: [{ name: 'bloem', quantityText: '250 g', amount: 250, unit: 'g' }, { name: 'zout' }],
    steps: ['mengen', 'bakken'],
  });
  const r = await getRecipe(db, slug);
  assert.deepEqual(
    { ...r, id: 0 },
    {
      id: 0,
      slug: 'alles',
      title: 'Alles',
      author: 'Tante An',
      time: '1u',
      servings: 6,
      intro: 'Intro',
      image: '/alles.jpg',
      seal: 'fu',
      ingredients: [
        { quantity_text: '250 g', name: 'bloem' },
        { quantity_text: '', name: 'zout' },
      ],
      steps: ['mengen', 'bakken'],
    },
  );
  const row = await db
    .prepare(
      "SELECT r.created_by, i.amount, i.unit FROM recipes r JOIN ingredients i ON i.recipe_id = r.id WHERE r.slug = 'alles' AND i.position = 0",
    )
    .first();
  assert.deepEqual(row, { created_by: 'iemand@example.com', amount: 250, unit: 'g' });
});

test('recipe-creation › Existing authors are suggested', async () => {
  const fresh = await createTestDb();
  try {
    await createRecipe(fresh.db, { title: 'A', author: 'Papa', servings: 1 });
    await createRecipe(fresh.db, { title: 'B', author: 'Oma', servings: 1 });
    await fresh.db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('c', 'C', 'OMA', 1)").run();
    assert.deepEqual(await listAuthors(fresh.db), ['Oma', 'Papa']);
  } finally {
    await fresh.dispose();
  }
});

test('recipe-creation › New author is accepted', async () => {
  const slug = await createRecipe(db, { title: 'Nieuwe auteur', author: 'tante Mieke', servings: 2 });
  assert.equal((await getRecipe(db, slug))?.author, 'tante Mieke');
});

test('recipe-creation › Existing spelling is reused', async () => {
  await createRecipe(db, { title: 'Eerste', author: 'Opa Jos', servings: 2 });
  const slug = await createRecipe(db, { title: 'Tweede', author: 'opa jos', servings: 2 });
  assert.equal((await getRecipe(db, slug))?.author, 'Opa Jos');
});

test('recipe-creation › Seal is assigned', async () => {
  const slug = await createRecipe(db, { title: 'Met zegel', author: 'Oma' });
  assert.ok(seals.includes((await getRecipe(db, slug))?.seal ?? ''));
});

test('recipe-creation › Least used seals are chosen', async () => {
  const fresh = await createTestDb();
  try {
    const left = ['fu', 'jia'];
    await fresh.db.batch(
      seals
        .filter((s) => !left.includes(s))
        .map((s) => fresh.db.prepare('INSERT INTO recipes (slug, title, author, seal) VALUES (?, ?, ?, ?)').bind(s, s, 'Oma', s)),
    );
    for (let i = 0; i < 5; i++) {
      const slug = await createRecipe(fresh.db, { title: `Nieuw ${i}`, author: 'Oma' });
      const seal = (await getRecipe(fresh.db, slug))?.seal ?? '';
      assert.ok(left.includes(seal), seal);
      // It is now used once like the others, so the next one is one of the remaining unused seals.
      left.splice(left.indexOf(seal), 1);
      if (!left.length) left.push(...seals);
    }
  } finally {
    await fresh.dispose();
  }
});

test('recipe-creation › Provided seal is used', async () => {
  const slug = await createRecipe(db, { title: 'Eigen zegel', author: 'Oma', seal: 'fu' });
  assert.equal((await getRecipe(db, slug))?.seal, 'fu');
});

const original = { title: 'Origineel', author: 'Papa', servings: 4, time: '1u', intro: 'oud', image: '/oud.jpg', seal: 'fu' };

test('recipe-editing › Recipe is updated', async () => {
  const slug = await createRecipe(db, { ...original, ingredients: [{ name: 'ei' }], steps: ['kook'] });
  await db.prepare("UPDATE recipes SET updated_at = '2000-01-01T00:00:00Z' WHERE slug = ?").bind(slug).run();
  const changed = { title: 'Nieuw', author: 'Mama', servings: 6, time: '2u', intro: 'nieuw', image: '/nieuw.jpg' };
  assert.ok(await updateRecipe(db, slug, changed));
  const r = await getRecipe(db, slug);
  assert.deepEqual([r?.slug, r?.title, r?.author, r?.servings, r?.time, r?.intro, r?.image], [slug, 'Nieuw', 'Mama', 6, '2u', 'nieuw', '/nieuw.jpg']);
  assert.deepEqual([r?.ingredients.length, r?.steps], [1, ['kook']]);
  assert.notEqual((await db.prepare('SELECT updated_at FROM recipes WHERE slug = ?').bind(slug).first())?.updated_at, '2000-01-01T00:00:00Z');
});

test('recipe-editing › Seal kept', async () => {
  const slug = await createRecipe(db, original);
  await updateRecipe(db, slug, { title: 'Zelfde zegel', author: 'Papa' });
  assert.equal((await getRecipe(db, slug))?.seal, 'fu');
});

test('recipe-editing › Seal provided', async () => {
  const slug = await createRecipe(db, original);
  await updateRecipe(db, slug, { title: 'Ander zegel', author: 'Papa', seal: 'jia' });
  assert.equal((await getRecipe(db, slug))?.seal, 'jia');
});

test('recipe-editing › Optional field emptied', async () => {
  const slug = await createRecipe(db, original);
  await updateRecipe(db, slug, { title: 'Leeg', author: 'Papa' });
  const r = await getRecipe(db, slug);
  assert.deepEqual([r?.servings, r?.time, r?.intro, r?.image], [null, null, '', null]);
});

test('recipe-editing › Edited author reuses spelling', async () => {
  await createRecipe(db, { title: 'Van Tante', author: 'Tante Rita' });
  const slug = await createRecipe(db, { title: 'Aan te passen', author: 'Papa' });
  await updateRecipe(db, slug, { title: 'Aan te passen', author: 'tante rita' });
  assert.equal((await getRecipe(db, slug))?.author, 'Tante Rita');
});

test('recipe-editing › Own author can be respelled', async () => {
  const fresh = await createTestDb();
  try {
    const slug = await createRecipe(fresh.db, { title: 'Enige', author: 'Oma' });
    await updateRecipe(fresh.db, slug, { title: 'Enige', author: 'oma' });
    assert.equal((await getRecipe(fresh.db, slug))?.author, 'oma');
  } finally {
    await fresh.dispose();
  }
});

test('updateRecipe reports an unknown slug', async () => {
  assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y' }), undefined);
});

test('updateRecipe returns the image the recipe had', async () => {
  const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: '/foto/oud.jpg' });
  assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma', image: '/foto/nieuw.jpg' }), { previousImage: '/foto/oud.jpg' });
  assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma' }), { previousImage: '/foto/nieuw.jpg' });
});

const storedIngredients = async (slug: string) =>
  (
    await db
      .prepare(
        'SELECT i.position, i.name, i.quantity_text, i.amount, i.unit FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position',
      )
      .bind(slug)
      .all()
  ).results;

test('recipe-ingredient-editing › Ingredients are stored in order', async () => {
  const slug = await createRecipe(db, {
    title: 'Volgorde',
    author: 'Oma',
    ingredients: [{ name: 'bloem', quantityText: '250 g', amount: 250, unit: 'g' }, { name: 'zout' }, { name: 'ei', quantityText: '1', amount: 1 }],
  });
  assert.deepEqual(await storedIngredients(slug), [
    { position: 0, name: 'bloem', quantity_text: '250 g', amount: 250, unit: 'g' },
    { position: 1, name: 'zout', quantity_text: '', amount: null, unit: null },
    { position: 2, name: 'ei', quantity_text: '1', amount: 1, unit: null },
  ]);
});

test('recipe-ingredient-editing › Saved list replaces the old one', async () => {
  const slug = await createRecipe(db, { title: 'Vervangen', author: 'Oma', ingredients: [{ name: 'ei' }, { name: 'melk' }] });
  const base = { title: 'Vervangen', author: 'Oma' };
  await updateRecipe(db, slug, { ...base, ingredients: [{ name: 'melk' }, { name: 'boter', quantityText: '50 g', amount: 50, unit: 'g' }] });
  assert.deepEqual(
    (await storedIngredients(slug)).map((i) => [i.position, i.name, i.unit]),
    [
      [0, 'melk', null],
      [1, 'boter', 'g'],
    ],
  );
  await updateRecipe(db, slug, base);
  assert.equal((await storedIngredients(slug)).length, 2, 'omitting the argument leaves ingredients untouched');
  await updateRecipe(db, slug, { ...base, ingredients: [] });
  assert.equal((await storedIngredients(slug)).length, 0);
});

test('replacing ingredients of an unknown recipe stores nothing', async () => {
  assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', ingredients: [{ name: 'ei' }] }), undefined);
});

const storedSteps = async (slug: string) =>
  (
    await db
      .prepare('SELECT s.position, s.body FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position')
      .bind(slug)
      .all()
  ).results;

test('recipe-step-editing › Steps are stored in order', async () => {
  const slug = await createRecipe(db, { title: 'Stappen', author: 'Oma', steps: ['kneed', 'rijs', 'bak'] });
  assert.deepEqual(await storedSteps(slug), [
    { position: 0, body: 'kneed' },
    { position: 1, body: 'rijs' },
    { position: 2, body: 'bak' },
  ]);
  await updateRecipe(db, slug, { title: 'Stappen', author: 'Oma', steps: ['bak', 'kneed'] });
  assert.deepEqual(
    (await storedSteps(slug)).map((s) => s.body),
    ['bak', 'kneed'],
  );
});

test('recipe-step-editing › Saved steps replace the old ones', async () => {
  const slug = await createRecipe(db, { title: 'Stappen vervangen', author: 'Oma', steps: ['a', 'b', 'c'] });
  const base = { title: 'Stappen vervangen', author: 'Oma' };
  // One removed, one changed, one added.
  await updateRecipe(db, slug, { ...base, steps: ['a', 'c aangepast', 'd'] });
  assert.deepEqual(await storedSteps(slug), [
    { position: 0, body: 'a' },
    { position: 1, body: 'c aangepast' },
    { position: 2, body: 'd' },
  ]);
  await updateRecipe(db, slug, base);
  assert.equal((await storedSteps(slug)).length, 3, 'omitting the argument leaves steps untouched');
  await updateRecipe(db, slug, { ...base, steps: [] });
  assert.equal((await storedSteps(slug)).length, 0);
});

test('replacing steps of an unknown recipe stores nothing', async () => {
  assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', steps: ['a'] }), undefined);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM steps WHERE body = ?').bind('a').first())?.n, 0);
});
