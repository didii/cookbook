import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { listManagedTags } from '~app/shared/tagManagement.server';
import { fake } from '~testing/fake';
import { routePaths } from '~testing/routes';
import { test } from '~testing/test';
import type { Route } from './+types/TagsPageRoute';
import { action, loader } from './TagsPageRoute';

// Real loader and action against an in-memory D1.
const context = (db: D1Database) => {
  const c = new RouterContextProvider();
  c.set(envContext, fake<Env>({ DB: db }));
  return c;
};
const open = (db: D1Database) => loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/tags'), context: context(db) }));
/** The action's answer: `data()` wraps it with its status. */
const post = async (db: D1Database, fields: Record<string, string | string[]>) => {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) body.append(key, v);
  const answer = (await action(
    fake<Route.ActionArgs>({ request: new Request('http://localhost/tags', { method: 'POST', body }), context: context(db) }),
  )) as unknown as { data: Record<string, unknown>; init: { status?: number } | null };
  return { ...answer.data, status: answer.init?.status ?? 200 };
};
const seed = (db: D1Database) =>
  db.batch([
    db.prepare("INSERT INTO categories (name) VALUES ('Gerecht')"),
    db.prepare("INSERT INTO tags (name, category_id) VALUES ('Soep', (SELECT id FROM categories WHERE name = 'Gerecht'))"),
    db.prepare("INSERT INTO tags (name) VALUES ('Soepen')"),
  ]);

describe('tag-management › A member opens the page', () => {
  test('the route is registered', () => {
    assert.ok(routePaths.includes('tags'));
  });

  test('the loader gives every tag with category and uses, and the categories', async ({ db }) => {
    await seed(db);
    const { tags, categories } = await open(db);
    assert.deepEqual(
      tags.sort((a, b) => a.name.localeCompare(b.name)),
      [
        { name: 'Soep', category: 'Gerecht', uses: 0 },
        { name: 'Soepen', category: null, uses: 0 },
      ],
    );
    assert.deepEqual(categories, ['Gerecht']);
  });
});

describe('tag-management › A taken name is refused', () => {
  test('adding "soep" answers 400 with a message and the taken tag, and adds nothing', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'add', name: 'soep' });
    assert.equal(answer.status, 400);
    assert.equal(answer.code, 'taken');
    assert.equal(answer.taken, 'Soep');
    assert.ok(answer.error);
    assert.equal((await listManagedTags(db)).length, 2);
  });

  test('saving "Soepen" as "soep" answers 400 and keeps the tag as it is', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'save', current: 'Soepen', name: 'soep', category: 'Seizoen' });
    assert.equal(answer.status, 400);
    assert.equal(answer.taken, 'Soep');
    assert.deepEqual(
      (await listManagedTags(db)).map((t) => t.category),
      ['Gerecht', null],
    );
  });
});

describe('TagsPageRoute action', () => {
  test('add stores the tag and confirms', async ({ db }) => {
    const answer = await post(db, { intent: 'add', name: ' Kerst ' });
    assert.equal(answer.status, 200);
    assert.match(String(answer.done), /Kerst/);
    assert.deepEqual(await listManagedTags(db), [{ name: 'Kerst', category: null, uses: 0 }]);
  });

  test('an empty name answers 400 with the code empty', async ({ db }) => {
    assert.equal((await post(db, { intent: 'add', name: ' ' })).code, 'empty');
  });

  test('save renames and sets the category', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'save', current: 'Soepen', name: 'Bouillon', category: 'gerecht' });
    assert.equal(answer.status, 200);
    assert.ok(answer.done);
    assert.deepEqual(
      (await listManagedTags(db)).map((t) => [t.name, t.category]).sort(),
      [
        ['Bouillon', 'Gerecht'],
        ['Soep', 'Gerecht'],
      ],
    );
  });

  test('merge removes the first tag', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'merge', from: 'Soepen', into: 'Soep' });
    assert.equal(answer.status, 200);
    assert.deepEqual(
      (await listManagedTags(db)).map((t) => t.name),
      ['Soep'],
    );
  });

  test('merging an unknown tag answers 400 notFound', async ({ db }) => {
    await seed(db);
    assert.equal((await post(db, { intent: 'merge', from: 'Nope', into: 'Soep' })).code, 'notFound');
  });

  test('delete removes the tag', async ({ db }) => {
    await seed(db);
    assert.equal((await post(db, { intent: 'delete', name: 'Soepen' })).status, 200);
    assert.equal((await listManagedTags(db)).length, 1);
  });

  test('bulk sets the category on every named tag and counts them', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'bulk', name: ['Soep', 'Soepen'], category: 'Dieet' });
    assert.equal(answer.status, 200);
    assert.match(String(answer.done), /2 tags/);
    assert.deepEqual(
      (await listManagedTags(db)).map((t) => t.category),
      ['Dieet', 'Dieet'],
    );
  });

  test('an unknown intent is refused', async ({ db }) => {
    await assert.rejects(post(db, { intent: 'nope' }));
  });
});
