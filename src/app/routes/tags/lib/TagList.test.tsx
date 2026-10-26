import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { fireEvent, render, screen, within } from '~testing/dom';
import type { TagGroup } from './arrangeTags';
import { TagList } from './TagList';

const tag = (name: string, category: string | null = null, uses = 1): ManagedTag => ({ name, category, uses });
const byName = (...tags: ManagedTag[]): TagGroup[] => [{ category: null, tags }];

const show = (props: Partial<Parameters<typeof TagList>[0]> = {}) => {
  const calls = { open: [] as (string | null)[], toggled: [] as string[], cleared: 0 };
  const groups = props.groups ?? byName(tag('Soep', 'Gerecht'), tag('Snel'));
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: () => null,
          element: (
            <TagList
              groups={groups}
              order="name"
              total={groups.flatMap((g) => g.tags).length}
              names={groups.flatMap((g) => g.tags.map((t) => t.name))}
              categories={['Gerecht']}
              openName={null}
              onOpenChange={(name) => calls.open.push(name)}
              selecting={false}
              selection={new Set()}
              onToggle={(name) => calls.toggled.push(name)}
              onClearFilters={() => calls.cleared++}
              onDone={() => {}}
              {...props}
            />
          ),
        },
      ])}
    />,
  );
  return calls;
};
const rows = () => screen.getAllByTestId('TagRow-tag').map((r) => r.textContent);

describe('tag-management › Category order has no category pill on rows', () => {
  test('the rows under headings show no category pill', () => {
    show({ order: 'category', groups: [{ category: 'Gerecht', tags: [tag('Soep', 'Gerecht')] }] });
    assert.equal(screen.queryByTestId('TagRow-category'), null);
  });

  test('by name every row with a category shows it', () => {
    show();
    assert.equal(screen.getAllByTestId('TagRow-category').length, 1);
  });
});

describe('tag-management › Group heading shows the count', () => {
  test('the heading has the category pill and the number of tags', () => {
    show({ order: 'category', groups: [{ category: 'Gerecht', tags: [tag('Bakken', 'Gerecht'), tag('Soep', 'Gerecht')] }] });
    const heading = screen.getByTestId('TagList-heading');
    assert.equal(within(heading).getByTestId('TagList-category').textContent, 'Gerecht');
    assert.equal(within(heading).getByTestId('TagList-groupCount').textContent, '2');
  });

  test('tags without a category are under the heading "Zonder categorie"', () => {
    show({ order: 'category', groups: [{ category: null, tags: [tag('Snel')] }] });
    assert.equal(screen.getByTestId('TagList-category').textContent, 'Zonder categorie');
  });

  test('every group has its heading, before its rows', () => {
    show({
      order: 'category',
      groups: [
        { category: 'Gerecht', tags: [tag('Soep', 'Gerecht')] },
        { category: null, tags: [tag('Snel')] },
      ],
    });
    assert.deepEqual(
      screen.getAllByTestId('TagList-category').map((c) => c.textContent),
      ['Gerecht', 'Zonder categorie'],
    );
  });

  test('by name there are no headings', () => {
    show();
    assert.equal(screen.queryByTestId('TagList-heading'), null);
  });
});

describe('tag-management › No tags yet', () => {
  test('the page says there are none and where they are made', () => {
    show({ groups: [], total: 0 });
    assert.match(screen.getByTestId('TagList-none').textContent ?? '', /geen tags/);
    assert.match(screen.getByTestId('TagList-none').textContent ?? '', /receptbewerker/);
  });
});

describe('tag-management › Nothing matches', () => {
  test('it says so and a button clears the filters', () => {
    const calls = show({ groups: [], total: 3 });
    assert.equal(screen.getByTestId('TagList-noMatch').textContent, 'Geen tags gevonden');
    fireEvent.click(screen.getByTestId('TagList-clear'));
    assert.equal(calls.cleared, 1);
  });
});

describe('TagList', () => {
  test('the rows come in the order of the groups', () => {
    show({ groups: byName(tag('Bakken'), tag('Soep')) });
    assert.deepEqual(rows(), ['Bakken', 'Soep']);
  });

  test('activating a row opens it', () => {
    const calls = show();
    fireEvent.click(screen.getAllByTestId('TagRow-row')[0]!);
    assert.deepEqual(calls.open, ['Soep']);
  });

  test('activating the open row closes it', () => {
    const calls = show({ openName: 'Soep' });
    fireEvent.click(screen.getAllByTestId('TagRow-row')[0]!);
    assert.deepEqual(calls.open, [null]);
  });

  test('only the open row has its form', () => {
    show({ openName: 'Snel' });
    assert.equal(screen.getAllByTestId('TagForm-form').length, 1);
  });

  test('in select mode a row toggles instead of opening', () => {
    const calls = show({ selecting: true });
    fireEvent.click(screen.getAllByTestId('TagRow-row')[0]!);
    assert.deepEqual(calls.toggled, ['Soep']);
    assert.deepEqual(calls.open, []);
  });

  test('in select mode no form is open', () => {
    show({ selecting: true, openName: 'Soep' });
    assert.equal(screen.queryByTestId('TagForm-form'), null);
  });

  test('selected rows are checked', () => {
    show({ selecting: true, selection: new Set(['Snel']) });
    assert.deepEqual(
      screen.getAllByTestId('TagRow-row').map((r) => r.getAttribute('aria-checked')),
      ['false', 'true'],
    );
  });
});
