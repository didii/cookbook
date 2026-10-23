import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import {
  createRecipe,
  deleteRecipe,
  getMemberRecipeData,
  getRecipe,
  listAuthors,
  listRecipes,
  setLike,
  setNote,
  slugify,
  updateRecipe,
  type StepInput,
} from './recipes.server';
import { seals } from './seals';
import { createUser } from './users.server';

/** Steps with only a text, as they are stored and as they come back. */
const plain = (...bodies: string[]): StepInput[] => bodies.map((body) => ({ body }));
const loaded = (...bodies: string[]) => bodies.map((body) => ({ body, ingredients: [] }));

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

/** Runs the test body against a database of its own. */
const withFreshDb = async (run: (fresh: D1Database) => Promise<void>) => {
  const fresh = await createTestDb();
  try {
    await run(fresh.db);
  } finally {
    await fresh.dispose();
  }
};

describe('getRecipe', () => {
  test('returns undefined for an unknown slug', async () => {
    assert.equal(await getRecipe(db, 'nope'), undefined);
  });

  describe('returns ingredients and steps in position order, and leaves optional fields null', () => {
    const ordering = () => getRecipe(db, 'ordering');

    test('the author is read', async () => {
      assert.equal((await ordering())?.author, 'Oma');
    });

    test('a missing time is null', async () => {
      assert.equal((await ordering())?.time, null);
    });

    test('a missing image is null', async () => {
      assert.equal((await ordering())?.image, null);
    });

    test('the ingredients are in position order', async () => {
      assert.deepEqual((await ordering())?.ingredients, [
        { quantityText: '1', name: 'ei' },
        { quantityText: '', name: 'zout' },
      ]);
    });

    test('the steps are in position order', async () => {
      assert.deepEqual(defined((await ordering())?.steps), loaded('een', 'twee'));
    });
  });

  test('maps every recipe column', async () => {
    const r = await getRecipe(db, 'full');
    assert.deepEqual(defined({ ...r, id: 0, updated_at: '' }), {
      id: 0,
      updated_at: '',
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
    });
  });

  test('returns when the recipe was last saved', async () => {
    assert.match((await getRecipe(db, 'full'))?.updated_at ?? '', /^\d{4}-\d\d-\d\dT/);
  });
});

describe('recipe-viewing › Order is kept', () => {
  test('the steps are in position order', async () => {
    assert.deepEqual(defined((await getRecipe(db, 'ordering'))?.steps), loaded('een', 'twee'));
  });
});

describe('recipe-viewing › Existing recipe', () => {
  test('the recipe is found by its slug', async () => {
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

  test('createRecipe returns the slug of the title', async () => {
    assert.equal(await createRecipe(db, { title: 'Kip met Rijst!', author: 'Oma', servings: 4 }), 'kip-met-rijst');
  });
});

describe('recipe-creation › Same title twice', () => {
  let slugs: string[];
  before(async () => {
    slugs = [
      await createRecipe(db, { title: 'Dubbel', author: 'Oma', servings: 2 }),
      await createRecipe(db, { title: 'Dubbel', author: 'Papa', servings: 3 }),
      await createRecipe(db, { title: 'Dubbel', author: 'Opa', servings: 4 }),
    ];
  });

  test('the slugs get a number', () => {
    assert.deepEqual(slugs, ['dubbel', 'dubbel-2', 'dubbel-3']);
  });

  test('the first recipe is kept', async () => {
    assert.equal((await getRecipe(db, 'dubbel'))?.author, 'Oma');
  });
});

describe('recipe-creation › Title that clashes with the form address', () => {
  test('the slug gets a number', async () => {
    assert.equal(await createRecipe(db, { title: 'Nieuw', author: 'Oma', servings: 2 }), 'nieuw-2');
  });
});

describe('createRecipe', () => {
  describe('stores every property, ingredient and step so getRecipe reads them back', () => {
    let slug: string;
    before(async () => {
      slug = await createRecipe(db, {
        title: 'Alles',
        author: 'Tante An',
        servings: 6,
        time: '1u',
        intro: 'Intro',
        image: '/alles.jpg',
        seal: 'fu',
        createdBy: 'iemand@example.com',
        ingredients: [{ name: 'bloem', quantityText: '250 g', amount: 250, unit: 'g' }, { name: 'zout' }],
        steps: plain('mengen', 'bakken'),
      });
    });

    test('getRecipe reads back every property', async () => {
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
          { quantityText: '250 g', name: 'bloem' },
          { quantityText: '', name: 'zout' },
        ],
        steps: loaded('mengen', 'bakken'),
      });
    });

    test('the creator and the parsed amount and unit are stored', async () => {
      const row = await db
        .prepare(
          "SELECT r.created_by, i.amount, i.unit FROM recipes r JOIN ingredients i ON i.recipe_id = r.id WHERE r.slug = 'alles' AND i.position = 0",
        )
        .first();
      assert.deepEqual(row, { created_by: 'iemand@example.com', amount: 250, unit: 'g' });
    });
  });
});

describe('recipe-creation › Existing authors are suggested', () => {
  test('lists each author once, spelled as first used', () =>
    withFreshDb(async (fresh) => {
      await createRecipe(fresh, { title: 'A', author: 'Papa', servings: 1 });
      await createRecipe(fresh, { title: 'B', author: 'Oma', servings: 1 });
      await fresh.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('c', 'C', 'OMA', 1)").run();
      assert.deepEqual(await listAuthors(fresh), ['Oma', 'Papa']);
    }));
});

describe('listRecipes', () => {
  test('lists nothing without recipes', () =>
    withFreshDb(async (fresh) => {
      assert.deepEqual(await listRecipes(fresh, 'x@example.com', new Date()), []);
    }));

  test('lists every recipe with its card fields, the most recently added first', () =>
    withFreshDb(async (fresh) => {
      await createRecipe(fresh, { title: 'Eerst', author: 'Oma', time: '30 min', image: '/a.jpg', seal: 'fu' });
      await createRecipe(fresh, { title: 'Daarna', author: 'Papa', seal: 'fu' });
      assert.deepEqual(await listRecipes(fresh, 'x@example.com', new Date()), [
        { slug: 'daarna', title: 'Daarna', author: 'Papa', time: null, image: null, seal: 'fu', isNew: true },
        { slug: 'eerst', title: 'Eerst', author: 'Oma', time: '30 min', image: '/a.jpg', seal: 'fu', isNew: true },
      ]);
    }));
});

describe('recipe-creation › New author is accepted', () => {
  test('the author is stored as typed', async () => {
    const slug = await createRecipe(db, { title: 'Nieuwe auteur', author: 'tante Mieke', servings: 2 });
    assert.equal((await getRecipe(db, slug))?.author, 'tante Mieke');
  });
});

describe('recipe-creation › Existing spelling is reused', () => {
  test('the author gets the existing spelling', async () => {
    await createRecipe(db, { title: 'Eerste', author: 'Opa Jos', servings: 2 });
    const slug = await createRecipe(db, { title: 'Tweede', author: 'opa jos', servings: 2 });
    assert.equal((await getRecipe(db, slug))?.author, 'Opa Jos');
  });
});

describe('recipe-creation › Seal is assigned', () => {
  test('the recipe gets one of the seals', async () => {
    const slug = await createRecipe(db, { title: 'Met zegel', author: 'Oma' });
    assert.ok(seals.includes((await getRecipe(db, slug))?.seal ?? ''));
  });
});

describe('recipe-creation › Least used seals are chosen', () => {
  test('every new recipe gets a least used seal', () =>
    withFreshDb(async (fresh) => {
      const left = ['fu', 'jia'];
      await fresh.batch(
        seals
          .filter((s) => !left.includes(s))
          .map((s) => fresh.prepare('INSERT INTO recipes (slug, title, author, seal) VALUES (?, ?, ?, ?)').bind(s, s, 'Oma', s)),
      );
      for (let i = 0; i < 5; i++) {
        const slug = await createRecipe(fresh, { title: `Nieuw ${i}`, author: 'Oma' });
        const seal = (await getRecipe(fresh, slug))?.seal ?? '';
        assert.ok(left.includes(seal), seal);
        // It is now used once like the others, so the next one is one of the remaining unused seals.
        left.splice(left.indexOf(seal), 1);
        if (!left.length) left.push(...seals);
      }
    }));
});

describe('recipe-creation › Provided seal is used', () => {
  test('the recipe gets the provided seal', async () => {
    const slug = await createRecipe(db, { title: 'Eigen zegel', author: 'Oma', seal: 'fu' });
    assert.equal((await getRecipe(db, slug))?.seal, 'fu');
  });
});

const original = { title: 'Origineel', author: 'Papa', servings: 4, time: '1u', intro: 'oud', image: '/oud.jpg', seal: 'fu' };

describe('recipe-editing › Recipe is updated', () => {
  let slug: string;
  let saved: unknown;
  before(async () => {
    slug = await createRecipe(db, { ...original, ingredients: [{ name: 'ei' }], steps: plain('kook') });
    await db.prepare("UPDATE recipes SET updated_at = '2000-01-01T00:00:00Z' WHERE slug = ?").bind(slug).run();
    saved = await updateRecipe(db, slug, { title: 'Nieuw', author: 'Mama', servings: 6, time: '2u', intro: 'nieuw', image: '/nieuw.jpg' });
  });

  test('the update succeeds', () => {
    assert.ok(saved);
  });

  test('the properties change and the slug stays', async () => {
    const r = await getRecipe(db, slug);
    assert.deepEqual(
      [r?.slug, r?.title, r?.author, r?.servings, r?.time, r?.intro, r?.image],
      [slug, 'Nieuw', 'Mama', 6, '2u', 'nieuw', '/nieuw.jpg'],
    );
  });

  test('the ingredients and steps stay', async () => {
    const r = await getRecipe(db, slug);
    assert.deepEqual([r?.ingredients.length, defined(r?.steps)], [1, loaded('kook')]);
  });

  test('the last saved time changes', async () => {
    assert.notEqual((await db.prepare('SELECT updated_at FROM recipes WHERE slug = ?').bind(slug).first())?.updated_at, '2000-01-01T00:00:00Z');
  });
});

describe('recipe-editing › Seal kept', () => {
  test('the seal stays', async () => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Zelfde zegel', author: 'Papa' });
    assert.equal((await getRecipe(db, slug))?.seal, 'fu');
  });
});

describe('recipe-editing › Seal provided', () => {
  test('the seal changes', async () => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Ander zegel', author: 'Papa', seal: 'jia' });
    assert.equal((await getRecipe(db, slug))?.seal, 'jia');
  });
});

describe('recipe-editing › Optional field emptied', () => {
  test('servings, time and image are null and the intro is empty', async () => {
    const slug = await createRecipe(db, original);
    await updateRecipe(db, slug, { title: 'Leeg', author: 'Papa' });
    const r = await getRecipe(db, slug);
    assert.deepEqual([r?.servings, r?.time, r?.intro, r?.image], [null, null, '', null]);
  });
});

describe('recipe-editing › Edited author reuses spelling', () => {
  test('the author gets the existing spelling', async () => {
    await createRecipe(db, { title: 'Van Tante', author: 'Tante Rita' });
    const slug = await createRecipe(db, { title: 'Aan te passen', author: 'Papa' });
    await updateRecipe(db, slug, { title: 'Aan te passen', author: 'tante rita' });
    assert.equal((await getRecipe(db, slug))?.author, 'Tante Rita');
  });
});

describe('recipe-editing › Own author can be respelled', () => {
  test('the author gets the new spelling', () =>
    withFreshDb(async (fresh) => {
      const slug = await createRecipe(fresh, { title: 'Enige', author: 'Oma' });
      await updateRecipe(fresh, slug, { title: 'Enige', author: 'oma' });
      assert.equal((await getRecipe(fresh, slug))?.author, 'oma');
    }));
});

describe('updateRecipe', () => {
  test('reports an unknown slug', async () => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y' }), undefined);
  });

  describe('returns the image the recipe had', () => {
    test('the first image when it is replaced', async () => {
      const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: '/foto/oud.jpg' });
      assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma', image: '/foto/nieuw.jpg' }), {
        previousImage: '/foto/oud.jpg',
      });
    });

    test('the replacing image when it is removed', async () => {
      const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: '/foto/oud.jpg' });
      await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma', image: '/foto/nieuw.jpg' });
      assert.deepEqual(await updateRecipe(db, slug, { title: 'Met foto', author: 'Oma' }), { previousImage: '/foto/nieuw.jpg' });
    });
  });
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

describe('recipe-ingredient-editing › Ingredients are stored in order', () => {
  test('each ingredient gets its position and parsed values', async () => {
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
});

describe('recipe-ingredient-editing › Saved list replaces the old one', () => {
  const base = { title: 'Vervangen', author: 'Oma' };
  const create = () => createRecipe(db, { ...base, ingredients: [{ name: 'ei' }, { name: 'melk' }] });

  test('the new list is stored', async () => {
    const slug = await create();
    await updateRecipe(db, slug, { ...base, ingredients: [{ name: 'melk' }, { name: 'boter', quantityText: '50 g', amount: 50, unit: 'g' }] });
    assert.deepEqual(
      (await storedIngredients(slug)).map((i) => [i.position, i.name, i.unit]),
      [
        [0, 'melk', null],
        [1, 'boter', 'g'],
      ],
    );
  });

  test('omitting the argument leaves ingredients untouched', async () => {
    const slug = await create();
    await updateRecipe(db, slug, base);
    assert.equal((await storedIngredients(slug)).length, 2);
  });

  test('an empty list removes them all', async () => {
    const slug = await create();
    await updateRecipe(db, slug, { ...base, ingredients: [] });
    assert.equal((await storedIngredients(slug)).length, 0);
  });
});

describe('updateRecipe with ingredients', () => {
  test('replacing ingredients of an unknown recipe stores nothing', async () => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', ingredients: [{ name: 'ei' }] }), undefined);
  });
});

const storedSteps = async (slug: string) =>
  (
    await db
      .prepare('SELECT s.position, s.body FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position')
      .bind(slug)
      .all()
  ).results;

describe('recipe-step-editing › Steps are stored in order', () => {
  test('each step gets its position', async () => {
    const slug = await createRecipe(db, { title: 'Stappen', author: 'Oma', steps: plain('kneed', 'rijs', 'bak') });
    assert.deepEqual(await storedSteps(slug), [
      { position: 0, body: 'kneed' },
      { position: 1, body: 'rijs' },
      { position: 2, body: 'bak' },
    ]);
  });

  test('a changed order is stored', async () => {
    const slug = await createRecipe(db, { title: 'Stappen', author: 'Oma', steps: plain('kneed', 'rijs', 'bak') });
    await updateRecipe(db, slug, { title: 'Stappen', author: 'Oma', steps: plain('bak', 'kneed') });
    assert.deepEqual(
      (await storedSteps(slug)).map((s) => s.body),
      ['bak', 'kneed'],
    );
  });
});

describe('recipe-step-editing › Saved steps replace the old ones', () => {
  const base = { title: 'Stappen vervangen', author: 'Oma' };
  const create = () => createRecipe(db, { ...base, steps: plain('a', 'b', 'c') });

  test('one removed, one changed, one added', async () => {
    const slug = await create();
    await updateRecipe(db, slug, { ...base, steps: plain('a', 'c aangepast', 'd') });
    assert.deepEqual(await storedSteps(slug), [
      { position: 0, body: 'a' },
      { position: 1, body: 'c aangepast' },
      { position: 2, body: 'd' },
    ]);
  });

  test('omitting the argument leaves steps untouched', async () => {
    const slug = await create();
    await updateRecipe(db, slug, base);
    assert.equal((await storedSteps(slug)).length, 3);
  });

  test('an empty list removes them all', async () => {
    const slug = await create();
    await updateRecipe(db, slug, { ...base, steps: [] });
    assert.equal((await storedSteps(slug)).length, 0);
  });
});

describe('updateRecipe with steps', () => {
  test('replacing steps of an unknown recipe stores nothing', async () => {
    assert.equal(await updateRecipe(db, 'bestaat-niet', { title: 'X', author: 'Y', steps: plain('orphan') }), undefined);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM steps WHERE body = ?').bind('orphan').first())?.n, 0);
  });
});

const withChips: StepInput[] = [
  {
    body: 'Kneed bloem en boter. Laat 30 minuten rusten.',
    ingredients: [
      { quantityText: '250 g', name: 'bloem' },
      { quantityText: '', name: 'boter' },
    ],
    timer: { minutes: 30, label: 'Deeg rust' },
  },
  { body: 'Bak op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 50 } },
  { body: 'Eet smakelijk.', ingredients: [] },
];

describe('recipe-step-chips › Chips are stored with their step', () => {
  const fewer: StepInput[] = [{ body: 'Kneed.', ingredients: [{ quantityText: '1', name: 'ei' }] }];
  const saveFewer = async () => {
    const slug = await createRecipe(db, { title: 'Met chips', author: 'Oma', steps: withChips });
    await updateRecipe(db, slug, { title: 'Met chips', author: 'Oma', steps: fewer });
    return slug;
  };

  test('the chips come back with their step', async () => {
    const slug = await createRecipe(db, { title: 'Met chips', author: 'Oma', steps: withChips });
    assert.deepEqual(defined((await getRecipe(db, slug))?.steps), withChips);
  });

  // Saving again replaces the chips of the old steps instead of adding to them.
  test('saving again replaces the steps with their chips', async () => {
    const slug = await saveFewer();
    assert.deepEqual(defined((await getRecipe(db, slug))?.steps), fewer);
  });

  test('saving again leaves only the new chips stored', async () => {
    const slug = await saveFewer();
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
const newFor = async (email: string, slug: string, at = now) => (await listRecipes(db, email, at)).find((r) => r.slug === slug)?.isNew;
const addedAt = (slug: string, createdAt: string) => db.prepare('UPDATE recipes SET created_at = ? WHERE slug = ?').bind(createdAt, slug).run();
const open = (email: string, slug: string) =>
  db
    .prepare('INSERT INTO recipe_views (user_id, recipe_id) SELECT u.id, r.id FROM users u, recipes r WHERE u.email = ? AND r.slug = ?')
    .bind(email, slug)
    .run();

describe('recipe-new-marker › Recent recipe never opened', () => {
  const recent = async (createdAt: string) => {
    const slug = await createRecipe(db, { title: 'Vorige week', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(slug, createdAt);
    return slug;
  };

  test('a recipe from last week is new', async () => {
    assert.equal(await newFor('kind@example.com', await recent('2026-03-08T12:00:00Z')), true);
  });

  test('a recipe just inside the month is new', async () => {
    assert.equal(await newFor('kind@example.com', await recent('2026-02-15T12:00:01Z')), true);
  });

  test('a recipe just outside the month is not new', async () => {
    assert.equal(await newFor('kind@example.com', await recent('2026-02-15T12:00:00Z')), false);
  });
});

describe('recipe-new-marker › Marker is per member', () => {
  let slug: string;
  before(async () => {
    await createUser(db, 'een@example.com', 'Een');
    await createUser(db, 'twee@example.com', 'Twee');
    slug = await createRecipe(db, { title: 'Per lid', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(slug, '2026-03-08T12:00:00Z');
    await open('een@example.com', slug);
  });

  test('the member who opened it no longer sees it as new', async () => {
    assert.equal(await newFor('een@example.com', slug), false);
  });

  test('the email is matched in any letter case', async () => {
    assert.equal(await newFor('EEN@example.com', slug), false);
  });

  test('another member still sees it as new', async () => {
    assert.equal(await newFor('twee@example.com', slug), true);
  });
});

describe('recipe-new-marker › Recipe older than a month', () => {
  test('is not new', async () => {
    const slug = await createRecipe(db, { title: 'Oud', author: 'Oma', createdBy: 'oma@example.com' });
    await addedAt(slug, '2026-02-01T12:00:00Z');
    assert.equal(await newFor('kind@example.com', slug), false);
  });
});

describe('recipe-new-marker › Viewing your own recent recipe', () => {
  let slug: string;
  before(async () => {
    slug = await createRecipe(db, { title: 'Eigen', author: 'Oma', createdBy: 'Mama@Example.com' });
    await addedAt(slug, '2026-03-14T12:00:00Z');
  });

  test('is not new to its creator', async () => {
    assert.equal(await newFor('mama@example.com', slug), false);
  });

  test('is new to another member', async () => {
    assert.equal(await newFor('kind@example.com', slug), true);
  });
});

describe('listRecipes new marker', () => {
  test('a recipe without a creator can be new to everyone', async () => {
    const slug = await createRecipe(db, { title: 'Zonder maker', author: 'Oma' });
    await addedAt(slug, '2026-03-14T12:00:00Z');
    assert.equal(await newFor('kind@example.com', slug), true);
  });
});

describe('deleteRecipe', () => {
  describe('removes the recipe with its ingredients, steps and views, and returns its image', () => {
    let slug: string;
    let id: number;
    let stepId: number;
    let deleted: unknown;
    const chips = () => db.prepare('SELECT COUNT(*) AS n FROM step_ingredient_chips WHERE step_id = ?').bind(stepId).first<{ n: number }>();

    before(async () => {
      await createUser(db, 'wis@example.com', 'Wis');
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
      assert.equal((await chips())!.n, 1);
      id = (await db.prepare('SELECT id FROM recipes WHERE slug = ?').bind(slug).first<{ id: number }>())!.id;
      deleted = await deleteRecipe(db, slug);
    });

    test('returns its image', () => {
      assert.deepEqual(deleted, { image: '/foto/x.jpg' });
    });

    test('the recipe is gone', async () => {
      assert.equal(await getRecipe(db, slug), undefined);
    });

    test('the chips of its steps are gone', async () => {
      assert.equal((await chips())!.n, 0);
    });

    for (const table of ['ingredients', 'steps', 'recipe_views'])
      test(`its ${table} are gone`, async () => {
        assert.equal((await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE recipe_id = ?`).bind(id).first<{ n: number }>())!.n, 0);
      });

    test('deleting again returns undefined', async () => {
      assert.equal(await deleteRecipe(db, slug), undefined);
    });
  });
});

const memberSetup = async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  await createUser(db, 'papa@example.com', 'Papa');
  return createRecipe(db, { title: 'Persoonlijk', author: 'Oma' });
};

describe('recipe-like › Liking a recipe', () => {
  test('the like is stored', async () => {
    const slug = await memberSetup();
    assert.equal(await setLike(db, 'oma@example.com', slug, true), true);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, true);
  });

  // Idempotent: a repeat keeps the like.
  test('a repeat keeps the like', async () => {
    const slug = await memberSetup();
    await setLike(db, 'oma@example.com', slug, true);
    await setLike(db, 'oma@example.com', slug, true);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, true);
  });
});

describe('recipe-like › Unliking a recipe', () => {
  test('the like is removed', async () => {
    const slug = await memberSetup();
    await setLike(db, 'oma@example.com', slug, true);
    await setLike(db, 'oma@example.com', slug, false);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, false);
  });
});

describe("recipe-like › Another member's like", () => {
  test('is not shown to this member', async () => {
    const slug = await memberSetup();
    await setLike(db, 'oma@example.com', slug, true);
    assert.equal((await getMemberRecipeData(db, 'papa@example.com', slug)).liked, false);
  });
});

describe("recipe-note › Another member's note", () => {
  test('is not shown to this member', async () => {
    const slug = await memberSetup();
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    assert.deepEqual(await getMemberRecipeData(db, 'papa@example.com', slug), { liked: false, note: '' });
  });
});

describe('recipe-note › Changed note is stored', () => {
  // Stored as typed, trailing whitespace included.
  test('the note is stored as typed', async () => {
    const slug = await memberSetup();
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    await setNote(db, 'oma@example.com', slug, 'minder zout,  10 minuten langer \n');
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).note, 'minder zout,  10 minuten langer \n');
  });
});

describe('recipe-note › Emptied note is removed', () => {
  let slug: string;
  let result: boolean;
  before(async () => {
    slug = await memberSetup();
    await setNote(db, 'oma@example.com', slug, 'minder zout');
    result = await setNote(db, 'oma@example.com', slug, ' \n ');
  });

  test('the save succeeds', () => {
    assert.equal(result, true);
  });

  test('the note is empty', async () => {
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).note, '');
  });

  test('the note row is gone', async () => {
    const rows = await db
      .prepare('SELECT COUNT(*) AS n FROM recipe_notes n JOIN recipes r ON r.id = n.recipe_id WHERE r.slug = ?')
      .bind(slug)
      .first<{ n: number }>();
    assert.equal(rows!.n, 0);
  });
});

describe('a like or note for an unknown recipe or member is refused', () => {
  test('a like for an unknown recipe', async () => {
    await memberSetup();
    assert.equal(await setLike(db, 'oma@example.com', 'nope', true), false);
  });

  test('a like for an unknown member', async () => {
    const slug = await memberSetup();
    assert.equal(await setLike(db, 'niemand@example.com', slug, true), false);
  });

  test('a note for an unknown recipe', async () => {
    await memberSetup();
    assert.equal(await setNote(db, 'oma@example.com', 'nope', 'x'), false);
  });

  test('a note for an unknown member', async () => {
    const slug = await memberSetup();
    assert.equal(await setNote(db, 'niemand@example.com', slug, 'x'), false);
  });

  test('an empty note for an unknown member', async () => {
    const slug = await memberSetup();
    assert.equal(await setNote(db, 'niemand@example.com', slug, ' '), false);
  });

  test('an unknown member has no member data', async () => {
    const slug = await memberSetup();
    assert.deepEqual(await getMemberRecipeData(db, 'niemand@example.com', slug), { liked: false, note: '' });
  });
});
