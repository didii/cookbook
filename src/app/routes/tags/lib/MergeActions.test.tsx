import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { fireEvent, render, screen } from '~testing/dom';
import { MergeActions } from './MergeActions';
import { recipeCount } from './recipeCount';

const soepen: ManagedTag = { name: 'Soepen', category: null, uses: 3 };
const show = (props: Partial<Parameters<typeof MergeActions>[0]> = {}) => {
  const calls = { confirmed: [] as string[], cancelled: 0 };
  render(
    <MergeActions
      tag={soepen}
      others={['Soep', 'Winter']}
      value=""
      onValueChange={() => {}}
      onConfirm={(into) => calls.confirmed.push(into)}
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

  test('text that is no stored tag does not count', () => {
    show({ value: 'Sop' });
    assert.equal(confirm().disabled, true);
  });

  test('a stored tag enables it', () => {
    show({ value: 'Soep' });
    assert.equal(confirm().disabled, false);
  });

  test('the letter case of the text does not matter, and the stored spelling is reported', () => {
    const calls = show({ value: ' soep ' });
    fireEvent.click(confirm());
    assert.deepEqual(calls.confirmed, ['Soep']);
  });
});

describe('tag-management › Own tag is not offered', () => {
  test('typing the name of this tag does not choose it', () => {
    show({ value: 'Soepen' });
    assert.equal(confirm().disabled, true);
  });
});

describe('tag-management › Merge preview', () => {
  test('it says how many recipes get the chosen tag, and shows both tags', () => {
    show({ value: 'Soep' });
    const preview = screen.getByTestId('MergeActions-preview').textContent ?? '';
    assert.ok(preview.includes(recipeCount(3)));
    assert.equal(screen.getByTestId('MergeActions-from').textContent, 'Soepen');
    assert.equal(screen.getByTestId('MergeActions-into').textContent, 'Soep');
  });

  test('it says that recipes with both keep the chosen tag once', () => {
    show({ value: 'Soep' });
    assert.match(screen.getByTestId('MergeActions-preview').textContent ?? '', /één keer/);
  });

  test('it says that this tag disappears', () => {
    show({ value: 'Soep' });
    assert.match(screen.getByTestId('MergeActions-preview').textContent ?? '', /Soepen verdwijnt/);
  });

  test('without a choice the preview says to choose one', () => {
    show();
    assert.equal(screen.queryByTestId('MergeActions-into'), null);
  });
});

describe('MergeActions', () => {
  test('"Annuleer" reports the cancel and merges nothing', () => {
    const calls = show({ value: 'Soep' });
    fireEvent.click(screen.getByTestId('MergeActions-cancel'));
    assert.deepEqual([calls.cancelled, calls.confirmed], [1, []]);
  });

  test('a pending request disables "Samenvoegen"', () => {
    show({ value: 'Soep', pending: true });
    assert.equal(confirm().disabled, true);
  });
});
