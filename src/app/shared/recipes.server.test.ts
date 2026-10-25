import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { defined } from '~testing/defined';
import { test } from '~testing/test';
import {
  createRecipe,
  deleteRecipe,
  getMemberRecipeData,
  getRecipe,
  listAuthors,
  listRecipes,
  listTags,
  setLike,
  setNote,
  slugify,
  updateRecipe,
  type StepInput,
} from './recipes.server';
import { seals } from './seals';

/** Steps with only a text, as they are stored and as they come back. */
const plain = (...bodies: string[]): StepInput[] => bodies.map((body) => ({ body }));
const loaded = (...bodies: string[]) => bodies.map((body) => ({ body, ingredients: [], quantities: [] }));

const seedOrdering = (db: D1Database) =>
  db.batch([
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

describe('getRecipe', () => {
  test.beforeEach(({ db }) => seedOrdering(db));

  test('returns undefined for an unknown slug', async ({ db }) => {
    assert.equal(await getRecipe(db, 'nope'), undefined);
  });

  describe('returns ingredients and steps in position order, and leaves optional fields null', () => {
    const slug = 'ordering';

    test('the author is read', async ({ db }) => {
      assert.equal((await getRecipe(db, slug))?.author, 'Oma');
    });

    test('a missing time is null', async ({ db }) => {
      assert.equal((await getRecipe(db, slug))?.time, null);
    });

    test('a missing image is null', async ({ db }) => {
      assert.equal((await getRecipe(db, slug))?.image, null);
    });

    test('the ingredients are in position order', async ({ db }) => {
      assert.deepEqual((await getRecipe(db, slug))?.ingredients, [
        { quantityText: '1', quantityValue: null, quantityUnit: null, name: 'ei' },
        { quantityText: '', quantityValue: null, quantityUnit: null, name: 'zout' },
      ]);
    });
  });
});

describe('recipe-storage › Quantity value and unit are read with the recipe', () => {
  test('text, value and unit of an ingredient saved from the editor', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Bloem',
      author: 'Oma',
      ingredients: [{ quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' }],
    });
    assert.deepEqual((await getRecipe(db, slug))?.ingredients, [{ quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' }]);
  });
});

describe('ingredient quantity without a number', () => {
  test('the text is kept and there is no value', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Olie',
      author: 'Oma',
      ingredients: [{ quantityText: '2-3 el', quantityUnit: 'el', name: 'olie' }],
    });
    const [ingredient] = (await getRecipe(db, slug))?.ingredients ?? [];
    assert.deepEqual([ingredient.quantityText, ingredient.quantityValue], ['2-3 el', null]);
  });
});

describe('recipe-viewing › Order is kept', () => {
  test.beforeEach(({ db }) => seedOrdering(db));

  test('the steps are in position order', async ({ db }) => {
    assert.deepEqual(defined((await getRecipe(db, 'ordering'))?.steps), loaded('een', 'twee'));
  });
});

describe('recipe-viewing › Existing recipe', () => {
  test.beforeEach(({ db }) => seedOrdering(db));

  test('the recipe is found by its slug', async ({ db }) => {
    assert.equal((await getRecipe(db, 'full'))?.title, 'Full');
  });
});

describe('recipe-creation › Slug from title', () => {
  test('punctuation is dropped and words are joined with dashes', () => {
    assert.equal(slugify('Kip met Rijst!'), 'kip-met-rijst');
  });

  test('accents are removed', () => {
    assert.equal(slugify('  Crème brûlée  '), 'creme-brulee');
  });

  test('a title without letters gives recept', () => {
    assert.equal(slugify('!!!'), 'recept');
  });
});

describe('recipe-creation › Same title twice', () => {
  let slugs: string[];
  test.beforeEach(async ({ db }) => {
    slugs = [
      await createRecipe(db, { title: 'Dubbel', author: 'Oma', servings: 2 }),
      await createRecipe(db, { title: 'Dubbel', author: 'Papa', servings: 3 }),
      await createRecipe(db, { title: 'Dubbel', author: 'Opa', servings: 4 }),
    ];
  });

  test('the slugs get a number', () => {
    assert.deepEqual(slugs, ['dubbel', 'dubbel-2', 'dubbel-3']);
  });

  test('the first recipe is kept', async ({ db }) => {
    assert.equal((await getRecipe(db, 'dubbel'))?.author, 'Oma');
  });
});

describe('recipe-creation › Title that clashes with the form address', () => {
  test('the slug gets a number', async ({ db }) => {
    assert.equal(await createRecipe(db, { title: 'Nieuw', author: 'Oma', servings: 2 }), 'nieuw-2');
  });
});

describe('createRecipe', () => {
  describe('stores every property, ingredient and step so getRecipe reads them back', () => {
    let slug: string;
    test.beforeEach(async ({ db }) => {
      slug = await createRecipe(db, {
        title: 'Alles',
        author: 'Tante An',
        servings: 6,
        time: '1u',
        intro: 'Intro',
        image: '/alles.jpg',
        seal: 'fu',
        createdBy: 'iemand@example.com',
        ingredients: [{ name: 'bloem', quantityText: '250 g', quantityValue: 250, quantityUnit: 'g' }, { name: 'zout' }],
        steps: plain('mengen', 'bakken'),
      });
    });

    test('getRecipe reads back every property', async ({ db }) => {
      const r = await getRecipe(db, slug);
      assert.deepEqual(defined({ ...r, id: 0, updated_at: '' }), {
        id: 0,
        updated_at: '',
        slug: 'alles',
        title: 'Alles',
        author: 'Tante An',
        time: '1u',
        servings: 6,
        intro: 'Intro',
        image: '/alles.jpg',
        seal: 'fu',
        ingredients: [
          { quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' },
          { quantityText: '', quantityValue: null, quantityUnit: null, name: 'zout' },
        ],
        steps: loaded('mengen', 'bakken'),
        tags: [],
      });
    });

    test('the creator and the parsed amount and unit are stored', async ({ db }) => {
      const row = await db
        .prepare(
          "SELECT r.created_by, i.quantity_value, i.quantity_unit FROM recipes r JOIN ingredients i ON i.recipe_id = r.id WHERE r.slug = 'alles' AND i.position = 0",
        )
        .first();
      assert.deepEqual(row, { created_by: 'iemand@example.com', quantity_value: 250, quantity_unit: 'g' });
    });
  });
});

describe('recipe-creation › Existing authors are suggested', () => {
  test('lists each author once, spelled as first used', async ({ db }) => {
    await createRecipe(db, { title: 'A', author: 'Papa', servings: 1 });
    await createRecipe(db, { title: 'B', author: 'Oma', servings: 1 });
    await db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('c', 'C', 'OMA', 1)").run();
    assert.deepEqual(await listAuthors(db), ['Oma', 'Papa']);
  });
});

describe('listRecipes', () => {
  test('lists nothing without recipes', async ({ db }) => {
    assert.deepEqual(await listRecipes(db, 'x@example.com', new Date()), []);
  });

  test('lists every recipe with its card fields, the most recently added first', async ({ db }) => {
    await createRecipe(db, { title: 'Eerst', author: 'Oma', time: '30 min', image: '/a.jpg', seal: 'fu' });
    await createRecipe(db, { title: 'Daarna', author: 'Papa', seal: 'fu' });
    assert.deepEqual(await listRecipes(db, 'x@example.com', new Date()), [
      {
        slug: 'daarna',
        title: 'Daarna',
        author: 'Papa',
        time: null,
        image: null,
        seal: 'fu',
        tags: [],
        liked: false,
        hasNote: false,
        isNew: true,
      },
      {
        slug: 'eerst',
        title: 'Eerst',
        author: 'Oma',
        time: '30 min',
        image: '/a.jpg',
        seal: 'fu',
        tags: [],
        liked: false,
        hasNote: false,
        isNew: true,
      },
    ]);
  });
});

const me = 'x@example.com';
const other = 'y@example.com';
const seedUsers = (db: D1Database) =>
  db.batch([
    db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(me, 'Ik'),
    db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(other, 'Ander'),
  ]);
const entry = async (db: D1Database, slug: string, email = me) => (await listRecipes(db, email, new Date())).find((r) => r.slug === slug);

describe('recipe-like › Card of a liked recipe', () => {
  test('the entry is liked', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    await setLike(db, me, slug, true);
    assert.equal((await entry(db, slug))?.liked, true);
  });
});

describe('recipe-like › Card of a recipe not liked', () => {
  test('the entry is not liked', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    assert.equal((await entry(db, slug))?.liked, false);
  });
});

describe("recipe-like › Another member's like on a card", () => {
  test('the other member sees it not liked', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    await setLike(db, me, slug, true);
    assert.equal((await entry(db, slug, other))?.liked, false);
  });
});

describe('recipe-note › Card of a recipe with a note', () => {
  test('the entry has a note', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    await setNote(db, me, slug, 'lekker');
    assert.equal((await entry(db, slug))?.hasNote, true);
  });
});

describe('recipe-note › Card of a recipe without a note', () => {
  test('the entry has no note', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    assert.equal((await entry(db, slug))?.hasNote, false);
  });
});

describe("recipe-note › Another member's note on a card", () => {
  test('the other member sees no note', async ({ db }) => {
    await seedUsers(db);
    const slug = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    await setNote(db, me, slug, 'lekker');
    assert.equal((await entry(db, slug, other))?.hasNote, false);
  });
});

const tagRecipe = async (db: D1Database, slug: string, ...names: string[]) => {
  for (const name of names) {
    await db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(name).run();
    await db
      .prepare('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ((SELECT id FROM recipes WHERE slug = ?), (SELECT id FROM tags WHERE name = ?))')
      .bind(slug, name)
      .run();
  }
};
const listedTags = async (db: D1Database, slug: string) => (await listRecipes(db, 'x@example.com', new Date())).find((r) => r.slug === slug)?.tags;
const storedTags = async (db: D1Database) =>
  (await db.prepare('SELECT name FROM tags ORDER BY name').all<{ name: string }>()).results.map((r) => r.name);

describe('recipe-storage › Recipe with tags', () => {
  test('reading a recipe gives its tags alphabetically', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Erwtensoep', author: 'Oma', seal: 'fu' });
    await tagRecipe(db, slug, 'Winter', 'Soep');
    assert.deepEqual((await getRecipe(db, slug))?.tags, ['Soep', 'Winter']);
  });
});

describe('recipe-storage › Recipe without tags', () => {
  test('its entry has an empty list', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma', seal: 'fu' });
    assert.deepEqual(await listedTags(db, slug), []);
  });
});

describe('recipe-storage › Tag is shared', () => {
  test('both recipes are listed with the tag', async ({ db }) => {
    const a = await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' });
    const b = await createRecipe(db, { title: 'B', author: 'Oma', seal: 'fu' });
    await tagRecipe(db, a, 'Snel');
    await tagRecipe(db, b, 'Snel');
    const listed = await listRecipes(db, 'x@example.com', new Date());
    assert.deepEqual(
      listed.map((r) => r.tags),
      [['Snel'], ['Snel']],
    );
  });

  test('only one tag is stored', async ({ db }) => {
    await tagRecipe(db, await createRecipe(db, { title: 'A', author: 'Oma', seal: 'fu' }), 'Snel');
    await tagRecipe(db, await createRecipe(db, { title: 'B', author: 'Oma', seal: 'fu' }), 'Snel');
    assert.deepEqual(await storedTags(db), ['Snel']);
  });
});

describe('recipe-storage › Listing returns the most used tags first', () => {
  test('the entry has the most used tag first', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Hoofd', author: 'Oma', seal: 'fu' });
    await tagRecipe(db, slug, 'Soep', 'Bakken', 'winter');
    for (const title of ['B', 'C']) await tagRecipe(db, await createRecipe(db, { title, author: 'Oma', seal: 'fu' }), 'winter');
    await tagRecipe(db, await createRecipe(db, { title: 'D', author: 'Oma', seal: 'fu' }), 'Soep');
    assert.deepEqual(await listedTags(db, slug), ['winter', 'Soep', 'Bakken']);
  });
});

describe('recipe-storage › Equally used tags are alphabetical', () => {
  test('equal counts are in alphabetical order', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Gelijk', author: 'Oma', seal: 'fu' });
    await tagRecipe(db, slug, 'winter', 'Soep');
    assert.deepEqual(await listedTags(db, slug), ['Soep', 'winter']);
  });
});

describe('recipe-storage › Reading a recipe returns tags alphabetically', () => {
  test('the recipe has its tags in alphabetical order', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Alfabet', author: 'Oma', seal: 'fu' });
    await tagRecipe(db, slug, 'winter', 'Soep');
    assert.deepEqual((await getRecipe(db, slug))?.tags, ['Soep', 'winter']);
  });
});

describe('recipe-storage › Tags are listed alphabetically', () => {
  test('the tags come back alphabetically', async ({ db }) => {
    await db.batch(['winter', 'Soep', 'Bakken'].map((name) => db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name)));
    assert.deepEqual(await listTags(db), ['Bakken', 'Soep', 'winter']);
  });
});

describe('recipe-creation › New author is accepted', () => {
  test('the author is stored as typed', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Nieuwe auteur', author: 'tante Mieke', servings: 2 });
    assert.equal((await getRecipe(db, slug))?.author, 'tante Mieke');
  });
});

const base = { title: 'Soepje', author: 'Oma', seal: 'fu' };
const readTags = async (db: D1Database, slug: string) => (await getRecipe(db, slug))?.tags;

describe('recipe-storage › Recipe is created with tags', () => {
  test('the recipe has the tags', async ({ db }) => {
    assert.deepEqual(await readTags(db, await createRecipe(db, { ...base, tags: ['Soep', 'Winter'] })), ['Soep', 'Winter']);
  });

  test('both tags exist', async ({ db }) => {
    await createRecipe(db, { ...base, tags: ['Soep', 'Winter'] });
    assert.deepEqual(await storedTags(db), ['Soep', 'Winter']);
  });
});

describe('recipe-storage › Recipe tags are replaced', () => {
  test('only the new tags remain', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Soep', 'Winter'] });
    await updateRecipe(db, slug, { ...base, tags: ['Snel'] });
    assert.deepEqual(await readTags(db, slug), ['Snel']);
  });
});

describe('recipe-storage › Update without tags keeps them', () => {
  test('the tags remain', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Soep'] });
    await updateRecipe(db, slug, base);
    assert.deepEqual(await readTags(db, slug), ['Soep']);
  });
});

describe('recipe-storage › Update with an empty list clears them', () => {
  test('the recipe has no tags', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Soep'] });
    await updateRecipe(db, slug, { ...base, tags: [] });
    assert.deepEqual(await readTags(db, slug), []);
  });
});

describe('recipe-storage › Existing spelling is reused', () => {
  test('the recipe gets the stored spelling', async ({ db }) => {
    await createRecipe(db, { ...base, title: 'Eerste', tags: ['Soep'] });
    assert.deepEqual(await readTags(db, await createRecipe(db, { ...base, title: 'Tweede', tags: ['soep'] })), ['Soep']);
  });

  test('no second tag is created', async ({ db }) => {
    await createRecipe(db, { ...base, title: 'Eerste', tags: ['Soep'] });
    await createRecipe(db, { ...base, title: 'Tweede', tags: ['soep'] });
    assert.deepEqual(await storedTags(db), ['Soep']);
  });
});

describe('recipe-storage › Duplicate and blank tags are dropped', () => {
  test('the recipe has each tag once', async ({ db }) => {
    assert.deepEqual(await readTags(db, await createRecipe(db, { ...base, tags: ['Soep', ' ', 'soep', 'Winter'] })), ['Soep', 'Winter']);
  });
});

describe('recipe-storage › Unknown tag is created', () => {
  test('the tag is stored and the recipe has it', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Kerst'] });
    assert.deepEqual(await storedTags(db), ['Kerst']);
    assert.deepEqual(await readTags(db, slug), ['Kerst']);
  });
});

describe('recipe-storage › Unused tag remains', () => {
  test('the tag is still stored and listed', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Soep'] });
    await updateRecipe(db, slug, { ...base, tags: [] });
    assert.deepEqual(await listTags(db), ['Soep']);
  });
});

describe('recipe-storage › Recipe with tags deleted', () => {
  test('its links are gone and the tag remains', async ({ db }) => {
    const slug = await createRecipe(db, { ...base, tags: ['Soep'] });
    await deleteRecipe(db, slug);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM recipe_tags').first<{ n: number }>())?.n, 0);
    assert.deepEqual(await storedTags(db), ['Soep']);
  });
});

describe('recipe-creation › Existing spelling is reused', () => {
  test('the author gets the existing spelling', async ({ db }) => {
    await createRecipe(db, { title: 'Eerste', author: 'Opa Jos', servings: 2 });
    const slug = await createRecipe(db, { title: 'Tweede', author: 'opa jos', servings: 2 });
    assert.equal((await getRecipe(db, slug))?.author, 'Opa Jos');
  });
});

describe('recipe-creation › Seal is assigned', () => {
  test('the recipe gets one of the seals', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Met zegel', author: 'Oma' });
    assert.ok(seals.includes((await getRecipe(db, slug))?.seal ?? ''));
  });
});

describe('recipe-creation › Least used seals are chosen', () => {
  test('every new recipe gets a least used seal', async ({ db }) => {
    const left = ['fu', 'jia'];
    await db.batch(
      seals
        .filter((s) => !left.includes(s))
        .map((s) => db.prepare('INSERT INTO recipes (slug, title, author, seal) VALUES (?, ?, ?, ?)').bind(s, s, 'Oma', s)),
    );
    for (let i = 0; i < 5; i++) {
      const slug = await createRecipe(db, { title: `Nieuw ${i}`, author: 'Oma' });
      const seal = (await getRecipe(db, slug))?.seal ?? '';
      assert.ok(left.includes(seal), seal);
      // It is now used once like the others, so the next one is one of the remaining unused seals.
      left.splice(left.indexOf(seal), 1);
      if (!left.length) left.push(...seals);
    }
  });
});

describe('recipe-creation › Provided seal is used', () => {
  test('the recipe gets the provided seal', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Eigen zegel', author: 'Oma', seal: 'fu' });
    assert.equal((await getRecipe(db, slug))?.seal, 'fu');
  });
});

const original = { title: 'Origineel', author: 'Papa', servings: 4, time: '1u', intro: 'oud', image: '/oud.jpg', seal: 'fu' };

describe('recipe-editing › Recipe is updated', () => {
  let slug: string;
  let saved: unknown;
  test.beforeEach(async ({ db }) => {
    slug = await createRecipe(db, { ...original, ingredients: [{ name: 'ei' }], steps: plain('kook') });
    await db.prepare("UPDATE recipes SET updated_at = '2000-01-01T00:00:00Z' WHERE slug = ?").bind(slug).run();
    saved = await updateRecipe(db, slug, { title: 'Nieuw', author: 'Mama', servings: 6, time: '2u', intro: 'nieuw', image: '/nieuw.jpg' });
  });

  test('the update succeeds', () => {
    assert.ok(saved);
  });

  test('the properties change and the slug stays', async ({ db }) => {
    const r = await getRecipe(db, slug);
    assert.deepEqual(
      [r?.slug, r?.title, r?.author, r?.servings, r?.time, r?.intro, r?.image],
      [slug, 'Nieuw', 'Mama', 6, '2u', 'nieuw', '/nieuw.jpg'],
    );
  });

  test('the ingredients and steps stay', async ({ db }) => {
    const r = await getRecipe(db, slug);
    assert.deepEqual([r?.ingredients.length, defined(r?.steps)], [1, loaded('kook')]);
  });

  test('the last saved time changes', async ({ db }) => {
    assert.notEqual((await db.prepare('SELECT updated_at FROM recipes WHERE slug = ?').bind(slug).first())?.updated_at, '2000-01-01T00:00:00Z');
  });
});

describe('recipe-editing › Seal kept', () => {
  test('the seal stays', async ({ db }) => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Zelfde zegel', author: 'Papa' });
    assert.equal((await getRecipe(db, slug))?.seal, 'fu');
  });
});

describe('recipe-editing › Seal provided', () => {
  test('the seal changes', async ({ db }) => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Ander zegel', author: 'Papa', seal: 'jia' });
    assert.equal((await getRecipe(db, slug))?.seal, 'jia');
  });
});

describe('recipe-editing › Optional field emptied', () => {
  test('servings, time and image are null and the intro is empty', async ({ db }) => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Leeg', author: 'Papa' });
    const r = await getRecipe(db, slug);
    assert.deepEqual([r?.servings, r?.time, r?.intro, r?.image], [null, null, '', null]);
  });
});

describe('recipe-editing › Edited author reuses spelling', () => {
  test('the author gets the existing spelling', async ({ db }) => {
    await createRecipe(db, { title: 'Van Tante', author: 'Tante Rita' });
    const slug = await createRecipe(db, { title: 'Aan te passen', author: 'Papa' });
    await updateRecipe(db, slug, { title: 'Aan te passen', author: 'tante rita' });
    assert.equal((await getRecipe(db, slug))?.author, 'Tante Rita');
  });
});

describe('recipe-editing › Own author can be respelled', () => {
  test('the author gets the new spelling', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Enige', author: 'Oma' });
    await updateRecipe(db, slug, { title: 'Enige', author: 'oma' });
    assert.equal((await getRecipe(db, slug))?.author, 'oma');
  });
});

describe('updateRecipe', () => {
  test('reports an unknown slug', async ({ db }) => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y' }), undefined);
  });

  describe('returns the image the recipe had', () => {
    test('the first image when it is replaced', async ({ db }) => {
      const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: '/foto/oud.jpg' });
      assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma', image: '/foto/nieuw.jpg' }), {
        previousImage: '/foto/oud.jpg',
      });
    });

    test('the replacing image when it is removed', async ({ db }) => {
      const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: '/foto/oud.jpg' });
      await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma', image: '/foto/nieuw.jpg' });
      assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma' }), { previousImage: '/foto/nieuw.jpg' });
    });
  });
});

const storedIngredients = async (db: D1Database, slug: string) =>
  (
    await db
      .prepare(
        'SELECT i.position, i.name, i.quantity_text, i.quantity_value, i.quantity_unit FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position',
      )
      .bind(slug)
      .all()
  ).results;

describe('recipe-ingredient-editing › Ingredients are stored in order', () => {
  test('each ingredient gets its position and parsed values', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Volgorde',
      author: 'Oma',
      ingredients: [
        { name: 'bloem', quantityText: '250 g', quantityValue: 250, quantityUnit: 'g' },
        { name: 'zout' },
        { name: 'ei', quantityText: '1', quantityValue: 1 },
      ],
    });
    assert.deepEqual(await storedIngredients(db, slug), [
      { position: 0, name: 'bloem', quantity_text: '250 g', quantity_value: 250, quantity_unit: 'g' },
      { position: 1, name: 'zout', quantity_text: '', quantity_value: null, quantity_unit: null },
      { position: 2, name: 'ei', quantity_text: '1', quantity_value: 1, quantity_unit: null },
    ]);
  });
});

describe('recipe-ingredient-editing › Saved list replaces the old one', () => {
  const base = { title: 'Vervangen', author: 'Oma' };
  const create = (db: D1Database) => createRecipe(db, { ...base, ingredients: [{ name: 'ei' }, { name: 'melk' }] });

  test('the new list is stored', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, {
      ...base,
      ingredients: [{ name: 'melk' }, { name: 'boter', quantityText: '50 g', quantityValue: 50, quantityUnit: 'g' }],
    });
    assert.deepEqual(
      (await storedIngredients(db, slug)).map((i) => [i.position, i.name, i.quantity_unit]),
      [
        [0, 'melk', null],
        [1, 'boter', 'g'],
      ],
    );
  });

  test('omitting the argument leaves ingredients untouched', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, base);
    assert.equal((await storedIngredients(db, slug)).length, 2);
  });

  test('an empty list removes them all', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, { ...base, ingredients: [] });
    assert.equal((await storedIngredients(db, slug)).length, 0);
  });
});

describe('updateRecipe with ingredients', () => {
  test('replacing ingredients of an unknown recipe stores nothing', async ({ db }) => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', ingredients: [{ name: 'ei' }] }), undefined);
  });
});

const storedSteps = async (db: D1Database, slug: string) =>
  (
    await db
      .prepare('SELECT s.position, s.body FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position')
      .bind(slug)
      .all()
  ).results;

describe('recipe-step-editing › Steps are stored in order', () => {
  test('each step gets its position', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Stappen', author: 'Oma', steps: plain('kneed', 'rijs', 'bak') });
    assert.deepEqual(await storedSteps(db, slug), [
      { position: 0, body: 'kneed' },
      { position: 1, body: 'rijs' },
      { position: 2, body: 'bak' },
    ]);
  });

  test('a changed order is stored', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Stappen', author: 'Oma', steps: plain('kneed', 'rijs', 'bak') });
    await updateRecipe(db, slug, { title: 'Stappen', author: 'Oma', steps: plain('bak', 'kneed') });
    assert.deepEqual(
      (await storedSteps(db, slug)).map((s) => s.body),
      ['bak', 'kneed'],
    );
  });
});

describe('recipe-step-editing › Saved steps replace the old ones', () => {
  const base = { title: 'Stappen vervangen', author: 'Oma' };
  const create = (db: D1Database) => createRecipe(db, { ...base, steps: plain('a', 'b', 'c') });

  test('one removed, one changed, one added', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, { ...base, steps: plain('a', 'c aangepast', 'd') });
    assert.deepEqual(await storedSteps(db, slug), [
      { position: 0, body: 'a' },
      { position: 1, body: 'c aangepast' },
      { position: 2, body: 'd' },
    ]);
  });

  test('omitting the argument leaves steps untouched', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, base);
    assert.equal((await storedSteps(db, slug)).length, 3);
  });

  test('an empty list removes them all', async ({ db }) => {
    const slug = await create(db);
    await updateRecipe(db, slug, { ...base, steps: [] });
    assert.equal((await storedSteps(db, slug)).length, 0);
  });
});

describe('updateRecipe with steps', () => {
  test('replacing steps of an unknown recipe stores nothing', async ({ db }) => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', steps: plain('orphan') }), undefined);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM steps WHERE body = ?').bind('orphan').first())?.n, 0);
  });
});

const withChips: StepInput[] = [
  {
    body: 'Kneed bloem en boter. Laat 30 minuten rusten.',
    ingredients: [
      { quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' },
      { quantityText: '', quantityValue: null, quantityUnit: null, name: 'boter' },
    ],
    timer: { minutes: 30, label: 'Deeg rust' },
    quantities: [],
  },
  { body: 'Bak op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 50 }, quantities: [] },
  { body: 'Eet smakelijk.', ingredients: [], quantities: [] },
];

describe('recipe-step-chips › Chips are stored with their step', () => {
  const fewer: StepInput[] = [
    { body: 'Kneed.', ingredients: [{ quantityText: '1', quantityValue: 1, quantityUnit: null, name: 'ei' }], quantities: [] },
  ];
  const saveFewer = async (db: D1Database) => {
    const slug = await createRecipe(db, { title: 'Met chips', author: 'Oma', steps: withChips });
    await updateRecipe(db, slug, { title: 'Met chips', author: 'Oma', steps: fewer });
    return slug;
  };

  test('the chips come back with their step', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Met chips', author: 'Oma', steps: withChips });
    assert.deepEqual(defined((await getRecipe(db, slug))?.steps), withChips);
  });

  // Saving again replaces the chips of the old steps instead of adding to them.
  test('saving again replaces the steps with their chips', async ({ db }) => {
    const slug = await saveFewer(db);
    assert.deepEqual(defined((await getRecipe(db, slug))?.steps), fewer);
  });

  test('saving again leaves only the new chips stored', async ({ db }) => {
    const slug = await saveFewer(db);
    assert.equal(
      (
        await db
          .prepare(
            'SELECT COUNT(*) AS n FROM step_ingredient_chips c JOIN steps s ON s.id = c.step_id JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ?',
          )
          .bind(slug)
          .first()
      )?.n,
      1,
    );
  });
});

// "Nieuw": added less than a month before `now`, not opened by this member, not added by them.
const now = new Date('2026-03-15T12:00:00Z');
const newFor = async (db: D1Database, email: string, slug: string, at = now) =>
  (await listRecipes(db, email, at)).find((r) => r.slug === slug)?.isNew;
const addedAt = (db: D1Database, slug: string, createdAt: string) =>
  db.prepare('UPDATE recipes SET created_at = ? WHERE slug = ?').bind(createdAt, slug).run();
const open = (db: D1Database, email: string, slug: string) =>
  db
    .prepare('INSERT INTO recipe_views (user_id, recipe_id) SELECT u.id, r.id FROM users u, recipes r WHERE u.email = ? AND r.slug = ?')
    .bind(email, slug)
    .run();

describe('recipe-new-marker › Recent recipe never opened', () => {
  const recent = async (db: D1Database, createdAt: string) => {
    const slug = await createRecipe(db, { title: 'Vorige week', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(db, slug, createdAt);
    return slug;
  };

  test('a recipe from last week is new', async ({ db }) => {
    assert.equal(await newFor(db, 'kind@example.com', await recent(db, '2026-03-08T12:00:00Z')), true);
  });

  test('a recipe just inside the month is new', async ({ db }) => {
    assert.equal(await newFor(db, 'kind@example.com', await recent(db, '2026-02-15T12:00:01Z')), true);
  });

  test('a recipe just outside the month is not new', async ({ db }) => {
    assert.equal(await newFor(db, 'kind@example.com', await recent(db, '2026-02-15T12:00:00Z')), false);
  });
});

describe('recipe-new-marker › Marker is per member', () => {
  let slug: string;
  test.beforeEach(async ({ db }) => {
    await addUser(db, 'een@example.com', 'Een');
    await addUser(db, 'twee@example.com', 'Twee');
    slug = await createRecipe(db, { title: 'Per lid', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(db, slug, '2026-03-08T12:00:00Z');
    await open(db, 'een@example.com', slug);
  });

  test('the member who opened it no longer sees it as new', async ({ db }) => {
    assert.equal(await newFor(db, 'een@example.com', slug), false);
  });

  test('the email is matched in any letter case', async ({ db }) => {
    assert.equal(await newFor(db, 'EEN@example.com', slug), false);
  });

  test('another member still sees it as new', async ({ db }) => {
    assert.equal(await newFor(db, 'twee@example.com', slug), true);
  });
});

describe('recipe-new-marker › Recipe older than a month', () => {
  test('is not new', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Oud', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(db, slug, '2026-02-01T12:00:00Z');
    assert.equal(await newFor(db, 'kind@example.com', slug), false);
  });
});

describe('recipe-new-marker › Viewing your own recent recipe', () => {
  let slug: string;
  test.beforeEach(async ({ db }) => {
    slug = await createRecipe(db, { title: 'Eigen', author: 'Oma', createdBy: 'Mama@Example.com' });
    await addedAt(db, slug, '2026-03-14T12:00:00Z');
  });

  test('is not new to its creator', async ({ db }) => {
    assert.equal(await newFor(db, 'mama@example.com', slug), false);
  });

  test('is new to another member', async ({ db }) => {
    assert.equal(await newFor(db, 'kind@example.com', slug), true);
  });
});

describe('listRecipes new marker', () => {
  test('a recipe without a creator can be new to everyone', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Zonder maker', author: 'Oma' });
    await addedAt(db, slug, '2026-03-14T12:00:00Z');
    assert.equal(await newFor(db, 'kind@example.com', slug), true);
  });
});

describe('deleteRecipe', () => {
  describe('removes the recipe with its ingredients, steps and views, and returns its image', () => {
    let slug: string;
    let id: number;
    let stepId: number;
    let deleted: unknown;
    const chips = (db: D1Database) =>
      db.prepare('SELECT COUNT(*) AS n FROM step_ingredient_chips WHERE step_id = ?').bind(stepId).first<{ n: number }>();

    test.beforeEach(async ({ db }) => {
      await addUser(db, 'wis@example.com', 'Wis');
      slug = await createRecipe(db, {
        title: 'Weg ermee',
        author: 'Oma',
        image: '/foto/x.jpg',
        ingredients: [{ name: 'bloem' }],
        steps: [{ body: 'Bak 30 minuten.', ingredients: [{ quantityText: '1', name: 'bloem' }], timer: { minutes: 30 } }],
      });
      await db
        .prepare('INSERT INTO recipe_views (user_id, recipe_id) SELECT u.id, r.id FROM users u, recipes r WHERE u.email = ? AND r.slug = ?')
        .bind('wis@example.com', slug)
        .run();
      stepId = (await db
        .prepare('SELECT s.id FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ?')
        .bind(slug)
        .first<{ id: number }>())!.id;
      // The step has a chip before the delete.
      assert.equal((await chips(db))!.n, 1);
      id = (await db.prepare('SELECT id FROM recipes WHERE slug = ?').bind(slug).first<{ id: number }>())!.id;
      deleted = await deleteRecipe(db, slug);
    });

    test('returns its image', () => {
      assert.deepEqual(deleted, { image: '/foto/x.jpg' });
    });

    test('the recipe is gone', async ({ db }) => {
      assert.equal(await getRecipe(db, slug), undefined);
    });

    test('the chips of its steps are gone', async ({ db }) => {
      assert.equal((await chips(db))!.n, 0);
    });

    for (const table of ['ingredients', 'steps', 'recipe_views'])
      test(`its ${table} are gone`, async ({ db }) => {
        assert.equal((await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE recipe_id = ?`).bind(id).first<{ n: number }>())!.n, 0);
      });

    test('deleting again returns undefined', async ({ db }) => {
      assert.equal(await deleteRecipe(db, slug), undefined);
    });
  });
});

const addUser = (d: D1Database, email: string, callingName: string) =>
  d.prepare('INSERT OR IGNORE INTO users (email, calling_name) VALUES (?, ?)').bind(email, callingName).run();

const memberSetup = async (db: D1Database) => {
  await addUser(db, 'oma@example.com', 'Oma');
  await addUser(db, 'papa@example.com', 'Papa');
  return createRecipe(db, { title: 'Persoonlijk', author: 'Oma' });
};

describe('recipe-like › Liking a recipe', () => {
  test('the like is stored', async ({ db }) => {
    const slug = await memberSetup(db);
    assert.equal(await setLike(db, 'oma@example.com', slug, true), true);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, true);
  });

  // Idempotent: a repeat keeps the like.
  test('a repeat keeps the like', async ({ db }) => {
    const slug = await memberSetup(db);
    await setLike(db, 'oma@example.com', slug, true);
    await setLike(db, 'oma@example.com', slug, true);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, true);
  });
});

describe('recipe-like › Unliking a recipe', () => {
  test('the like is removed', async ({ db }) => {
    const slug = await memberSetup(db);
    await setLike(db, 'oma@example.com', slug, true);
    await setLike(db, 'oma@example.com', slug, false);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, false);
  });
});

describe("recipe-like › Another member's like", () => {
  test('is not shown to this member', async ({ db }) => {
    const slug = await memberSetup(db);
    await setLike(db, 'oma@example.com', slug, true);
    assert.equal((await getMemberRecipeData(db, 'papa@example.com', slug)).liked, false);
  });
});

describe("recipe-note › Another member's note", () => {
  test('is not shown to this member', async ({ db }) => {
    const slug = await memberSetup(db);
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    assert.deepEqual(await getMemberRecipeData(db, 'papa@example.com', slug), { liked: false, note: '' });
  });
});

describe('recipe-note › Changed note is stored', () => {
  // Stored as typed, trailing whitespace included.
  test('the note is stored as typed', async ({ db }) => {
    const slug = await memberSetup(db);
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    await setNote(db, 'oma@example.com', slug, 'minder zout,  10 minuten langer \n');
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).note, 'minder zout,  10 minuten langer \n');
  });
});

describe('recipe-note › Emptied note is removed', () => {
  let slug: string;
  let result: boolean;
  test.beforeEach(async ({ db }) => {
    slug = await memberSetup(db);
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    result = await setNote(db, 'oma@example.com', slug, ' \n ');
  });

  test('the save succeeds', () => {
    assert.equal(result, true);
  });

  test('the note is empty', async ({ db }) => {
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).note, '');
  });

  test('the note row is gone', async ({ db }) => {
    const rows = await db
      .prepare('SELECT COUNT(*) AS n FROM recipe_notes n JOIN recipes r ON r.id = n.recipe_id WHERE r.slug = ?')
      .bind(slug)
      .first<{ n: number }>();
    assert.equal(rows!.n, 0);
  });
});

describe('a like or note for an unknown recipe or member is refused', () => {
  test('a like for an unknown recipe', async ({ db }) => {
    await memberSetup(db);
    assert.equal(await setLike(db, 'oma@example.com', 'nope', true), false);
  });

  test('a like for an unknown member', async ({ db }) => {
    const slug = await memberSetup(db);
    assert.equal(await setLike(db, 'niemand@example.com', slug, true), false);
  });

  test('a note for an unknown recipe', async ({ db }) => {
    await memberSetup(db);
    assert.equal(await setNote(db, 'oma@example.com', 'nope', 'x'), false);
  });

  test('a note for an unknown member', async ({ db }) => {
    const slug = await memberSetup(db);
    assert.equal(await setNote(db, 'niemand@example.com', slug, 'x'), false);
  });

  test('an empty note for an unknown member', async ({ db }) => {
    const slug = await memberSetup(db);
    assert.equal(await setNote(db, 'niemand@example.com', slug, ' '), false);
  });

  test('an unknown member has no member data', async ({ db }) => {
    const slug = await memberSetup(db);
    assert.deepEqual(await getMemberRecipeData(db, 'niemand@example.com', slug), { liked: false, note: '' });
  });
});

describe('getRecipe › amounts in a step', () => {
  const quantities = [
    { startIndex: 21, endIndex: 22, quantityValue: 2, quantityUnit: null },
    { startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' },
  ];

  test('are returned in text order', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Volgorde', author: 'Oma', steps: [{ body: 'Meng 200 g bloem met 2 eieren', quantities }] });
    assert.deepEqual((await getRecipe(db, slug))?.steps[0]?.quantities, [quantities[1], quantities[0]]);
  });

  test('stay with their own step', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Twee stappen',
      author: 'Oma',
      steps: [{ body: 'Meng 200 g bloem', quantities: [quantities[1]] }, { body: 'rust' }],
    });
    assert.deepEqual(
      (await getRecipe(db, slug))?.steps.map((s) => s.quantities?.length),
      [1, 0],
    );
  });
});

describe('recipe-storage › Saving again replaces the amounts', () => {
  test('the step keeps only the amounts of its new text', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Opnieuw',
      author: 'Oma',
      steps: [{ body: 'Meng 200 g bloem', quantities: [{ startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' }] }],
    });
    const next = { startIndex: 5, endIndex: 6, quantityValue: 3, quantityUnit: 'el' };
    await updateRecipe(db, slug, { title: 'Opnieuw', author: 'Oma', steps: [{ body: 'Meng 3 el bloem', quantities: [next] }] });
    assert.deepEqual((await getRecipe(db, slug))?.steps[0]?.quantities, [next]);
  });

  test('a save without a step list keeps the stored amounts', async ({ db }) => {
    const slug = await createRecipe(db, {
      title: 'Blijft',
      author: 'Oma',
      steps: [{ body: 'Meng 200 g bloem', quantities: [{ startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' }] }],
    });
    await updateRecipe(db, slug, { title: 'Blijft', author: 'Oma' });
    assert.equal((await getRecipe(db, slug))?.steps[0]?.quantities?.length, 1);
  });
});

// Scenarios that add-recipe-tags removes: the main spec keeps them until the change is archived. Delete these then.
test.todo('recipe-storage › Recipe with categories');
test.todo('recipe-storage › Recipe without categories');
test.todo('recipe-storage › Category name is unique');
test.todo('recipe-storage › Category is shared');
test.todo('recipe-storage › Category linked twice is refused');
test.todo('recipe-storage › Link needs a recipe and a category');
test.todo('recipe-storage › Recipe with categories deleted');
test.todo('recipe-storage › Listing returns categories in order');
