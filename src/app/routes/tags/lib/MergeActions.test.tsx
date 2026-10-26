import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { fireEvent, render, screen } from '~testing/dom';
import { MergeActions } from './MergeActions';
import { recipeCount } from './recipeCount';

const soepen: ManagedTag = { name: 'Soepen', category: null, uses: 3 };
const show = (props: Partial<Parameters<typeof MergeActions>[0]> = {}) => {
  const calls = { cancelled: 0 };
  render(
    <MergeActions
      tag={soepen}
      others={['Soep', 'Winter']}
      value=""
      onValueChange={() => {}}
      chosen={undefined}
      onCancel={() => calls.cancelled++}
      pending={false}
      {...props}
    />,
  );
  return calls;
};
const confirm = () => screen.getByTestId<HTMLButtonElement>('MergeActions-confirm');

describe('tag-management › Merge needs a chosen tag', () => {
  test('"Samenvoegen" is disabled while nothing is chosen', () => {
    show();
    assert.equal(confirm().disabled, true);
  });

  test('a chosen tag enables it', () => {
    show({ value: 'Soep', chosen: 'Soep' });
    assert.equal(confirm().disabled, false);
  });

  test('it is the submit button of the form around it', () => {
    show({ chosen: 'Soep' });
    assert.equal(confirm().type, 'submit');
  });
});

describe('tag-management › Merge preview', () => {
  test('it says how many recipes get the chosen tag, and shows both tags', () => {
    show({ value: 'Soep', chosen: 'Soep' });
    const preview = screen.getByTestId('MergeActions-preview').textContent ?? '';
    assert.ok(preview.includes(recipeCount(3)));
    assert.equal(screen.getByTestId('MergeActions-from').textContent, 'Soepen');
    assert.equal(screen.getByTestId('MergeActions-into').textContent, 'Soep');
  });

  test('it says that recipes with both keep the chosen tag once', () => {
    show({ chosen: 'Soep' });
    assert.match(screen.getByTestId('MergeActions-preview').textContent ?? '', /één keer/);
  });

  test('it says that this tag disappears', () => {
    show({ chosen: 'Soep' });
    assert.match(screen.getByTestId('MergeActions-preview').textContent ?? '', /Soepen verdwijnt/);
  });

  test('without a choice the preview says to choose one', () => {
    show();
    assert.equal(screen.queryByTestId('MergeActions-into'), null);
  });
});

describe('MergeActions', () => {
  test('"Annuleer" reports the cancel', () => {
    const calls = show({ chosen: 'Soep' });
    fireEvent.click(screen.getByTestId('MergeActions-cancel'));
    assert.equal(calls.cancelled, 1);
  });

  test('a pending request disables "Samenvoegen"', () => {
    show({ chosen: 'Soep', pending: true });
    assert.equal(confirm().disabled, true);
  });
});
