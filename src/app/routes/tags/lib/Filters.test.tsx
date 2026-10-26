import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { fireEvent, render, screen } from '~testing/dom';
import type { TagFilters } from './arrangeTags';
import { Filters } from './Filters';

const none: TagFilters = { q: '', unused: false, withoutCategory: false, order: 'name' };
const show = (props: Partial<Parameters<typeof Filters>[0]> = {}) => {
  const changes: TagFilters[] = [];
  const selecting: boolean[] = [];
  render(
    <Filters
      filters={none}
      onChange={(f) => changes.push(f)}
      selecting={false}
      onSelectingChange={(on) => selecting.push(on)}
      shown={15}
      total={15}
      {...props}
    />,
  );
  return { changes, selecting };
};
const pressed = (id: string) => screen.getByTestId(id).getAttribute('aria-pressed');

describe('tag-management › Count line', () => {
  test('it gives the shown tags and the total', () => {
    show({ shown: 12, total: 15 });
    assert.equal(screen.getByTestId('Filters-count').textContent, '12 van 15 tags');
  });

  test('a single tag is singular', () => {
    show({ shown: 1, total: 1 });
    assert.equal(screen.getByTestId('Filters-count').textContent, '1 van 1 tag');
  });
});

describe('tag-management › Switch looks like the home page sort', () => {
  const labelCss = async () => cssFor(screen.getAllByTestId('Filters-orderLabel')[0]!.className);

  test('the options are joined buttons with a black border', async () => {
    show();
    assert.match(await labelCss(), /border-color: var\(--color-ink\)/);
  });

  test('the selected one has a red background', async () => {
    show();
    assert.match(await labelCss(), /background-color: var\(--color-red\)/);
  });

  test('the options are "Naam" and "Categorie", with "Naam" selected', () => {
    show();
    const labels = screen.getAllByTestId('Filters-orderLabel').map((l) => l.textContent);
    const checked = screen.getAllByTestId<HTMLInputElement>('Filters-order').map((i) => i.checked);
    assert.deepEqual(
      [labels, checked],
      [
        ['Naam', 'Categorie'],
        [true, false],
      ],
    );
  });
});

describe('Filters', () => {
  test('typing reports the text and keeps the other filters', () => {
    const { changes } = show({ filters: { ...none, unused: true } });
    fireEvent.change(screen.getByTestId('Filters-search'), { target: { value: 'soep' } });
    assert.deepEqual(changes, [{ ...none, unused: true, q: 'soep' }]);
  });

  test('the search box shows the text of the filters', () => {
    show({ filters: { ...none, q: 'kerst' } });
    assert.equal(screen.getByTestId<HTMLInputElement>('Filters-search').value, 'kerst');
  });

  test('the chips toggle their filter', () => {
    const { changes } = show();
    fireEvent.click(screen.getByTestId('Filters-unused'));
    fireEvent.click(screen.getByTestId('Filters-uncategorized'));
    assert.deepEqual(changes, [
      { ...none, unused: true },
      { ...none, withoutCategory: true },
    ]);
  });

  test('the chips show whether they are on', () => {
    show({ filters: { ...none, unused: true } });
    assert.deepEqual([pressed('Filters-unused'), pressed('Filters-uncategorized')], ['true', 'false']);
  });

  test('choosing "Categorie" changes the order', () => {
    const { changes } = show();
    fireEvent.click(screen.getAllByTestId('Filters-order')[1]!);
    assert.deepEqual(changes, [{ ...none, order: 'category' }]);
  });

  test('"Selecteer" toggles select mode and shows whether it is on', () => {
    const { selecting } = show({ selecting: true });
    assert.equal(pressed('Filters-select'), 'true');
    fireEvent.click(screen.getByTestId('Filters-select'));
    assert.deepEqual(selecting, [false]);
  });
});
