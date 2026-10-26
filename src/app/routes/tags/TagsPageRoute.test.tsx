import assert from 'node:assert/strict';
import { createMemoryRouter, data, RouterContextProvider, RouterProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { listManagedTags } from '~app/shared/tagManagement.server';
import type { ManagedTag } from '~app/shared/tags';
import { fireEvent, render, screen, within } from '~testing/dom';
import { fake } from '~testing/fake';
import { routePaths } from '~testing/routes';
import { test } from '~testing/test';
import type { Route } from './+types/TagsPageRoute';
import TagsPage, { action, loader } from './TagsPageRoute';

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
  return { ...answer.data, status: answer.init?.status ?? 200 } as Record<string, unknown> & { status: number };
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
    assert.deepEqual((await listManagedTags(db)).map((t) => [t.name, t.category]).sort(), [
      ['Bouillon', 'Gerecht'],
      ['Soep', 'Gerecht'],
    ]);
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

  test('merging a tag into itself answers 400 and keeps the tag', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'merge', from: 'Soep', into: 'soep' });
    assert.deepEqual([answer.status, answer.code], [400, 'same']);
    assert.equal((await listManagedTags(db)).length, 2);
  });

  test('a category that is too long answers 400 with the field "category"', async ({ db }) => {
    await seed(db);
    const answer = await post(db, { intent: 'save', current: 'Soep', name: 'Soep', category: 'a'.repeat(101) });
    assert.deepEqual([answer.status, answer.code, answer.field], [400, 'tooLong', 'category']);
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

// The page itself, for the tags the loader would give; every form posts to a stub action that answers with `done`.
const tags: ManagedTag[] = [
  { name: 'Bakken', category: 'Gerecht', uses: 2 },
  { name: 'Snel', category: null, uses: 0 },
  { name: 'Soep', category: 'Gerecht', uses: 7 },
  { name: 'Winter', category: null, uses: 1 },
];
const renderPage = (done = 'Klaar.') => {
  const props = { loaderData: { tags, categories: ['Gerecht'] } } as Route.ComponentProps;
  const sent: URLSearchParams[] = [];
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: async ({ request }) => {
            sent.push(new URLSearchParams(await request.text()));
            return data({ done });
          },
          element: <TagsPage {...props} />,
        },
      ])}
    />,
  );
  return sent;
};
const rowOf = (name: string) => screen.getAllByTestId('TagRow-row').find((r) => within(r).getByTestId('TagRow-tag').textContent === name)!;
const rowNames = () => screen.getAllByTestId('TagRow-tag').map((t) => t.textContent);
const forms = () => screen.queryAllByTestId('TagForm-form');
const checkedRows = () => screen.getAllByTestId('TagRow-row').filter((r) => r.getAttribute('aria-checked') === 'true');

describe('tag-management › A member opens the page', () => {
  test('the page "Tags" lists every tag', () => {
    renderPage();
    assert.equal(screen.getByTestId('TagsPage-title').textContent, 'Tags');
    assert.deepEqual(rowNames(), ['Bakken', 'Snel', 'Soep', 'Winter']);
  });
});

describe('tag-management › Row opens the form', () => {
  test('a form opens under the row with its name and category', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    assert.equal(screen.getByTestId<HTMLInputElement>('TagForm-name').value, 'Soep');
    assert.ok(rowOf('Soep').parentElement!.contains(screen.getByTestId('TagForm-form')));
  });

  test('the rest of the list is as it was', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    assert.deepEqual(rowNames(), ['Bakken', 'Snel', 'Soep', 'Winter']);
  });
});

describe('tag-management › Row closes the form', () => {
  test('activating the row again closes it', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(rowOf('Soep'));
    assert.equal(forms().length, 0);
  });
});

describe('tag-management › Escape closes the form', () => {
  test('the form is closed and the focus is back on its row', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    fireEvent.keyDown(screen.getByTestId('TagForm-name'), { key: 'Escape' });
    assert.equal(forms().length, 0);
    assert.equal(document.activeElement, rowOf('Soep'));
  });
});

describe('tag-management › One form at a time', () => {
  test('opening another row leaves only its form', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(rowOf('Snel'));
    assert.equal(forms().length, 1);
    assert.equal(screen.getByTestId<HTMLInputElement>('TagForm-name').value, 'Snel');
  });
});

describe('tag-management › Select mode shows checkboxes', () => {
  test('every row shows a checkbox', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.equal(screen.getAllByTestId('TagRow-check').length, tags.length);
  });

  test('the bottom bar says 0 selected', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.equal(screen.getByTestId('SelectionBar-count').textContent, '0 geselecteerd');
  });

  test('an open form is closed when select mode starts', () => {
    renderPage();
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.equal(forms().length, 0);
  });
});

describe('tag-management › Row toggles in select mode', () => {
  test('the tag is selected and no form opens', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(rowOf('Soep'));
    assert.deepEqual(
      checkedRows().map((r) => within(r).getByTestId('TagRow-tag').textContent),
      ['Soep'],
    );
    assert.equal(forms().length, 0);
  });

  test('activating it again deselects it', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(rowOf('Soep'));
    assert.equal(checkedRows().length, 0);
  });
});

describe('tag-management › Select all follows the filters', () => {
  test('exactly the listed tags are selected', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(screen.getByTestId('Filters-uncategorized'));
    fireEvent.click(screen.getByTestId('SelectionBar-all'));
    assert.equal(screen.getByTestId('SelectionBar-count').textContent, '2 geselecteerd');
    fireEvent.click(screen.getByTestId('Filters-uncategorized'));
    assert.deepEqual(
      checkedRows().map((r) => within(r).getByTestId('TagRow-tag').textContent),
      ['Snel', 'Winter'],
    );
  });

  test('"Niets" empties the selection', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(screen.getByTestId('SelectionBar-all'));
    fireEvent.click(screen.getByTestId('SelectionBar-none'));
    assert.equal(checkedRows().length, 0);
  });
});

describe('tag-management › Setting a category on the selection', () => {
  test('the selection is posted, then emptied, and the page says how many changed', async () => {
    const sent = renderPage('2 tags aangepast.');
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(rowOf('Snel'));
    fireEvent.click(rowOf('Winter'));
    fireEvent.change(screen.getByTestId('SuggestInput-field'), { target: { value: 'Gerecht' } });
    fireEvent.click(screen.getByTestId('SelectionBar-apply'));
    assert.equal((await screen.findByTestId('TagsPage-confirmation')).textContent, '2 tags aangepast.');
    assert.deepEqual(sent[0]!.getAll('name'), ['Snel', 'Winter']);
    assert.equal(checkedRows().length, 0);
  });
});

describe('tag-management › Leaving select mode clears the selection', () => {
  test('no tag is selected and no checkboxes are shown', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('Filters-select'));
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.equal(screen.queryAllByTestId('TagRow-check').length, 0);
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.equal(screen.getByTestId('SelectionBar-count').textContent, '0 geselecteerd');
  });
});

describe('TagsPage', () => {
  test('the filters narrow the list', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('Filters-search'), { target: { value: 'so' } });
    assert.deepEqual(rowNames(), ['Soep']);
    assert.equal(screen.getByTestId('Filters-count').textContent, '1 van 4 tags');
  });

  test('ordering by category adds a heading per category', () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId('Filters-order')[1]!);
    assert.deepEqual(
      screen.getAllByTestId('TagList-category').map((c) => c.textContent),
      ['Gerecht', 'Zonder categorie'],
    );
  });

  test('a saved form closes and the page shows the confirmation', async () => {
    renderPage('Opgeslagen.');
    fireEvent.click(rowOf('Soep'));
    fireEvent.click(screen.getByTestId('TagActions-save'));
    assert.equal((await screen.findByTestId('TagsPage-confirmation')).textContent, 'Opgeslagen.');
    assert.equal(forms().length, 0);
  });

  test('an added tag clears the filters so it shows', async () => {
    renderPage('Tag “Kerst” toegevoegd.');
    fireEvent.change(screen.getByTestId('Filters-search'), { target: { value: 'so' } });
    fireEvent.change(screen.getByTestId('AddTagForm-name'), { target: { value: 'Kerst' } });
    fireEvent.click(screen.getByTestId('AddTagForm-submit'));
    await screen.findByTestId('TagsPage-confirmation');
    assert.equal(screen.getByTestId<HTMLInputElement>('Filters-search').value, '');
  });
});
